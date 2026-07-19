# postlio_backend/app/api/v1/ai.py

from fastapi import APIRouter, Depends, HTTPException, Request
from app.api.deps import get_current_user
from app.api.rate_limit import limiter
from app.models.user import User
from app.services.ai import text_ai_manager, image_ai_manager, video_ai_manager
from app.schemas.ai import (
    GenerateTextRequest,
    GenerateTextResponse,
    GeneratedTextContent,
    GenerateVariationsRequest,
    GenerateVariationsResponse,
    ImproveTextRequest,
    AIChatRequest,
    AIChatResponse,
    GenerateImageRequest,
    GenerateImageResponse,
    GeneratedImageContent,
    GenerateVideoRequest,
    GenerateVideoResponse,
    GeneratedVideoContent,
    ProvidersListResponse,
    ProviderInfo,
)

router = APIRouter(prefix="/ai", tags=["AI Generation"])


# === PROVIDERS ===

@router.get("/providers", response_model=ProvidersListResponse)
async def list_providers(
        current_user: User = Depends(get_current_user),
):
    text_providers = text_ai_manager.list_providers()
    image_providers = image_ai_manager.list_providers()
    video_providers = video_ai_manager.list_providers()

    return ProvidersListResponse(
        text_providers=[ProviderInfo(**p) for p in text_providers],
        image_providers=[ProviderInfo(**p) for p in image_providers],
        video_providers=[ProviderInfo(**p) for p in video_providers],
    )


# === TEXT GENERATION ===

@router.post("/generate/text", response_model=GenerateTextResponse)
@limiter.limit("20/minute")
async def generate_text(
        request: Request,
        payload: GenerateTextRequest,
        current_user: User = Depends(get_current_user),
):
    provider = text_ai_manager.get_provider(
        payload.provider.value if payload.provider else None
    )

    result = await provider.generate_post(
        topic=payload.topic,
        platform=payload.platform.value,
        tone=payload.tone.value,
        category=payload.category.value if payload.category else None,
        language=payload.language,
        include_hashtags=payload.include_hashtags,
        include_emoji=payload.include_emoji,
        max_length=payload.max_length,
        model=payload.model,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))

    return GenerateTextResponse(
        success=True,
        data=GeneratedTextContent(
            content=result["content"],
            platform=payload.platform.value,
            provider=result.get("provider", "unknown"),
            model=result.get("model"),
            hashtags=result.get("hashtags"),
        ),
        tokens_used=result.get("tokens_used"),
    )


@router.post("/generate/variations", response_model=GenerateVariationsResponse)
@limiter.limit("20/minute")
async def generate_variations(
        request: Request,
        payload: GenerateVariationsRequest,
        current_user: User = Depends(get_current_user),
):
    provider = text_ai_manager.get_provider(
        payload.provider.value if payload.provider else None
    )

    result = await provider.generate_variations(
        original_content=payload.content,
        platform=payload.platform.value,
        count=payload.variations_count,
        model=payload.model,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))

    return GenerateVariationsResponse(
        success=True,
        variations=result["variations"],
        provider=result.get("provider", "unknown"),
    )


@router.post("/improve")
@limiter.limit("20/minute")
async def improve_text(
        request: Request,
        payload: ImproveTextRequest,
        current_user: User = Depends(get_current_user),
):
    provider = text_ai_manager.get_provider(
        payload.provider.value if payload.provider else None
    )

    result = await provider.improve_text(
        content=payload.content,
        platform=payload.platform.value,
        instructions=payload.instructions,
        model=payload.model,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Improvement failed"))

    return {
        "success": True,
        "content": result["content"],
        "provider": result.get("provider", "unknown"),
    }


@router.post("/chat", response_model=AIChatResponse)
@limiter.limit("20/minute")
async def ai_chat(
        request: Request,
        payload: AIChatRequest,
        current_user: User = Depends(get_current_user),
):
    provider = text_ai_manager.get_provider(
        payload.provider.value if payload.provider else None
    )

    messages = [{"role": m.role, "content": m.content} for m in payload.messages]

    result = await provider.chat(
        messages=messages,
        category=payload.category.value if payload.category else None,
        platform=payload.platform.value if payload.platform else None,
        model=payload.model,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Chat failed"))

    return AIChatResponse(
        success=True,
        message=result["message"],
        provider=result.get("provider", "unknown"),
    )


# === IMAGE GENERATION ===

@router.post("/generate/image", response_model=GenerateImageResponse)
@limiter.limit("10/minute")
async def generate_image(
        request: Request,
        payload: GenerateImageRequest,
        current_user: User = Depends(get_current_user),
):
    result = await image_ai_manager.generate_image(
        prompt=payload.prompt,
        provider=payload.provider.value if payload.provider else None,
        style=payload.style.value if payload.style else None,
        width=payload.width,
        height=payload.height,
        model=payload.model,
    )

    if not result.get("success"):
        return GenerateImageResponse(
            success=False,
            error=result.get("error", "Image generation failed"),
        )

    return GenerateImageResponse(
        success=True,
        data=GeneratedImageContent(
            image_url=result.get("image_url"),
            image_data=result.get("image_data"),
            prompt=result.get("prompt", payload.prompt),
            provider=result.get("provider", "unknown"),
            model=result.get("model"),
            width=result.get("width"),
            height=result.get("height"),
        ),
    )


# === VIDEO GENERATION ===

@router.post("/generate/video", response_model=GenerateVideoResponse)
@limiter.limit("10/minute")
async def generate_video(
        request: Request,
        payload: GenerateVideoRequest,
        current_user: User = Depends(get_current_user),
):
    result = await video_ai_manager.generate_video(
        prompt=payload.prompt,
        provider=payload.provider.value if payload.provider else None,
        model=payload.model,
        width=payload.width,
        height=payload.height,
        duration=payload.duration,
        reference_image=payload.reference_image,
    )

    if not result.get("success"):
        return GenerateVideoResponse(
            success=False,
            error=result.get("error", "Video generation failed"),
        )

    return GenerateVideoResponse(
        success=True,
        data=GeneratedVideoContent(
            video_data=result.get("video_data"),
            mime_type=result.get("mime_type"),
            prompt=result.get("prompt", payload.prompt),
            prompt_translated=result.get("prompt_translated"),
            provider=result.get("provider", "unknown"),
            model=result.get("model"),
            model_display_name=result.get("model_display_name"),
            width=result.get("width"),
            height=result.get("height"),
            duration=result.get("duration"),
            size_bytes=result.get("size_bytes"),
            has_reference_image=result.get("has_reference_image", False),
        ),
    )


# === MODELS ===

@router.get("/models/available")
async def get_available_models(
        current_user: User = Depends(get_current_user),
):
    gemini_provider = text_ai_manager.get_provider("gemini")

    available_models = await gemini_provider.list_available_models()

    return {
        "gemini_models": available_models,
        "default_model": gemini_provider.default_model,
        "configured_models": gemini_provider.models,
    }