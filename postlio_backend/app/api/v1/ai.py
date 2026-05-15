# postlio_backend/app/api/v1/ai.py

from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
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

router = APIRouter()


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
async def generate_text(
        request: GenerateTextRequest,
        current_user: User = Depends(get_current_user),
):
    provider = text_ai_manager.get_provider(
        request.provider.value if request.provider else None
    )

    result = await provider.generate_post(
        topic=request.topic,
        platform=request.platform.value,
        tone=request.tone.value,
        category=request.category.value if request.category else None,
        language=request.language,
        include_hashtags=request.include_hashtags,
        include_emoji=request.include_emoji,
        max_length=request.max_length,
        model=request.model,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))

    return GenerateTextResponse(
        success=True,
        data=GeneratedTextContent(
            content=result["content"],
            platform=request.platform.value,
            provider=result.get("provider", "unknown"),
            model=result.get("model"),
            hashtags=result.get("hashtags"),
        ),
        tokens_used=result.get("tokens_used"),
    )


@router.post("/generate/variations", response_model=GenerateVariationsResponse)
async def generate_variations(
        request: GenerateVariationsRequest,
        current_user: User = Depends(get_current_user),
):
    provider = text_ai_manager.get_provider(
        request.provider.value if request.provider else None
    )

    result = await provider.generate_variations(
        original_content=request.content,
        platform=request.platform.value,
        count=request.variations_count,
        model=request.model,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))

    return GenerateVariationsResponse(
        success=True,
        variations=result["variations"],
        provider=result.get("provider", "unknown"),
    )


@router.post("/improve")
async def improve_text(
        request: ImproveTextRequest,
        current_user: User = Depends(get_current_user),
):
    provider = text_ai_manager.get_provider(
        request.provider.value if request.provider else None
    )

    result = await provider.improve_text(
        content=request.content,
        platform=request.platform.value,
        instructions=request.instructions,
        model=request.model,
    )

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Improvement failed"))

    return {
        "success": True,
        "content": result["content"],
        "provider": result.get("provider", "unknown"),
    }


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(
        request: AIChatRequest,
        current_user: User = Depends(get_current_user),
):
    provider = text_ai_manager.get_provider(
        request.provider.value if request.provider else None
    )

    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    result = await provider.chat(
        messages=messages,
        category=request.category.value if request.category else None,
        platform=request.platform.value if request.platform else None,
        model=request.model,
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
async def generate_image(
        request: GenerateImageRequest,
        current_user: User = Depends(get_current_user),
):
    provider = image_ai_manager.get_provider(
        request.provider.value if request.provider else None
    )

    result = await provider.generate_image(
        prompt=request.prompt,
        style=request.style.value if request.style else None,
        width=request.width,
        height=request.height,
        model=request.model,
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
            prompt=result.get("prompt", request.prompt),
            provider=result.get("provider", "unknown"),
            model=result.get("model"),
            width=result.get("width"),
            height=result.get("height"),
        ),
    )


# === VIDEO GENERATION ===

@router.post("/generate/video", response_model=GenerateVideoResponse)
async def generate_video(
        request: GenerateVideoRequest,
        current_user: User = Depends(get_current_user),
):
    result = await video_ai_manager.generate_video(
        prompt=request.prompt,
        provider=request.provider.value if request.provider else None,
        model=request.model,
        width=request.width,
        height=request.height,
        duration=request.duration,
        reference_image=request.reference_image,
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
            prompt=result.get("prompt", request.prompt),
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