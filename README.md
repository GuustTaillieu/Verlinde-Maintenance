# Verlinde Security - Maintenance & Operations Platform

Operations, asset management, and dispatch platform for Verlinde Beveiliging BV (Zwevegem, West Flanders, Belgium). Replaces legacy BuildDesk Pro software to resolve maintenance backlogs, ensure mandatory annual fire safety compliance (Belgian standard NBN S21-100), and manage field service workflows for internal technicians.

---

## Background & Problem Context

Verlinde Beveiliging installs and maintains four security disciplines across commercial and residential premises:
- Fire Detection (Brand)
- Intrusion Alarms (Inbraak)
- Video Surveillance (CCTV)
- Access Control (Toegang)

For more than 10 years, the company operated on BuildDesk Pro, a legacy ERP where asset sheets (`MS_HDR`) and work orders (`WO_HDR`) were decoupled. Completing a work order did not update the installation sheet. Over time:
- 89 of 193 active installations (46%) fell overdue for periodic maintenance.
- Legally mandated annual fire inspections lapsed, creating regulatory and insurance liability.
- 55 installations had zero scheduled work orders in the pipeline.
- The legacy interface filtered solely by the active calendar month, hiding older unresolved work orders from view.

This platform replaces static records with a dynamic calculation engine that links historical work orders directly to physical equipment and legal maintenance intervals.

---

## Domain Model

The data layer separates billing debtors, physical locations, hardware components, and service events:

```
Customer (Debtor / Invoicing entity)
  └── Site / Property (Physical address & access credentials)
        ├── Equipment (Hardware components: panels, detectors, batteries)
        └── Work Order (Scheduled visit on a given date)
              └── Work Order Item (Inspection checklist items verified on-site)
```

### Core Entities

- **Customer (`customers`)**: Legal entity responsible for billing. Can own multiple physical sites.
- **Site (`sites`)**: Physical property. Holds the address, primary discipline, confidential access notes (alarm codes, lockboxes), and dynamically calculated maintenance due dates.
- **Equipment (`equipment`)**: Individual devices installed at a site. Tracks serial numbers, installation dates, maintenance intervals (typically 12 months), and locations inside the building.
- **Work Order (`work_orders`)**: Job ticket assigned to a specific technician, date, and time slot. Records office notes, technician field notes, customer signatures, and completion timestamps.
- **Work Order Item (`work_order_items`)**: Line-by-line checklist tied to physical equipment, marked on-site during an inspection.

---

## System Modules

### 1. Operations Page (`/dashboard`)
Central overview for managing director Dirk Verlinde.
- Compliance KPI counters: legally expired fire systems, forgotten clients (overdue with no open work order), upcoming inspections (30-60 days), and compliant sites.
- Geographic clustering: groups overdue installations by municipality (Zwevegem, Kortrijk, Harelbeke, Waregem, Menen) to minimize driving time.
- Batch proposal workflow: review affected customers, generate schedule slots, and preview customer communication.

### 2. Clients & Assets (`/clients`)
Comprehensive customer and installation directory.
- Search and filter by client name, debtor code, municipality, and discipline.
- Site breakdown: view addresses, discipline types, and confidential alarm codes.
- Zero-trust access vault: alarm disarm codes and gate keys remain masked by default to prevent shoulder-surfing.
- Hardware register: installed panels, detectors, and batteries with installation dates and maintenance intervals.
- Service history: chronological log of all past work orders, inspection results, customer signatures, and safety certificates.

### 3. Weekly Planning & Dispatch (`/planning`)
Tactical schedule grid for internal field operations.
- Technician switcher: toggle between internal staff members.
- Five-day weekly calendar grid (Monday to Friday) divided into standard two-hour service slots: 08:30-10:30, 10:30-12:30, 13:30-15:30, and 15:30-17:30.
- Context-aware modals: scheduled jobs open travel, contact, and checklist details; completed jobs show signed audit records and field findings.

### 4. Field Technician Agenda (`/week-schedule`)
Mobile-optimized view for service technicians in the field.
- Chronological list of daily assigned jobs.
- Direct calling links and GPS navigation triggers.
- Time-gated access: technicians can view confidential alarm codes only for jobs assigned to them on the current day.
- On-site component checklist and digital customer sign-off.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Framework | TanStack Start (v1) | Full-stack React framework with SSR and Nitro server engine |
| Runtime & Language | Node.js / TypeScript | Strict type safety across client, server, and schema definitions |
| UI & Styling | React 19, Tailwind CSS v4, shadcn/ui | Production interface with micro-typography and dark mode support |
| State & Data Fetching | TanStack Query v5 | Cache management, optimistic mutations, and background synchronization |
| Routing | TanStack Router | Type-safe file-based routing and layout management |
| Tables | TanStack Table v8 | High-density data tables for asset lists and customer directories |
| Database & ORM | SQLite / LibSQL with Drizzle ORM | Embedded relational database with declarative migrations |
| Authentication | Better Auth | Session management and role-based access control |

---

## Repository Structure

```
verlinden/
├── data/                       # Legacy BuildDesk export files (JSON and CSV)
├── src/
│   ├── db/
│   │   ├── index.ts            # Database connection client (LibSQL / SQLite)
│   │   ├── schema.ts           # Drizzle relational schema definitions
│   │   └── migrate-seed.ts     # Ingestion and migration script from BuildDesk
│   ├── features/
│   │   ├── auth/               # Better Auth hooks, session management, and forms
│   │   ├── customers/          # Client tables, detail views, and equipment cards
│   │   ├── dispatch/           # Planning calendar, technician selectors, and slots
│   │   ├── maintenance/        # Dashboard KPIs, city clusters, and proposal dialogs
│   │   └── shared/             # Reusable UI primitives, sidebar, dialogs, and utilities
│   ├── routes/
│   │   ├── __root.tsx          # Root HTML document and provider wrapper
│   │   ├── _auth.tsx           # Authentication boundary
│   │   ├── _auth/
│   │   │   ├── _manager.tsx    # Manager layout with primary navigation sidebar
│   │   │   ├── _manager/
│   │   │   │   └── dashboard.tsx
│   │   │   └── _technician/
│   │   │       └── week-schedule.tsx
│   │   └── _public/            # Public routes (login, landing)
│   └── styles.css              # Tailwind CSS configuration and theme tokens
├── PROJECT_ARCHITECTURE.md     # Authoritative domain analysis and feature roadmap
├── TOELICHTING.md              # Project justification note for stakeholders
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js >= 20.x
- pnpm >= 9.x

### 1. Installation

Clone the repository and install dependencies:

```bash
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.local`):

```bash
# Application URL
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secure-secret-key-here

# SQLite Database connection
DATABASE_URL="file:local.db"
```

### 3. Database Migration & Seed

The seed script parses legacy BuildDesk Pro exports (`data/seed_full.json`), normalizes customer records, constructs the relational equipment tree, and seeds authenticated test accounts:

```bash
pnpm db:seed
```

### 4. Running the Development Server

Start the application on port 3000:

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

---

## Seed Accounts & Access Roles

The seed script creates the following internal team accounts. All accounts use password: `password123`

| Name | Role | Email | Tech Code | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| Dirk Verlinde | MANAGER | dirk@verlinde-beveiliging.be | DV | Managing director, operations, lead dispatcher |
| Tom De Coninck | TECHNICIAN | tom@verlinde-beveiliging.be | TDC | Senior field technician (Fire, Intrusion, CCTV) |
| Wout Vanhoutte | TECHNICIAN | wout@verlinde-beveiliging.be | WVH | Field technician (Intrusion, CCTV, Access) |
| Jens Maes | TECHNICIAN | jens@verlinde-beveiliging.be | JMS | Field technician (Intrusion, CCTV) |

*Note: Third-party subcontractors are excluded from the scope of this platform. All operations are handled by Verlinde's internal team.*

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the Vite development server on port 3000 |
| `pnpm build` | Generates routes and builds production assets via Nitro |
| `pnpm preview` | Previews the production build locally |
| `pnpm db:seed` | Resets the SQLite database and imports legacy BuildDesk datasets |
| `pnpm db:generate` | Generates Drizzle migration files based on schema changes |
| `pnpm db:push` | Pushes Drizzle schema changes directly to the database |
| `pnpm db:studio` | Launches Drizzle Studio GUI for inspecting database rows |

---

## Security Model

1. **Role-Based Redirection:** Authenticated users with the `MANAGER` role are directed to the management cockpit (`/dashboard`). Users with the `TECHNICIAN` role are restricted to field execution views (`/week-schedule`).
2. **Access Code Isolation:** Alarm codes and master key combinations are stored in `sites.access_notes_confidential`. In management views, codes are masked with click-to-reveal controls. Technicians can view decrypted codes only for sites where they have an active work order scheduled for the current date.
3. **Audit History:** When a work order is completed, the site maintenance date updates automatically, preserving the technician identity, timestamp, checklist status, and customer signature.
