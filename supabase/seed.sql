-- Seed data for services taxonomy using explicit UUIDs

-- Services taxonomy with UUID IDs
INSERT INTO services_taxonomy (id, name, category) VALUES
  ('59ae2102-60f9-4996-a5d6-97b320a73da5', 'Visite Generali', 'general'),
  ('ca3d82d7-9167-4d22-a8b2-cda308430d31', 'Chirurgia Veterinaria', 'surgery'),
  ('31982be0-f6e2-4904-9ae0-28ed223155e6', 'Cardiologia', 'cardiology'),
  ('22e5bfac-b300-4f16-b588-0107d077ab0e', 'Oftalmologia', 'ophthalmology'),
  ('3a00faee-e9fd-4cf3-b6c4-0230898807d3', 'Ortopedia', 'orthopedics'),
  ('292ac77c-9bfc-41ae-b7e5-0fc9de6aac57', 'Farmacia Veterinaria', 'pharmacy');

-- Sample clinic referencing services via UUID array
INSERT INTO clinics (id, name, service_ids) VALUES
  ('3977d2be-4d5b-485f-acb8-6cb7bcc54f65', 'Clinica Veterinaria Roma', '{"59ae2102-60f9-4996-a5d6-97b320a73da5","ca3d82d7-9167-4d22-a8b2-cda308430d31"}');

-- Price list referencing service UUIDs
INSERT INTO services_prices (clinic_id, service_id, price, animal_type) VALUES
  ('3977d2be-4d5b-485f-acb8-6cb7bcc54f65', '59ae2102-60f9-4996-a5d6-97b320a73da5', 50, 'Cane'),
  ('3977d2be-4d5b-485f-acb8-6cb7bcc54f65', 'ca3d82d7-9167-4d22-a8b2-cda308430d31', 200, 'Gatto');
