import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, Eye, Search, Phone, Calendar,
  ArrowUp, ArrowDown, BarChart3, PieChart, Download,
  RefreshCw, Filter, MapPin, Star, MessageSquare,
  Activity, Clock, Globe, Smartphone, Monitor,
  Tablet, Zap, Target, Award, Flame
} from 'lucide-react';
import { useAnalytics } from '../../lib/analytics';

interface AnalyticsDashboardProps {
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ showNotification }) => {
  const { getAnalyticsMetrics, getRealTimeMetrics } = useAnalytics();
  const [analytics, setAnalytics] = useState<any>(null);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'behavior' | 'conversions'>('overview');

  useEffect(() => {
    loadAnalytics();
    loadRealTimeData();
    
    // Aggiorna dati real-time ogni 30 secondi
    const interval = setInterval(loadRealTimeData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const data = await getAnalyticsMetrics(timeRange);
      setAnalytics(data);
      
      console.log('✅ Analytics loaded:', data);
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      showNotification('❌ Errore nel caricamento delle analytics', 'warning');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRealTimeData = async () => {
    try {
      const data = await getRealTimeMetrics();
      setRealTimeData(data);
    } catch (error) {
      console.error('❌ Error loading real-time data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    await loadRealTimeData();
    showNotification('🔄 Dati aggiornati', 'success');
  };

  const exportReport = () => {
    if (!analytics) return;
    
    try {
      const reportData = {
        'Periodo': timeRange === '7d' ? 'Ultimi 7 giorni' : timeRange === '30d' ? 'Ultimi 30 giorni' : 'Ultimi 90 giorni',
        'Data Generazione': new Date().toLocaleDateString(),
        'Visitatori Unici': analytics.visitors.unique,
        'Visualizzazioni Pagina': analytics.pageViews.total,
        'Sessioni': analytics.visitors.total,
        'Frequenza Rimbalzo': `${analytics.pageViews.bounceRate * 100}%`,
        'Durata Media Sessione': `${analytics.pageViews.averagePerSession} min`,
        'Visualizzazioni Business': analytics.businesses.totalViews,
        'Contatti Business': analytics.businesses.totalContacts,
        'Tasso Conversione': `${analytics.businesses.conversionRate}%`,
        'Ricerche Totali': analytics.searches.total,
        'Parole Chiave Uniche': analytics.searches.unique,
        'Ricerche Senza Risultati': analytics.searches.noResults,
        'Nuove Registrazioni': analytics.users.totalRegistrations,
        'Utenti Attivi': analytics.users.activeUsers,
        'Recensioni Totali': analytics.reviews.total,
        'Rating Medio': analytics.reviews.averageRating,
        'Desktop': `${analytics.devices.desktop}%`,
        'Mobile': `${analytics.devices.mobile}%`,
        'Tablet': `${analytics.devices.tablet}%`
      };

      const csv = [
        'Metrica,Valore',
        ...Object.entries(reportData).map(([key, value]) => `${key},${value}`)
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_report_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showNotification('📊 Report esportato con successo', 'success');
    } catch (error) {
      console.error('❌ Export error:', error);
      showNotification('❌ Errore durante l\'export', 'warning');
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
          Errore nel caricamento
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Non è stato possibile caricare i dati analytics
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={loadAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Riprova
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
            📊 Analytics Avanzate
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoraggio completo delle performance della piattaforma
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
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Esporta</span>
          </motion.button>
        </div>
      </div>

      {/* Real-time Stats */}
      {realTimeData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              📡 Dati in Tempo Reale
            </h3>
            <div className="flex items-center space-x-2 text-green-100">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <span className="text-sm">Live</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeData.activeSessions}</div>
              <div className="text-green-100 text-sm">Sessioni Attive</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeData.pageViewsLastHour}</div>
              <div className="text-green-100 text-sm">Visualizzazioni (1h)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{realTimeData.searchesLastHour}</div>
              <div className="text-green-100 text-sm">Ricerche (1h)</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-0">
            {[
              { id: 'overview', label: 'Panoramica', icon: BarChart3 },
              { id: 'traffic', label: 'Traffico', icon: TrendingUp },
              { id: 'behavior', label: 'Comportamento', icon: Users },
              { id: 'conversions', label: 'Conversioni', icon: Target }
            ].map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-all ${
                  activeTab === id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: 'Visitatori Unici',
                      value: analytics.visitors.unique.toLocaleString(),
                      change: `+${analytics.visitors.growth}%`,
                      trend: 'up',
                      icon: Users,
                      color: 'from-blue-500 to-blue-600',
                      subtitle: `${analytics.visitors.today} oggi`
                    },
                    {
                      title: 'Visualizzazioni',
                      value: analytics.pageViews.total.toLocaleString(),
                      change: `${analytics.pageViews.averagePerSession}/sessione`,
                      trend: 'up',
                      icon: Eye,
                      color: 'from-green-500 to-green-600',
                      subtitle: `Bounce: ${(analytics.pageViews.bounceRate * 100).toFixed(1)}%`
                    },
                    {
                      title: 'Business Views',
                      value: analytics.businesses.totalViews.toLocaleString(),
                      change: `${analytics.businesses.conversionRate}% conversione`,
                      trend: 'up',
                      icon: BarChart3,
                      color: 'from-purple-500 to-purple-600',
                      subtitle: `${analytics.businesses.totalContacts} contatti`
                    },
                    {
                      title: 'Ricerche',
                      value: analytics.searches.total.toLocaleString(),
                      change: `${analytics.searches.conversionRate}% successo`,
                      trend: 'up',
                      icon: Search,
                      color: 'from-orange-500 to-orange-600',
                      subtitle: `${analytics.searches.unique} uniche`
                    }
                  ].map((metric, index) => (
                    <motion.div
                      key={metric.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
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
                        {metric.value}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                        {metric.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {metric.subtitle}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Businesses */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Flame className="h-5 w-5 mr-2 text-orange-500" />
                      🔥 Top Business
                    </h3>
                    <div className="space-y-4">
                      {analytics.businesses.topViewed.slice(0, 5).map((business: any, index: number) => (
                        <motion.div
                          key={business.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                              'bg-gradient-to-r from-blue-400 to-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {business.name}
                              </span>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span>{business.rating}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {business.views} views
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {business.contacts} contatti
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Top Searches */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Search className="h-5 w-5 mr-2 text-blue-500" />
                      🔍 Ricerche Popolari
                    </h3>
                    <div className="space-y-4">
                      {analytics.searches.topKeywords.slice(0, 5).map((search: any, index: number) => (
                        <motion.div
                          key={search.keyword}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              "{search.keyword}"
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {search.count} ricerche
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ~{search.results} risultati
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Traffic Tab */}
            {activeTab === 'traffic' && (
              <motion.div
                key="traffic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Traffic Sources */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      Sorgenti di Traffico
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(analytics.traffic).map(([source, percentage], index) => (
                        <div key={source} className="flex items-center justify-between">
                          <span className="capitalize text-gray-700 dark:text-gray-300">{source}</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: index * 0.1, duration: 0.8 }}
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Monitor className="h-5 w-5 mr-2" />
                      Dispositivi
                    </h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Desktop', value: analytics.devices.desktop, icon: Monitor, color: 'from-blue-500 to-blue-600' },
                        { name: 'Mobile', value: analytics.devices.mobile, icon: Smartphone, color: 'from-green-500 to-green-600' },
                        { name: 'Tablet', value: analytics.devices.tablet, icon: Tablet, color: 'from-purple-500 to-purple-600' }
                      ].map((device, index) => (
                        <div key={device.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 bg-gradient-to-r ${device.color} rounded-lg flex items-center justify-center`}>
                              <device.icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">{device.name}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${device.value}%` }}
                                transition={{ delay: index * 0.1, duration: 0.8 }}
                                className={`bg-gradient-to-r ${device.color} h-2 rounded-full`}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                              {device.value}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Geography */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Distribuzione Geografica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Città</h4>
                      <div className="space-y-2">
                        {analytics.geography.topCities.slice(0, 5).map((city: any, index: number) => (
                          <div key={city.city} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                            <span className="text-gray-700 dark:text-gray-300">{city.city}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{city.count}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {city.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Regioni</h4>
                      <div className="space-y-2">
                        {analytics.geography.topRegions.slice(0, 5).map((region: any, index: number) => (
                          <div key={region.region} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                            <span className="text-gray-700 dark:text-gray-300">{region.region}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{region.count}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {region.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Behavior Tab */}
            {activeTab === 'behavior' && (
              <motion.div
                key="behavior"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* User Behavior Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Durata Sessione
                    </h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {analytics.pageViews.averagePerSession} min
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Media per sessione</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Frequenza Rimbalzo
                    </h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {(analytics.pageViews.bounceRate * 100).toFixed(1)}%
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Sessioni con 1 pagina</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Utenti Attivi
                    </h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {analytics.users.activeUsers}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Nel periodo selezionato</p>
                    </div>
                  </div>
                </div>

                {/* User Engagement */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Engagement Utenti
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.users.totalRegistrations}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Nuove Registrazioni</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.users.verifiedUsers}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Utenti Verificati</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.users.businessOwners}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Proprietari Business</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.users.retentionRate}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Tasso Retention</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Conversions Tab */}
            {activeTab === 'conversions' && (
              <motion.div
                key="conversions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Conversion Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: 'Tasso Conversione Business',
                      value: `${analytics.businesses.conversionRate}%`,
                      subtitle: `${analytics.businesses.totalContacts} contatti da ${analytics.businesses.totalViews} visualizzazioni`,
                      icon: Target,
                      color: 'from-green-500 to-green-600'
                    },
                    {
                      title: 'Successo Ricerche',
                      value: `${analytics.searches.conversionRate}%`,
                      subtitle: `${analytics.searches.total - analytics.searches.noResults} ricerche con risultati`,
                      icon: Search,
                      color: 'from-blue-500 to-blue-600'
                    },
                    {
                      title: 'Tasso Recensioni',
                      value: `${analytics.reviews.responseRate}%`,
                      subtitle: `${analytics.reviews.approved} recensioni approvate`,
                      icon: MessageSquare,
                      color: 'from-purple-500 to-purple-600'
                    },
                    {
                      title: 'Engagement Rate',
                      value: `${((analytics.businesses.totalFavorites / analytics.visitors.unique) * 100).toFixed(1)}%`,
                      subtitle: `${analytics.businesses.totalFavorites} preferiti aggiunti`,
                      icon: Star,
                      color: 'from-yellow-500 to-yellow-600'
                    }
                  ].map((metric, index) => (
                    <motion.div
                      key={metric.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center`}>
                          <metric.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {metric.value}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {metric.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {metric.subtitle}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Funnel di Conversione
                  </h3>
                  <div className="space-y-4">
                    {[
                      { stage: 'Visitatori', value: analytics.visitors.unique, percentage: 100 },
                      { stage: 'Visualizzazioni Business', value: analytics.businesses.totalViews, percentage: (analytics.businesses.totalViews / analytics.visitors.unique * 100) },
                      { stage: 'Contatti', value: analytics.businesses.totalContacts, percentage: (analytics.businesses.totalContacts / analytics.visitors.unique * 100) },
                      { stage: 'Recensioni', value: analytics.reviews.total, percentage: (analytics.reviews.total / analytics.visitors.unique * 100) }
                    ].map((stage, index) => (
                      <div key={stage.stage} className="flex items-center space-x-4">
                        <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {stage.stage}
                        </div>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.percentage}%` }}
                            transition={{ delay: index * 0.2, duration: 1 }}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-8 rounded-full flex items-center justify-center"
                          >
                            <span className="text-white text-sm font-medium">
                              {stage.value.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                            </span>
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;