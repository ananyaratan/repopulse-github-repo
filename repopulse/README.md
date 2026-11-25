# RepoPulse — Open-Source Contribution & Issue Matchmaker

**RepoPulse** helps second- and third-year engineering students overcome the first-contribution barrier for programs like **Hacktoberfest** and **Google Summer of Code (GSoC)**.

## The Problem & Solution

- **The Problem:** Students often get overwhelmed browsing GitHub because they struggle to find beginner-friendly repositories matching their exact tech stack, understand dense READMEs, judge which `good first issue` tickets are actually easy, or know which files to edit for their first Pull Request.
- **The Solution:** RepoPulse matches repositories to your selected languages and frameworks, fetches live `good first issue` tickets via the GitHub REST API, summarizes what each codebase does in plain English with a 5-step setup checklist, ranks issues by difficulty (`1–10`), and provides an interactive **Contribution Mentor** to pinpoint target directories and draft a maintainer-ready PR description.

## Features

- **Silk WebGL1 Shader Background:** Custom fullscreen-triangle WebGL1 flow shader (`#02010A`, `#04052E`, `#3D2C8D`, `#916BBF`) that pauses automatically when the tab is hidden.
- **3D ImageStreamHero Corridor:** Mirrored perspective rails highlighting beginner-friendly open-source stacks.
- **Disc Cascade Carousel:** Spring-physics 3D disc selector for browsing curated and live-fetched repositories.
- **Tech Stack & Live GitHub Fetcher:** Filter by known skills (`TypeScript`, `React`, `Tailwind CSS`, `Python`, etc.) and fetch live issues from any `github.com/owner/repo` URL or topic keyword.
- **Difficulty-Ranked Issue Board & Contribution Mentor:** Deterministic difficulty scoring (`1–10`), Stack Match %, interactive 5-step setup checklist, and a Contribution Mentor chat with one-click PR drafting.
- **2D / 3D Contribution Skyline:** Interactive HTML5 Canvas activity heatmap that morphs into an orbitable 3D isometric skyline.
- **3D Animated Contribution Folders:** Interactive folder cards with a keyboard-navigable lightbox modal.
- **Prompt Engineering Showcase:** Live inspection of RepoPulse's structured JSON schema prompt and context-injected mentor prompt.

## Folder Structure

```text
repopulse/
├── components.json
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── repopulse-app.tsx
    │   └── ui/
    │       ├── 3d-folder.tsx
    │       ├── contribution-skyline.tsx
    │       ├── disc-cascade-carousel.tsx
    │       ├── image-stream-hero.tsx
    │       └── silk-shader-bg.tsx
    ├── data/
    │   └── seed-repos.ts
    └── lib/
        ├── github.ts
        └── utils.ts
```

## Run Locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

3. **Open in your browser**

   Visit [http://localhost:3000](http://localhost:3000).

4. **Typecheck & Production Build**

   ```bash
   npm run typecheck
   npm run build
   ```
