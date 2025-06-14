import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireApproval: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  analyticsEnabled: boolean;
  maxBusinessesPerUser: number;
  reviewModerationEnabled: boolean;
  profanityFilterEnabled: boolean;
  dataRetentionDays: number;
  privacyPolicyUrl: string;
  termsUrl: string;
  debugMode: boolean;
  apiRateLimit: number;
  userTracking: boolean;
  ipMasking: boolean;
  require2FA: boolean;
  forceHttps: boolean;
  bruteForceProtection: boolean;
  advancedCaching: boolean;
  imageCompression: boolean;
  lazyLoading: boolean;
  minifyAssets: boolean;
}

interface SettingsState {
  settings: SystemSettings;
  originalSettings: SystemSettings;
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'Business Hub',
  siteDescription: 'La piattaforma completa per scoprire le migliori attività locali',
  maintenanceMode: false,
  allowRegistrations: true,
  requireApproval: true,
  emailNotifications: true,
  smsNotifications: false,
  analyticsEnabled: true,
  maxBusinessesPerUser: 5,
  reviewModerationEnabled: true,
  profanityFilterEnabled: true,
  dataRetentionDays: 90,
  privacyPolicyUrl: '/privacy',
  termsUrl: '/terms',
  debugMode: false,
  apiRateLimit: 60,
  userTracking: true,
  ipMasking: true,
  require2FA: false,
  forceHttps: true,
  bruteForceProtection: true,
  advancedCaching: true,
  imageCompression: true,
  lazyLoading: true,
  minifyAssets: true
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  originalSettings: { ...DEFAULT_SETTINGS },
  isLoading: true,
  isSaving: false,
  hasChanges: false,
  error: null,
  
  loadSettings: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Prova a caricare dal localStorage per velocità
      const cachedSettings = localStorage.getItem('system_settings');
      if (cachedSettings) {
        const parsedSettings = JSON.parse(cachedSettings);
        set({ 
          settings: { ...DEFAULT_SETTINGS, ...parsedSettings },
          originalSettings: { ...DEFAULT_SETTINGS, ...parsedSettings },
          isLoading: false,
          hasChanges: false
        });
        console.log('✅ Settings loaded from localStorage');
      }
      
      // Carica da Supabase
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        // Se non ci sono impostazioni, crea quelle di default
        if (error.code === 'PGRST116') {
          console.log('🆕 No settings found, creating defaults');
          await get().saveSettings();
          return;
        }
        
        throw error;
      }
      
      // Aggiorna lo stato con le impostazioni dal database
      const loadedSettings = data.settings as SystemSettings;
      
      set({ 
        settings: { ...DEFAULT_SETTINGS, ...loadedSettings },
        originalSettings: { ...DEFAULT_SETTINGS, ...loadedSettings },
        isLoading: false,
        hasChanges: false
      });
      
      // Aggiorna anche la cache locale
      localStorage.setItem('system_settings', JSON.stringify(loadedSettings));
      
      console.log('✅ Settings loaded from database');
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      set({ 
        error: 'Errore nel caricamento delle impostazioni',
        isLoading: false,
        settings: { ...DEFAULT_SETTINGS },
        originalSettings: { ...DEFAULT_SETTINGS }
      });
    }
  },
  
  updateSetting: (key, value) => {
    set(state => {
      const newSettings = { ...state.settings, [key]: value };
      
      // Calcola se ci sono modifiche
      const hasChanges = Object.keys(newSettings).some(
        k => newSettings[k as keyof SystemSettings] !== state.originalSettings[k as keyof SystemSettings]
      );
      
      return { 
        settings: newSettings,
        hasChanges
      };
    });
  },
  
  saveSettings: async () => {
    const state = get();
    
    if (!state.hasChanges) {
      return;
    }
    
    try {
      set({ isSaving: true, error: null });
      
      // Salva nel database
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000000', // ID fisso per le impostazioni
          settings: state.settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Aggiorna lo stato
      set({ 
        originalSettings: { ...state.settings },
        hasChanges: false,
        isSaving: false
      });
      
      // Aggiorna la cache locale
      localStorage.setItem('system_settings', JSON.stringify(state.settings));
      
      console.log('✅ Settings saved to database');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      set({ 
        error: 'Errore nel salvataggio delle impostazioni',
        isSaving: false
      });
      throw error;
    }
  },
  
  resetSettings: () => {
    set({ 
      settings: { ...DEFAULT_SETTINGS },
      hasChanges: true
    });
  }
}));