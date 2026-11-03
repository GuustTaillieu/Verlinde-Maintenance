# PROJECT ARCHITECTURE & SPECIFICATION
**Project:** Verlinde Security Maintenance & Operations Platform (Vicar FDE Assessment)  
**Target Architecture:** TanStack Start (v1) + React 19 + TypeScript + Drizzle ORM (LibSQL / SQLite) + Tailwind CSS + shadcn/ui

---

## 1. Executive Summary & Problem Diagnosis

### The Client
**Verlinde Beveiliging BV** is a certified security installation company based in Zwevegem (West Flanders, Belgium). The company is operated by owner **Dirk Verlinde**, with 3 internal field technicians (**Tom De Coninck**, **Wout Vanhoutte**, **Jens Maes**) and 1 certified external fire subcontractor (**Brandtec BV**).

They install and service 4 security domains:
1. **Fire Alarms (*Brand*)**: Smoke detectors, sirens, heat sensors, central control panels.
2. **Burglar / Intrusion Alarms (*Inbraak*)**: Motion detectors, magnetic door contacts, sirens, keypads.
3. **CCTV (*Camera*)**: Cameras, network video recorders, hard drives.
4. **Access Control (*Toegang*)**: Keycard readers, electronic strikes, access badges.

### The Problem in Legacy Software (*BuildDesk Pro*)
For 15 years, Verlinde has used *BuildDesk Pro*, a 2008-era legacy desktop ERP.
A forensic inspection of the exported dataset (snapshot reference date: **02/11/2026**) revealed:
1. **The Structural Disconnection:**
   Asset sheets (`DOC > Mgmt sheets` / `MS_HDR`) and work orders (`DOC > WO` / `WO_HDR`) are disconnected in the legacy database. Executing and finishing a work order *never* updates the customer's installation sheet automatically.
   - Out of 193 active installations, **only 22 sheets have any "Last Service" date filled in**. The other 171 were left blank because Dirk stopped manually typing dates into static sheets years ago.
   - Consequently, **89 out of 193 installations (46%) are overdue for maintenance**.
2. **Acute Legal Fire Liability (Belgian Law NBN S21-100):**
   - **7 fire alarm installations are critically and legally expired.**
   - Under Belgian regulations (Royal Decree on Fire Safety & NBN S21-100), fire detection systems in commercial buildings **must be inspected and certified every 12 months**. If a building has a fire after 13 months, insurance claims are invalidated, exposing both the building owner and Verlinde to severe liability.
3. **Forgotten Clients:**
   - **55 installations** are overdue with **zero planned work orders** in the pipeline.
4. **The Monthly Filter "Blindfold":**
   - The legacy work order list defaulted to filtering only the *current calendar month*. Any uncompleted job from a previous month disappeared from the screen. This resulted in **38 unallocated backlog work orders** imported from BuildDesk.

---

## 2. Domain Hierarchy & Data Model (Fresh Architecture)

### Core Architectural Principle
A customer is **not** an installation. An installation is **not** a single component.
The relationship must be cleanly decoupled:

```
Customer (Entity that pays the invoice)
  └── Site / Installation (Physical location with address & alarm access codes)
        ├── Equipment / Component (Specific smoke detector, central, camera, battery)
        └── Work Order (Scheduled visit on a given date to inspect equipment)
              └── Work Order Item / Checklist (Inspection items & replacement parts)
```

### Entities

1. **User (`users`)**:
   - `id`: string (UUID)
   - `name`: string
   - `email`: string (unique)
   - `password_hash`: string
   - `role`: enum (`MANAGER`, `TECHNICIAN`)
   - `is_contractor`: boolean (true for external subcontractors like Brandtec BV)
   - `specialties`: JSON array of string (`["FIRE", "INTRUSION", "CCTV", "ACCESS"]`)
   - `weekly_schedule`: JSON object defining working hours per weekday (e.g. `{"mon": 8, "tue": 8, "wed": 4, "thu": 8, "fri": 8}`)
   - `initials`: string (e.g. `DV`, `TC`, `WV`, `JM`, `BT`)

2. **Customer (`customers`)**:
   - `id`: string
   - `code`: string (e.g. `K0012` legacy debtor code)
   - `name`: string (Company or Individual)
   - `type`: enum (`B2B`, `RESIDENTIAL`)
   - `vat_number`: string (optional)
   - `email`: string (billing/contact email)
   - `phone`: string
   - `mobile`: string
   - `invoice_address`: string
   - `invoice_city`: string
   - `invoice_zip`: string

3. **Site / Installation (`sites`)**:
   - `id`: string
   - `customer_id`: foreign key -> `customers.id`
   - `legacy_sheet_nr`: string (e.g. `#2024-0012` from BuildDesk `MS_HDR`)
   - `name`: string (e.g. "Factory Hall Zwevegem", "Headquarters", "Private Residence")
   - `site_address`: string (physical location)
   - `site_city`: string (for West Flanders municipality clustering)
   - `site_zip`: string
   - `primary_discipline`: enum (`FIRE`, `INTRUSION`, `CCTV`, `ACCESS`, `OTHER`)
   - `access_notes_confidential`: string (Alarm codes, gate codes, key lockbox codes) -> **Protected by Zero-Trust GDPR policy**
   - `is_active`: boolean

4. **Equipment / Components (`equipment`)**:
   - `id`: string
   - `site_id`: foreign key -> `sites.id`
   - `article_code`: string (e.g. `OPT-DET-01`, `BAT-12V7`, `CENT-NX8`)
   - `description`: string (e.g. "Optical Smoke Detector Loop 1", "Backup Battery 12V 7Ah")
   - `location`: string (e.g. "Server Room", "Warehouse Hall B", "Front Entrance")
   - `install_date`: string (ISO date `YYYY-MM-DD`)
   - `maintenance_interval_months`: integer (e.g. 12 for Fire, 12 for Intrusion, 24 for CCTV)
   - `last_service_date`: string (ISO date `YYYY-MM-DD` — automatically bumped on completed WO)
   - `next_due_date`: string (ISO date `YYYY-MM-DD` — computed: `last_service_date + maintenance_interval_months`)
   - `quantity`: integer (default 1)
   - `status`: enum (`ACTIVE`, `REPLACED`, `DECOMMISSIONED`)

5. **Work Order (`work_orders`)**:
   - `id`: string
   - `wo_number`: string (e.g. `WO2026-0560`)
   - `site_id`: foreign key -> `sites.id`
   - `assigned_technician_id`: foreign key -> `users.id` (nullable until dispatched)
   - `status`: enum (`UNASSIGNED`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
   - `kind`: enum (`MAINTENANCE`, `INTERVENTION_REPAIR`, `NEW_INSTALLATION`)
   - `planned_date`: string (ISO date `YYYY-MM-DD`)
   - `planned_start_time`: string (e.g. `08:30`)
   - `planned_end_time`: string (e.g. `10:30`)
   - `office_notes`: string (dispatch instructions)
   - `technician_closing_notes`: string (written on-site)
   - `signed_by_name`: string (customer sign-off)
   - `is_signed`: boolean
   - `completed_at`: timestamp

6. **Work Order Inspection Checklist (`work_order_items`)**:
   - `id`: string
   - `work_order_id`: foreign key -> `work_orders.id`
   - `equipment_id`: foreign key -> `equipment.id` (optional, if linked to specific asset)
   - `description`: string (e.g. "Inspect Optical Smoke Detector Server Room")
   - `article_code`: string
   - `quantity`: real
   - `is_checked`: boolean (ticked by technician on smartphone)
   - `notes`: string

---

## 3. The 3 Core Personas & User Workflows

### Persona A: Dirk (Managing Director / Dispatcher)
- **Goal:** Never forget a customer, eliminate fire alarm legal liability, minimize driving time.
- **Workflow:**
  1. Opens the **Maintenance Cockpit**.
  2. Sees clear KPI alerts:
     - **Legally Expired (Fire)** (Red priority)
     - **Forgotten Customers** (Overdue with no WO scheduled)
     - **Due Soon (30-60 days)** (Yellow proactive contact)
  3. Uses the **Cluster Filter** by municipality (e.g. *Kortrijk*, *Zwevegem*, *Harelbeke*, *Waregem*, *Menen*).
  4. Selects 3 overdue sites in the same city.
  5. Clicks **Schedule Selected**.
  6. A week calendar opens. The system recommends **Brandtec** for fire systems and shows technician capacity.
  7. Dirk slots the tasks into Wednesday morning/afternoon and confirms.
  8. Work orders are instantly generated with full equipment checklists copied over.

### Persona B: Field Technicians (Tom, Wout, Jens) & Subcontractor (Brandtec BV)
- **Goal:** Zero administrative overhead, instant on-site clarity, smooth customer handover.
- **Workflow:**
  1. Opens the app on mobile/tablet in the van. Lands directly on **My Schedule**.
  2. Sees today's assigned jobs sorted by time slot.
  3. Taps **Navigate (GPS)** to open Google Maps directly.
  4. Taps **Call** to phone the client before arrival.
  5. On arrival, views the **Confidential Alarm Code** (decrypted and shown *only* for today's assigned job).
  6. Opens the **Component Checklist** and checks off detectors, panel voltage, battery levels.
  7. Snaps a photo of the central panel.
  8. Customer signs with a finger.
  9. Tech taps **Complete Work Order**.
  10. **Automation Trigger:** The database automatically bumps each checked equipment item's `last_service_date = today` and `next_due_date = today + 12 months`. Dirk does nothing.

---

## 4. Zero-Trust Security & GDPR Compliance Rules

1. **Client Confidential Alarm Codes (`access_notes_confidential`):**
   - Clients give Verlinde their keypad disarm codes (e.g. `7603#`, master gate keys).
   - **Rule 1:** Managers (`role === 'MANAGER'`) can view all codes for emergency dispatch.
   - **Rule 2:** Technicians can **only** view the alarm code of an installation if they are the `assigned_technician_id` on an active work order scheduled for **today**.
   - **Rule 3:** External contractors (`is_contractor === true`) are blocked from alarm access codes unless explicitly marked as allowed.
2. **No Role Switchers / Mock Dropdowns:**
   - Real credential-based authentication using HTTP cookies / session tokens.
   - Manager lands on `/` (Cockpit). Technicians land on `/tasks` (Mobile agenda).

---

## 5. Seed Dataset Mapping (BuildDesk Pro to Fresh Schema)

The raw legacy data is preserved in `data/seed_full.json` and CSV files:
- `REL.json` (Debtors / Clients) -> Maps to `customers` table (138 customers).
- `MS_HDR.json` (Management Sheets) -> Maps to `sites` table (193 installations).
- `MS_COMP.json` (Components) -> Maps to `equipment` table (1,089 individual components).
- `WO_HDR.json` (Historical Work Orders) -> Maps to `work_orders` (559 historical orders).
- `RES.json` (Employees) -> Maps to `users` table:
  - `DV` -> Dirk Verlinde (Manager)
  - `TDC` -> Tom De Coninck (Technician)
  - `WVH` -> Wout Vanhoutte (Technician)
  - `JMS` -> Jens Maes (Technician)
  - `BRT` -> Brandtec BV (External Fire Subcontractor)
