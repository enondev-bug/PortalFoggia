/*
  # Fix Authentication and Login Issues

  1. Problemi Identificati
    - Trigger handle_new_user potrebbe non funzionare correttamente
    - Politiche RLS potrebbero essere troppo restrittive
    - Mancanza di indici per performance
    - Possibili problemi con la creazione automatica del profilo

  2. Correzioni
    - Aggiorna trigger per gestione nuovi utenti
    - Corregge politiche RLS per profiles
    - Aggiunge funzioni di debug
    - Migliora gestione errori

  3. Sicurezza
    - Mantiene RLS attivo
    - Corregge politiche per admin
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  user_email text;
BEGIN
  -- Estrai email e nome con fallback sicuri
  user_email := COALESCE(NEW.email, '');
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name', 
    split_part(NEW.email, '@', 1),
    'Utente'
  );

  -- Log per debug
  RAISE LOG 'Creating profile for user: % with email: %', NEW.id, user_email;

  -- Inserisci profilo con gestione errori
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
      user_email,
      user_name,
      NEW.raw_user_meta_data->>'avatar_url',
      'user',
      NEW.raw_user_meta_data->>'phone',
      NULL,
      '{}',
      false,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- Non bloccare la registrazione anche se il profilo fallisce
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ricrea il trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Funzione per creare profilo manualmente se mancante
CREATE OR REPLACE FUNCTION public.ensure_user_profile(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_record auth.users%ROWTYPE;
  profile_exists boolean;
BEGIN
  -- Controlla se il profilo esiste già
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
  
  IF profile_exists THEN
    RETURN true;
  END IF;
  
  -- Ottieni dati utente da auth.users
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE LOG 'User not found in auth.users: %', user_id;
    RETURN false;
  END IF;
  
  -- Crea il profilo
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
      user_record.id,
      COALESCE(user_record.email, ''),
      COALESCE(
        user_record.raw_user_meta_data->>'name',
        user_record.raw_user_meta_data->>'full_name',
        split_part(user_record.email, '@', 1),
        'Utente'
      ),
      user_record.raw_user_meta_data->>'avatar_url',
      'user',
      user_record.raw_user_meta_data->>'phone',
      NULL,
      '{}',
      false,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Profile created manually for user: %', user_id;
    RETURN true;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating manual profile for user %: %', user_id, SQLERRM;
    RETURN false;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aggiorna politiche RLS per profiles (più permissive per debug)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Politiche aggiornate
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Politica per permettere al sistema di creare profili
CREATE POLICY "System can create profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Funzione per debug login
CREATE OR REPLACE FUNCTION public.debug_user_login(user_email text)
RETURNS jsonb AS $$
DECLARE
  auth_user auth.users%ROWTYPE;
  user_profile profiles%ROWTYPE;
  result jsonb;
BEGIN
  -- Cerca utente in auth.users
  SELECT * INTO auth_user FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'User not found in auth.users',
      'email', user_email
    );
  END IF;
  
  -- Cerca profilo
  SELECT * INTO user_profile FROM profiles WHERE id = auth_user.id;
  
  IF NOT FOUND THEN
    -- Prova a creare il profilo
    IF public.ensure_user_profile(auth_user.id) THEN
      SELECT * INTO user_profile FROM profiles WHERE id = auth_user.id;
    END IF;
  END IF;
  
  -- Costruisci risultato
  result := jsonb_build_object(
    'status', 'success',
    'auth_user', jsonb_build_object(
      'id', auth_user.id,
      'email', auth_user.email,
      'created_at', auth_user.created_at,
      'email_confirmed_at', auth_user.email_confirmed_at,
      'last_sign_in_at', auth_user.last_sign_in_at
    ),
    'profile', CASE 
      WHEN user_profile.id IS NOT NULL THEN
        jsonb_build_object(
          'id', user_profile.id,
          'email', user_profile.email,
          'name', user_profile.name,
          'role', user_profile.role,
          'is_verified', user_profile.is_verified,
          'created_at', user_profile.created_at
        )
      ELSE
        null
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per creare admin manualmente
CREATE OR REPLACE FUNCTION public.create_admin_user(
  admin_email text,
  admin_name text DEFAULT 'Admin User'
)
RETURNS jsonb AS $$
DECLARE
  auth_user auth.users%ROWTYPE;
  user_profile profiles%ROWTYPE;
BEGIN
  -- Cerca utente esistente
  SELECT * INTO auth_user FROM auth.users WHERE email = admin_email;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'User not found. Please register first.',
      'email', admin_email
    );
  END IF;
  
  -- Assicurati che il profilo esista
  PERFORM public.ensure_user_profile(auth_user.id);
  
  -- Aggiorna il ruolo ad admin
  UPDATE profiles 
  SET 
    role = 'admin',
    name = admin_name,
    is_verified = true,
    updated_at = now()
  WHERE id = auth_user.id;
  
  -- Verifica aggiornamento
  SELECT * INTO user_profile FROM profiles WHERE id = auth_user.id;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Admin user created successfully',
    'user', jsonb_build_object(
      'id', user_profile.id,
      'email', user_profile.email,
      'name', user_profile.name,
      'role', user_profile.role,
      'is_verified', user_profile.is_verified
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indici per migliorare performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Verifica e correggi eventuali profili mancanti per utenti esistenti
DO $$
DECLARE
  user_record auth.users%ROWTYPE;
BEGIN
  FOR user_record IN SELECT * FROM auth.users LOOP
    PERFORM public.ensure_user_profile(user_record.id);
  END LOOP;
END $$;

-- Log per verificare lo stato
DO $$
DECLARE
  total_users integer;
  total_profiles integer;
  admin_count integer;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role IN ('admin', 'super_admin');
  
  RAISE LOG 'Database status - Users: %, Profiles: %, Admins: %', total_users, total_profiles, admin_count;
END $$;