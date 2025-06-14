import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Eye, Phone, Heart, Calendar,
  ArrowUp, ArrowDown, RefreshCw, Download,
  BarChart3, PieChart, Users, Search, Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessAnalyticsProps {
  business: any;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessAnalytics: React.FC<BusinessAnalyticsProps> = ({ 
  business, 
  showNotification 
}) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (business?.id) {
      loadAnalytics();
    }
  }, [business?.id, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      const { data, error } = await supabase.rpc('get_business_analytics', {
        business_id: business.id,
        days_back: daysBack
      });

      if (error) throw error;

      setAnalytics(data);
      console.log('✅ Loaded business analytics:', data);
    } catch (error) {
      console.error('❌ Error loading business analytics:', error);
      showNotification('❌ Errore nel caricamento delle analytics', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAnalytics();
    showNotification('🔄 Dati aggiornati', 'success');
  };

  const handleExportData = () => {
    try {
      if (!analytics || !analytics.daily) {
        showNotification('❌ Nessun dato da esportare', 'warning');
        return;
      }
      
      // Prepara i dati per l'export
      const csvRows = [
        'Data,Visualizzazioni,Contatti,Preferiti'
      ];
      
      analytics.daily.forEach((day: any) => {
        csvRows.push(`${day.date},${day.views || 0},${day.contacts || 0},${day.favorites || 0}`);
      });
      
      // Aggiungi totali
      csvRows.push('');
      csvRows.push(`Totali,${analytics.totals.views || 0},${analytics.totals.contacts || 0},${analytics.totals.favorites || 0}`);
      csvRows.push(`Tasso di Conversione,${analytics.conversion_rate || 0}%,,`);
      
      const csvContent = csvRows.join('\n');
      
      // Crea e scarica il file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_${business.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('✅ Dati esportati con successo', 'success');
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      showNotification('❌ Errore nell\'esportazione dei dati', 'warning');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Dati non disponibili
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Non ci sono ancora dati analytics per questa attività
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefresh}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2 inline-block" />
          Aggiorna
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics & Statistiche
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analisi dettagliata delle performance di {business.name}
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Ultimi 7 giorni</option>
            <option value="30d">Ultimi 30 giorni</option>
            <option value="90d">Ultimi 90 giorni</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Aggiorna</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Esporta</span>
          </motion.button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Visualizzazioni',
            value: analytics.totals.views || 0,
            change: '+5.2%',
            trend: 'up',
            icon: Eye,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20'
          },
          {
            title: 'Contatti',
            value: analytics.totals.contacts || 0,
            change: `${analytics.conversion_rate || 0}% conversione`,
            trend: 'up',
            icon: Phone,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50 dark:bg-green-900/20'
          },
          {
            title: 'Preferiti',
            value: analytics.totals.favorites || 0,
            change: '+12.3%',
            trend: 'up',
            icon: Heart,
            color: 'from-red-500 to-red-600',
            bgColor: 'bg-red-50 dark:bg-red-900/20'
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${metric.bgColor} rounded-2xl p-6 border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center`}>
                <metric.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center space-x-1 text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span>{metric.change}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {metric.value.toLocaleString()}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {metric.title}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Over Time */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Visualizzazioni nel Tempo
          </h3>
          
          <div className="h-64 flex items-end space-x-1">
            {analytics.daily && analytics.daily.map((day: any, index: number) => {
              const maxValue = Math.max(...analytics.daily.map((d: any) => d.views || 0));
              const height = maxValue > 0 ? ((day.views || 0) / maxValue) * 100 : 0;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="w-full bg-blue-500 rounded-t-md"
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-top-left">
                    {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Conversion Funnel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            Funnel di Conversione
          </h3>
          
          <div className="space-y-6">
            {[
              { stage: 'Visualizzazioni', value: analytics.totals.views || 0, percentage: 100, color: 'bg-blue-500' },
              { stage: 'Contatti', value: analytics.totals.contacts || 0, percentage: analytics.conversion_rate || 0, color: 'bg-green-500' },
              { stage: 'Preferiti', value: analytics.totals.favorites || 0, percentage: analytics.totals.views ? (analytics.totals.favorites / analytics.totals.views) * 100 : 0, color: 'bg-red-500' }
            ].map((stage, index) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {stage.stage}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stage.value.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.percentage}%` }}
                    transition={{ delay: index * 0.2, duration: 0.8 }}
                    className={`h-2.5 rounded-full ${stage.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Daily Stats Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Statistiche Giornaliere
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Visualizzazioni</th>
                <th className="px-4 py-3">Contatti</th>
                <th className="px-4 py-3">Preferiti</th>
                <th className="px-4 py-3">Tasso Conversione</th>
              </tr>
            </thead>
            <tbody>
              {analytics.daily && analytics.daily.map((day: any) => {
                const conversionRate = day.views > 0 ? ((day.contacts || 0) / day.views) * 100 : 0;
                
                return (
                  <tr key={day.date} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {day.views || 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {day.contacts || 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {day.favorites || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        conversionRate > 5 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : conversionRate > 0
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                      }`}>
                        {conversionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6"
      >
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3">
              💡 Consigli per Migliorare le Performance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
              <div>
                <h5 className="font-semibold mb-2">🔍 Aumenta la Visibilità:</h5>
                <ul className="space-y-1">
                  <li>• Mantieni aggiornate le informazioni</li>
                  <li>• Aggiungi foto di qualità</li>
                  <li>• Crea offerte speciali regolarmente</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">📈 Migliora le Conversioni:</h5>
                <ul className="space-y-1">
                  <li>• Rispondi rapidamente alle recensioni</li>
                  <li>• Offri incentivi per i contatti</li>
                  <li>• Monitora i picchi di visualizzazioni</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BusinessAnalytics;