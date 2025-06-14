import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, getCurrentProfile, updateUserProfile, debugUserLogin } from '../lib/supabase';
import { Database } from '../types/database';
import { analytics } from '../lib/analytics';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Timeout di sicurezza ridotto per UX più veloce
        const timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn('⚠️ Auth initialization timeout');
            setLoading(false);
            setAuthInitialized(true);
          }
        }, 3000); // Ridotto da 8s a 3s

        // Ottieni la sessione corrente
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            setAuthInitialized(true);
          }
          clearTimeout(timeoutId);
          return;
        }

        console.log('📋 Initial session:', {
          hasSession: !!session,
          userEmail: session?.user?.email
        });

        if (mounted) {
          setUser(session?.user ?? null);
        }

        // Carica il profilo se c'è un utente - OTTIMIZZATO
        if (session?.user && mounted) {
          try {
            console.log('👤 Loading initial profile...');
            const userProfile = await getCurrentProfile();
            
            if (mounted) {
              setProfile(userProfile);
              console.log('✅ Initial profile loaded:', userProfile?.name);
              
              // Debug: verifica ruolo
              if (userProfile?.role) {
                console.log('🔑 User role:', userProfile.role);
              } else {
                console.warn('⚠️ User has no role assigned');
              }
            }
          } catch (profileError) {
            console.error('❌ Initial profile error:', profileError);
            if (mounted) {
              setProfile(null);
            }
          }
        }

        // Setup auth state listener OTTIMIZZATO
        authSubscription = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            console.log('🔄 Auth state change:', {
              event,
              hasSession: !!session,
              userEmail: session?.user?.email
            });

            // OTTIMIZZAZIONE: Gestione immediata degli stati
            if (event === 'SIGNED_OUT') {
              console.log('🚪 User signed out - clearing state and redirecting');
              setUser(null);
              setProfile(null);
              
              // FORZA IL REINDIRIZZAMENTO ALLA HOME IMMEDIATAMENTE
              console.log('🏠 Forcing redirect to home...');
              window.location.replace('/');
              return;
            }

            // OTTIMIZZAZIONE: Aggiorna immediatamente l'utente
            setUser(session?.user ?? null);

            // OTTIMIZZAZIONE: Carica profilo solo per login/refresh
            if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
              try {
                console.log('👤 Loading profile after auth change...');
                
                // CARICAMENTO PARALLELO per velocità
                const profilePromise = getCurrentProfile();
                
                const userProfile = await profilePromise;
                if (mounted) {
                  setProfile(userProfile);
                  console.log('✅ Profile loaded after auth change:', userProfile?.name);
                  
                  // Debug: verifica ruolo
                  if (userProfile?.role) {
                    console.log('🔑 User role after auth change:', userProfile.role);
                  } else {
                    console.warn('⚠️ User has no role assigned after auth change');
                  }
                }
              } catch (error) {
                console.error('❌ Profile error after auth change:', error);
                if (mounted) {
                  setProfile(null);
                }
              }
            }
          }
        );

        if (mounted) {
          setLoading(false);
          setAuthInitialized(true);
        }
        
        clearTimeout(timeoutId);
        
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Login attempt for:', email);
      
      // Debug login prima del tentativo
      try {
        const debugInfo = await debugUserLogin(email);
        console.log('🔍 Debug login info:', debugInfo);
      } catch (debugError) {
        console.warn('⚠️ Debug login check failed:', debugError);
      }
      
      // OTTIMIZZAZIONE: Non impostare loading qui per UX più veloce
      // setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      
      if (error) {
        console.error('❌ Login error:', error.message);
        return false;
      }
      
      if (data.user) {
        console.log('✅ Login successful for:', data.user.email);
        
        // OTTIMIZZAZIONE: Aggiorna immediatamente lo stato utente
        setUser(data.user);
        
        // OTTIMIZZAZIONE: Carica profilo in parallelo
        try {
          const userProfile = await getCurrentProfile();
          setProfile(userProfile);
          console.log('✅ Profile loaded immediately after login:', userProfile?.name);
          
          // Debug: verifica ruolo
          if (userProfile?.role) {
            console.log('🔑 User role after login:', userProfile.role);
          } else {
            console.warn('⚠️ User has no role assigned after login');
          }
          
          // 📊 TRACCIA LOGIN
          await analytics.trackEvent('user_login', 'user', {
            login_method: 'email_password',
            user_role: userProfile?.role || 'user'
          });
          
        } catch (profileError) {
          console.error('❌ Profile load error after login:', profileError);
          // Non bloccare il login se il profilo fallisce
        }
        
        return true;
      }
      
      console.log('❌ Login failed: no user returned');
      return false;
    } catch (error) {
      console.error('❌ Login exception:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log('📝 Registration attempt for:', email);
      
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
        console.error('❌ Registration error:', error.message);
        return false;
      }
      
      if (data.user) {
        console.log('✅ Registration successful for:', data.user.email);
        
        // OTTIMIZZAZIONE: Aggiorna immediatamente lo stato
        setUser(data.user);
        
        // Il profilo verrà creato automaticamente dal trigger
        // Prova a caricarlo immediatamente
        try {
          // Piccolo delay per permettere al trigger di completare
          setTimeout(async () => {
            try {
              const userProfile = await getCurrentProfile();
              setProfile(userProfile);
              console.log('✅ Profile loaded after registration:', userProfile?.name);
              
              // 📊 TRACCIA REGISTRAZIONE
              await analytics.trackUserRegistration(data.user.id, 'email_password');
              
            } catch (error) {
              console.log('⏳ Profile not ready yet, will be loaded by auth listener');
            }
          }, 500);
        } catch (error) {
          console.log('⏳ Profile will be loaded by auth listener');
        }
        
        return true;
      }
      
      console.log('❌ Registration failed: no user returned');
      return false;
    } catch (error) {
      console.error('❌ Registration exception:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Pulisci immediatamente lo stato locale per UX rapida
      setUser(null);
      setProfile(null);
      
      // Esegui il logout da Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        // Non lanciare errore, mantieni lo stato pulito
      }
      
      console.log('✅ Logout completed - forcing immediate redirect');
      
      // FORZA IL REINDIRIZZAMENTO IMMEDIATO ALLA HOME
      window.location.replace('/');
      
    } catch (error) {
      console.error('❌ Logout exception:', error);
      // Mantieni comunque lo stato pulito
      setUser(null);
      setProfile(null);
      
      // Reindirizza comunque alla home
      console.log('🏠 Forcing redirect after error');
      window.location.replace('/');
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('📝 Updating profile...');
      const updatedProfile = await updateUserProfile(updates);
      
      console.log('✅ Profile updated successfully');
      setProfile(updatedProfile);
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
  };

  // OTTIMIZZAZIONE: Calcolo più efficiente dello stato autenticato
  const isAuthenticated = !!user && !!profile && authInitialized;

  const value = {
    user,
    profile,
    loading: loading || !authInitialized,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile
  };

  // Debug log ottimizzato per sviluppo
  if (import.meta.env.DEV) {
    console.log('🔍 Auth State:', {
      hasUser: !!user,
      hasProfile: !!profile,
      isAuthenticated,
      loading: loading || !authInitialized,
      authInitialized,
      userEmail: user?.email,
      profileName: profile?.name,
      profileRole: profile?.role
    });
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};