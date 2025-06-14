import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Star, CheckCircle, XCircle, 
  AlertTriangle, Eye, Trash2, Flag, X, MessageSquare,
  ThumbsUp, Calendar, User, Building2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Review {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  is_verified: boolean;
  helpful_count: number;
  report_count: number;
  created_at: string;
  updated_at: string;
  business: {
    name: string;
    category: { name: string } | null;
  } | null;
  user: {
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface ReviewManagementProps {
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const ReviewManagement: React.FC<ReviewManagementProps> = ({ showNotification }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'flagged' | 'rejected'>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          business:businesses(name, category:categories(name)),
          user:profiles(name, email, avatar_url)
        `)
        .order('created_at', { ascending: false });

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

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.business?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (reviewId: string, newStatus: Review['status']) => {
    if (processingIds.has(reviewId)) return;
    
    try {
      setProcessingIds(prev => new Set(prev).add(reviewId));
      
      const { error } = await supabase
        .from('reviews')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, status: newStatus, updated_at: new Date().toISOString() }
          : review
      ));
      
      const statusMessages = {
        approved: 'approvata',
        rejected: 'rifiutata',
        flagged: 'segnalata',
        pending: 'messa in attesa'
      };
      
      showNotification(`✅ Recensione ${statusMessages[newStatus]}`, 'success');
    } catch (error) {
      console.error('❌ Error updating review status:', error);
      showNotification('❌ Errore nell\'aggiornamento dello stato', 'warning');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (processingIds.has(reviewId)) return;
    
    if (!confirm('Sei sicuro di voler eliminare questa recensione? Questa azione non può essere annullata.')) {
      return;
    }
    
    try {
      setProcessingIds(prev => new Set(prev).add(reviewId));
      
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev => prev.filter(review => review.id !== reviewId));
      showNotification('✅ Recensione eliminata con successo', 'success');
    } catch (error) {
      console.error('❌ Error deleting review:', error);
      showNotification('❌ Errore nell\'eliminazione della recensione', 'warning');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'flagged': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
      case 'rejected': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento recensioni...</span>
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
            {filteredReviews.length} di {reviews.length} recensioni
          </p>
        </div>
        <div className="flex space-x-2">
          <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-sm font-medium">
            {reviews.filter(r => r.status === 'flagged').length} Segnalate
          </span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm font-medium">
            {reviews.filter(r => r.status === 'pending').length} In Attesa
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Totali', value: reviews.length, color: 'blue' },
          { label: 'Approvate', value: reviews.filter(r => r.status === 'approved').length, color: 'green' },
          { label: 'In Attesa', value: reviews.filter(r => r.status === 'pending').length, color: 'yellow' },
          { label: 'Segnalate', value: reviews.filter(r => r.status === 'flagged').length, color: 'red' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 border border-${stat.color}-200 dark:border-${stat.color}-800 rounded-xl`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
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
        {filteredReviews.map((review, index) => (
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
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {review.business?.name || 'Attività eliminata'}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(review.status)}`}>
                    {review.status}
                  </span>
                  {review.report_count > 0 && (
                    <span className="flex items-center space-x-1 text-red-600 text-sm">
                      <Flag className="h-4 w-4" />
                      <span>{review.report_count} segnalazioni</span>
                    </span>
                  )}
                  {review.is_verified && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                      ✓ Verificata
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center space-x-2">
                    {review.user?.avatar_url ? (
                      <img 
                        src={review.user.avatar_url} 
                        alt={review.user.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-500" />
                      </div>
                    )}
                    <span>di {review.user?.name || 'Utente eliminato'}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    {getRatingStars(review.rating)}
                    <span className="ml-1">({review.rating}/5)</span>
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
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedReview(review);
                    setShowModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Visualizza dettagli"
                >
                  <Eye className="h-4 w-4" />
                </motion.button>
                
                {review.status === 'pending' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(review.id, 'approved')}
                      disabled={processingIds.has(review.id)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Approva"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(review.id, 'rejected')}
                      disabled={processingIds.has(review.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Rifiuta"
                    >
                      <XCircle className="h-4 w-4" />
                    </motion.button>
                  </>
                )}
                
                {review.status === 'flagged' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(review.id, 'approved')}
                      disabled={processingIds.has(review.id)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Approva"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(review.id)}
                      disabled={processingIds.has(review.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Elimina"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </>
                )}
                
                {review.status === 'approved' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStatusChange(review.id, 'flagged')}
                    disabled={processingIds.has(review.id)}
                    className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Segnala"
                  >
                    <Flag className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessuna recensione trovata
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || statusFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca' 
              : 'Non ci sono ancora recensioni da moderare'
            }
          </p>
        </div>
      )}

      {/* Review Detail Modal */}
      <AnimatePresence>
        {showModal && selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Dettagli Recensione
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedReview.business?.name || 'Attività eliminata'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Recensione di {selectedReview.user?.name || 'Utente eliminato'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getRatingStars(selectedReview.rating)}
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </div>

                {selectedReview.title && (
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Titolo</h5>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      {selectedReview.title}
                    </p>
                  </div>
                )}

                {selectedReview.comment && (
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Commento</h5>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedReview.comment}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Data:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedReview.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Stato:</span>
                    <p className="text-gray-600 dark:text-gray-400 capitalize">{selectedReview.status}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Segnalazioni:</span>
                    <p className="text-gray-600 dark:text-gray-400">{selectedReview.report_count}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Utile:</span>
                    <p className="text-gray-600 dark:text-gray-400">{selectedReview.helpful_count} voti</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Verificata:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedReview.is_verified ? 'Sì' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Email utente:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedReview.user?.email || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {selectedReview.status === 'pending' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleStatusChange(selectedReview.id, 'approved');
                          setShowModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approva
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleStatusChange(selectedReview.id, 'rejected');
                          setShowModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Rifiuta
                      </motion.button>
                    </>
                  )}
                  
                  {selectedReview.status === 'flagged' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleStatusChange(selectedReview.id, 'approved');
                          setShowModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approva
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleDelete(selectedReview.id);
                          setShowModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Elimina
                      </motion.button>
                    </>
                  )}
                  
                  {selectedReview.status === 'approved' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleStatusChange(selectedReview.id, 'flagged');
                        setShowModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Segnala come Inappropriata
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewManagement;