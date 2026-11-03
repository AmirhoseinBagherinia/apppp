import React, { useState } from "react";
import { PROPOSALS_CATALOG, ProposalSpec } from "../data/proposalsCatalog";
import { Play, Upload, CheckCircle2, ShieldCheck, BookOpen, ArrowUpRight } from "lucide-react";

interface ProposalsHubViewProps {
  onJumpToWorkspace: (tab: string) => void;
  onRefreshState: () => void;
}

export const ProposalsHubView: React.FC<ProposalsHubViewProps> = ({
  onJumpToWorkspace,
  onRefreshState,
}) => {
  const [selectedId, setSelectedId] = useState<string>("05");
  const selectedProposal: ProposalSpec =
    PROPOSALS_CATALOG.find((p) => p.id === selectedId) || PROPOSALS_CATALOG[4];

  const [userInput, setUserInput] = useState<string>(selectedProposal.defaultInput);
  const [secondaryInput, setSecondaryInput] = useState<string>(selectedProposal.defaultSecondaryInput);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    summary: string;
    groundedChecks: string[];
    structuredOutput: { title: string; subtitle: string; metadataLine: string; detail: string }[];
    followUpAction: string;
  } | null>(null);

  const handleSelectProposal = (prop: ProposalSpec) => {
    setSelectedId(prop.id);
    setUserInput(prop.defaultInput);
    setSecondaryInput(prop.defaultSecondaryInput);
    setImageBase64(null);
    setImageMimeType(null);
    setImageFileName("");
    setAiResult(null);
    setError(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
    setImageMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64Part = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
      setImageBase64(base64Part);
    };
    reader.readAsDataURL(file);
  };

  const handleExecuteProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/proposals/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: `${selectedProposal.number} - ${selectedProposal.title}`,
          userInput,
          secondaryInput,
          imageBase64,
          imageMimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Execution error");
      } else {
        setAiResult(data);
        onRefreshState();
      }
    } catch (err: any) {
      setError(err?.message || "Network error while calling backend AI Core.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-1.5 max-w-3xl">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Shiraz University</span>
            <span aria-hidden="true">·</span>
            <span>Fall 2026</span>
            <span aria-hidden="true">·</span>
            <span>Systems Analysis and Design</span>
            <span aria-hidden="true">·</span>
            <span>All 9 Proposals Interactive AI Core</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Nine Product Ideas. One LLM-Powered Core.
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Inspect the required use cases (UC1–UC8), the 5 mandatory Design Document answers, and run the live server-side Gemini AI pipeline for every single project proposal in the syllabus. Projects 05 &amp; 08 (the two Django-recommended blueprints) are also deeply integrated into the main learning workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="/assets/aistudio/Project_Proposals_23ef3f93.pdf"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Syllabus PDF</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => onJumpToWorkspace("learn")}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Open Django Learning Workspace
          </button>
        </div>
      </div>

      {/* 9-Project Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
        {PROPOSALS_CATALOG.map((prop) => {
          const isSelected = prop.id === selectedId;
          return (
            <button
              key={prop.id}
              onClick={() => handleSelectProposal(prop)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-xs font-mono tabular-nums opacity-75">
                {prop.number} · {"●".repeat(prop.difficultyDots)}
              </div>
              <div className="text-xs font-semibold mt-1 truncate">{prop.title}</div>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Selected Project Use Cases & 5 Design Doc Answers (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  Proposal {selectedProposal.number} · AI Core: {selectedProposal.aiCoreBadge} · Stack: {selectedProposal.suggestedBackend}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedProposal.number}. {selectedProposal.title} — {selectedProposal.tagline}
                </h3>
              </div>
              {(selectedProposal.id === "05" || selectedProposal.id === "08" || selectedProposal.id === "04") && (
                <button
                  onClick={() =>
                    onJumpToWorkspace(
                      selectedProposal.id === "08"
                        ? "language"
                        : selectedProposal.id === "04"
                        ? "tutor"
                        : "learn"
                    )
                  }
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Open Dedicated Full Module →
                </button>
              )}
            </div>

            {/* Required Use Cases Table (UC1 - UC8) */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">
                Required Use Cases Implemented ({selectedProposal.useCases.length} End-to-End Flows)
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {selectedProposal.useCases.map((uc) => (
                  <div
                    key={uc.code}
                    className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                        <span className="font-mono text-slate-500 tabular-nums">{uc.code}</span>
                        <span>{uc.title}</span>
                        {uc.isAi && (
                          <span className="text-blue-600 font-normal">· LLM Core</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{uc.desc}</p>
                    </div>
                    <div className="text-xs text-slate-500 shrink-0 font-mono">
                      Actor: {uc.actor}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Page 22 Ground Rules: The 5 Design Document Questions for this Project */}
            <div className="pt-2 space-y-3">
              <div className="text-xs text-slate-500">
                Page 22 Ground Rules · Design Document Contract for Proposal {selectedProposal.number}
              </div>
              <h4 className="text-sm font-semibold text-slate-900">
                5 Mandatory AI Architecture &amp; Safety Answers
              </h4>
              <div className="grid grid-cols-1 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-slate-900">1. The Problem — Why an LLM is the right tool</div>
                  <p className="text-slate-600 leading-relaxed">{selectedProposal.designDoc5Answers.problem}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-slate-900">2. The Contract — Strict Input &amp; Structured JSON Output</div>
                  <p className="text-slate-600 font-mono text-[11px] leading-relaxed">{selectedProposal.designDoc5Answers.contract}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-slate-900">3. The Checks — Real-Data Grounding &amp; Validation</div>
                  <p className="text-slate-600 leading-relaxed">{selectedProposal.designDoc5Answers.checks}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-slate-900">4. The Failure Plan — Timeout, Rate Limit &amp; Offline Fallback</div>
                  <p className="text-slate-600 leading-relaxed">{selectedProposal.designDoc5Answers.failurePlan}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="font-semibold text-slate-900">5. The Proof — Evaluation Metrics &amp; Test Cases</div>
                  <p className="text-slate-600 leading-relaxed">{selectedProposal.designDoc5Answers.proof}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive AI Core Sandbox for Selected Proposal (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-500">
                Live AI Core Pipeline · Server-Side Gemini 3.8 Flash
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Test Proposal {selectedProposal.number}: {selectedProposal.title}
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Primary User Input (Free text, notes, pantry items, mood, or trip wish)
                </label>
                <textarea
                  rows={3}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Grounding Context / Catalog IDs / Constraints
                </label>
                <input
                  type="text"
                  value={secondaryInput}
                  onChange={(e) => setSecondaryInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {selectedProposal.supportsImageUpload && (
                <div className="pt-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Optional Multimodal Photo Input (Fridge photo for #02 or Garment photo for #09)
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-50 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{imageFileName ? `Attached: ${imageFileName}` : "Upload Photo (PNG/JPEG)"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <button
                onClick={handleExecuteProposal}
                disabled={loading || !userInput.trim()}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {loading
                    ? "Running Backend Prompt -> Gemini -> JSON Validator..."
                    : `Run ${selectedProposal.title} AI Core`}
                </span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            {aiResult && (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validated Structured JSON Output</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{aiResult.summary}</p>
                </div>

                {/* Grounding checks */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-700">
                    Real-Data Grounding &amp; Safety Checks Passed:
                  </div>
                  <ul className="space-y-1">
                    {(aiResult.groundedChecks || []).map((chk, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{chk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Structured cards */}
                <div className="space-y-2.5">
                  {(aiResult.structuredOutput || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1"
                    >
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.subtitle} · {item.metadataLine}
                      </div>
                      <div className="text-xs font-bold text-slate-900">{item.title}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-slate-600 pt-1">
                  <span className="font-semibold text-slate-900">Next Recommended Action: </span>
                  {aiResult.followUpAction}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
