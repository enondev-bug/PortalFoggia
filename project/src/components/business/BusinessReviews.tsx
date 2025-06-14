import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Star, MessageSquare, User, 
  ThumbsUp, Calendar, CheckCircle, XCircle, 
  AlertTriangle, Flag, Send, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessReviewsProps {
  business: any;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessReviews: React.FC<BusinessReviewsProps> = ({ 
  business, 
  showNotification 
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'flagged' | 'rejected'>('all');
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (business?.id) {
      loadReviews();
    }
  }, [business?.id]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_business_reviews', {
        business_id: business.id
      });

      if (error) throw error;

      setReviews(data || []);
      console.log('✅ Loaded', data?.length || 0, 'reviews');
    } catch (error) {
      console.error('❌ Error loading reviews:', error);
      showNotification('❌ Errore nel caricamento delle recensioni', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !response.trim()) return;
    
    try {
      setSubmitting(true);
      
      const { data, error } = await supabase.rpc('respond_to_review', {
        review_id: selectedReview.id,
        response: response.trim()
      });

      if (error) throw error;

      // Aggiorna la recensione nella lista
      setReviews(prev => prev.map(review => 
        review.id === selectedReview.id 
          ? { 
              ...review, 
              metadata: { 
                ...review.metadata, 
                owner_response: { 
                  text: response.trim(), 
                  timestamp: new Date().toISOString() 
                } 
              } 
            }
          : review
      ));
      
      setShowResponseModal(false);
      setResponse('');
      setSelectedReview(null);
      
      showNotification('✅ Risposta inviata con successo', 'success');
    } catch (error) {
      console.error('❌ Error submitting response:', error);
      showNotification('❌ Errore nell\'invio della risposta', 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      (review.comment && review.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (review.title && review.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (review.user_name && review.user_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            <span>Approvata</span>
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-medium">
            <AlertTriangle className="h-3 w-3" />
            <span>In Attesa</span>
          </span>
        );
      case 'flagged':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium">
            <Flag className="h-3 w-3" />
            <span>Segnalata</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            <span>Rifiutata</span>
          </span>
        );
      default:
        return null;
    }
  };

  if (!business) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          Nessuna attività selezionata
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Seleziona un'attività dal menu laterale per gestire le recensioni
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
            Gestione Recensioni
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredReviews.length} recensioni per {business.name}
          </p>
        </div>
        <div className="flex space-x-2">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm font-medium">
            {reviews.filter(r => r.status === 'pending').length} In Attesa
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm font-medium">
            {reviews.filter(r => r.status === 'approved').length} Approvate
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{business.rating || 0}</div>
          <div className="flex items-center space-x-1 mb-1">
            {getRatingStars(business.rating || 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Rating Medio</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{business.review_count || 0}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Recensioni Totali</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {reviews.filter(r => r.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Recensioni Pubblicate</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {reviews.reduce((sum, review) => sum + review.helpful_count, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Voti "Utile"</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca recensioni..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tutti gli stati</option>
            <option value="approved">Approvate</option>
            <option value="pending">In attesa</option>
            <option value="flagged">Segnalate</option>
            <option value="rejected">Rifiutate</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
            />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento recensioni...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessuna recensione trovata
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' 
                ? 'Prova a modificare i filtri di ricerca' 
                : 'Non ci sono ancora recensioni per questa attività'
              }
            </p>
          </div>
        ) : (
          filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {review.user_avatar ? (
                        <img 
                          src={review.user_avatar} 
                          alt={review.user_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {review.user_name || 'Utente anonimo'}
                      </h3>
                    </div>
                    {getStatusBadge(review.status)}
                    {review.is_verified && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                        ✓ Verificata
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      {getRatingStars(review.rating)}
                      <span className="ml-1">({review.rating}/5)</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {review.title && (
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {review.title}
                    </h4>
                  )}
                  
                  {review.comment && (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      {review.comment}
                    </p>
                  )}
                  
                  {review.helpful_count > 0 && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                      <ThumbsUp className="h-4 w-4" />
                      <span>{review.helpful_count} persone hanno trovato utile questa recensione</span>
                    </div>
                  )}

                  {/* Owner Response */}
                  {review.metadata?.owner_response && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-800 dark:text-blue-300">Risposta del proprietario</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {new Date(review.metadata.owner_response.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        {review.metadata.owner_response.text}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="ml-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedReview(review);
                      setShowResponseModal(true);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Send className="h-4 w-4" />
                    <span>{review.metadata?.owner_response ? 'Modifica' : 'Rispondi'}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowResponseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Rispondi alla Recensione
                </h3>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Review Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedReview.user_name || 'Utente anonimo'}
                    </span>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(selectedReview.rating)}
                    </div>
                  </div>
                  
                  {selectedReview.title && (
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {selectedReview.title}
                    </p>
                  )}
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {selectedReview.comment || 'Nessun commento'}
                  </p>
                </div>

                {/* Response Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    La tua risposta
                  </label>
                  <textarea
                    value={response || selectedReview.metadata?.owner_response?.text || ''}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Scrivi una risposta professionale alla recensione..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    La tua risposta sarà visibile pubblicamente insieme alla recensione
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowResponseModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annulla
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitResponse}
                    disabled={!response.trim() || submitting}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Inviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Invia Risposta</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessReviews;