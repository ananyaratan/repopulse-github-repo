"use client";

import * as React from "react";
import { SilkShaderBg } from "@/components/ui/silk-shader-bg";
import { ImageStreamHero, type StreamCardItem } from "@/components/ui/image-stream-hero";
import { DiscCascadeCarousel } from "@/components/ui/disc-cascade-carousel";
import { ContributionSkyline } from "@/components/ui/contribution-skyline";
import { AnimatedFoldersShowcase } from "@/components/ui/3d-folder";
import { DEFAULT_SKILLS, SEED_REPOS } from "@/data/seed-repos";
import { fetchGitHubReposOrUrl, scoreIssue, type RepoIssue, type RepoRecord } from "@/lib/github";

const HERO_ITEMS: StreamCardItem[] = [
  { gradient: "linear-gradient(135deg,#312e81,#0f172a)", label: "TypeScript", tag: "good first issue" },
  { gradient: "linear-gradient(135deg,#064e3b,#09090b)", label: "React", tag: "Hacktoberfest" },
  { gradient: "linear-gradient(135deg,#4c1d95,#09090b)", label: "Tailwind CSS", tag: "UI / Docs" },
  { gradient: "linear-gradient(135deg,#1e3a8a,#020617)", label: "Next.js", tag: "Starter PR" },
  { gradient: "linear-gradient(135deg,#701a75,#09090b)", label: "Python", tag: "GSoC Ready" },
  { gradient: "linear-gradient(135deg,#0f766e,#09090b)", label: "JavaScript", tag: "Easy Fix" },
  { gradient: "linear-gradient(135deg,#7c2d12,#09090b)", label: "Git & CLI", tag: "First Commit" },
  { gradient: "linear-gradient(135deg,#3730a3,#09090b)", label: "Open Source", tag: "Tests" },
  { gradient: "linear-gradient(135deg,#14532d,#09090b)", label: "Accessibility", tag: "WCAG AA" },
];

interface ChatMsg {
  role: "mentor" | "user";
  text: string;
  codeBlock?: string;
}

export function RepoPulseApp() {
  const [activeTab, setActiveTab] = React.useState<"workspace" | "prompts">("workspace");
  const [allSkills, setAllSkills] = React.useState<string[]>(DEFAULT_SKILLS);
  const [skills, setSkills] = React.useState<Set<string>>(() => new Set(["TypeScript", "React", "Tailwind CSS"]));
  const [customSkill, setCustomSkill] = React.useState("");
  const [repos, setRepos] = React.useState<RepoRecord[]>(SEED_REPOS);
  const [activeDiscIndex, setActiveDiscIndex] = React.useState(1);
  const [selectedIssueId, setSelectedIssueId] = React.useState<number | null>(SEED_REPOS[1].issues[0].id);
  const [issueFilter, setIssueFilter] = React.useState<"all" | "easy" | "medium" | "stretch">("all");
  const [repoInput, setRepoInput] = React.useState("");
  const [apiStatus, setApiStatus] = React.useState("");
  const [checklistDone, setChecklistDone] = React.useState<Set<string>>(() => new Set());
  const [chatInput, setChatInput] = React.useState("");
  const [toast, setToast] = React.useState<string | null>(null);

  const selectedRepo = repos[activeDiscIndex] || repos[0];
  const selectedIssue: RepoIssue | undefined =
    selectedRepo.issues.find((i) => i.id === selectedIssueId) || selectedRepo.issues[0];

  const [chatMessages, setChatMessages] = React.useState<ChatMsg[]>(() => [
    {
      role: "mentor",
      text: `Hi! I'm your Contribution Mentor for ${SEED_REPOS[1].fullName}. We're looking at #${SEED_REPOS[1].issues[0].number} (${SEED_REPOS[1].issues[0].title}). Use the quick buttons above to inspect requirements, find target files, or draft your PR description.`,
    },
  ]);

  const analyzerRef = React.useRef<HTMLElement | null>(null);
  const mentorRef = React.useRef<HTMLElement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => showToast("Copied to clipboard"));
  };

  const switchRepo = (idx: number, repoList: RepoRecord[] = repos) => {
    const clamped = Math.max(0, Math.min(repoList.length - 1, idx));
    const r = repoList[clamped];
    setActiveDiscIndex(clamped);
    setSelectedIssueId(r.issues[0]?.id ?? null);
    setChatMessages([
      {
        role: "mentor",
        text: `Hi! I'm your Contribution Mentor for ${r.fullName}. ${
          r.issues[0] ? `We're looking at #${r.issues[0].number} (${r.issues[0].title}). ` : ""
        }Use the quick buttons above to inspect requirements, find target files, or draft your PR description.`,
      },
    ]);
  };

  const handleFetchRepo = async () => {
    const raw = repoInput.trim();
    if (!raw) {
      showToast("Enter a GitHub URL or topic keyword");
      return;
    }
    setApiStatus("Fetching from GitHub API...");
    try {
      const fetched = await fetchGitHubReposOrUrl(raw);
      const nextRepos = raw.includes("/") ? [fetched[0], ...repos] : fetched;
      setRepos(nextRepos);
      switchRepo(0, nextRepos);
      setApiStatus(`Loaded live: ${fetched[0].fullName}`);
      showToast(`Loaded ${fetched[0].fullName} from GitHub`);
    } catch {
      setApiStatus("Using curated starter catalogue (API unavailable/rate-limited)");
      showToast("GitHub API unavailable — showing curated repos");
    }
  };

  const handleMentorAction = (action: "explain" | "files" | "pr") => {
    if (!selectedIssue) return;
    const meta = scoreIssue(selectedIssue, selectedRepo, skills);
    if (action === "explain") {
      setChatMessages((prev) => [
        ...prev,
        { role: "user", text: "Explain this issue in plain English." },
        {
          role: "mentor",
          text: `Issue #${selectedIssue.number} has a ${meta.score}/10 difficulty (${meta.est}).\n\nWhat's being asked: ${selectedIssue.body || selectedIssue.title}\n\nYour game plan:\n1. Locate the exact module in ${selectedRepo.fullName}.\n2. Keep your diff focused only on what #${selectedIssue.number} asks for.\n3. Verify with the repo's local check before committing.`,
        },
      ]);
    } else if (action === "files") {
      setChatMessages((prev) => [
        ...prev,
        { role: "user", text: "Which files in the repo should I edit?" },
        {
          role: "mentor",
          text: `Based on ${selectedRepo.language} conventions and this issue's title, start by searching these paths in ${selectedRepo.fullName}:`,
          codeBlock: `- ${selectedRepo.likelyDirs.join("\n- ")}\n\nTip: Run \`git grep -n "${selectedIssue.title.split(" ").slice(0, 3).join(" ")}"\` locally.`,
        },
      ]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        { role: "user", text: "Draft my first Pull Request description." },
        {
          role: "mentor",
          text: "Here is a clean, maintainer-ready Pull Request description:",
          codeBlock: `## Summary\nAddresses #${selectedIssue.number}: ${selectedIssue.title}\n\n## Changes Made\n- Updated the relevant module in ${selectedRepo.likelyDirs[0] || "src/"}\n- Verified behavior locally using ${selectedRepo.language} tooling\n\n## Checklist\n- [x] Followed ${selectedRepo.fullName} contribution guidelines\n- [x] Tested changes locally without regressions\n\nCloses #${selectedIssue.number}`,
        },
      ]);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = chatInput.trim();
    if (!q) return;
    setChatInput("");
    if (q.toLowerCase().includes("pr") || q.toLowerCase().includes("pull")) {
      handleMentorAction("pr");
    } else if (q.toLowerCase().includes("file") || q.toLowerCase().includes("edit")) {
      handleMentorAction("files");
    } else {
      setChatMessages((prev) => [
        ...prev,
        { role: "user", text: q },
        {
          role: "mentor",
          text: `For ${selectedRepo.fullName}${selectedIssue ? ` (#${selectedIssue.number})` : ""}, check ${selectedRepo.likelyDirs.join(", ")} first, run the local test suite from the Setup Checklist, and keep your commit focused on "${selectedIssue ? selectedIssue.title : selectedRepo.name}".`,
        },
      ]);
    }
  };

  const scoredIssues = selectedRepo.issues
    .map((iss) => ({ iss, meta: scoreIssue(iss, selectedRepo, skills) }))
    .sort((a, b) => a.meta.score - b.meta.score || b.meta.matchPct - a.meta.matchPct)
    .filter((item) => issueFilter === "all" || item.meta.tier === issueFilter);

  const doneCount = selectedRepo.checklist.filter((_, idx) =>
    checklistDone.has(`${selectedRepo.fullName}:${idx}`),
  ).length;

  const structuredPrompt = `SYSTEM: You are RepoPulse's issue triage engine. Return ONLY valid JSON matching this schema:
{
  "plain_english_summary": "string (max 2 sentences)",
  "difficulty_score": "integer (1-10)",
  "estimated_time": "string",
  "setup_checklist": ["string (5 actionable CLI steps)"],
  "likely_files": ["string (relative repo paths)"]
}

USER INPUT:
Repository: ${selectedRepo.fullName} (${selectedRepo.language})
Issue #${selectedIssue ? selectedIssue.number : "N/A"}: ${selectedIssue ? selectedIssue.title : "General contribution"}`;

  const contextPrompt = `SYSTEM: You are a supportive Open-Source Contribution Mentor helping a 2nd/3rd-year student make their first PR.

CONTEXT PAYLOAD:
- Student Stack: ${Array.from(skills).join(", ") || "TypeScript, React"}
- Repository: ${selectedRepo.fullName} (${selectedRepo.stars} stars)
- README Summary: "${selectedRepo.plainSummary}"
- Target Issue #${selectedIssue ? selectedIssue.number : "N/A"}: "${selectedIssue ? selectedIssue.title : ""}"
- Issue Body: "${selectedIssue ? selectedIssue.body.slice(0, 280) : ""}"

TASK: Explain the issue requirements in plain English, list the exact directories to inspect, and draft a concise PR description with "Closes #${selectedIssue ? selectedIssue.number : ""}".`;

  return (
    <div className="min-h-screen flex flex-col bg-[#02010A] relative">
      <SilkShaderBg />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              RP
            </div>
            <div>
              <span className="font-bold tracking-tight text-zinc-100">RepoPulse</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-medium border border-indigo-800">
                Hacktoberfest &amp; GSoC Matchmaker
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("workspace")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeTab === "workspace" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              Discover &amp; Match
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("prompts")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeTab === "prompts" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              Prompt Engineering
            </button>
            <button
              type="button"
              onClick={() => mentorRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="lg:hidden px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white"
            >
              Mentor Chat
            </button>
          </nav>
        </div>
      </header>

      {activeTab === "workspace" ? (
        <main className="flex-1 relative z-10">
          {/* 3D Image Stream Hero */}
          <ImageStreamHero
            items={HERO_ITEMS}
            className="h-[340px] sm:h-[400px] w-full bg-transparent border-b border-zinc-800/80"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/60" />
            <div className="relative z-10 flex h-full flex-col items-center justify-between py-10 px-6 text-center">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-indigo-950/80 text-indigo-300 border border-indigo-800/70">
                Open-Source Issue Matchmaker
              </span>
              <div className="max-w-2xl">
                <h1 className="text-balance text-3xl sm:text-5xl font-bold tracking-tight text-white">
                  Your first open-source PR,
                  <br />
                  front and center.
                </h1>
                <p className="mt-3 text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto">
                  Match your exact tech stack to beginner-friendly GitHub repositories, rank good first issues by
                  difficulty, and draft your Pull Request with an AI Contribution Mentor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => analyzerRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg transition"
              >
                Explore Matched Repos ↓
              </button>
            </div>
          </ImageStreamHero>

          {/* Disc Cascade Carousel */}
          <DiscCascadeCarousel
            repos={repos}
            activeIndex={activeDiscIndex}
            onIndexChange={(idx) => switchRepo(idx)}
            onInspectActive={() => analyzerRef.current?.scrollIntoView({ behavior: "smooth" })}
          />

          {/* Problem & Solution Statement */}
          <section aria-label="Problem and Solution" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800/90 p-5 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">The Problem</span>
                <h2 className="text-base font-bold text-zinc-100 mt-1">
                  Students Get Lost Before Their First Commit
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                  Second- and third-year engineering students preparing for Hacktoberfest or GSoC often abandon
                  open-source contributions because finding beginner-friendly repositories that match their exact tech
                  stack—and decoding large codebases—feels overwhelming.
                </p>
              </div>
              <div className="rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-indigo-900/60 p-5 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">The Solution</span>
                <h2 className="text-base font-bold text-zinc-100 mt-1">
                  Stack-Matched Issues &amp; Guided Mentorship
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                  RepoPulse fetches live{" "}
                  <code className="text-indigo-300 font-mono">good first issue</code> tickets via the GitHub API,
                  summarizes each codebase in plain English, ranks issues by difficulty, and pairs you with a
                  Contribution Mentor to pinpoint target files and draft your PR.
                </p>
              </div>
            </div>
          </section>

          {/* Search & Tech Stack Bar */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 relative z-10">
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-lg p-4 sm:p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetchRepo()}
                  placeholder="Paste GitHub URL (e.g. https://github.com/shadcn-ui/ui) or topic (e.g. hacktoberfest, react)..."
                  className="flex-1 pl-3.5 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleFetchRepo}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition whitespace-nowrap"
                >
                  Analyze / Search GitHub
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-1">Your Stack:</span>
                <div className="flex flex-wrap gap-1.5">
                  {allSkills.map((skill) => {
                    const active = skills.has(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          const next = new Set(skills);
                          if (next.has(skill)) next.delete(skill);
                          else next.add(skill);
                          setSkills(next);
                        }}
                        className={
                          active
                            ? "px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white shadow-sm transition"
                            : "px-3 py-1 rounded-full text-xs font-medium bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 transition"
                        }
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = customSkill.trim();
                    if (!v) return;
                    if (!allSkills.includes(v)) setAllSkills((p) => [...p, v]);
                    setSkills((p) => new Set(p).add(v));
                    setCustomSkill("");
                  }}
                  className="inline-flex items-center gap-1 ml-1"
                >
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="+ Add skill"
                    className="w-24 sm:w-28 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </form>
                {apiStatus ? <span className="ml-auto text-xs text-zinc-400 font-medium">{apiStatus}</span> : null}
              </div>
            </div>
          </section>

          {/* Two-Column Analyzer + Contribution Mentor */}
          <section ref={analyzerRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              {/* Repo Summary + Setup Checklist */}
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-5 shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <a
                        href={selectedRepo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold text-zinc-100 hover:text-indigo-400 transition"
                      >
                        {selectedRepo.fullName} ↗
                      </a>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-medium">
                        {selectedRepo.language}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{selectedRepo.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800/60">
                      ★ {selectedRepo.stars}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                      {selectedRepo.issues.length} Issues
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/60">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                    Plain-English Codebase Summary
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{selectedRepo.plainSummary}</p>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Local Setup Checklist
                    </span>
                    <span className="text-xs font-semibold text-indigo-400">
                      {doneCount}/{selectedRepo.checklist.length} completed
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedRepo.checklist.map((step, idx) => {
                      const key = `${selectedRepo.fullName}:${idx}`;
                      const checked = checklistDone.has(key);
                      return (
                        <label
                          key={key}
                          className={`flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-900 cursor-pointer text-xs ${
                            checked ? "line-through text-zinc-500" : "text-zinc-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = new Set(checklistDone);
                              if (e.target.checked) next.add(key);
                              else next.delete(key);
                              setChecklistDone(next);
                            }}
                            className="mt-0.5 rounded text-indigo-600"
                          />
                          <span>{step}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ranked Issues */}
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-5 shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Difficulty-Ranked Good First Issues</h2>
                    <p className="text-xs text-zinc-400">
                      Ranked by standardized difficulty score (1–10) &amp; your stack match
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg text-xs font-medium border border-zinc-800">
                    {(["all", "easy", "medium", "stretch"] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setIssueFilter(tier)}
                        className={
                          issueFilter === tier
                            ? "px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-100 shadow-sm capitalize"
                            : "px-2.5 py-1 rounded-md text-zinc-400 capitalize"
                        }
                      >
                        {tier === "easy"
                          ? "Easy (1–3)"
                          : tier === "medium"
                            ? "Medium (4–6)"
                            : tier === "stretch"
                              ? "Stretch (7–10)"
                              : "All"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {scoredIssues.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-400 bg-zinc-900/60 rounded-xl">
                      No issues match the &ldquo;{issueFilter}&rdquo; filter. Try switching to All.
                    </div>
                  ) : (
                    scoredIssues.map(({ iss, meta }) => {
                      const isSel = iss.id === selectedIssue?.id;
                      const badge =
                        meta.tier === "easy"
                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                          : meta.tier === "medium"
                            ? "bg-amber-950/60 text-amber-300 border-amber-800/60"
                            : "bg-rose-950/60 text-rose-300 border-rose-800/60";
                      return (
                        <div
                          key={iss.id}
                          onClick={() => {
                            setSelectedIssueId(iss.id);
                            setChatMessages((p) => [
                              ...p,
                              {
                                role: "mentor",
                                text: `Switched focus to #${iss.number}: ${iss.title}. Click a quick action above or ask me anything about how to solve it!`,
                              },
                            ]);
                          }}
                          className={`p-4 rounded-xl border transition cursor-pointer ${
                            isSel
                              ? "border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500"
                              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-zinc-400">#{iss.number}</span>
                              <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${badge}`}>
                                Difficulty {meta.score}/10 · {meta.est}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded-full">
                              {meta.matchPct}% Stack Match
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-zinc-100">{iss.title}</h3>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                            {iss.body || "No description provided."}
                          </p>
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                            <div className="flex flex-wrap gap-1">
                              {iss.labels.slice(0, 3).map((l) => (
                                <span
                                  key={l}
                                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium"
                                >
                                  {l}
                                </span>
                              ))}
                            </div>
                            <a
                              href={iss.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-medium text-indigo-400 hover:underline"
                            >
                              View on GitHub ↗
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Contribution Mentor Panel */}
            <aside ref={mentorRef} className="lg:col-span-5">
              <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-lg flex flex-col h-[640px] sticky top-20 overflow-hidden">
                <div className="px-4 py-3.5 border-b border-zinc-800 bg-black text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-xs font-bold">
                      CM
                    </div>
                    <div>
                      <h2 className="text-sm font-bold leading-tight">Contribution Mentor</h2>
                      <p className="text-[11px] text-slate-300 truncate max-w-[230px]">
                        {selectedIssue ? `Issue #${selectedIssue.number} · ${selectedRepo.name}` : selectedRepo.fullName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-3.5 py-2.5 bg-zinc-900/70 border-b border-zinc-800 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMentorAction("explain")}
                    className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-indigo-400 hover:text-indigo-300 font-medium transition"
                  >
                    Explain this issue
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMentorAction("files")}
                    className="text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-indigo-400 hover:text-indigo-300 font-medium transition"
                  >
                    Which files to edit?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMentorAction("pr")}
                    className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-300 hover:bg-emerald-900/70 font-medium transition"
                  >
                    Draft PR description
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm bg-black/40">
                  {chatMessages.map((m, idx) => (
                    <div key={idx} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                          m.role === "user"
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-sm"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{m.text}</div>
                        {m.codeBlock ? (
                          <div className="mt-2.5 bg-slate-900 text-slate-100 rounded-xl p-3 font-mono text-[11px] relative">
                            <button
                              type="button"
                              onClick={() => copyText(m.codeBlock!)}
                              className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-[10px] text-white"
                            >
                              Copy
                            </button>
                            <pre className="whitespace-pre-wrap pr-10">{m.codeBlock}</pre>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleChatSubmit} className="p-3 border-t border-zinc-800 bg-zinc-950 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about requirements, git branch, or tests..."
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition"
                  >
                    Send
                  </button>
                </form>
              </div>
            </aside>
          </section>

          {/* 2D / 3D Contribution Skyline */}
          <section aria-label="Contribution Skyline" className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
            <ContributionSkyline repoName={selectedRepo.fullName} />
          </section>

          {/* 3D Animated Folders */}
          <section aria-label="Curated Contribution Folders" className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Built for 2nd &amp; 3rd Year Engineering Students
              </span>
              <h2 className="text-2xl font-bold text-zinc-100 mt-1">Explore Open-Source Tracks in 3D</h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
                Stop getting lost in massive repositories. Hover a folder to preview beginner-friendly tracks and see
                how RepoPulse turns intimidating codebases into your first merged Pull Request.
              </p>
            </div>
            <AnimatedFoldersShowcase
              onSelectRepoIndex={(idx) => {
                switchRepo(idx);
                analyzerRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </section>
        </main>
      ) : (
        <main className="flex-1 relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
          <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-6 shadow-lg">
            <h1 className="text-xl font-bold text-zinc-100">Prompt Engineering Showcase</h1>
            <p className="text-sm text-zinc-400 mt-1">
              RepoPulse combines <strong>structured prompting</strong> (for deterministic difficulty scoring &amp; setup
              checklists) with <strong>context-based prompting</strong> (injecting live README + issue payloads + your
              selected stack). Both prompts below update dynamically from your active repository and issue.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-5 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    Pattern 1 · Structured Output
                  </span>
                  <h2 className="text-base font-bold text-zinc-100">Standardized Difficulty &amp; Checklist Prompt</h2>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(structuredPrompt)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
                >
                  Copy Prompt
                </button>
              </div>
              <pre className="font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {structuredPrompt}
              </pre>
            </div>

            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-5 shadow-lg flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Pattern 2 · Context Injection
                  </span>
                  <h2 className="text-base font-bold text-zinc-100">Live README + Issue Mentor Prompt</h2>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(contextPrompt)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
                >
                  Copy Prompt
                </button>
              </div>
              <pre className="font-mono text-xs bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto leading-relaxed whitespace-pre-wrap">
                {contextPrompt}
              </pre>
            </div>
          </div>
        </main>
      )}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-medium shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
