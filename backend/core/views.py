"""
Django REST Framework Views & URL Routing
Exposes endpoints for UC1-UC8 of Project 05 & Project 08 + 9-Proposal AI Core.
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .rules_engine import (
    GamificationRulesEngine,
    SM2SpacedRepetitionScheduler,
    AIOutputQualityGuard,
)


@csrf_exempt
def complete_lesson_view(request, lesson_id):
    """UC2 & UC3: Complete lesson, evaluate quiz, run gamification rules engine."""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    body = json.loads(request.body or "{}")
    result = GamificationRulesEngine.award_lesson_completion(
        current_xp=body.get("current_xp", 120),
        current_gems=body.get("current_gems", 50),
        streak_days=body.get("streak_days", 3),
        correct_count=body.get("correct_count", 3),
        total_questions=body.get("total_questions", 3),
        existing_badges=body.get("existing_badges", []),
        stats=body.get("stats", {}),
    )
    return JsonResponse(result)


@csrf_exempt
def review_flashcard_view(request, card_id):
    """Project 08 UC2: Schedule next review using SM-2 algorithm."""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    body = json.loads(request.body or "{}")
    schedule = SM2SpacedRepetitionScheduler.schedule_card(
        quality=body.get("quality", 4),
        repetitions=body.get("repetitions", 0),
        interval_days=body.get("interval_days", 1),
        easiness_factor=body.get("easiness_factor", 2.5),
    )
    return JsonResponse(schedule)
