import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, Building2, MapPin, Phone, Mail, Globe, 
  Tag, Clock, Info, AlertTriangle, CheckCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BusinessDetailsProps {
  business: any;
  onUpdate: (updates: any) => Promise<any>;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessDetails: React.FC<BusinessDetailsProps> = ({ 
  business, 
  onUpdate, 
  showNotification 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    category_id: ''
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        description: business.description || '',
        short_description: business.short_description || '',
        address: business.address || '',
        city: business.city || '',
        postal_code: business.postal_code || '',
        phone: business.phone || '',
        email: business.email || '',
        website: business.website || '',
        category_id: business.category_id || ''
      });
    }
    
    loadCategories();
  }, [business]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories(data || []);
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      showNotification('❌ Errore nel caricamento delle categorie', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) return;
    
    try {
      setSaving(true);
      
      const updatedBusiness = await onUpdate(formData);
      
      setHasChanges(false);
      showNotification('✅ Dettagli attività aggiornati con successo', 'success');
    } catch (error) {
      console.error('❌ Error saving business details:', error);
      showNotification('❌ Errore nel salvataggio dei dettagli', 'warning');
    } finally {
      setSaving(false);
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
          Seleziona un'attività dal menu laterale per modificare i dettagli
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
            Dettagli Attività
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Modifica le informazioni della tua attività
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!hasChanges || saving}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            hasChanges && !saving
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? (
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

      {/* Status Info */}
      <div className={`p-4 rounded-xl ${
        business.status === 'active' 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
          : business.status === 'pending'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center space-x-3">
          {business.status === 'active' ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : business.status === 'pending' ? (
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          <div>
            <p className={`text-sm font-medium ${
              business.status === 'active' 
                ? 'text-green-800 dark:text-green-300' 
                : business.status === 'pending'
                  ? 'text-yellow-800 dark:text-yellow-300'
                  : 'text-red-800 dark:text-red-300'
            }`}>
              {business.status === 'active' 
                ? 'Attività attiva e visibile nella directory' 
                : business.status === 'pending'
                  ? 'Attività in attesa di approvazione'
                  : 'Attività sospesa o nascosta'}
            </p>
            <p className={`text-xs ${
              business.status === 'active' 
                ? 'text-green-600 dark:text-green-400' 
                : business.status === 'pending'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
            }`}>
              {business.status === 'active' 
                ? 'Ultimo aggiornamento: ' + new Date(business.updated_at).toLocaleDateString() 
                : business.status === 'pending'
                  ? 'In attesa di revisione da parte degli amministratori'
                  : 'Contatta l\'assistenza per riattivare la tua attività'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome Attività */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome Attività *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome della tua attività"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Indirizzo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Indirizzo *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Via e numero civico"
              />
            </div>
          </div>

          {/* Città */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Città *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Città"
            />
          </div>

          {/* CAP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CAP
            </label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Codice Postale"
            />
          </div>

          {/* Telefono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+39 123 456 7890"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="info@tuaattivita.it"
              />
            </div>
          </div>

          {/* Sito Web */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sito Web
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.tuodominio.it"
              />
            </div>
          </div>
        </div>

        {/* Descrizione Breve */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrizione Breve
          </label>
          <div className="relative">
            <Info className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              name="short_description"
              value={formData.short_description}
              onChange={handleInputChange}
              rows={2}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Breve descrizione della tua attività (max 150 caratteri)"
              maxLength={150}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.short_description.length}/150 caratteri
          </p>
        </div>

        {/* Descrizione Completa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrizione Completa
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descrizione dettagliata della tua attività, servizi offerti, storia, ecc."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!hasChanges || saving}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
              hasChanges && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
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
      </form>

      {/* Business Info */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2 text-blue-500" />
          Informazioni Aggiuntive
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">ID Attività:</span> {business.id}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">Slug:</span> {business.slug}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">Data Creazione:</span> {new Date(business.created_at).toLocaleDateString()}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">Ultimo Aggiornamento:</span> {new Date(business.updated_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">Piano:</span> {business.subscription_plan}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">In Evidenza:</span> {business.is_featured ? 'Sì' : 'No'}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">Verificata:</span> {business.is_verified ? 'Sì' : 'No'}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">Rating:</span> {business.rating}/5 ({business.review_count} recensioni)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetails;