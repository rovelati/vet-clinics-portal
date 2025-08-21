-- Seed data for services, clinics, reviews, and service prices

-- Services taxonomy
INSERT INTO services_taxonomy (id, name, category) VALUES
  (1, 'Eco addominale', 'Diagnostica'),
  (2, 'Pulizia denti', 'Odontoiatria'),
  (3, 'Radiografia torace', 'Diagnostica'),
  (4, 'Sterilizzazione femmina', 'Chirurgia'),
  (5, 'TAC encefalica', 'Diagnostica'),
  (6, 'Vaccinazione annuale', 'Prevenzione'),
  (7, 'Visita cardiologica', 'Diagnostica');

-- Demo clinics
INSERT INTO clinics (
  id, owner_id, name, slug, specialization, address, phone, email, website,
  description, service_ids, lat, lng, hours, gallery_images,
  rating_avg_cached, rating_count_cached, rating_expires_at, rating_source, status
) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
   'Clinica Veterinaria Roma', 'clinica-veterinaria-roma', 'Generale',
   'Via Roma 1, Roma', '06 1234567', 'roma@example.com', 'https://clinicroma.example.com',
   'Clinica veterinaria nel cuore di Roma', '{1,2,6,7}', 41.9028, 12.4964,
   '{"Lunedì":"09:00-18:00"}', '["https://placehold.co/600x400?text=Roma"]',
   4.5, 120, '2025-01-01T00:00:00Z', 'seed', 'pubblicata'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
   'Clinica Veterinaria Milano', 'clinica-veterinaria-milano', 'Ortopedia',
   'Via Milano 10, Milano', '02 7654321', 'milano@example.com', 'https://clinicmilano.example.com',
   'Specializzata in ortopedia', '{1,3,5,7}', 45.4642, 9.1900,
   '{"Lunedì":"08:00-17:00"}', '["https://placehold.co/600x400?text=Milano"]',
   4.7, 98, '2025-01-01T00:00:00Z', 'seed', 'pubblicata'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
   'Clinica Veterinaria Napoli', 'clinica-veterinaria-napoli', 'Dermatologia',
   'Via Napoli 20, Napoli', '081 1239876', 'napoli@example.com', 'https://clinicnapoli.example.com',
   'Cura della pelle degli animali', '{2,3,4,6}', 40.8518, 14.2681,
   '{"Lunedì":"09:30-19:00"}', '["https://placehold.co/600x400?text=Napoli"]',
   4.6, 76, '2025-01-01T00:00:00Z', 'seed', 'pubblicata');

-- Service prices
INSERT INTO services_prices (clinic_id, service_id, animal_type, price) VALUES
  ('11111111-1111-1111-1111-111111111111', 1, 'cane', 110),
  ('11111111-1111-1111-1111-111111111111', 2, 'cane', 160),
  ('11111111-1111-1111-1111-111111111111', 6, 'gatto', 45),
  ('22222222-2222-2222-2222-222222222222', 1, 'cane', 110),
  ('22222222-2222-2222-2222-222222222222', 3, 'gatto', 60),
  ('22222222-2222-2222-2222-222222222222', 5, 'cane', 200),
  ('33333333-3333-3333-3333-333333333333', 2, 'cane', 160),
  ('33333333-3333-3333-3333-333333333333', 4, 'gatto', 220),
  ('33333333-3333-3333-3333-333333333333', 6, 'gatto', 45),
  ('33333333-3333-3333-3333-333333333333', 7, 'cane', 90);

-- Demo reviews
INSERT INTO google_reviews_latest3 (
  clinic_id, review_id, reviewer_name, star_rating, comment, created_at_g
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'r1', 'Mario Rossi', 5, 'Servizio eccellente!', '2024-06-01T10:00:00Z'),
  ('11111111-1111-1111-1111-111111111111', 'r2', 'Giulia Bianchi', 4, 'Prezzi onesti.', '2024-06-05T15:20:00Z'),
  ('11111111-1111-1111-1111-111111111111', 'r3', 'Luca Verdi', 5, 'Molto professionali.', '2024-06-10T09:45:00Z'),
  ('22222222-2222-2222-2222-222222222222', 'r4', 'Luisa Bianchi', 4, 'Personale molto cortese', '2024-06-02T11:00:00Z'),
  ('22222222-2222-2222-2222-222222222222', 'r5', 'Paolo Neri', 5, 'Ottimo servizio ortopedico', '2024-06-06T12:15:00Z'),
  ('22222222-2222-2222-2222-222222222222', 'r6', 'Sara Blu', 4, 'Ambiente accogliente', '2024-06-09T17:30:00Z'),
  ('33333333-3333-3333-3333-333333333333', 'r7', 'Carlo Verdi', 5, 'Mi sono trovato benissimo', '2024-06-03T09:30:00Z'),
  ('33333333-3333-3333-3333-333333333333', 'r8', 'Anna Rossi', 4, 'Personale competente', '2024-06-04T14:00:00Z'),
  ('33333333-3333-3333-3333-333333333333', 'r9', 'Marco Gialli', 5, 'Servizio rapido', '2024-06-08T10:50:00Z');
