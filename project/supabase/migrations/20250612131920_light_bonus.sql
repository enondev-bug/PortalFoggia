/*
  # Sistema News ed Eventi per Portale Foggiano

  1. Tabelle
    - `news` - Notizie e articoli
    - `events` - Eventi e manifestazioni
    - `event_participants` - Partecipazioni agli eventi

  2. Funzionalità
    - Gestione completa news ed eventi
    - Sistema di partecipazione eventi
    - Categorizzazione e tagging
    - Supporto immagini e media

  3. Sicurezza
    - RLS abilitato
    - Politiche per admin e utenti
    - Controllo accessi granulare
*/

-- Tabella News
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  featured_image text,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  category text DEFAULT 'generale' CHECK (category IN ('generale', 'economia', 'cultura', 'sport', 'eventi', 'politica', 'cronaca', 'turismo')),
  tags text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured boolean DEFAULT false,
  is_breaking boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  published_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella Eventi
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  short_description text,
  featured_image text,
  organizer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  category text DEFAULT 'altro' CHECK (category IN ('cultura', 'sport', 'musica', 'food', 'business', 'arte', 'teatro', 'cinema', 'festival', 'mercato', 'altro')),
  tags text[] DEFAULT '{}',
  location_name text NOT NULL,
  location_address text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  start_time time,
  end_time time,
  is_all_day boolean DEFAULT false,
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb,
  max_participants integer,
  current_participants integer DEFAULT 0,
  price decimal(10, 2) DEFAULT 0,
  currency text DEFAULT 'EUR',
  is_free boolean DEFAULT true,
  registration_required boolean DEFAULT false,
  registration_deadline timestamptz,
  contact_email text,
  contact_phone text,
  website text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabella Partecipazioni Eventi
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled', 'attended')),
  registration_data jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_author ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_featured ON news(is_featured, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_business ON events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(location_address);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured, start_date);

CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);

-- Abilita RLS
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Politiche News
CREATE POLICY "Published news are viewable by everyone"
  ON news FOR SELECT
  USING (status = 'published' OR author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Authors and admins can manage news"
  ON news FOR ALL
  USING (author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Politiche Eventi
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'published' OR organizer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Organizers and admins can manage events"
  ON events FOR ALL
  USING (organizer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Politiche Partecipazioni
CREATE POLICY "Users can view their own participations"
  ON event_participants FOR SELECT
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id 
      AND organizer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can manage their own participations"
  ON event_participants FOR ALL
  USING (user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events 
      WHERE id = event_id 
      AND organizer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at
  BEFORE UPDATE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funzione per aggiornare contatori partecipanti
CREATE OR REPLACE FUNCTION update_event_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events 
  SET 
    current_participants = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
      AND status IN ('registered', 'confirmed')
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger per contatori partecipanti
CREATE TRIGGER update_event_participants_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_participants_count();

-- Inserisci dati di esempio

-- News di esempio
INSERT INTO news (
  title,
  slug,
  excerpt,
  content,
  featured_image,
  category,
  tags,
  status,
  is_featured,
  published_at
) VALUES (
  'Nuova Area Pedonale nel Centro Storico di Foggia',
  'nuova-area-pedonale-centro-storico-foggia',
  'Il Comune di Foggia ha annunciato la creazione di una nuova area pedonale nel cuore del centro storico, che interesserà Corso Vittorio Emanuele e le vie limitrofe.',
  'Il Comune di Foggia ha ufficialmente annunciato l''avvio dei lavori per la creazione di una nuova area pedonale nel centro storico della città. Il progetto, che ha ricevuto il via libera dalla Giunta comunale, interesserà principalmente Corso Vittorio Emanuele e le vie adiacenti.

L''iniziativa, fortemente voluta dall''Amministrazione comunale, ha l''obiettivo di riqualificare il centro cittadino e renderlo più vivibile per residenti e turisti. La nuova area pedonale si estenderà per circa 800 metri e includerà anche piazza Cavour e via Arpi.

"Questo progetto rappresenta un passo fondamentale per la rinascita del nostro centro storico", ha dichiarato il Sindaco durante la conferenza stampa di presentazione. "Vogliamo restituire ai cittadini spazi di qualità dove poter passeggiare, fare shopping e socializzare in sicurezza".

I lavori inizieranno il prossimo mese e dovrebbero concludersi entro l''estate. Durante questo periodo, il traffico veicolare sarà deviato su percorsi alternativi che saranno opportunamente segnalati.

Le attività commerciali della zona hanno accolto positivamente l''iniziativa, vedendo in essa un''opportunità per incrementare il flusso di clienti e valorizzare le proprie attività.',
  'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=800',
  'cronaca',
  ARRAY['centro storico', 'pedonale', 'riqualificazione', 'traffico'],
  'published',
  true,
  NOW() - INTERVAL '2 days'
), (
  'Festival del Gusto Pugliese: Foggia Protagonista',
  'festival-gusto-pugliese-foggia-protagonista',
  'Dal 15 al 17 marzo si terrà in Piazza Cavour il Festival del Gusto Pugliese, con degustazioni, showcooking e prodotti tipici del territorio.',
  'Foggia si prepara ad ospitare la terza edizione del Festival del Gusto Pugliese, un evento enogastronomico che celebra le eccellenze culinarie della nostra regione. L''evento si svolgerà dal 15 al 17 marzo in Piazza Cavour e nelle vie del centro storico.

Il festival vedrà la partecipazione di oltre 50 produttori locali, ristoratori e chef che presenteranno le specialità più autentiche della tradizione pugliese. Non mancheranno degustazioni gratuite, showcooking dal vivo e laboratori didattici per grandi e piccini.

Tra le novità di quest''anno, uno spazio dedicato ai vini pugliesi con sommelier esperti che guideranno i visitatori alla scoperta dei migliori abbinamenti. Inoltre, sarà allestito un mercato contadino con prodotti a km zero direttamente dai produttori locali.

"Il Festival del Gusto rappresenta un''importante vetrina per le nostre eccellenze", spiega l''assessore al Turismo. "È un''occasione unica per far conoscere la ricchezza gastronomica del nostro territorio e attrarre visitatori da tutta la Puglia".

L''ingresso è gratuito e l''evento è aperto tutti i giorni dalle 10:00 alle 22:00.',
  'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
  'eventi',
  ARRAY['festival', 'gastronomia', 'puglia', 'tradizione'],
  'published',
  false,
  NOW() - INTERVAL '1 day'
);

-- Eventi di esempio
INSERT INTO events (
  title,
  slug,
  description,
  short_description,
  featured_image,
  category,
  tags,
  location_name,
  location_address,
  latitude,
  longitude,
  start_date,
  end_date,
  start_time,
  end_time,
  is_free,
  registration_required,
  contact_email,
  contact_phone,
  status,
  is_featured
) VALUES (
  'Mercatino dell''Antiquariato di Foggia',
  'mercatino-antiquariato-foggia-marzo',
  'Torna l''appuntamento mensile con il Mercatino dell''Antiquariato di Foggia. Un''occasione unica per scoprire oggetti d''epoca, libri antichi, mobili vintage e curiosità da collezione. Il mercatino si svolgerà in Piazza Umberto I e nelle vie limitrofe, con la partecipazione di oltre 40 espositori provenienti da tutta la Puglia.

Durante l''evento sarà possibile non solo acquistare pezzi unici, ma anche far valutare gratuitamente i propri oggetti antichi da esperti del settore. Non mancheranno stand gastronomici con specialità locali e un''area dedicata all''artigianato artistico.

L''evento è organizzato dall''Associazione Antiquari Foggiani in collaborazione con il Comune di Foggia e la Pro Loco. L''ingresso è gratuito e aperto a tutti.

Orari: dalle 9:00 alle 19:00
Per informazioni: info@antiquarifoggiani.it',
  'Appuntamento mensile con il Mercatino dell''Antiquariato di Foggia in Piazza Umberto I. Oltre 40 espositori con oggetti d''epoca, mobili vintage e curiosità da collezione.',
  'https://images.pexels.com/photos/6069552/pexels-photo-6069552.jpeg?auto=compress&cs=tinysrgb&w=800',
  'mercato',
  ARRAY['antiquariato', 'mercatino', 'collezionismo', 'vintage'],
  'Piazza Umberto I',
  'Piazza Umberto I, Foggia, 71121',
  41.4621,
  15.5444,
  CURRENT_DATE + INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '10 days',
  '09:00',
  '19:00',
  true,
  false,
  'info@antiquarifoggiani.it',
  '+39 0881 123456',
  'published',
  true
), (
  'Concerto di Primavera - Orchestra Sinfonica di Foggia',
  'concerto-primavera-orchestra-sinfonica-foggia',
  'L''Orchestra Sinfonica di Foggia presenta il tradizionale Concerto di Primavera, un evento musicale imperdibile che si terrà presso il Teatro Comunale "U. Giordano". Il programma prevede l''esecuzione di celebri brani di Mozart, Vivaldi e Beethoven, sotto la direzione del Maestro Antonio Bianchi.

Il concerto vedrà la partecipazione straordinaria del violinista di fama internazionale Marco Rossi, che eseguirà "Le Quattro Stagioni" di Vivaldi. La serata sarà arricchita anche da composizioni di giovani talenti del Conservatorio di Foggia.

L''evento è organizzato dalla Fondazione Musicale Foggiana in collaborazione con l''Assessorato alla Cultura del Comune di Foggia. Il ricavato della serata sarà devoluto al restauro dell''organo storico della Cattedrale.

Prenotazione obbligatoria fino ad esaurimento posti.',
  'L''Orchestra Sinfonica di Foggia presenta il tradizionale Concerto di Primavera al Teatro Comunale con musiche di Mozart, Vivaldi e Beethoven. Partecipazione straordinaria del violinista Marco Rossi.',
  'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=800',
  'musica',
  ARRAY['concerto', 'classica', 'orchestra', 'primavera'],
  'Teatro Comunale "U. Giordano"',
  'Piazza Cesare Battisti, Foggia, 71121',
  41.4605,
  15.5463,
  CURRENT_DATE + INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '15 days',
  '20:30',
  '22:30',
  false,
  true,
  'biglietteria@orchestrafoggia.it',
  '+39 0881 789012',
  'published',
  true
);