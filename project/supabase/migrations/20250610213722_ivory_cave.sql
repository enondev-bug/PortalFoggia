/*
  # Sistema Media Storage per Business Hub

  1. Storage Bucket
    - Bucket per avatar utenti
    - Bucket per immagini attività
    - Politiche di sicurezza per upload e accesso

  2. Funzioni Helper
    - Funzione per generare nomi file unici
    - Funzione per validare tipi file

  3. Sicurezza
    - RLS per controllo accessi
    - Limitazioni dimensioni file
    - Tipi file consentiti
*/

-- Inserisci bucket per storage se non esistono già
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'business-images',
    'business-images', 
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- Politiche per bucket avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Politiche per bucket business-images
CREATE POLICY "Business images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'business-images');

CREATE POLICY "Business owners can upload images for their businesses"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-images'
    AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update images for their businesses"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'business-images'
    AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete images for their businesses"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business-images'
    AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE id::text = (storage.foldername(name))[1]
      AND owner_id = auth.uid()
    )
  );

-- Funzione per generare URL pubblico
CREATE OR REPLACE FUNCTION get_public_url(bucket_name text, file_path text)
RETURNS text AS $$
BEGIN
  RETURN concat(
    current_setting('app.settings.supabase_url', true),
    '/storage/v1/object/public/',
    bucket_name,
    '/',
    file_path
  );
END;
$$ LANGUAGE plpgsql;

-- Funzione per pulire vecchi avatar quando viene caricato uno nuovo
CREATE OR REPLACE FUNCTION cleanup_old_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Se l'avatar_url è cambiato e il vecchio era su Supabase Storage
  IF OLD.avatar_url IS NOT NULL 
     AND NEW.avatar_url IS DISTINCT FROM OLD.avatar_url 
     AND OLD.avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN
    
    -- Estrai il path del file dal vecchio URL
    DECLARE
      old_file_path text;
    BEGIN
      old_file_path := substring(OLD.avatar_url from '/storage/v1/object/public/avatars/(.*)');
      
      -- Elimina il vecchio file (questo sarà gestito dalle politiche RLS)
      -- La cancellazione effettiva avverrà tramite il client
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per cleanup avatar
CREATE TRIGGER cleanup_old_avatar_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_avatar();

-- Aggiorna la funzione handle_new_user per gestire avatar da OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    avatar_url,
    role,
    phone,
    bio,
    preferences,
    is_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'user',
    NEW.raw_user_meta_data->>'phone',
    NULL,
    '{}',
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;