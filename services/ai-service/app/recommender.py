from app.data import reference_looks
from app.schemas import RecommendationInput


def get_style_recommendations(input_data: RecommendationInput):
    scored = []

    for look in reference_looks:
        score = 0
        reasons = []

        if input_data.faceShape in look["suitableFaceShapes"]:
            score += 3
            reasons.append(f"Matches face shape: {input_data.faceShape}")

        if input_data.hairType in look["suitableHairTypes"]:
            score += 3
            reasons.append(f"Suitable for hair type: {input_data.hairType}")

        if input_data.hairLength in look["suitableHairLengths"]:
            score += 2
            reasons.append(f"Works with hair length: {input_data.hairLength}")

        if input_data.styleGoal in look["styleGoals"]:
            score += 3
            reasons.append(f"Supports style goal: {input_data.styleGoal}")

        if input_data.previousServices:
            matched = [
                service
                for service in look["recommendedStyles"]
                if service.lower() in [s.lower() for s in input_data.previousServices]
            ]
            if matched:
                score += 1
                reasons.append("Aligned with previous service history")

        scored.append(
            {
                "id": look["id"],
                "name": look["name"],
                "description": look["description"],
                "score": score,
                "reasons": reasons,
                "recommendedStyles": look["recommendedStyles"],
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    return {
        "input": input_data.model_dump(),
        "recommendations": scored[:3],
    }