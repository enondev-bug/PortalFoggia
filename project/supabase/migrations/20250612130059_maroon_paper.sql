/*
  # Aggiorna Nome Piattaforma a Portale Foggiano

  1. Aggiornamenti
    - Aggiorna le impostazioni di sistema con il nuovo nome
    - Modifica la descrizione per riflettere il focus su Foggia
    - Mantiene tutte le altre impostazioni esistenti

  2. Sicurezza
    - Nessuna modifica alle politiche di sicurezza
    - Mantiene la struttura esistente
*/

-- Aggiorna le impostazioni di sistema con il nuovo nome
UPDATE system_settings 
SET 
  settings = jsonb_set(
    jsonb_set(
      settings,
      '{siteName}',
      '"Portale Foggiano"'
    ),
    '{siteDescription}',
    '"La piattaforma completa per scoprire le migliori attività commerciali di Foggia e provincia"'
  ),
  updated_at = now()
WHERE id = '00000000-0000-0000-0000-000000000000';

-- Se non esistono impostazioni, creale con i nuovi valori
INSERT INTO system_settings (
  id,
  settings,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '{
    "siteName": "Portale Foggiano",
    "siteDescription": "La piattaforma completa per scoprire le migliori attività commerciali di Foggia e provincia",
    "maintenanceMode": false,
    "allowRegistrations": true,
    "requireApproval": true,
    "emailNotifications": true,
    "smsNotifications": false,
    "analyticsEnabled": true,
    "maxBusinessesPerUser": 5,
    "reviewModerationEnabled": true,
    "profanityFilterEnabled": true,
    "dataRetentionDays": 90,
    "privacyPolicyUrl": "/privacy",
    "termsUrl": "/terms",
    "debugMode": false,
    "apiRateLimit": 60,
    "userTracking": true,
    "ipMasking": true,
    "require2FA": false,
    "forceHttps": true,
    "bruteForceProtection": true,
    "advancedCaching": true,
    "imageCompression": true,
    "lazyLoading": true,
    "minifyAssets": true
  }',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  updated_at = EXCLUDED.updated_at;