from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ─────────── Models ───────────
class ClaudeRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 1200
    images: Optional[List[str]] = None  # base64 strings (no data URI prefix)
    session_id: Optional[str] = None


class ClaudeResponse(BaseModel):
    text: str


class TrackedPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    platform: str
    type: str
    topic: str
    likes: str
    comments: Optional[str] = "0"
    reach: Optional[str] = "0"
    date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%m/%d/%Y"))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TrackedPostCreate(BaseModel):
    device_id: str
    platform: str
    type: str
    topic: str
    likes: str
    comments: Optional[str] = "0"
    reach: Optional[str] = "0"


# ─────────── Routes ───────────
@api_router.get("/")
async def root():
    return {"message": "ClipMaster Pro API"}


@api_router.post("/claude", response_model=ClaudeResponse)
async def claude_endpoint(req: ClaudeRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    try:
        # Import here to fail soft if library missing
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

        session_id = req.session_id or str(uuid.uuid4())
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=(
                "You are a bold, edgy, street-smart social media expert for barbers, "
                "stylists and beauty pros. Write punchy content that drives bookings. "
                "Use emojis strategically. Follow the user's exact format instructions."
            ),
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        # Build user message
        if req.images:
            file_contents: List[Any] = [
                ImageContent(image_base64=img) for img in req.images
            ]
            user_msg = UserMessage(text=req.prompt, file_contents=file_contents)
        else:
            user_msg = UserMessage(text=req.prompt)

        max_tokens = req.max_tokens or 1200
        try:
            chat.with_max_tokens(max_tokens)
        except Exception:
            pass

        text = await chat.send_message(user_msg)
        if not text or (isinstance(text, str) and not text.strip()):
            raise HTTPException(status_code=502, detail="Empty response from model")
        return ClaudeResponse(text=str(text))
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Claude generation failed")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")


@api_router.post("/posts", response_model=TrackedPost)
async def create_post(payload: TrackedPostCreate):
    post = TrackedPost(**payload.dict())
    doc = post.dict()
    await db.tracked_posts.insert_one(doc)
    return post


@api_router.get("/posts", response_model=List[TrackedPost])
async def list_posts(device_id: str):
    cursor = db.tracked_posts.find(
        {"device_id": device_id}, {"_id": 0}
    ).sort("created_at", -1).limit(50)
    items = await cursor.to_list(length=50)
    return [TrackedPost(**i) for i in items]


@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, device_id: str):
    result = await db.tracked_posts.delete_one({"id": post_id, "device_id": device_id})
    return {"deleted": result.deleted_count}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
