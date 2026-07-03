# Employee Work Tracking System

A ServiceNow scoped application prototype built with React + Tailwind CSS.

**Capstone Project** — Universidad de Dagupan  
**Author:** Clarissa Angel Gutlay & Ana Victoria Alentajan
**Program:** BS Computer Science 3

---

## Features

| Role | Capabilities |
|------|-------------|
| **Employee** | Log daily work hours, track assigned tasks, submit leave requests |
| **Manager** | Approve/reject timesheets, decide on leave requests, assign tasks |
| **Admin** | Dashboard with KPIs, approved hours chart, user account management |

- Automatic overtime calculation (hours > 8)
- Role-based access — each user sees only what their role permits
- Persistent data via `localStorage`
- Demo role switcher (bottom-left) for presentation purposes

---

## Tech Stack

- **React 18** + Vite
- **Tailwind CSS 3**
- **lucide-react** icons
- **Inter** font (Google Fonts)

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Build & Deploy

```bash
npm run build   # outputs to /dist
npm run preview # preview production build locally
```

### Deploy to Vercel
1. Push this repo to GitHub (`azianverse`)
2. Import the repo at [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite — no config needed
4. Copy the deployed URL → paste into SkillWallet Demo URL field

---

## Project Structure

```
src/
├── App.jsx       # All components and app logic
├── main.jsx      # React entry point
└── index.css     # Tailwind directives + global styles
index.html        # HTML shell with Inter font
vite.config.js
tailwind.config.js
postcss.config.js
```

---

## Deliverables Mapping

| Deliverable | Status |
|-------------|--------|
| #1 Data Model Diagram | ✅ Done |
| #2 Scoped Application (this repo) | ✅ Done |
| #3 Reports and Dashboards | ✅ Admin overview |
| #4 Final Presentation | 🔲 Pending |
| #5 ACL Configuration Document | ✅ Done |
| #6 Timesheet Workflow Documentation | ✅ Done |

---

## ServiceNow Table Mapping

| App Table | ServiceNow Table |
|-----------|-----------------|
| Timesheets | `x_emptrack_timesheet` |
| Tasks | `x_emptrack_task` |
| Leave Requests | `x_emptrack_leave_request` |
| Junction (timesheet-task) | `x_emptrack_timesheet_task` |
| Users | `sys_user` (extended) |
