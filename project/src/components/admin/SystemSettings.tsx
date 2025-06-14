import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, RefreshCw, Shield, Mail, Bell, Database,
  Globe, Users, MessageSquare, Settings as SettingsIcon,
  CheckCircle, AlertCircle, Server, Wifi, HardDrive,
  Download, Upload, Trash2, Lock, Eye, EyeOff, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettingsStore } from '../../stores/settingsStore';

interface SystemSettingsProps {
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ showNotification }) => {
  const { 
    settings, 
    isLoading, 
    hasChanges, 
    isSaving,
    loadSettings, 
    updateSetting, 
    saveSettings, 
    resetSettings 
  } = useSettingsStore();
  
  const [systemStatus, setSystemStatus] = useState({
    database: 'online',
    storage: 'online',
    auth: 'online',
    api: 'online'
  });

  useEffect(() => {
    loadSettings();
    checkSystemStatus();
  }, [loadSettings]);

  const checkSystemStatus = async () => {
    try {
      // Verifica stato database
      const { data: dbCheck, error: dbError } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1);
      
      // Verifica stato storage
      const { data: storageCheck, error: storageError } = await supabase.storage
        .from('avatars')
        .list('', { limit: 1 });
      
      // Verifica stato auth
      const { data: authCheck, error: authError } = await supabase.auth.getSession();
      
      setSystemStatus({
        database: dbError ? 'error' : 'online',
        storage: storageError ? 'error' : 'online',
        auth: authError ? 'error' : 'online',
        api: 'online' // Sempre online per ora
      });
      
    } catch (error) {
      console.error('❌ System status check error:', error);
      setSystemStatus({
        database: 'error',
        storage: 'error',
        auth: 'error',
        api: 'error'
      });
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    updateSetting(key, value);
  };

  const handleSave = async () => {
    try {
      await saveSettings();
      showNotification('✅ Impostazioni salvate con successo!', 'success');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      showNotification('❌ Errore nel salvataggio delle impostazioni', 'warning');
    }
  };

  const handleReset = () => {
    resetSettings();
    showNotification('🔄 Impostazioni ripristinate ai valori di default', 'info');
  };

  const handleBackupDatabase = async () => {
    try {
      showNotification('🔄 Avvio backup sistema...', 'info');
      
      // Ottieni dati per il backup
      const [
        { data: settingsData },
        { data: profilesData },
        { data: businessesData },
        { data: categoriesData },
        { data: reviewsData }
      ] = await Promise.all([
        supabase.from('system_settings').select('*'),
        supabase.from('profiles').select('*').limit(100),
        supabase.from('businesses').select('*').limit(100),
        supabase.from('categories').select('*'),
        supabase.from('reviews').select('*').limit(100)
      ]);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        settings: settingsData,
        data: {
          profiles: profilesData,
          businesses: businessesData,
          categories: categoriesData,
          reviews: reviewsData
        },
        metadata: {
          profiles_count: profilesData?.length || 0,
          businesses_count: businessesData?.length || 0,
          categories_count: categoriesData?.length || 0,
          reviews_count: reviewsData?.length || 0
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showNotification('✅ Backup completato e scaricato!', 'success');
    } catch (error) {
      console.error('❌ Backup error:', error);
      showNotification('❌ Errore durante il backup', 'warning');
    }
  };

  const handleClearCache = async () => {
    try {
      showNotification('🔄 Pulizia cache in corso...', 'info');
      
      // Pulisci cache del browser
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Pulisci localStorage (eccetto le impostazioni)
      const settingsData = localStorage.getItem('system_settings');
      localStorage.clear();
      if (settingsData) {
        localStorage.setItem('system_settings', settingsData);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('✅ Cache pulita con successo!', 'success');
    } catch (error) {
      console.error('❌ Cache clear error:', error);
      showNotification('❌ Errore durante la pulizia cache', 'warning');
    }
  };

  const handleExportData = async () => {
    try {
      showNotification('📊 Preparazione export dati...', 'info');
      
      // Ottieni dati per l'export
      const { data: stats } = await supabase
        .from('analytics_daily_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      
      const csvRows = [
        'Data,Visitatori,Visualizzazioni,Sessioni,Business Views,Contatti,Ricerche,Registrazioni,Recensioni'
      ];
      
      stats?.forEach(day => {
        csvRows.push(
          `${day.date},${day.unique_visitors},${day.page_views},${day.sessions},${day.business_views},${day.business_contacts},${day.searches},${day.registrations},${day.reviews}`
        );
      });
      
      const csvContent = csvRows.join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showNotification('📊 Export completato!', 'success');
    } catch (error) {
      console.error('❌ Export error:', error);
      showNotification('❌ Errore durante l\'export', 'warning');
    }
  };

  const handleSystemReset = async () => {
    if (!confirm('⚠️ ATTENZIONE: Questa azione resetterà TUTTE le impostazioni di sistema e non può essere annullata. Sei sicuro di voler continuare?')) {
      return;
    }
    
    if (!confirm('🚨 ULTIMA CONFERMA: Tutti i dati delle impostazioni verranno persi. Confermi il reset completo del sistema?')) {
      return;
    }
    
    try {
      showNotification('🔄 Reset sistema in corso...', 'info');
      
      // Reset completo delle impostazioni
      const { error } = await supabase
        .from('system_settings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      
      // Reset localStorage
      localStorage.removeItem('system_settings');
      
      // Ricarica impostazioni di default
      await loadSettings();
      
      showNotification('✅ Sistema resettato alle impostazioni di fabbrica', 'success');
    } catch (error) {
      console.error('❌ System reset error:', error);
      showNotification('❌ Errore durante il reset del sistema', 'warning');
    }
  };

  const settingSections = [
    {
      title: 'Impostazioni Generali',
      icon: Globe,
      settings: [
        {
          key: 'siteName',
          label: 'Nome del Sito',
          type: 'text',
          description: 'Il nome principale della piattaforma'
        },
        {
          key: 'siteDescription',
          label: 'Descrizione del Sito',
          type: 'textarea',
          description: 'Breve descrizione della piattaforma'
        },
        {
          key: 'maintenanceMode',
          label: 'Modalità Manutenzione',
          type: 'toggle',
          description: 'Attiva la modalità manutenzione per il sito'
        }
      ]
    },
    {
      title: 'Gestione Utenti',
      icon: Users,
      settings: [
        {
          key: 'allowRegistrations',
          label: 'Consenti Registrazioni',
          type: 'toggle',
          description: 'Permetti a nuovi utenti di registrarsi'
        },
        {
          key: 'requireApproval',
          label: 'Richiedi Approvazione',
          type: 'toggle',
          description: 'Le nuove attività richiedono approvazione admin'
        },
        {
          key: 'maxBusinessesPerUser',
          label: 'Max Attività per Utente',
          type: 'number',
          description: 'Numero massimo di attività per utente'
        }
      ]
    },
    {
      title: 'Notifiche',
      icon: Bell,
      settings: [
        {
          key: 'emailNotifications',
          label: 'Notifiche Email',
          type: 'toggle',
          description: 'Invia notifiche via email'
        },
        {
          key: 'smsNotifications',
          label: 'Notifiche SMS',
          type: 'toggle',
          description: 'Invia notifiche via SMS'
        }
      ]
    },
    {
      title: 'Moderazione',
      icon: MessageSquare,
      settings: [
        {
          key: 'reviewModerationEnabled',
          label: 'Moderazione Recensioni',
          type: 'toggle',
          description: 'Le recensioni richiedono approvazione'
        },
        {
          key: 'profanityFilterEnabled',
          label: 'Filtro Contenuti',
          type: 'toggle',
          description: 'Filtra automaticamente contenuti inappropriati'
        }
      ]
    },
    {
      title: 'Privacy e Sicurezza',
      icon: Shield,
      settings: [
        {
          key: 'dataRetentionDays',
          label: 'Conservazione Dati (giorni)',
          type: 'number',
          description: 'Giorni di conservazione dati analytics'
        },
        {
          key: 'privacyPolicyUrl',
          label: 'URL Privacy Policy',
          type: 'text',
          description: 'Link alla privacy policy'
        },
        {
          key: 'termsUrl',
          label: 'URL Termini di Servizio',
          type: 'text',
          description: 'Link ai termini di servizio'
        }
      ]
    },
    {
      title: 'Sistema',
      icon: Database,
      settings: [
        {
          key: 'analyticsEnabled',
          label: 'Analytics Abilitati',
          type: 'toggle',
          description: 'Raccolta dati analytics'
        },
        {
          key: 'debugMode',
          label: 'Modalità Debug',
          type: 'toggle',
          description: 'Abilita logging avanzato'
        },
        {
          key: 'apiRateLimit',
          label: 'Limite API (richieste/min)',
          type: 'number',
          description: 'Limite richieste API per utente'
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      default: return AlertCircle;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento impostazioni...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Impostazioni Sistema
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configura le impostazioni globali della piattaforma
          </p>
        </div>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Ripristina</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              hasChanges && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salva Modifiche</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* System Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Stato del Sistema
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={checkSystemStatus}
            className="ml-auto p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Aggiorna stato"
          >
            <RefreshCw className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { key: 'database', label: 'Database', icon: Database },
            { key: 'storage', label: 'Storage', icon: HardDrive },
            { key: 'auth', label: 'Autenticazione', icon: Shield },
            { key: 'api', label: 'API', icon: Server }
          ].map((service, index) => {
            const status = systemStatus[service.key as keyof typeof systemStatus];
            const StatusIcon = getStatusIcon(status);
            
            return (
              <motion.div
                key={service.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <service.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {service.label}
                    </span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                </div>
                <div className="flex items-center space-x-1">
                  <StatusIcon className={`h-4 w-4 ${
                    status === 'online' ? 'text-green-600' : 
                    status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    status === 'online' ? 'text-green-600' : 
                    status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {status === 'online' ? 'Online' : 
                     status === 'warning' ? 'Attenzione' : 'Errore'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settingSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <section.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {section.title}
              </h3>
            </div>

            <div className="space-y-6">
              {section.settings.map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {setting.label}
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {setting.description}
                    </p>
                  </div>
                  <div className="ml-4">
                    {setting.type === 'toggle' && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSettingChange(setting.key, !settings[setting.key])}
                        disabled={isSaving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                          settings[setting.key] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </motion.button>
                    )}
                    {setting.type === 'text' && (
                      <input
                        type="text"
                        value={settings[setting.key] as string}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        disabled={isSaving}
                        className="w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    )}
                    {setting.type === 'textarea' && (
                      <textarea
                        value={settings[setting.key] as string}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        disabled={isSaving}
                        rows={3}
                        className="w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    )}
                    {setting.type === 'number' && (
                      <input
                        type="number"
                        value={settings[setting.key] as number}
                        onChange={(e) => handleSettingChange(setting.key, parseInt(e.target.value))}
                        disabled={isSaving}
                        min="1"
                        max="100"
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Advanced Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Azioni Rapide
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackupDatabase}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Backup Database</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Crea un backup completo del database</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClearCache}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Pulizia Sistema</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rimuovi dati temporanei e cache</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportData}
            className="p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <Download className="h-6 w-6 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Export Dati</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Esporta statistiche in formato CSV</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSystemReset}
            className="p-4 border border-red-300 dark:border-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-300">Reset Sistema</h4>
                <p className="text-sm text-red-600 dark:text-red-400">Ripristina tutte le impostazioni di fabbrica</p>
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Security Audit */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sicurezza e Privacy
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Impostazioni Privacy</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tracciamento Utenti</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Raccolta dati comportamentali</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('userTracking', !settings.userTracking)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.userTracking ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.userTracking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Conservazione Dati</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Periodo di conservazione logs</p>
              </div>
              <select
                value={settings.dataRetentionDays}
                onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="30">30 giorni</option>
                <option value="60">60 giorni</option>
                <option value="90">90 giorni</option>
                <option value="180">180 giorni</option>
                <option value="365">1 anno</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Mascheramento IP</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Anonimizza indirizzi IP</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('ipMasking', !settings.ipMasking)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.ipMasking ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.ipMasking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Sicurezza</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">2FA Obbligatorio</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Per admin e business owner</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('require2FA', !settings.require2FA)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.require2FA ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.require2FA ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Forza HTTPS</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Reindirizza HTTP a HTTPS</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('forceHttps', !settings.forceHttps)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.forceHttps ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.forceHttps ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Protezione Brute Force</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Limita tentativi di login</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('bruteForceProtection', !settings.bruteForceProtection)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.bruteForceProtection ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.bruteForceProtection ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Performance Optimization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ottimizzazione Performance
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Caching Avanzato</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Cache lato server</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('advancedCaching', !settings.advancedCaching)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.advancedCaching ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.advancedCaching ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Compressione Immagini</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ottimizza automaticamente</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('imageCompression', !settings.imageCompression)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.imageCompression ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.imageCompression ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Lazy Loading</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Caricamento progressivo</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('lazyLoading', !settings.lazyLoading)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.lazyLoading ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.lazyLoading ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Minificazione Assets</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ottimizza JS e CSS</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSettingChange('minifyAssets', !settings.minifyAssets)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.minifyAssets ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.minifyAssets ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Changes Indicator */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-xl shadow-lg z-50"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Modifiche non salvate</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SystemSettings;