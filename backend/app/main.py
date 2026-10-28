from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import uuid

from .models import ItemCreate, ItemResponse, MatchRequest, MatchResult, ClaimCreate
from .ai.matcher import ai_matcher

app = FastAPI(
    title="FindBack AI Backend API",
    description="FastAPI REST API for Campus Lost & Found with Multimodal Vector Matching",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (easily connected to Supabase / PostgreSQL)
ITEMS_DB = [
    {
        "id": "item-1",
        "title": "Adidas Backpack",
        "category": "bags",
        "status": "lost",
        "color": "Olive",
        "owner": "John Simon",
        "ownerPhone": "+1 (555) 019-2834",
        "reward": "$20",
        "date": "28.12.2024, 11:57",
        "location": "Nirmala Girls HSS / 86th Street",
        "distance": "500m",
        "coords": {"x": 52, "y": 38},
        "description": "Olive green Adidas backpack with trefoil logo, front zip pocket, side water bottle mesh.",
        "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
        "securityQuestion": "What brand was the water bottle in the side pocket?"
    },
    {
        "id": "item-2",
        "title": "Apple Watch SE 44mm",
        "category": "watches",
        "status": "lost",
        "color": "Midnight Blue",
        "owner": "Sarah Chen",
        "ownerPhone": "+1 (555) 014-9921",
        "reward": "$50",
        "date": "Today, 3 mins ago",
        "location": "Campus Sports Complex, Locker 4",
        "distance": "0.6 km",
        "coords": {"x": 30, "y": 65},
        "description": "Apple Watch SE 44mm GPS with midnight sport band, small scratch on top-right edge.",
        "image": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80",
        "securityQuestion": "What photo is set as the watch face background?"
    },
    {
        "id": "item-3",
        "title": "House Keys with Keychain",
        "category": "keys",
        "status": "lost",
        "color": "Brass / Metallic",
        "owner": "Marcus Brody",
        "ownerPhone": "+1 (555) 012-4412",
        "reward": "$15",
        "date": "Today, 32 mins ago",
        "location": "Main Library 2nd Floor Reading Room",
        "distance": "2.5 km",
        "coords": {"x": 74, "y": 28},
        "description": "Bundle of 4 brass keys with a miniature Eiffel Tower metallic keychain and blue tag.",
        "image": "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80",
        "securityQuestion": "What is written on the small blue plastic tag?"
    }
]

CLAIMS_DB = []

@app.get("/")
def root():
    return {
        "app": "FindBack AI",
        "slogan": "Lost Today. Found Tomorrow.",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/api/items", response_model=List[dict])
def get_items(category: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None):
    results = ITEMS_DB
    if category and category != "all":
        results = [i for i in results if i["category"].lower() == category.lower()]
    if status and status != "all":
        results = [i for i in results if i["status"].lower() == status.lower()]
    if search:
        q = search.lower()
        results = [i for i in results if q in i["title"].lower() or q in i["description"].lower() or q in i["location"].lower()]
    return results

@app.post("/api/items", response_model=dict)
def create_item(item: ItemCreate):
    new_item = item.dict()
    new_item["id"] = f"item-{uuid.uuid4().hex[:8]}"
    new_item["date"] = "Just now"
    new_item["coords"] = {"x": 50, "y": 50}
    ITEMS_DB.insert(0, new_item)
    return {"success": True, "item": new_item}

@app.post("/api/match", response_model=List[dict])
def match_items(req: MatchRequest):
    matches = ai_matcher.rank_matches(req.queryText, ITEMS_DB, top_k=4)
    return matches

@app.post("/api/claims")
def submit_claim(claim: ClaimCreate):
    claim_dict = claim.dict()
    claim_dict["id"] = f"claim-{uuid.uuid4().hex[:8]}"
    claim_dict["status"] = "pending_verification"
    CLAIMS_DB.append(claim_dict)
    return {"success": True, "message": "Claim submitted for verification", "claim": claim_dict}

@app.get("/api/stats")
def get_stats():
    return {
        "totalReported": len(ITEMS_DB) + 42,
        "activeLost": len([i for i in ITEMS_DB if i["status"] == "lost"]),
        "recoveredCount": 42,
        "recoveryRate": "88%"
    }
