# Sponsorship Framework Viewer

A single-page Next.js app for comparing sponsorship properties scored against an
assessment framework. Drop a framework workbook and it renders three linked views:
a ranked comparison, a heatmap, and a head-to-head compare.

**No data is stored.** The workbook is read and parsed in the browser with SheetJS.
Nothing is uploaded, there is no database, and the app deploys as a fully static site.

## Requirements

- Node.js 18.18 or newer

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. It loads a built-in sample on start. Use **Choose file**
or drag a workbook onto the drop zone to render a different client.

## Deploy to Vercel

Either path works and needs no configuration or environment variables.

**From GitHub (recommended)**

1. Create a repo and push this folder.
2. Go to vercel.com/new and import the repo.
3. Vercel detects Next.js. Click **Deploy**.

**From the CLI**

```bash
npm i -g vercel
vercel        # first run links/creates the project
vercel --prod # promote to production
```

## The template contract

Any client workbook must keep this skeleton. Everything inside it can change
(objectives, sub-metrics, questions, benchmarks, number of properties, 0–5 or 0–10 scale).

- An assessment sheet with `Key Objective`, `Sub-Metric`, and `Question` columns.
- One block per property, starting with a `Property: [name]` header cell and a
  `Benchmark / Score / Commentary` label row.
- Objectives written once at the top of each group; metrics listed down the side.

The app locates these by header text, not by fixed cell positions, and it recomputes
every rollup from the raw scores (category = mean of its metrics, overall = mean of the
category scores). It never trusts the sheet's own formula cells.

## Project structure

```
app/
  layout.tsx      fonts + metadata
  page.tsx        state, tabs, banner
  globals.css     design system (unchanged from the prototype)
components/
  Uploader.tsx    reads + parses the file in-browser
  Ranking.tsx     ranked list with drill-down
  Heatmap.tsx     objectives / all-metrics matrix
  Compare.tsx     radar + objective bars
lib/
  types.ts        shared types
  parse.ts        parseWorkbook + buildModel (structural parser)
  score.ts        colour scale + formatting
data/
  sample.ts       built-in Spark sample
```

## Notes

- Scale is detected from the data (0–5, 0–10, or higher). Par is the midpoint.
- Metrics marked not-applicable are flagged and excluded from the score.
- To add clipboard paste, listen for a `paste` event on `window` and pass any
  pasted file to the same `handleFile` in `Uploader.tsx`.
