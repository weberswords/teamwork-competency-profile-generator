# Teamwork Competency Profile Generator

## Purpose

Research tool that generates individualized teamwork competency profile cards for study participants. Each profile visualizes a participant's scores across five teamwork dimensions, compares them to their team's averages, and provides interpretive context.

This is used in an academic research study on collaborative problem solving in software development teams. Profiles are delivered to participants after they complete the study as a thank-you (no monetary incentives). Profiles are delivered on a rolling basis as teams complete the study, so **each profile must be limited to data about that individual and their team only** — no study-wide averages or cross-team comparisons.

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

## Instruments & Scoring

### Teamwork Competency Test (TWCT)

The TWCT is a 36-item behavioral scenario assessment (Aguado et al., 2014) measuring five competency dimensions. Each item is scored on a **1–4 scale**. The CSV contains the **mean score per dimension** (not raw totals or standardized scores). There are no subscales within a dimension — one score per competency.

Five dimensions across a validated two-factor structure:

#### Interpersonal Factor

Composite = mean of Conflict Resolution, Collaborative Problem Solving, and Communication.

- **Conflict Resolution (CR)** — recognizing/managing conflict, integrating viewpoints
- **Collaborative Problem Solving (CPS)** — identifying when group approaches are needed
- **Communication (COM)** — active listening, clear information sharing, adapting style

#### Self-Management Factor

Composite = mean of Goal Setting and Performance Management and Planning and Task Coordination.

- **Goal Setting and Performance Management (GSPM)** — setting objectives, monitoring progress
- **Planning and Task Coordination (PTC)** — coordinating activities, role assignment, workload

Both factor-level composites are displayed on the profile alongside the five individual dimensions.

### Individual Satisfaction with Team

5-item composite scale adapted from Gladstein (1984) and validated by de la Torre-Ruiz et al. (2014). Each item uses a **1–5 Likert scale** (1 = strongly disagree, 5 = strongly agree). The CSV contains the **mean of the five items**, so the score range is **1.0–5.0**.

### What Does NOT Appear on Profiles

Demographics (role, years of experience, time with current team) and communication pattern data from recorded sessions are collected by the study but never shown on participant profiles.

## Team Agreement Classification

1. For each team member, calculate their overall competency score: mean of their Interpersonal composite and Self-Management composite.
2. Calculate the team mean of those overall scores.
3. Count how many members fall within **±0.3 points** of the team mean.
4. If **70% or more** of members are within that range → **High Agreement Team** (checkmark icon, green styling).
5. Otherwise → **Diverse Competency Team** (shuffle icon, amber styling). **Never use an X icon or negative visual treatment** — language and visuals must remain neutral and non-evaluative.

## Profile Layout

Each profile card includes (in order):

1. **Header** — Study title ("Collaborative Problem Solving Study"), participant name, thank-you message
2. **Team info banner** — Team name and agreement classification
3. **Radar chart** — All five competency dimensions on a 1–4 scale, individual scores overlaid on team averages
4. **Factor-level summaries** — Interpersonal and Self-Management composites for individual and team
5. **Satisfaction score** — Mean satisfaction displayed as value out of 5.0, with visual progress bar
6. **Competency descriptions** — Each dimension with abbreviation badge (blue = Interpersonal, purple = Self-Management), full name, individual score, team average, and plain-language description
7. **Contact & disclaimer** — Configurable researcher/PI names and emails, plus required UNLV disclaimer text

### What NOT to include on profiles

- No textual interpretations of scores
- No strengths/growth areas callouts
- No recommendations or development tips
- No study-wide averages or cross-team comparisons
- No value judgments — language must stay neutral throughout

## Researcher Contact & Disclaimer

The following contact fields are **configurable** via the Study Settings panel in the UI (not hardcoded):

- Researcher Name and email
- Principal Investigator Name and email

The disclaimer text is fixed:

> This profile is provided as part of a research study conducted through the University of Nevada, Las Vegas. The information presented reflects your individual responses and your team's aggregated data from the Teamwork Competency Test and post-session satisfaction survey. Scores represent self-reported behavioral tendencies and are not evaluative assessments of job performance or professional capability.

## Sample Data

Sample data uses obviously fictitious names (e.g., "John Q. Sample", "Fakename McNotreal") so profiles can be shared with prospective teams without any risk of confusion with real participants. The sample includes teams that demonstrate both High Agreement and Diverse Competency classifications. Access via the "Try with sample data" button.

## Data Input Format (CSV)

```
name,team,conflict_resolution,collaborative_problem_solving,communication,goal_setting,planning_coordination,satisfaction
```

All competency scores are means on a 1–4 scale. Satisfaction is a mean on a 1–5 scale.

## Export

- **Individual**: Select a participant → Print / Save PDF (hides app UI, shows only the profile card)
- **Batch**: "Print All Profiles" renders every participant's card with CSS page breaks and triggers the browser print dialog. Each profile appears on its own page in the resulting PDF.

## Key Design Decisions

- Single-page React app — one component renders all functionality
- Radar chart overlays individual scores against team averages (Recharts)
- Print styles use `@media print` with `page-break-after: always` per card, `-webkit-print-color-adjust: exact`
- Batch print renders all cards to the DOM then auto-triggers `window.print()` after a short delay for SVG rendering
- Diverse Competency classification uses neutral language and shuffle icon (never X or negative icons)

## Development Guidelines

- Keep all data processing client-side
- Do not add external service dependencies
- Sample data names must be obviously fictional
- Maintain TypeScript types for all data structures
- Test with sample data before any changes to CSV parsing
- Never add textual score interpretations, recommendations, or value judgments to profiles
