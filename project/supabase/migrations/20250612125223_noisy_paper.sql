/*
  # Sistema Impostazioni Globali

  1. Tabella
    - `system_settings` - Tabella per impostazioni globali del sistema
    - Struttura flessibile con campo JSONB per impostazioni
    - ID fisso per facile accesso

  2. Sicurezza
    - RLS abilitato
    - Solo admin possono modificare
    - Tutti possono leggere impostazioni pubbliche

  3. Funzionalità
    - Supporto per vari tipi di impostazioni
    - Tracciamento modifiche con timestamp
    - Funzione per ottenere impostazioni
*/

-- Tabella impostazioni sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Funzione per aggiornare timestamp
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare timestamp
CREATE TRIGGER update_system_settings_timestamp
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- Abilita RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy per lettura (tutti possono leggere)
CREATE POLICY "System settings are readable by everyone"
  ON system_settings FOR SELECT
  USING (true);

-- Policy per modifica (solo admin)
CREATE POLICY "Only admins can modify system settings"
  ON system_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Inserisci impostazioni di default
INSERT INTO system_settings (
  id,
  settings,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '{
    "siteName": "Business Hub",
    "siteDescription": "La piattaforma completa per scoprire le migliori attività locali",
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
) ON CONFLICT (id) DO NOTHING;

-- Funzione per ottenere impostazioni
CREATE OR REPLACE FUNCTION get_system_setting(setting_key text)
RETURNS jsonb AS $$
DECLARE
  setting_value jsonb;
BEGIN
  SELECT settings->setting_key INTO setting_value
  FROM system_settings
  WHERE id = '00000000-0000-0000-0000-000000000000'
  LIMIT 1;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggiornare un'impostazione
CREATE OR REPLACE FUNCTION update_system_setting(setting_key text, setting_value jsonb)
RETURNS boolean AS $$
DECLARE
  success boolean;
BEGIN
  UPDATE system_settings
  SET 
    settings = jsonb_set(settings, ARRAY[setting_key], setting_value),
    updated_at = now()
  WHERE id = '00000000-0000-0000-0000-000000000000';
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql;