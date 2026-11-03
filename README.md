# Shiraz University • Fall 2026 • Systems Analysis and Design
## Integrating AI into Applications — Django + React + Gemini AI Core

This repository implements the complete **Systems Analysis and Design (SAD) Fall 2026** full-stack web application and design artifacts:

1. **Flagship Django + React Gamified & Language Learning Platform** (combining **Project 05: Gamified Learning Application** and **Project 08: Language Learning Application**, the two Django-recommended blueprints in the course specification):
   - **UC1 (Placement Test & Onboarding — LLM)**: Adaptive 4-question placement assessment generated via server-side `gemini-3.8-flash` that sets starting skill/CEFR level and awards initial XP.
   - **UC2 & UC3 (Interactive Lessons, Validated Quizzes, Written-Answer AI Judge & Deterministic Rules Engine)**:
     - Pure Python `GamificationRulesEngine` (`backend/core/rules_engine.py`) calculates accuracy XP, perfect quiz bonuses, daily streak multipliers, streak freezes, level progression curves, and achievement badge unlocks.
     - Server-side **Written-Answer AI Judge** grades short-answer responses with partial credit (`0–100`), mistake categorization, and polished phrasing.
     - **Rewards Shop** for spending earned Gems on Streak Freezes, Avatars, and Themes.
     - **"Make It Yours" Creative Direction**: **Simorgh Jr. (AI Study Pet Companion)** with LLM-written personality reactions tied to learner habits and weak topics.
   - **UC4 (Adaptive Daily Quests & SM-2 Spaced Repetition Flashcards — LLM)**:
     - Personalized daily quests generated from recent quiz mistakes and weak topics.
     - Pure Python **SuperMemo-2 (`SM2SpacedRepetitionScheduler`)** spaced-repetition engine scheduling recall intervals (`I`), repetitions (`n`), and easiness factors (`EF >= 1.3`) with Browser Web Speech API Text-to-Speech (TTS).
   - **UC5 (Multi-Style AI Tutor & "Explain It Differently" — Project 04 & 05)**:
     - Explains any confusing concept or quiz mistake in `Simple`, `Analogy`, `Story`, `Step-by-Step`, `Deeper`, or `Teach-Back` style grounded in the learner's personal hobbies, with non-spoiling Socratic hints and 2 quick comprehension checks.
   - **UC6 (Friends, Weekly Leagues & AI Role-Play Conversation Partner)**:
     - Emerald League leaderboard + interactive CEFR role-play conversations with inline gentle corrections.
   - **UC7 (Teacher AI Course & Deck Authoring Studio — LLM)**:
     - Drafts full lessons, flashcards, and validated 4-option quizzes from syllabus notes, verified by `AIOutputQualityGuard`.
   - **UC8 (Admin Analytics, AI Cost/Latency Telemetry & Account Moderation)**:
     - Tracks every AI request, latency (`ms`), token count, estimated USD cost, cache status, and allows blocking/unblocking abusive accounts.

2. **All 9 Project Proposals Interactive AI Sandbox (`9 Proposals` tab)**:
   - Interactive execution of the LLM Core, UC1–UC8 breakdown, and the **5 Mandatory Design Document Answers** (Page 22: *1. The Problem, 2. The Contract, 3. The Checks, 4. The Failure Plan, 5. The Proof*) for all 9 proposals (`01 Smart Trip Planner` through `09 Digital Closet & Outfit Planner`).

3. **Systems Analysis & UML Architecture + Automated Unit Tests (`Design & Admin` tab)**:
   - Interactive **UML Sequence Diagram**, **UML Use Case Diagram**, **UML Class Diagram**, and **Django ORM / SQL Schema**.
   - Live execution of `python3 backend/core/tests.py` testing XP/Level rules, streak freezes, SM-2 math, and mocked LLM Quality Guard validation.

---

## Quick Start Commands

```bash
# Start full-stack server (React + Express/Python Bridge + Server-Side Gemini API on port 3000)
npm run dev

# Run automated Python Backend Unit Tests (Gamification Rules, SM-2 Scheduler, Quality Guard)
npm run test:backend
# or directly:
python3 backend/core/tests.py
```
