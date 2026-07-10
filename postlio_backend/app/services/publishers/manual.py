from typing import Optional, List, Dict, Any
from urllib.parse import quote

from app.services.publishers.types import ManualPublishData


class ManualAssistPublisher:
    """URL and instruction generation for personal accounts that require manual publishing."""

    def generate_urls(
        self,
        platform: str,
        account_type: str,
        content: str,
        hashtags: Optional[List[str]] = None,
        image_url: Optional[str] = None,
        link_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        full_content = content
        if hashtags:
            hashtag_str = " ".join(f"#{tag.lstrip('#')}" for tag in hashtags)
            full_content = f"{content}\n\n{hashtag_str}"

        result: Dict[str, Any] = {
            "share_dialog_url": None,
            "deeplink_url": None,
            "web_url": None,
            "manual_instructions": [],
        }

        if platform == "facebook":
            result["share_dialog_url"] = f"https://www.facebook.com/sharer/sharer.php?quote={quote(full_content[:500])}"
            if link_url:
                result["share_dialog_url"] += f"&u={quote(link_url)}"
            result["deeplink_url"] = "fb://feed"
            result["web_url"] = "https://www.facebook.com"
            result["manual_instructions"] = [
                "1. Kliknij 'Otwórz Facebook' lub skopiuj treść",
                "2. Wklej treść w nowy post",
                "3. Dodaj zdjęcie jeśli potrzebujesz",
                "4. Opublikuj post",
            ]

        elif platform == "instagram":
            result["deeplink_url"] = "instagram://camera"
            result["web_url"] = "https://www.instagram.com"
            result["manual_instructions"] = [
                "1. Skopiuj treść posta",
                "2. Otwórz aplikację Instagram",
                "3. Utwórz nowy post i wybierz zdjęcie",
                "4. Wklej skopiowaną treść jako opis",
                "5. Opublikuj post",
            ]
            if image_url:
                result["manual_instructions"].insert(0, "0. Pobierz zdjęcie z aplikacji Postlio")

        elif platform == "linkedin":
            result["share_dialog_url"] = f"https://www.linkedin.com/sharing/share-offsite/?text={quote(full_content[:500])}"
            if link_url:
                result["share_dialog_url"] += f"&url={quote(link_url)}"
            result["deeplink_url"] = "linkedin://feed"
            result["web_url"] = "https://www.linkedin.com/feed"
            result["manual_instructions"] = [
                "1. Kliknij 'Otwórz LinkedIn' lub skopiuj treść",
                "2. Wklej treść w nowy post",
                "3. Dodaj zdjęcie jeśli potrzebujesz",
                "4. Opublikuj post",
            ]

        return result

    def prepare_data(
        self,
        platform: str,
        account_type: str,
        content: str,
        hashtags: Optional[List[str]] = None,
        image_url: Optional[str] = None,
    ) -> ManualPublishData:
        hashtags = hashtags or []
        hashtags_string = " ".join(f"#{tag.lstrip('#')}" for tag in hashtags) if hashtags else ""
        full_content = f"{content}\n\n{hashtags_string}" if hashtags_string else content

        urls = self.generate_urls(
            platform=platform,
            account_type=account_type,
            content=content,
            hashtags=hashtags,
            image_url=image_url,
        )

        return ManualPublishData(
            platform=platform,
            account_type=account_type,
            content=content,
            full_content=full_content,
            hashtags=hashtags,
            hashtags_string=hashtags_string,
            image_url=image_url,
            share_dialog_url=urls["share_dialog_url"],
            deeplink_url=urls["deeplink_url"],
            web_url=urls["web_url"] or "",
            instructions=urls["manual_instructions"],
            requires_image_download=bool(image_url) and platform == "instagram",
        )
