update public.services_taxonomy
set
  allow_price = true,
  average_price = coalesce(average_price, 40),
  description = 'Visita veterinaria di base per controllare lo stato di salute dell animale, valutare sintomi non urgenti, ricevere indicazioni pratiche e capire se servono esami o terapie.',
  synonyms = '["visita veterinaria", "visita base", "visita ambulatoriale", "visita clinica", "prima visita", "controllo veterinario", "check up base"]'::jsonb,
  html_content = $html$
<h1>Visita Semplice Veterinaria</h1>
<p>La <strong>visita semplice veterinaria</strong> e il controllo di base che si prenota quando vuoi capire se il tuo animale sta bene, quando noti un sintomo non urgente o quando hai bisogno di un parere prima di decidere esami, terapie o controlli piu specifici.</p>
<p>E spesso il primo contatto con il veterinario: il professionista ascolta quello che hai osservato a casa, visita l animale, controlla i parametri principali e ti spiega quali passi fare dopo. Non e una visita di pronto soccorso, ma e molto utile per intercettare problemi all inizio e ricevere indicazioni concrete.</p>

<h2>Quando serve una visita semplice</h2>
<p>La visita semplice e indicata quando il cane, il gatto o un altro animale mostra segnali da controllare ma non appare in pericolo immediato. Puo servire per inappetenza lieve, vomito o diarrea occasionali, prurito, zoppia leggera, starnuti, tosse, perdita di pelo, piccoli noduli, alito cattivo, dimagrimento, cambio di comportamento o controllo dopo una terapia.</p>
<p>E utile anche se l animale sembra stare bene ma vuoi fare un controllo periodico, soprattutto prima di vaccini, viaggi, sterilizzazione, cambio alimentazione, inserimento di un nuovo animale in casa o inizio di una terapia antiparassitaria.</p>

<h2>Cosa comprende di solito</h2>
<p>Di norma comprende anamnesi, osservazione generale dell animale, controllo di peso, cute, mantello, occhi, orecchie, bocca, denti, mucose, linfonodi, addome, cuore e respirazione. Se necessario il veterinario puo misurare la temperatura, valutare idratazione, dolore, andatura e stato nutrizionale.</p>
<p>La visita semplice non include automaticamente analisi del sangue, radiografie, ecografie, test specifici, farmaci o medicazioni complesse. Se durante il controllo emerge un dubbio, il veterinario puo proporti un approfondimento e spiegarti costo, utilita e priorita.</p>

<h2>Cosa portare alla visita</h2>
<p>Porta tutto quello che puo aiutare il veterinario a capire meglio il caso. Se hai una scheda digitale del tuo animale, libretto sanitario o documenti precedenti, tienili pronti.</p>
<ul>
  <li><strong>Libretto sanitario</strong> con vaccini, microchip, richiami e trattamenti antiparassitari.</li>
  <li><strong>Farmaci o integratori</strong> che l animale assume, con nome e dosaggio.</li>
  <li><strong>Esami precedenti</strong>, referti, radiografie, ecografie o prescrizioni recenti.</li>
  <li><strong>Foto o video dei sintomi</strong>, utili se il problema non si vede durante la visita.</li>
  <li><strong>Alimentazione abituale</strong>: marca, quantita, snack, cambi recenti e appetito.</li>
  <li><strong>Domande gia scritte</strong>, cosi non dimentichi nulla durante il consulto.</li>
</ul>

<h2>Se porti un cane</h2>
<p>Per il cane porta guinzaglio, eventuale museruola se richiesta o se il cane e molto agitato, sacchetti igienici e qualche premio se aiuta a tranquillizzarlo. Segnala se tira, e pauroso, reattivo con altri cani o ha dolore quando viene toccato.</p>
<p>Se il motivo della visita riguarda feci, vomito, zoppia o tosse, puo essere utile portare un video o, quando richiesto dalla clinica, un campione fresco di feci in contenitore pulito.</p>

<h2>Se porti un gatto</h2>
<p>Per il gatto usa un trasportino sicuro, preferibilmente rigido e apribile dall alto. Inserisci una copertina con odore familiare e, se il gatto e molto stressato, chiedi prima alla struttura come prepararlo al meglio.</p>
<p>Per i gatti sono molto importanti informazioni su appetito, sete, uso della lettiera, minzione, vomito, peso e comportamento in casa. Anche piccoli cambiamenti possono essere indicativi.</p>

<h2>Cuccioli, anziani e animali fragili</h2>
<p>Per cuccioli e gattini la visita semplice serve spesso a controllare crescita, vaccinazioni, parassiti, alimentazione, dentizione e comportamento. Per animali anziani o con patologie note, il controllo puo aiutare a monitorare peso, dolore, mobilita, cuore, reni, appetito e qualita della vita.</p>
<p>Se l animale e cardiopatico, diabetico, epilettico, nefropatico o in terapia cronica, porta sempre l elenco aggiornato dei farmaci e segnala eventuali cambiamenti recenti.</p>

<h2>Quanto costa</h2>
<p>Su Veterinari.org il <strong>prezzo base indicativo</strong> per una visita semplice veterinaria e circa <strong>40 euro</strong>. Il costo puo cambiare in base a citta, struttura, orario, specie animale, durata della visita e complessita del caso.</p>
<p>Chiedi sempre cosa e compreso: una visita base puo non includere esami, farmaci, medicazioni, certificati, test rapidi, urgenze, visite fuori orario o prestazioni specialistiche.</p>

<h2>Visita semplice e urgenza: differenza</h2>
<p>La visita semplice non va confusa con una visita urgente, notturna, festiva o H24. Se l animale ha difficolta respiratoria, trauma, avvelenamento sospetto, convulsioni, perdita di coscienza, gonfiore improvviso dell addome, sanguinamento importante, abbattimento grave o dolore intenso, cerca subito una struttura aperta o un pronto soccorso veterinario.</p>

<h2>Come prepararti prima di chiamare</h2>
<p>Quando contatti la clinica, spiega specie, eta, sintomi principali, da quando sono iniziati e se l animale mangia, beve, urina e defeca normalmente. Se chiedi un prezzo, specifica che si tratta di una visita semplice e chiedi se il costo cambia per cane, gatto, cucciolo, animale anziano o visita fuori orario.</p>

<h2>Come usare i risultati</h2>
<p>Nella pagina delle cliniche trovi prima le strutture che dichiarano la prestazione o hanno informazioni coerenti con la visita di base. Contatta sempre la clinica per confermare disponibilita, prezzo aggiornato, tempi di attesa e modalita di prenotazione.</p>
$html$,
  image_url = 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80'
where lower(name) = 'visita semplice';
