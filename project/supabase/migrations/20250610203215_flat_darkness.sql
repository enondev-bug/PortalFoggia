/*
  # Assegnare ruolo admin a un utente

  1. Modifica il ruolo di un utente specifico
  2. Aggiorna il campo role da 'user' a 'admin' o 'super_admin'
  
  IMPORTANTE: Sostituisci 'EMAIL_UTENTE' con l'email dell'utente che vuoi rendere admin
*/

-- Assegna ruolo admin a un utente specifico tramite email
UPDATE profiles 
SET 
  role = 'admin',
  updated_at = now()
WHERE email = 'EMAIL_UTENTE';

-- Esempio: per rendere admin l'utente con email 'admin@businesshub.com'
-- UPDATE profiles 
-- SET 
--   role = 'admin',
--   updated_at = now()
-- WHERE email = 'admin@businesshub.com';

-- Per rendere super_admin (privilegi massimi):
-- UPDATE profiles 
-- SET 
--   role = 'super_admin',
--   updated_at = now()
-- WHERE email = 'admin@businesshub.com';

-- Verifica che l'aggiornamento sia andato a buon fine
SELECT id, email, name, role, created_at 
FROM profiles 
WHERE role IN ('admin', 'super_admin');