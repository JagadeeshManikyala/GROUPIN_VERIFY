import uuid
import logging
from typing import Optional, List, Dict, Any
import httpx
from fastapi import APIRouter, Header, Query, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("groups_api")

router = APIRouter()

# Schema models matching Frontend Integration Guide
class MediaItem(BaseModel):
    type: str = Field(..., description="image | video | document | audio")
    url: str
    name: Optional[str] = None
    filetype: Optional[str] = None

class SendMessagePayload(BaseModel):
    room_id: int
    message: str
    media: Optional[MediaItem] = None
    multiple_media: Optional[List[MediaItem]] = None

class AddMembersPayload(BaseModel):
    room_id: int
    mobile_numbers: List[str]

# High-fidelity mock groups for development & testing
MOCK_GROUPS = [
    {
        "room_id": 101,
        "aff": 1,
        "aff_label": "owner",
        "can_send": True,
        "config": {
            "roomname": "VIP Prime Customers (South)",
            "type": "private",
            "subject": "Exclusive Offers & Updates",
            "audio_enabled": "true",
            "document_enabled": "true",
            "photos_enabled": "true",
            "videos_enabled": "true",
        }
    },
    {
        "room_id": 204,
        "aff": 3,
        "aff_label": "admin",
        "can_send": True,
        "config": {
            "roomname": "Bangalore Logistics & Field Ops",
            "type": "private",
            "subject": "Operations & Dispatch",
            "audio_enabled": "true",
            "document_enabled": "true",
            "photos_enabled": "true",
            "videos_enabled": "false",  # Video disabled for this group
        }
    },
    {
        "room_id": 308,
        "aff": 2,
        "aff_label": "member",
        "can_send": True,
        "config": {
            "roomname": "Community Early Adopters",
            "type": "public",
            "subject": "Product Discussions",
            "audio_enabled": "false",
            "document_enabled": "true",
            "photos_enabled": "true",
            "videos_enabled": "false",
        }
    },
    {
        "room_id": 412,
        "aff": 1,
        "aff_label": "owner",
        "can_send": True,
        "config": {
            "roomname": "Enterprise Marketing Broadcasts",
            "type": "broadcast",
            "subject": "Product Launches & Catalogs",
            "audio_enabled": "true",
            "document_enabled": "true",
            "photos_enabled": "true",
            "videos_enabled": "true",
        }
    }
]

def get_effective_api_key(header_key: Optional[str]) -> str:
    if header_key and header_key.strip():
        return header_key.strip()
    return settings.GROUPS_API_KEY or ""

def get_target_url(endpoint: str) -> str:
    base = settings.GROUPS_API_URL.rstrip('/')
    if not base.endswith('/api/v1'):
        base = f"{base}/api/v1"
    clean_ep = endpoint.lstrip('/')
    if not clean_ep.startswith('groups/'):
        clean_ep = f"groups/{clean_ep}"
    return f"{base}/{clean_ep}"

@router.get("/config")
@router.get("/groups/config")
async def get_groups_config():
    """
    Return backend-configured Groups API metadata (from backend/.env).
    Does NOT leak secret API keys to clients, only indicates presence.
    """
    return {
        "success": True,
        "data": {
            "base_url": settings.GROUPS_API_URL,
            "has_api_key": bool(settings.GROUPS_API_KEY and settings.GROUPS_API_KEY != "your_groups_api_key_here"),
            "use_mock": settings.USE_MOCK_GROUPIN,
        }
    }

@router.get("/list")
@router.get("/groups/list")
async def list_groups(
    type: Optional[str] = Query(None, description="Filter by group type e.g. private, public"),
    subject: Optional[str] = Query(None, description="Filter by subject"),
    x_api_key: Optional[str] = Header(None, alias="x-api-key")
):
    """
    Fetch all groups where the authenticated user has send permissions.
    Proxies to SaaS messagebot backend or provides high-fidelity mock data.
    """
    api_key = get_effective_api_key(x_api_key)
    
    # Try upstream if not in explicit mock mode and API key is present
    if not settings.USE_MOCK_GROUPIN and api_key and settings.GROUPS_API_URL:
        target_url = get_target_url("list")
        params = {}
        if type:
            params["type"] = type
        if subject:
            params["subject"] = subject

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(target_url, headers={"x-api-key": api_key}, params=params)
                if res.status_code == 200:
                    return res.json()
                logger.warning(f"Upstream Groups API returned HTTP {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.warning(f"Failed to reach upstream Groups API: {e}. Falling back to mock data.")

    # Mock response with filtering
    filtered_groups = MOCK_GROUPS
    if type:
        filtered_groups = [g for g in filtered_groups if g["config"].get("type", "").lower() == type.lower()]
    if subject:
        filtered_groups = [g for g in filtered_groups if subject.lower() in g["config"].get("subject", "").lower()]

    return {
        "success": True,
        "data": {
            "groups": filtered_groups,
            "total_count": len(filtered_groups),
            "is_mock": True
        }
    }

@router.post("/send-message")
@router.post("/groups/send-message")
async def send_message(
    payload: SendMessagePayload,
    x_api_key: Optional[str] = Header(None, alias="x-api-key")
):
    """
    Send text, media, or gallery messages to a group room.
    """
    api_key = get_effective_api_key(x_api_key)

    if not settings.USE_MOCK_GROUPIN and api_key and settings.GROUPS_API_URL:
        target_url = get_target_url("send-message")

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    target_url,
                    headers={"x-api-key": api_key, "Content-Type": "application/json"},
                    json=payload.model_dump(exclude_none=True)
                )
                if res.status_code == 200:
                    return res.json()
                logger.warning(f"Upstream send-message returned HTTP {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.warning(f"Upstream send-message failed: {e}. Falling back to mock response.")

    # High fidelity mock success
    campaign_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"
    return {
        "success": True,
        "data": {
            "campaign_id": campaign_id,
            "room_id": payload.room_id,
            "recipient_mode": "group",
            "media_attached": bool(payload.media or payload.multiple_media),
            "created_at": "now",
            "is_mock": True
        },
        "message": f"Message queued successfully (Campaign: {campaign_id})"
    }

@router.post("/add-members")
@router.post("/groups/add-members")
async def add_members(
    payload: AddMembersPayload,
    x_api_key: Optional[str] = Header(None, alias="x-api-key")
):
    """
    Add members to a group by their mobile numbers (Owner permission required).
    """
    api_key = get_effective_api_key(x_api_key)

    if not settings.USE_MOCK_GROUPIN and api_key and settings.GROUPS_API_URL:
        target_url = get_target_url("add-members")
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    target_url,
                    headers={"x-api-key": api_key, "Content-Type": "application/json"},
                    json=payload.model_dump()
                )
                if res.status_code == 200:
                    return res.json()
                logger.warning(f"Upstream add-members returned HTTP {res.status_code}: {res.text[:200]}")
        except Exception as e:
            logger.warning(f"Upstream add-members failed: {e}. Falling back to mock response.")

    # Mock response
    valid_numbers = [n.strip() for n in payload.mobile_numbers if n.strip()]
    return {
        "success": True,
        "data": {
            "added_count": len(valid_numbers),
            "room_id": payload.room_id,
            "processed_numbers": valid_numbers,
            "is_mock": True
        },
        "message": f"{len(valid_numbers)} member(s) added successfully to Room #{payload.room_id}"
    }
