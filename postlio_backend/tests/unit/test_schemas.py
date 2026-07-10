"""
Unit tests for Pydantic schema validators.

Tests cover:
- BrandResponse.model_validate with None/missing ORM fields
- AutopilotConfigResponse.model_validate with None JSONB fields
- QueueItemResponse.model_validate with None JSONB fields
"""
import pytest
from datetime import datetime
from unittest.mock import MagicMock

from app.schemas.brand import BrandResponse
from app.schemas.autopilot import AutopilotConfigResponse, QueueItemResponse


def _brand_orm(overrides=None):
    """Create a mock ORM Brand object with sensible defaults."""
    obj = MagicMock()
    obj.id = 1
    obj.name = "Test Brand"
    obj.description = "A brand"
    obj.logo_url = None
    obj.primary_color = "#8B5CF6"
    obj.secondary_color = None
    obj.industry = "technology"
    obj.target_audience = "developers"
    obj.voice_dna = {"formality": 50, "energy": 60, "personality_traits": ["professional"]}
    obj.is_active = True
    obj.is_default = False
    obj.posts_count = 5
    obj.created_at = datetime.utcnow()
    obj.updated_at = datetime.utcnow()
    if overrides:
        for k, v in overrides.items():
            setattr(obj, k, v)
    return obj


def _config_orm(overrides=None):
    """Create a mock ORM AutopilotConfig object with sensible defaults."""
    obj = MagicMock()
    obj.id = 1
    obj.user_id = 1
    obj.brand_id = 1
    obj.posts_per_week = 3
    obj.schedule_days = ["monday", "wednesday", "friday"]
    obj.schedule_time = "10:00"
    obj.timezone = "Europe/Warsaw"
    obj.platforms = ["facebook"]
    obj.categories = ["technology"]
    obj.creativity_level = 50
    obj.post_length = "medium"
    obj.include_images = True
    obj.include_hashtags = True
    obj.include_emoji = True
    obj.text_provider = "gemini"
    obj.image_provider = "pollinations"
    obj.image_style = "realistic"
    obj.is_active = True
    obj.is_paused = False
    obj.social_account_mapping = {"facebook": 42}
    obj.auto_publish_on_approve = False
    obj.total_generated = 10
    obj.total_approved = 8
    obj.total_rejected = 1
    obj.total_published = 7
    obj.streak_days = 5
    obj.last_generation_at = None
    obj.last_published_at = None
    obj.created_at = datetime.utcnow()
    obj.updated_at = datetime.utcnow()
    obj.health_score = None
    obj.next_generation_at = None
    if overrides:
        for k, v in overrides.items():
            setattr(obj, k, v)
    return obj


def _queue_item_orm(overrides=None):
    """Create a mock ORM AutopilotQueueItem object with sensible defaults."""
    obj = MagicMock()
    obj.id = 1
    obj.config_id = 1
    obj.user_id = 1
    obj.brand_id = 1
    obj.platform = "facebook"
    obj.content = "Test post content"
    obj.image_url = None
    obj.hashtags = ["test"]
    obj.category = "technology"
    obj.status = "pending"
    obj.scheduled_for = datetime.utcnow()
    obj.published_at = None
    obj.topic_used = "test topic"
    obj.text_provider_used = "gemini"
    obj.image_provider_used = None
    obj.generation_params = {"creativity_level": 50}
    obj.social_account_id = None
    obj.platform_post_id = None
    obj.platform_post_url = None
    obj.publish_error = None
    obj.publish_attempts = 0
    obj.user_notes = None
    obj.edit_count = 0
    obj.created_at = datetime.utcnow()
    obj.updated_at = datetime.utcnow()
    if overrides:
        for k, v in overrides.items():
            setattr(obj, k, v)
    return obj


# ==================== BrandResponse ====================

class TestBrandResponseModelValidate:

    @pytest.mark.unit
    def test_validates_from_orm(self):
        brand = BrandResponse.model_validate(_brand_orm())
        assert brand.id == 1
        assert brand.name == "Test Brand"

    @pytest.mark.unit
    def test_none_voice_dna_coerced_to_defaults(self):
        brand = BrandResponse.model_validate(_brand_orm({"voice_dna": None}))
        assert brand.voice_dna is not None

    @pytest.mark.unit
    def test_empty_dict_voice_dna_coerced_to_defaults(self):
        brand = BrandResponse.model_validate(_brand_orm({"voice_dna": {}}))
        assert brand.voice_dna is not None

    @pytest.mark.unit
    def test_none_posts_count_coerced_to_zero(self):
        brand = BrandResponse.model_validate(_brand_orm({"posts_count": None}))
        assert brand.posts_count == 0

    @pytest.mark.unit
    def test_none_primary_color_coerced_to_default(self):
        brand = BrandResponse.model_validate(_brand_orm({"primary_color": None}))
        assert brand.primary_color == "#8B5CF6"

    @pytest.mark.unit
    def test_normal_primary_color_preserved(self):
        brand = BrandResponse.model_validate(_brand_orm({"primary_color": "#FF0000"}))
        assert brand.primary_color == "#FF0000"


# ==================== AutopilotConfigResponse ====================

class TestAutopilotConfigResponseModelValidate:

    @pytest.mark.unit
    def test_validates_from_orm(self):
        config = AutopilotConfigResponse.model_validate(_config_orm())
        assert config.id == 1
        assert config.is_active is True

    @pytest.mark.unit
    def test_none_schedule_days_coerced_to_empty_list(self):
        config = AutopilotConfigResponse.model_validate(_config_orm({"schedule_days": None}))
        assert config.schedule_days == []

    @pytest.mark.unit
    def test_none_platforms_coerced_to_empty_list(self):
        config = AutopilotConfigResponse.model_validate(_config_orm({"platforms": None}))
        assert config.platforms == []

    @pytest.mark.unit
    def test_none_categories_coerced_to_empty_list(self):
        config = AutopilotConfigResponse.model_validate(_config_orm({"categories": None}))
        assert config.categories == []

    @pytest.mark.unit
    def test_none_social_account_mapping_coerced_to_empty_dict(self):
        config = AutopilotConfigResponse.model_validate(
            _config_orm({"social_account_mapping": None})
        )
        assert config.social_account_mapping == {}

    @pytest.mark.unit
    def test_none_auto_publish_coerced_to_false(self):
        config = AutopilotConfigResponse.model_validate(
            _config_orm({"auto_publish_on_approve": None})
        )
        assert config.auto_publish_on_approve is False

    @pytest.mark.unit
    def test_computed_fields_can_be_set_after_validate(self):
        config = AutopilotConfigResponse.model_validate(_config_orm())
        config.health_score = 85
        config.next_generation_at = datetime.utcnow()
        assert config.health_score == 85
        assert config.next_generation_at is not None


# ==================== QueueItemResponse ====================

class TestQueueItemResponseModelValidate:

    @pytest.mark.unit
    def test_validates_from_orm(self):
        item = QueueItemResponse.model_validate(_queue_item_orm())
        assert item.id == 1
        assert item.status == "pending"

    @pytest.mark.unit
    def test_none_hashtags_coerced_to_empty_list(self):
        item = QueueItemResponse.model_validate(_queue_item_orm({"hashtags": None}))
        assert item.hashtags == []

    @pytest.mark.unit
    def test_none_generation_params_coerced_to_empty_dict(self):
        item = QueueItemResponse.model_validate(_queue_item_orm({"generation_params": None}))
        assert item.generation_params == {}

    @pytest.mark.unit
    def test_none_publish_attempts_coerced_to_zero(self):
        item = QueueItemResponse.model_validate(_queue_item_orm({"publish_attempts": None}))
        assert item.publish_attempts == 0

    @pytest.mark.unit
    def test_non_zero_publish_attempts_preserved(self):
        item = QueueItemResponse.model_validate(_queue_item_orm({"publish_attempts": 2}))
        assert item.publish_attempts == 2

    @pytest.mark.unit
    def test_optional_fields_accept_none(self):
        item = QueueItemResponse.model_validate(_queue_item_orm({
            "image_url": None,
            "published_at": None,
            "social_account_id": None,
            "platform_post_id": None,
            "publish_error": None,
            "user_notes": None,
        }))
        assert item.image_url is None
        assert item.published_at is None
        assert item.publish_error is None
