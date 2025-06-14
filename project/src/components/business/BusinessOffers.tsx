import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tag, Plus, Edit, Trash2, Calendar, DollarSign,
  CheckCircle, XCircle, AlertTriangle, Clock, X,
  Save, Percent, Zap, Gift
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessOffersProps {
  business: any;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessOffers: React.FC<BusinessOffersProps> = ({ 
  business, 
  showNotification 
}) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    terms: '',
    is_active: true,
    start_date: '',
    end_date: '',
    usage_limit: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (business?.id) {
      loadOffers();
    }
  }, [business?.id]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_business_offers', {
        business_id: business.id
      });

      if (error) throw error;

      setOffers(data || []);
      console.log('✅ Loaded', data?.length || 0, 'offers');
    } catch (error) {
      console.error('❌ Error loading offers:', error);
      showNotification('❌ Errore nel caricamento delle offerte', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (offer: any = null) => {
    if (offer) {
      // Edit existing offer
      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        discount_type: offer.discount_type || 'percentage',
        discount_value: offer.discount_value?.toString() || '',
        terms: offer.terms || '',
        is_active: offer.is_active || true,
        start_date: offer.start_date ? new Date(offer.start_date).toISOString().split('T')[0] : '',
        end_date: offer.end_date ? new Date(offer.end_date).toISOString().split('T')[0] : '',
        usage_limit: offer.usage_limit?.toString() || ''
      });
      setSelectedOffer(offer);
    } else {
      // New offer
      setFormData({
        title: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        terms: '',
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usage_limit: ''
      });
      setSelectedOffer(null);
    }
    
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const offerData = {
        business_id: business.id,
        title: formData.title,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value ? parseFloat(formData.discount_value) : null,
        terms: formData.terms,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
      };
      
      if (selectedOffer) {
        // Update existing offer
        const { data, error } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', selectedOffer.id)
          .select();
        
        if (error) throw error;
        
        setOffers(prev => prev.map(offer => 
          offer.id === selectedOffer.id ? data[0] : offer
        ));
        
        showNotification('✅ Offerta aggiornata con successo', 'success');
      } else {
        // Create new offer
        const { data, error } = await supabase
          .from('offers')
          .insert(offerData)
          .select();
        
        if (error) throw error;
        
        setOffers(prev => [...prev, data[0]]);
        
        showNotification('✅ Offerta creata con successo', 'success');
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('❌ Error saving offer:', error);
      showNotification('❌ Errore nel salvataggio dell\'offerta', 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (offerId: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .update({ is_active: isActive })
        .eq('id', offerId)
        .select();
      
      if (error) throw error;
      
      setOffers(prev => prev.map(offer => 
        offer.id === offerId ? data[0] : offer
      ));
      
      showNotification(
        isActive ? '✅ Offerta attivata' : '❌ Offerta disattivata', 
        'success'
      );
    } catch (error) {
      console.error('❌ Error toggling offer status:', error);
      showNotification('❌ Errore nella modifica dello stato', 'warning');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa offerta? Questa azione non può essere annullata.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);
      
      if (error) throw error;
      
      setOffers(prev => prev.filter(offer => offer.id !== offerId));
      
      showNotification('✅ Offerta eliminata con successo', 'success');
    } catch (error) {
      console.error('❌ Error deleting offer:', error);
      showNotification('❌ Errore nell\'eliminazione dell\'offerta', 'warning');
    }
  };

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage': return 'Percentuale';
      case 'fixed': return 'Importo Fisso';
      case 'bogo': return 'Compra 1 Prendi 2';
      case 'other': return 'Altro';
      default: return type;
    }
  };

  const getDiscountDisplay = (offer: any) => {
    if (!offer.discount_type || !offer.discount_value) return 'Offerta Speciale';
    
    switch (offer.discount_type) {
      case 'percentage':
        return `${offer.discount_value}% di sconto`;
      case 'fixed':
        return `${offer.discount_value}€ di sconto`;
      case 'bogo':
        return 'Compra 1 Prendi 2';
      default:
        return 'Offerta Speciale';
    }
  };

  const isOfferActive = (offer: any) => {
    if (!offer.is_active) return false;
    
    const now = new Date();
    const startDate = offer.start_date ? new Date(offer.start_date) : null;
    const endDate = offer.end_date ? new Date(offer.end_date) : null;
    
    if (startDate && startDate > now) return false;
    if (endDate && endDate < now) return false;
    
    return true;
  };

  const getOfferStatus = (offer: any) => {
    if (!offer.is_active) {
      return {
        label: 'Disattivata',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
        icon: XCircle
      };
    }
    
    const now = new Date();
    const startDate = offer.start_date ? new Date(offer.start_date) : null;
    const endDate = offer.end_date ? new Date(offer.end_date) : null;
    
    if (startDate && startDate > now) {
      return {
        label: 'Programmata',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        icon: Clock
      };
    }
    
    if (endDate && endDate < now) {
      return {
        label: 'Scaduta',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        icon: AlertTriangle
      };
    }
    
    return {
      label: 'Attiva',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      icon: CheckCircle
    };
  };

  if (!business) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
          Nessuna attività selezionata
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Seleziona un'attività dal menu laterale per gestire le offerte
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
            Offerte Speciali
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestisci promozioni e sconti per {business.name}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nuova Offerta</span>
        </motion.button>
      </div>

      {/* Offers List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
            />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento offerte...</span>
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessuna offerta trovata
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Crea la tua prima offerta speciale per attirare più clienti
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2 inline-block" />
              Crea Offerta
            </motion.button>
          </div>
        ) : (
          offers.map((offer, index) => {
            const status = getOfferStatus(offer);
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 transition-all ${
                  isOfferActive(offer)
                    ? 'border-green-200 dark:border-green-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {offer.title}
                      </h3>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 ${status.color} rounded-full text-xs font-semibold`}>
                        <StatusIcon className="h-3 w-3" />
                        <span>{status.label}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{getDiscountDisplay(offer)}</span>
                      </div>
                      
                      {(offer.start_date || offer.end_date) && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {offer.start_date && offer.end_date 
                              ? `Dal ${new Date(offer.start_date).toLocaleDateString()} al ${new Date(offer.end_date).toLocaleDateString()}`
                              : offer.start_date
                                ? `Dal ${new Date(offer.start_date).toLocaleDateString()}`
                                : offer.end_date
                                  ? `Fino al ${new Date(offer.end_date).toLocaleDateString()}`
                                  : 'Nessuna scadenza'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {offer.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {offer.description}
                      </p>
                    )}
                    
                    {offer.terms && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="font-medium text-gray-900 dark:text-white">Termini e condizioni:</span> {offer.terms}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm">
                      {offer.usage_limit && (
                        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4" />
                          <span>Limite: {offer.usage_limit} utilizzi</span>
                        </div>
                      )}
                      
                      {offer.usage_count > 0 && (
                        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>Utilizzata {offer.usage_count} volte</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenModal(offer)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleActive(offer.id, !offer.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        offer.is_active
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {offer.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Offer Modal */}
      <AnimatePresence>
        {showModal && (
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
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedOffer ? 'Modifica Offerta' : 'Nuova Offerta'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Titolo Offerta *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="es. Sconto del 20% su tutti i prodotti"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrizione
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descrivi i dettagli dell'offerta"
                  />
                </div>

                {/* Discount Type and Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipo di Sconto
                    </label>
                    <select
                      name="discount_type"
                      value={formData.discount_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentuale (%)</option>
                      <option value="fixed">Importo Fisso (€)</option>
                      <option value="bogo">Compra 1 Prendi 2</option>
                      <option value="other">Altro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Valore Sconto
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discount_value"
                        value={formData.discount_value}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
                        disabled={formData.discount_type === 'bogo' || formData.discount_type === 'other'}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {formData.discount_type === 'percentage' ? (
                          <Percent className="h-4 w-4 text-gray-400" />
                        ) : formData.discount_type === 'fixed' ? (
                          <span className="text-gray-400">€</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data Inizio
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Data Fine
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Terms and Usage Limit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Termini e Condizioni
                    </label>
                    <textarea
                      name="terms"
                      value={formData.terms}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="es. Non cumulabile con altre offerte"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Limite Utilizzi
                    </label>
                    <input
                      type="number"
                      name="usage_limit"
                      value={formData.usage_limit}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Lascia vuoto per nessun limite"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Numero massimo di volte che l'offerta può essere utilizzata
                    </p>
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Offerta attiva
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annulla
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!formData.title.trim() || submitting}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
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
                        <span>{selectedOffer ? 'Aggiorna' : 'Crea'} Offerta</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6"
      >
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-3">
              💡 Consigli per Offerte Efficaci
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700 dark:text-purple-300">
              <div>
                <h5 className="font-semibold mb-2">🎯 Offerte Strategiche:</h5>
                <ul className="space-y-1">
                  <li>• Crea offerte con scadenza per creare urgenza</li>
                  <li>• Usa sconti percentuali per prodotti costosi</li>
                  <li>• Offri bundle per aumentare il valore medio</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">📣 Promozione Efficace:</h5>
                <ul className="space-y-1">
                  <li>• Usa titoli chiari e accattivanti</li>
                  <li>• Specifica i termini in modo trasparente</li>
                  <li>• Limita la disponibilità per creare esclusività</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BusinessOffers;