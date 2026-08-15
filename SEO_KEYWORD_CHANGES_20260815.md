# SEO keyword updates - 2026-08-15

Analisi eseguita sul file `veterinario-kw-cercate.xlsx`.

## Obiettivo

Migliorare intercettazione e CTR sulle query Google SEO piu interessanti:

- pronto soccorso veterinario
- veterinario H24 / aperto ora
- veterinario vicino a me
- cliniche e ambulatori veterinari locali
- costo / prezzi / preventivi delle prestazioni veterinarie
- termini tecnici con spiegazione semplice

## Modifiche implementate

### Pagine Veterinari H24

File:

- `src/components/H24Page.astro`
- `src/components/react/VeterinariH24App.jsx`

Interventi:

- title SEO orientato a `Pronto soccorso veterinario H24`
- meta description con `veterinario aperto ora`, `clinica H24`, `urgenze animali`, telefono, mappa e indicazioni
- H1 aggiornato per includere il concetto di pronto soccorso veterinario
- CTA geolocalizzata riscritta come `Trova pronto soccorso veterinario vicino a me`
- copy delle sezioni popolari e vicine reso piu coerente con query H24/emergenza

### Pagine localita veterinari

File:

- `src/components/VeterinariCityPage.astro`
- `src/components/react/CercaVeterinariApp.jsx`

Interventi:

- title SEO: `Veterinari a {localita}: cliniche, ambulatori e mappa`
- description con `veterinari vicino a te`, `cliniche`, `ambulatori`, indirizzo, telefono, recensioni, orari e mappa
- H1 listing: `Veterinari, cliniche e ambulatori a {citta}`
- aggiunto blocco SEO testuale in fondo alla pagina citta con link contestuali a H24 e costo visita
- placeholder ricerca ampliato includendo `ambulatorio`

### Pagine Quanto Costa listing

File:

- `src/components/ClinicheByServicePage.astro`

Interventi:

- title SEO orientato a `prezzi e preventivi`
- description con costo medio, prezzi indicativi, disponibilita e richiesta preventivo
- H1 trasformato in `Quanto costa {prestazione} a {localita}`
- mantenuta la logica che evita aggiunte ridondanti tipo `animali domestici` quando la prestazione e gia specifica per cane/gatto

### Pagine Quanto Costa descrizione prestazione

File:

- `src/components/ServiceDescriptionPage.astro`

Interventi:

- title: `{Prestazione}: costo, prezzi e guida veterinaria`
- description con formula `Scopri quanto costa...`
- aggiunta spiegazione semplice per termini tecnici tramite `servicePlainLanguageExplanation`
- badge piu preciso tra `Prestazione veterinaria specifica` e `Prestazione veterinaria per animali domestici`

Esempio:

- `Ovarioisterectomia Gatta` viene spiegata come sterilizzazione chirurgica della gatta con rimozione di ovaie e utero.

## Verifiche eseguite

- `npm run build`: completato correttamente
- deploy produzione completato su `veterinari-org`
- PM2 `veterinari-org`: online
- pagine campione verificate con HTTP 200:
  - `/veterinari-h24`
  - `/veterinari-h24/mi/milano`
  - `/veterinari/mi/milano`
  - `/quanto-costa/milano-mi/ovarioisterectomia-gatta/cliniche`
  - `/quanto-costa/ovarioisterectomia-gatta`

## Follow-up consigliati

- creare landing specialistiche per cluster ad alto potenziale: animali esotici, oculista veterinario, dermatologo veterinario, comportamentalista
- rafforzare pagine dedicate a visita veterinaria, microchip, vaccini e veterinario a domicilio
- monitorare GSC per 14-21 giorni prima di estendere ulteriormente i template
