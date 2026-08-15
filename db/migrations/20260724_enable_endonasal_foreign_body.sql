update public.services_taxonomy
set
  allow_price = true,
  average_price = coalesce(average_price, 50),
  description = 'Rimozione di un corpo estraneo dalle cavita nasali, indicata quando l animale mostra starnuti improvvisi, scolo nasale, fastidio o sospetto materiale inalato.',
  image_url = 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80',
  synonyms = '["corpo estraneo naso", "forasacco naso", "asportazione corpo estraneo nasale", "rimozione corpo estraneo endonasale", "starnuti forasacco cane"]'::jsonb
where lower(name) = 'asportazione corpo estraneo endonasale';
