/*
  # Sistema Analytics Completo

  1. Tabelle Analytics
    - `analytics_events` - Eventi tracciati
    - `analytics_sessions` - Sessioni utente
    - `analytics_daily_stats` - Statistiche giornaliere aggregate

  2. Funzioni
    - Incremento contatori business
    - Aggregazione dati giornaliera
    - Pulizia dati vecchi

  3. Trigger
    - Auto-aggregazione dati
    - Aggiornamento contatori
*/

-- Tabella eventi analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_category text NOT NULL CHECK (event_category IN ('user', 'business', 'search', 'interaction', 'system')),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  page_url text NOT NULL,
  user_agent text NOT NULL,
  ip_address inet,
  referrer text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Tabella sessioni analytics
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  page_views integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  device_type text,
  browser text,
  os text,
  country text,
  city text,
  referrer_domain text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella statistiche giornaliere
CREATE TABLE IF NOT EXISTS analytics_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  total_visitors integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  page_views integer DEFAULT 0,
  sessions integer DEFAULT 0,
  avg_session_duration integer DEFAULT 0,
  bounce_rate decimal(5,2) DEFAULT 0,
  new_users integer DEFAULT 0,
  returning_users integer DEFAULT 0,
  business_views integer DEFAULT 0,
  business_contacts integer DEFAULT 0,
  searches integer DEFAULT 0,
  registrations integer DEFAULT 0,
  reviews integer DEFAULT 0,
  favorites integer DEFAULT 0,
  top_pages jsonb DEFAULT '[]',
  top_searches jsonb DEFAULT '[]',
  top_businesses jsonb DEFAULT '[]',
  device_breakdown jsonb DEFAULT '{}',
  traffic_sources jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(date)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_business ON analytics_events(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_composite ON analytics_events(event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_start ON analytics_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_stats_date ON analytics_daily_stats(date);

-- Funzioni per incrementare contatori business
CREATE OR REPLACE FUNCTION increment_business_views(business_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE businesses 
  SET 
    view_count = view_count + 1,
    updated_at = now()
  WHERE id = business_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_business_contacts(business_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE businesses 
  SET 
    contact_count = contact_count + 1,
    updated_at = now()
  WHERE id = business_id;
END;
$$ LANGUAGE plpgsql;

-- Funzione per aggregare statistiche giornaliere
CREATE OR REPLACE FUNCTION aggregate_daily_stats(target_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  stats_record RECORD;
BEGIN
  -- Calcola statistiche per la data specificata
  SELECT 
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) as unique_visitors,
    COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
    COUNT(CASE WHEN event_type = 'business_view' THEN 1 END) as business_views,
    COUNT(CASE WHEN event_type = 'business_contact' THEN 1 END) as business_contacts,
    COUNT(CASE WHEN event_type = 'search' THEN 1 END) as searches,
    COUNT(CASE WHEN event_type = 'user_registration' THEN 1 END) as registrations,
    COUNT(CASE WHEN event_type = 'review_submission' THEN 1 END) as reviews,
    COUNT(CASE WHEN event_type = 'favorite_toggle' AND metadata->>'action' = 'add' THEN 1 END) as favorites
  INTO stats_record
  FROM analytics_events 
  WHERE DATE(created_at) = target_date;

  -- Inserisci o aggiorna le statistiche giornaliere
  INSERT INTO analytics_daily_stats (
    date,
    total_visitors,
    unique_visitors,
    page_views,
    sessions,
    business_views,
    business_contacts,
    searches,
    registrations,
    reviews,
    favorites,
    updated_at
  ) VALUES (
    target_date,
    stats_record.unique_visitors,
    stats_record.unique_visitors,
    stats_record.page_views,
    stats_record.total_sessions,
    stats_record.business_views,
    stats_record.business_contacts,
    stats_record.searches,
    stats_record.registrations,
    stats_record.reviews,
    stats_record.favorites,
    now()
  )
  ON CONFLICT (date) 
  DO UPDATE SET
    total_visitors = EXCLUDED.total_visitors,
    unique_visitors = EXCLUDED.unique_visitors,
    page_views = EXCLUDED.page_views,
    sessions = EXCLUDED.sessions,
    business_views = EXCLUDED.business_views,
    business_contacts = EXCLUDED.business_contacts,
    searches = EXCLUDED.searches,
    registrations = EXCLUDED.registrations,
    reviews = EXCLUDED.reviews,
    favorites = EXCLUDED.favorites,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Funzione per pulire dati vecchi (mantieni solo ultimi 90 giorni)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  -- Elimina eventi più vecchi di 90 giorni
  DELETE FROM analytics_events 
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- Elimina sessioni più vecchie di 90 giorni
  DELETE FROM analytics_sessions 
  WHERE start_time < now() - INTERVAL '90 days';
  
  -- Mantieni statistiche giornaliere per 1 anno
  DELETE FROM analytics_daily_stats 
  WHERE date < CURRENT_DATE - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare sessioni
CREATE OR REPLACE FUNCTION update_session_on_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna o crea sessione
  INSERT INTO analytics_sessions (
    session_id,
    user_id,
    start_time,
    page_views,
    updated_at
  ) VALUES (
    NEW.session_id,
    NEW.user_id,
    NEW.created_at,
    1,
    NEW.created_at
  )
  ON CONFLICT (session_id) 
  DO UPDATE SET
    page_views = analytics_sessions.page_views + 1,
    end_time = NEW.created_at,
    updated_at = NEW.created_at;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per eventi analytics
CREATE TRIGGER update_session_trigger
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION update_session_on_event();

-- RLS per analytics (solo admin possono vedere tutto)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY;

-- Policy per analytics_events
CREATE POLICY "Admin can view all analytics events"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Policy per analytics_sessions
CREATE POLICY "Admin can view all analytics sessions"
  ON analytics_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can manage analytics sessions"
  ON analytics_sessions FOR ALL
  USING (true);

-- Policy per analytics_daily_stats
CREATE POLICY "Admin can view daily stats"
  ON analytics_daily_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can manage daily stats"
  ON analytics_daily_stats FOR ALL
  USING (true);

-- Inserisci alcuni dati di esempio per testing
INSERT INTO analytics_daily_stats (date, total_visitors, unique_visitors, page_views, sessions, business_views, business_contacts, searches) VALUES
  (CURRENT_DATE - 1, 156, 142, 324, 156, 89, 23, 67),
  (CURRENT_DATE - 2, 134, 128, 298, 134, 76, 19, 54),
  (CURRENT_DATE - 3, 178, 165, 387, 178, 102, 28, 73),
  (CURRENT_DATE - 4, 145, 139, 312, 145, 84, 21, 61),
  (CURRENT_DATE - 5, 167, 154, 356, 167, 95, 25, 69),
  (CURRENT_DATE - 6, 189, 176, 421, 189, 118, 32, 81),
  (CURRENT_DATE - 7, 203, 187, 456, 203, 127, 35, 89)
ON CONFLICT (date) DO NOTHING;