from pydantic import BaseModel, Field
from typing import Optional, List

class ItemBase(BaseModel):
    title: str = Field(..., example="Adidas Backpack")
    category: str = Field(..., example="bags") # bags, keys, phones, watches, all
    status: str = Field("lost", example="lost") # lost, found, claimed
    color: str = Field("Olive", example="Olive")
    owner: str = Field("John Simon", example="John Simon")
    ownerPhone: str = Field("+1 (555) 019-2834", example="+1 (555) 019-2834")
    reward: str = Field("$20", example="$20")
    location: str = Field("Nirmala Girls HSS / 86th Street", example="Nirmala Girls HSS / 86th Street")
    distance: str = Field("500m", example="500m")
    description: str = Field(..., example="Olive green Adidas backpack with trefoil logo, front zip pocket.")
    image: Optional[str] = Field("https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80")
    securityQuestion: Optional[str] = Field("What brand was the water bottle in the side pocket?")

class ItemCreate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: str
    date: str
    coords: dict

class MatchRequest(BaseModel):
    queryText: str = Field(..., example="Black backpack with red stripe")
    category: Optional[str] = None
    imageUrl: Optional[str] = None

class MatchResult(BaseModel):
    item: ItemResponse
    matchPercentage: int
    reasons: List[str]

class ClaimCreate(BaseModel):
    itemId: str
    claimantName: str
    claimantPhone: str
    answer: str
