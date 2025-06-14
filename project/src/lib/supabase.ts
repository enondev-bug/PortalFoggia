import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Helper functions for common operations OTTIMIZZATE
const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
    return user;
  } catch (error) {
    console.error('Exception in getCurrentUser:', error);
    throw error;
  }
};

export const getCurrentProfile = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('No user found, returning null profile');
      return null;
    }
    
    console.log('🔍 Fetching profile for user:', user.id);
    
    // OTTIMIZZAZIONE: Query più veloce con timeout
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Timeout di 5 secondi per evitare attese infinite
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
    });
    
    const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;
      
    if (error) {
      console.error('Error fetching profile:', error);
      
      // Se il profilo non esiste, prova a crearlo usando la funzione del database
      if (error.code === 'PGRST116') {
        console.log('📝 Profile not found, attempting to create...');
        try {
          // Usa la funzione del database per creare il profilo
          const { data: createResult, error: createError } = await supabase.rpc(
            'ensure_user_profile', 
            { user_id: user.id }
          );
          
          if (createError) {
            console.error('Error creating profile via RPC:', createError);
            // Fallback: crea manualmente
            const { data: newProfile, error: manualError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email || '',
                name: user.user_metadata?.name || user.email || 'Utente',
                avatar_url: user.user_metadata?.avatar_url || null,
                role: 'user'
              })
              .select()
              .single();
              
            if (manualError) {
              console.error('Error creating profile manually:', manualError);
              throw manualError;
            }
            
            console.log('✅ Profile created manually:', newProfile?.name);
            return newProfile;
          }
          
          if (createResult) {
            // Ricarica il profilo dopo la creazione
            const { data: newProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
              
            if (fetchError) {
              console.error('Error fetching newly created profile:', fetchError);
              throw fetchError;
            }
            
            console.log('✅ Profile created via RPC and fetched:', newProfile?.name);
            return newProfile;
          }
        } catch (createError) {
          console.error('Failed to create profile:', createError);
          throw createError;
        }
      }
      
      throw error;
    }
    
    console.log('✅ Profile fetched successfully:', data?.name);
    return data;
  } catch (error) {
    console.error('Exception in getCurrentProfile:', error);
    throw error;
  }
};

export const updateUserProfile = async (updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    console.log('📝 Updating profile with:', updates);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      throw error;
    }

    console.log('✅ Profile updated successfully:', data?.name);
    return data;
  } catch (error) {
    console.error('Exception in updateUserProfile:', error);
    throw error;
  }
};

const signUp = async (email: string, password: string, name: string) => {
  try {
    console.log('📝 Signing up user:', email);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim()
        }
      }
    });
    
    if (error) {
      console.error('SignUp error:', error);
      throw error;
    }
    
    console.log('✅ SignUp successful:', data.user?.email);
    return data;
  } catch (error) {
    console.error('Exception in signUp:', error);
    throw error;
  }
};

const signIn = async (email: string, password: string) => {
  try {
    console.log('🔐 Signing in user:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    
    if (error) {
      console.error('SignIn error:', error);
      throw error;
    }
    
    console.log('✅ SignIn successful:', data.user?.email);
    return data;
  } catch (error) {
    console.error('Exception in signIn:', error);
    throw error;
  }
};

const signOut = async () => {
  try {
    console.log('🚪 Signing out user...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('SignOut error:', error);
      throw error;
    }
    console.log('✅ SignOut successful');
  } catch (error) {
    console.error('Exception in signOut:', error);
    throw error;
  }
};

// Debug functions
export const debugUserLogin = async (email: string) => {
  try {
    const { data, error } = await supabase.rpc('debug_user_login', { user_email: email });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Debug login error:', error);
    throw error;
  }
};

const createAdminUser = async (email: string, name?: string) => {
  try {
    const { data, error } = await supabase.rpc('create_admin_user', { 
      admin_email: email,
      admin_name: name || 'Admin User'
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Create admin error:', error);
    throw error;
  }
};

// Business operations
const getBusinesses = async (filters?: {
  category?: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from('businesses')
    .select(`
      *,
      category:categories(*),
      owner:profiles(*),
      business_images(*),
      offers(*)
    `)
    .eq('status', 'active')
    .order('rating', { ascending: false });

  if (filters?.category && filters.category !== 'Tutti') {
    query = query.eq('categories.name', filters.category);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const getBusiness = async (id: string) => {
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(*),
      owner:profiles(*),
      business_images(*),
      business_hours(*),
      offers(*),
      reviews(*, user:profiles(*))
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

// Reviews operations
const createReview = async (review: {
  business_id: string;
  rating: number;
  title?: string;
  comment: string;
}) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      ...review,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getReviews = async (businessId: string) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('business_id', businessId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Favorites operations
const toggleFavorite = async (businessId: string) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('business_id', businessId)
    .single();

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', existing.id);
    
    if (error) throw error;
    return false;
  } else {
    // Add favorite
    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        business_id: businessId
      });
    
    if (error) throw error;
    return true;
  }
};

const getUserFavorites = async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      business:businesses(*)
    `)
    .eq('user_id', user.id);

  if (error) throw error;
  return data;
};

// Contact requests
const createContactRequest = async (request: {
  business_id: string;
  type: 'info' | 'booking' | 'quote' | 'complaint';
  subject?: string;
  message: string;
  contact_info?: any;
}) => {
  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('contact_requests')
    .insert({
      ...request,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Admin operations
const getAdminStats = async () => {
  const [
    { count: totalBusinesses },
    { count: activeBusinesses },
    { count: pendingBusinesses },
    { count: totalReviews },
    { count: totalUsers }
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
  ]);

  return {
    totalBusinesses: totalBusinesses || 0,
    activeBusinesses: activeBusinesses || 0,
    pendingBusinesses: pendingBusinesses || 0,
    totalReviews: totalReviews ||  0,
    totalUsers: totalUsers || 0
  };
};

const updateBusinessStatus = async (businessId: string, status: string) => {
  const { data, error } = await supabase
    .from('businesses')
    .update({ status })
    .eq('id', businessId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateReviewStatus = async (reviewId: string, status: string) => {
  const { data, error } = await supabase
    .from('reviews')
    .update({ status })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Business creation for admin
const createBusiness = async (businessData: {
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  category_id: string;
  address: string;
  city: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  owner_id: string;
  status?: string;
  subscription_plan?: string;
  is_featured?: boolean;
  is_verified?: boolean;
}) => {
  const { data, error } = await supabase
    .from('businesses')
    .insert(businessData)
    .select(`
      *,
      category:categories(name, color),
      owner:profiles(name, email, phone)
    `)
    .single();

  if (error) throw error;
  return data;
};

// Profile creation for business owners
const createBusinessOwnerProfile = async (profileData: {
  email: string;
  name: string;
  phone?: string;
  role?: string;
  is_verified?: boolean;
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      ...profileData,
      role: profileData.role || 'business_owner'
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
};