"""
Unit tests for social.py OAuth/publish helper functions.

Tests cover:
- _resolve_account_type prefers the service-computed OAuthResult.account_type
  over the broken _determine_account_type heuristic
- _build_linkedin_publish_kwargs builds an organization URN for company
  accounts and a person URN for personal accounts
"""
import pytest

from app.api.v1.social import _resolve_account_type, _build_linkedin_publish_kwargs
from app.models.social_account import SocialAccount
from app.schemas.social import AccountType
from app.services.social import SocialPlatform, OAuthResult


def _oauth_result(**overrides) -> OAuthResult:
    defaults = dict(
        success=True,
        platform=SocialPlatform.FACEBOOK,
        account_type=None,
        profile_data=None,
    )
    defaults.update(overrides)
    return OAuthResult(**defaults)


class TestResolveAccountType:
    @pytest.mark.unit
    def test_uses_service_reported_facebook_personal(self):
        """Regression: previously _determine_account_type always returned
        FACEBOOK_PAGE regardless of whether the user actually has a Page."""
        result = _oauth_result(platform=SocialPlatform.FACEBOOK, account_type="facebook_personal")

        assert _resolve_account_type(SocialPlatform.FACEBOOK, result) == AccountType.FACEBOOK_PERSONAL

    @pytest.mark.unit
    def test_uses_service_reported_facebook_page(self):
        result = _oauth_result(platform=SocialPlatform.FACEBOOK, account_type="facebook_page")

        assert _resolve_account_type(SocialPlatform.FACEBOOK, result) == AccountType.FACEBOOK_PAGE

    @pytest.mark.unit
    def test_uses_service_reported_instagram_personal(self):
        """Regression: previously any Instagram profile_data without a
        matching 'CREATOR' string fell through to INSTAGRAM_BUSINESS."""
        result = _oauth_result(platform=SocialPlatform.INSTAGRAM, account_type="instagram_personal")

        assert _resolve_account_type(SocialPlatform.INSTAGRAM, result) == AccountType.INSTAGRAM_PERSONAL

    @pytest.mark.unit
    def test_uses_service_reported_linkedin_company(self):
        """Regression: previously _determine_account_type looked for a flat
        profile_data['organization_id'] key that never existed (the real
        data is nested under profile_data['organizations'][0])."""
        result = _oauth_result(
            platform=SocialPlatform.LINKEDIN,
            account_type="linkedin_company",
            profile_data={"organizations": [{"organization_id": "12345"}]},
        )

        assert _resolve_account_type(SocialPlatform.LINKEDIN, result) == AccountType.LINKEDIN_COMPANY

    @pytest.mark.unit
    def test_falls_back_to_heuristic_when_account_type_missing(self):
        result = _oauth_result(platform=SocialPlatform.FACEBOOK, account_type=None)

        assert _resolve_account_type(SocialPlatform.FACEBOOK, result) == AccountType.FACEBOOK_PAGE

    @pytest.mark.unit
    def test_falls_back_to_heuristic_on_unknown_account_type_value(self):
        result = _oauth_result(platform=SocialPlatform.FACEBOOK, account_type="not_a_real_type")

        assert _resolve_account_type(SocialPlatform.FACEBOOK, result) == AccountType.FACEBOOK_PAGE


class TestBuildLinkedinPublishKwargs:
    @pytest.mark.unit
    def test_company_account_uses_organization_urn(self):
        account = SocialAccount(
            account_type="linkedin_company",
            profile_data={"organizations": [{"organization_id": "999"}]},
        )

        kwargs = _build_linkedin_publish_kwargs(account)

        assert kwargs == {"account_type": "linkedin_company", "organization_id": "999"}

    @pytest.mark.unit
    def test_personal_account_uses_person_urn(self):
        account = SocialAccount(
            account_type="linkedin_personal",
            profile_data={"sub": "abc123"},
        )

        kwargs = _build_linkedin_publish_kwargs(account)

        assert kwargs == {"author_urn": "urn:li:person:abc123"}

    @pytest.mark.unit
    def test_company_account_without_organization_id_falls_back_to_person_urn(self):
        """Data integrity edge case: account_type says company but the
        organization was never persisted in profile_data - must not crash,
        and must not silently publish as the wrong organization."""
        account = SocialAccount(
            account_type="linkedin_company",
            profile_data={"id": "abc123", "organizations": []},
        )

        kwargs = _build_linkedin_publish_kwargs(account)

        assert kwargs == {"author_urn": "urn:li:person:abc123"}

    @pytest.mark.unit
    def test_missing_profile_data_returns_empty_kwargs(self):
        account = SocialAccount(account_type="linkedin_personal", profile_data=None)

        kwargs = _build_linkedin_publish_kwargs(account)

        assert kwargs == {}
