export interface RepoIssue {
  id: number;
  number: number;
  title: string;
  labels: string[];
  comments: number;
  body: string;
  url: string;
}

export interface RepoRecord {
  fullName: string;
  name: string;
  owner: string;
  url: string;
  description: string;
  stars: string;
  language: string;
  stack: string[];
  pattern: "horizon" | "mosaic" | "sunburst" | "eclipse";
  palette: [string, string, string];
  plainSummary: string;
  mentorNote: string;
  checklist: string[];
  likelyDirs: string[];
  issues: RepoIssue[];
}

export interface IssueScoreMeta {
  score: number;
  tier: "easy" | "medium" | "stretch";
  est: string;
  matchPct: number;
}

export function scoreIssue(
  issue: RepoIssue,
  repo: RepoRecord,
  skills: Set<string>,
): IssueScoreMeta {
  const labels = (issue.labels || []).map((l) => l.toLowerCase());
  let score = 4;
  if (labels.some((l) => l.includes("documentation") || l.includes("docs") || l.includes("translation"))) {
    score -= 2;
  }
  if (labels.some((l) => l.includes("good first issue"))) score -= 1;
  if (labels.some((l) => l.includes("bug") || l.includes("enhancement"))) score += 1;
  if (labels.some((l) => l.includes("help wanted") || l.includes("refactor") || l.includes("architecture"))) {
    score += 2;
  }
  if ((issue.comments || 0) > 6) score += 1;
  if ((issue.body || "").length > 350) score += 1;
  score = Math.max(1, Math.min(10, score));

  const tier = score <= 3 ? "easy" : score <= 6 ? "medium" : "stretch";
  const est = score <= 3 ? "~30–60 min" : score <= 6 ? "~1–3 hrs" : "~3–6 hrs";

  const repoStack = (repo.stack || [repo.language]).map((s) => s.toLowerCase());
  const userSkills = Array.from(skills).map((s) => s.toLowerCase());
  const matches = repoStack.filter((s) => userSkills.some((u) => s.includes(u) || u.includes(s)));
  const matchPct =
    userSkills.length === 0
      ? 50
      : Math.min(100, Math.round((matches.length / Math.max(1, Math.min(repoStack.length, 3))) * 100));

  return { score, tier, est, matchPct: Math.max(25, matchPct) };
}

export async function fetchGitHubReposOrUrl(rawInput: string): Promise<RepoRecord[]> {
  const raw = rawInput.trim();
  const urlMatch =
    raw.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i) ||
    raw.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);

  if (urlMatch) {
    const owner = urlMatch[1];
    const repoName = urlMatch[2].replace(/\.git$/, "");
    const [repoRes, issRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repoName}`),
      fetch(`https://api.github.com/repos/${owner}/${repoName}/issues?labels=good%20first%20issue&state=open&per_page=10`),
    ]);
    if (!repoRes.ok) throw new Error(`GitHub returned ${repoRes.status}`);
    const rData = await repoRes.json();
    let iData = issRes.ok ? await issRes.json() : [];
    if (!Array.isArray(iData) || iData.length === 0) {
      const fallbackIss = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues?state=open&per_page=8`);
      iData = fallbackIss.ok ? await fallbackIss.json() : [];
    }

    const cleanIssues: RepoIssue[] = (Array.isArray(iData) ? iData : [])
      .filter((x: { pull_request?: unknown }) => !x.pull_request)
      .map((x: { id: number; number: number; title: string; labels?: { name: string }[]; comments?: number; body?: string; html_url: string }) => ({
        id: x.id,
        number: x.number,
        title: x.title,
        labels: (x.labels || []).map((l) => l.name),
        comments: x.comments || 0,
        body: (x.body || "Open issue on GitHub.").slice(0, 320),
        url: x.html_url,
      }));

    return [
      {
        fullName: rData.full_name,
        name: rData.name,
        owner: rData.owner?.login || owner,
        url: rData.html_url,
        description: rData.description || "Open-source GitHub repository.",
        stars:
          rData.stargazers_count >= 1000
            ? `${(rData.stargazers_count / 1000).toFixed(1)}k`
            : String(rData.stargazers_count),
        language: rData.language || "Mixed",
        stack: [rData.language || "Git", ...(rData.topics || []).slice(0, 3)],
        pattern: "sunburst",
        palette: ["#1e1b4b", "#4f46e5", "#c7d2fe"],
        plainSummary: `${rData.description || rData.full_name} — Live repository fetched from GitHub with ${rData.open_issues_count} open issues and ${rData.forks_count} forks.`,
        mentorNote: `Live GitHub match in ${rData.language || "open source"}.`,
        checklist: [
          `Fork ${rData.full_name} on GitHub`,
          `Clone your fork: git clone https://github.com/<you>/${rData.name}.git`,
          `Inspect README.md & CONTRIBUTING.md for ${rData.language || "project"} setup`,
          "Create a feature branch before editing files",
          "Run tests and open a Pull Request referencing the issue",
        ],
        likelyDirs: ["README.md", "src/", "tests/"],
        issues:
          cleanIssues.length > 0
            ? cleanIssues
            : [
                {
                  id: Date.now(),
                  number: 1,
                  title: "Explore open issues or documentation improvements",
                  labels: ["good first issue", "documentation"],
                  comments: 0,
                  body: "No 'good first issue' labeled tickets were returned; check README.md for setup or typo fixes.",
                  url: `${rData.html_url}/issues`,
                },
              ],
      },
    ];
  }

  const q = encodeURIComponent(`${raw} good-first-issues:>0`);
  const res = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&per_page=4`);
  if (!res.ok) throw new Error(`GitHub Search returned ${res.status}`);
  const data = await res.json();
  if (!data.items || data.items.length === 0) throw new Error("No matching repos found");

  const patterns: RepoRecord["pattern"][] = ["horizon", "mosaic", "sunburst", "eclipse"];
  const palettes: [string, string, string][] = [
    ["#f2e3c6", "#16443f", "#f08a5d"],
    ["#141414", "#e9e4da", "#c8a24a"],
    ["#1b1d1f", "#3f6b3a", "#c9d6c4"],
    ["#2d3f7a", "#e8b4c8", "#f4efe6"],
  ];

  return data.items.map(
    (
      r: {
        id: number;
        full_name: string;
        name: string;
        owner?: { login: string };
        html_url: string;
        clone_url: string;
        description?: string;
        stargazers_count: number;
        language?: string;
        topics?: string[];
        open_issues_count: number;
      },
      idx: number,
    ): RepoRecord => ({
      fullName: r.full_name,
      name: r.name,
      owner: r.owner?.login || "",
      url: r.html_url,
      description: r.description || "Open-source repository.",
      stars: r.stargazers_count >= 1000 ? `${(r.stargazers_count / 1000).toFixed(1)}k` : String(r.stargazers_count),
      language: r.language || "Mixed",
      stack: [r.language || "Open Source", ...(r.topics || []).slice(0, 2)],
      pattern: patterns[idx % 4],
      palette: palettes[idx % 4],
      plainSummary: r.description || `${r.full_name} matched topic "${raw}".`,
      mentorNote: `Matched "${raw}" with ${r.open_issues_count} open issues.`,
      checklist: [
        `Fork ${r.full_name}`,
        `Clone locally: git clone ${r.clone_url}`,
        "Install dependencies per README.md",
        "Create a new branch for your fix",
        "Open a Pull Request with clear test notes",
      ],
      likelyDirs: ["README.md", "src/", "docs/"],
      issues: [
        {
          id: r.id,
          number: 1,
          title: `Browse good first issues in ${r.full_name}`,
          labels: ["good first issue", r.language || "open-source"],
          comments: 0,
          body: `Paste "${r.html_url}" into the analyzer bar to fetch individual live issue tickets for ${r.full_name}.`,
          url: `${r.html_url}/issues?q=is%3Aopen+label%3A%22good+first+issue%22`,
        },
      ],
    }),
  );
}
