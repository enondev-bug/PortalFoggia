/*
  # Business Owner Role Enhancement

  1. Updates
    - Ensure 'business_owner' role is properly configured
    - Add business owner dashboard permissions
    - Create functions for business management
    - Add RLS policies specific to business owners

  2. Security
    - Business owners can only manage their own businesses
    - Admin can view and manage all businesses
*/

-- Ensure business_owner role is properly recognized in the check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'business_owner', 'admin', 'super_admin'));

-- Function to get businesses owned by a user
CREATE OR REPLACE FUNCTION get_user_businesses(user_id uuid)
RETURNS SETOF businesses AS $$
BEGIN
  RETURN QUERY
  SELECT b.*
  FROM businesses b
  WHERE b.owner_id = user_id
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is a business owner
CREATE OR REPLACE FUNCTION is_business_owner(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = 'business_owner';
END;
$$ LANGUAGE plpgsql;

-- Function to promote user to business owner
CREATE OR REPLACE FUNCTION promote_to_business_owner(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
  success boolean;
BEGIN
  UPDATE profiles
  SET 
    role = 'business_owner',
    updated_at = now()
  WHERE id = target_user_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get business statistics
CREATE OR REPLACE FUNCTION get_business_stats(business_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'view_count', b.view_count,
    'contact_count', b.contact_count,
    'review_count', b.review_count,
    'rating', b.rating,
    'favorites', (SELECT COUNT(*) FROM favorites f WHERE f.business_id = b.id),
    'offers', (SELECT COUNT(*) FROM offers o WHERE o.business_id = b.id),
    'images', (SELECT COUNT(*) FROM business_images bi WHERE bi.business_id = b.id),
    'reviews', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'rating', r.rating,
          'title', r.title,
          'comment', r.comment,
          'status', r.status,
          'created_at', r.created_at,
          'user', jsonb_build_object(
            'name', p.name,
            'avatar_url', p.avatar_url
          )
        )
      )
      FROM reviews r
      JOIN profiles p ON r.user_id = p.id
      WHERE r.business_id = b.id
      ORDER BY r.created_at DESC
      LIMIT 5
    ),
    'contacts', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'type', c.type,
          'subject', c.subject,
          'status', c.status,
          'created_at', c.created_at
        )
      )
      FROM contact_requests c
      WHERE c.business_id = b.id
      ORDER BY c.created_at DESC
      LIMIT 5
    )
  ) INTO result
  FROM businesses b
  WHERE b.id = business_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get business analytics
CREATE OR REPLACE FUNCTION get_business_analytics(business_id uuid, days_back integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  start_date date;
BEGIN
  start_date := CURRENT_DATE - days_back * INTERVAL '1 day';
  
  WITH daily_stats AS (
    SELECT 
      DATE(created_at) as day,
      COUNT(*) FILTER (WHERE event_type = 'business_view') as views,
      COUNT(*) FILTER (WHERE event_type = 'business_contact') as contacts,
      COUNT(*) FILTER (WHERE event_type = 'favorite_toggle' AND metadata->>'action' = 'add') as favorites
    FROM analytics_events
    WHERE 
      business_id = get_business_analytics.business_id AND
      created_at >= start_date
    GROUP BY DATE(created_at)
    ORDER BY day
  )
  SELECT jsonb_build_object(
    'daily', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', day,
          'views', views,
          'contacts', contacts,
          'favorites', favorites
        )
      )
      FROM daily_stats
    ),
    'totals', jsonb_build_object(
      'views', (SELECT SUM(views) FROM daily_stats),
      'contacts', (SELECT SUM(contacts) FROM daily_stats),
      'favorites', (SELECT SUM(favorites) FROM daily_stats)
    ),
    'conversion_rate', (
      SELECT CASE 
        WHEN SUM(views) > 0 THEN 
          ROUND((SUM(contacts)::numeric / SUM(views)::numeric) * 100, 2)
        ELSE 0
      END
      FROM daily_stats
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Ensure business owners can view analytics for their businesses
CREATE POLICY "Business owners can view analytics for their businesses"
  ON analytics_events FOR SELECT
  USING (
    business_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = business_id 
      AND owner_id = auth.uid()
    )
  );

-- Ensure business owners can view analytics sessions for their businesses
CREATE POLICY "Business owners can view analytics sessions"
  ON analytics_sessions FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM analytics_events
      WHERE session_id = analytics_sessions.session_id
      AND business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
  );

-- Ensure business owners can view daily stats
CREATE POLICY "Business owners can view daily stats"
  ON analytics_daily_stats FOR SELECT
  USING (true);

-- Add a function to check if a user owns a specific business
CREATE OR REPLACE FUNCTION user_owns_business(business_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses
    WHERE id = business_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql;

-- Add a function to get contact requests for a business
CREATE OR REPLACE FUNCTION get_business_contacts(business_id uuid, status_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  type text,
  subject text,
  message text,
  contact_info jsonb,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  user_name text,
  user_email text,
  user_avatar text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id,
    cr.user_id,
    cr.type,
    cr.subject,
    cr.message,
    cr.contact_info,
    cr.status,
    cr.created_at,
    cr.updated_at,
    p.name as user_name,
    p.email as user_email,
    p.avatar_url as user_avatar
  FROM contact_requests cr
  JOIN profiles p ON cr.user_id = p.id
  WHERE 
    cr.business_id = get_business_contacts.business_id AND
    (status_filter IS NULL OR cr.status = status_filter)
  ORDER BY cr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add a function to update contact request status
CREATE OR REPLACE FUNCTION update_contact_request_status(request_id uuid, new_status text)
RETURNS boolean AS $$
DECLARE
  success boolean;
  business_id_val uuid;
BEGIN
  -- Get the business_id for the contact request
  SELECT business_id INTO business_id_val
  FROM contact_requests
  WHERE id = request_id;
  
  -- Check if the user owns this business
  IF NOT user_owns_business(business_id_val) THEN
    RETURN false;
  END IF;
  
  -- Update the status
  UPDATE contact_requests
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = request_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

-- Add a function to get business reviews
CREATE OR REPLACE FUNCTION get_business_reviews(business_id uuid, status_filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  rating integer,
  title text,
  comment text,
  status text,
  is_verified boolean,
  helpful_count integer,
  report_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  user_name text,
  user_email text,
  user_avatar text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.rating,
    r.title,
    r.comment,
    r.status,
    r.is_verified,
    r.helpful_count,
    r.report_count,
    r.created_at,
    r.updated_at,
    p.name as user_name,
    p.email as user_email,
    p.avatar_url as user_avatar
  FROM reviews r
  JOIN profiles p ON r.user_id = p.id
  WHERE 
    r.business_id = get_business_reviews.business_id AND
    (status_filter IS NULL OR r.status = status_filter)
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add a function to respond to a review
CREATE OR REPLACE FUNCTION respond_to_review(review_id uuid, response text)
RETURNS boolean AS $$
DECLARE
  success boolean;
  business_id_val uuid;
  current_metadata jsonb;
BEGIN
  -- Get the business_id for the review
  SELECT 
    business_id,
    metadata
  INTO 
    business_id_val,
    current_metadata
  FROM reviews
  WHERE id = review_id;
  
  -- Check if the user owns this business
  IF NOT user_owns_business(business_id_val) THEN
    RETURN false;
  END IF;
  
  -- Update the metadata with the response
  UPDATE reviews
  SET 
    metadata = jsonb_set(
      COALESCE(current_metadata, '{}'::jsonb),
      '{owner_response}',
      to_jsonb(jsonb_build_object(
        'text', response,
        'timestamp', now()
      ))
    ),
    updated_at = now()
  WHERE id = review_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

-- Add a function to get business offers
CREATE OR REPLACE FUNCTION get_business_offers(business_id uuid, active_only boolean DEFAULT false)
RETURNS SETOF offers AS $$
BEGIN
  RETURN QUERY
  SELECT o.*
  FROM offers o
  WHERE 
    o.business_id = get_business_offers.business_id AND
    (NOT active_only OR o.is_active = true)
  ORDER BY 
    o.is_active DESC,
    o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Add a function to get business hours
CREATE OR REPLACE FUNCTION get_business_hours(business_id uuid)
RETURNS SETOF business_hours AS $$
BEGIN
  RETURN QUERY
  SELECT bh.*
  FROM business_hours bh
  WHERE bh.business_id = get_business_hours.business_id
  ORDER BY bh.day_of_week;
END;
$$ LANGUAGE plpgsql;

-- Add a function to get business images
CREATE OR REPLACE FUNCTION get_business_images(business_id uuid)
RETURNS SETOF business_images AS $$
BEGIN
  RETURN QUERY
  SELECT bi.*
  FROM business_images bi
  WHERE bi.business_id = get_business_images.business_id
  ORDER BY 
    bi.is_primary DESC,
    bi.sort_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Add a function to check if a user can create a business
CREATE OR REPLACE FUNCTION can_create_business(user_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
  business_count integer;
  max_businesses integer;
  system_max_businesses integer;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  
  -- If not a business owner or admin, return false
  IF user_role NOT IN ('business_owner', 'admin', 'super_admin') THEN
    RETURN false;
  END IF;
  
  -- For admins, always allow
  IF user_role IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;
  
  -- Get current business count
  SELECT COUNT(*) INTO business_count
  FROM businesses
  WHERE owner_id = user_id;
  
  -- Get max businesses from system settings
  SELECT (settings->>'maxBusinessesPerUser')::integer INTO system_max_businesses
  FROM system_settings
  WHERE id = '00000000-0000-0000-0000-000000000000';
  
  max_businesses := COALESCE(system_max_businesses, 5);
  
  -- Check if under limit
  RETURN business_count < max_businesses;
END;
$$ LANGUAGE plpgsql;