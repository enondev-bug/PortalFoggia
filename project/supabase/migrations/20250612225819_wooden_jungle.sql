/*
  # Business Owner Role and Policies

  1. Updates
    - Updates the role constraint in profiles table to include 'business_owner'
    - Adds RLS policies for business owners to manage their businesses
    - Adds helper function to check if a user is a business owner

  2. Security
    - Ensures business owners can only access their own businesses
    - Maintains existing RLS policies
*/

-- Aggiorna il vincolo di controllo per il campo role nella tabella profiles
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'business_owner', 'admin', 'super_admin'));

-- Verifica e crea le politiche RLS per i business owner
-- Politica per permettere ai business owner di vedere le proprie attività
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'businesses' 
        AND policyname = 'Business owners can view their businesses'
    ) THEN
        CREATE POLICY "Business owners can view their businesses"
          ON businesses FOR SELECT
          USING (owner_id = auth.uid());
    END IF;
END
$$;

-- Verifica se la policy di update esiste già prima di crearla
-- Nota: questa policy potrebbe già esistere con un altro nome
DO $$
BEGIN
    -- Non creiamo una nuova policy se esiste già una policy di update per i business owner
    -- Questo evita l'errore di duplicazione
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'businesses' 
        AND policyname = 'Business owners can update their businesses'
    ) THEN
        -- Verifichiamo se esiste già una policy che permette ai business owner di aggiornare le proprie attività
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'businesses' 
            AND cmd = 'UPDATE' 
            AND qual::text LIKE '%owner_id = auth.uid()%'
        ) THEN
            CREATE POLICY "Business owners can update their businesses"
              ON businesses FOR UPDATE
              USING (owner_id = auth.uid());
        END IF;
    END IF;
END
$$;

-- Politica per permettere ai business owner di vedere le recensioni delle proprie attività
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reviews' 
        AND policyname = 'Business owners can view reviews for their businesses'
    ) THEN
        CREATE POLICY "Business owners can view reviews for their businesses"
          ON reviews FOR SELECT
          USING (
            EXISTS (
              SELECT 1 FROM businesses
              WHERE businesses.id = reviews.business_id
              AND businesses.owner_id = auth.uid()
            )
          );
    END IF;
END
$$;

-- Politica per permettere ai business owner di gestire le proprie offerte
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'offers' 
        AND policyname = 'Business owners can manage their offers'
    ) THEN
        CREATE POLICY "Business owners can manage their offers"
          ON offers FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM businesses
              WHERE businesses.id = offers.business_id
              AND businesses.owner_id = auth.uid()
            )
          );
    END IF;
END
$$;

-- Politica per permettere ai business owner di gestire le proprie immagini
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'business_images' 
        AND policyname = 'Business owners can manage their images'
    ) THEN
        CREATE POLICY "Business owners can manage their images"
          ON business_images FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM businesses
              WHERE businesses.id = business_images.business_id
              AND businesses.owner_id = auth.uid()
            )
          );
    END IF;
END
$$;

-- Politica per permettere ai business owner di gestire i propri orari
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'business_hours' 
        AND policyname = 'Business owners can manage their hours'
    ) THEN
        CREATE POLICY "Business owners can manage their hours"
          ON business_hours FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM businesses
              WHERE businesses.id = business_hours.business_id
              AND businesses.owner_id = auth.uid()
            )
          );
    END IF;
END
$$;

-- Funzione per verificare se un utente è proprietario di un'attività
-- Sostituisce la funzione se esiste già
CREATE OR REPLACE FUNCTION is_business_owner(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'business_owner'
  );
END;
$$ LANGUAGE plpgsql;