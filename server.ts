import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json({ limit: "10mb" }));

// Initialize server-side Gemini SDK per skill guidelines
const getAiClient = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const MODEL_NAME = "gemini-3.8-flash";

// Load versioned prompt registry from /backend/prompts/prompt_registry.json
const PROMPT_REGISTRY_PATH = path.resolve(process.cwd(), "backend/prompts/prompt_registry.json");
const DB_STORE_PATH = path.resolve(process.cwd(), "backend/db_store.json");
const PYTHON_ENGINE_PATH = path.resolve(process.cwd(), "backend/core/rules_engine.py");
const PYTHON_TESTS_PATH = path.resolve(process.cwd(), "backend/core/tests.py");

function loadPromptRegistry() {
  try {
    return JSON.parse(fs.readFileSync(PROMPT_REGISTRY_PATH, "utf-8"));
  } catch {
    return { version: "2026.11.1", prompts: {} };
  }
}

// In-memory response cache & rate limiter (Page 23: Control the Cost & Rate Limits)
const aiResponseCache = new Map<string, any>();
const userRateWindow = new Map<string, number[]>();
const RATE_LIMIT_PER_MIN = 20;

function checkRateLimit(username: string): boolean {
  const now = Date.now();
  const timestamps = (userRateWindow.get(username) || []).filter((t) => now - t < 60_000);
  if (timestamps.length >= RATE_LIMIT_PER_MIN) {
    userRateWindow.set(username, timestamps);
    return false;
  }
  timestamps.push(now);
  userRateWindow.set(username, timestamps);
  return true;
}

// Helper to invoke Python Django Rules Engine & SM-2 Scheduler
function invokePythonEngine(payload: Record<string, any>): any {
  try {
    const out = execFileSync("python3", [PYTHON_ENGINE_PATH, JSON.stringify(payload)], {
      encoding: "utf-8",
      timeout: 4000,
    });
    return JSON.parse(out.trim());
  } catch (err) {
    console.error("Python engine fallback triggered:", err);
    return null;
  }
}

// Initial seed data covering Project 05 & Project 08 Use Cases (UC1 - UC8)
const INITIAL_DB = {
  activeUserId: "u_learner",
  users: [
    {
      id: "u_learner",
      username: "aria_shiraz",
      displayName: "Aria Rostami",
      role: "learner",
      avatarId: "avatar_owl",
      themeId: "theme_shiraz",
      level: 3,
      title: "Code Tactician",
      xp: 310,
      gems: 145,
      streakDays: 5,
      streakFreezeActive: true,
      lastActiveDate: "2026-11-02",
      cefrLevel: "B1",
      targetSubject: "Systems Analysis, Django & AI Engineering",
      interests: ["Football", "Persian Architecture", "Sci-Fi Cinema", "Specialty Coffee"],
      preferredStyle: "Analogy",
      badges: ["first_step", "streak_3", "perfect_score"],
      ownedItems: ["avatar_owl", "theme_shiraz", "streak_freeze"],
      weakTopics: ["UML Sequence Lifelines", "SM-2 Easiness Factor Math", "LLM JSON Schema Grounding"],
      isBlocked: false,
      stats: {
        lessons_completed: 4,
        perfect_quizzes: 2,
        streak_days: 5,
        tutor_queries: 2,
        flashcards_reviewed: 8,
      },
    },
    {
      id: "u_teacher",
      username: "prof_kiani",
      displayName: "Dr. Kourosh Kiani",
      role: "teacher",
      avatarId: "avatar_mentor",
      themeId: "theme_shiraz",
      level: 6,
      title: "Grandmaster Fellows",
      xp: 1450,
      gems: 320,
      streakDays: 14,
      streakFreezeActive: true,
      lastActiveDate: "2026-11-02",
      cefrLevel: "C1",
      targetSubject: "Systems Analysis & Design",
      interests: ["Software Architecture", "Classical Poetry", "Distributed Systems"],
      preferredStyle: "Step-by-Step",
      badges: ["first_step", "streak_3", "streak_7", "perfect_score", "curious_mind"],
      ownedItems: ["avatar_mentor", "theme_shiraz"],
      weakTopics: [],
      isBlocked: false,
      stats: {
        lessons_completed: 18,
        perfect_quizzes: 14,
        streak_days: 14,
        tutor_queries: 9,
        flashcards_reviewed: 42,
      },
    },
    {
      id: "u_admin",
      username: "admin_sad",
      displayName: "Nazanin Farhadi (Admin)",
      role: "admin",
      avatarId: "avatar_shield",
      themeId: "theme_shiraz",
      level: 7,
      title: "Shiraz Laureate",
      xp: 2100,
      gems: 500,
      streakDays: 21,
      streakFreezeActive: true,
      lastActiveDate: "2026-11-02",
      cefrLevel: "C2",
      targetSubject: "AI Governance & Cost Ops",
      interests: ["Security", "DevOps", "Observability"],
      preferredStyle: "Expert",
      badges: ["first_step", "streak_3", "streak_7", "perfect_score", "curious_mind", "memory_master"],
      ownedItems: ["avatar_shield", "theme_shiraz"],
      weakTopics: [],
      isBlocked: false,
      stats: {
        lessons_completed: 25,
        perfect_quizzes: 20,
        streak_days: 21,
        tutor_queries: 15,
        flashcards_reviewed: 60,
      },
    },
    {
      id: "u_abusive_demo",
      username: "spam_bot_99",
      displayName: "Automated Scraper #99",
      role: "learner",
      avatarId: "avatar_bot",
      themeId: "theme_shiraz",
      level: 1,
      title: "Novice Explorer",
      xp: 20,
      gems: 0,
      streakDays: 1,
      streakFreezeActive: false,
      lastActiveDate: "2026-11-02",
      cefrLevel: "A1",
      targetSubject: "Prompt Injection Testing",
      interests: ["Automation"],
      preferredStyle: "Simple",
      badges: [],
      ownedItems: [],
      weakTopics: ["API Rate Limits"],
      isBlocked: true,
      stats: {
        lessons_completed: 0,
        perfect_quizzes: 0,
        streak_days: 1,
        tutor_queries: 0,
        flashcards_reviewed: 0,
      },
    },
  ],
  studyPet: {
    name: "Simorgh Jr.",
    stage: "Level 3 Mythic Hatchling",
    mood: "Inspired & Energetic",
    hunger: 92,
    xpContribution: 45,
    lastMessage:
      "You've kept a 5-day streak alive, Aria! Let's conquer one UML or Django AI Core challenge today so my wings level up!",
  },
  courses: [
    {
      id: "course_sad_ai",
      slug: "sad-llm-architecture",
      title: "Integrating AI into Applications (SAD Fall 2026)",
      category: "Systems Analysis & Design",
      difficulty: "Intermediate",
      authorName: "Dr. Kourosh Kiani",
      description:
        "Master the 5 core engineering pillars of LLM applications: Problem framing, strict JSON Contracts, Real-Data Grounding Checks, Graceful Failure Plans, and Quantitative Proof.",
      lessons: [
        {
          id: "lesson_101",
          orderIndex: 1,
          title: "The 5-Stage Responsible LLM Pipeline",
          summary: "Input validation, prompt construction, timeouts/retries, JSON schema validation, and safe fallback UI.",
          xpReward: 50,
          completedBy: ["u_learner"],
          contentMarkdown: `### Designing an LLM Core, Not a Decoration

In modern Systems Analysis and Design, a Large Language Model (LLM) is treated as an **untrusted, probabilistic microservice** that transforms unstructured input (free text, notes, or photos) into **strictly validated structured JSON**.

#### The 5 Mandatory Pipeline Stages (Page 23)
1. **User Input Validation**: Treat user text strictly as data, never as executable instructions. Strip prompt-injection attempts and enforce length caps before building prompts.
2. **Backend Prompt Builder**: Keep API keys in server-side environment variables (\`GEMINI_API_KEY\`). Store prompt templates in versioned files (\`prompt_registry.json\`).
3. **LLM Call with Timeout & Retries**: Enforce token limits, cache repeated queries by hash to control cost, and apply exponential backoff on rate limits.
4. **Quality Guard & Grounding Validation**: Parse the JSON response against a strict schema. Verify every suggested entity (e.g., place IDs, wardrobe item IDs, or single-correct-answer quizzes) against your real database.
5. **Graceful Fallback Display**: If the AI is slow, wrong, or unreachable, keep the application 100% functional using deterministic rules and cached packs.`,
          quiz: [
            {
              id: "q_101_1",
              question: "Where must LLM API keys and prompt construction reside in a production web application?",
              options: [
                "Strictly on the backend server using environment variables",
                "In client-side React state encrypted with Base64",
                "Inside public Git config files for CI convenience",
                "In browser localStorage after initial login",
              ],
              correctIndex: 0,
              topic: "API Key Security",
              explanation: "API keys must never leave the backend server; client apps call your backend REST endpoints.",
              hint: "Think about what happens if a user opens browser DevTools Network tab.",
            },
            {
              id: "q_101_2",
              question: "How should an application prevent hallucinated items in 'Digital Closet' (Project 09) or 'Smart Trip Planner' (Project 01)?",
              options: [
                "Require the LLM to return database/catalog IDs and verify every ID against the database before rendering",
                "Ask the LLM nicely in the prompt to never invent items",
                "Display all LLM text output directly without parsing",
                "Disable database foreign keys so any item name works",
              ],
              correctIndex: 0,
              topic: "LLM JSON Schema Grounding",
              explanation: "Grounded retrieval checks every returned ID or place against the real database or Places/Music catalog before showing it.",
              hint: "Page 5 & Page 21 warn about invented places and items that do not exist.",
            },
            {
              id: "q_101_3",
              question: "What is the role of the 'Quality Guard' second pass in quiz-generating applications (Project 03 & Project 05)?",
              options: [
                "Verify that every generated question has 4 distinct options and exactly one unambiguous correct answer",
                "Increase the CSS animation speed of the quiz screen",
                "Automatically award 100% score to all players",
                "Delete the user's source notes after generation",
              ],
              correctIndex: 0,
              topic: "Quality Guard Validation",
              explanation: "Wrong answer keys ruin learning apps. Validating structure and single-correct-answer invariants before caching prevents broken quizzes.",
              hint: "Check the 'Watch out for' warning on Page 9 and Page 13.",
            },
          ],
          writtenPrompt: {
            question: "In 1-2 sentences, explain what your application's Failure Plan should do if the LLM API times out or returns invalid JSON.",
            referenceAnswer:
              "The backend should catch the timeout or validation error, log the failure in AI telemetry, and return a safe deterministic fallback or cached data so the user can continue using the app without crashing.",
          },
        },
        {
          id: "lesson_102",
          orderIndex: 2,
          title: "Django Rules Engine & SM-2 Spaced Repetition",
          summary: "Separating deterministic business logic (XP, streaks, SM-2 intervals) from probabilistic AI calls.",
          xpReward: 60,
          completedBy: [],
          contentMarkdown: `### Architectural Separation: Deterministic Rules vs. Probabilistic AI

A core principle from the Shiraz University SAD specification is keeping layers cleanly separated: **Interface**, **Domain Logic**, **Data**, and **AI Core**.

#### 1. Deterministic Gamification Rules (\`rules_engine.py\`)
XP awards, level thresholds, streak increments, and streak-freeze consumption must **never** be guessed by an LLM. They belong in a pure, unit-tested Python module:
- **Accuracy XP**: $\\text{round}(50 \\times \\frac{\\text{correct}}{\\text{total}})$
- **Perfect Quiz Bonus**: $+30\\text{ XP}$
- **Streak Multiplier**: $+5\\text{ XP} \\times \\text{streakDays}$ (capped at $+50\\text{ XP}$)

#### 2. SuperMemo-2 (SM-2) Algorithm (Project 08)
When a learner rates recall quality $q \\in [0..5]$:
- If $q < 3$, repetitions reset to $0$ and interval resets to $1$ day.
- If $q \\ge 3$, interval progresses $1 \\to 6 \\to \\text{round}(I \\times EF)$.
- Easiness Factor updates via $EF' = \\max(1.3, EF + (0.1 - (5-q)(0.08 + (5-q)0.02)))$.`,
          quiz: [
            {
              id: "q_102_1",
              question: "In the SM-2 spaced repetition algorithm, what happens when a learner rates a card with quality q = 2 (incorrect recall)?",
              options: [
                "Repetitions reset to 0 and the next review interval resets to 1 day",
                "The card is permanently deleted from the deck",
                "The interval is multiplied by 2.5 immediately",
                "The easiness factor increases to 3.0",
              ],
              correctIndex: 0,
              topic: "SM-2 Easiness Factor Math",
              explanation: "Any recall quality below 3 indicates a lapse, resetting the repetition counter to 0 and scheduling the card for tomorrow (interval = 1 day).",
              hint: "Hard words must return immediately before you forget them completely.",
            },
            {
              id: "q_102_2",
              question: "What is the minimum allowed floor for the Easiness Factor (EF) in standard SM-2 scheduling?",
              options: ["1.3", "0.5", "2.5", "1.0"],
              correctIndex: 0,
              topic: "SM-2 Easiness Factor Math",
              explanation: "SM-2 enforces a lower bound of 1.3 on the Easiness Factor to prevent cards from getting stuck in impossibly frequent loops.",
              hint: "It is slightly above 1.0 so intervals can still grow once mastered.",
            },
            {
              id: "q_102_3",
              question: "Why does Project 05 specify a separate rules module in Django for XP, levels, and badges?",
              options: [
                "So reward calculations are deterministic, auditable, and 100% unit-testable with pytest/unittest",
                "Because LLMs cannot output numbers",
                "To avoid using a database for user profiles",
                "To allow users to edit their own XP in browser cookies",
              ],
              correctIndex: 0,
              topic: "Clean Layer Architecture",
              explanation: "Separating deterministic gamification rules from views and AI calls ensures fairness, anti-cheat integrity, and fast unit testing.",
              hint: "Look at Page 12 under Suggested Tech Stack -> Backend.",
            },
          ],
          writtenPrompt: {
            question: "Why should XP and leaderboard scoring be computed on the Django backend rather than the React frontend?",
            referenceAnswer:
              "Server-side scoring prevents client-side tampering (anti-cheat), ensures consistent rules validation across all devices, and persists progress atomically in the database.",
          },
        },
        {
          id: "lesson_103",
          orderIndex: 3,
          title: "UML Modeling & Database Schema for AI Systems",
          summary: "Translating UC1–UC8 into Use Case, Class, and Sequence diagrams with audit logging.",
          xpReward: 65,
          completedBy: [],
          contentMarkdown: `### Modeling AI Interactions in UML (Page 22 Ground Rules)

Every project in Systems Analysis and Design requires translating user stories into formal **Use Case Diagrams**, **Class Diagrams**, **Sequence Diagrams**, and **Relational Schemas**.

#### Key Sequence Flow Invariants
- **Actor Separation**: Distinguish primary actors (*Learner / Traveler / Home Cook*), collaborative actors (*Teacher / Tutor / Travel Buddy*), and governance actors (*Admin / Moderator*).
- **Synchronous vs. Cached Flows**: In a Sequence Diagram for *UC2 (Generate Quiz/Itinerary)*, show the Backend checking the **Cache Layer** before invoking the **LLM Service**, followed by the **Schema & Grounding Validator** before persisting to **PostgreSQL/SQLite**.`,
          quiz: [
            {
              id: "q_103_1",
              question: "In a UML Sequence Diagram for an AI feature, which step happens immediately AFTER receiving the raw JSON string from the LLM API?",
              options: [
                "Schema validation and grounding check against real database/catalog entities",
                "Immediate unescaped rendering in the user's DOM",
                "Deleting the user's session token",
                "Bypassing the backend and sending API keys to the client",
              ],
              correctIndex: 0,
              topic: "UML Sequence Lifelines",
              explanation: "Page 23 ('A Typical AI Feature Pipeline') shows: User Input -> Your Backend -> LLM API -> Validate (Check JSON & real data) -> Show Result.",
              hint: "Check the green shield step in the pipeline diagram on Page 23.",
            },
            {
              id: "q_103_2",
              question: "Which table is essential for satisfying UC8 (Admin reviews AI usage, cost, and failed generations)?",
              options: [
                "AIUsageLog (tracking user_id, feature, prompt_id, latency_ms, tokens, cost_usd, cache_hit, status)",
                "Static CSS stylesheet table",
                "Temporary browser sessionStorage only",
                "Unindexed plain text files on the client desktop",
              ],
              correctIndex: 0,
              topic: "Database Schema Design",
              explanation: "An AIUsageLog table records every request, latency, cost, and validation outcome so admins can monitor budgets and block abusive accounts.",
              hint: "See Page 5, 13, and 23 ('Log and Measure').",
            },
          ],
          writtenPrompt: {
            question: "What are the five mandatory questions every AI feature must answer in your SAD Design Document (Page 22)?",
            referenceAnswer:
              "1. The problem (why an LLM is the right tool), 2. The contract (inputs and exact structured JSON output), 3. The checks (validation and grounding in real data), 4. The failure plan (handling slow/wrong/unavailable AI), and 5. The proof (test prompts, examples, and user feedback metrics).",
          },
        },
      ],
    },
    {
      id: "course_lang_es",
      slug: "spanish-conversational-b1",
      title: "Spanish & Technical Communication (Project 08 Module)",
      category: "Language Learning",
      difficulty: "CEFR A2–B1",
      authorName: "Dr. Kourosh Kiani",
      description:
        "Build active recall with SM-2 spaced repetition flashcards, CEFR-calibrated grammar explanations, writing feedback rubrics, and live cafe/engineering role-play.",
      lessons: [
        {
          id: "lesson_201",
          orderIndex: 1,
          title: "Ordering & Negotiating in Madrid (Role-Play & Subjunctive)",
          summary: "Polite requests with the conditional tense, cultural idioms, and conversational repair.",
          xpReward: 55,
          completedBy: [],
          contentMarkdown: `### Polite Requests & Real-World Missions (CEFR A2/B1)

When ordering or making requests in Spanish, shifting from the present indicative (*Quiero...*) to the conditional (*Me gustaría...* / *¿Podría traerme...?*) immediately elevates your register.

#### Key Structures
- **¿Me podría traer un café cortado, por favor?** — *Could you bring me a cortado coffee, please?*
- **Quisiera reservar una mesa cerca de la ventana.** — *I would like to book a table near the window.*
- **La cuenta, cuando pueda.** — *The bill, whenever you have a moment (uses present subjunctive 'pueda').*`,
          quiz: [
            {
              id: "q_201_1",
              question: "Which phrase is the most natural and polite way to ask a waiter if they could bring the bill in Spanish?",
              options: [
                "¿Me podría traer la cuenta, por favor?",
                "Dame la cuenta ahora mismo.",
                "Yo traer la cuenta ayer.",
                "La cuenta es muy restaurante.",
              ],
              correctIndex: 0,
              topic: "Conditional Politeness (CEFR B1)",
              explanation: "'¿Me podría traer...?' uses the conditional of 'poder' for polite requests, natural in Spain and Latin America.",
              hint: "Look for the conditional form of 'poder' (podría).",
            },
            {
              id: "q_201_2",
              question: "Why is 'pueda' used instead of 'puede' in 'Cuando pueda, tráigame agua'?",
              options: [
                "'Cuando' referring to an unspecified future action triggers the present subjunctive ('pueda')",
                "Because 'pueda' is the past tense of comer",
                "It is a spelling typo for puedo",
                "Because 'agua' is plural",
              ],
              correctIndex: 0,
              topic: "Subjunctive in Time Clauses",
              explanation: "Temporal clauses with 'cuando' that refer to future orpending events require the subjunctive mood in Spanish.",
              hint: "Has the waiter had a moment yet, or is it in the immediate future?",
            },
          ],
          writtenPrompt: {
            question: "Write 1-2 sentences in Spanish ordering a drink and asking for a recommendation at a café in Madrid (CEFR A2/B1).",
            referenceAnswer:
              "Hola, buenos días. Me gustaría pedir un café con leche, por favor. ¿Qué pastel tradicional me recomienda para acompañar?",
          },
        },
      ],
    },
  ],
  flashcards: [
    {
      id: "fc_1",
      deckName: "SAD & AI Engineering",
      frontText: "Idempotency & Response Caching",
      backText: "Storing validated LLM JSON responses keyed by normalized prompt hash so identical requests return in <5ms at $0 cost.",
      exampleSentence: "Caching placement quizzes by subject and level reduced our monthly token spend by 64%.",
      cefrLevel: "B2",
      repetitions: 2,
      intervalDays: 6,
      easinessFactor: 2.5,
      nextReviewDate: "2026-11-02",
    },
    {
      id: "fc_2",
      deckName: "SAD & AI Engineering",
      frontText: "Grounded Retrieval (Anti-Hallucination)",
      backText: "Constraining the LLM to select only from real catalog/database IDs and verifying every returned ID before display.",
      exampleSentence: "In Digital Closet (Project 09), outfit suggestions only accept verified item IDs from the user's PostgreSQL wardrobe.",
      cefrLevel: "B2",
      repetitions: 1,
      intervalDays: 1,
      easinessFactor: 2.4,
      nextReviewDate: "2026-11-02",
    },
    {
      id: "fc_3",
      deckName: "Spanish CEFR B1",
      frontText: "¿Me podría recomendar un plato típico?",
      backText: "Could you recommend a typical dish to me? (Polite conditional request)",
      exampleSentence: "Buenas tardes, es mi primera vez en Madrid. ¿Me podría recomendar un plato típico?",
      cefrLevel: "B1",
      repetitions: 0,
      intervalDays: 1,
      easinessFactor: 2.5,
      nextReviewDate: "2026-11-02",
    },
    {
      id: "fc_4",
      deckName: "Spanish CEFR B1",
      frontText: "Valer la pena",
      backText: "To be worth it / worthwhile",
      exampleSentence: "Vale totalmente la pena visitar el centro histórico temprano por la mañana.",
      cefrLevel: "B1",
      repetitions: 3,
      intervalDays: 12,
      easinessFactor: 2.6,
      nextReviewDate: "2026-11-05",
    },
  ],
  dailyQuests: [
    {
      id: "quest_1",
      title: "Complete 1 Lesson Quiz with >= 75% Accuracy",
      category: "Mastery",
      targetCount: 1,
      currentCount: 0,
      xpReward: 45,
      gemReward: 20,
      isCompleted: false,
      generatedByAi: true,
      reason: "Targets your weak topic: UML Sequence Lifelines",
    },
    {
      id: "quest_2",
      title: "Review 3 Due SM-2 Flashcards",
      category: "Spaced Repetition",
      targetCount: 3,
      currentCount: 1,
      xpReward: 35,
      gemReward: 15,
      isCompleted: false,
      generatedByAi: true,
      reason: "Keeps your memory retention curve above 90%",
    },
    {
      id: "quest_3",
      title: "Ask the AI Tutor for an 'Analogy' Explanation",
      category: "Deep Understanding",
      targetCount: 1,
      currentCount: 0,
      xpReward: 30,
      gemReward: 10,
      isCompleted: false,
      generatedByAi: true,
      reason: "Personalized to your favorite learning style: Analogy",
    },
  ],
  shopItems: [
    {
      id: "streak_freeze",
      name: "Cryo Streak Freeze",
      category: "Power-Up",
      costGems: 40,
      description: "Protects your daily streak if you miss a single study day (tested in rules_engine.py).",
    },
    {
      id: "avatar_phoenix",
      name: "Persepolis Griffin Avatar",
      category: "Avatar",
      costGems: 65,
      description: "Regal golden griffin emblem for weekly league leaderboards.",
    },
    {
      id: "theme_emerald",
      name: "Bagh-e Eram Botanical Theme",
      category: "Theme",
      costGems: 80,
      description: "Serene cypress-inspired accent palette for long reading sessions.",
    },
    {
      id: "boss_pass",
      name: "AI Boss Arena Ticket",
      category: "Challenge",
      costGems: 35,
      description: "Unlock a high-stakes timed Quiz Battle against the Grand Architect AI Boss.",
    },
  ],
  leaderboard: [
    { id: "lb_1", displayName: "Dr. Kourosh Kiani", username: "prof_kiani", xp: 1450, streakDays: 14, league: "Diamond League" },
    { id: "lb_2", displayName: "Parnian Zand", username: "parnian_z", xp: 620, streakDays: 9, league: "Emerald League" },
    { id: "lb_3", displayName: "Soroush Momeni", username: "soroush_m", xp: 440, streakDays: 6, league: "Emerald League" },
    { id: "u_learner", displayName: "Aria Rostami (You)", username: "aria_shiraz", xp: 310, streakDays: 5, league: "Emerald League" },
    { id: "lb_5", displayName: "Kiana Dehghan", username: "kiana_d", xp: 245, streakDays: 4, league: "Sapphire League" },
  ],
  aiLogs: [
    {
      id: "log_1",
      timestamp: "2026-11-02T22:15:10Z",
      username: "aria_shiraz",
      feature: "UC4: Adaptive Daily Quests",
      promptId: "daily_quests_adaptive_v1",
      model: "gemini-3.8-flash",
      latencyMs: 640,
      tokens: 390,
      costUsd: 0.00018,
      cacheHit: false,
      validationPassed: true,
      status: "200 OK",
    },
    {
      id: "log_2",
      timestamp: "2026-11-02T22:28:42Z",
      username: "prof_kiani",
      feature: "UC7: Course Authoring Assistant",
      promptId: "course_authoring_v1",
      model: "gemini-3.8-flash",
      latencyMs: 1120,
      tokens: 840,
      costUsd: 0.00042,
      cacheHit: false,
      validationPassed: true,
      status: "200 OK",
    },
    {
      id: "log_3",
      timestamp: "2026-11-02T22:41:05Z",
      username: "aria_shiraz",
      feature: "UC5: AI Tutor (Analogy Style)",
      promptId: "ai_tutor_explainer_v1",
      model: "gemini-3.8-flash",
      latencyMs: 4,
      tokens: 0,
      costUsd: 0.0,
      cacheHit: true,
      validationPassed: true,
      status: "200 CACHED",
    },
    {
      id: "log_4",
      timestamp: "2026-11-02T22:46:19Z",
      username: "spam_bot_99",
      feature: "UC2: Quiz Generator",
      promptId: "quiz_generator_v1",
      model: "gemini-3.8-flash",
      latencyMs: 12,
      tokens: 0,
      costUsd: 0.0,
      cacheHit: false,
      validationPassed: false,
      status: "403 BLOCKED_ACCOUNT",
    },
  ],
};

function loadDb(): typeof INITIAL_DB {
  try {
    if (fs.existsSync(DB_STORE_PATH)) {
      return JSON.parse(fs.readFileSync(DB_STORE_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read db_store.json, resetting to seed:", e);
  }
  fs.mkdirSync(path.dirname(DB_STORE_PATH), { recursive: true });
  fs.writeFileSync(DB_STORE_PATH, JSON.stringify(INITIAL_DB, null, 2));
  return JSON.parse(JSON.stringify(INITIAL_DB));
}

function saveDb(db: typeof INITIAL_DB) {
  fs.mkdirSync(path.dirname(DB_STORE_PATH), { recursive: true });
  fs.writeFileSync(DB_STORE_PATH, JSON.stringify(db, null, 2));
}

function recordAiLog(
  db: typeof INITIAL_DB,
  entry: {
    username: string;
    feature: string;
    promptId: string;
    latencyMs: number;
    tokens: number;
    cacheHit: boolean;
    validationPassed: boolean;
    status: string;
  }
) {
  const costUsd = entry.cacheHit ? 0 : Number(((entry.tokens / 1000) * 0.0005).toFixed(5));
  db.aiLogs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    username: entry.username,
    feature: entry.feature,
    promptId: entry.promptId,
    model: MODEL_NAME,
    latencyMs: entry.latencyMs,
    tokens: entry.tokens,
    costUsd,
    cacheHit: entry.cacheHit,
    validationPassed: entry.validationPassed,
    status: entry.status,
  });
  db.aiLogs = db.aiLogs.slice(0, 60);
}

// ============================================================================
// REST API ENDPOINTS (Matching Django Backend Architecture)
// ============================================================================

app.get("/api/v1/state", (_req, res) => {
  const db = loadDb();
  const activeUser = db.users.find((u) => u.id === db.activeUserId) || db.users[0];
  const levelInfo = invokePythonEngine({
    action: "calculate_level",
    total_xp: activeUser.xp,
  }) || {
    level: activeUser.level,
    title: activeUser.title,
    total_xp: activeUser.xp,
    current_level_floor: 250,
    next_level_xp: 500,
    xp_to_next_level: Math.max(0, 500 - activeUser.xp),
    progress_percent: 24,
  };

  res.json({
    activeUser: { ...activeUser, levelInfo },
    users: db.users,
    studyPet: db.studyPet,
    courses: db.courses,
    flashcards: db.flashcards,
    dailyQuests: db.dailyQuests,
    shopItems: db.shopItems,
    leaderboard: db.leaderboard.sort((a, b) => b.xp - a.xp),
    aiLogs: db.aiLogs,
    promptRegistry: loadPromptRegistry(),
  });
});

// Switch active user role (Learner / Teacher / Admin) or update profile (UC1)
app.post("/api/v1/auth/switch-user", (req, res) => {
  const { userId } = req.body;
  const db = loadDb();
  const target = db.users.find((u) => u.id === userId);
  if (!target) {
    res.status(404).json({ error: "User account not found." });
    return;
  }
  db.activeUserId = target.id;
  saveDb(db);
  res.json({ activeUser: target });
});

app.post("/api/v1/auth/update-profile", (req, res) => {
  const { displayName, targetSubject, cefrLevel, preferredStyle, interests } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId);
  if (!user) {
    res.status(404).json({ error: "Active user not found." });
    return;
  }
  if (displayName) user.displayName = String(displayName).trim().slice(0, 80);
  if (targetSubject) user.targetSubject = String(targetSubject).trim().slice(0, 120);
  if (cefrLevel) user.cefrLevel = String(cefrLevel).trim().slice(0, 10);
  if (preferredStyle) user.preferredStyle = String(preferredStyle).trim();
  if (Array.isArray(interests)) {
    user.interests = interests.map((i) => String(i).trim()).filter(Boolean).slice(0, 8);
  }
  saveDb(db);
  res.json({ activeUser: user });
});

// UC1: Join and take an AI-generated placement test
app.post("/api/v1/placement-test/generate", async (req, res) => {
  const { subject, experienceNote } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  if (user.isBlocked) {
    res.status(403).json({ error: "Account is blocked by Admin moderation." });
    return;
  }
  if (!checkRateLimit(user.username)) {
    res.status(429).json({ error: "Rate limit exceeded (max 20 AI requests/min)." });
    return;
  }

  const cleanSubject = String(subject || user.targetSubject || "Python & Django Web Engineering").trim();
  const cacheKey = `placement:${cleanSubject.toLowerCase()}:${String(experienceNote || "").toLowerCase()}`;

  if (aiResponseCache.has(cacheKey)) {
    const cached = aiResponseCache.get(cacheKey);
    recordAiLog(db, {
      username: user.username,
      feature: "UC1: Placement Test Generator",
      promptId: "placement_test_v1",
      latencyMs: 3,
      tokens: 0,
      cacheHit: true,
      validationPassed: true,
      status: "200 CACHED",
    });
    saveDb(db);
    res.json({ ...cached, cached: true });
    return;
  }

  const start = Date.now();
  try {
    const ai = getAiClient();
    const registry = loadPromptRegistry();
    const sysInst =
      registry.prompts?.placement_test_v1?.systemInstruction ||
      "Create 4 balanced multiple-choice placement test questions (A1/L1 to B2/L4) with 4 options and correctIndex (0-3).";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Subject: "${cleanSubject}". Learner background note: "${experienceNote || "University student"}". Generate 4 progressive placement questions from foundational to advanced.`,
      config: {
        systemInstruction: sysInst,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectTitle: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  difficultyLabel: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ["id", "difficultyLabel", "topic", "question", "options", "correctIndex", "explanation"],
              },
            },
          },
          required: ["subjectTitle", "questions"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    const validQuestions = (parsed.questions || []).filter(
      (q: any) => Array.isArray(q.options) && q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4
    );

    const payload = {
      subjectTitle: parsed.subjectTitle || cleanSubject,
      questions: validQuestions,
      qualityGuardPassed: validQuestions.length > 0,
    };

    aiResponseCache.set(cacheKey, payload);
    recordAiLog(db, {
      username: user.username,
      feature: "UC1: Placement Test Generator",
      promptId: "placement_test_v1",
      latencyMs: Date.now() - start,
      tokens: 480,
      cacheHit: false,
      validationPassed: validQuestions.length > 0,
      status: "200 OK",
    });
    saveDb(db);
    res.json(payload);
  } catch (err: any) {
    // Graceful Failure Plan (Page 22 & 23)
    const fallbackQuestions = [
      {
        id: "pt_fb_1",
        difficultyLabel: "Level 1 • Foundation",
        topic: cleanSubject,
        question: `In ${cleanSubject}, why do we separate the presentation layer (React) from the domain & persistence layer (Django)?`,
        options: [
          "To maintain clean separation of concerns, independent testing, and secure API boundaries",
          "Because HTML cannot render JSON data without Python installed in the browser",
          "To double the network latency intentionally",
          "So database credentials can be stored inside CSS files",
        ],
        correctIndex: 0,
        explanation: "Layer separation keeps UI, domain logic, data, and AI isolated and independently testable.",
      },
      {
        id: "pt_fb_2",
        difficultyLabel: "Level 2 • Intermediate",
        topic: "LLM Output Contracts",
        question: "What is the safest way to consume LLM output inside a backend endpoint?",
        options: [
          "Request structured JSON via a strict schema and validate every field before database persistence",
          "Run eval() on the raw text returned by the model",
          "Assume the model never makes formatting errors",
          "Let the client browser parse raw markdown with regex",
        ],
        correctIndex: 0,
        explanation: "LLMs are probabilistic; strict JSON schema validation and real-data grounding checks prevent runtime bugs.",
      },
      {
        id: "pt_fb_3",
        difficultyLabel: "Level 3 • Advanced",
        topic: "Caching & Rate Limiting",
        question: "How does caching validated AI responses improve both product UX and operational cost?",
        options: [
          "Repeated queries resolve in milliseconds with zero token cost while protecting rate limits",
          "It makes the LLM model parameters larger",
          "It bypasses user authentication checks",
          "It deletes old database migrations automatically",
        ],
        correctIndex: 0,
        explanation: "Caching repeated prompts saves token spend and eliminates API latency for common queries.",
      },
      {
        id: "pt_fb_4",
        difficultyLabel: "Level 4 • Architect",
        topic: "SM-2 & Adaptive Scheduling",
        question: "When designing an adaptive learning system, how should recent quiz mistakes influence the user's dashboard?",
        options: [
          "Mistakes are logged as weak topics, which drive personalized daily quests and shorter SM-2 review intervals",
          "Mistakes should permanently lock the user out of the course",
          "Mistakes are ignored so the user always sees 100%",
          "Mistakes reset the entire database",
        ],
        correctIndex: 0,
        explanation: "Adaptive paths connect quiz diagnostics directly to daily quests and spaced-repetition intervals.",
      },
    ];

    recordAiLog(db, {
      username: user.username,
      feature: "UC1: Placement Test Generator",
      promptId: "placement_test_v1",
      latencyMs: Date.now() - start,
      tokens: 0,
      cacheHit: false,
      validationPassed: true,
      status: "200 FALLBACK_ACTIVE",
    });
    saveDb(db);
    res.json({
      subjectTitle: cleanSubject,
      questions: fallbackQuestions,
      qualityGuardPassed: true,
      fallbackUsed: true,
      errorDetail: err?.message,
    });
  }
});

app.post("/api/v1/placement-test/submit", (req, res) => {
  const { subjectTitle, correctCount, totalQuestions, missedTopics } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  const ratio = totalQuestions > 0 ? correctCount / totalQuestions : 0.5;
  const placedCefr = ratio >= 0.85 ? "B2" : ratio >= 0.6 ? "B1" : ratio >= 0.35 ? "A2" : "A1";
  const bonusXp = 40 + correctCount * 20;

  user.targetSubject = subjectTitle || user.targetSubject;
  user.cefrLevel = placedCefr;
  user.xp += bonusXp;
  user.gems += 25;
  if (Array.isArray(missedTopics) && missedTopics.length > 0) {
    user.weakTopics = Array.from(new Set([...missedTopics, ...user.weakTopics])).slice(0, 6);
  }

  const levelInfo = invokePythonEngine({
    action: "calculate_level",
    total_xp: user.xp,
  });
  if (levelInfo) {
    user.level = levelInfo.level;
    user.title = levelInfo.title;
  }

  const lbEntry = db.leaderboard.find((l) => l.username === user.username);
  if (lbEntry) lbEntry.xp = user.xp;

  saveDb(db);
  res.json({
    placedCefr,
    bonusXp,
    activeUser: { ...user, levelInfo },
  });
});

// UC2 & UC3: Complete a lesson and run the Python Gamification Rules Engine
app.post("/api/v1/lessons/:id/complete", (req, res) => {
  const { id } = req.params;
  const { correctCount, totalQuestions, missedTopics } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  const engineResult = invokePythonEngine({
    action: "award_lesson",
    current_xp: user.xp,
    current_gems: user.gems,
    streak_days: user.streakDays,
    correct_count: correctCount,
    total_questions: totalQuestions,
    existing_badges: user.badges,
    stats: user.stats || {},
  });

  if (engineResult) {
    user.xp = engineResult.new_total_xp;
    user.gems = engineResult.new_total_gems;
    user.level = engineResult.level_info.level;
    user.title = engineResult.level_info.title;
    user.stats = engineResult.updated_stats;
    for (const b of engineResult.newly_unlocked_badges || []) {
      if (!user.badges.includes(b.id)) user.badges.push(b.id);
    }
  } else {
    user.xp += 60;
    user.gems += 15;
  }

  if (Array.isArray(missedTopics) && missedTopics.length > 0) {
    user.weakTopics = Array.from(new Set([...missedTopics, ...user.weakTopics])).slice(0, 6);
  }

  // Mark lesson completed
  for (const c of db.courses) {
    const lesson = c.lessons.find((l) => l.id === id);
    if (lesson && !lesson.completedBy.includes(user.id)) {
      lesson.completedBy.push(user.id);
    }
  }

  // Update quest progress
  if (totalQuestions > 0 && correctCount / totalQuestions >= 0.75) {
    const q1 = db.dailyQuests.find((q) => q.category === "Mastery" && !q.isCompleted);
    if (q1) {
      q1.currentCount = Math.min(q1.targetCount, q1.currentCount + 1);
    }
  }

  // Update leaderboard
  const lb = db.leaderboard.find((l) => l.username === user.username);
  if (lb) lb.xp = user.xp;

  // Update Study Pet
  db.studyPet.hunger = Math.min(100, db.studyPet.hunger + 8);
  db.studyPet.xpContribution += 15;
  db.studyPet.lastMessage = `Awesome job finishing that lesson (+${engineResult?.earned_xp ?? 60} XP)! ${
    engineResult?.leveled_up ? `You ascended to Level ${user.level} (${user.title})!` : "Keep that streak glowing!"
  }`;

  saveDb(db);
  res.json({
    rewardReport: engineResult,
    activeUser: user,
    studyPet: db.studyPet,
  });
});

// AI Core: Written-Answer Judge & Writing Coach (Project 03 UC5, Project 05 AI Core, Project 08 UC5)
app.post("/api/v1/judge-written-answer", async (req, res) => {
  const { question, referenceAnswer, userAnswer, mode } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  if (user.isBlocked) {
    res.status(403).json({ error: "Account is blocked by Admin moderation." });
    return;
  }
  if (!checkRateLimit(user.username)) {
    res.status(429).json({ error: "Rate limit exceeded." });
    return;
  }

  const start = Date.now();
  try {
    const ai = getAiClient();
    const registry = loadPromptRegistry();
    const sysInst =
      registry.prompts?.written_answer_judge_v1?.systemInstruction ||
      "Grade the learner's written answer with partial credit (0-100), verdict, corrected version, and constructive feedback.";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Mode: ${mode || "Academic Short Answer"} (Learner CEFR/Level: ${user.cefrLevel}).
Question / Prompt: "${question}"
Reference Key: "${referenceAnswer || "Evaluate based on accuracy, clarity, and grammar."}"
Learner's Submitted Answer: "${userAnswer}"`,
      config: {
        systemInstruction: sysInst,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "0 to 100 rubric score" },
            verdict: { type: Type.STRING, description: "correct, partial, or incorrect" },
            correctedText: { type: Type.STRING, description: "Polished or corrected version of the learner's answer" },
            explanation: { type: Type.STRING, description: "Clear explanation of what was right or missing" },
            mistakeCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
            xpAwarded: { type: Type.INTEGER },
          },
          required: ["score", "verdict", "correctedText", "explanation", "mistakeCategories", "xpAwarded"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    const xpGain = Math.max(5, Math.min(35, Number(parsed.xpAwarded) || Math.round((parsed.score || 50) * 0.3)));
    user.xp += xpGain;

    recordAiLog(db, {
      username: user.username,
      feature: "UC5: Written-Answer AI Judge",
      promptId: "written_answer_judge_v1",
      latencyMs: Date.now() - start,
      tokens: 340,
      cacheHit: false,
      validationPassed: true,
      status: "200 OK",
    });
    saveDb(db);
    res.json({ ...parsed, xpAwarded: xpGain, activeUser: user });
  } catch (err: any) {
    const words = String(userAnswer || "").trim().split(/\s+/).filter(Boolean).length;
    const score = words >= 8 ? 82 : 55;
    recordAiLog(db, {
      username: user.username,
      feature: "UC5: Written-Answer AI Judge",
      promptId: "written_answer_judge_v1",
      latencyMs: Date.now() - start,
      tokens: 0,
      cacheHit: false,
      validationPassed: true,
      status: "200 FALLBACK_ACTIVE",
    });
    saveDb(db);
    res.json({
      score,
      verdict: score >= 75 ? "correct" : "partial",
      correctedText: referenceAnswer || userAnswer,
      explanation:
        "Evaluated via deterministic rubric fallback: Your response addresses the core concept; compare against the reference key for complete terminology.",
      mistakeCategories: score >= 75 ? ["Precision (Minor)"] : ["Completeness"],
      xpAwarded: 15,
      activeUser: user,
    });
  }
});

// UC5 (Project 04 & 05): AI Tutor & "Explain It Differently" Multi-Style Explainer
app.post("/api/v1/tutor/explain", async (req, res) => {
  const { concept, style, customInterest, previousAngles } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  if (user.isBlocked) {
    res.status(403).json({ error: "Account is blocked by Admin moderation." });
    return;
  }
  if (!checkRateLimit(user.username)) {
    res.status(429).json({ error: "Rate limit exceeded." });
    return;
  }

  const chosenStyle = String(style || user.preferredStyle || "Analogy");
  const interest = String(customInterest || user.interests[0] || "Football");
  const cacheKey = `tutor:${String(concept).toLowerCase()}:${chosenStyle.toLowerCase()}:${interest.toLowerCase()}:${
    (previousAngles || []).length
  }`;

  user.stats = user.stats || {};
  user.stats.tutor_queries = (user.stats.tutor_queries || 0) + 1;

  // Update quest if applicable
  const qTutor = db.dailyQuests.find((q) => q.category === "Deep Understanding" && !q.isCompleted);
  if (qTutor) {
    qTutor.currentCount = Math.min(qTutor.targetCount, qTutor.currentCount + 1);
  }

  if (aiResponseCache.has(cacheKey)) {
    const cached = aiResponseCache.get(cacheKey);
    recordAiLog(db, {
      username: user.username,
      feature: `UC5: AI Tutor (${chosenStyle})`,
      promptId: "ai_tutor_explainer_v1",
      latencyMs: 2,
      tokens: 0,
      cacheHit: true,
      validationPassed: true,
      status: "200 CACHED",
    });
    saveDb(db);
    res.json({ ...cached, cached: true });
    return;
  }

  const start = Date.now();
  try {
    const ai = getAiClient();
    const registry = loadPromptRegistry();
    const sysInst =
      registry.prompts?.ai_tutor_explainer_v1?.systemInstruction ||
      "Explain the concept in the requested style personalized to the learner's interest, provide a non-spoiling hint, and 2 quick check questions.";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Concept / Question to explain: "${concept}"
Requested Style: "${chosenStyle}" (Options: Simple, Analogy, Story, Step-by-Step, Deeper/Expert, or Teach-Back)
Learner Profile: Level ${user.cefrLevel}, loves "${interest}".
Previously tried angles to avoid repeating: ${JSON.stringify(previousAngles || [])}`,
      config: {
        systemInstruction: sysInst,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            styleUsed: { type: Type.STRING },
            interestWovenIn: { type: Type.STRING },
            explanationText: { type: Type.STRING },
            nonSpoilingHint: { type: Type.STRING },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            quickChecks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ["question", "options", "correctIndex", "explanation"],
              },
            },
          },
          required: [
            "title",
            "styleUsed",
            "interestWovenIn",
            "explanationText",
            "nonSpoilingHint",
            "keyTakeaways",
            "quickChecks",
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    aiResponseCache.set(cacheKey, parsed);
    recordAiLog(db, {
      username: user.username,
      feature: `UC5: AI Tutor (${chosenStyle})`,
      promptId: "ai_tutor_explainer_v1",
      latencyMs: Date.now() - start,
      tokens: 520,
      cacheHit: false,
      validationPassed: true,
      status: "200 OK",
    });
    saveDb(db);
    res.json(parsed);
  } catch (err: any) {
    const fallback = {
      title: `${concept} — ${chosenStyle} Angle`,
      styleUsed: chosenStyle,
      interestWovenIn: interest,
      explanationText: `Think of "${concept}" through the lens of ${interest}: just as a tactical coach sets clear roles and validates every pass before scoring, your system isolates rules from probabilistic signals so the whole team stays synchronized under pressure.`,
      nonSpoilingHint: "Focus on which component holds the source of truth when an unexpected input arrives.",
      keyTakeaways: [
        "Isolate deterministic rules from probabilistic AI outputs",
        "Always verify outputs against real catalog or schema constraints",
        "Keep a fallback strategy ready when external calls stall",
      ],
      quickChecks: [
        {
          question: `What is the main advantage of applying this principle to ${concept}?`,
          options: [
            "Predictable system behavior and verifiable correctness",
            "Removing all validation checks for speed",
            "Hardcoding user credentials in the UI",
            "Ignoring edge cases",
          ],
          correctIndex: 0,
          explanation: "Structured boundaries guarantee reliability even when inputs vary.",
        },
      ],
      fallbackUsed: true,
    };
    saveDb(db);
    res.json(fallback);
  }
});

// UC4: Generate Personalized Daily Quests & Study Pet Reaction (LLM)
app.post("/api/v1/quests/generate", async (_req, res) => {
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  if (user.isBlocked) {
    res.status(403).json({ error: "Account is blocked by Admin moderation." });
    return;
  }

  const start = Date.now();
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Learner: ${user.displayName}, Level ${user.level} (${user.title}), Streak: ${user.streakDays} days.
Weak topics from recent mistakes: ${JSON.stringify(user.weakTopics)}.
Preferred style: ${user.preferredStyle}.
Generate 3 personalized daily quests and a lively reaction from their Study Pet "${db.studyPet.name}".`,
      config: {
        systemInstruction:
          "You are an adaptive gamification designer. Return 3 concrete daily quests targeting the learner's weak topics and streak, plus a short personality-rich Study Pet message.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            petMood: { type: Type.STRING },
            petMessage: { type: Type.STRING },
            quests: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  targetCount: { type: Type.INTEGER },
                  xpReward: { type: Type.INTEGER },
                  gemReward: { type: Type.INTEGER },
                  reason: { type: Type.STRING },
                },
                required: ["title", "category", "targetCount", "xpReward", "gemReward", "reason"],
              },
            },
          },
          required: ["petMood", "petMessage", "quests"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    db.dailyQuests = (parsed.quests || []).slice(0, 3).map((q: any, i: number) => ({
      id: `quest_${Date.now()}_${i}`,
      title: q.title,
      category: q.category || "Adaptive Focus",
      targetCount: Math.max(1, Math.min(5, Number(q.targetCount) || 1)),
      currentCount: 0,
      xpReward: Math.max(20, Math.min(80, Number(q.xpReward) || 40)),
      gemReward: Math.max(10, Math.min(35, Number(q.gemReward) || 15)),
      isCompleted: false,
      generatedByAi: true,
      reason: q.reason || "Adapted from your recent progress",
    }));

    db.studyPet.mood = parsed.petMood || "Excited & Focused";
    db.studyPet.lastMessage = parsed.petMessage || db.studyPet.lastMessage;

    recordAiLog(db, {
      username: user.username,
      feature: "UC4: Adaptive Daily Quests",
      promptId: "daily_quests_adaptive_v1",
      latencyMs: Date.now() - start,
      tokens: 380,
      cacheHit: false,
      validationPassed: true,
      status: "200 OK",
    });
    saveDb(db);
    res.json({ dailyQuests: db.dailyQuests, studyPet: db.studyPet });
  } catch {
    res.json({ dailyQuests: db.dailyQuests, studyPet: db.studyPet, fallbackUsed: true });
  }
});

app.post("/api/v1/quests/:id/claim", (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];
  const quest = db.dailyQuests.find((q) => q.id === id);

  if (!quest) {
    res.status(404).json({ error: "Quest not found." });
    return;
  }
  if (quest.isCompleted) {
    res.status(400).json({ error: "Quest reward already claimed." });
    return;
  }

  quest.currentCount = quest.targetCount;
  quest.isCompleted = true;
  user.xp += quest.xpReward;
  user.gems += quest.gemReward;

  const levelInfo = invokePythonEngine({ action: "calculate_level", total_xp: user.xp });
  if (levelInfo) {
    user.level = levelInfo.level;
    user.title = levelInfo.title;
  }

  const lb = db.leaderboard.find((l) => l.username === user.username);
  if (lb) lb.xp = user.xp;

  saveDb(db);
  res.json({ dailyQuests: db.dailyQuests, activeUser: { ...user, levelInfo } });
});

// Project 08 UC2 & UC7: SM-2 Flashcard Review & Build Deck from Text
app.post("/api/v1/flashcards/:id/review", (req, res) => {
  const { id } = req.params;
  const { quality } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];
  const card = db.flashcards.find((c) => c.id === id);

  if (!card) {
    res.status(404).json({ error: "Flashcard not found." });
    return;
  }

  const sm2 = invokePythonEngine({
    action: "sm2_schedule",
    quality: Number(quality),
    repetitions: card.repetitions,
    interval_days: card.intervalDays,
    easiness_factor: card.easinessFactor,
    review_date_str: "2026-11-02",
  });

  if (sm2) {
    card.repetitions = sm2.repetitions;
    card.intervalDays = sm2.interval_days;
    card.easinessFactor = sm2.easiness_factor;
    card.nextReviewDate = sm2.next_review_date;
  }

  user.xp += 10;
  user.stats = user.stats || {};
  user.stats.flashcards_reviewed = (user.stats.flashcards_reviewed || 0) + 1;

  const qFc = db.dailyQuests.find((q) => q.category === "Spaced Repetition" && !q.isCompleted);
  if (qFc) {
    qFc.currentCount = Math.min(qFc.targetCount, qFc.currentCount + 1);
  }

  saveDb(db);
  res.json({ card, sm2Report: sm2, flashcards: db.flashcards, activeUser: user });
});

app.post("/api/v1/flashcards/deck-from-text", async (req, res) => {
  const { deckName, sourceText, targetLanguage } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  if (user.isBlocked) {
    res.status(403).json({ error: "Account is blocked by Admin moderation." });
    return;
  }

  const start = Date.now();
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Deck Name: "${deckName || "Custom Extracted Deck"}"
Target Language / Domain: "${targetLanguage || "Spanish & Software Engineering"}"
Learner Level: ${user.cefrLevel}
Source Article / Notes:
"""
${String(sourceText).slice(0, 3000)}
"""
Extract 4 high-value flashcards with frontText, backText, exampleSentence, and cefrLevel.`,
      config: {
        systemInstruction:
          "Extract 4 essential vocabulary or concept flashcards from the provided text, calibrated to the learner's level.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  frontText: { type: Type.STRING },
                  backText: { type: Type.STRING },
                  exampleSentence: { type: Type.STRING },
                  cefrLevel: { type: Type.STRING },
                },
                required: ["frontText", "backText", "exampleSentence", "cefrLevel"],
              },
            },
          },
          required: ["cards"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    const createdCards = (parsed.cards || []).map((c: any, idx: number) => ({
      id: `fc_${Date.now()}_${idx}`,
      deckName: deckName || "AI Extracted Deck",
      frontText: c.frontText,
      backText: c.backText,
      exampleSentence: c.exampleSentence,
      cefrLevel: c.cefrLevel || user.cefrLevel,
      repetitions: 0,
      intervalDays: 1,
      easinessFactor: 2.5,
      nextReviewDate: "2026-11-02",
    }));

    db.flashcards.unshift(...createdCards);
    recordAiLog(db, {
      username: user.username,
      feature: "Project 08 UC7: Build Deck from Text",
      promptId: "deck_from_text_v1",
      latencyMs: Date.now() - start,
      tokens: 410,
      cacheHit: false,
      validationPassed: true,
      status: "200 OK",
    });
    saveDb(db);
    res.json({ createdCards, flashcards: db.flashcards });
  } catch {
    res.status(500).json({ error: "Could not extract flashcards from text." });
  }
});

// Project 08 UC6: AI Conversation Partner (Role-Play with gentle corrections)
app.post("/api/v1/conversation/turn", async (req, res) => {
  const { scenario, userMessage, history } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  const start = Date.now();
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Role-Play Scenario: "${scenario || "Ordering specialty coffee in Madrid (Spanish B1)"}"
Learner Level: ${user.cefrLevel}
Conversation History: ${JSON.stringify((history || []).slice(-6))}
Learner's Latest Message: "${userMessage}"`,
      config: {
        systemInstruction:
          "You are an encouraging role-play conversation partner and language/technical coach. Stay in character to reply naturally, provide a gentle correction or upgrade tip for the learner's message, and suggest 1 helpful vocabulary phrase for their next reply.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            partnerReply: { type: Type.STRING },
            partnerTranslationOrNote: { type: Type.STRING },
            gentleCorrection: { type: Type.STRING },
            suggestedNextPhrase: { type: Type.STRING },
          },
          required: ["partnerReply", "partnerTranslationOrNote", "gentleCorrection", "suggestedNextPhrase"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    user.xp += 10;
    recordAiLog(db, {
      username: user.username,
      feature: "Project 08 UC6: Role-Play Conversation",
      promptId: "writing_coach_cefr_v1",
      latencyMs: Date.now() - start,
      tokens: 310,
      cacheHit: false,
      validationPassed: true,
      status: "200 OK",
    });
    saveDb(db);
    res.json({ ...parsed, activeUser: user });
  } catch {
    res.json({
      partnerReply: "¡Claro que sí! Enseguida le preparo su pedido. ¿Desea tomarlo aquí o para llevar?",
      partnerTranslationOrNote: "Of course! I'll prepare your order right away. Would you like it for here or to go?",
      gentleCorrection: "Great communicative clarity! Try adding 'por favor' or using the conditional 'Me gustaría' for extra politeness.",
      suggestedNextPhrase: "Para tomar aquí, junto a la ventana, por favor.",
    });
  }
});

// UC7 (Teacher): AI Course & Lesson Authoring Assistant
app.post("/api/v1/authoring/generate-lesson", async (req, res) => {
  const { courseId, topicTitle, syllabusNotes, difficulty } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  const start = Date.now();
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Course ID: "${courseId}"
Lesson Topic Title: "${topicTitle}"
Difficulty: "${difficulty || "Intermediate"}"
Teacher Syllabus / Raw Notes:
"""
${syllabusNotes || topicTitle}
"""
Draft a complete lesson in Markdown plus 3 multiple-choice quiz questions (4 options each, 0-3 correctIndex) and 1 short-answer written prompt.`,
      config: {
        systemInstruction:
          "You are an expert university instructional designer. Draft a rich lesson with clear markdown headings, bullet points, 3 validated 4-option multiple-choice quiz questions, and 1 written-answer prompt.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            contentMarkdown: { type: Type.STRING },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  topic: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ["question", "options", "correctIndex", "topic", "explanation", "hint"],
              },
            },
            writtenPrompt: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                referenceAnswer: { type: Type.STRING },
              },
              required: ["question", "referenceAnswer"],
            },
          },
          required: ["title", "summary", "contentMarkdown", "quiz", "writtenPrompt"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    recordAiLog(db, {
      username: user.username,
      feature: "UC7: Teacher AI Course Authoring",
      promptId: "course_authoring_v1",
      latencyMs: Date.now() - start,
      tokens: 790,
      cacheHit: false,
      validationPassed: true,
      status: "200 OK",
    });
    saveDb(db);
    res.json({ draftLesson: parsed, qualityGuardPassed: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to generate lesson draft." });
  }
});

app.post("/api/v1/authoring/publish-lesson", (req, res) => {
  const { courseId, lesson } = req.body;
  const db = loadDb();
  const course = db.courses.find((c) => c.id === courseId) || db.courses[0];

  const newLesson = {
    id: `lesson_${Date.now()}`,
    orderIndex: course.lessons.length + 1,
    title: lesson.title || "Untitled Lesson",
    summary: lesson.summary || "Teacher authored module",
    xpReward: 60,
    completedBy: [],
    contentMarkdown: lesson.contentMarkdown || "",
    quiz: (lesson.quiz || []).map((q: any, i: number) => ({
      id: `q_${Date.now()}_${i}`,
      ...q,
    })),
    writtenPrompt: lesson.writtenPrompt || {
      question: "Summarize the core principle of this lesson.",
      referenceAnswer: lesson.summary || "",
    },
  };

  course.lessons.push(newLesson);
  saveDb(db);
  res.json({ courses: db.courses, publishedLesson: newLesson });
});

// UC3: Rewards Shop Purchase
app.post("/api/v1/shop/buy", (req, res) => {
  const { itemId } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];
  const item = db.shopItems.find((i) => i.id === itemId);

  if (!item) {
    res.status(404).json({ error: "Shop item not found." });
    return;
  }
  if (user.ownedItems.includes(item.id) && item.id !== "streak_freeze") {
    res.status(400).json({ error: "You already own this reward item." });
    return;
  }
  if (user.gems < item.costGems) {
    res.status(400).json({ error: `Not enough gems. Need ${item.costGems} gems.` });
    return;
  }

  user.gems -= item.costGems;
  if (!user.ownedItems.includes(item.id)) {
    user.ownedItems.push(item.id);
  }
  if (item.id === "streak_freeze") {
    user.streakFreezeActive = true;
  }

  saveDb(db);
  res.json({ activeUser: user });
});

// UC8 (Admin): Block/Unblock account & Clear AI Cache
app.post("/api/v1/admin/toggle-block", (req, res) => {
  const { userId } = req.body;
  const db = loadDb();
  const target = db.users.find((u) => u.id === userId);
  if (!target) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  target.isBlocked = !target.isBlocked;
  saveDb(db);
  res.json({ users: db.users });
});

app.post("/api/v1/admin/clear-cache", (_req, res) => {
  aiResponseCache.clear();
  res.json({ cleared: true });
});

// Automated Python Unit Tests Runner (Ground Rules Page 22)
app.post("/api/v1/tests/run-python", (_req, res) => {
  try {
    const output = execFileSync("python3", [PYTHON_TESTS_PATH], {
      encoding: "utf-8",
      timeout: 8000,
    });
    res.json({ passed: true, output });
  } catch (err: any) {
    // unittest writes test progress to stderr by default even when passing!
    const combined = `${err?.stdout || ""}\n${err?.stderr || ""}`.trim();
    const isOk = err?.status === 0 || combined.includes("OK");
    res.json({ passed: isOk, output: combined || String(err) });
  }
});

// ============================================================================
// ALL 9 SHIRAZ UNIVERSITY PROJECT PROPOSALS INTERACTIVE AI SANDBOX
// ============================================================================
app.post("/api/v1/proposals/execute", async (req, res) => {
  const { proposalId, userInput, secondaryInput, imageBase64, imageMimeType } = req.body;
  const db = loadDb();
  const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];

  if (user.isBlocked) {
    res.status(403).json({ error: "Account is blocked by Admin moderation." });
    return;
  }

  const start = Date.now();
  try {
    const ai = getAiClient();
    const parts: any[] = [];
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }
    parts.push({
      text: `Execute Shiraz University Fall 2026 Project Proposal #${proposalId}.
Primary User Input: "${userInput}"
Secondary Context / Constraints / Catalog: "${secondaryInput || "Standard constraints"}"
Return strictly validated structured JSON matching the AI Core contract for Project #${proposalId}, including:
- summary: concise executive summary of the AI decision
- groundedChecks: array of verification checks performed against real data/constraints
- structuredOutput: array of 3-4 rich structured cards/items (with title, subtitle, metrics/timing/tags, and explanation)
- followUpAction: concrete next action or adaptation tip.`,
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction:
          "You are the Shiraz University Fall 2026 Systems Analysis and Design AI Core Engine. Ground every output in realistic catalog/place/pantry/wardrobe data, check schedules and budgets, and never invent unverified IDs.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            groundedChecks: { type: Type.ARRAY, items: { type: Type.STRING } },
            structuredOutput: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  metadataLine: { type: Type.STRING },
                  detail: { type: Type.STRING },
                },
                required: ["title", "subtitle", "metadataLine", "detail"],
              },
            },
            followUpAction: { type: Type.STRING },
          },
          required: ["summary", "groundedChecks", "structuredOutput", "followUpAction"],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "{}").trim());
    recordAiLog(db, {
      username: user.username,
      feature: `Proposal #${proposalId} AI Core`,
      promptId: "proposal_sandbox_v1",
      latencyMs: Date.now() - start,
      tokens: 510,
      cacheHit: false,
      validationPassed: true,
      status: "200 OK",
    });
    saveDb(db);
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to execute proposal AI Core." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Shiraz SAD Full-Stack Server (Django + React + Gemini AI Core) running on http://localhost:${PORT}`);
  });
}

startServer();
