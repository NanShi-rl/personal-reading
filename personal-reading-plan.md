# Plan: Personal Reading Notes Website (GitHub Pages & Actions)

## Overview
This project establishes a personal reading notes knowledge base website hosted on GitHub Pages, featuring interactive reading note management, bidirectional link navigation, and an in-page editor powered by GitHub REST API & Personal Access Tokens (PAT). Content is stored as Markdown files with structured YAML frontmatter inside the repository and automatically built & deployed via GitHub Actions.

---

## Content Schema & Properties Design

Each reading note is stored under `content/notes/<slug>.md` with frontmatter:

```yaml
---
id: "the-pragmatic-programmer-20th"
title: "The Pragmatic Programmer (20th Anniversary Edition)"
topic: "Software Engineering"
type: "book" # book | paper | article | video | podcast
source:
  title: "The Pragmatic Programmer"
  author: "David Thomas, Andrew Hunt"
  url: "https://pragprog.com/titles/tfd20/"
  published_year: 2019
status: "completed" # unread | reading | completed | abandoned
rating: 5 # 1-5 scale
tags: ["best-practices", "career", "craftsmanship", "refactoring"]
links:
  - id: "clean-code"
    relationship: "extends" # extends | contrasts | inspires | references | foundational_for
  - id: "domain-driven-design"
    relationship: "references"
date_started: "2026-01-10"
date_finished: "2026-02-05"
last_modified: "2026-10-22"
summary: "A comprehensive guide on pragmatic approaches to software development."
key_takeaways:
  - "Care about your craft"
  - "Think about your work"
  - "Don't live with broken windows"
---

# Personal Notes & Thoughts

## Context & Impressions
...

## Critical Analysis & Links
...
```

---

## Layout & User Experience Design

1. **Header & Navigation Bar**:
   - Branding / Site Title (`NanShi's Reading Garden`)
   - Quick Search (instant fuzzy search across titles, topics, authors, and tags)
   - Links: Home, Topics, Graph / Linkages View, All Notes, New Note button (+), Settings (PAT token management).

2. **Home / Dashboard View**:
   - Reading summary stats (Total notes, books read this year, active reading count).
   - "Currently Reading" showcase cards.
   - Recent notes grid with topic badges, rating stars, and linked note indicators.
   - Filter bar: by Topic, Status, Rating, or Tag.

3. **Note Detail Page**:
   - **Header Card**: Title, Source info (author, external link), status badge, rating, dates.
   - **Key Takeaways Callout**: Highlights summary points.
   - **Main Content**: Rendered Markdown with syntax highlighting and LaTeX math support.
   - **Sidebar / Relations Box**:
     - Linked Readings (Outbound & Inbound backlinks with relationship labels).
     - Related Topics & Tags.
   - **Action Bar**: "Edit this Note" button, "View on GitHub", "Delete Note".

4. **In-Page Editor (Create / Edit Modal or Dedicated Page)**:
   - Split-pane editor (Markdown / Metadata form on left, Live Rendered Preview on right).
   - Structured metadata form fields (Topic dropdown/autocomplete, Source, Status, Tags input, Linked note selector with relationship dropdown).
   - Direct save button: Uses stored PAT to commit directly to GitHub repository (`NanShi-rl/personal-reading`) via Octokit/GitHub REST API.

5. **Settings / Auth Drawer**:
   - LocalStorage configuration for GitHub PAT (Fine-grained token with `contents: write` scope).
   - Verification button checking repo access and permissions.

---

## Sub-Tasks

### Sub-Task 1: Project Scaffolding & Next.js / Static Export Setup
- **Intent**: Initialize Next.js project with Tailwind CSS, Lucide icons, static export configuration (`output: 'export'`), base path configuration for GitHub Pages, and package dependencies.
- **Expected Outcomes**:
  - `package.json`, `tailwind.config.ts`, `next.config.js`, `tsconfig.json` properly configured.
  - Project builds cleanly with `npm run build` producing static assets in `out/`.
- **Todo List**:
  1. Initialize Next.js app with TypeScript, Tailwind CSS, Lucide icons, gray-matter, and markdown parser.
  2. Configure `next.config.js` for GitHub Pages static export (`output: 'export'`, `trailingSlash: true`, assetPrefix/basePath if applicable).
  3. Create content data utilities (`lib/notes.ts`) to read local markdown notes and frontmatter.
- **Relevant Context**: Root directory, `package.json`, `lib/notes.ts`.
- **Status**: `[ ] pending`

---

### Sub-Task 2: Content Schema, Sample Data & Data Loading Utilities
- **Intent**: Establish note schema validations and populate sample notes with realistic linkages, topics, and source metadata.
- **Expected Outcomes**:
  - TypeScript types defined for `ReadingNote`, `SourceMetadata`, `NoteLinkage`, `ReadingStatus`.
  - `content/notes/` containing sample markdown notes with rich metadata and cross-links.
  - Helper functions for computing inbound backlinks, topic groupings, and search indexes.
- **Todo List**:
  1. Define types in `types/note.ts`.
  2. Implement data loaders and backlink resolution in `lib/notes.ts`.
  3. Add 3-5 sample reading notes covering different topics (e.g., Software Architecture, Philosophy, Psychology, AI) with cross-linkages.
- **Relevant Context**: `types/note.ts`, `content/notes/`, `lib/notes.ts`.
- **Status**: `[ ] pending`

---

### Sub-Task 3: Page Layouts, Views & Search Components
- **Intent**: Build the core UI components and pages for browsing reading notes, filtering by topic/tag/status, viewing backlinks, and visual connections.
- **Expected Outcomes**:
  - Responsive, modern layout with dark/light theme support.
  - Home dashboard with metrics, search bar, topic filter, and note cards.
  - Dedicated note page with formatted Markdown content, key takeaways, and backlink network display.
  - Topic and Linkage overview pages.
- **Todo List**:
  1. Create navigation header, footer, and theme layout.
  2. Build note card and list/filter views (by Topic, Tag, Status).
  3. Build dynamic note detail page with Markdown rendering and bidirectional links visualization.
  4. Implement client-side fuzzy search.
- **Relevant Context**: `app/page.tsx`, `app/notes/[slug]/page.tsx`, `components/`.
- **Status**: `[ ] pending`

---

### Sub-Task 4: In-Browser Editor & GitHub REST API Direct Commit Engine
- **Intent**: Allow users to create, update, or delete reading notes right from the web page using GitHub REST API and a client-stored PAT.
- **Expected Outcomes**:
  - Settings panel to configure and test GitHub Personal Access Token.
  - In-browser editor with live Markdown preview, form validation for metadata, and auto-populated note link selectors.
  - Commit function that creates or updates files directly in `NanShi-rl/personal-reading` repo.
- **Todo List**:
  1. Build GitHub API client service (`lib/github.ts`) for reading/writing repo files and checking token validity.
  2. Create Settings modal for PAT management.
  3. Build Note Editor component (New note and Edit note) with Markdown preview and link manager.
  4. Implement commit handling with success/error feedback and auto-refresh instructions.
- **Relevant Context**: `lib/github.ts`, `components/EditorModal.tsx`, `components/SettingsModal.tsx`.
- **Status**: `[ ] pending`

---

### Sub-Task 5: GitHub Actions CI/CD Workflow & Remote Sync
- **Intent**: Create automated GitHub Actions workflow to build and deploy the Next.js static site to GitHub Pages on every push, and initialize local git tracking against `git@github.com:NanShi-rl/personal-reading.git`.
- **Expected Outcomes**:
  - `.github/workflows/deploy.yml` configured with GitHub Pages deployment actions.
  - Git repository initialized locally, committed, and remote origin configured to `git@github.com:NanShi-rl/personal-reading.git`.
- **Todo List**:
  1. Create `.github/workflows/deploy.yml` with `actions/deploy-pages`.
  2. Add `.gitignore` for node_modules, `.next`, `out`, and environment configs.
  3. Initialize git repo, commit project structure, and link remote `git@github.com:NanShi-rl/personal-reading.git`.
- **Relevant Context**: `.github/workflows/deploy.yml`, `.gitignore`.
- **Status**: `[ ] pending`
