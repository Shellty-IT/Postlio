# postlio_backend/app/api/v1/brands.py
import json
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.api.exceptions import NotFoundError
from app.models.user import User
from app.models.brand import Brand
from app.repositories import brand_repo
from app.schemas.brand import (
    BrandCreate,
    BrandUpdate,
    BrandResponse,
    BrandsListResponse,
    AnalyzeVoiceRequest,
    VoiceAnalysisResult,
    BrandAnalytics,
    VoiceDNABase,
)
from app.services.ai.text.manager import TextAIManager

router = APIRouter(prefix="/brands", tags=["Brand Voice"])


def brand_to_response(brand: Brand) -> BrandResponse:
    voice_dna_data = brand.voice_dna or {}
    voice_dna = VoiceDNABase(
        tone_formality=voice_dna_data.get("tone_formality", 50),
        tone_energy=voice_dna_data.get("tone_energy", 50),
        tone_humor=voice_dna_data.get("tone_humor", 30),
        tone_emotion=voice_dna_data.get("tone_emotion", 50),
        personality_traits=voice_dna_data.get("personality_traits", ["professional", "friendly"]),
        communication_style=voice_dna_data.get("communication_style", "informative"),
        keywords=voice_dna_data.get("keywords", []),
        hashtags=voice_dna_data.get("hashtags", []),
        forbidden_words=voice_dna_data.get("forbidden_words", []),
        sample_posts=voice_dna_data.get("sample_posts", []),
        emoji_usage=voice_dna_data.get("emoji_usage", "moderate"),
        preferred_emojis=voice_dna_data.get("preferred_emojis", []),
    )
    return BrandResponse(
        id=brand.id,
        name=brand.name,
        description=brand.description,
        logo_url=brand.logo_url,
        primary_color=brand.primary_color or "#8B5CF6",
        secondary_color=brand.secondary_color,
        industry=brand.industry,
        target_audience=brand.target_audience,
        voice_dna=voice_dna,
        is_active=brand.is_active,
        is_default=brand.is_default,
        posts_count=brand.posts_count or 0,
        created_at=brand.created_at,
        updated_at=brand.updated_at,
    )


@router.get("/", response_model=BrandsListResponse)
async def get_brands(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
        skip: int = 0,
        limit: int = 50,
        is_active: Optional[bool] = None,
):
    brands = await brand_repo.list_brands(db, current_user.id, is_active, skip, limit)
    total = await brand_repo.count_brands(db, current_user.id, is_active)
    return BrandsListResponse(brands=[brand_to_response(b) for b in brands], total=total)


@router.get("/{brand_id}", response_model=BrandResponse)
async def get_brand(
        brand_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    brand = await brand_repo.get_by_id(db, current_user.id, brand_id)
    if not brand:
        raise NotFoundError("Brand")
    return brand_to_response(brand)


@router.post("/", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
        data: BrandCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    voice_dna_dict = data.voice_dna.model_dump() if data.voice_dna else VoiceDNABase().model_dump()
    is_first = await brand_repo.count_brands(db, current_user.id) == 0

    brand = Brand(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        logo_url=data.logo_url,
        primary_color=data.primary_color,
        secondary_color=data.secondary_color,
        industry=data.industry,
        target_audience=data.target_audience,
        voice_dna=voice_dna_dict,
        is_default=is_first,
    )
    brand = await brand_repo.create(db, brand)
    return brand_to_response(brand)


@router.patch("/{brand_id}", response_model=BrandResponse)
async def update_brand(
        brand_id: int,
        data: BrandUpdate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    brand = await brand_repo.get_by_id(db, current_user.id, brand_id)
    if not brand:
        raise NotFoundError("Brand")

    for field, value in data.model_dump(exclude_unset=True, exclude={"voice_dna"}).items():
        setattr(brand, field, value)

    if data.voice_dna:
        current_voice_dna = brand.voice_dna or {}
        current_voice_dna.update(data.voice_dna.model_dump(exclude_unset=True))
        brand.voice_dna = current_voice_dna

    brand = await brand_repo.save(db, brand)
    return brand_to_response(brand)


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(
        brand_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    brand = await brand_repo.get_by_id(db, current_user.id, brand_id)
    if not brand:
        raise NotFoundError("Brand")

    was_default = brand.is_default
    await brand_repo.delete(db, brand)

    if was_default:
        new_default = await brand_repo.get_latest(db, current_user.id)
        if new_default:
            new_default.is_default = True
            await brand_repo.save(db, new_default)


@router.post("/{brand_id}/set-default", response_model=BrandResponse)
async def set_default_brand(
        brand_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    brand = await brand_repo.get_by_id(db, current_user.id, brand_id)
    if not brand:
        raise NotFoundError("Brand")

    await brand_repo.clear_default(db, current_user.id)
    brand.is_default = True
    brand = await brand_repo.save(db, brand)
    return brand_to_response(brand)


@router.post("/{brand_id}/logo")
async def upload_brand_logo(
        brand_id: int,
        file: UploadFile = File(...),
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    brand = await brand_repo.get_by_id(db, current_user.id, brand_id)
    if not brand:
        raise NotFoundError("Brand")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plik musi być obrazem")

    logo_url = f"/uploads/brands/{brand_id}/logo_{file.filename}"
    brand.logo_url = logo_url
    await brand_repo.save(db, brand)
    return {"logo_url": logo_url}


@router.get("/{brand_id}/analytics", response_model=BrandAnalytics)
async def get_brand_analytics(
        brand_id: int,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user),
):
    brand = await brand_repo.get_by_id(db, current_user.id, brand_id)
    if not brand:
        raise NotFoundError("Brand")

    return BrandAnalytics(
        total_posts=brand.posts_count or 0,
        posts_this_month=0,
        engagement_rate=0.0,
        best_performing_platform=None,
        suggested_posting_times=["10:00", "14:00", "18:00"],
    )


@router.post("/analyze-voice", response_model=VoiceAnalysisResult)
async def analyze_brand_voice(
        data: AnalyzeVoiceRequest,
        current_user: User = Depends(get_current_user),
):
    if not data.sample_content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wymagany co najmniej 1 przykładowy tekst")

    combined_content = "\n---\n".join(data.sample_content)
    analysis_prompt = f"""Przeanalizuj poniższe przykładowe treści marki i określ jej głos (Voice DNA).

TREŚCI DO ANALIZY:
{combined_content}

Odpowiedz w formacie JSON:
{{
    "tone_formality": <0-100>,
    "tone_energy": <0-100>,
    "tone_humor": <0-100>,
    "tone_emotion": <0-100>,
    "personality_traits": [<lista 3-5 cech>],
    "communication_style": <jeden z: informative, inspirational, educational, entertaining, conversational, storytelling>,
    "detected_keywords": [<5-10 słów kluczowych>],
    "detected_hashtags": [<hashtagi jeśli wykryte>],
    "emoji_usage": <none, minimal, moderate, frequent>,
    "vocabulary_level": <prosty, średni, zaawansowany, ekspercki>,
    "common_phrases": [<3-5 charakterystycznych fraz>]
}}

Odpowiedz TYLKO JSON, bez dodatkowego tekstu."""

    try:
        ai_manager = TextAIManager()
        ai_response = await ai_manager.generate(
            prompt=analysis_prompt,
            system_prompt="Jesteś ekspertem od analizy marki i copywritingu.",
        )

        json_match = re.search(r"\{[\s\S]*\}", ai_response)
        if json_match:
            analysis_data = json.loads(json_match.group())
        else:
            raise ValueError("Nie znaleziono JSON w odpowiedzi AI")

        voice_dna = VoiceDNABase(
            tone_formality=analysis_data.get("tone_formality", 50),
            tone_energy=analysis_data.get("tone_energy", 50),
            tone_humor=analysis_data.get("tone_humor", 30),
            tone_emotion=analysis_data.get("tone_emotion", 50),
            personality_traits=analysis_data.get("personality_traits", ["professional", "friendly"]),
            communication_style=analysis_data.get("communication_style", "informative"),
            keywords=analysis_data.get("detected_keywords", []),
            hashtags=analysis_data.get("detected_hashtags", []),
            emoji_usage=analysis_data.get("emoji_usage", "moderate"),
        )
        analysis = {
            "tone_breakdown": {
                "formality": analysis_data.get("tone_formality", 50),
                "energy": analysis_data.get("tone_energy", 50),
                "humor": analysis_data.get("tone_humor", 30),
                "emotion": analysis_data.get("tone_emotion", 50),
            },
            "common_phrases": analysis_data.get("common_phrases", []),
            "vocabulary_level": analysis_data.get("vocabulary_level", "średni"),
            "emoji_usage_detected": analysis_data.get("emoji_usage", "moderate"),
            "hashtag_style": "branded" if analysis_data.get("detected_hashtags") else "minimal",
        }
        return VoiceAnalysisResult(voice_dna=voice_dna, analysis=analysis)

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Błąd parsowania odpowiedzi AI: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Błąd analizy: {e}")
