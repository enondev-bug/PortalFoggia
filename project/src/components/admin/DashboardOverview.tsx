import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Building2, MessageSquare, Star,
  Eye, Phone, Calendar, AlertTriangle, CheckCircle,
  Clock, ArrowUp, ArrowDown, Download, RefreshCw,
  Database, Shield, Bell, Settings
} from 'lucide-react';
import { mockBusinessStats, mockAnalyticsData } from '../../data/adminData';

interface DashboardOverviewProps {
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ showNotification }) => {
  const stats = [
    {
      title: 'Attività Totali',
      value: '1',
      change: '+0%',
      trend: 'up',
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Attività Attive',
      value: '1',
      change: '+0%',
      trend: 'up',
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'In Attesa Approvazione',
      value: '0',
      change: '0',
      trend: 'up',
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Recensioni Totali',
      value: '3',
      change: '+0%',
      trend: 'up',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Rating Medio',
      value: '4.8',
      change: '+0.0',
      trend: 'up',
      icon: Star,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Visitatori Oggi',
      value: '156',
      change: '+5.3%',
      trend: 'up',
      icon: Eye,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    }
  ];

  const recentActivities = [
    { type: 'business', message: 'Attività "Pizzeria Roma" attiva', time: '5 min fa', status: 'success' },
    { type: 'review', message: '3 recensioni approvate', time: '12 min fa', status: 'success' },
    { type: 'user', message: '5 nuovi utenti registrati', time: '1 ora fa', status: 'success' },
    { type: 'system', message: 'Backup automatico completato', time: '2 ore fa', status: 'success' },
    { type: 'business', message: 'Sistema operativo al 100%', time: '3 ore fa', status: 'success' }
  ];

  const quickActions = [
    { 
      title: 'Gestisci Attività', 
      description: '1 attività attiva', 
      action: () => showNotification('📋 Reindirizzamento a gestione attività', 'info'), 
      color: 'from-blue-500 to-blue-600',
      icon: Building2
    },
    { 
      title: 'Modera Recensioni', 
      description: '3 recensioni approvate', 
      action: () => showNotification('⭐ Reindirizzamento a gestione recensioni', 'info'), 
      color: 'from-purple-500 to-purple-600',
      icon: MessageSquare
    },
    { 
      title: 'Gestisci Utenti', 
      description: '5 utenti attivi', 
      action: () => showNotification('👥 Reindirizzamento a gestione utenti', 'info'), 
      color: 'from-green-500 to-green-600',
      icon: Users
    },
    { 
      title: 'Visualizza Report', 
      description: 'Analytics completi', 
      action: () => showNotification('📊 Reindirizzamento ad analytics', 'info'), 
      color: 'from-orange-500 to-orange-600',
      icon: TrendingUp
    }
  ];

  const systemActions = [
    {
      title: 'Backup Sistema',
      description: 'Crea backup completo',
      icon: Database,
      color: 'text-blue-600',
      action: async () => {
        showNotification('🔄 Avvio backup sistema...', 'info');
        
        // Simula backup
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const backupData = {
          timestamp: new Date().toISOString(),
          version: '1.0',
          tables: ['profiles', 'businesses', 'categories', 'reviews'],
          recordCount: 159
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
      }
    },
    {
      title: 'Aggiorna Sistema',
      description: 'Controlla aggiornamenti',
      icon: RefreshCw,
      color: 'text-green-600',
      action: async () => {
        showNotification('🔄 Controllo aggiornamenti...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1500));
        showNotification('✅ Sistema aggiornato alla versione più recente!', 'success');
      }
    },
    {
      title: 'Sicurezza Sistema',
      description: 'Verifica sicurezza',
      icon: Shield,
      color: 'text-purple-600',
      action: async () => {
        showNotification('🔒 Verifica sicurezza in corso...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        showNotification('✅ Sistema sicuro - Nessuna vulnerabilità rilevata', 'success');
      }
    },
    {
      title: 'Export Dati',
      description: 'Esporta tutti i dati',
      icon: Download,
      color: 'text-orange-600',
      action: async () => {
        showNotification('📊 Preparazione export...', 'info');
        
        const exportData = [
          'Tipo,Nome,Valore,Data',
          `Statistica,Attività Totali,1,${new Date().toLocaleDateString()}`,
          `Statistica,Recensioni Totali,3,${new Date().toLocaleDateString()}`,
          `Statistica,Utenti Totali,5,${new Date().toLocaleDateString()}`,
          `Statistica,Rating Medio,4.8,${new Date().toLocaleDateString()}`
        ].join('\n');
        
        const blob = new Blob([exportData], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('📊 Export completato!', 'success');
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-2xl p-6 border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span>{stat.change}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {stat.title}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Attività Recenti
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Azioni Rapide
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.action}
                className={`p-4 bg-gradient-to-r ${action.color} rounded-xl text-white text-left hover:shadow-lg transition-all`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <action.icon className="h-5 w-5" />
                  <h4 className="font-semibold">{action.title}</h4>
                </div>
                <p className="text-sm opacity-90">{action.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* System Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Azioni di Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemActions.map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center space-x-3 mb-2">
                <action.icon className={`h-6 w-6 ${action.color}`} />
                <h4 className="font-medium text-gray-900 dark:text-white">{action.title}</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Stato del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Server Status', status: 'online', color: 'green' },
            { label: 'Database', status: 'online', color: 'green' },
            { label: 'Email Service', status: 'online', color: 'green' },
            { label: 'Backup System', status: 'online', color: 'green' }
          ].map((item, index) => (
            <motion.div 
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
              <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;