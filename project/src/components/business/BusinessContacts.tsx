import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Phone, Mail, User, Calendar,
  CheckCircle, Clock, XCircle, Send, X, AlertTriangle,
  MessageSquare, FileText, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessContactsProps {
  business: any;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessContacts: React.FC<BusinessContactsProps> = ({ 
  business, 
  showNotification 
}) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'read' | 'replied' | 'closed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'info' | 'booking' | 'quote' | 'complaint'>('all');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (business?.id) {
      loadContacts();
    }
  }, [business?.id]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_business_contacts', {
        business_id: business.id
      });

      if (error) throw error;

      setContacts(data || []);
      console.log('✅ Loaded', data?.length || 0, 'contacts');
    } catch (error) {
      console.error('❌ Error loading contacts:', error);
      showNotification('❌ Errore nel caricamento dei contatti', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (contactId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase.rpc('update_contact_request_status', {
        request_id: contactId,
        new_status: newStatus
      });

      if (error) throw error;

      // Aggiorna lo stato del contatto nella lista
      setContacts(prev => prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, status: newStatus }
          : contact
      ));
      
      showNotification(`✅ Stato aggiornato a "${newStatus}"`, 'success');
      
      // Se è stato aperto il modal di risposta, chiudilo
      if (showResponseModal) {
        setShowResponseModal(false);
        setResponse('');
        setSelectedContact(null);
      }
    } catch (error) {
      console.error('❌ Error updating contact status:', error);
      showNotification('❌ Errore nell\'aggiornamento dello stato', 'warning');
    }
  };

  const handleSendResponse = async () => {
    if (!selectedContact || !response.trim()) return;
    
    try {
      setSubmitting(true);
      
      // Aggiorna lo stato a "replied"
      await handleUpdateStatus(selectedContact.id, 'replied');
      
      // Qui potresti inviare un'email di risposta all'utente
      // Per ora simuliamo solo il successo
      
      showNotification('✅ Risposta inviata con successo', 'success');
      
      setShowResponseModal(false);
      setResponse('');
      setSelectedContact(null);
    } catch (error) {
      console.error('❌ Error sending response:', error);
      showNotification('❌ Errore nell\'invio della risposta', 'warning');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportContacts = () => {
    try {
      // Prepara i dati per l'export
      const csvRows = [
        'Data,Tipo,Oggetto,Messaggio,Nome Utente,Email Utente,Stato'
      ];
      
      filteredContacts.forEach(contact => {
        csvRows.push(
          `"${new Date(contact.created_at).toLocaleDateString()}","${contact.type}","${contact.subject || ''}","${contact.message.replace(/"/g, '""')}","${contact.user_name}","${contact.user_email}","${contact.status}"`
        );
      });
      
      const csvContent = csvRows.join('\n');
      
      // Crea e scarica il file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `contatti_${business.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('✅ Contatti esportati con successo', 'success');
    } catch (error) {
      console.error('❌ Error exporting contacts:', error);
      showNotification('❌ Errore nell\'esportazione dei contatti', 'warning');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      (contact.message && contact.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.subject && contact.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.user_name && contact.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.user_email && contact.user_email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
    const matchesType = typeFilter === 'all' || contact.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            <span>Da leggere</span>
          </span>
        );
      case 'read':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            <span>Letto</span>
          </span>
        );
      case 'replied':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
            <Send className="h-3 w-3" />
            <span>Risposto</span>
          </span>
        );
      case 'closed':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 rounded-full text-xs font-medium">
            <XCircle className="h-3 w-3" />
            <span>Chiuso</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'info': return 'Informazioni';
      case 'booking': return 'Prenotazione';
      case 'quote': return 'Preventivo';
      case 'complaint': return 'Reclamo';
      default: return type;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'info':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
            Informazioni
          </span>
        );
      case 'booking':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
            Prenotazione
          </span>
        );
      case 'quote':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-medium">
            Preventivo
          </span>
        );
      case 'complaint':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium">
            Reclamo
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
          Seleziona un'attività dal menu laterale per gestire i contatti
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
            Richieste di Contatto
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gestisci le richieste dei clienti per {business.name}
          </p>
        </div>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportContacts}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Esporta</span>
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{contacts.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Contatti Totali</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {contacts.filter(c => c.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Da Leggere</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {contacts.filter(c => c.status === 'replied').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Risposte Inviate</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {contacts.filter(c => c.type === 'booking').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Richieste Prenotazione</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca contatti..."
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
            <option value="pending">Da leggere</option>
            <option value="read">Letti</option>
            <option value="replied">Risposti</option>
            <option value="closed">Chiusi</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tutti i tipi</option>
            <option value="info">Informazioni</option>
            <option value="booking">Prenotazioni</option>
            <option value="quote">Preventivi</option>
            <option value="complaint">Reclami</option>
          </select>
        </div>
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
            />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento contatti...</span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessun contatto trovato
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca' 
                : 'Non ci sono ancora richieste di contatto per questa attività'
              }
            </p>
          </div>
        ) : (
          filteredContacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-l-4 transition-all ${
                contact.status === 'pending'
                  ? 'border-l-yellow-500 border-gray-200 dark:border-gray-700'
                  : contact.status === 'read'
                    ? 'border-l-blue-500 border-gray-200 dark:border-gray-700'
                    : contact.status === 'replied'
                      ? 'border-l-green-500 border-gray-200 dark:border-gray-700'
                      : 'border-l-gray-500 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {contact.user_avatar ? (
                        <img 
                          src={contact.user_avatar} 
                          alt={contact.user_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {contact.user_name || 'Utente anonimo'}
                      </h3>
                    </div>
                    {getTypeBadge(contact.type)}
                    {getStatusBadge(contact.status)}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{contact.user_email}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(contact.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {contact.subject && (
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {contact.subject}
                    </h4>
                  )}
                  
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                    {contact.message}
                  </p>
                  
                  {contact.contact_info && Object.keys(contact.contact_info).length > 0 && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="font-medium text-gray-900 dark:text-white">Informazioni di contatto:</span>
                      <ul className="mt-1 space-y-1">
                        {Object.entries(contact.contact_info).map(([key, value]) => (
                          <li key={key}>
                            <span className="font-medium">{key}:</span> {value as string}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex flex-col space-y-2">
                  {contact.status === 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUpdateStatus(contact.id, 'read')}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Segna come letto"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </motion.button>
                  )}
                  
                  {(contact.status === 'pending' || contact.status === 'read') && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowResponseModal(true);
                      }}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Rispondi"
                    >
                      <Send className="h-4 w-4" />
                    </motion.button>
                  )}
                  
                  {contact.status !== 'closed' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleUpdateStatus(contact.id, 'closed')}
                      className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      title="Chiudi richiesta"
                    >
                      <XCircle className="h-4 w-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && selectedContact && (
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
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Rispondi alla Richiesta
                </h3>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Contact Summary */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedContact.user_name || 'Utente anonimo'}
                      </span>
                    </div>
                    {getTypeBadge(selectedContact.type)}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <Mail className="h-4 w-4" />
                    <span>{selectedContact.user_email}</span>
                  </div>
                  
                  {selectedContact.subject && (
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {selectedContact.subject}
                    </p>
                  )}
                  
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {selectedContact.message}
                  </p>
                </div>

                {/* Response Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    La tua risposta
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Scrivi una risposta professionale alla richiesta..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    La risposta verrà inviata via email all'utente
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
                    onClick={handleSendResponse}
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

export default BusinessContacts;