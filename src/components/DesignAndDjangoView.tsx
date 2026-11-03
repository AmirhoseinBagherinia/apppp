import React, { useState } from "react";
import { Play, CheckCircle2, FileCode, Database, GitBranch, Layers } from "lucide-react";

interface DesignAndDjangoViewProps {
  promptRegistry: any;
}

export const DesignAndDjangoView: React.FC<DesignAndDjangoViewProps> = ({ promptRegistry }) => {
  const [diagramTab, setDiagramTab] = useState<"usecase" | "class" | "sequence" | "schema">("sequence");
  const [testRunning, setTestRunning] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ passed: boolean; output: string } | null>(null);

  const handleRunPythonTests = async () => {
    setTestRunning(true);
    try {
      const res = await fetch("/api/v1/tests/run-python", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ passed: false, output: err?.message || "Failed to execute Python test runner." });
    } finally {
      setTestRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Live Python Unit Test Runner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-1.5 max-w-3xl">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Page 22 &amp; 23 Ground Rules</span>
            <span aria-hidden="true">·</span>
            <span>UML Models</span>
            <span aria-hidden="true">·</span>
            <span>Django ORM Schema</span>
            <span aria-hidden="true">·</span>
            <span>Automated Python Unit Tests</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Systems Analysis, UML Architecture &amp; Django Verification
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Complete engineering artifacts required by the Shiraz University Fall 2026 evaluation rubric: Use Case, Class, and Sequence UML diagrams, relational database schema, versioned prompt registry, and live execution of <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">python3 backend/core/tests.py</code>.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={handleRunPythonTests}
            disabled={testRunning}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{testRunning ? "Running python3 backend/core/tests.py..." : "Run Python Backend Unit Tests"}</span>
          </button>
        </div>
      </div>

      {/* Live Test Output Console */}
      {testResult && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Python 3.10 unittest Suite Result ({testResult.passed ? "ALL TESTS PASSED" : "CHECK OUTPUT"})
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500">backend/core/tests.py</span>
          </div>
          <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
            {testResult.output}
          </pre>
        </div>
      )}

      {/* Interactive UML & Schema Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs text-slate-500">Analysis &amp; Design Deliverables (20% Grade Weight)</div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Interactive UML Diagrams &amp; Relational Database Schema
            </h3>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setDiagramTab("sequence")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                diagramTab === "sequence" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              UML Sequence Diagram
            </button>
            <button
              onClick={() => setDiagramTab("usecase")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                diagramTab === "usecase" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              UML Use Case Diagram
            </button>
            <button
              onClick={() => setDiagramTab("class")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                diagramTab === "class" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              UML Class Diagram
            </button>
            <button
              onClick={() => setDiagramTab("schema")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                diagramTab === "schema" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Django ORM &amp; SQL Schema
            </button>
          </div>
        </div>

        {/* 1. SEQUENCE DIAGRAM */}
        {diagramTab === "sequence" && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600">
              Models the Page 23 Responsible AI Feature Pipeline across lifelines: React Client → Django REST View → Prompt Builder &amp; Cache → Gemini 3.8 Flash API → Python <code className="font-mono">AIOutputQualityGuard</code> → SQLite/PostgreSQL Persistence.
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-slate-50 p-4">
              <svg viewBox="0 0 980 430" className="w-full min-w-[780px] h-auto font-sans">
                {/* Lifeline Headers */}
                {[
                  { x: 90, label: "Learner / Teacher", sub: "React SPA Client" },
                  { x: 270, label: "Django REST View", sub: "Rate Limit & Auth" },
                  { x: 450, label: "Cache & Prompt", sub: "prompt_registry.json" },
                  { x: 630, label: "Gemini LLM API", sub: "gemini-3.8-flash" },
                  { x: 830, label: "Quality Guard & DB", sub: "rules_engine.py + SQL" },
                ].map((lf, idx) => (
                  <g key={idx}>
                    <rect x={lf.x - 75} y={12} width={150} height={46} rx={6} fill="#0f172a" />
                    <text x={lf.x} y={32} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
                      {lf.label}
                    </text>
                    <text x={lf.x} y={48} textAnchor="middle" fill="#94a3b8" fontSize="9.5">
                      {lf.sub}
                    </text>
                    <line
                      x1={lf.x}
                      y1={58}
                      x2={lf.x}
                      y2={410}
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      strokeDasharray="5,5"
                    />
                  </g>
                ))}

                {/* Arrows & Messages */}
                <defs>
                  <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill="#0284c7" />
                  </marker>
                  <marker id="arrowReturn" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 Z" fill="#059669" />
                  </marker>
                </defs>

                {/* Step 1 */}
                <line x1={90} y1={95} x2={265} y2={95} stroke="#0284c7" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x={177} y={88} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  1. POST /api/v1/... (User Input as Data)
                </text>

                {/* Step 2 */}
                <line x1={270} y1={135} x2={445} y2={135} stroke="#0284c7" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x={357} y={128} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  2. Validate Input &amp; Check Cache Hash
                </text>

                {/* Step 3 */}
                <line x1={450} y1={180} x2={625} y2={180} stroke="#0284c7" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x={537} y={172} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  3. generateContent (responseSchema JSON)
                </text>

                {/* Step 4 */}
                <line x1={630} y1={225} x2={455} y2={225} stroke="#059669" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#arrowReturn)" />
                <text x={542} y={217} textAnchor="middle" fill="#059669" fontSize="10" fontWeight="600">
                  4. Raw Structured JSON Candidate
                </text>

                {/* Step 5 */}
                <line x1={450} y1={275} x2={825} y2={275} stroke="#0284c7" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x={637} y={267} textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
                  5. AIOutputQualityGuard + Catalog/DB Grounding Check
                </text>

                {/* Step 6 */}
                <line x1={830} y1={325} x2={275} y2={325} stroke="#059669" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#arrowReturn)" />
                <text x={552} y={317} textAnchor="middle" fill="#059669" fontSize="10" fontWeight="600">
                  6. Persist Verified Result + Record AIUsageLog (Latency &amp; Cost)
                </text>

                {/* Step 7 */}
                <line x1={270} y1={375} x2={95} y2={375} stroke="#059669" strokeWidth="2" markerEnd="url(#arrowReturn)" />
                <text x={182} y={367} textAnchor="middle" fill="#059669" fontSize="10" fontWeight="600">
                  7. 200 OK Validated JSON (or Safe Fallback on Timeout)
                </text>
              </svg>
            </div>
          </div>
        )}

        {/* 2. USE CASE DIAGRAM */}
        {diagramTab === "usecase" && (
          <div className="space-y-4">
            <div className="text-xs text-slate-600">
              Maps the three primary system actors (<strong className="text-slate-900">Learner</strong>, <strong className="text-slate-900">Teacher / Tutor</strong>, and <strong className="text-slate-900">Admin / Moderator</strong>) to the implemented end-to-end use cases.
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-slate-50 p-4">
              <svg viewBox="0 0 920 420" className="w-full min-w-[740px] h-auto font-sans">
                {/* System Boundary Box */}
                <rect x={220} y={15} width={480} height={390} rx={12} fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                <text x={460} y={40} textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700">
                  System Boundary: Shiraz SAD Gamified &amp; Language AI Platform
                </text>

                {/* Actors Left */}
                <rect x={30} y={95} width={120} height={60} rx={8} fill="#0284c7" />
                <text x={90} y={122} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Actor: Learner</text>
                <text x={90} y={140} textAnchor="middle" fill="#e0f2fe" fontSize="9.5">UC1 – UC6</text>

                <rect x={30} y={275} width={120} height={60} rx={8} fill="#0f172a" />
                <text x={90} y={302} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Actor: Teacher</text>
                <text x={90} y={320} textAnchor="middle" fill="#cbd5e1" fontSize="9.5">UC7 &amp; Deck Assign</text>

                {/* Actor Right */}
                <rect x={770} y={190} width={120} height={60} rx={8} fill="#059669" />
                <text x={830} y={217} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Actor: Admin</text>
                <text x={830} y={235} textAnchor="middle" fill="#d1fae5" fontSize="9.5">UC8 Governance</text>

                {/* Use Case Ellipses */}
                {[
                  { y: 75, text: "UC1: AI Placement Test & CEFR Onboarding (LLM)", actor: "learner" },
                  { y: 120, text: "UC2 & UC3: Complete Lesson, Rules Engine XP & Shop", actor: "learner" },
                  { y: 165, text: "UC4: Personalized Daily Quests & SM-2 Flashcards (LLM)", actor: "learner" },
                  { y: 210, text: "UC5: Multi-Style AI Tutor & Writing Coach (LLM)", actor: "learner" },
                  { y: 255, text: "UC6: Weekly Leagues, Friends & Role-Play Chat (LLM)", actor: "learner" },
                  { y: 310, text: "UC7: AI Course & Quiz Authoring + Quality Guard (LLM)", actor: "teacher" },
                  { y: 360, text: "UC8: AI Cost/Latency Telemetry & Account Moderation", actor: "admin" },
                ].map((uc, i) => (
                  <g key={i}>
                    <rect x={260} y={uc.y - 16} width={400} height={32} rx={16} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                    <text x={460} y={uc.y + 4} textAnchor="middle" fill="#0f172a" fontSize="10.5" fontWeight="600">
                      {uc.text}
                    </text>
                    {uc.actor === "learner" && (
                      <line x1={150} y1={125} x2={260} y2={uc.y} stroke="#0284c7" strokeWidth="1.3" />
                    )}
                    {uc.actor === "teacher" && (
                      <line x1={150} y1={305} x2={260} y2={uc.y} stroke="#0f172a" strokeWidth="1.3" />
                    )}
                    {uc.actor === "admin" && (
                      <line x1={770} y1={220} x2={660} y2={uc.y} stroke="#059669" strokeWidth="1.3" />
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}

        {/* 3. CLASS DIAGRAM */}
        {diagramTab === "class" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <div className="bg-slate-900 text-white px-4 py-2 font-mono font-semibold">
                class UserProfile(models.Model)
              </div>
              <div className="p-4 space-y-1 font-mono text-[11px] text-slate-700 border-b border-slate-100">
                <div>+ username: CharField(unique=True)</div>
                <div>+ role: Learner | Teacher | Admin</div>
                <div>+ xp: IntegerField</div>
                <div>+ level: IntegerField</div>
                <div>+ gems: IntegerField</div>
                <div>+ streak_days: IntegerField</div>
                <div>+ cefr_level: CharField</div>
                <div>+ weak_topics: JSONField</div>
                <div>+ is_blocked: BooleanField</div>
              </div>
              <div className="p-3 bg-slate-50 font-mono text-[11px] text-slate-600">
                + can_invoke_ai(): bool<br />
                + record_weak_topic(topic: str)
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <div className="bg-blue-700 text-white px-4 py-2 font-mono font-semibold">
                class GamificationRulesEngine
              </div>
              <div className="p-4 space-y-1 font-mono text-[11px] text-slate-700 border-b border-slate-100">
                <div>+ BASE_LESSON_XP: int = 50</div>
                <div>+ PERFECT_QUIZ_BONUS_XP: int = 30</div>
                <div>+ STREAK_BONUS_PER_DAY: int = 5</div>
                <div>+ LEVEL_THRESHOLDS: List[Tuple]</div>
                <div>+ BADGE_CATALOG: List[Dict]</div>
              </div>
              <div className="p-3 bg-slate-50 font-mono text-[11px] text-slate-600">
                + calculate_level(xp) -&gt; Dict<br />
                + award_lesson_completion(...)<br />
                + update_streak(streak, dates, freeze)
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <div className="bg-emerald-700 text-white px-4 py-2 font-mono font-semibold">
                class SM2SpacedRepetitionScheduler
              </div>
              <div className="p-4 space-y-1 font-mono text-[11px] text-slate-700 border-b border-slate-100">
                <div>+ MIN_EASINESS_FACTOR: float = 1.3</div>
                <div>+ quality: int (0..5)</div>
                <div>+ repetitions: int</div>
                <div>+ interval_days: int</div>
                <div>+ easiness_factor: float</div>
              </div>
              <div className="p-3 bg-slate-50 font-mono text-[11px] text-slate-600">
                + schedule_card(q, reps, I, EF)<br />
                + validate_quiz_questions(json)
              </div>
            </div>
          </div>
        )}

        {/* 4. SCHEMA & DJANGO FILES */}
        {diagramTab === "schema" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Django Backend File Tree (/backend/)</span>
              </div>
              <ul className="space-y-1.5 font-mono text-[11px] text-slate-700">
                <li>/backend/manage.py — Django CLI &amp; management utility</li>
                <li>/backend/config/settings.py — DB, Cache, CORS &amp; Gemini config</li>
                <li>/backend/config/urls.py — REST endpoint routing</li>
                <li>/backend/core/models.py — UserProfile, Course, Lesson, Flashcard, DailyQuest, AIUsageLog</li>
                <li>/backend/core/rules_engine.py — Pure Python XP/Streak/Badge &amp; SM-2 engine</li>
                <li>/backend/core/views.py — REST controllers calling rules_engine</li>
                <li>/backend/core/tests.py — Automated unittest suite with mocked AI</li>
                <li>/backend/prompts/prompt_registry.json — Versioned prompt templates</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                <span>Versioned Prompt Registry (Page 23 Requirement)</span>
              </div>
              <div className="divide-y divide-slate-200">
                {Object.values(promptRegistry?.prompts || {}).map((p: any) => (
                  <div key={p.id} className="py-2 space-y-0.5">
                    <div className="font-mono text-[11px] font-semibold text-slate-900">
                      {p.id} · v{p.version} · maxTokens: {p.maxTokens}
                    </div>
                    <div className="text-[11px] text-slate-600">{p.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
