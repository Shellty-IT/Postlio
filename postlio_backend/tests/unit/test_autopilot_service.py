"""
Unit tests for AutopilotService.

Tests cover:
- Topic selection from categories
- Creativity/temperature mapping
- Post length mapping
- Voice DNA prompt building
- Health score calculation
- Next scheduled time calculation
- Queue management operations
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from freezegun import freeze_time

from app.services.autopilot_service import AutopilotService
from app.services.generation_service import GenerationService, CATEGORY_TOPICS, CATEGORY_MAPPING
from app.models.autopilot import AutopilotConfig, AutopilotQueueItem
from app.models.brand import Brand
from app.schemas.autopilot import QueueStatsResponse


class TestSelectTopic:
    """Tests for select_topic method."""

    @pytest.fixture
    def service(self, db_session):
        return GenerationService(db_session)

    @pytest.mark.unit
    def test_selects_topic_from_config_categories(self, service, autopilot_config):
        """Should select topic from configured categories."""
        autopilot_config.categories = ["fitness"]

        category, topic = service.select_topic(autopilot_config)

        assert category == "fitness"
        assert topic in CATEGORY_TOPICS.get("fitness", [])

    @pytest.mark.unit
    def test_maps_extended_category_to_base(self, service, autopilot_config):
        """Should map extended categories to base categories."""
        autopilot_config.categories = ["kitchen"]  # Maps to "cooking"

        category, topic = service.select_topic(autopilot_config)

        assert category == "kitchen"
        # Topic should come from "cooking" category
        assert topic in CATEGORY_TOPICS.get("cooking", [])

    @pytest.mark.unit
    def test_falls_back_to_lifestyle(self, service, autopilot_config):
        """Should fallback to lifestyle for unknown categories."""
        autopilot_config.categories = ["unknown_category"]

        category, topic = service.select_topic(autopilot_config)

        assert category == "unknown_category"
        assert topic in CATEGORY_TOPICS.get("lifestyle", [])

    @pytest.mark.unit
    def test_selects_random_category_from_list(self, service, autopilot_config):
        """Should randomly select from multiple categories."""
        autopilot_config.categories = ["fitness", "health", "cooking"]

        # Run multiple times to check randomness
        categories_selected = set()
        for _ in range(50):
            category, _ = service.select_topic(autopilot_config)
            categories_selected.add(category)

        # Should have selected at least 2 different categories
        assert len(categories_selected) >= 2

    @pytest.mark.unit
    def test_handles_empty_categories(self, service, autopilot_config):
        """Should handle empty categories list."""
        autopilot_config.categories = []

        category, topic = service.select_topic(autopilot_config)

        # Should default to lifestyle
        assert topic in CATEGORY_TOPICS.get("lifestyle", [])


class TestMapCreativityToTemperature:
    """Tests for map_creativity_to_temperature method."""

    @pytest.fixture
    def service(self, db_session):
        return GenerationService(db_session)

    @pytest.mark.unit
    @pytest.mark.parametrize("creativity,expected_temp", [
        (0, 0.1),  # Minimum creativity = minimum temperature
        (50, 0.8),  # Middle creativity = middle temperature
        (100, 1.5),  # Maximum creativity = maximum temperature
    ])
    def test_maps_creativity_levels(self, service, creativity, expected_temp):
        """Should correctly map creativity levels to temperature."""
        result = service.map_creativity_to_temperature(creativity)
        assert abs(result - expected_temp) < 0.01

    @pytest.mark.unit
    def test_temperature_range(self, service):
        """Temperature should always be between 0.1 and 1.5."""
        for creativity in range(0, 101, 10):
            temp = service.map_creativity_to_temperature(creativity)
            assert 0.1 <= temp <= 1.5


class TestMapPostLength:
    """Tests for map_post_length method."""

    @pytest.fixture
    def service(self, db_session):
        return GenerationService(db_session)

    @pytest.mark.unit
    @pytest.mark.parametrize("length,expected_max", [
        ("short", 150),
        ("medium", 300),
        ("long", 500),
    ])
    def test_maps_post_lengths(self, service, length, expected_max):
        """Should correctly map post length names to max characters."""
        result = service.map_post_length(length)
        assert result == expected_max

    @pytest.mark.unit
    def test_unknown_length_defaults_to_medium(self, service):
        """Unknown length should default to medium (300)."""
        result = service.map_post_length("extra_long")
        assert result == 300


class TestBuildVoicePrompt:
    """Tests for build_voice_prompt method."""

    @pytest.fixture
    def service(self, db_session):
        return GenerationService(db_session)

    @pytest.mark.unit
    def test_includes_brand_name(self, service, test_brand):
        """Should include brand name in prompt."""
        prompt = service.build_voice_prompt(test_brand)

        assert test_brand.name in prompt

    @pytest.mark.unit
    def test_includes_brand_description(self, service, test_brand):
        """Should include brand description if present."""
        test_brand.description = "A unique test brand"

        prompt = service.build_voice_prompt(test_brand)

        assert "A unique test brand" in prompt

    @pytest.mark.unit
    def test_includes_formality_description(self, service, test_brand):
        """Should describe formality based on voice_dna."""
        test_brand.voice_dna = {"formality": 80}

        prompt = service.build_voice_prompt(test_brand)

        assert "formalny" in prompt.lower() or "profesjonalny" in prompt.lower()

    @pytest.mark.unit
    def test_includes_energy_description(self, service, test_brand):
        """Should describe energy level based on voice_dna."""
        test_brand.voice_dna = {"energy": 80}

        prompt = service.build_voice_prompt(test_brand)

        assert "energiczny" in prompt.lower() or "entuzjastyczny" in prompt.lower()

    @pytest.mark.unit
    def test_includes_humor_description(self, service, test_brand):
        """Should mention humor if level is high."""
        test_brand.voice_dna = {"humor": 60}

        prompt = service.build_voice_prompt(test_brand)

        assert "humor" in prompt.lower()

    @pytest.mark.unit
    def test_includes_personality_traits(self, service, test_brand):
        """Should include personality traits."""
        test_brand.voice_dna = {"personality_traits": ["innovative", "friendly"]}

        prompt = service.build_voice_prompt(test_brand)

        assert "innovative" in prompt or "friendly" in prompt

    @pytest.mark.unit
    def test_includes_keywords(self, service, test_brand):
        """Should include keywords to use."""
        test_brand.voice_dna = {"keywords": ["tech", "innovation"]}

        prompt = service.build_voice_prompt(test_brand)

        assert "tech" in prompt or "innovation" in prompt

    @pytest.mark.unit
    def test_includes_forbidden_words(self, service, test_brand):
        """Should mention forbidden words."""
        test_brand.voice_dna = {"forbidden_words": ["cheap", "basic"]}

        prompt = service.build_voice_prompt(test_brand)

        assert "NIE używaj" in prompt or "cheap" in prompt

    @pytest.mark.unit
    def test_handles_empty_voice_dna(self, service, brand_without_voice_dna):
        """Should handle brand without voice DNA."""
        prompt = service.build_voice_prompt(brand_without_voice_dna)

        # Should at least include brand name
        assert brand_without_voice_dna.name in prompt

    @pytest.mark.unit
    def test_includes_sample_posts(self, service, test_brand):
        """Should include sample posts for inspiration."""
        test_brand.voice_dna = {"sample_posts": ["Check out our amazing product! 🚀"]}

        prompt = service.build_voice_prompt(test_brand)

        assert "Inspiruj się" in prompt or "Check out" in prompt


class TestCalculateHealthScore:
    """Tests for calculate_health_score method."""

    @pytest.fixture
    def service(self, db_session):
        """Create AutopilotService instance."""
        return AutopilotService(db_session)

    @pytest.fixture
    def base_stats(self):
        """Base stats for health score tests."""
        return QueueStatsResponse(
            pending_count=5,
            approved_count=0,  # Important: 0 to avoid +5 bonus affecting tests
            scheduled_count=2,
            published_today=1,
            published_this_week=3,
            rejection_rate=5.0,
            average_edit_count=0.5,
        )

    @pytest.mark.unit
    def test_perfect_score_for_ideal_metrics(self, service, autopilot_config, base_stats):
        """Should return high score for good metrics."""
        autopilot_config.streak_days = 30
        base_stats.rejection_rate = 0.0
        base_stats.average_edit_count = 0.0
        base_stats.published_this_week = 5  # Has publications
        base_stats.approved_count = 10  # Has approvals for bonus

        score = service.calculate_health_score(autopilot_config, base_stats)

        # 100 base + 10 streak + 5 approved = 115, capped at 100
        assert score == 100

    @pytest.mark.unit
    def test_penalty_for_high_rejection_rate(self, service, autopilot_config, base_stats):
        """Should penalize high rejection rate."""
        base_stats.rejection_rate = 60.0  # Very high -> -30
        base_stats.approved_count = 0  # No bonus
        base_stats.published_this_week = 1  # Has publications, no penalty

        score = service.calculate_health_score(autopilot_config, base_stats)

        # 100 - 30 (rejection) = 70
        assert score == 70

    @pytest.mark.unit
    def test_penalty_for_many_edits(self, service, autopilot_config, base_stats):
        """Should penalize high average edit count."""
        base_stats.average_edit_count = 4.0  # Many edits -> -20
        base_stats.approved_count = 0  # No bonus
        base_stats.published_this_week = 1  # Has publications

        score = service.calculate_health_score(autopilot_config, base_stats)

        # 100 - 20 (edits) = 80
        assert score == 80

    @pytest.mark.unit
    def test_bonus_for_long_streak(self, service, autopilot_config, base_stats):
        """Should give bonus for long streak."""
        # Use rejection rate to avoid hitting 100 cap
        base_stats.rejection_rate = 40.0  # -15 penalty
        base_stats.approved_count = 0
        base_stats.published_this_week = 1

        autopilot_config.streak_days = 30  # +10 bonus
        score_with_streak = service.calculate_health_score(autopilot_config, base_stats)

        autopilot_config.streak_days = 0  # No bonus
        score_without_streak = service.calculate_health_score(autopilot_config, base_stats)

        # With streak: 100 - 15 + 10 = 95
        # Without streak: 100 - 15 = 85
        assert score_with_streak > score_without_streak
        assert score_with_streak == 95
        assert score_without_streak == 85

    @pytest.mark.unit
    def test_penalty_for_no_publications(self, service, autopilot_config, base_stats):
        """Should penalize active config with no publications."""
        autopilot_config.is_active = True
        base_stats.published_this_week = 0  # -15 penalty
        base_stats.approved_count = 0  # No bonus

        score = service.calculate_health_score(autopilot_config, base_stats)

        # 100 - 15 = 85
        assert score == 85

    @pytest.mark.unit
    def test_score_bounds(self, service, autopilot_config, base_stats):
        """Score should always be between 0 and 100."""
        # Worst case scenario
        base_stats.rejection_rate = 100.0  # -30
        base_stats.average_edit_count = 10.0  # -20
        base_stats.published_this_week = 0  # -15
        base_stats.approved_count = 0
        autopilot_config.streak_days = 0
        autopilot_config.is_active = True

        score = service.calculate_health_score(autopilot_config, base_stats)

        # 100 - 30 - 20 - 15 = 35
        assert 0 <= score <= 100
        assert score == 35

    @pytest.mark.unit
    def test_approved_count_bonus(self, service, autopilot_config, base_stats):
        """Should give bonus for having approved items."""
        # Add penalty to avoid hitting 100 cap
        base_stats.rejection_rate = 20.0  # -5 penalty
        base_stats.published_this_week = 1
        autopilot_config.streak_days = 0

        base_stats.approved_count = 0
        score_without_approved = service.calculate_health_score(autopilot_config, base_stats)

        base_stats.approved_count = 5
        score_with_approved = service.calculate_health_score(autopilot_config, base_stats)

        # Without approved: 100 - 5 = 95
        # With approved: 100 - 5 + 5 = 100
        assert score_without_approved == 95
        assert score_with_approved == 100
        assert score_with_approved == score_without_approved + 5

    @pytest.mark.unit
    def test_score_capped_at_100(self, service, autopilot_config, base_stats):
        """Score should never exceed 100 even with all bonuses."""
        autopilot_config.streak_days = 30  # +10
        base_stats.approved_count = 10  # +5
        base_stats.rejection_rate = 0
        base_stats.average_edit_count = 0
        base_stats.published_this_week = 5

        score = service.calculate_health_score(autopilot_config, base_stats)

        # 100 + 10 + 5 = 115, but capped at 100
        assert score == 100


class TestGetNextScheduledTime:
    """Tests for get_next_scheduled_time method."""

    @pytest.fixture
    def service(self, db_session):
        return AutopilotService(db_session)

    @pytest.mark.unit
    def test_returns_none_if_inactive(self, service, autopilot_config):
        """Should return None if autopilot is inactive."""
        autopilot_config.is_active = False

        result = service.get_next_scheduled_time(autopilot_config)

        assert result is None

    @pytest.mark.unit
    def test_returns_none_if_paused(self, service, autopilot_config):
        """Should return None if autopilot is paused."""
        autopilot_config.is_active = True
        autopilot_config.is_paused = True

        result = service.get_next_scheduled_time(autopilot_config)

        assert result is None

    @pytest.mark.unit
    @freeze_time("2024-01-15 08:00:00")  # Monday
    def test_returns_correct_next_time(self, service, autopilot_config):
        """Should return next scheduled time based on config."""
        autopilot_config.is_active = True
        autopilot_config.is_paused = False
        autopilot_config.schedule_days = ["monday", "wednesday", "friday"]
        autopilot_config.schedule_time = "10:00"

        result = service.get_next_scheduled_time(autopilot_config)

        assert result is not None
        assert result.hour == 10
        assert result.minute == 0
        # Should be today (Monday) at 10:00 since we're at 08:00
        assert result.weekday() == 0  # Monday

    @pytest.mark.unit
    @freeze_time("2024-01-15 12:00:00")  # Monday noon
    def test_skips_past_time_same_day(self, service, autopilot_config):
        """Should skip to next day if today's time has passed."""
        autopilot_config.is_active = True
        autopilot_config.is_paused = False
        autopilot_config.schedule_days = ["monday", "wednesday", "friday"]
        autopilot_config.schedule_time = "10:00"  # Already passed

        result = service.get_next_scheduled_time(autopilot_config)

        assert result is not None
        # Should be Wednesday since Monday 10:00 has passed
        assert result.weekday() == 2  # Wednesday

    @pytest.mark.unit
    def test_handles_invalid_schedule_time(self, service, autopilot_config):
        """Should handle invalid schedule time format."""
        autopilot_config.is_active = True
        autopilot_config.is_paused = False
        autopilot_config.schedule_time = "invalid"

        result = service.get_next_scheduled_time(autopilot_config)

        # Should default to 10:00
        if result:
            assert result.hour == 10
            assert result.minute == 0


class TestQueueItemOperations:
    """Tests for queue item CRUD operations."""

    @pytest.fixture
    def service(self, db_session):
        return AutopilotService(db_session)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_queue_item_returns_correct_item(
            self, service, queue_item_pending, test_user
    ):
        """Should return queue item for correct user."""
        result = await service.get_queue_item(queue_item_pending.id, test_user.id)

        assert result is not None
        assert result.id == queue_item_pending.id

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_queue_item_returns_none_for_wrong_user(
            self, service, queue_item_pending, another_user
    ):
        """Should return None for wrong user."""
        result = await service.get_queue_item(queue_item_pending.id, another_user.id)

        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_approve_item_changes_status(
            self, service, queue_item_pending, test_user
    ):
        """Should change status to approved."""
        result = await service.approve_item(queue_item_pending.id, test_user.id)

        assert result is not None
        assert result.status == "approved"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_reject_item_changes_status(
            self, service, queue_item_pending, test_user
    ):
        """Should change status to rejected."""
        result = await service.reject_item(
            queue_item_pending.id,
            test_user.id,
            notes="Not suitable"
        )

        assert result is not None
        assert result.status == "rejected"
        assert result.user_notes == "Not suitable"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_queue_item(
            self, service, queue_item_pending, test_user
    ):
        """Should delete queue item."""
        result = await service.delete_queue_item(queue_item_pending.id, test_user.id)

        assert result is True

        # Verify deletion
        item = await service.get_queue_item(queue_item_pending.id, test_user.id)
        assert item is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_bulk_approve(self, service, db_session, test_user, autopilot_config, test_brand):
        """Should approve multiple items."""
        # Create multiple items
        items = []
        for i in range(3):
            item = AutopilotQueueItem(
                config_id=autopilot_config.id,
                user_id=test_user.id,
                brand_id=test_brand.id,
                platform="facebook",
                content=f"Test content {i}",
                status="pending",
                scheduled_for=datetime.utcnow() + timedelta(hours=i),
            )
            db_session.add(item)
            items.append(item)
        await db_session.flush()

        item_ids = [item.id for item in items]
        success, fail = await service.bulk_action(item_ids, test_user.id, "approve")

        assert success == 3
        assert fail == 0


class TestCategoryMapping:
    """Tests for category mapping constants."""

    @pytest.mark.unit
    def test_all_extended_categories_have_mapping(self):
        """All extended categories should map to a base category."""
        for extended, base in CATEGORY_MAPPING.items():
            assert base in CATEGORY_TOPICS, \
                f"Extended category '{extended}' maps to unknown base '{base}'"

    @pytest.mark.unit
    def test_base_categories_have_topics(self):
        """All base categories should have topics defined."""
        for category, topics in CATEGORY_TOPICS.items():
            assert len(topics) > 0, f"Category '{category}' has no topics"
            assert all(isinstance(t, str) for t in topics)

    @pytest.mark.unit
    @pytest.mark.parametrize("category", [
        "fitness", "health", "beauty", "cooking", "business",
        "technology", "travel", "lifestyle", "education",
        "entertainment", "nature", "diet"
    ])
    def test_core_categories_exist(self, category):
        """Core categories should exist in CATEGORY_TOPICS."""
        assert category in CATEGORY_TOPICS