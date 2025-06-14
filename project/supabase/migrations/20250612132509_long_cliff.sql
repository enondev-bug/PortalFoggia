/*
  # Funzioni per News ed Eventi

  1. Funzioni
    - Incremento contatori visualizzazioni
    - Incremento contatori like
    - Funzioni di ricerca avanzata
*/

-- Funzione per incrementare visualizzazioni news
CREATE OR REPLACE FUNCTION increment_news_views(news_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE news 
  SET 
    view_count = view_count + 1,
    updated_at = now()
  WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- Funzione per incrementare like news
CREATE OR REPLACE FUNCTION increment_news_likes(news_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE news 
  SET 
    like_count = like_count + 1,
    updated_at = now()
  WHERE id = news_id;
END;
$$ LANGUAGE plpgsql;

-- Funzione per incrementare visualizzazioni eventi
CREATE OR REPLACE FUNCTION increment_event_views(event_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE events 
  SET 
    view_count = view_count + 1,
    updated_at = now()
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Funzione per incrementare like eventi
CREATE OR REPLACE FUNCTION increment_event_likes(event_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE events 
  SET 
    like_count = like_count + 1,
    updated_at = now()
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ricerca full-text nelle news
CREATE OR REPLACE FUNCTION search_news(search_term text, limit_count integer DEFAULT 10)
RETURNS SETOF news AS $$
BEGIN
  RETURN QUERY
  SELECT n.*
  FROM news n
  WHERE 
    n.status = 'published' AND
    (
      n.title ILIKE '%' || search_term || '%' OR
      n.excerpt ILIKE '%' || search_term || '%' OR
      n.content ILIKE '%' || search_term || '%' OR
      search_term = ANY(n.tags)
    )
  ORDER BY 
    CASE WHEN n.title ILIKE '%' || search_term || '%' THEN 0
         WHEN n.excerpt ILIKE '%' || search_term || '%' THEN 1
         WHEN search_term = ANY(n.tags) THEN 2
         ELSE 3
    END,
    n.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ricerca full-text negli eventi
CREATE OR REPLACE FUNCTION search_events(search_term text, limit_count integer DEFAULT 10)
RETURNS SETOF events AS $$
BEGIN
  RETURN QUERY
  SELECT e.*
  FROM events e
  WHERE 
    e.status = 'published' AND
    e.end_date >= CURRENT_DATE AND
    (
      e.title ILIKE '%' || search_term || '%' OR
      e.description ILIKE '%' || search_term || '%' OR
      e.location_name ILIKE '%' || search_term || '%' OR
      e.location_address ILIKE '%' || search_term || '%' OR
      search_term = ANY(e.tags)
    )
  ORDER BY 
    CASE WHEN e.title ILIKE '%' || search_term || '%' THEN 0
         WHEN e.location_name ILIKE '%' || search_term || '%' THEN 1
         WHEN search_term = ANY(e.tags) THEN 2
         ELSE 3
    END,
    e.start_date ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Funzione per ottenere eventi nelle vicinanze
CREATE OR REPLACE FUNCTION get_nearby_events(lat decimal, lng decimal, radius_km integer DEFAULT 10)
RETURNS SETOF events AS $$
BEGIN
  RETURN QUERY
  SELECT e.*
  FROM events e
  WHERE 
    e.status = 'published' AND
    e.end_date >= CURRENT_DATE AND
    e.latitude IS NOT NULL AND
    e.longitude IS NOT NULL AND
    (
      6371 * acos(
        cos(radians(lat)) * 
        cos(radians(e.latitude)) * 
        cos(radians(e.longitude) - radians(lng)) + 
        sin(radians(lat)) * 
        sin(radians(e.latitude))
      )
    ) <= radius_km
  ORDER BY 
    (
      6371 * acos(
        cos(radians(lat)) * 
        cos(radians(e.latitude)) * 
        cos(radians(e.longitude) - radians(lng)) + 
        sin(radians(lat)) * 
        sin(radians(e.latitude))
      )
    ) ASC,
    e.start_date ASC;
END;
$$ LANGUAGE plpgsql;