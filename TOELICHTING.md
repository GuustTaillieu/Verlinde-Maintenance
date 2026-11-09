# Verlinde Beveiliging BV ; Toelichting & Architectuurkeuzes
**Opdracht Forward Deployed Engineer (FDE) | Maximum 1 pagina A4**

---

### 1. Wat liep er mis in het oude systeem (BuildDesk Pro)?
Dirk vatte zijn frustratie treffend samen: *"Ik weet nooit welk onderhoud eraan komt. Brand moet elk jaar, en ik ben bang dat we klanten vergeten. En als ik dan iets wil inplannen, ben ik er een eeuwigheid mee bezig."*

Een forensische analyse van de geëxporteerde bedrijfsdata (peildatum: 02/11/2026) legde de structurele oorzaken bloot:
* **De structurele ontkoppeling:** Installatiefiches (`MS_HDR`) en werkbonnen (`WO_HDR`) stonden los van elkaar. Het afronden van een werkbon werkte de installatiefiche nooit automatisch bij. Van de 193 fiches was het veld 'laatste onderhoud' in slechts 22 gevallen ingevuld.
* **46% van het klantenbestand achterstallig:** 89 van de 193 installaties bleken vervallen voor periodiek onderhoud.
* **Acuut juridisch brandveiligheidsrisico (NBN S21-100):** Meerdere brandcentrales waren wettelijk vervallen (>12 maanden). Dit stelt klanten bloot aan het vervallen van verzekeringsdekking en Verlinde aan zware aansprakelijkheid.
* **Vergeten klanten:** 73 vervallen installaties hadden zelfs geen enkele geplande werkbon in de toekomst.
* **Het maandfilter als blinde vlek:** De werkbonnenlijst filterde standaard enkel op de huidige maand, waardoor onafgewerkte bonnen uit eerdere maanden simpelweg van het scherm verdwenen.
* **Onhanteerbare planning:** Eén onderhoud inplannen vereiste een 10-stappen wizard vol overbodige invulvelden.

---

### 2. Wat hebben we gekozen om op te lossen (en waarom)?
In plaats van een 15 jaar oude desktop-ERP na te bouwen, hebben we de 80/20-hefboom gekozen die Dirk direct rust en operationele controle teruggeeft:

1. **Dynamische Onderhouds-engine:** Het systeem berekent de werkelijke vervaldatum dynamisch op basis van de volledige werkbonhistoriek (559 bonnen) en wettelijke intervallen. Dirk hoeft nooit meer manueel datums over te typen.
2. **Operations Cockpit (Dashboard):** Eén scherm toont direct de prioriteiten: acuut vervallen branddetectie (rood), vergeten klanten zonder werkbon (amber), en naderend onderhoud (30–60 dagen).
3. **Regionale Cluster-dispatching:** Installaties worden automatisch gegroepeerd per gemeente (Zwevegem, Kortrijk, Harelbeke, Waregem, Menen). Dirk kan met één klik meerdere klanten in dezelfde regio selecteren en gezamenlijk inplannen. Dit bespaart uren rij- en zoektijd.
4. **Geïntegreerde Voorstel- & Mailflow:** Vooraf opgestelde e-mailvoorstellen voor afspraken kunnen in batch worden nagekeken en verzonden, inclusief automatische capaciteitscheck van de techniekers.
5. **Mobiele Techniekersagenda (Zero-Trust):** Tom, Wout en Jens zien op hun smartphone enkel hun eigen dagplanning, routekoppeling, digitale checklist en handtekening van de klant. Gevoelige alarmcodes zijn afgeschermd en enkel zichtbaar voor de toegewezen technicus op de dag van uitvoering.

---

### 3. Wat hebben we bewust NIET gedaan (en waarom)?
* **Geen instellingen-overkill:** Bewust geen tijd verloren aan een zware beheerpagina (zoals dynamisch techniekers toevoegen of ingewikkelde werkschema's configureren). De focus lag 100% op de kernpijn van Dirk: inzicht en dispatching.
* **Geen versnipperde dispatching:** We hebben dispatching bewust enkel op het dashboard geplaatst en niet verspreid over de planningkalender. Dirk behoudt zo één centrale cockpit en hoeft niet tussen meerdere schermen te twijfelen waar hij moet plannen.
* **Geen "black-box" achtergrondautomatisering:** Geen volautomatische planning zonder Dirks goedkeuring. Dirk behoudt altijd de menselijke controle over elk klantvoorstel en tijdslot, zodat hij exact weet welke afspraken naar zijn klanten gaan.
* **Geen drag-and-drop kalender:** Geen storingsgevoelige versleep-functionaliteit in de weekplanning. Een duidelijke, noob-proof interface met vaste 2-uurs blokken voorkomt foutieve kliks of verspringingen op touchscreens en laptops.
* **Geen facturatie of magazijnbeheer (WMS):** Facturen verlopen al via BuildDesk naar de externe boekhouder. Een dubbele boekhouding bouwen lost Dirks planningsprobleem niet op.

---

### 4. Wat zouden we Dirk nog vragen voor de volgende iteratie?
1. **Communicatievoorkeur klanten:** Bellen klanten liever eerst op voor een datum, of volstaat een digitaal voorstel per mail met bevestigingsknop?
2. **Vaste onderhoudsperiodes:** Hebben grote industriële werven of scholen vaste sluitingsweken (bv. bouwverlof) waarin onderhoud verplicht moet plaatsvinden?
3. **Attestverwerking:** Moet het officiële NBN S21-100 keuringsattest meteen op de werf als PDF gegenereerd worden voor de klant, of volstaat nazending vanuit kantoor?

---

### 5. Testinloggegevens & Beveiliging
Om het testen van de verschillende rollen vlot te laten verlopen:
* **Zaakvoerder (Manager):** `dirk@verlinde-beveiliging.be`
* **Veldtechniekers:** `tom@verlinde-beveiliging.be`, `wout@verlinde-beveiliging.be`, `jens@verlinde-beveiliging.be`
* **Wachtwoord voor alle accounts:** `password123`

*Veiligheidsopmerking: Dit gedeelde testwachtwoord dient uitsluitend voor de evaluatie van dit assessment. In een echte productieomgeving worden inloggegevens uiteraard nooit statisch gedeeld, maar aangeleverd via een beveiligde eenmalige uitnodigingslink.*

---

### 6. Verantwoording AI-gebruik
* **Waarvoor gebruikt:** Als sparringpartner voor het analyseren van de verouderde CSV/JSON-datastructuren (`MS_HDR`, `WO_HDR`), het genereren van Drizzle-relatieschema's, het opzetten van boilerplate-componenten met Tailwind CSS/shadcn en het valideren van edge cases in datumconversies.
* **Zelf nagekeken en beslist:** De domeinmodellering (de ontkoppeling tussen Klant, Werf, Component en Werkbon), de validatie van de NBN S21-100 brandveiligheidsintervallen, de UX-keuzes voor Dirk (no-nonsense cockpit zonder versnippering), en het beveiligen van de Zero-Trust alarmcodes.
