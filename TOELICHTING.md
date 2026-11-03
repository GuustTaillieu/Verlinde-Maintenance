# Verlinde Security BV — Maintenance & Planning Cockpit
**Explanatory Note and Strategic Architecture (Max. 1 page A4)**

---

### 1. What was wrong with the legacy system (BuildDesk Pro)?
Dirk’s frustration captured the operational reality: he never knew which maintenance was upcoming, feared forgetting customers (especially mandatory fire safety), and wasted hours navigating outdated software.

A deep forensic analysis of Verlinde's database (snapshot date: 02/11/2026) revealed the actual situation:
* **89 out of 193 active installations (46%) are overdue for maintenance.**
* **15 fire alarm systems are legally expired.** Under Belgian safety regulations (Royal Decrees on Fire Safety / NBN S21-100), fire detection maintenance is mandatory annually (12 months). This represents an acute legal and insurance liability for both Verlinde and its clients.
* Of those 89 overdue installations, **75 have zero planned work orders** in the future: they are administratively forgotten.
* **The Structural Flaw:** In BuildDesk Pro, asset sheets (`DOC > Mgmt sheets`) and work orders (`DOC > WO`) are disconnected. Executing a work order never updates the installation sheet automatically. Out of 193 sheets, the *'last maintenance'* field was filled in only 22 times, and *'next maintenance'* only 8 times. Furthermore, the work order list defaults to filtering only *current month*, causing older unfinished tickets to disappear from sight. Planning a single maintenance required a 10-step wizard fraught with obsolete templates and warnings.

---

### 2. What did we choose to solve and why? (The 80/20 Leverage)
As a Forward Deployed Engineer (FDE), the mission is not to replicate a 15-year-old ERP, but to directly restore Dirk's peace of mind and eliminate operational friction:

1. **Dynamic Maintenance Calculation Engine:**
   The system calculates the true maintenance deadline dynamically by linking the entire historical work order ledger (559 orders) to legal intervals. Dirk never has to manually type dates into static sheets again.
2. **Priority Alert Dashboard (Fire Safety & Forgotten Clients First):**
   Dirk gets immediate clarity: legally overdue fire systems (strict priority), overdue systems without any open work order (forgotten clients), upcoming tasks (30–60 days), and compliant systems.
3. **Smart Batch Scheduling & Technician Availability:**
   Dirk selects overdue installations in a given municipality (e.g. Zwevegem, Harelbeke, or Kortrijk) and schedules them in a single action. The smart dispatch overlay checks technician availability, recommends specialists (e.g. Brandtec for fire systems), and automatically generates linked work orders with component checklists.
4. **Focused Mobile Technician Execution (Zero-Trust):**
   Technicians (Tom, Wout, Jens, Brandtec) log into their dedicated, responsive daily agenda. They see their schedule, GPS directions, calling buttons, client access codes (scoped only to today's job), and an interactive component checklist with customer sign-off.

---

### 3. What did we deliberately NOT do (and why)?
* **No real-time streaming or websockets:** Security installation dispatching operates in minutes and hours, not milliseconds. Standard query caching with TanStack Query v5 provides instant optimistic updates without websocket infrastructure overhead or server costs.
* **No full billing or accounting module:** BuildDesk Pro already exports invoices (`INV`) to an external accountant. Rebuilding accounting does not solve Dirk’s planning pain and introduces migration risk.
* **No complex warehouse inventory system (WMS):** Verlinde operates with 3 technicians and 1 subcontractor using vehicle stocks. A rigid warehouse tracking system would add unnecessary administrative overhead for field technicians.
* **No native app stores:** A responsive web application works seamlessly on desktops, tablets, and smartphones without app store approval delays or deployment barriers.

---

### 4. Questions to ask Dirk before the next iteration (FDE Discovery)
1. **Subcontractor vs. In-house Technicians:**
   *"Are certain fire detection panels certified exclusively for Brandtec (e.g., brand-specific supplier certifications), or can Tom and Wout also be dispatched for standard fire inspections?"*
2. **Customer Appointment Scheduling Workflow:**
   *"Do you call clients to confirm a date before dispatching, or would an automated SMS/email with a proposed date and one-click confirmation link save you phone time?"*
3. **Fixed Customer Maintenance Windows:**
   *"Do commercial clients (schools, industrial sites) have mandatory maintenance periods (e.g., during summer holidays or factory shutdown weeks)?"*
4. **Digital Certificates & Regulatory Reports:**
   *"Does the technician need to generate an official digital inspection certificate signed by the client on-site, or is the internal checklist sufficient for the office to email the certificate?"*
