from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class PublishResult:
    success: bool
    post_id: Optional[str] = None
    post_url: Optional[str] = None
    error: Optional[str] = None
    platform: Optional[str] = None

    requires_manual_publish: bool = False
    share_dialog_url: Optional[str] = None
    deeplink_url: Optional[str] = None
    web_url: Optional[str] = None
    manual_instructions: List[str] = field(default_factory=list)

    account_type: Optional[str] = None
    is_business_account: bool = True


@dataclass
class ManualPublishData:
    platform: str
    account_type: str
    content: str
    full_content: str
    hashtags: List[str]
    hashtags_string: str
    image_url: Optional[str]

    share_dialog_url: Optional[str]
    deeplink_url: Optional[str]
    web_url: str

    instructions: List[str]

    requires_image_download: bool = False
