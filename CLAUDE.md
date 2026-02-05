# Teamwork Competency Profile Generator

## Purpose

Research tool that generates individualized teamwork competency profile cards for study participants. Each profile visualizes a participant's scores across five teamwork dimensions, compares them to their team's averages, and provides interpretive context.

This is used in an academic research study on collaborative problem solving in teams.

## Privacy & Data Handling

**This application MUST run locally only.** Real participant data must never be sent to cloud services, external APIs, or third-party analytics. All processing happens client-side in the browser.

- Never add external analytics, tracking, or telemetry
- Never add network requests for data processing
- Never commit real participant data (CSV files are gitignored)
- The Vite dev server binds to `127.0.0.1` only — not `0.0.0.0`

## Project Structure

```
├── CLAUDE.md                              # This file
├── index.html                             # Vite entry HTML
├── package.json                           # Dependencies & scripts
├── vite.config.ts                         # Vite config (localhost-only)
├── tsconfig.json                          # TypeScript config
├── tailwind.config.js                     # Tailwind CSS config
├── postcss.config.js                      # PostCSS config
├── participant-feedback-generator.tsx      # Original first-pass component (kept for reference)
├── src/
│   ├── main.tsx                           # React entry point
│   ├── index.css                          # Tailwind imports
│   └── ParticipantFeedbackGenerator.tsx   # Main application component
└── .gitignore                             # Ignores node_modules, dist, CSV data files
```

## Running Locally

```bash
npm install
npm run dev        # Starts dev server at http://127.0.0.1:5173
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
```

## Tech Stack

- **React 18** with TypeScript
- **Vite** for local dev server and builds
- **Recharts** for radar chart visualization
- **Lucide React** for icons
- **Tailwind CSS** for styling

## Teamwork Competency Framework

Five dimensions across two factors:

### Interpersonal Factor
- **Conflict Resolution (CR)** — recognizing/managing conflict, integrating viewpoints
- **Collaborative Problem Solving (CPS)** — identifying when group approaches are needed
- **Communication (COM)** — active listening, clear information sharing, adapting style

### Self-Management Factor
- **Goal Setting & Performance Management (GSPM)** — setting objectives, monitoring progress
- **Planning & Task Coordination (PTC)** — coordinating activities, role assignment, workload

## Scales

- **Competency scores**: 1–4 scale
- **Satisfaction**: 0–5 scale
- **Team agreement**: 70%+ of members within ±0.3 of team mean overall → "High Agreement Team"

## Sample Data

Sample data uses obviously fictitious names (e.g., "John Q. Sample", "Fakename McNotreal") so profiles can be shared with prospective teams without any risk of confusion with real participants. Access via the "Try with sample data" button.

## Data Input Format (CSV)

```
name,team,conflict_resolution,collaborative_problem_solving,communication,goal_setting,planning_coordination,satisfaction
```

## Key Design Decisions

- Component renders one profile card at a time with print/PDF export via `window.print()`
- Radar chart overlays individual scores against team averages
- Teams are classified as "High Agreement" or "Diverse Competency" based on score spread
- Print styles preserve colors and hide UI controls

## Development Guidelines

- Keep all data processing client-side
- Do not add external service dependencies
- Sample data names must be obviously fictional
- Maintain TypeScript types for all data structures
- Test with sample data before any changes to CSV parsing
