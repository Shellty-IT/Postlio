from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_brand_voice():
    return {"message": "Get brand voice - TODO"}


@router.post("/")
async def create_brand_voice():
    return {"message": "Create brand voice - TODO"}


@router.post("/analyze")
async def analyze_content():
    return {"message": "Analyze content - TODO"}