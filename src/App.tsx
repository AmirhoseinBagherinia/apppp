import React, { useEffect, useState } from "react";
import { ProposalsHubView } from "./components/ProposalsHubView";
import { DesignAndDjangoView } from "./components/DesignAndDjangoView";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  Volume2,
  RotateCcw,
  Send,
  ShieldAlert,
  Award,
  ShoppingBag,
  Layers,
  UserCheck,
  Play,
  HelpCircle,
} from "lucide-react";

type NavSection = "learn" | "language" | "tutor" | "proposals" | "design";

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>("learn");
  const [appState, setAppState] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  // Course & Lesson state (UC2)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("course_sad_ai");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("lesson_101");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [rewardBanner, setRewardBanner] = useState<any>(null);
  const [shownHints, setShownHints] = useState<Record<string, boolean>>({});

  // Written Answer Judge state (UC5 / Project 03 & 05 & 08)
  const [writtenInput, setWrittenInput] = useState<string>("");
  const [writtenJudging, setWrittenJudging] = useState<boolean>(false);
  const [writtenResult, setWrittenResult] = useState<any>(null);

  // Placement Test Modal state (UC1)
  const [showPlacementModal, setShowPlacementModal] = useState<boolean>(false);
  const [placementSubject, setPlacementSubject] = useState<string>(
    "Django Backend Architecture & LLM Integration"
  );
  const [placementBg, setPlacementBg] = useState<string>("B.Sc. Computer Engineering Student");
  const [placementLoading, setPlacementLoading] = useState<boolean>(false);
  const [placementQuiz, setPlacementQuiz] = useState<any>(null);
  const [placementAnswers, setPlacementAnswers] = useState<Record<number, number>>({});
  const [placementResult, setPlacementResult] = useState<any>(null);

  // Adaptive Daily Quests state (UC4)
  const [generatingQuests, setGeneratingQuests] = useState<boolean>(false);

  // Language & SM-2 Flashcard state (Project 08 UC2 & UC7)
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const [cardFlipped, setCardFlipped] = useState<boolean>(false);
  const [lastSm2Report, setLastSm2Report] = useState<any>(null);
  const [deckNameInput, setDeckNameInput] = useState<string>("Django & Spanish Technical Terms");
  const [deckSourceText, setDeckSourceText] = useState<string>(
    "La arquitectura limpia en Django separa los modelos de datos, las reglas de negocio deterministas y las llamadas a modelos de lenguaje (LLM). Cada respuesta JSON debe validarse antes de guardarse en PostgreSQL."
  );
  const [extractingDeck, setExtractingDeck] = useState<boolean>(false);

  // Conversation Role-Play state (Project 08 UC6)
  const [roleplayScenario, setRoleplayScenario] = useState<string>(
    "Ordering specialty coffee & discussing software engineering in Madrid (Spanish B1)"
  );
  const [chatHistory, setChatHistory] = useState<
    { speaker: "user" | "partner"; text: string; note?: string; correction?: string }[]
  >([
    {
      speaker: "partner",
      text: "¡Hola! Bienvenido al Café Literatura en Madrid. ¿Qué le gustaría tomar hoy mientras trabaja en su proyecto?",
      note: "Hello! Welcome to Café Literatura in Madrid. What would you like to have today while working on your project?",
    },
  ]);
  const [chatInput, setChatInput] = useState<string>(
    "Hola, me gustaría pedir un café cortado y un croissant, por favor."
  );
  const [chatSending, setChatSending] = useState<boolean>(false);
  const [suggestedPhrase, setSuggestedPhrase] = useState<string>(
    "¿Tienen conexión Wi-Fi cerca de la ventana?"
  );

  // AI Tutor / Explain It Differently state (Project 04 & Project 05 UC5)
  const [tutorConcept, setTutorConcept] = useState<string>(
    "How SM-2 Spaced Repetition and Grounded JSON Validation prevent forgetting and LLM hallucinations"
  );
  const [tutorStyle, setTutorStyle] = useState<string>("Analogy");
  const [tutorInterest, setTutorInterest] = useState<string>("Football");
  const [previousAngles, setPreviousAngles] = useState<string[]>([]);
  const [tutorLoading, setTutorLoading] = useState<boolean>(false);
  const [tutorOutput, setTutorOutput] = useState<any>(null);
  const [tutorCheckAnswers, setTutorCheckAnswers] = useState<Record<number, number>>({});

  // Teacher AI Course Authoring state (UC7)
  const [authorTopic, setAuthorTopic] = useState<string>(
    "Rate Limiting, Caching & Token Cost Governance in LLM APIs"
  );
  const [authorSyllabus, setAuthorSyllabus] = useState<string>(
    "Cover API key security in .env, Redis prompt caching, exponential backoff on HTTP 429, and AIUsageLog database auditing."
  );
  const [authorLoading, setAuthorLoading] = useState<boolean>(false);
  const [authorDraft, setAuthorDraft] = useState<any>(null);
  const [shopNotice, setShopNotice] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/v1/state");
      const data = await res.json();
      setAppState(data);
    } catch (e) {
      console.error("Failed to fetch state:", e);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const activeUser = appState?.activeUser;
  const courses = appState?.courses || [];
  const currentCourse = courses.find((c: any) => c.id === selectedCourseId) || courses[0];
  const currentLesson =
    currentCourse?.lessons?.find((l: any) => l.id === selectedLessonId) ||
    currentCourse?.lessons?.[0];

  const handleSwitchUser = async (userId: string) => {
    await fetch("/api/v1/auth/switch-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchState();
  };

  // UC1: Generate Placement Test
  const handleGeneratePlacement = async () => {
    setPlacementLoading(true);
    setPlacementResult(null);
    setPlacementAnswers({});
    try {
      const res = await fetch("/api/v1/placement-test/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: placementSubject, experienceNote: placementBg }),
      });
      const data = await res.json();
      setPlacementQuiz(data);
      fetchState();
    } finally {
      setPlacementLoading(false);
    }
  };

  const handleSubmitPlacement = async () => {
    if (!placementQuiz?.questions) return;
    let correct = 0;
    const missed: string[] = [];
    placementQuiz.questions.forEach((q: any, idx: number) => {
      if (placementAnswers[idx] === q.correctIndex) {
        correct++;
      } else if (q.topic) {
        missed.push(q.topic);
      }
    });
    const res = await fetch("/api/v1/placement-test/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectTitle: placementQuiz.subjectTitle,
        correctCount: correct,
        totalQuestions: placementQuiz.questions.length,
        missedTopics: missed,
      }),
    });
    const data = await res.json();
    setPlacementResult({ ...data, correct, total: placementQuiz.questions.length });
    fetchState();
  };

  // UC2 & UC3: Submit Lesson Quiz & Trigger Python Rules Engine
  const handleCompleteLesson = async () => {
    if (!currentLesson) return;
    const quiz = currentLesson.quiz || [];
    let correct = 0;
    const missedTopics: string[] = [];
    quiz.forEach((q: any) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correct++;
      } else if (q.topic) {
        missedTopics.push(q.topic);
      }
    });
    setQuizSubmitted(true);

    const res = await fetch(`/api/v1/lessons/${currentLesson.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        correctCount: correct,
        totalQuestions: quiz.length,
        missedTopics,
      }),
    });
    const data = await res.json();
    setRewardBanner(data.rewardReport);
    fetchState();
  };

  // Written Answer Judge
  const handleJudgeWritten = async () => {
    if (!currentLesson?.writtenPrompt || !writtenInput.trim()) return;
    setWrittenJudging(true);
    try {
      const res = await fetch("/api/v1/judge-written-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentLesson.writtenPrompt.question,
          referenceAnswer: currentLesson.writtenPrompt.referenceAnswer,
          userAnswer: writtenInput,
        }),
      });
      const data = await res.json();
      setWrittenResult(data);
      fetchState();
    } finally {
      setWrittenJudging(false);
    }
  };

  // UC4: Generate Personalized Daily Quests
  const handleRegenerateQuests = async () => {
    setGeneratingQuests(true);
    try {
      await fetch("/api/v1/quests/generate", { method: "POST" });
      await fetchState();
    } finally {
      setGeneratingQuests(false);
    }
  };

  const handleClaimQuest = async (questId: string) => {
    await fetch(`/api/v1/quests/${questId}/claim`, { method: "POST" });
    fetchState();
  };

  // UC3: Shop Buy
  const handleBuyItem = async (itemId: string) => {
    setShopNotice(null);
    const res = await fetch("/api/v1/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setShopNotice(data.error || "Purchase failed");
    } else {
      setShopNotice("Reward unlocked and added to your profile!");
      fetchState();
    }
  };

  // Project 08 UC2: SM-2 Flashcard Review
  const flashcards = appState?.flashcards || [];
  const currentCard = flashcards[activeCardIdx % Math.max(1, flashcards.length)];

  const handleReviewCard = async (quality: number) => {
    if (!currentCard) return;
    const res = await fetch(`/api/v1/flashcards/${currentCard.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quality }),
    });
    const data = await res.json();
    setLastSm2Report(data.sm2Report);
    setCardFlipped(false);
    setActiveCardIdx((prev) => (prev + 1) % Math.max(1, flashcards.length));
    fetchState();
  };

  const handleSpeakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExtractDeck = async () => {
    if (!deckSourceText.trim()) return;
    setExtractingDeck(true);
    try {
      await fetch("/api/v1/flashcards/deck-from-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deckName: deckNameInput,
          sourceText: deckSourceText,
        }),
      });
      setActiveCardIdx(0);
      await fetchState();
    } finally {
      setExtractingDeck(false);
    }
  };

  // Project 08 UC6: Role-play Conversation
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory((prev) => [...prev, { speaker: "user", text: userMsg }]);
    setChatSending(true);
    try {
      const res = await fetch("/api/v1/conversation/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: roleplayScenario,
          userMessage: userMsg,
          history: chatHistory,
        }),
      });
      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        {
          speaker: "partner",
          text: data.partnerReply,
          note: data.partnerTranslationOrNote,
          correction: data.gentleCorrection,
        },
      ]);
      if (data.suggestedNextPhrase) {
        setSuggestedPhrase(data.suggestedNextPhrase);
      }
      fetchState();
    } finally {
      setChatSending(false);
    }
  };

  // UC5: AI Tutor / Explain It Differently
  const handleAskTutor = async (forceNewAngle = false) => {
    if (!tutorConcept.trim()) return;
    setTutorLoading(true);
    setTutorCheckAnswers({});
    const nextPrevAngles =
      forceNewAngle && tutorOutput?.styleUsed
        ? [...previousAngles, `${tutorOutput.styleUsed} (${tutorOutput.interestWovenIn})`]
        : previousAngles;
    setPreviousAngles(nextPrevAngles);

    try {
      const res = await fetch("/api/v1/tutor/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: tutorConcept,
          style: tutorStyle,
          customInterest: tutorInterest,
          previousAngles: nextPrevAngles,
        }),
      });
      const data = await res.json();
      setTutorOutput(data);
      fetchState();
    } finally {
      setTutorLoading(false);
    }
  };

  // UC7: Teacher Course Authoring
  const handleGenerateLessonDraft = async () => {
    if (!authorTopic.trim()) return;
    setAuthorLoading(true);
    try {
      const res = await fetch("/api/v1/authoring/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          topicTitle: authorTopic,
          syllabusNotes: authorSyllabus,
        }),
      });
      const data = await res.json();
      setAuthorDraft(data.draftLesson);
      fetchState();
    } finally {
      setAuthorLoading(false);
    }
  };

  const handlePublishLessonDraft = async () => {
    if (!authorDraft) return;
    const res = await fetch("/api/v1/authoring/publish-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId: selectedCourseId,
        lesson: authorDraft,
      }),
    });
    const data = await res.json();
    setAuthorDraft(null);
    await fetchState();
    if (data.publishedLesson) {
      setSelectedLessonId(data.publishedLesson.id);
      setActiveNav("learn");
    }
  };

  // UC8: Admin Block Toggle
  const handleToggleBlockUser = async (userId: string) => {
    await fetch("/api/v1/admin/toggle-block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    fetchState();
  };

  if (loadingState) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full text-center space-y-3">
          <div className="text-base font-bold text-slate-900">
            Loading Shiraz SAD AI Studio...
          </div>
          <p className="text-xs text-slate-500">
            Initializing Django Rules Engine, SM-2 Scheduler, and Server-Side Gemini 3.8 Flash Core.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* =====================================================================
          STRICT 3-ZONE TOP BAR CONTRACT (Section 2 of frontend-design)
         ===================================================================== */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveNav("learn");
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
        >
          Shiraz SAD QuestAcademy
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveNav("learn")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeNav === "learn" ? "text-slate-900 border-b-2 border-blue-600 font-semibold" : ""
            }`}
          >
            Learning Hub
          </button>
          <button
            onClick={() => setActiveNav("language")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeNav === "language" ? "text-slate-900 border-b-2 border-blue-600 font-semibold" : ""
            }`}
          >
            Language &amp; SM-2
          </button>
          <button
            onClick={() => setActiveNav("tutor")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeNav === "tutor" ? "text-slate-900 border-b-2 border-blue-600 font-semibold" : ""
            }`}
          >
            AI Tutor
          </button>
          <button
            onClick={() => setActiveNav("proposals")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeNav === "proposals" ? "text-slate-900 border-b-2 border-blue-600 font-semibold" : ""
            }`}
          >
            9 Proposals
          </button>
          <button
            onClick={() => setActiveNav("design")}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
              activeNav === "design" ? "text-slate-900 border-b-2 border-blue-600 font-semibold" : ""
            }`}
          >
            Design &amp; Admin
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowPlacementModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Placement Test
          </button>
        </div>
      </header>

      {/* =====================================================================
          WORKSPACE CONTEXT & ROLE BAR (Below the fold / outside <header>)
         ===================================================================== */}
      <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-6 py-3">
        <div className="max-w-[1360px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Active Profile & Tabular Gamification Telemetry */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
            <span className="font-semibold text-white">{activeUser?.displayName}</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-blue-400">
              Level {activeUser?.levelInfo?.level || activeUser?.level} ({activeUser?.levelInfo?.title || activeUser?.title})
            </span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-emerald-400">{activeUser?.xp} XP</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-amber-300">{activeUser?.gems} Gems</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-slate-300">{activeUser?.streakDays}d Streak</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-slate-300">CEFR {activeUser?.cefrLevel}</span>
          </div>

          {/* Mobile Section Switcher + Role Switcher (Learner / Teacher / Admin) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex md:hidden items-center gap-1 bg-slate-800 p-1 rounded-lg">
              {(["learn", "language", "tutor", "proposals", "design"] as NavSection[]).map((sec) => (
                <button
                  key={sec}
                  onClick={() => setActiveNav(sec)}
                  className={`px-2 py-1 text-[11px] rounded capitalize ${
                    activeNav === sec ? "bg-blue-600 text-white" : "text-slate-300"
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1">Active Role:</span>
              {(appState?.users || []).slice(0, 3).map((u: any) => (
                <button
                  key={u.id}
                  onClick={() => handleSwitchUser(u.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    u.id === activeUser?.id
                      ? "bg-white text-slate-900 font-semibold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {u.role === "learner" ? "Learner" : u.role === "teacher" ? "Teacher" : "Admin"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN VIEWPORT CONTAINER (1440px Baseline)
         ===================================================================== */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        {/* -----------------------------------------------------------------
            VIEW 1: GAMIFIED LEARNING WORKSPACE (Project 05 UC1-UC6)
           ----------------------------------------------------------------- */}
        {activeNav === "learn" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Columns: Courses, Active Lesson, Validated Quiz & Written Judge */}
            <div className="lg:col-span-8 space-y-6">
              {/* Course & Lesson Selector Strip */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500">
                      Project 05 · Gamified Learning Application · Django Rules Engine
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
                      Interactive Courses &amp; AI-Judged Challenges
                    </h1>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {courses.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCourseId(c.id);
                          setSelectedLessonId(c.lessons?.[0]?.id || "");
                          setQuizSubmitted(false);
                          setRewardBanner(null);
                          setWrittenResult(null);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          c.id === currentCourse?.id
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {c.category}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentCourse?.description}
                </p>

                {/* Lesson Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(currentCourse?.lessons || []).map((les: any) => {
                    const isCompleted = (les.completedBy || []).includes(activeUser?.id);
                    const isActive = les.id === currentLesson?.id;
                    return (
                      <button
                        key={les.id}
                        onClick={() => {
                          setSelectedLessonId(les.id);
                          setQuizSubmitted(false);
                          setRewardBanner(null);
                          setWrittenResult(null);
                        }}
                        className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-mono tabular-nums">0{les.orderIndex}.</span>
                        <span>{les.title}</span>
                        {isCompleted && (
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              isActive ? "text-emerald-400" : "text-emerald-600"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Lesson Content & Quiz Stage */}
              {currentLesson && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                  <div className="border-b border-slate-100 pb-4 flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">
                        Lesson 0{currentLesson.orderIndex} · Base Reward: +{currentLesson.xpReward} XP · Author: {currentCourse?.authorName}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">
                        {currentLesson.title}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setTutorConcept(currentLesson.title + ": " + currentLesson.summary);
                        setActiveNav("tutor");
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Ask AI Tutor to Explain Simply →
                    </button>
                  </div>

                  {/* Lesson Reading Content */}
                  <div className="prose prose-slate max-w-none text-sm text-slate-700 space-y-3 leading-relaxed whitespace-pre-line bg-slate-50/70 p-5 rounded-lg border border-slate-200/80">
                    {currentLesson.contentMarkdown}
                  </div>

                  {/* UC2 Multiple-Choice Quiz Section */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        UC2: Lesson Mastery Quiz (Validated JSON Schema)
                      </h3>
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        {(currentLesson.quiz || []).length} Questions · Quality Guard Verified
                      </span>
                    </div>

                    <div className="space-y-4">
                      {(currentLesson.quiz || []).map((q: any, qIdx: number) => {
                        const selectedOpt = quizAnswers[q.id];
                        const isCorrect = selectedOpt === q.correctIndex;
                        return (
                          <div
                            key={q.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="text-xs font-semibold text-slate-900">
                                <span className="font-mono text-slate-500 mr-1.5">
                                  Q{qIdx + 1}.
                                </span>
                                {q.question}
                              </div>
                              <button
                                onClick={() =>
                                  setShownHints((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                                }
                                className="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>{shownHints[q.id] ? "Hide Hint" : "AI Hint"}</span>
                              </button>
                            </div>

                            {shownHints[q.id] && (
                              <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded border border-slate-200">
                                <span className="font-semibold text-slate-800">Non-Spoiling Hint: </span>
                                {q.hint}
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(q.options || []).map((opt: string, oIdx: number) => {
                                const isChosen = selectedOpt === oIdx;
                                let btnStyle =
                                  "border-slate-200 bg-white text-slate-700 hover:border-slate-300";
                                if (quizSubmitted) {
                                  if (oIdx === q.correctIndex) {
                                    btnStyle =
                                      "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold";
                                  } else if (isChosen && oIdx !== q.correctIndex) {
                                    btnStyle = "border-red-500 bg-red-50 text-red-900";
                                  }
                                } else if (isChosen) {
                                  btnStyle =
                                    "border-blue-600 bg-blue-50/70 text-blue-950 font-semibold";
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => {
                                      if (!quizSubmitted) {
                                        setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }));
                                      }
                                    }}
                                    className={`p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${btnStyle}`}
                                  >
                                    <span className="font-mono mr-1.5 opacity-60">
                                      {String.fromCharCode(65 + oIdx)}.
                                    </span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {quizSubmitted && (
                              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="text-slate-700">
                                  <span
                                    className={`font-semibold mr-1.5 ${
                                      isCorrect ? "text-emerald-700" : "text-red-600"
                                    }`}
                                  >
                                    {isCorrect ? "✓ Correct:" : "✗ Review:"}
                                  </span>
                                  {q.explanation}
                                </div>
                                {!isCorrect && (
                                  <button
                                    onClick={() => {
                                      setTutorConcept(`${q.question} — Why is '${q.options[q.correctIndex]}' the right answer?`);
                                      setActiveNav("tutor");
                                    }}
                                    className="text-blue-600 font-medium hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    Explain Mistake with AI Tutor →
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                          setRewardBanner(null);
                        }}
                        className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Reset Quiz
                      </button>
                      <button
                        onClick={handleCompleteLesson}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Submit Quiz &amp; Run Django Rules Engine
                      </button>
                    </div>

                    {/* UC3 Reward Report from Python GamificationRulesEngine */}
                    {rewardBanner && (
                      <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-bold flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-400" />
                            <span>
                              Python GamificationRulesEngine Awarded +{rewardBanner.earned_xp} XP &amp; +{rewardBanner.earned_gems} Gems!
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-400 tabular-nums">
                            Total XP: {rewardBanner.new_total_xp} · Level {rewardBanner.level_info?.level} ({rewardBanner.level_info?.title})
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-300 flex flex-wrap items-center gap-3 tabular-nums">
                          <span>Accuracy XP: +{rewardBanner.breakdown?.accuracy_xp}</span>
                          <span>·</span>
                          <span>Perfect Quiz Bonus: +{rewardBanner.breakdown?.perfect_bonus}</span>
                          <span>·</span>
                          <span>Streak Multiplier: +{rewardBanner.breakdown?.streak_bonus}</span>
                          <span>·</span>
                          <span>Badge Bonus: +{rewardBanner.breakdown?.badge_xp_bonus}</span>
                        </div>
                        {rewardBanner.newly_unlocked_badges?.length > 0 && (
                          <div className="text-xs text-emerald-300 pt-1">
                            New Badges Unlocked:{" "}
                            {rewardBanner.newly_unlocked_badges.map((b: any) => b.name).join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI Written-Answer Judge Section */}
                  {currentLesson.writtenPrompt && (
                    <div className="pt-6 border-t border-slate-200 space-y-3">
                      <div className="text-xs text-slate-500">
                        AI Core · Written-Answer Judge &amp; Rubric Grader (Partial Credit &amp; Paraphrase Acceptance)
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {currentLesson.writtenPrompt.question}
                      </h3>
                      <textarea
                        rows={3}
                        placeholder="Write your short answer in 1–3 sentences..."
                        value={writtenInput}
                        onChange={(e) => setWrittenInput(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleJudgeWritten}
                          disabled={writtenJudging || !writtenInput.trim()}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          {writtenJudging ? "AI Judge Grading Answer..." : "Grade Written Answer with AI"}
                        </button>
                      </div>

                      {writtenResult && (
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between font-mono tabular-nums">
                            <span className="font-bold text-slate-900">
                              Rubric Score: {writtenResult.score}/100 ({writtenResult.verdict.toUpperCase()})
                            </span>
                            <span className="text-emerald-700 font-semibold">
                              +{writtenResult.xpAwarded} XP Awarded
                            </span>
                          </div>
                          <p className="text-slate-700">{writtenResult.explanation}</p>
                          <div className="text-slate-600">
                            <span className="font-semibold text-slate-900">Polished Reference Phrasing: </span>
                            {writtenResult.correctedText}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right 4 Columns: Study Pet ("Make It Yours"), Adaptive Daily Quests (UC4), Leaderboard (UC6), & Rewards Shop (UC3) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Study Pet Companion Card (Page 13 "Make It Yours" Creative Direction) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Make It Yours · AI Study Companion</div>
                    <h3 className="text-base font-bold text-slate-900">
                      {appState?.studyPet?.name} · {appState?.studyPet?.stage}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-700 tabular-nums">
                    Vitality {appState?.studyPet?.hunger}%
                  </span>
                </div>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                  “{appState?.studyPet?.lastMessage}”
                </p>
                <div className="text-[11px] text-slate-500">
                  Weak Topics Tracked: {(activeUser?.weakTopics || []).join(" · ") || "None"}
                </div>
              </div>

              {/* UC4: Personalized Daily Quests */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">UC4 · Adaptive Path Engine</div>
                    <h3 className="text-base font-bold text-slate-900">Daily Quests</h3>
                  </div>
                  <button
                    onClick={handleRegenerateQuests}
                    disabled={generatingQuests}
                    className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {generatingQuests ? "Adapting..." : "Regenerate with AI"}
                  </button>
                </div>

                <div className="space-y-3">
                  {(appState?.dailyQuests || []).map((q: any) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-semibold text-slate-900">{q.title}</div>
                        <span className="text-[11px] font-mono text-emerald-700 tabular-nums shrink-0">
                          +{q.xpReward} XP · +{q.gemReward} Gems
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{q.reason}</div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-mono text-slate-600 tabular-nums">
                          Progress: {q.currentCount}/{q.targetCount}
                        </span>
                        {q.isCompleted ? (
                          <span className="text-xs font-semibold text-emerald-700">✓ Claimed</span>
                        ) : (
                          <button
                            onClick={() => handleClaimQuest(q.id)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded transition-colors cursor-pointer"
                          >
                            Complete &amp; Claim
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* UC6: Weekly League Leaderboard */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div>
                  <div className="text-xs text-slate-500">UC6 · Friends &amp; Weekly League</div>
                  <h3 className="text-base font-bold text-slate-900">Emerald League Standings</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {(appState?.leaderboard || []).map((entry: any, idx: number) => (
                    <div
                      key={entry.id}
                      className="py-2.5 flex items-center justify-between text-xs font-mono tabular-nums"
                    >
                      <div className="flex items-center gap-2.5 font-sans">
                        <span className="font-mono text-slate-400 w-4">{idx + 1}.</span>
                        <span
                          className={
                            entry.username === activeUser?.username
                              ? "font-bold text-blue-700"
                              : "font-medium text-slate-800"
                          }
                        >
                          {entry.displayName}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {entry.xp} XP · {entry.streakDays}d
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* UC3: Rewards Shop */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">UC3 · Spend Earned Gems</div>
                    <h3 className="text-base font-bold text-slate-900">Rewards Shop</h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-amber-700 tabular-nums">
                    Balance: {activeUser?.gems} Gems
                  </span>
                </div>
                {shopNotice && (
                  <div className="p-2.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-800">
                    {shopNotice}
                  </div>
                )}
                <div className="space-y-2.5">
                  {(appState?.shopItems || []).map((item: any) => {
                    const owned = (activeUser?.ownedItems || []).includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-slate-900">
                            {item.name} · <span className="font-normal text-slate-500">{item.category}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">{item.description}</div>
                        </div>
                        <button
                          onClick={() => handleBuyItem(item.id)}
                          disabled={owned && item.id !== "streak_freeze"}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-mono font-semibold rounded-md whitespace-nowrap shrink-0 tabular-nums cursor-pointer"
                        >
                          {owned && item.id !== "streak_freeze" ? "Owned" : `${item.costGems} Gems`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            VIEW 2: LANGUAGE LEARNING & SM-2 STUDIO (Project 08 UC1-UC8)
           ----------------------------------------------------------------- */}
        {activeNav === "language" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 6 Columns: SM-2 Spaced Repetition Flashcards + Build Deck from Text */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">
                      Project 08 · UC2 Spaced Repetition Scheduler (Python SM-2 Algorithm)
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      SM-2 Active Recall Flashcards
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    Card {(activeCardIdx % Math.max(1, flashcards.length)) + 1} of {flashcards.length}
                  </span>
                </div>

                {currentCard && (
                  <div className="space-y-4">
                    <div
                      onClick={() => setCardFlipped(!cardFlipped)}
                      className="p-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors cursor-pointer min-h-[210px] flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                        <span>
                          Deck: {currentCard.deckName} · CEFR {currentCard.cefrLevel}
                        </span>
                        <span>
                          EF: {currentCard.easinessFactor} · Interval: {currentCard.intervalDays}d · Next: {currentCard.nextReviewDate}
                        </span>
                      </div>

                      <div className="py-4 space-y-2">
                        <div className="text-lg font-bold text-slate-900">
                          {cardFlipped ? currentCard.backText : currentCard.frontText}
                        </div>
                        {cardFlipped && currentCard.exampleSentence && (
                          <p className="text-xs text-slate-600 italic">
                            Example: “{currentCard.exampleSentence}”
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-blue-600 font-medium">
                        <span>{cardFlipped ? "Showing Back (Click to flip)" : "Click card to reveal answer"}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeakText(currentCard.frontText);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Pronounce (TTS)</span>
                        </button>
                      </div>
                    </div>

                    {/* SM-2 Quality Buttons (0 to 5) */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-700">
                        Rate Recall Quality (Runs Python <code className="font-mono">SM2SpacedRepetitionScheduler</code>):
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          onClick={() => handleReviewCard(1)}
                          className="py-2 px-3 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-900 text-xs font-semibold cursor-pointer"
                        >
                          1 · Forgot (1d)
                        </button>
                        <button
                          onClick={() => handleReviewCard(3)}
                          className="py-2 px-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold cursor-pointer"
                        >
                          3 · Hard
                        </button>
                        <button
                          onClick={() => handleReviewCard(4)}
                          className="py-2 px-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold cursor-pointer"
                        >
                          4 · Good
                        </button>
                        <button
                          onClick={() => handleReviewCard(5)}
                          className="py-2 px-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold cursor-pointer"
                        >
                          5 · Easy
                        </button>
                      </div>
                    </div>

                    {lastSm2Report && (
                      <div className="p-3 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono tabular-nums">
                        SM-2 Updated → Quality: {lastSm2Report.quality} · Repetitions: {lastSm2Report.repetitions} · New Interval: {lastSm2Report.interval_days}d · New EF: {lastSm2Report.easiness_factor} · Next Review: {lastSm2Report.next_review_date}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Project 08 UC7: Build a Deck from Any Pasted Article/Text */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div>
                  <div className="text-xs text-slate-500">Project 08 · UC7 Deck Builder (LLM)</div>
                  <h3 className="text-base font-bold text-slate-900">
                    Build an SM-2 Flashcard Deck from Any Article or Notes
                  </h3>
                </div>
                <input
                  type="text"
                  value={deckNameInput}
                  onChange={(e) => setDeckNameInput(e.target.value)}
                  placeholder="Deck name..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <textarea
                  rows={4}
                  value={deckSourceText}
                  onChange={(e) => setDeckSourceText(e.target.value)}
                  placeholder="Paste an article, textbook paragraph, or lecture notes..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <button
                  onClick={handleExtractDeck}
                  disabled={extractingDeck}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {extractingDeck
                    ? "Extracting Vocabulary & Examples with Gemini..."
                    : "Extract 4 Flashcards into SM-2 Deck"}
                </button>
              </div>
            </div>

            {/* Right 6 Columns: Project 08 UC6 Role-Play Conversation Partner with Gentle Corrections */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div>
                  <div className="text-xs text-slate-500">
                    Project 08 · UC6 AI Conversation Partner &amp; CEFR Coach
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    Interactive Role-Play with Gentle Corrections
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Active Role-Play Scenario
                  </label>
                  <input
                    type="text"
                    value={roleplayScenario}
                    onChange={(e) => setRoleplayScenario(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 max-h-[380px] overflow-y-auto">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-lg text-xs space-y-1.5 ${
                        msg.speaker === "user"
                          ? "bg-blue-600 text-white ml-8"
                          : "bg-white border border-slate-200 text-slate-800 mr-8"
                      }`}
                    >
                      <div className="font-semibold flex items-center justify-between">
                        <span>{msg.speaker === "user" ? activeUser?.displayName : "AI Role-Play Partner"}</span>
                        {msg.speaker === "partner" && (
                          <button
                            onClick={() => handleSpeakText(msg.text)}
                            className="text-slate-500 hover:text-slate-900 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="leading-relaxed">{msg.text}</p>
                      {msg.note && (
                        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          Translation: {msg.note}
                        </div>
                      )}
                      {msg.correction && (
                        <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                          <span className="font-semibold">Coach Tip: </span>
                          {msg.correction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {suggestedPhrase && (
                  <div className="text-xs text-slate-600 flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg">
                    <span>
                      <strong className="text-slate-900">Suggested Next Phrase:</strong> “{suggestedPhrase}”
                    </span>
                    <button
                      onClick={() => setChatInput(suggestedPhrase)}
                      className="text-blue-600 font-semibold hover:underline ml-2 shrink-0 cursor-pointer"
                    >
                      Use Phrase
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Reply in Spanish, English, or Persian..."
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-xs"
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={chatSending}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{chatSending ? "Replying..." : "Send"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            VIEW 3: AI TUTOR & "EXPLAIN IT DIFFERENTLY" (Project 04 & 05 UC5)
           ----------------------------------------------------------------- */}
        {activeNav === "tutor" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-500">
                  Project 04 &amp; Project 05 UC5 · Personalized Multi-Style Explainer
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Explain It Differently &amp; Socratic AI Tutor
                </h2>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confusing Concept, Textbook Paragraph, or Wrong Quiz Question
                </label>
                <textarea
                  rows={4}
                  value={tutorConcept}
                  onChange={(e) => setTutorConcept(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Explanation Style (UC3)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Simple", "Analogy", "Story", "Step-by-Step", "Deeper", "Teach-Back"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setTutorStyle(st)}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        tutorStyle === st
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Personalize with Your Hobby / Interest (UC1 Profile)
                </label>
                <input
                  type="text"
                  value={tutorInterest}
                  onChange={(e) => setTutorInterest(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={() => handleAskTutor(false)}
                  disabled={tutorLoading}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {tutorLoading ? "Generating Explanation..." : `Explain via ${tutorStyle}`}
                </button>
                {tutorOutput && (
                  <button
                    onClick={() => handleAskTutor(true)}
                    disabled={tutorLoading}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Still Confused? New Angle</span>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              {!tutorOutput ? (
                <div className="py-12 text-center space-y-2">
                  <div className="text-sm font-semibold text-slate-900">
                    Ready to Explain Any Concept Your Way
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Select a style on the left and click “Explain” to receive a personalized explanation, non-spoiling Socratic hint, and 2 quick comprehension check questions.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="text-xs text-slate-500 font-mono">
                      Style: {tutorOutput.styleUsed} · Grounded in Hobby: {tutorOutput.interestWovenIn}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{tutorOutput.title}</h3>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {tutorOutput.explanationText}
                  </p>

                  <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-blue-950">
                    <span className="font-semibold">Non-Spoiling Socratic Hint: </span>
                    {tutorOutput.nonSpoilingHint}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-900">Key Takeaways:</div>
                    <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                      {(tutorOutput.keyTakeaways || []).map((tk: string, i: number) => (
                        <li key={i}>{tk}</li>
                      ))}
                    </ul>
                  </div>

                  {/* UC6 Quick Check */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-900">
                      UC6: Quick Understanding Check
                    </div>
                    {(tutorOutput.quickChecks || []).map((qc: any, idx: number) => (
                      <div key={idx} className="p-3.5 rounded-lg border border-slate-200 space-y-2">
                        <div className="text-xs font-semibold text-slate-900">
                          {idx + 1}. {qc.question}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(qc.options || []).map((opt: string, oIdx: number) => {
                            const picked = tutorCheckAnswers[idx] === oIdx;
                            const isRight = oIdx === qc.correctIndex;
                            return (
                              <button
                                key={oIdx}
                                onClick={() =>
                                  setTutorCheckAnswers((prev) => ({ ...prev, [idx]: oIdx }))
                                }
                                className={`p-2 rounded border text-left text-xs cursor-pointer ${
                                  picked
                                    ? isRight
                                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold"
                                      : "border-red-500 bg-red-50 text-red-900"
                                    : "border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {tutorCheckAnswers[idx] !== undefined && (
                          <div className="text-xs text-slate-600 pt-1">{qc.explanation}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            VIEW 4: ALL 9 SHIRAZ UNIVERSITY PROJECT PROPOSALS HUB
           ----------------------------------------------------------------- */}
        {activeNav === "proposals" && (
          <ProposalsHubView
            onJumpToWorkspace={(tab) => setActiveNav(tab as NavSection)}
            onRefreshState={fetchState}
          />
        )}

        {/* -----------------------------------------------------------------
            VIEW 5: DESIGN DOCS, UML, TEACHER AUTHORING (UC7) & ADMIN (UC8)
           ----------------------------------------------------------------- */}
        {activeNav === "design" && (
          <div className="space-y-10">
            {/* Teacher Course Authoring Studio (UC7) & Admin AI Usage Monitor (UC8) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* UC7: Teacher AI Course Authoring */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div>
                  <div className="text-xs text-slate-500">
                    UC7 (Actor: Teacher) · AI Authoring Assistant + Quality Guard
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    Author &amp; Publish a New Lesson with AI
                  </h3>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Lesson Topic Title
                  </label>
                  <input
                    type="text"
                    value={authorTopic}
                    onChange={(e) => setAuthorTopic(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Syllabus Notes / Learning Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={authorSyllabus}
                    onChange={(e) => setAuthorSyllabus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <button
                  onClick={handleGenerateLessonDraft}
                  disabled={authorLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {authorLoading
                    ? "Drafting Lesson & Validating Quiz JSON..."
                    : "Draft Lesson & Validated Quiz with AI"}
                </button>

                {authorDraft && (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div className="font-bold text-slate-900">
                      Draft Ready: {authorDraft.title}
                    </div>
                    <p className="text-slate-600">{authorDraft.summary}</p>
                    <div className="text-emerald-700 font-mono">
                      ✓ {authorDraft.quiz?.length || 0} Multiple-Choice Questions + 1 Written Prompt Verified
                    </div>
                    <button
                      onClick={handlePublishLessonDraft}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg cursor-pointer"
                    >
                      Approve &amp; Publish to Course Catalog
                    </button>
                  </div>
                )}
              </div>

              {/* UC8: Admin Learning Analytics, AI Cost Telemetry & Account Moderation */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">
                      UC8 (Actor: Admin) · Page 23 Log &amp; Measure · Rate-Limit &amp; Cost Control
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      AI Request Logs, Token Cost &amp; Account Moderation
                    </h3>
                  </div>
                </div>

                {/* User Account Moderation Strip */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-xs font-semibold text-slate-900">
                    Account Access &amp; Abuse Protection (Click to Block / Unblock AI Access):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(appState?.users || []).map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => handleToggleBlockUser(u.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors cursor-pointer ${
                          u.isBlocked
                            ? "bg-red-50 border-red-300 text-red-800"
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {u.username} · {u.isBlocked ? "BLOCKED (Click to Unblock)" : "ACTIVE"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* High-Density AI Telemetry Data Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-3">Feature / Use Case</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3 text-right">Latency</th>
                        <th className="py-2.5 px-3 text-right">Tokens</th>
                        <th className="py-2.5 px-3 text-right">Est. Cost</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-[11px]">
                      {(appState?.aiLogs || []).slice(0, 10).map((log: any) => (
                        <tr key={log.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-sans font-medium text-slate-900">
                            {log.feature}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{log.username}</td>
                          <td className="py-2 px-3 text-right text-slate-700">{log.latencyMs} ms</td>
                          <td className="py-2 px-3 text-right text-slate-700">{log.tokens}</td>
                          <td className="py-2 px-3 text-right text-slate-700">
                            ${Number(log.costUsd).toFixed(5)}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={
                                log.status.includes("BLOCKED")
                                  ? "text-red-600 font-semibold"
                                  : log.cacheHit
                                  ? "text-blue-600 font-semibold"
                                  : "text-emerald-700"
                              }
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Interactive UML Diagrams, Schema & Python Unit Test Runner */}
            <DesignAndDjangoView promptRegistry={appState?.promptRegistry} />
          </div>
        )}
      </main>

      {/* =====================================================================
          UC1: AI PLACEMENT TEST MODAL
         ===================================================================== */}
      {showPlacementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs text-slate-500">
                  UC1 · Adaptive Placement Test (Server-Side Gemini 3.8 Flash)
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Take a Subject Placement Assessment
                </h3>
              </div>
              <button
                onClick={() => setShowPlacementModal(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Subject or Language
                </label>
                <input
                  type="text"
                  value={placementSubject}
                  onChange={(e) => setPlacementSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Background
                </label>
                <input
                  type="text"
                  value={placementBg}
                  onChange={(e) => setPlacementBg(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleGeneratePlacement}
              disabled={placementLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {placementLoading
                ? "Generating 4 Progressive Placement Questions..."
                : "Generate AI Placement Test"}
            </button>

            {placementQuiz?.questions && (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {placementQuiz.questions.map((q: any, idx: number) => (
                  <div key={q.id || idx} className="p-3.5 rounded-lg border border-slate-200 space-y-2">
                    <div className="text-[11px] font-mono text-slate-500">
                      {q.difficultyLabel} · Topic: {q.topic}
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      {idx + 1}. {q.question}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(q.options || []).map((opt: string, oIdx: number) => (
                        <button
                          key={oIdx}
                          onClick={() =>
                            setPlacementAnswers((prev) => ({ ...prev, [idx]: oIdx }))
                          }
                          className={`p-2 rounded border text-left text-xs cursor-pointer ${
                            placementAnswers[idx] === oIdx
                              ? "border-blue-600 bg-blue-50 text-blue-950 font-semibold"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmitPlacement}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Submit Placement Test &amp; Calibrate Starting Level
                </button>
              </div>
            )}

            {placementResult && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-bold">
                  Placement Complete! Calibrated Level: {placementResult.placedCefr} · Score: {placementResult.correct}/{placementResult.total} (+{placementResult.bonusXp} XP)
                </div>
                <div>
                  Your profile, daily quests, and spaced-repetition deck have been calibrated to{" "}
                  <strong>{placementResult.placedCefr}</strong>.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiet Editorial Footer (No telemetry tickers per frontend-design rules) */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Shiraz University · Fall 2026 · Systems Analysis and Design — Integrating AI into Applications
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveNav("proposals")}
              className="hover:text-slate-900 cursor-pointer"
            >
              All 9 Project Proposals
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveNav("design")}
              className="hover:text-slate-900 cursor-pointer"
            >
              UML &amp; Django Test Suite
            </button>
            <span>·</span>
            <a
              href="/assets/aistudio/Project_Proposals_23ef3f93.pdf"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900"
            >
              Course PDF
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
