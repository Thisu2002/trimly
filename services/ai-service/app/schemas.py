from typing import List, Literal, Optional
from pydantic import BaseModel

FaceShape = Literal["oval", "round", "square", "heart", "diamond", "oblong"]
HairType = Literal["straight", "wavy", "curly", "coily"]
HairLength = Literal["short", "medium", "long"]
StyleGoal = Literal["low_maintenance", "trendy", "professional", "volume", "repair"]


class RecommendationInput(BaseModel):
    faceShape: FaceShape
    hairType: HairType
    hairLength: HairLength
    styleGoal: StyleGoal
    previousServices: Optional[List[str]] = []


class RecommendationResult(BaseModel):
    id: str
    name: str
    description: str
    score: int
    reasons: List[str]
    recommendedStyles: List[str]  # fixed: was "recommendedServices" — must match data.py


class RecommendationResponse(BaseModel):
    input: RecommendationInput
    recommendations: List[RecommendationResult]