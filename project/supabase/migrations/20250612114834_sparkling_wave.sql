/*
  # Aggiungi Attività di Esempio

  1. Nuova Attività
    - Pizzeria Roma - attività di esempio completa
    - Con categoria, orari, immagini e recensioni
    - Stato attivo per essere visibile

  2. Dati Correlati
    - Orari di apertura completi
    - Immagini di esempio
    - Recensioni positive
    - Offerte speciali
*/

-- Inserisci un'attività di esempio (Pizzeria Roma)
INSERT INTO businesses (
  id,
  name,
  slug,
  description,
  short_description,
  category_id,
  address,
  city,
  postal_code,
  country,
  latitude,
  longitude,
  phone,
  email,
  website,
  status,
  subscription_plan,
  is_featured,
  is_verified,
  rating,
  review_count,
  view_count,
  contact_count,
  created_at,
  updated_at
) VALUES (
  'b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e',
  'Pizzeria Roma',
  'pizzeria-roma',
  'Autentica pizzeria napoletana nel cuore di Milano. Offriamo pizze tradizionali cotte nel forno a legna, con ingredienti freschi e di qualità. La nostra pasta viene preparata quotidianamente seguendo ricette tramandate da generazioni. Ambiente accogliente e familiare, perfetto per cene romantiche o serate con amici.',
  'Autentica pizzeria napoletana con forno a legna e ingredienti freschi',
  (SELECT id FROM categories WHERE slug = 'ristoranti' LIMIT 1),
  'Via Giuseppe Garibaldi, 15',
  'Milano',
  '20121',
  'Italy',
  45.4654,
  9.1859,
  '+39 02 1234 5678',
  'info@pizzeriaroma.it',
  'https://www.pizzeriaroma.it',
  'active',
  'premium',
  true,
  true,
  4.8,
  15,
  342,
  28,
  NOW() - INTERVAL '30 days',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  updated_at = NOW();

-- Inserisci orari di apertura
INSERT INTO business_hours (business_id, day_of_week, open_time, close_time, is_closed) VALUES
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 0, '18:00', '23:30', false), -- Domenica
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 1, '12:00', '14:30', false), -- Lunedì pranzo
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 1, '19:00', '23:30', false), -- Lunedì cena
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 2, '12:00', '14:30', false), -- Martedì pranzo
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 2, '19:00', '23:30', false), -- Martedì cena
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 3, '12:00', '14:30', false), -- Mercoledì pranzo
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 3, '19:00', '23:30', false), -- Mercoledì cena
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 4, '12:00', '14:30', false), -- Giovedì pranzo
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 4, '19:00', '23:30', false), -- Giovedì cena
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 5, '12:00', '14:30', false), -- Venerdì pranzo
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 5, '19:00', '00:00', false), -- Venerdì cena
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 6, '12:00', '14:30', false), -- Sabato pranzo
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 6, '19:00', '00:00', false)  -- Sabato cena
ON CONFLICT DO NOTHING;

-- Inserisci immagini di esempio
INSERT INTO business_images (business_id, url, alt_text, is_primary, sort_order) VALUES
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=800', 'Esterno della Pizzeria Roma', true, 1),
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=compress&cs=tinysrgb&w=800', 'Pizza Margherita appena sfornata', false, 2),
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'https://images.pexels.com/photos/1049626/pexels-photo-1049626.jpeg?auto=compress&cs=tinysrgb&w=800', 'Interno accogliente del ristorante', false, 3),
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'https://images.pexels.com/photos/1260968/pexels-photo-1260968.jpeg?auto=compress&cs=tinysrgb&w=800', 'Forno a legna tradizionale', false, 4)
ON CONFLICT DO NOTHING;

-- Inserisci offerte speciali
INSERT INTO offers (business_id, title, description, discount_type, discount_value, terms, is_active, start_date, end_date, usage_limit) VALUES
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'Happy Hour Pizza', 'Sconto del 20% su tutte le pizze dalle 18:00 alle 20:00', 'percentage', 20.00, 'Valido dal lunedì al giovedì. Non cumulabile con altre offerte.', true, NOW(), NOW() + INTERVAL '30 days', 100),
  ('b1e2c3d4-5f6a-7b8c-9d0e-1f2a3b4c5d6e', 'Menu Famiglia', 'Due pizze + bibite + dolce a 35€', 'fixed', 35.00, 'Valido per famiglie con bambini. Prenotazione consigliata.', true, NOW(), NOW() + INTERVAL '60 days', 50)
ON CONFLICT DO NOTHING;