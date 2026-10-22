# Personal Reading Notes & PKM Website

A personal reading notes website and Zettelkasten knowledge graph built with **Next.js**, **Tailwind CSS**, and hosted on **GitHub Pages** via **GitHub Actions**.

## Features

- **Bi-directional Knowledge Graph**: Interlink readings with semantic relationship tags (`extends`, `contrasts`, `inspires`, `references`, `foundational_for`).
- **In-Page Native Editor & GitHub REST API Direct Commit**: Create, edit, and update notes directly in the browser using your GitHub Personal Access Token (stored only in local browser `localStorage`).
- **Rich Reading Metadata Schema**: Tracks topic, content type (book/paper/article), reading status, ratings (1-5★), source author & URL, executive summaries, and key takeaways.
- **Fast Static Search & Taxonomy**: Instant client-side fuzzy search across titles, summaries, tags, authors, and topics.
- **Automated CI/CD**: Fully automated static site compilation and deployment to GitHub Pages via GitHub Actions upon push to `main`.

## Getting Started

### 1. Local Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the site.

### 2. Building for GitHub Pages
```bash
npm run build
```
This produces the static HTML/CSS/JS export in `./out`.

### 3. Setting Up In-Page Editing
1. Generate a GitHub Personal Access Token (Fine-grained token with `Contents: Read and write` permission on `personal-reading`).
2. Click the gear icon (⚙️) on the top right of the website.
3. Paste your token and click **Save & Test Token**.
4. You can now use the **+ New Note** and **Edit Note** buttons to commit changes directly to your GitHub repository!
