"""
Unit tests for merging Post and AutopilotQueueItem into one Calendar view.

Tests cover:
- PostRepository.get_calendar_autopilot_items: status/date-range/user filtering
- _build_platform_auto_publish_map: derives per-platform auto-publish capability
  from connected accounts (single source of truth from Etap 1)
- _requires_manual_publish: a post/queue-item needs manual publishing if ANY
  of its platforms lacks an auto-capable connected account
- CalendarEventResponse.status stays within the statuses the Calendar UI
  understands, even for Autopilot items that use their own status vocabulary
"""
from datetime import datetime, timedelta

import pytest

from app.api.v1.posts import (
    _autopilot_item_to_event,
    _build_platform_auto_publish_map,
    _requires_manual_publish,
)
from app.models.autopilot import AutopilotQueueItem
from app.models.post import PostStatus
from app.repositories.post_repo import PostRepository


class TestGetCalendarAutopilotItems:
    @pytest.fixture
    def repo(self):
        return PostRepository()

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_includes_approved_item_in_range(self, repo, db_session, queue_item_approved, test_user):
        start = datetime.utcnow() - timedelta(days=1)
        end = datetime.utcnow() + timedelta(days=1)

        items = await repo.get_calendar_autopilot_items(db_session, test_user.id, start, end)

        assert any(i.id == queue_item_approved.id for i in items)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_excludes_pending_item(self, repo, db_session, queue_item_pending, test_user):
        """pending = jeszcze nie zatwierdzony - nie powinien pojawic sie w Kalendarzu."""
        start = datetime.utcnow() - timedelta(days=1)
        end = datetime.utcnow() + timedelta(days=3)

        items = await repo.get_calendar_autopilot_items(db_session, test_user.id, start, end)

        assert not any(i.id == queue_item_pending.id for i in items)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_excludes_item_outside_date_range(self, repo, db_session, queue_item_approved, test_user):
        start = datetime.utcnow() + timedelta(days=10)
        end = datetime.utcnow() + timedelta(days=20)

        items = await repo.get_calendar_autopilot_items(db_session, test_user.id, start, end)

        assert not any(i.id == queue_item_approved.id for i in items)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_excludes_other_users_items(self, repo, db_session, queue_item_approved, another_user):
        start = datetime.utcnow() - timedelta(days=1)
        end = datetime.utcnow() + timedelta(days=1)

        items = await repo.get_calendar_autopilot_items(db_session, another_user.id, start, end)

        assert not any(i.id == queue_item_approved.id for i in items)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_includes_scheduled_status(self, repo, db_session, test_user, test_brand, autopilot_config):
        item = AutopilotQueueItem(
            config_id=autopilot_config.id,
            user_id=test_user.id,
            brand_id=test_brand.id,
            platform="facebook",
            content="Scheduled item",
            status="scheduled",
            scheduled_for=datetime.utcnow() + timedelta(hours=3),
        )
        db_session.add(item)
        await db_session.commit()

        start = datetime.utcnow() - timedelta(days=1)
        end = datetime.utcnow() + timedelta(days=1)
        items = await repo.get_calendar_autopilot_items(db_session, test_user.id, start, end)

        assert any(i.id == item.id for i in items)


class TestBuildPlatformAutoPublishMap:
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_facebook_page_account_is_auto_capable(self, db_session, facebook_page_account, test_user):
        capability_map = await _build_platform_auto_publish_map(db_session, test_user.id)
        assert capability_map["facebook"] is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_instagram_personal_account_is_not_auto_capable(self, db_session, instagram_personal_account, test_user):
        capability_map = await _build_platform_auto_publish_map(db_session, test_user.id)
        assert capability_map["instagram"] is False

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_platform_with_no_connected_account_is_absent(self, db_session, facebook_page_account, test_user):
        capability_map = await _build_platform_auto_publish_map(db_session, test_user.id)
        assert "linkedin" not in capability_map

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_business_account_wins_over_personal_on_same_platform(
        self, db_session, test_user, facebook_page_account, another_user
    ):
        """Jesli uzytkownik ma i konto biznesowe, i osobiste na tej samej
        platformie, obecnosc konta biznesowego wystarczy do auto-publikacji."""
        from app.models.social_account import SocialAccount

        personal = SocialAccount(
            user_id=test_user.id,
            platform="facebook",
            account_type="facebook_personal",
            platform_user_id="personal_123",
            access_token="token",
            is_active=True,
        )
        db_session.add(personal)
        await db_session.commit()

        capability_map = await _build_platform_auto_publish_map(db_session, test_user.id)
        assert capability_map["facebook"] is True


class TestRequiresManualPublish:
    @pytest.mark.unit
    def test_false_when_all_platforms_are_auto_capable(self):
        result = _requires_manual_publish(["facebook", "instagram"], {"facebook": True, "instagram": True})
        assert result is False

    @pytest.mark.unit
    def test_true_when_any_platform_is_not_auto_capable(self):
        result = _requires_manual_publish(["facebook", "linkedin"], {"facebook": True, "linkedin": False})
        assert result is True

    @pytest.mark.unit
    def test_true_when_platform_has_no_connected_account_at_all(self):
        result = _requires_manual_publish(["linkedin"], {"facebook": True})
        assert result is True

    @pytest.mark.unit
    def test_false_for_empty_platform_list(self):
        """Brak platform (edge case) nie powinien wymuszac recznej publikacji -
        `all([])` jest True w Pythonie, wiec to zachowanie jest zamierzone."""
        result = _requires_manual_publish([], {})
        assert result is False


class TestAutopilotItemToEvent:
    """Kalendarz rozumie tylko statusy postow (PostStatus). Kolejka Autopilota
    ma wlasny slownik ("approved"/"scheduled"), wiec musi byc zmapowany -
    inaczej frontend wpada w fallback i pokazuje zatwierdzony, zaplanowany
    post uzytkownikowi jako "Szkic"."""

    def _item(self, status: str) -> AutopilotQueueItem:
        return AutopilotQueueItem(
            id=7,
            config_id=1,
            user_id=1,
            brand_id=2,
            platform="facebook",
            content="Tresc posta z Autopilota",
            image_url=None,
            status=status,
            scheduled_for=datetime(2026, 7, 15, 14, 30),
        )

    @pytest.mark.unit
    @pytest.mark.parametrize("queue_status", ["approved", "scheduled"])
    def test_status_is_always_within_post_status_vocabulary(self, queue_status):
        event = _autopilot_item_to_event(self._item(queue_status), {"facebook": True})

        assert event.status in {s.value for s in PostStatus}, (
            f"status {event.status!r} nie nalezy do PostStatus - "
            f"frontend pokazalby taki post jako 'Szkic'"
        )
        assert event.status == PostStatus.SCHEDULED.value

    @pytest.mark.unit
    def test_id_is_namespaced_but_post_id_stays_raw(self):
        """id musi byc unikalne wzgledem postow (kolizja kluczy w React),
        ale post_id musi zostac surowym id elementu kolejki - to po nim
        Kalendarz aktualizuje termin przez endpoint Autopilota."""
        event = _autopilot_item_to_event(self._item("approved"), {})

        assert event.id == "autopilot-7"
        assert event.post_id == "7"

    @pytest.mark.unit
    def test_marks_origin_and_manual_publish_flag(self):
        event = _autopilot_item_to_event(self._item("approved"), {"facebook": False})

        assert event.origin == "autopilot"
        assert event.requires_manual_publish is True

    @pytest.mark.unit
    def test_uses_scheduled_for_as_calendar_date_and_time(self):
        event = _autopilot_item_to_event(self._item("approved"), {"facebook": True})

        assert event.date == "2026-07-15"
        assert event.time == "14:30"
