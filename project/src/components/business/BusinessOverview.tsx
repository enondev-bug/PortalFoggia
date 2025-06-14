import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Eye, Phone, Star, 
  MessageSquare, Heart, Tag, Calendar, 
  ArrowUp, ArrowDown, RefreshCw, Clock,
  CheckCircle, XCircle, AlertTriangle, Mail
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessOverviewProps {
  business: any;
  stats: any;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessOverview: React.FC<BusinessOverviewProps> = ({ 
  business, 
  stats, 
  showNotification 
}) => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (business?.id) {
      loadAnalytics();
    }
  }, [business?.id]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_business_analytics', {
        business_id: business.id,
        days_back: 30
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

  if (!business) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          Nessuna attività selezionata
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Seleziona un'attività dal menu laterale per visualizzare la dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard {business.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Panoramica e statistiche della tua attività
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Aggiorna</span>
        </motion.button>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl border-2 ${
          business.status === 'active' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : business.status === 'pending'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            business.status === 'active' 
              ? 'bg-green-500' 
              : business.status === 'pending'
                ? 'bg-yellow-500'
                : 'bg-red-500'
          }`}>
            {business.status === 'active' ? (
              <CheckCircle className="h-6 w-6 text-white" />
            ) : business.status === 'pending' ? (
              <Clock className="h-6 w-6 text-white" />
            ) : (
              <XCircle className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${
              business.status === 'active' 
                ? 'text-green-800 dark:text-green-300' 
                : business.status === 'pending'
                  ? 'text-yellow-800 dark:text-yellow-300'
                  : 'text-red-800 dark:text-red-300'
            }`}>
              {business.status === 'active' 
                ? 'Attività Attiva e Visibile' 
                : business.status === 'pending'
                  ? 'Attività in Attesa di Approvazione'
                  : 'Attività Sospesa o Nascosta'}
            </h3>
            <p className={`text-sm ${
              business.status === 'active' 
                ? 'text-green-600 dark:text-green-400' 
                : business.status === 'pending'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
            }`}>
              {business.status === 'active' 
                ? 'La tua attività è visibile a tutti gli utenti nella directory' 
                : business.status === 'pending'
                  ? 'La tua attività è in fase di revisione da parte degli amministratori'
                  : 'La tua attività non è attualmente visibile nella directory'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Visualizzazioni',
            value: business.view_count || 0,
            change: analytics?.totals?.views ? `+${analytics.totals.views}` : '+0',
            trend: 'up',
            icon: Eye,
            color: 'from-blue-500 to-blue-600',
            subtitle: 'Ultimi 30 giorni'
          },
          {
            title: 'Contatti',
            value: business.contact_count || 0,
            change: analytics?.totals?.contacts ? `+${analytics.totals.contacts}` : '+0',
            trend: 'up',
            icon: Phone,
            color: 'from-green-500 to-green-600',
            subtitle: `${analytics?.conversion_rate || 0}% conversione`
          },
          {
            title: 'Recensioni',
            value: business.review_count || 0,
            change: stats?.reviews?.length ? `${stats.reviews.length} nuove` : '0 nuove',
            trend: 'up',
            icon: MessageSquare,
            color: 'from-purple-500 to-purple-600',
            subtitle: `Rating: ${business.rating || 0}/5`
          },
          {
            title: 'Preferiti',
            value: stats?.favorites || 0,
            change: analytics?.totals?.favorites ? `+${analytics.totals.favorites}` : '+0',
            trend: 'up',
            icon: Heart,
            color: 'from-red-500 to-red-600',
            subtitle: 'Utenti interessati'
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
              {metric.value.toLocaleString()}
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reviews */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
            Recensioni Recenti
          </h3>
          
          {stats?.reviews && stats.reviews.length > 0 ? (
            <div className="space-y-4">
              {stats.reviews.map((review: any, index: number) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {review.user?.avatar_url ? (
                      <img 
                        src={review.user.avatar_url} 
                        alt={review.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {review.user?.name || 'Utente'}
                      </p>
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${
                              i < review.rating 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300 dark:text-gray-600'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {review.comment || review.title || 'Nessun commento'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        review.status === 'approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : review.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {review.status === 'approved' 
                          ? 'Approvata' 
                          : review.status === 'pending'
                            ? 'In attesa'
                            : 'Rifiutata'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Nessuna recensione recente
              </p>
            </div>
          )}
        </motion.div>

        {/* Recent Contacts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Mail className="h-5 w-5 mr-2 text-blue-500" />
            Richieste di Contatto
          </h3>
          
          {stats?.contacts && stats.contacts.length > 0 ? (
            <div className="space-y-4">
              {stats.contacts.map((contact: any, index: number) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        contact.type === 'info' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                          : contact.type === 'booking'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        {contact.type === 'info' 
                          ? 'Informazioni' 
                          : contact.type === 'booking'
                            ? 'Prenotazione'
                            : 'Preventivo'}
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {contact.subject || 'Nessun oggetto'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      contact.status === 'replied' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : contact.status === 'read'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {contact.status === 'replied' 
                        ? 'Risposto' 
                        : contact.status === 'read'
                          ? 'Letto'
                          : 'Da leggere'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => showNotification('📧 Funzione risposta in sviluppo', 'info')}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Visualizza
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Nessuna richiesta di contatto recente
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Azioni Rapide
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              title: 'Aggiorna Dettagli', 
              description: 'Modifica informazioni', 
              action: () => showNotification('🔄 Reindirizzamento a dettagli attività', 'info'), 
              color: 'from-blue-500 to-blue-600',
              icon: Building2
            },
            { 
              title: 'Gestisci Recensioni', 
              description: `${business.review_count || 0} recensioni`, 
              action: () => showNotification('⭐ Reindirizzamento a gestione recensioni', 'info'), 
              color: 'from-purple-500 to-purple-600',
              icon: MessageSquare
            },
            { 
              title: 'Crea Offerta', 
              description: 'Promozioni speciali', 
              action: () => showNotification('🏷️ Reindirizzamento a creazione offerte', 'info'), 
              color: 'from-green-500 to-green-600',
              icon: Tag
            },
            { 
              title: 'Visualizza Statistiche', 
              description: 'Analytics completi', 
              action: () => showNotification('📊 Reindirizzamento ad analytics', 'info'), 
              color: 'from-orange-500 to-orange-600',
              icon: TrendingUp
            }
          ].map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
              💡 Consigli per Aumentare la Visibilità
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
              <div>
                <h5 className="font-semibold mb-2">🏷️ Offerte Speciali:</h5>
                <ul className="space-y-1">
                  <li>• Crea offerte stagionali</li>
                  <li>• Promuovi sconti esclusivi</li>
                  <li>• Offri vantaggi ai clienti fedeli</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">📸 Immagini di Qualità:</h5>
                <ul className="space-y-1">
                  <li>• Aggiungi foto professionali</li>
                  <li>• Mostra i tuoi prodotti/servizi</li>
                  <li>• Aggiorna regolarmente la galleria</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BusinessOverview;