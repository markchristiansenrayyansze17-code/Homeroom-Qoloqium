# DocAtt MRSM Kuching — PRD

## Problem
Build a bilingual (EN/BM) homeroom reporting web app for MRSM Kuching. Students log in by matrix number, teachers by code (EG####), and admin uses the secret code `MK1993` in either login form. All submissions are **per homeroom** (Form 1–5).

## Architecture
- **Backend:** FastAPI + MongoDB (motor). JWT tokens (HS256). Base64 image storage in Mongo.
- **Frontend:** React 19 + Tailwind + shadcn/ui + Recharts. Bilingual dictionary in `src/lib/i18n.js`. Auth context persists to localStorage.
- **Auth:** Simple identifier lookup — matrix number (student), teacher code (teacher), `MK1993` (admin).

## Users
- **Student** — logs in by matrix number; sees homeroom modules and submits reports.
- **Teacher** — logs in by EG#### code; same access as students for their homeroom.
- **Admin** — logs in with `MK1993` (via student or teacher tab); full CRUD + charts.

## Core requirements (static)
- Header: MRSM logo top-right, Home + Logout icons top-left.
- 4 dashboard tiles: Module Master (E-Reporting), Champion of the Week, Edustation, Homeroom Arena.
- Modules are **per Form** with `start_at` / `deadline_at` — locked before start, overdue after deadline.
- One submission per homeroom per module (users edit/delete only their homeroom's report).
- COTW leaderboard (top 3 homerooms) + up to 3 admin-uploaded gallery photos.
- Edustation shows subjects with external links (per Form). Admin CRUD, students/teachers view-only.
- Admin dashboard shows submissions by Form 1–5 (Pie + Bar chart).
- Bilingual EN / BM toggle in header (and login page).

## Implemented (2026-02)
- Full auth flow with admin backdoor via `MK1993`.
- Auto-seed of 54 teachers (Form 1–5) with codes and homerooms on startup.
- Modules, reports, subjects, COTW, students, teachers CRUD.
- Pie + Bar chart on admin overview + counters.
- Homeroom-scoped list view (Homeroom Arena) with file download + image preview.
- Base64 image + HR upload storage in Mongo.
- Full bilingual dictionary.

## Backlog
- P1: Bulk-import students via CSV.
- P1: Print / export report PDF per homeroom.
- P2: Push notifications when a module opens (Monday 9am).
- P2: Public COTW share card image.
