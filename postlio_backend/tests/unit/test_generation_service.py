"""
Unit tests for GenerationService.

Tests cover:
- Topic selection logic and category mapping
- Creativity level → temperature conversion
- Post length → character count conversion
- Voice DNA prompt building
- Next scheduled time calculation
- CATEGORY_TOPICS and CATEGORY_MAPPING constants
"""
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from freezegun import freeze_time

from app.services.generation_service import (
    GenerationService,
    CATEGORY_TOPICS,
    CATEGORY_MAPPING,
)
from app.models.autopilot import AutopilotConfig, AutopilotQueueItem
from app.models.brand import Brand


class TestSelectTopic:
    """Tests for GenerationService.select_topic."""

    @pytest.fixture
    def service(self, db_session):
        return GenerationService(db_session)

    @pytest.mark.unit
    def test_selects_topic_from_config_category(self, service, autopilot_config):
        autopilot_config.categories = ["fitness"]
        category, topic = service.select_topic(autopilot_config)
        assert category == "fitness"
        assert topic in CATEGORY_TOPICS["fitness"]

    @pytest.mark.unit
    def test_maps_extended_category_to_base(self, service, autopilot_config):
        autopilot_config.categories = ["kitchen"]
        category, topic = service.select_topic(autopilot_config)
        assert category == "kitchen"
        assert topic in CATEGORY_TOPICS["cooking"]

    @pytest.mark.unit
    def test_falls_back_to_lifestyle_for_unknown_category(self, service, autopilot_config):
        autopilot_config.categories = ["unknown_xyz"]
        category, topic = service.select_topic(autopilot_config)
        assert category == "unknown_xyz"
        assert topic in CATEGORY_TOPICS["lifestyle"]

    @pytest.mark.unit
    def test_handles_empty_categories(self, service, autopilot_config):
        autopilot_config.categories = []
        _, topic = service.select_topic(autopilot_config)
        assert topic in CATEGORY_TOPICS["lifestyle"]

    @pytest.mark.unit
    def test_selects_randomly_from_multiple_categories(self, service, autopilot_config):
        autopilot_config.categories = ["fitness", "health", "cooking"]
        seen = set()
        for _ in range(50):
            category, _ = service.select_topic(autopilot_config)
            seen.add(category)
        assert len(seen) >= 2


class TestMapCreativityToTemperature:
    """Tests for GenerationService.map_creativity_to_temperature."""

    @pytest.fixture
    def service(self, db_session):
        return GenerationService(db_session)

    @pytest.mark.unit
    @pytest.mark.parametrize("creativity,expected", [
        (0, 0.1),
        (50, 0.8),
        (100, 1.5),
    ])
    def test_maps_known_levels(self, service, creativity, expected):
        result = service.map_creativity_to_temperature(creativity)
        assert abs(result - expected) < 0.01

    @pytest.mark.unit
    def test_result_always_in_range(self, service):
        for c in range(0, 101, 10):
            t = service.map_creativity_to_temperature(c)
            assert 0.1 <= t <= 1.5


class TestMapPostLength:
    """Tests for GenerationService.map_post_length."""

    @pytest.fixture
    def service(self, db_session):
        return GenerationService(db_session)

    @pytest.mark.unit
    @pytest.mark.parametrize("length,expected", [
        ("short", 150),
        ("medium", 300),
        ("long", 500),
    ])
    def test_maps_named_lengths(self, service, length, expected):
        assert service.map_post_length(length) == expected

    @pytest.mark.unit
    def test_unknown_length_defaults_to_medium(self, service):
        assert service.map_post_length("extra_long") == 300


class TestBuildVoicePrompt:
    """Tests for GenerationService.build_voice_prompt."""

    @pytest.fixture
    def service(self, db_session):
        return GenerationService(db_session)

    @pytest.mark.unit
    def test_includes_brand_name(self, service, test_brand):
        assert test_brand.name in service.build_voice_prompt(test_brand)

    @pytest.mark.unit
    def test_includes_brand_description(self, service, test_brand):
        test_brand.description = "A unique test brand"
        assert "A unique test brand" in service.build_voice_prompt(test_brand)

    @pytest.mark.unit
    def test_high_formality_adds_tone(self, service, test_brand):
        test_brand.voice_dna = {"formality": 80}
        prompt = service.build_voice_prompt(test_brand).lower()
        assert "formalny" in prompt or "profesjonalny" in prompt

    @pytest.mark.unit
    def test_high_energy_adds_tone(self, service, test_brand):
        test_brand.voice_dna = {"energy": 80}
        prompt = service.build_voice_prompt(test_brand).lower()
        assert "energiczny" in prompt or "entuzjastyczny" in prompt

    @pytest.mark.unit
    def test_humor_above_50_adds_tone(self, service, test_brand):
        test_brand.voice_dna = {"humor": 60}
        assert "humor" in service.build_voice_prompt(test_brand).lower()

    @pytest.mark.unit
    def test_includes_personality_traits(self, service, test_brand):
        test_brand.voice_dna = {"personality_traits": ["innovative", "friendly"]}
        prompt = service.build_voice_prompt(test_brand)
        assert "innovative" in prompt or "friendly" in prompt

    @pytest.mark.unit
    def test_includes_keywords(self, service, test_brand):
        test_brand.voice_dna = {"keywords": ["tech", "innovation"]}
        prompt = service.build_voice_prompt(test_brand)
        assert "tech" in prompt or "innovation" in prompt

    @pytest.mark.unit
    def test_includes_forbidden_words(self, service, test_brand):
        test_brand.voice_dna = {"forbidden_words": ["cheap", "basic"]}
        prompt = service.build_voice_prompt(test_brand)
        assert "NIE używaj" in prompt

    @pytest.mark.unit
    def test_handles_empty_voice_dna(self, service, brand_without_voice_dna):
        prompt = service.build_voice_prompt(brand_without_voice_dna)
        assert brand_without_voice_dna.name in prompt

    @pytest.mark.unit
    def test_includes_sample_posts(self, service, test_brand):
        test_brand.voice_dna = {"sample_posts": ["Check out our amazing product!"]}
        prompt = service.build_voice_prompt(test_brand)
        assert "Inspiruj się" in prompt or "Check out" in prompt


class TestGetNextScheduledTime:
    """Tests for GenerationService.get_next_scheduled_time."""

    @pytest.fixture
    def service(self, db_session):
        return GenerationService(db_session)

    @pytest.mark.unit
    def test_returns_none_when_inactive(self, service, autopilot_config):
        autopilot_config.is_active = False
        assert service.get_next_scheduled_time(autopilot_config) is None

    @pytest.mark.unit
    def test_returns_none_when_paused(self, service, autopilot_config):
        autopilot_config.is_active = True
        autopilot_config.is_paused = True
        assert service.get_next_scheduled_time(autopilot_config) is None

    @pytest.mark.unit
    @freeze_time("2024-01-15 08:00:00")
    def test_returns_same_day_if_time_not_yet_passed(self, service, autopilot_config):
        autopilot_config.is_active = True
        autopilot_config.is_paused = False
        autopilot_config.schedule_days = ["monday", "wednesday", "friday"]
        autopilot_config.schedule_time = "10:00"

        result = service.get_next_scheduled_time(autopilot_config)

        assert result is not None
        assert result.hour == 10
        assert result.weekday() == 0  # Monday

    @pytest.mark.unit
    @freeze_time("2024-01-15 12:00:00")
    def test_skips_to_next_day_if_time_passed(self, service, autopilot_config):
        autopilot_config.is_active = True
        autopilot_config.is_paused = False
        autopilot_config.schedule_days = ["monday", "wednesday", "friday"]
        autopilot_config.schedule_time = "10:00"

        result = service.get_next_scheduled_time(autopilot_config)

        assert result is not None
        assert result.weekday() == 2  # Wednesday

    @pytest.mark.unit
    def test_handles_invalid_schedule_time(self, service, autopilot_config):
        autopilot_config.is_active = True
        autopilot_config.is_paused = False
        autopilot_config.schedule_time = "invalid"

        result = service.get_next_scheduled_time(autopilot_config)
        if result:
            assert result.hour == 10
            assert result.minute == 0


class TestCategoryConstants:
    """Tests for CATEGORY_TOPICS and CATEGORY_MAPPING constants."""

    @pytest.mark.unit
    def test_all_extended_categories_map_to_existing_base(self):
        for extended, base in CATEGORY_MAPPING.items():
            assert base in CATEGORY_TOPICS, \
                f"'{extended}' maps to unknown base '{base}'"

    @pytest.mark.unit
    def test_all_base_categories_have_topics(self):
        for category, topics in CATEGORY_TOPICS.items():
            assert len(topics) > 0
            assert all(isinstance(t, str) for t in topics)

    @pytest.mark.unit
    @pytest.mark.parametrize("category", [
        "fitness", "health", "beauty", "cooking", "business",
        "technology", "travel", "lifestyle", "education",
        "entertainment", "nature", "diet",
    ])
    def test_core_categories_present(self, category):
        assert category in CATEGORY_TOPICS
