update public.services_taxonomy
set allow_price = true
where allow_price = false
  and average_price is not null
  and length(coalesce(html_content, '')) >= 1200
  and lower(name) in (
    'esame copromicroscopico',
    'esame emocromocitometrico',
    'esame istologico',
    'esame urine + sedimento',
    'estrazione dentaria',
    'guardian iniettabile',
    'ricovero giornaliero (escl. terapia)',
    'striscio ematico',
    'sutura ferita cutanea complessa',
    'test pancreatite',
    'test per fiv e felv',
    'test per leishmaniosi',
    'vaccinazione cane leishmania (letifend)',
    'vaccinazione cane monovalente leptospirosi (l4)',
    'vaccinazione cane polivalente (dhppi + l4)',
    'vaccinazione cane polivalente (v7)',
    'vaccinazione cane polivalente cucciolo (dhppi)',
    'vaccinazione coniglio - vaccino completo (mixomatosi + malattia emorragica)',
    'vaccinazione gatto monovalente (leucemia felina)',
    'vaccinazione gatto polivalente (rcp)'
  );
