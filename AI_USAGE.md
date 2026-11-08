# Verantwoording AI-gebruik (AI Usage Disclosure)
**Project:** Verlinde Beveiliging BV — Maintenance & Operations Platform  
**Kandidaat:** Guust  
**Datum:** 8 november 2026  

---

## 1. Visie, Architectuur en Zelfgeschreven Basis

De regie, het concept en de fundamentele keuzes van dit project lagen te allen tijde volledig in eigen handen:

* **UI/UX Visie & Flow:** De overgang van een logge 15-jarige desktop-applicatie naar een no-nonsense, rustige Operations Cockpit (Shadcn/Linear-stijl) is door mijzelf bedacht en uitgetekend. De keuze om dispatching te centraliseren op het dashboard en niet te versnipperen over de kalender was een bewuste productbeslissing om Dirk rust te geven.
* **Domeinarchitectuur & Datamodel:** De ontkoppeling van het oude platte model naar de zuivere 4-trapshiërarchie (`Customer` -> `Site` -> `Equipment` -> `Work Order`) is door mijzelf ontworpen op basis van de analyse van de BuildDesk data.
* **Technologiekeuze:** De keuze voor de moderne 2026-stack (TanStack Start v1, React 19, Drizzle ORM met LibSQL/SQLite, TanStack Query v5, TanStack Table v8, Better Auth) is door mij bepaald.
* **Pattern-driven Development:** Ik heb de initiële dragende componenten, types en state-flows zelf geschreven. Pas toen deze patronen, lay-outs en conventies vaststonden in de code, heb ik AI ingezet om aanvullende componenten te genereren die exact diezelfde structuur overnamen.

---

## 2. Waarvoor werd AI inhoudelijk ingeschakeld?

### A. Complexe Planningsalgoritmes (Tijdslot- & Voorstelberekening)
Tijdens de ontwikkeling liep ik tegen de complexe logica aan rond het automatisch voorstellen van geschikte datum- en tijdsloten bij batch-dispatching. Hier moet rekening gehouden worden met:
* De geschatte duurtijd per werf op basis van het aantal componenten.
* De bestaande weekbelasting en werkuren van de techniekers.
* Het voorkomen van overlappende boekingen.

Deze specifieke slot-allocatieberekening heb ik door een AI-agent laten uitwerken. Vervolgens heb ik een tweede AI-agent een audit/code-review laten doen op die code om te verifiëren dat het algoritme computationeel efficiënt was, geen oneindige lussen bevatte en geen gevoelige klantdata lekte.

### B. Ingestie- & Migratiescript (`migrate-seed.ts`)
Nadat ik het relationele Drizzle-schema had vastgelegd, heb ik AI gevraagd het script te schrijven dat de ruwe exports uit BuildDesk (`data/seed_full.json`, bestaande uit honderden rijen in `REL`, `MS_HDR`, `MS_COMP` en `WO_HDR`) inleest, opschoont, omzet naar onze nieuwe tabellen en direct de Better Auth wachtwoord-hashes genereert.

### C. Patroonherhaling en Boilerplate
Zodra de eerste detailkaarten, filters en dialoogvensters door mij waren opgezet, heb ik AI gebruikt om repetitieve UI-elementen (zoals formulierdialogen, badges en tabelkolommen) te scaffolden volgens de reeds aanwezige codeconventies.

---

## 3. Documentatie (Mijn grootste AI-gebruik)

Waar ik het meest gebruik van heb gemaakt — en waar ik eerlijk over wil zijn — is het opstellen van de documentatie:

* **[`TOELICHTING.md`](TOELICHTING.md):** De inhoudelijke antwoorden (wat ging er mis, wat lossen we op, wat doen we bewust niet en welke vragen stellen we aan Dirk) komen rechtstreeks uit mijn eigen analyse en beslissingen tijdens het bouwen. De teksten zijn door AI gestructureerd en geformuleerd binnen het 1-A4 kader, waarna ik alles zelf heb nagelezen en goedgekeurd. (En nee, de em-dashes heb ik er niet allemaal eigenhandig uitgesloopt).
* **[`README.md`](README.md):** Het technische naslagwerk met projectcontext, setup-instructies, seed-accounts en commando's is gegenereerd door AI op basis van de uiteindelijke repository-status en door mij gecontroleerd.
* **[`PROJECT_ARCHITECTURE.md`](PROJECT_ARCHITECTURE.md):** Het uitgebreide architectuur- en specificatiedocument met de MoSCoW-prioritering is door AI gesynthetiseerd op basis van onze brainstormsessies en database-ontwerpen.

---

## 4. Samenvatting van de Werkwijze

| Onderdeel | Mijn inbreng | Rol van AI |
| :--- | :--- | :--- |
| **Productvisie & UX** | 100% zelf bedacht (cockpit, zero-trust, mobiele techniekersview) | Geen |
| **Domeinmodel & Schema** | Zelf ontworpen (ontkoppeling van klant, werf, hardware, bon) | Validatie van foreign keys |
| **Core Frontend Code** | Initiële routes, layouts, navigatie en datastromen zelf geschreven | Afgeleide componenten scaffolden volgens mijn patronen |
| **Planningslogica** | Probleemstelling en parameters gedefinieerd | Eerste opzet van het tijdslot-algoritme + multi-agent code review |
| **Datamigratie** | Datastructuren gemapt en output gecontroleerd | Schrijven van de transformatielus in `migrate-seed.ts` |
| **Documentatie** | Feitelijke keuzes en argumenten aangeleverd, alles nagelezen | Vormgeven, structureren en uitschrijven van Markdown |

Deze werkwijze stelde mij in staat om binnen de beperkte tijd van de opdracht een volledig werkend, getest en online gedeployd platform af te leveren met behoud van de volledige intellectuele regie over het eindproduct.
