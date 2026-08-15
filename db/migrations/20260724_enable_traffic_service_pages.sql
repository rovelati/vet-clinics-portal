with service_updates(name, category, average_price, description, image_url, synonyms, html_content) as (
  values
  (
    'Visita fuori orario giorno feriale',
    'Visite',
    50::numeric,
    'Visita veterinaria richiesta fuori dagli orari ordinari in un giorno feriale, utile quando il problema non puo attendere la prima disponibilita standard.',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80',
    '["visita fuori orario", "veterinario fuori orario", "visita urgente feriale", "visita serale veterinario"]'::jsonb,
    $html$<h1>Visita Fuori Orario Giorno Feriale</h1>
<p>La <strong>visita fuori orario in giorno feriale</strong> serve quando il tuo animale ha bisogno di essere visto oltre gli orari ordinari della struttura, ma non sei necessariamente davanti a un pronto soccorso vero e proprio.</p>
<p>Prima di muoverti, chiama sempre la clinica: disponibilita, tempi e costi possono cambiare in base all orario, alla presenza del veterinario e alla gravita del caso.</p>
<h2>Quando puo servire</h2>
<p>Puo essere utile per sintomi comparsi nel tardo pomeriggio o in serata, come vomito ripetuto, diarrea, zoppia, dolore, ferite lievi, malessere improvviso o dubbi che non vuoi rimandare al giorno dopo.</p>
<h2>Cosa chiedere alla struttura</h2>
<ul><li>Se la visita e disponibile nell orario richiesto.</li><li>Se viene applicato un supplemento fuori orario.</li><li>Se servono esami, farmaci o osservazione.</li><li>Se il caso va indirizzato a pronto soccorso H24.</li></ul>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>50 euro</strong>, ma puo salire se la visita avviene in orari serali, se richiede urgenza, esami o terapie aggiuntive.</p>
<h2>Domande frequenti</h2>
<h3>E uguale a una visita H24?</h3>
<p>No. Una visita fuori orario puo essere gestita da una clinica disponibile oltre l orario normale; il pronto soccorso H24 e pensato per urgenze continuative e casi piu critici.</p>
<h3>Devo prenotare?</h3>
<p>Si, e meglio telefonare prima. La struttura puo confermare disponibilita, tempi di attesa e costo indicativo.</p>
<h3>Cosa devo portare?</h3>
<p>Porta libretto sanitario, farmaci assunti, eventuali referti e foto o video del sintomo se utile.</p>$html$
  ),
  (
    'Visita notturna (dalle 21 alle 7)',
    'Visite',
    80::numeric,
    'Visita veterinaria notturna per problemi che emergono durante la notte e richiedono una valutazione rapida.',
    'https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&w=1200&q=80',
    '["visita notturna", "veterinario notte", "veterinario aperto di notte", "urgenza veterinaria notturna"]'::jsonb,
    $html$<h1>Visita Notturna Veterinaria</h1>
<p>La <strong>visita notturna veterinaria</strong> e pensata per i casi che compaiono tra sera e mattina e che non possono essere valutati comodamente il giorno successivo.</p>
<p>Non tutte le strutture fanno visite notturne: per questo e importante chiamare prima, descrivere i sintomi e capire se serve una clinica H24 o un pronto soccorso.</p>
<h2>Quando chiamare subito</h2>
<p>Contatta rapidamente una struttura se noti difficolta respiratoria, dolore forte, trauma, convulsioni, sospetto avvelenamento, sanguinamento, addome gonfio, abbattimento grave o peggioramento improvviso.</p>
<h2>Come prepararsi</h2>
<p>Spiega specie, eta, peso, sintomi, da quanto tempo sono presenti e se l animale mangia, beve, urina e respira normalmente. Porta documenti sanitari e farmaci in uso.</p>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>80 euro</strong>. Esami, farmaci, ricovero o procedure urgenti possono essere conteggiati a parte.</p>
<h2>Domande frequenti</h2>
<h3>La visita notturna costa di piu?</h3>
<p>Spesso si, perche richiede disponibilita fuori orario. Chiedi sempre se ci sono supplementi notturni.</p>
<h3>Posso aspettare il mattino?</h3>
<p>Dipende dai sintomi. Se l animale respira male, ha dolore forte, trauma, collasso o sospetto avvelenamento, non aspettare.</p>
<h3>Meglio telefonare o andare direttamente?</h3>
<p>Telefonare prima aiuta la struttura a valutare priorita, disponibilita e percorso corretto.</p>$html$
  ),
  (
    'Esame colturale miceti',
    'Esami e diagnostica',
    40::numeric,
    'Esame utile per confermare o escludere infezioni fungine della cute e del pelo, frequenti in cane, gatto e animali conviventi.',
    'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80',
    '["coltura miceti", "esame funghi pelle", "dermatofiti", "micosi cane", "micosi gatto"]'::jsonb,
    $html$<h1>Esame Colturale Miceti</h1>
<p>L <strong>esame colturale per miceti</strong> aiuta il veterinario a capire se lesioni cutanee, perdita di pelo, croste o prurito sono legati a funghi dermatofiti.</p>
<p>E particolarmente utile quando in casa vivono piu animali o persone fragili, perche alcune micosi possono essere contagiose.</p>
<h2>Quando viene consigliato</h2>
<p>Il veterinario puo proporlo in caso di chiazze senza pelo, cute arrossata, lesioni circolari, prurito persistente, recidive o sospetto contagio tra animali.</p>
<h2>Come funziona</h2>
<p>Di solito si raccolgono peli o materiale cutaneo e si inviano o incubano per verificare la crescita fungina. Il risultato puo richiedere diversi giorni.</p>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>40 euro</strong>. Visita dermatologica, lampada di Wood, citologia o terapie possono avere costi separati.</p>
<h2>Domande frequenti</h2>
<h3>Il risultato e immediato?</h3>
<p>No, la coltura richiede tempo. Chiedi alla clinica quando aspettarti l esito.</p>
<h3>Serve tosare l animale?</h3>
<p>Non sempre. Decide il veterinario in base alla zona da campionare e alla qualita del materiale.</p>
<h3>La micosi puo passare all uomo?</h3>
<p>Alcune forme possono essere trasmissibili. Il veterinario ti dira quali precauzioni adottare in casa.</p>$html$
  ),
  (
    'Esame delle feci',
    'Esami e diagnostica',
    20::numeric,
    'Analisi delle feci per controllare parassiti intestinali, disturbi digestivi e cause frequenti di diarrea o dimagrimento.',
    'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?auto=format&fit=crop&w=1200&q=80',
    '["esame feci", "coprologico", "parassiti intestinali", "analisi feci cane", "analisi feci gatto"]'::jsonb,
    $html$<h1>Esame Delle Feci</h1>
<p>L <strong>esame delle feci</strong> e uno degli accertamenti piu semplici e utili per valutare parassiti intestinali, diarrea, dimagrimento, vomito o disturbi digestivi di cane, gatto e altri animali.</p>
<h2>Quando farlo</h2>
<p>Serve in caso di diarrea, feci molli, sangue o muco, perdita di peso, pancia gonfia, prurito anale, cuccioli appena arrivati, animali adottati o controlli periodici antiparassitari.</p>
<h2>Cosa portare</h2>
<p>Chiedi alla clinica come raccogliere il campione. In genere serve una piccola quantita di feci fresche in contenitore pulito, evitando terra, lettiera o contaminazioni.</p>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>20 euro</strong>. Test specifici come Giardia, esami multipli o invio a laboratorio possono costare di piu.</p>
<h2>Domande frequenti</h2>
<h3>Serve la visita insieme all esame?</h3>
<p>Dipende dal caso. Se ci sono sintomi importanti, il veterinario puo consigliare anche la visita clinica.</p>
<h3>Un solo campione basta?</h3>
<p>Non sempre. Per alcuni parassiti puo essere utile controllare campioni raccolti in giorni diversi.</p>
<h3>Posso portare feci prese dalla lettiera?</h3>
<p>Meglio chiedere prima: sabbia o lettiera possono rendere il campione meno leggibile.</p>$html$
  ),
  (
    'Visite a domicilio',
    'Visite',
    65::numeric,
    'Visita veterinaria svolta a casa, utile per animali anziani, fragili, difficili da trasportare o molto stressati dalla clinica.',
    'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=1200&q=80',
    '["veterinario a domicilio", "visita veterinaria a domicilio", "visita a casa", "veterinario casa"]'::jsonb,
    $html$<h1>Visite A Domicilio</h1>
<p>Le <strong>visite veterinarie a domicilio</strong> permettono di far valutare l animale nel suo ambiente, riducendo stress e difficolta di trasporto.</p>
<p>Sono utili per gatti molto timorosi, cani anziani, animali con difficolta motorie, controlli di routine, terapie semplici e situazioni in cui lo spostamento sarebbe complicato.</p>
<h2>Cosa si puo fare a casa</h2>
<p>Di solito si possono fare visita clinica, controllo generale, alcune terapie, medicazioni semplici, valutazioni comportamentali, consulenze e follow-up. Esami strumentali, chirurgia e urgenze gravi richiedono spesso la clinica.</p>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>65 euro</strong>. Il costo puo variare per distanza, orario, durata, farmaci, urgenza o prestazioni aggiuntive.</p>
<h2>Come preparare la visita</h2>
<p>Tieni l animale in una stanza tranquilla, prepara libretto sanitario, farmaci, referti e una descrizione chiara dei sintomi. Per il gatto evita di nasconderlo poco prima dell arrivo del veterinario.</p>
<h2>Domande frequenti</h2>
<h3>La visita a domicilio sostituisce sempre la clinica?</h3>
<p>No. E comoda per molti controlli, ma se servono diagnostica, monitoraggio o urgenza il veterinario puo indirizzarti in struttura.</p>
<h3>Il prezzo dipende dalla distanza?</h3>
<p>Spesso si. Chiedi sempre se il diritto di chiamata o il tragitto sono inclusi.</p>
<h3>Si puo fare anche per un gatto pauroso?</h3>
<p>Si, e uno dei casi piu frequenti. Avvisa il veterinario del carattere del gatto prima della visita.</p>$html$
  ),
  (
    'Visita a domicilio',
    'Visite',
    65::numeric,
    'Visita veterinaria svolta a casa, utile per animali anziani, fragili, difficili da trasportare o molto stressati dalla clinica.',
    'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=1200&q=80',
    '["veterinario a domicilio", "visita veterinaria a domicilio", "visita a casa", "veterinario casa"]'::jsonb,
    $html$<h1>Visita A Domicilio</h1>
<p>La <strong>visita veterinaria a domicilio</strong> e una visita svolta direttamente a casa, indicata quando portare l animale in clinica e difficile o molto stressante.</p>
<p>Il veterinario valuta il quadro generale e decide se il problema puo essere gestito a domicilio o se conviene andare in struttura per esami, terapie o monitoraggio.</p>
<h2>Quando sceglierla</h2>
<p>E utile per animali anziani, gatti molto paurosi, controlli programmati, terapie semplici, difficolta motorie o consulenze pratiche su gestione quotidiana, alimentazione e ambiente domestico.</p>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>65 euro</strong>. Verifica sempre se sono inclusi trasferta, farmaci, urgenza e orario fuori fascia ordinaria.</p>
<h2>Domande frequenti</h2>
<h3>Serve preparare qualcosa?</h3>
<p>Si: libretto sanitario, farmaci, referti e una stanza tranquilla dove visitare l animale.</p>
<h3>Si puo fare un vaccino a domicilio?</h3>
<p>Dipende dalla struttura e dallo stato di salute dell animale. Chiedi conferma prima della visita.</p>
<h3>Quando non basta il domicilio?</h3>
<p>Quando servono radiografie, ecografie, chirurgia, ossigeno, ricovero o gestione di urgenze gravi.</p>$html$
  ),
  (
    'Anagrafe canina',
    'Identificazione',
    35::numeric,
    'Pratiche legate a microchip, registrazione e aggiornamento dei dati anagrafici del cane.',
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=1200&q=80',
    '["anagrafe canina", "registrazione cane", "microchip cane", "passaggio proprieta cane"]'::jsonb,
    $html$<h1>Anagrafe Canina</h1>
<p>L <strong>anagrafe canina</strong> raccoglie i dati identificativi del cane e del proprietario. E collegata al microchip e serve per rendere l animale riconoscibile in caso di smarrimento, cambio proprieta o controlli.</p>
<h2>Quando serve</h2>
<p>Serve per iscrizione del cane, aggiornamento dati, cambio proprietario, variazione indirizzo, verifica microchip o regolarizzazione di un animale adottato.</p>
<h2>Cosa portare</h2>
<p>Porta documento, codice fiscale, libretto sanitario, eventuale certificato di microchip, documenti di adozione o passaggio di proprieta. Le regole possono variare per regione.</p>
<h2>Prezzo indicativo</h2>
<p>Il costo puo variare in base a pratica, regione e prestazioni collegate. Come riferimento operativo considera circa <strong>35 euro</strong> quando la pratica e associata a controllo o gestione documentale.</p>
<h2>Domande frequenti</h2>
<h3>E obbligatoria?</h3>
<p>Per i cani il microchip e la registrazione in anagrafe sono obbligatori secondo le regole regionali.</p>
<h3>Il veterinario puo aggiornare i dati?</h3>
<p>Molte strutture possono aiutarti o indicarti la procedura corretta, ma dipende dall abilitazione e dalla regione.</p>
<h3>Serve il codice fiscale?</h3>
<p>Si, di solito serve per collegare correttamente il proprietario alla pratica.</p>$html$
  ),
  (
    'Pronto soccorso per animali',
    'Ricovero',
    90::numeric,
    'Servizio per urgenze veterinarie, traumi, malori improvvisi e situazioni che richiedono valutazione rapida.',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    '["pronto soccorso veterinario", "urgenza veterinaria", "clinica h24", "emergenza animale", "veterinario aperto ora"]'::jsonb,
    $html$<h1>Pronto Soccorso Per Animali</h1>
<p>Il <strong>pronto soccorso per animali</strong> e il riferimento quando cane, gatto o altro animale hanno un problema improvviso che puo peggiorare rapidamente.</p>
<h2>Quando e urgente</h2>
<p>Cerca assistenza immediata per difficolta respiratoria, trauma, investimento, avvelenamento sospetto, convulsioni, collasso, sanguinamento importante, dolore intenso, parto complicato, addome gonfio o peggioramento rapido.</p>
<h2>Cosa dire al telefono</h2>
<p>Comunica specie, eta, peso, sintomi, orario di inizio, farmaci assunti, eventuale sostanza ingerita e tempo stimato di arrivo. Questo aiuta la struttura a prepararsi.</p>
<h2>Prezzo indicativo</h2>
<p>Il costo di accesso puo partire da circa <strong>90 euro</strong>, ma esami, farmaci, chirurgia, ricovero o assistenza notturna possono incidere molto.</p>
<h2>Domande frequenti</h2>
<h3>Devo chiamare prima?</h3>
<p>Si, se possibile. In emergenza aiuta la clinica a darti indicazioni immediate e preparare l accoglienza.</p>
<h3>Pronto soccorso significa sempre H24?</h3>
<p>Non sempre. Verifica orari e disponibilita, soprattutto di notte e nei festivi.</p>
<h3>Cosa porto con me?</h3>
<p>Libretto sanitario, farmaci, referti, eventuale confezione della sostanza ingerita e documenti del proprietario.</p>$html$
  ),
  (
    'Visite comportamentali per animali',
    'Visite',
    90::numeric,
    'Valutazione veterinaria o specialistica per problemi di comportamento, stress, paura, aggressivita o convivenza.',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80',
    '["visita comportamentale", "veterinario comportamentalista", "problemi comportamento cane", "problemi comportamento gatto"]'::jsonb,
    $html$<h1>Visite Comportamentali Per Animali</h1>
<p>Le <strong>visite comportamentali</strong> aiutano a capire e gestire comportamenti problematici o cambiamenti emotivi di cani, gatti e altri animali.</p>
<h2>Quando richiederla</h2>
<p>Puo servire per ansia da separazione, aggressivita, paura, eliminazioni inappropriate, vocalizzazioni, distruttivita, stress, convivenza difficile o cambiamenti dopo traslochi e adozioni.</p>
<h2>Cosa valuta il professionista</h2>
<p>Si raccolgono storia clinica, routine, ambiente, relazione con persone e animali, eventi scatenanti e video dei comportamenti. A volte servono esami per escludere cause fisiche.</p>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>90 euro</strong>, ma puo variare per durata, specializzazione, visita a domicilio e piano di follow-up.</p>
<h2>Domande frequenti</h2>
<h3>Serve un veterinario comportamentalista?</h3>
<p>Per casi complessi si, soprattutto quando possono servire diagnosi medica, farmaci o un piano terapeutico integrato.</p>
<h3>Devo portare video?</h3>
<p>Si, video brevi e sicuri aiutano molto, senza provocare apposta situazioni stressanti.</p>
<h3>Il problema si risolve in una visita?</h3>
<p>A volte basta un primo piano, ma molti casi richiedono tempo, modifiche ambientali e controlli.</p>$html$
  ),
  (
    'Day hospital',
    'Ricovero',
    70::numeric,
    'Permanenza giornaliera in struttura per osservazione, terapie, esami o controlli senza ricovero notturno.',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    '["day hospital veterinario", "ricovero giornaliero", "osservazione giornaliera", "terapia in giornata"]'::jsonb,
    $html$<h1>Day Hospital Veterinario</h1>
<p>Il <strong>day hospital veterinario</strong> e una permanenza in clinica durante la giornata per esami, terapie, monitoraggio o osservazione, senza ricovero notturno.</p>
<p>Non va confuso con il ricovero ordinario: il day hospital di solito ha obiettivi definiti e dimissione nella stessa giornata, salvo peggioramenti.</p>
<h2>Quando viene usato</h2>
<p>Puo essere indicato per terapie endovenose, controlli dopo procedure, monitoraggio di animali fragili, esami programmati, recupero da sedazione o osservazione dopo sintomi non stabilizzati.</p>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>70 euro</strong>, esclusi eventuali farmaci, esami, procedure, fluidoterapia o materiale sanitario.</p>
<h2>Domande frequenti</h2>
<h3>E uguale al ricovero?</h3>
<p>No. Il day hospital e giornaliero; il ricovero prevede permanenza piu lunga o notturna e monitoraggio continuativo.</p>
<h3>Posso lasciare cibo o coperta?</h3>
<p>Chiedi alla struttura. Per alcuni animali una coperta familiare puo aiutare, ma dipende dal motivo del day hospital.</p>
<h3>Mi aggiornano durante la giornata?</h3>
<p>Di solito la clinica concorda orari e modalita di aggiornamento o dimissione.</p>$html$
  ),
  (
    'Gastroenterologia',
    'Visite',
    100::numeric,
    'Valutazione veterinaria per vomito, diarrea, dimagrimento, problemi digestivi e patologie gastrointestinali.',
    'https://images.unsplash.com/photo-1604881991720-f91add269bed?auto=format&fit=crop&w=1200&q=80',
    '["gastroenterologia veterinaria", "visita gastroenterologica", "vomito cane", "diarrea gatto", "problemi intestinali"]'::jsonb,
    $html$<h1>Gastroenterologia Veterinaria</h1>
<p>La <strong>gastroenterologia veterinaria</strong> si occupa di stomaco, intestino, fegato, pancreas e disturbi digestivi di cane, gatto e altri animali.</p>
<h2>Quando prenotarla</h2>
<p>E indicata per vomito ricorrente, diarrea persistente, dimagrimento, sangue nelle feci, inappetenza, dolore addominale, flatulenza, sospette intolleranze, problemi pancreatici o malattie croniche intestinali.</p>
<h2>Cosa puo includere</h2>
<p>La visita puo portare a esami del sangue, esame feci, ecografia addominale, test specifici, dieta di eliminazione, endoscopia o terapie mirate.</p>
<h2>Prezzo indicativo</h2>
<p>Una valutazione gastroenterologica puo partire da circa <strong>100 euro</strong>. Esami e procedure diagnostiche sono normalmente separati.</p>
<h2>Domande frequenti</h2>
<h3>Devo portare un campione di feci?</h3>
<p>Spesso e utile, ma chiedi prima alla clinica come raccoglierlo e conservarlo.</p>
<h3>Serve il digiuno?</h3>
<p>Dipende dagli esami previsti. Non mettere a digiuno animali fragili senza indicazione veterinaria.</p>
<h3>La dieta puo bastare?</h3>
<p>A volte si, ma vomito, diarrea cronica o dimagrimento richiedono una valutazione accurata.</p>$html$
  ),
  (
    'Vaccinazione gatto rcp+felv',
    'Vaccinazioni',
    72.5::numeric,
    'Vaccinazione per gatto che associa copertura RCP e FeLV quando indicata dal veterinario in base a stile di vita e rischio.',
    'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1200&q=80',
    '["vaccino gatto rcp felv", "vaccinazione gatto rcpfelv", "vaccino leucemia felina", "vaccino trivalente gatto"]'::jsonb,
    $html$<h1>Vaccinazione Gatto RCP FeLV</h1>
<p>La <strong>vaccinazione gatto RCP FeLV</strong> combina la protezione di base per alcune malattie feline con la vaccinazione contro la leucemia felina, quando consigliata.</p>
<h2>Quando e indicata</h2>
<p>Il veterinario valuta eta, stato di salute, test FeLV/FIV, vita in casa o all esterno, convivenza con altri gatti e rischio di esposizione.</p>
<h2>Cosa chiedere</h2>
<p>Chiedi se serve test preliminare, richiamo, libretto aggiornato e quali componenti sono comprese nel prezzo pubblicato.</p>
<p>Se il gatto vive anche all esterno, entra in contatto con altri gatti o proviene da una storia sanitaria poco chiara, segnala tutto alla clinica: sono informazioni decisive per scegliere il protocollo corretto.</p>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>73 euro</strong>. Visita, test o certificazioni possono essere conteggiati a parte.</p>
<h2>Domande frequenti</h2>
<h3>Tutti i gatti devono fare FeLV?</h3>
<p>No, dipende dal rischio. Il veterinario decide in base a stile di vita e contatti con altri gatti.</p>
<h3>Serve il test prima del vaccino?</h3>
<p>Spesso e consigliato, soprattutto prima della vaccinazione FeLV o in gatti con storia sanitaria incerta.</p>
<h3>Il richiamo e annuale?</h3>
<p>La frequenza dipende da eta, rischio e protocollo scelto dalla struttura.</p>$html$
  ),
  (
    'Test filariosi (macro+micro-filarie)',
    'Esami e diagnostica',
    50::numeric,
    'Test per valutare la presenza di filariosi, utile prima della prevenzione o in animali esposti a zone a rischio.',
    'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=1200&q=80',
    '["test filariosi", "test filaria cane", "macro micro filarie", "prevenzione filaria"]'::jsonb,
    $html$<h1>Test Filariosi Macro E Micro Filarie</h1>
<p>Il <strong>test filariosi</strong> aiuta a valutare se il cane e stato esposto alla filaria e se puo iniziare o proseguire una prevenzione in modo corretto.</p>
<h2>Quando farlo</h2>
<p>E utile prima di iniziare profilassi, se la prevenzione e stata saltata, dopo viaggi o permanenza in zone a rischio, oppure quando il veterinario sospetta esposizione.</p>
<h2>Come funziona</h2>
<p>Di norma si effettua con un prelievo di sangue. In base al caso il veterinario puo consigliare test antigenico, ricerca microfilarie o altri controlli.</p>
<h2>Prezzo indicativo</h2>
<p>Il prezzo medio indicativo e circa <strong>50 euro</strong>. Visita, esami aggiuntivi e profilassi non sempre sono inclusi.</p>
<h2>Domande frequenti</h2>
<h3>Serve anche se faccio prevenzione?</h3>
<p>Si, in alcuni casi il veterinario puo richiederlo prima o durante la profilassi, soprattutto se ci sono interruzioni.</p>
<h3>Vale solo per il cane?</h3>
<p>La filariosi riguarda soprattutto il cane, ma il veterinario puo valutare rischi anche per altri animali in contesti specifici.</p>
<h3>Posso iniziare il farmaco senza test?</h3>
<p>Non farlo senza indicazione veterinaria: il test serve a usare la prevenzione in modo piu sicuro.</p>$html$
  )
)
update public.services_taxonomy st
set
  category = service_updates.category,
  allow_price = true,
  average_price = service_updates.average_price,
  description = service_updates.description,
  image_url = service_updates.image_url,
  synonyms = service_updates.synonyms,
  html_content = service_updates.html_content
from service_updates
where lower(st.name) = lower(service_updates.name);
