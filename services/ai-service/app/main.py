from fastapi import FastAPI
from app.schemas import RecommendationInput
from app.recommender import get_style_recommendations

app = FastAPI(title="Trimly AI Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recommendations/style")
def recommend_style(payload: RecommendationInput):
    return get_style_recommendations(payload)