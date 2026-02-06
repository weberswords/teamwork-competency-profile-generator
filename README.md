# Teamwork Competency Profile Generator

Research tool that generates individualized teamwork competency profile cards for study participants. Each profile visualizes scores across five teamwork dimensions, compares them to team averages, and provides interpretive context.

All data processing happens locally in the browser — no participant data is sent to external services.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

## Setup

```bash
npm install
```

## Running Locally

```bash
npm run dev
```

Opens at [http://127.0.0.1:5173](http://127.0.0.1:5173). Click **"Try with sample data"** to explore the app without a CSV file.

## Other Commands

| Command | Description |
|---|---|
| `npm run build` | Type-check and build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |

## Data Input

Upload a CSV with this format:

```
name,team,conflict_resolution,collaborative_problem_solving,communication,goal_setting,planning_coordination,satisfaction
```

- Competency scores are means on a **1–4 scale**.
- Satisfaction is a mean on a **1–5 scale**.

## Tech Stack

- React 18 + TypeScript
- Vite (dev server and build)
- Recharts (radar chart)
- Tailwind CSS (styling)
- Lucide React (icons)

## Export

- **Individual**: Select a participant and use Print / Save as PDF.
- **Batch**: "Print All Profiles" renders every profile with page breaks and triggers the browser print dialog.
