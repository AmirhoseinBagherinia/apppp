#!/usr/bin/env python3
"""
Automated Unit & Integration Tests for Django Backend Core Logic
Shiraz University • Fall 2026 • Systems Analysis and Design
Tests:
  1. Gamification XP, Level Thresholds, Daily Streaks & Freeze Logic (Project 05)
  2. Achievement Badge Unlocking Rules Engine (Project 05)
  3. SM-2 Spaced Repetition Scheduler Math & Bounds (Project 08)
  4. AI Output Quality Guard & Mocked LLM Pipeline Validation (Ground Rules Page 22/23)
"""

import json
import sys
import unittest
from rules_engine import (
    GamificationRulesEngine,
    SM2SpacedRepetitionScheduler,
    AIOutputQualityGuard,
)


class TestGamificationRulesEngine(unittest.TestCase):
    def test_level_progression_thresholds(self):
        lvl1 = GamificationRulesEngine.calculate_level(0)
        self.assertEqual(lvl1["level"], 1)
        self.assertEqual(lvl1["title"], "Novice Explorer")
        self.assertEqual(lvl1["xp_to_next_level"], 100)

        lvl3 = GamificationRulesEngine.calculate_level(275)
        self.assertEqual(lvl3["level"], 3)
        self.assertEqual(lvl3["title"], "Code Tactician")
        self.assertEqual(lvl3["progress_percent"], 10)

        max_lvl = GamificationRulesEngine.calculate_level(2500)
        self.assertEqual(max_lvl["level"], 7)
        self.assertEqual(max_lvl["progress_percent"], 100)

    def test_perfect_lesson_award_and_badge_unlock(self):
        result = GamificationRulesEngine.award_lesson_completion(
            current_xp=80,
            current_gems=20,
            streak_days=3,
            correct_count=4,
            total_questions=4,
            existing_badges=[],
            stats={"lessons_completed": 0, "perfect_quizzes": 0, "streak_days": 3},
        )
        # Base 50 + Perfect 30 + Streak (3*5=15) + Badges (first_step 25 + streak_3 40 + perfect_score 50 = 115) = 210 XP
        self.assertEqual(result["breakdown"]["accuracy_xp"], 50)
        self.assertEqual(result["breakdown"]["perfect_bonus"], 30)
        self.assertEqual(result["breakdown"]["streak_bonus"], 15)
        self.assertEqual(result["earned_xp"], 210)
        self.assertTrue(result["leveled_up"])
        unlocked_ids = [b["id"] for b in result["newly_unlocked_badges"]]
        self.assertIn("first_step", unlocked_ids)
        self.assertIn("streak_3", unlocked_ids)
        self.assertIn("perfect_score", unlocked_ids)

    def test_streak_continuation_and_freeze(self):
        inc = GamificationRulesEngine.update_streak(4, "2026-11-01", "2026-11-02", False)
        self.assertEqual(inc["streak_days"], 5)
        self.assertEqual(inc["status"], "incremented")

        frozen = GamificationRulesEngine.update_streak(5, "2026-10-31", "2026-11-02", True)
        self.assertEqual(frozen["streak_days"], 5)
        self.assertEqual(frozen["status"], "saved_by_freeze")
        self.assertTrue(frozen["freeze_consumed"])

        reset = GamificationRulesEngine.update_streak(5, "2026-10-25", "2026-11-02", True)
        self.assertEqual(reset["streak_days"], 1)
        self.assertEqual(reset["status"], "reset")


class TestSM2SpacedRepetition(unittest.TestCase):
    def test_sm2_first_and_second_repetitions(self):
        r1 = SM2SpacedRepetitionScheduler.schedule_card(5, 0, 0, 2.5, "2026-11-02")
        self.assertEqual(r1["repetitions"], 1)
        self.assertEqual(r1["interval_days"], 1)
        self.assertEqual(r1["easiness_factor"], 2.6)
        self.assertEqual(r1["next_review_date"], "2026-11-03")

        r2 = SM2SpacedRepetitionScheduler.schedule_card(5, r1["repetitions"], r1["interval_days"], r1["easiness_factor"], "2026-11-03")
        self.assertEqual(r2["repetitions"], 2)
        self.assertEqual(r2["interval_days"], 6)
        self.assertEqual(r2["next_review_date"], "2026-11-09")

    def test_sm2_lapse_resets_interval_and_respects_ef_floor(self):
        lapsed = SM2SpacedRepetitionScheduler.schedule_card(1, 4, 15, 1.35, "2026-11-02")
        self.assertEqual(lapsed["repetitions"], 0)
        self.assertEqual(lapsed["interval_days"], 1)
        self.assertEqual(lapsed["easiness_factor"], 1.3)
        self.assertEqual(lapsed["mastery_state"], "relearning")


class TestAIOutputQualityGuardWithMockedLLM(unittest.TestCase):
    def test_valid_and_invalid_mocked_llm_questions(self):
        mocked_llm_payload = [
            {
                "question": "In Django REST Framework, which component converts complex model instances into native Python datatypes?",
                "options": ["Serializer", "Middleware", "Migration", "Signal"],
                "correctIndex": 0,
                "explanation": "Serializers convert queryset and model instances into native Python datatypes for JSON rendering.",
            },
            {
                "question": "Invalid question with duplicate options",
                "options": ["Same", "Same", "Other", "Another"],
                "correctIndex": 0,
                "explanation": "Should be rejected by Quality Guard.",
            },
        ]
        report = AIOutputQualityGuard.validate_quiz_questions(mocked_llm_payload)
        self.assertEqual(report["valid_count"], 1)
        self.assertEqual(report["rejected_count"], 1)
        self.assertEqual(len(report["validated_questions"]), 1)


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromModule(__import__(__name__))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
