export const integratoriCategories = [
  { id: 'tutti', name: 'Tutti' },
  { id: 'articolazioni', name: 'Articolazioni' },
  { id: 'digestione', name: 'Digestione' },
  { id: 'immunita', name: 'Immunita' },
  { id: 'pelo', name: 'Pelo e Pelle' },
] as const;

export const integratoriCards = [
  {
    id: 1,
    slug: 'omega-3-per-cani',
    name: 'Omega-3 per Cani',
    category: 'pelo',
    description:
      "Gli acidi grassi Omega-3, derivati dall'olio di pesce, sono essenziali per mantenere pelo lucido, pelle sana e svolgono un'azione anti-infiammatoria naturale.",
    benefits: ['Pelo lucido', 'Pelle sana', 'Anti-infiammatorio'],
    icon: '🐟',
  },
  {
    id: 2,
    slug: 'glucosamina-plus',
    name: 'Glucosamina Plus',
    category: 'articolazioni',
    description:
      "Integratore a base di glucosamina e condroitina, indicato per supportare la mobilita articolare e ridurre i dolori legati all'eta o all'attivita fisica intensa.",
    benefits: ['Mobilita articolare', 'Riduce dolore', 'Rinforza cartilagini'],
    icon: '🦴',
  },
  {
    id: 3,
    slug: 'probiotici-digestivi',
    name: 'Probiotici Digestivi',
    category: 'digestione',
    description:
      "I probiotici aiutano a ristabilire l'equilibrio della flora intestinale, migliorando la digestione e riducendo disturbi gastrointestinali comuni.",
    benefits: ['Digestione migliore', 'Flora intestinale', 'Meno disturbi'],
    icon: '🦠',
  },
  {
    id: 4,
    slug: 'immunita-forte',
    name: 'Immunita Forte',
    category: 'immunita',
    description:
      "Formulazione a base di vitamine, minerali e antiossidanti studiata per rafforzare le difese immunitarie e aumentare l'energia del tuo animale.",
    benefits: ['Sistema immunitario', 'Antiossidanti', 'Energia'],
    icon: '🛡️',
  },
  {
    id: 5,
    slug: 'multivitaminico-completo',
    name: 'Multivitaminico Completo',
    category: 'tutti',
    description:
      "Un multivitaminico completo fornisce tutti i nutrienti essenziali per supportare la salute generale, l'energia quotidiana e il benessere a lungo termine.",
    benefits: ['Salute generale', 'Energia', 'Benessere'],
    icon: '💊',
  },
  {
    id: 6,
    slug: 'calming-support',
    name: 'Calming Support',
    category: 'tutti',
    description:
      'Integratore calmante a base di ingredienti naturali come valeriana e camomilla, utile per ridurre ansia, stress da separazione e favorire il riposo.',
    benefits: ['Riduce ansia', 'Calma naturale', 'Migliora sonno'],
    icon: '😌',
  },
] as const;

export const integratoriDetails = {
  'omega-3-per-cani': {
    name: 'Omega-3 per Cani: Guida Completa',
    intro:
      'Tutto quello che devi sapere sugli acidi grassi Omega-3 per la salute del pelo e della pelle del tuo cane.',
    icon: '🐟',
    description: [
      'Gli acidi grassi Omega-3 sono fondamentali per la salute generale del cane, ma sono particolarmente noti per i loro benefici sulla pelle e sul pelo. Un apporto corretto puo trasformare un pelo opaco e fragile in un manto lucido e forte, riducendo al contempo problemi cutanei come secchezza e prurito.',
      "L'olio di pesce e la fonte piu comune di Omega-3 per cani. I due principali acidi grassi, EPA (acido eicosapentaenoico) e DHA (acido docosaesaenoico), supportano anche la salute cardiovascolare, la funzione cerebrale e hanno proprieta anti-infiammatorie naturali.",
      'E importante scegliere un prodotto purificato, privo di metalli pesanti e tossine. La dose varia in base al peso del cane: consulta il tuo veterinario per determinare il dosaggio piu adatto.',
    ],
    features: [
      'Migliora la lucentezza e la salute del pelo',
      'Riduce secchezza e prurito cutaneo',
      'Proprieta anti-infiammatorie naturali',
      'Supporta la salute cardiovascolare',
      'Favorisce lo sviluppo cerebrale nei cuccioli',
    ],
    whenToUse:
      "L'Omega-3 e indicato per cani con pelo opaco, problemi cutanei, allergie, infiammazioni articolari, o come integrazione generale per il benessere.",
  },
  'glucosamina-plus': {
    name: 'Glucosamina per Cani: Supporto Articolare',
    intro:
      "Come la glucosamina puo aiutare a mantenere le articolazioni del tuo cane sane e ridurre i dolori legati all'eta o all'attivita fisica.",
    icon: '🦴',
    description: [
      "Con l'avanzare dell'eta o in caso di intensa attivita fisica, le articolazioni del cane possono subire usura. La glucosamina e un amino-zucchero naturalmente presente nel corpo che contribuisce a costruire e riparare la cartilagine articolare.",
      "Spesso viene combinata con condroitina solfato e MSM (metilsulfonilmetano) per un effetto sinergico: la condroitina aiuta la cartilagine a trattenere acqua e nutrienti, mentre l'MSM fornisce zolfo organico utile per la salute dei tessuti connettivi.",
      "L'integrazione e particolarmente consigliata per razze predisposte a displasia dell'anca (Pastore Tedesco, Labrador, Golden Retriever), cani anziani con rigidita articolare e cani sportivi o da lavoro.",
    ],
    features: [
      'Nutre e ripara la cartilagine articolare',
      'Migliora la mobilita e riduce la rigidita',
      'Riduce dolore e infiammazione articolare',
      'Ideale per cani anziani e razze predisposte',
      'Azione preventiva per cani giovani e attivi',
    ],
    whenToUse:
      'Consigliata per cani con problemi articolari, displasia, artrosi, dopo interventi ortopedici o come prevenzione in razze a rischio.',
  },
  'probiotici-digestivi': {
    name: 'Probiotici per Cani e Gatti: Salute Intestinale',
    intro:
      "Come i probiotici aiutano a ristabilire l'equilibrio della flora intestinale e migliorare la digestione del tuo animale.",
    icon: '🦠',
    description: [
      "Il microbioma intestinale degli animali domestici svolge un ruolo fondamentale nella digestione, nell'assorbimento dei nutrienti e nel funzionamento del sistema immunitario. I probiotici sono microrganismi vivi che, assunti in quantita adeguate, conferiscono benefici alla salute dell'ospite.",
      "I ceppi piu utilizzati per cani e gatti includono Lactobacillus acidophilus, Bifidobacterium animalis e Enterococcus faecium. Questi batteri benefici aiutano a mantenere l'equilibrio della flora intestinale, specialmente dopo terapie antibiotiche, cambi di alimentazione o periodi di stress.",
      "I prebiotici (come FOS e inulina), spesso inclusi nelle formulazioni, fungono da nutrimento per i batteri buoni, potenziando l'effetto dei probiotici.",
    ],
    features: [
      "Ristabiliscono l'equilibrio della flora intestinale",
      'Migliorano digestione e assorbimento nutrienti',
      'Rafforzano il sistema immunitario',
      'Utili dopo terapie antibiotiche',
      'Riducono gas, gonfiore e diarrea',
    ],
    whenToUse:
      'Utili in caso di diarrea, flatulenza, dopo antibiotici, cambi di dieta, stress, viaggi, o come supporto generale alla digestione.',
  },
  'immunita-forte': {
    name: 'Integratori per il Sistema Immunitario degli Animali',
    intro:
      'Vitamine, minerali e antiossidanti per rafforzare le difese naturali del tuo animale domestico.',
    icon: '🛡️',
    description: [
      "Un sistema immunitario forte e la prima linea di difesa contro malattie e infezioni. Per gli animali domestici, un'alimentazione equilibrata e la base, ma in alcuni casi l'integrazione puo fare la differenza, soprattutto in periodi di stress, convalescenza o cambi stagionali.",
      "Le vitamine C ed E sono potenti antiossidanti che proteggono le cellule dai danni dei radicali liberi. Lo zinco e il selenio supportano la risposta immunitaria cellulare. I beta-glucani, estratti da funghi medicinali come il Reishi, stimolano l'attivita dei macrofagi e delle cellule natural killer.",
      "Alcuni integratori includono anche echinacea e astragalo, erbe tradizionalmente utilizzate per potenziare le difese naturali. E importante non sovradosare: un eccesso di alcune vitamine puo essere controproducente.",
    ],
    features: [
      'Antiossidanti contro i radicali liberi',
      'Vitamine C, E, zinco e selenio',
      'Supportano la risposta immunitaria',
      'Utili in convalescenza e cambi stagionali',
      'Beta-glucani per stimolazione immunitaria',
    ],
    whenToUse:
      'Indicati per animali in convalescenza, anziani, immunodepressi, in periodi di stress o come supporto stagionale (autunno/inverno).',
  },
  'multivitaminico-completo': {
    name: 'Multivitaminici per Cani e Gatti: Guida Completa',
    intro:
      'Tutto quello che devi sapere sui multivitaminici per garantire il benessere generale del tuo animale domestico.',
    icon: '💊',
    description: [
      "Un multivitaminico completo per animali domestici contiene un mix bilanciato di vitamine (A, B, C, D, E, K), minerali (calcio, ferro, zinco, magnesio) e talvolta acidi grassi essenziali. L'obiettivo e colmare eventuali carenze nutrizionali nella dieta quotidiana.",
      "Non tutti gli animali necessitano di un multivitaminico: chi segue una dieta commerciale di qualita premium generalmente riceve gia tutti i nutrienti necessari. Tuttavia, l'integrazione puo essere utile per animali alimentati con dieta casalinga, in crescita, anziani o con esigenze nutrizionali particolari.",
      'Attenzione al sovradosaggio, specialmente con vitamine liposolubili (A, D, E, K) che si accumulano nel corpo. La vitamina D in eccesso, ad esempio, puo causare calcificazione dei tessuti molli. Segui sempre le indicazioni del veterinario.',
    ],
    features: [
      'Mix bilanciato di vitamine e minerali',
      'Supporta energia e vitalita quotidiana',
      'Colma carenze da dieta casalinga',
      'Indicato per cuccioli in crescita e anziani',
      'Mantiene pelle, pelo, ossa e denti sani',
    ],
    whenToUse:
      'Consigliato per animali con dieta casalinga, cuccioli, anziani, in gravidanza/allattamento, o quando consigliato dal veterinario.',
  },
  'calming-support': {
    name: 'Integratori Calmanti per Animali Ansiosi',
    intro:
      'Soluzioni naturali per aiutare il tuo animale a gestire ansia, stress da separazione e paura dei rumori forti.',
    icon: '😌',
    description: [
      "L'ansia negli animali domestici e piu comune di quanto si pensi: ansia da separazione, paura dei temporali o dei fuochi d'artificio, stress da viaggio. Gli integratori calmanti a base di ingredienti naturali possono aiutare a gestire queste situazioni senza ricorrere a farmaci.",
      "Tra i principi attivi piu efficaci troviamo la L-teanina (aminoacido presente nel te verde che promuove il rilassamento senza sedazione), la valeriana (con proprieta ansiolitiche dimostrate), la camomilla e il triptofano (precursore della serotonina). Alcuni prodotti contengono anche caseinato di alfa-S1, un peptide derivato dal latte con effetto calmante.",
      "E importante iniziare la somministrazione almeno 30-60 minuti prima dell'evento stressante per i prodotti a effetto rapido, o mantenere un'assunzione costante per l'ansia cronica. Gli integratori calmanti non sostituiscono un programma comportamentale: per problemi severi, consulta un veterinario comportamentalista.",
    ],
    features: [
      'Ingredienti naturali: valeriana, camomilla, L-teanina',
      'Riduce ansia e stress senza sedazione',
      'Utile per paura di rumori e temporali',
      "Aiuta con l'ansia da separazione",
      'Favorisce un sonno tranquillo',
    ],
    whenToUse:
      "Indicato per ansia da separazione, paura di temporali/fuochi d'artificio, stress da viaggio, visite veterinarie, traslochi o cambi di routine.",
  },
} as const;

export type IntegratoreSlug = keyof typeof integratoriDetails;

export function getIntegratoreDetail(slug: string | undefined) {
  if (!slug) return null;
  return integratoriDetails[slug as IntegratoreSlug] ?? null;
}

export function getIntegratoreSlugs() {
  return Object.keys(integratoriDetails);
}
