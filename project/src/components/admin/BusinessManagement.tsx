import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, Edit, Trash2, Eye, MoreVertical,
  Building2, Star, MapPin, Phone, Mail, Globe, Clock,
  CheckCircle, XCircle, AlertTriangle, Crown, Shield,
  Users, TrendingUp, Calendar, Tag, Image, Camera,
  ChevronDown, ChevronRight, Download, Upload, Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import BusinessImageManager from './BusinessImageManager';
import BusinessRegistrationModal from './BusinessRegistrationModal';

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  address: string;
  city: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  is_featured: boolean;
  is_verified: boolean;
  rating: number;
  review_count: number;
  view_count: number;
  contact_count: number;
  created_at: string;
  updated_at: string;
  category?: {
    name: string;
    color: string;
  };
  owner?: {
    name: string;
    email: string;
    phone: string | null;
  };
  business_images?: Array<{
    id: string;
    url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
  }>;
}

interface BusinessManagementProps {
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessManagement: React.FC<BusinessManagementProps> = ({ showNotification }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'rejected'>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [expandedBusiness, setExpandedBusiness] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          category:categories(name, color),
          owner:profiles(name, email, phone),
          business_images(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBusinesses(data || []);
      console.log('✅ Loaded', data?.length || 0, 'businesses');
    } catch (error) {
      console.error('❌ Error loading businesses:', error);
      showNotification('❌ Errore nel caricamento delle attività', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = 
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.owner?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || business.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (businessId: string, newStatus: Business['status']) => {
    if (processingIds.has(businessId)) return;
    
    try {
      setProcessingIds(prev => new Set(prev).add(businessId));
      
      const { error } = await supabase
        .from('businesses')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(prev => prev.map(business => 
        business.id === businessId 
          ? { ...business, status: newStatus, updated_at: new Date().toISOString() }
          : business
      ));
      
      const statusMessages = {
        active: 'attivata e messa in vetrina',
        suspended: 'nascosta dalla vetrina',
        pending: 'messa in attesa di approvazione',
        rejected: 'rifiutata'
      };
      
      showNotification(`✅ Attività ${statusMessages[newStatus]}`, 'success');
    } catch (error) {
      console.error('❌ Error updating business status:', error);
      showNotification('❌ Errore nell\'aggiornamento dello stato', 'warning');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(businessId);
        return newSet;
      });
    }
  };

  const handleToggleFeatured = async (businessId: string, featured: boolean) => {
    if (processingIds.has(businessId)) return;
    
    try {
      setProcessingIds(prev => new Set(prev).add(businessId));
      
      const { error } = await supabase
        .from('businesses')
        .update({ 
          is_featured: featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(prev => prev.map(business => 
        business.id === businessId 
          ? { ...business, is_featured: featured, updated_at: new Date().toISOString() }
          : business
      ));
      
      showNotification(
        featured ? '⭐ Attività messa in evidenza' : '📍 Attività rimossa dall\'evidenza', 
        'success'
      );
    } catch (error) {
      console.error('❌ Error updating featured status:', error);
      showNotification('❌ Errore nell\'aggiornamento', 'warning');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(businessId);
        return newSet;
      });
    }
  };

  const handleToggleVerified = async (businessId: string, verified: boolean) => {
    if (processingIds.has(businessId)) return;
    
    try {
      setProcessingIds(prev => new Set(prev).add(businessId));
      
      const { error } = await supabase
        .from('businesses')
        .update({ 
          is_verified: verified,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(prev => prev.map(business => 
        business.id === businessId 
          ? { ...business, is_verified: verified, updated_at: new Date().toISOString() }
          : business
      ));
      
      showNotification(
        verified ? '✅ Attività verificata' : '❌ Verifica rimossa', 
        'success'
      );
    } catch (error) {
      console.error('❌ Error updating verified status:', error);
      showNotification('❌ Errore nell\'aggiornamento della verifica', 'warning');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(businessId);
        return newSet;
      });
    }
  };

  const handleImagesUpdate = (businessId: string, updatedImages: any[]) => {
    setBusinesses(prev => prev.map(business => 
      business.id === businessId 
        ? { ...business, business_images: updatedImages }
        : business
    ));
  };

  const getStatusColor = (status: Business['status']) => {
    switch (status) {
      case 'active': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'pending': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'suspended': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'rejected': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'border-gray-300 dark:border-gray-600';
    }
  };

  const getStatusBadge = (status: Business['status']) => {
    const configs = {
      active: { label: 'In Vetrina', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
      pending: { label: 'In Attesa', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
      suspended: { label: 'Nascosta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: Eye },
      rejected: { label: 'Rifiutata', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle }
    };
    
    const config = configs[status];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </span>
    );
  };

  const getPlanBadge = (plan: Business['subscription_plan']) => {
    const configs = {
      free: { label: 'Gratuito', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
      basic: { label: 'Basic', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
      enterprise: { label: 'Enterprise', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' }
    };
    
    const config = configs[plan];
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleBusinessCreated = () => {
    loadBusinesses();
    showNotification('✅ Attività creata con successo!', 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento attività...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Attività
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredBusinesses.length} di {businesses.length} attività
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowRegistrationModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Aggiungi Attività</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Totali', value: businesses.length, color: 'blue', icon: Building2 },
          { label: 'In Vetrina', value: businesses.filter(b => b.status === 'active').length, color: 'green', icon: CheckCircle },
          { label: 'In Evidenza', value: businesses.filter(b => b.is_featured).length, color: 'yellow', icon: Star },
          { label: 'Nascoste', value: businesses.filter(b => b.status === 'suspended').length, color: 'orange', icon: Eye },
          { label: 'In Attesa', value: businesses.filter(b => b.status === 'pending').length, color: 'purple', icon: Clock }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 border border-${stat.color}-200 dark:border-${stat.color}-800 rounded-xl`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-600 rounded-lg flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca attività..."
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
            <option value="active">In Vetrina</option>
            <option value="pending">In Attesa</option>
            <option value="suspended">Nascoste</option>
            <option value="rejected">Rifiutate</option>
          </select>
        </div>
      </div>

      {/* Businesses List */}
      <div className="space-y-4">
        {filteredBusinesses.map((business, index) => (
          <motion.div
            key={business.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all hover:shadow-lg ${getStatusColor(business.status)}`}
          >
            {/* Main Business Info */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {business.name}
                    </h3>
                    {getStatusBadge(business.status)}
                    {getPlanBadge(business.subscription_plan)}
                    {business.is_featured && (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-semibold">
                        <Crown className="h-3 w-3" />
                        <span>In Evidenza</span>
                      </span>
                    )}
                    {business.is_verified && (
                      <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-semibold">
                        <Shield className="h-3 w-3" />
                        <span>Verificata</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{business.city}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4" />
                      <span>{business.category?.name || 'Nessuna categoria'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4" />
                      <span>{business.rating}/5 ({business.review_count} recensioni)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>{business.view_count} visualizzazioni</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Status Actions */}
                  {business.status === 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(business.id, 'active')}
                      disabled={processingIds.has(business.id)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                    >
                      Approva
                    </motion.button>
                  )}
                  
                  {business.status === 'active' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(business.id, 'suspended')}
                      disabled={processingIds.has(business.id)}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
                    >
                      Nascondi
                    </motion.button>
                  )}
                  
                  {business.status === 'suspended' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(business.id, 'active')}
                      disabled={processingIds.has(business.id)}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                    >
                      Mostra
                    </motion.button>
                  )}
                  
                  {business.status === 'rejected' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStatusChange(business.id, 'pending')}
                      disabled={processingIds.has(business.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                    >
                      Riattiva
                    </motion.button>
                  )}

                  {/* Featured Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleFeatured(business.id, !business.is_featured)}
                    disabled={processingIds.has(business.id)}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                      business.is_featured
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                    title={business.is_featured ? 'Rimuovi dall\'evidenza' : 'Metti in evidenza'}
                  >
                    <Star className={`h-4 w-4 ${business.is_featured ? 'fill-current' : ''}`} />
                  </motion.button>

                  {/* Verified Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleVerified(business.id, !business.is_verified)}
                    disabled={processingIds.has(business.id)}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                      business.is_verified
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                    title={business.is_verified ? 'Rimuovi verifica' : 'Verifica attività'}
                  >
                    <Shield className="h-4 w-4" />
                  </motion.button>

                  {/* Expand/Collapse */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setExpandedBusiness(expandedBusiness === business.id ? null : business.id)}
                    className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {expandedBusiness === business.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedBusiness === business.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="p-6 space-y-6">
                    {/* Business Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Informazioni Attività
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{business.address}, {business.city}</span>
                          </div>
                          {business.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">{business.phone}</span>
                            </div>
                          )}
                          {business.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">{business.email}</span>
                            </div>
                          )}
                          {business.website && (
                            <div className="flex items-center space-x-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <a 
                                href={business.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {business.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Proprietario
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300">{business.owner?.name || 'Non specificato'}</span>
                          </div>
                          {business.owner?.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">{business.owner.email}</span>
                            </div>
                          )}
                          {business.owner?.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-300">{business.owner.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {business.description && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Descrizione
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                          {business.description}
                        </p>
                      </div>
                    )}

                    {/* Image Management */}
                    <div>
                      <BusinessImageManager
                        businessId={business.id}
                        businessName={business.name}
                        images={business.business_images || []}
                        onImagesUpdate={(updatedImages) => handleImagesUpdate(business.id, updatedImages)}
                        showNotification={showNotification}
                      />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{business.rating}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Rating</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{business.review_count}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Recensioni</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{business.view_count}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Visualizzazioni</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{business.contact_count}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Contatti</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {filteredBusinesses.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessuna attività trovata
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || statusFilter !== 'all' 
              ? 'Prova a modificare i filtri di ricerca' 
              : 'Non ci sono ancora attività registrate'
            }
          </p>
        </div>
      )}

      {/* Business Registration Modal */}
      <BusinessRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        showNotification={showNotification}
        onBusinessCreated={handleBusinessCreated}
      />
    </div>
  );
};

export default BusinessManagement;