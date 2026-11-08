# PROJECT ARCHITECTURE & SPECIFICATION
**Project:** Verlinde Security Maintenance & Operations Platform (Vicar FDE Assessment)  
**System Type:** Security Installation Maintenance, Asset Management & Tactical Dispatching

---

## 1. Executive Summary & Problem Diagnosis

### The Client
**Verlinde Beveiliging BV** is a certified security installation company based in Zwevegem (West Flanders, Belgium). The company is operated by owner **Dirk Verlinde** (Manager & Lead Dispatcher) together with 3 internal field technicians:
1. **Tom De Coninck (`TDC`)** — Senior Field Technician
2. **Wout Vanhoutte (`WVH`)** — Field Technician
3. **Jens Maes (`JMS`)** — Field Technician

*(Note: External third-party subcontractors such as Brandtec are explicitly out of scope. The platform is strictly tailored for Verlinde's internal team: Dirk as Manager and Tom, Wout, Jens as Technicians).*

They install and service 4 core security disciplines:
1. **Fire Alarms (*Brand*)**: Smoke detectors, sirens, heat sensors, central control panels (NBN S21-100 certified).
2. **Burglar / Intrusion Alarms (*Inbraak*)**: Motion detectors, magnetic door contacts, sirens, keypads, backup batteries.
3. **CCTV (*Camera*)**: IP cameras, network video recorders, hard drives.
4. **Access Control (*Toegang*)**: Keycard readers, electronic strikes, access badges.

### The Problem in Legacy Software (*BuildDesk Pro*)
For 15 years, Verlinde used *BuildDesk Pro*, a 2008-era legacy desktop ERP.
A forensic inspection of the exported dataset (snapshot reference date: **02/11/2026**) revealed:
1. **The Structural Disconnection:**
   Asset sheets (`DOC > Mgmt sheets` / `MS_HDR`) and work orders (`DOC > WO` / `WO_HDR`) were completely severed in the legacy database. Executing and finishing a work order *never* updated the customer's installation sheet automatically.
   - Out of 193 active installations, **only 22 sheets had any "Last Service" date filled in**. The other 171 were left blank because manual date entry into static sheets broke down years ago.
   - Consequently, **89 out of 193 installations (46%) are overdue for maintenance**.
2. **Acute Legal Fire Liability (Belgian Law NBN S21-100):**
   - Under Belgian regulations (Royal Decree on Fire Safety & NBN S21-100), fire detection systems in commercial buildings **must be inspected and certified every 12 months**. If a building suffers fire damage after 13 months, insurance claims are invalidated, exposing both the building owner and Verlinde to severe legal liability.
3. **Administratively Forgotten Clients:**
   - **55 installations** are overdue with **zero planned work orders** anywhere in the pipeline.
4. **The Monthly Filter "Blindfold":**
   - The legacy work order list defaulted to filtering only the *current calendar month*. Any uncompleted job from a previous month simply disappeared from view, leaving behind dozens of unallocated backlog tickets.

---

## 2. Core Domain Hierarchy & Conceptual Data Model

### Fundamental Domain Principle
A customer is **not** an installation. An installation is **not** a single component.
The domain must be cleanly decoupled into a 4-tier hierarchy:

```
Customer (Debtor / Legal Entity that pays invoices)
  └── Site / Property (Physical building with address & alarm access codes)
        ├── Equipment / Component (Specific smoke detector, central panel, battery, camera)
        └── Work Order (Scheduled visit on a given date to inspect equipment)
              └── Work Order Item (Inspection checklist items & replacements per visit)
```

### Conceptual Entities

1. **User (`users`)**:
   - `id`: Unique identifier
   - `name`: Full name
   - `email`: Login email address
   - `role`: `MANAGER` (Dirk) or `TECHNICIAN` (Tom, Wout, Jens)
   - `tech_code`: Initials / technician code (`DV`, `TDC`, `WVH`, `JMS`)
   - `specialties`: Security disciplines certified for (`FIRE`, `INTRUSION`, `CCTV`, `ACCESS`)
   - `weekly_schedule`: Working hours per weekday (e.g. `mon: 8h, tue: 8h, wed: 4h, thu: 8h, fri: 8h`)

2. **Customer (`customers`)**:
   - `id`: Unique identifier
   - `code`: Debtor code (e.g. `K00126`)
   - `name`: Company or individual client name
   - `type`: `B2B` (commercial / industrial) or `RESIDENTIAL` (private homeowner)
   - `vat_number`: Optional VAT identifier
   - `email`: Billing / communication email
   - `phone` / `mobile`: Telephone contact numbers
   - `invoice_address`, `invoice_city`, `invoice_zip`: Billing headquarters

3. **Site / Property (`sites`)**:
   - `id`: Unique identifier
   - `customer_id`: Link to parent customer debtor
   - `sheet_number`: Installation sheet identifier (e.g. `#1001`)
   - `name`: Descriptive location name (e.g. "Productiehal Zwevegem", "Magazijn Harelbeke")
   - `site_address`, `site_city`, `site_zip`: Physical premises address
   - `primary_discipline`: Primary system installed (`FIRE`, `INTRUSION`, `CCTV`, `ACCESS`)
   - `access_notes_confidential`: Keypad disarm code, master key location, lockbox codes (protected by Zero-Trust policy)
   - `frequency`: Maintenance interval (standard 12 months)
   - `last_service_date`: Latest completed inspection date (dynamically bumped upon finishing a work order)
   - `next_due_date`: Computed next inspection deadline (`last_service_date + frequency`)

4. **Equipment & Installed Components (`equipment`)**:
   - `id`: Unique identifier
   - `site_id`: Link to physical site
   - `article_code`: Hardware catalog code (e.g. `ALC-CEN-32`, `BAT-12V7`, `DET-OPT-01`)
   - `description`: Component label (e.g. "Centrale NX-8", "Optische Rookmelder Zone 2")
   - `location`: Specific physical zone in building (e.g. "Serverruimte", "Inkomhal", "Loods B")
   - `install_date`: Initial installation date
   - `maintenance_interval_months`: Interval in months (standard 12)
   - `last_service_date` / `next_due_date`: Component-level inspection tracking
   - `status`: `ACTIVE`, `REPLACED`, or `DECOMMISSIONED`

5. **Work Order (`work_orders`)**:
   - `id`: Unique identifier
   - `wo_number`: Human-readable ticket number (e.g. `WO2026-0560`)
   - `customer_id` & `site_id`: Target site and customer
   - `assigned_technician_id`: Internal technician assigned (`DV`, `TDC`, `WVH`, `JMS`)
   - `status`: `UNASSIGNED`, `PROPOSED`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
   - `kind`: `MAINTENANCE`, `INTERVENTION_REPAIR`, `NEW_INSTALLATION`
   - `planned_date`: Scheduled date (`YYYY-MM-DD`)
   - `planned_start_time` / `planned_end_time`: Scheduled time window (e.g. `08:30 - 10:30`)
   - `office_notes`: Dispatch notes, access instructions, customer requests
   - `tech_notes`: Field findings written by technician upon completion
   - `certificate_document`: Reference to regulatory safety inspection document
   - `is_signed`, `signed_by_name`, `signed_at`: Digital on-site customer signature verification
   - `completed_at`: Verification timestamp

6. **Work Order Item / Checklist (`work_order_items`)**:
   - `id`: Unique identifier
   - `work_order_id`: Parent work order ticket
   - `equipment_id`: Reference to specific physical equipment
   - `description`: Checklist item description
   - `is_checked`: Verification flag ticked by technician
   - `tech_remarks`: Field note on specific component (e.g. "Batterij vervangen wegens 11.2V")

---

## 3. Module Specifications & MoSCoW Prioritization

### 3.1 Klanten & Installaties Tab (`Clients`)
The central asset and customer management hub. Provides the complete lifecycle of who the customer is, where their properties are located, what hardware is installed, and the full compliance inspection history.

#### Tier 1: Master Client Overview List
* **[MUST HAVE]** Searchable, filterable client table with real-time text query (searching debtor code, name, city, street).
* **[MUST HAVE]** Maintenance health indicator per customer:
  - Green (`In orde`): All sites inspected within valid interval.
  - Amber (`Naderend`): Maintenance due within 30–60 days.
  - Red (`Vervallen`): Maintenance overdue or fire compliance expired.
* **[MUST HAVE]** Direct contact actions (one-click phone call `tel:...` and email links).
* **[MUST HAVE]** Discipline badges indicating installed systems per client (`Brand`, `Inbraak`, `CCTV`, `Toegang`).
* **[SHOULD HAVE]** Type filter: Toggle between `Alle`, `B2B (Bedrijven)` en `Particulieren`.
* **[SHOULD HAVE]** Location / City quick filter (e.g., Kortrijk, Zwevegem, Harelbeke).
* **[NICE TO HAVE]** Modal to register a new client entity with initial property details.

#### Tier 2: Client Profile & Sites Hub
* **[MUST HAVE]** Dedicated client profile displaying billing headquarters, VAT number, and contact info.
* **[MUST HAVE]** Physical Sites / Properties accordion or tabbed selector (supporting clients with 1 or multiple properties).
* **[MUST HAVE]** Site details panel displaying physical address, on-site contact, and primary discipline.
* **[MUST HAVE]** Zero-Trust Confidential Access Vault:
  - Stores keypad disarm codes, master keys, and gate lockbox combinations.
  - **Security Rule:** Always masked by default (`••••••••`). Revealing code requires deliberate click by authenticated manager.
* **[SHOULD HAVE]** Direct "Navigate via Google Maps / Waze" shortcut for site address.

#### Tier 3: Installed Equipment Inventory
* **[MUST HAVE]** Equipment table per site detailing every hardware asset:
  - Article code & description (e.g. "Centrale NX-8", "Optische Rookmelder").
  - Physical location inside building (e.g. "Serverruimte", "Inkomhal", "Loods B").
  - Installation date and maintenance interval (12 months).
  - Component status (`Actief`, `Vervangen`).
* **[SHOULD HAVE]** Quick-add component modal to register newly installed hardware or replacement parts.
* **[NICE TO HAVE]** Battery expiry tracker highlighting batteries older than 4 years requiring replacement.

#### Tier 4: Inspection Records & Audit Trail
* **[MUST HAVE]** Chronological log of all past completed work orders for the selected site.
* **[MUST HAVE]** Inspection card showing inspection date, assigned technician initials (`DV`, `TDC`, `WVH`, `JMS`), and completion status.
* **[MUST HAVE]** On-site digital sign-off display (client signature confirmation & name).
* **[SHOULD HAVE]** Completed Inspection Detail Modal / Drawer:
  - Displays the exact checklist items verified during that specific visit.
  - Shows technician field remarks and component replacements.
  - Download / preview link for the official fire safety attest (*Keuringsattest NBN S21-100*).

---

### 3.2 Planning & Agenda Tab (`Planning`)
The tactical weekly calendar and dispatch viewer. Allows Dirk to review and manage technician schedules, check workload capacity, and inspect future vs. past work orders.

*(Note: The high-level batch dispatching by municipality is already handled in the Maintenance Cockpit / Dashboard. The Planning tab serves as the tactical day-to-day agenda view).*

#### Weekly Schedule Grid & Controls
* **[MUST HAVE]** Technician Switcher (ComboBox / Tabs) allowing Dirk to switch between internal technicians:
  - Dirk Verlinde (`DV`)
  - Tom De Coninck (`TDC`)
  - Wout Vanhoutte (`WVH`)
  - Jens Maes (`JMS`)
* **[MUST HAVE]** Week Navigator:
  - `[ Vorige Week ]` `[ Huidige Week / Vandaag ]` `[ Volgende Week ]` with clear date range indicator (e.g., *Week 45: 3 nov - 7 nov 2026*).
* **[MUST HAVE]** 5-Day Weekly Timeline Grid (Monday through Friday):
  - Chronological time slots per day: Morning 1 (`08:30 - 10:30`), Morning 2 (`10:30 - 12:30`), Afternoon 1 (`13:30 - 15:30`), Afternoon 2 (`15:30 - 17:30`).
* **[MUST HAVE]** Work Order Card Display:
  - Client name & Site descriptive location.
  - Municipality badge (e.g., `Zwevegem`, `Kortrijk`).
  - Discipline indicator (`Brand`, `Inbraak`, `CCTV`, `Toegang`).
  - Status styling (Scheduled, In Progress, Completed).
* **[SHOULD HAVE]** Real-time technician capacity gauge (e.g. *32u / 38u gepland — 84% benutting*).

#### Job Card Interactions
* **[MUST HAVE]** Context-Aware Job Modal on Click:
  - **For Future / Scheduled Jobs:**
    - Opens **Upcoming Job Preview Dialog**.
    - Displays site location, GPS link, phone contact, scheduled checklist items, and office instructions.
    - Provides actions: *Herplannen* (change date/time slot) and *Heralloceren* (reassign to another technician).
  - **For Past / Completed Jobs:**
    - Opens **Completed Record Detail View**.
    - Displays technician field notes, ticked checklist items, signed customer signature, and certificate link.
* **[NICE TO HAVE]** Unassigned Backlog Drawer:
  - A collapsible sidebar panel listing unscheduled or overdue work orders that can be assigned directly into open time slots. *(Tagged Nice-to-Have because batch dispatch is already accessible on the Dashboard).*
* **[NICE TO HAVE]** Drag-and-drop job rescheduling between calendar days and time slots.

---

### 3.3 Dashboard Cockpit (`Dashboard`)
The central strategic cockpit for proactive operations.

* **[MUST HAVE]** KPI Health Counters:
  - **Legally Expired Fire Systems** (Strict Priority 1 — Red alert).
  - **Administratively Forgotten Clients** (Overdue with 0 open work orders — Amber alert).
  - **Due Soon (30–60 Days)** (Proactive scheduling pipeline).
  - **Compliant Systems** (Green).
* **[MUST HAVE]** Regional Municipality Cluster Cards (grouping overdue sites by city: Zwevegem, Kortrijk, Harelbeke, Waregem, Menen).
* **[MUST HAVE]** Batch Scheduling Dialog (assigning multiple clustered sites to a technician in a single flow).
* **[SHOULD HAVE]** Propose Appointment & Customer Email Review Workflow.
* **[SHOULD HAVE]** Regulatory Certificate Upload & Attest generation.

---

## 4. Zero-Trust Security & Operational Principles

1. **Client Confidential Alarm Access Codes (`access_notes_confidential`):**
   - Alarm disarm codes and gate keys are strictly confidential assets.
   - **Manager Access:** Dirk has full visibility across all sites for emergency dispatch and customer support, but codes are masked by default to prevent shoulder-surfing.
   - **Technician Access:** Technicians can only view the decrypted alarm code if they are the assigned technician on an active work order scheduled for **today**. Technicians cannot browse alarm codes of customers they are not visiting.
2. **Authentic Credentials (No Mock Switchers):**
   - The application enforces real role-based authentication (`MANAGER` vs `TECHNICIAN`).
   - Managers land on the Operations Cockpit (`/dashboard`).
   - Field Technicians land on their mobile day schedule (`/week-schedule`).
   - No mock dropdowns or fake role toggles in production UI.
3. **Automated Lifecycle Bumping:**
   - When a technician marks a work order as completed on-site with a customer signature, the database automatically bumps `sites.last_service_date = today` and `sites.next_due_date = today + 12 months`.
   - The asset sheet is updated programmatically without any manual data entry required from Dirk.

---

## 5. User Persona Workflows

### Persona A: Dirk Verlinde (Managing Director & Dispatcher)
- **Role:** Manager (`MANAGER`)
- **Primary Tool:** Desktop Browser
- **Daily Focus:**
  1. Opens the **Dashboard** in the morning to review compliance KPIs and regional clusters.
  2. Uses the **Clients** tab to lookup customer history, inspect installed equipment, or answer phone inquiries.
  3. Uses the **Planning** tab to review the weekly load across Tom, Wout, and Jens, reallocating urgent intervention jobs when needed.

### Persona B: Field Technicians (Tom, Wout, Jens)
- **Role:** Technician (`TECHNICIAN`)
- **Primary Tool:** Mobile / Tablet in service van
- **Daily Focus:**
  1. Logs into the responsive mobile web interface at start of day.
  2. Sees today's assigned appointments in chronological order.
  3. Uses one-tap GPS navigation to reach the customer site.
  4. Unmasks today's alarm access code upon arrival at the gate/keypad.
  5. Performs inspection, checking off detectors, central panel voltage, and backup battery state.
  6. Collects the customer's signature directly on screen and completes the work order.
