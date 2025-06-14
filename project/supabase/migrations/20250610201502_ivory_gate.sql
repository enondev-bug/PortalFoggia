/*
  # Dati Iniziali Business Hub

  1. Categorie predefinite
  2. Utente admin di default
  3. Attività di esempio
  4. Recensioni di esempio
*/

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, color) VALUES
  ('Ristoranti', 'ristoranti', 'Ristoranti, pizzerie, bar e locali', 'utensils', '#EF4444'),
  ('Shopping', 'shopping', 'Negozi, boutique e centri commerciali', 'shopping-bag', '#8B5CF6'),
  ('Salute', 'salute', 'Farmacie, ospedali e centri medici', 'heart-pulse', '#10B981'),
  ('Servizi', 'servizi', 'Parrucchieri, estetisti e servizi alla persona', 'scissors', '#F59E0B'),
  ('Tempo Libero', 'tempo-libero', 'Palestre, cinema e intrattenimento', 'gamepad-2', '#3B82F6'),
  ('Automotive', 'automotive', 'Officine, concessionarie e servizi auto', 'car', '#6B7280'),
  ('Casa e Giardino', 'casa-giardino', 'Arredamento, giardinaggio e bricolage', 'home', '#84CC16'),
  ('Tecnologia', 'tecnologia', 'Elettronica, informatica e riparazioni', 'smartphone', '#06B6D4')
ON CONFLICT (slug) DO NOTHING;

-- Note: In a real application, you would create the admin user through Supabase Auth
-- This is just for reference - the actual user creation happens through the auth system
-- The profile will be automatically created via the trigger when a user signs up

-- Example businesses (these would be created by actual users)
-- This is just sample data structure - in production, businesses are created by authenticated users