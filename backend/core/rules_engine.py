#!/usr/bin/env python3
"""
Django Gamification Rules Engine & SM-2 Spaced Repetition Scheduler
Shiraz University • Fall 2026 • Systems Analysis and Design
Covers Project 05 (Gamified Learning Application) & Project 08 (Language Learning Application)
"""

import json
import math
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional


class GamificationRulesEngine:
    """
    Deterministic, unit-tested rules module for XP, levels, daily streaks,
    achievement badges, and rewards shop transactions.
    """

    BASE_LESSON_XP = 50
    PERFECT_QUIZ_BONUS_XP = 30
    STREAK_BONUS_PER_DAY = 5
    MAX_STREAK_BONUS = 50

    LEVEL_THRESHOLDS = [
        (1, 0, "Novice Explorer"),
        (2, 100, "Apprentice Scholar"),
        (3, 250, "Code Tactician"),
        (4, 500, "Systems Architect"),
        (5, 850, "AI Vanguard"),
        (6, 1300, "Grandmaster Fellows"),
        (7, 1900, "Shiraz Laureate"),
    ]

    BADGE_CATALOG = [
        {
            "id": "first_step",
            "name": "First Horizon",
            "description": "Complete your first lesson or placement test",
            "condition": lambda stats: stats.get("lessons_completed", 0) >= 1,
            "xp_bonus": 25,
        },
        {
            "id": "streak_3",
            "name": "Consistent Flame",
            "description": "Maintain a 3-day study streak",
            "condition": lambda stats: stats.get("streak_days", 0) >= 3,
            "xp_bonus": 40,
        },
        {
            "id": "streak_7",
            "name": "Unstoppable Week",
            "description": "Maintain a 7-day study streak",
            "condition": lambda stats: stats.get("streak_days", 0) >= 7,
            "xp_bonus": 100,
        },
        {
            "id": "perfect_score",
            "name": "Precision Engineer",
            "description": "Score 100% on any lesson quiz",
            "condition": lambda stats: stats.get("perfect_quizzes", 0) >= 1,
            "xp_bonus": 50,
        },
        {
            "id": "curious_mind",
            "name": "Socratic Seeker",
            "description": "Ask the AI Tutor for 3 explanations",
            "condition": lambda stats: stats.get("tutor_queries", 0) >= 3,
            "xp_bonus": 35,
        },
        {
            "id": "memory_master",
            "name": "SM-2 Memory Master",
            "description": "Review 10 spaced-repetition flashcards",
            "condition": lambda stats: stats.get("flashcards_reviewed", 0) >= 10,
            "xp_bonus": 45,
        },
    ]

    @classmethod
    def calculate_level(cls, total_xp: int) -> Dict[str, Any]:
        """Compute current level, title, and progress toward next level."""
        safe_xp = max(0, int(total_xp))
        current_level = 1
        current_title = "Novice Explorer"
        current_floor = 0
        next_ceiling: Optional[int] = 100

        for i, (lvl, threshold, title) in enumerate(cls.LEVEL_THRESHOLDS):
            if safe_xp >= threshold:
                current_level = lvl
                current_title = title
                current_floor = threshold
                if i + 1 < len(cls.LEVEL_THRESHOLDS):
                    next_ceiling = cls.LEVEL_THRESHOLDS[i + 1][1]
                else:
                    next_ceiling = None

        if next_ceiling is None:
            progress_pct = 100
            xp_to_next = 0
        else:
            span = max(1, next_ceiling - current_floor)
            gained_in_level = safe_xp - current_floor
            progress_pct = min(100, max(0, int(round((gained_in_level / span) * 100))))
            xp_to_next = max(0, next_ceiling - safe_xp)

        return {
            "level": current_level,
            "title": current_title,
            "total_xp": safe_xp,
            "current_level_floor": current_floor,
            "next_level_xp": next_ceiling,
            "xp_to_next_level": xp_to_next,
            "progress_percent": progress_pct,
        }

    @classmethod
    def award_lesson_completion(
        cls,
        current_xp: int,
        current_gems: int,
        streak_days: int,
        correct_count: int,
        total_questions: int,
        existing_badges: List[str],
        stats: Dict[str, int],
    ) -> Dict[str, Any]:
        """Calculate XP, gems, streak bonus, level-up, and newly unlocked badges."""
        total_q = max(1, int(total_questions))
        correct_q = max(0, min(int(correct_count), total_q))
        accuracy = correct_q / total_q

        accuracy_xp = int(round(cls.BASE_LESSON_XP * accuracy))
        perfect_bonus = cls.PERFECT_QUIZ_BONUS_XP if correct_q == total_q else 0
        streak_bonus = min(cls.MAX_STREAK_BONUS, max(0, int(streak_days)) * cls.STREAK_BONUS_PER_DAY)

        updated_stats = dict(stats)
        updated_stats["lessons_completed"] = updated_stats.get("lessons_completed", 0) + 1
        if correct_q == total_q:
            updated_stats["perfect_quizzes"] = updated_stats.get("perfect_quizzes", 0) + 1
        updated_stats["streak_days"] = max(1, int(streak_days))

        new_badges = []
        badge_xp_bonus = 0
        for badge in cls.BADGE_CATALOG:
            if badge["id"] not in existing_badges and badge["condition"](updated_stats):
                new_badges.append(
                    {
                        "id": badge["id"],
                        "name": badge["name"],
                        "description": badge["description"],
                        "xp_bonus": badge["xp_bonus"],
                    }
                )
                badge_xp_bonus += badge["xp_bonus"]

        earned_xp = accuracy_xp + perfect_bonus + streak_bonus + badge_xp_bonus
        earned_gems = 10 + (15 if correct_q == total_q else 0) + (5 * len(new_badges))

        before_level = cls.calculate_level(current_xp)["level"]
        new_total_xp = current_xp + earned_xp
        after_level_info = cls.calculate_level(new_total_xp)

        return {
            "earned_xp": earned_xp,
            "breakdown": {
                "accuracy_xp": accuracy_xp,
                "perfect_bonus": perfect_bonus,
                "streak_bonus": streak_bonus,
                "badge_xp_bonus": badge_xp_bonus,
            },
            "earned_gems": earned_gems,
            "new_total_xp": new_total_xp,
            "new_total_gems": current_gems + earned_gems,
            "leveled_up": after_level_info["level"] > before_level,
            "level_info": after_level_info,
            "newly_unlocked_badges": new_badges,
            "updated_stats": updated_stats,
        }

    @classmethod
    def update_streak(
        cls,
        current_streak: int,
        last_active_date_str: Optional[str],
        today_date_str: str,
        has_streak_freeze: bool = False,
    ) -> Dict[str, Any]:
        """Evaluate daily streak continuation, increment, freeze usage, or reset."""
        if not last_active_date_str:
            return {
                "streak_days": 1,
                "status": "started",
                "freeze_consumed": False,
                "last_active_date": today_date_str,
            }

        last_dt = datetime.strptime(last_active_date_str, "%Y-%m-%d").date()
        today_dt = datetime.strptime(today_date_str, "%Y-%m-%d").date()
        delta_days = (today_dt - last_dt).days

        if delta_days <= 0:
            return {
                "streak_days": max(1, current_streak),
                "status": "maintained_same_day",
                "freeze_consumed": False,
                "last_active_date": today_date_str,
            }
        elif delta_days == 1:
            return {
                "streak_days": current_streak + 1,
                "status": "incremented",
                "freeze_consumed": False,
                "last_active_date": today_date_str,
            }
        elif delta_days == 2 and has_streak_freeze:
            return {
                "streak_days": current_streak,
                "status": "saved_by_freeze",
                "freeze_consumed": True,
                "last_active_date": today_date_str,
            }
        else:
            return {
                "streak_days": 1,
                "status": "reset",
                "freeze_consumed": False,
                "last_active_date": today_date_str,
            }


class SM2SpacedRepetitionScheduler:
    """
    SuperMemo-2 (SM-2) Spaced Repetition Algorithm as specified in Project 08.
    Quality rating q in [0..5]:
      5 - perfect response
      4 - correct response after a hesitation
      3 - correct response recalled with serious difficulty
      2 - incorrect response; where the correct one seemed easy to recall
      1 - incorrect response; the correct one remembered
      0 - complete blackout
    """

    MIN_EASINESS_FACTOR = 1.3

    @classmethod
    def schedule_card(
        cls,
        quality: int,
        repetitions: int,
        interval_days: int,
        easiness_factor: float,
        review_date_str: Optional[str] = None,
    ) -> Dict[str, Any]:
        q = max(0, min(5, int(quality)))
        reps = max(0, int(repetitions))
        interval = max(0, int(interval_days))
        ef = max(cls.MIN_EASINESS_FACTOR, float(easiness_factor))

        if q >= 3:
            if reps == 0:
                next_interval = 1
            elif reps == 1:
                next_interval = 6
            else:
                next_interval = int(round(interval * ef))
            next_reps = reps + 1
        else:
            next_reps = 0
            next_interval = 1

        # Update Easiness Factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        new_ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        new_ef = round(max(cls.MIN_EASINESS_FACTOR, new_ef), 2)

        base_date = (
            datetime.strptime(review_date_str, "%Y-%m-%d").date()
            if review_date_str
            else datetime.utcnow().date()
        )
        next_review_date = (base_date + timedelta(days=next_interval)).strftime("%Y-%m-%d")

        return {
            "quality": q,
            "repetitions": next_reps,
            "interval_days": next_interval,
            "easiness_factor": new_ef,
            "next_review_date": next_review_date,
            "mastery_state": "mastered" if next_interval >= 14 else ("learning" if q >= 3 else "relearning"),
        }


class AIOutputQualityGuard:
    """
    Validates structured JSON quiz & itinerary outputs from the LLM
    before returning them to the client (Page 9, 13, 22, 23 requirements).
    """

    @staticmethod
    def validate_quiz_questions(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        valid_questions = []
        errors = []

        for idx, q in enumerate(questions):
            options = q.get("options", [])
            correct_idx = q.get("correctIndex")
            prompt_text = str(q.get("question", "")).strip()

            if not prompt_text:
                errors.append(f"Question {idx}: Missing question text.")
                continue
            if not isinstance(options, list) or len(options) != 4:
                errors.append(f"Question {idx}: Must have exactly 4 options.")
                continue
            if len(set(str(o).strip().lower() for o in options)) != 4:
                errors.append(f"Question {idx}: Duplicate options detected.")
                continue
            if not isinstance(correct_idx, int) or not (0 <= correct_idx < 4):
                errors.append(f"Question {idx}: correctIndex must be 0..3.")
                continue

            valid_questions.append(q)

        return {
            "is_valid": len(errors) == 0 and len(valid_questions) > 0,
            "valid_count": len(valid_questions),
            "rejected_count": len(errors),
            "errors": errors,
            "validated_questions": valid_questions,
        }


if __name__ == "__main__":
    # CLI bridge so Express/Node or terminal users can invoke the Python engine directly
    if len(sys.argv) > 1:
        payload = json.loads(sys.argv[1])
        action = payload.get("action")
        if action == "award_lesson":
            res = GamificationRulesEngine.award_lesson_completion(
                current_xp=payload.get("current_xp", 0),
                current_gems=payload.get("current_gems", 0),
                streak_days=payload.get("streak_days", 1),
                correct_count=payload.get("correct_count", 0),
                total_questions=payload.get("total_questions", 1),
                existing_badges=payload.get("existing_badges", []),
                stats=payload.get("stats", {}),
            )
            print(json.dumps(res))
        elif action == "sm2_schedule":
            res = SM2SpacedRepetitionScheduler.schedule_card(
                quality=payload.get("quality", 4),
                repetitions=payload.get("repetitions", 0),
                interval_days=payload.get("interval_days", 0),
                easiness_factor=payload.get("easiness_factor", 2.5),
                review_date_str=payload.get("review_date_str"),
            )
            print(json.dumps(res))
        elif action == "calculate_level":
            res = GamificationRulesEngine.calculate_level(payload.get("total_xp", 0))
            print(json.dumps(res))
