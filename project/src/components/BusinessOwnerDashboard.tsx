import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Users, MessageSquare, Tag, Settings, 
  ChevronLeft, ChevronRight, Home, Shield, Star,
  Eye, Phone, Calendar, Clock, MapPin, Mail, Globe,
  Edit, Save, Image, Plus, Trash2, CheckCircle, XCircle,
  BarChart3, TrendingUp, ArrowUp, ArrowDown, Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BusinessImageManager from './admin/BusinessImageManager';

interface BusinessOwnerDashboardProps {
  onBack: () => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

type DashboardView = 'overview' | 'business' | 'reviews' | 'offers' | 'analytics' | 'settings';

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
  business_images?: Array<{
    id: string;
    url: string;
    alt_text: string | null;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
  }>;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  created_at: string;
  user: {
    name: string;
    avatar_url: string | null;
  };
}

interface Offer {
  id: string;
  title: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed' | 'bogo' | 'other' | null;
  discount_value: number | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  usage_count: number;
}

const BusinessOwnerDashboard: React.FC<BusinessOwnerDashboardProps> = ({ onBack, showNotification }) => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Business>>({});
  
  const { isAuthenticated, profile } = useAuth();

  useEffect(() => {
    if (isAuthenticated && profile) {
      loadBusinessData();
    }
  }, [isAuthenticated, profile]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      
      // Carica l'attività del proprietario
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select(`
          *,
          category:categories(name, color),
          business_images(*)
        `)
        .eq('owner_id', profile?.id)
        .single();
      
      if (businessError) {
        if (businessError.code === 'PGRST116') {
          // Nessuna attività trovata
          console.log('No business found for this owner');
          setLoading(false);
          return;
        }
        throw businessError;
      }
      
      setBusiness(businessData);
      setFormData(businessData);
      
      // Carica recensioni
      if (businessData) {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select(`
            *,
            user:profiles(name, avatar_url)
          `)
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false });
        
        if (reviewsError) throw reviewsError;
        setReviews(reviewsData || []);
        
        // Carica offerte
        const { data: offersData, error: offersError } = await supabase
          .from('offers')
          .select('*')
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false });
        
        if (offersError) throw offersError;
        setOffers(offersData || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading business data:', error);
      showNotification('❌ Errore nel caricamento dei dati', 'warning');
      setLoading(false);
    }
  };

  const handleSaveBusinessInfo = async () => {
    if (!business || !formData) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('businesses')
        .update({
          name: formData.name,
          description: formData.description,
          short_description: formData.short_description,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          updated_at: new Date().toISOString()
        })
        .eq('id', business.id);
      
      if (error) throw error;
      
      // Aggiorna i dati locali
      setBusiness(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
      showNotification('✅ Informazioni attività aggiornate con successo', 'success');
    } catch (error) {
      console.error('Error updating business:', error);
      showNotification('❌ Errore nell\'aggiornamento delle informazioni', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImagesUpdate = (updatedImages: any[]) => {
    setBusiness(prev => prev ? { ...prev, business_images: updatedImages } : null);
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

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  };

  // Verifica se l'utente è un business owner
  const isBusinessOwner = profile?.role === 'business_owner';

  if (!isAuthenticated || (!isBusinessOwner && profile?.role !== 'admin' && profile?.role !== 'super_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Accesso Negato
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Devi essere registrato come proprietario di un'attività per accedere a questa sezione.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Home
          </motion.button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 dark:text-gray-300">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  if (!business && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md">
          <Building2 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Nessuna Attività Trovata
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Non hai ancora registrato un'attività. Contatta l'amministratore per registrare la tua attività.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Home
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <motion.div
        animate={{ width: sidebarCollapsed ? 64 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-40"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Business Owner</p>
                  </div>
                </motion.div>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {[
              { id: 'overview', label: 'Dashboard', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
              { id: 'business', label: 'La Mia Attività', icon: Building2, color: 'from-green-500 to-green-600' },
              { id: 'reviews', label: 'Recensioni', icon: MessageSquare, color: 'from-purple-500 to-purple-600' },
              { id: 'offers', label: 'Offerte', icon: Tag, color: 'from-orange-500 to-orange-600' },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'from-pink-500 to-pink-600' },
              { id: 'settings', label: 'Impostazioni', icon: Settings, color: 'from-gray-500 to-gray-600' }
            ].map(({ id, label, icon: Icon, color }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentView(id as DashboardView)}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                  currentView === id
                    ? `bg-gradient-to-r ${color} text-white shadow-lg`
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-medium"
                  >
                    {label}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Back to Site */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium"
                >
                  Torna al Sito
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentView === 'overview' && 'Dashboard'}
                {currentView === 'business' && 'La Mia Attività'}
                {currentView === 'reviews' && 'Recensioni'}
                {currentView === 'offers' && 'Offerte Speciali'}
                {currentView === 'analytics' && 'Analytics'}
                {currentView === 'settings' && 'Impostazioni'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {business?.name} • {getStatusBadge(business?.status || 'pending')}
              </p>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {currentView === 'business' && !isEditing && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifica</span>
                </motion.button>
              )}
              
              {currentView === 'business' && isEditing && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveBusinessInfo}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
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
                        <span>Salva</span>
                      </>
                    )}
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            {/* Overview */}
            {currentView === 'overview' && (
              <motion.div
                key="overview"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="space-y-6"
              >
                {/* Welcome Card */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold mb-2">
                    Benvenuto, {profile?.name}!
                  </h2>
                  <p className="text-blue-100 mb-4">
                    Gestisci la tua attività {business?.name} e monitora le performance
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Eye className="h-5 w-5" />
                        <span className="font-medium">Visualizzazioni</span>
                      </div>
                      <p className="text-2xl font-bold">{business?.view_count || 0}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="h-5 w-5" />
                        <span className="font-medium">Rating</span>
                      </div>
                      <p className="text-2xl font-bold">{business?.rating || 0}/5</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Phone className="h-5 w-5" />
                        <span className="font-medium">Contatti</span>
                      </div>
                      <p className="text-2xl font-bold">{business?.contact_count || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: 'Recensioni',
                      value: reviews.length.toString(),
                      change: '+0%',
                      trend: 'up',
                      icon: MessageSquare,
                      color: 'from-purple-500 to-purple-600',
                      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
                    },
                    {
                      title: 'Offerte Attive',
                      value: offers.filter(o => o.is_active).length.toString(),
                      change: '0',
                      trend: 'up',
                      icon: Tag,
                      color: 'from-orange-500 to-orange-600',
                      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
                    },
                    {
                      title: 'Stato Attività',
                      value: business?.status === 'active' ? 'Attiva' : 
                             business?.status === 'pending' ? 'In Attesa' : 
                             business?.status === 'suspended' ? 'Sospesa' : 'Rifiutata',
                      change: '',
                      trend: 'up',
                      icon: business?.status === 'active' ? CheckCircle : 
                             business?.status === 'pending' ? Clock : 
                             business?.status === 'suspended' ? Eye : XCircle,
                      color: business?.status === 'active' ? 'from-green-500 to-green-600' : 
                             business?.status === 'pending' ? 'from-yellow-500 to-yellow-600' : 
                             business?.status === 'suspended' ? 'from-orange-500 to-orange-600' : 'from-red-500 to-red-600',
                      bgColor: business?.status === 'active' ? 'bg-green-50 dark:bg-green-900/20' : 
                               business?.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
                               business?.status === 'suspended' ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-red-50 dark:bg-red-900/20'
                    },
                    {
                      title: 'Piano',
                      value: business?.subscription_plan === 'free' ? 'Gratuito' : 
                             business?.subscription_plan === 'basic' ? 'Basic' : 
                             business?.subscription_plan === 'premium' ? 'Premium' : 'Enterprise',
                      change: '',
                      trend: 'up',
                      icon: CreditCard,
                      color: business?.subscription_plan === 'free' ? 'from-gray-500 to-gray-600' : 
                             business?.subscription_plan === 'basic' ? 'from-blue-500 to-blue-600' : 
                             business?.subscription_plan === 'premium' ? 'from-purple-500 to-purple-600' : 'from-indigo-500 to-indigo-600',
                      bgColor: business?.subscription_plan === 'free' ? 'bg-gray-50 dark:bg-gray-900/20' : 
                               business?.subscription_plan === 'basic' ? 'bg-blue-50 dark:bg-blue-900/20' : 
                               business?.subscription_plan === 'premium' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'
                    }
                  ].map((stat, index) => (
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
                        {stat.change && (
                          <div className={`flex items-center space-x-1 text-sm font-medium ${
                            stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                            <span>{stat.change}</span>
                          </div>
                        )}
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

                {/* Recent Reviews */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                    Recensioni Recenti
                  </h3>
                  
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.slice(0, 3).map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {review.user.avatar_url ? (
                                <img 
                                  src={review.user.avatar_url} 
                                  alt={review.user.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {review.user.name}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.title && (
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{review.title}</p>
                          )}
                          {review.comment && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm">{review.comment}</p>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              review.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              review.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              review.status === 'flagged' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}>
                              {review.status === 'approved' ? 'Approvata' :
                               review.status === 'pending' ? 'In attesa' :
                               review.status === 'flagged' ? 'Segnalata' : 'Rifiutata'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      
                      <div className="text-center mt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setCurrentView('reviews')}
                          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                        >
                          Vedi tutte le recensioni
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nessuna recensione
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Non hai ancora ricevuto recensioni per la tua attività
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView('business')}
                    className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-white text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Building2 className="h-6 w-6" />
                      <h3 className="text-lg font-semibold">Gestisci Attività</h3>
                    </div>
                    <p className="text-blue-100">Aggiorna informazioni e immagini</p>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView('offers')}
                    className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl text-white text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <Tag className="h-6 w-6" />
                      <h3 className="text-lg font-semibold">Gestisci Offerte</h3>
                    </div>
                    <p className="text-orange-100">Crea e modifica offerte speciali</p>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView('analytics')}
                    className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl text-white text-left hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <BarChart3 className="h-6 w-6" />
                      <h3 className="text-lg font-semibold">Visualizza Analytics</h3>
                    </div>
                    <p className="text-purple-100">Monitora le performance della tua attività</p>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Business Info */}
            {currentView === 'business' && (
              <motion.div
                key="business"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="space-y-6"
              >
                {/* Business Info Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Informazioni Attività
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gestisci i dettagli della tua attività
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nome Attività
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                            {business?.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Categoria
                        </label>
                        <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                          {business?.category?.name || 'Non specificata'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Indirizzo
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                            {business?.address}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Città
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.city || ''}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                            {business?.city}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          CAP
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.postal_code || ''}
                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                            {business?.postal_code || 'Non specificato'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Telefono
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                            {business?.phone || 'Non specificato'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                            {business?.email || 'Non specificato'}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sito Web
                        </label>
                        {isEditing ? (
                          <input
                            type="url"
                            value={formData.website || ''}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                            {business?.website ? (
                              <a 
                                href={business.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {business.website}
                              </a>
                            ) : (
                              'Non specificato'
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descrizione Breve
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.short_description || ''}
                          onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          maxLength={100}
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                          {business?.short_description || 'Non specificata'}
                        </p>
                      )}
                      {isEditing && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(formData.short_description?.length || 0)}/100 caratteri
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descrizione Completa
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white min-h-[100px]">
                          {business?.description || 'Non specificata'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Business Images */}
                {business && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Immagini Attività
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Gestisci logo e galleria fotografica
                        </p>
                      </div>
                    </div>

                    <BusinessImageManager
                      businessId={business.id}
                      businessName={business.name}
                      images={business.business_images || []}
                      onImagesUpdate={handleImagesUpdate}
                      showNotification={showNotification}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Reviews */}
            {currentView === 'reviews' && (
              <motion.div
                key="reviews"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Recensioni
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {reviews.length} recensioni totali
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-sm font-medium">
                        {reviews.filter(r => r.status === 'approved').length} Approvate
                      </span>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm font-medium">
                        {reviews.filter(r => r.status === 'pending').length} In Attesa
                      </span>
                    </div>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review, index) => (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {review.user.avatar_url ? (
                                <img 
                                  src={review.user.avatar_url} 
                                  alt={review.user.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {review.user.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {review.title && (
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{review.title}</p>
                          )}
                          {review.comment && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm">{review.comment}</p>
                          )}
                          <div className="flex justify-end mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              review.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              review.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              review.status === 'flagged' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}>
                              {review.status === 'approved' ? 'Approvata' :
                               review.status === 'pending' ? 'In attesa' :
                               review.status === 'flagged' ? 'Segnalata' : 'Rifiutata'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nessuna recensione
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Non hai ancora ricevuto recensioni per la tua attività
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Offers */}
            {currentView === 'offers' && (
              <motion.div
                key="offers"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <Tag className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Offerte Speciali
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Gestisci promozioni e sconti
                        </p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => showNotification('🔧 Funzione aggiungi offerta in sviluppo', 'info')}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Nuova Offerta</span>
                    </motion.button>
                  </div>

                  {offers.length > 0 ? (
                    <div className="space-y-4">
                      {offers.map((offer, index) => (
                        <motion.div
                          key={offer.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border-2 ${
                            offer.is_active 
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {offer.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              offer.is_active 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}>
                              {offer.is_active ? 'Attiva' : 'Inattiva'}
                            </span>
                          </div>
                          
                          {offer.description && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                              {offer.description}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {offer.discount_type && offer.discount_value && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Sconto:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                  {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : 
                                   offer.discount_type === 'fixed' ? `€${offer.discount_value}` : 
                                   offer.discount_type === 'bogo' ? 'Compra 1 Prendi 2' : 
                                   `${offer.discount_value}`}
                                </span>
                              </div>
                            )}
                            
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Utilizzi:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {offer.usage_count}
                              </span>
                            </div>
                            
                            {offer.start_date && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Inizio:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                  {new Date(offer.start_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            
                            {offer.end_date && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Fine:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                  {new Date(offer.end_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-end mt-3 space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => showNotification('🔧 Funzione modifica offerta in sviluppo', 'info')}
                              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => showNotification('🔧 Funzione elimina offerta in sviluppo', 'info')}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nessuna offerta
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Non hai ancora creato offerte speciali per la tua attività
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => showNotification('🔧 Funzione aggiungi offerta in sviluppo', 'info')}
                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Plus className="h-4 w-4 inline mr-2" />
                        Crea Prima Offerta
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Analytics */}
            {currentView === 'analytics' && (
              <motion.div
                key="analytics"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Analytics
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Statistiche e performance della tua attività
                      </p>
                    </div>
                  </div>

                  {/* Performance Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
                          <ArrowUp className="h-4 w-4" />
                          <span>+12%</span>
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {business?.view_count || 0}
                      </h4>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        Visualizzazioni Totali
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <Phone className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
                          <ArrowUp className="h-4 w-4" />
                          <span>+5%</span>
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {business?.contact_count || 0}
                      </h4>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        Contatti Ricevuti
                      </p>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                          <Star className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
                          <ArrowUp className="h-4 w-4" />
                          <span>+0.2</span>
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {business?.rating || 0}/5
                      </h4>
                      <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                        Rating Medio ({business?.review_count || 0} recensioni)
                      </p>
                    </div>
                  </div>

                  {/* Conversion Stats */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-8">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Tasso di Conversione
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Visualizzazioni → Contatti
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {business && business.view_count > 0 
                              ? ((business.contact_count / business.view_count) * 100).toFixed(1) 
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
                            style={{ 
                              width: `${business && business.view_count > 0 
                                ? Math.min(((business.contact_count / business.view_count) * 100), 100) 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coming Soon */}
                  <div className="text-center py-8">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                      Analytics Avanzate in Arrivo
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-6">
                      Stiamo lavorando per offrirti statistiche ancora più dettagliate e approfondite sulla performance della tua attività.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => showNotification('🔧 Funzionalità in sviluppo', 'info')}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Scopri di Più
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings */}
            {currentView === 'settings' && (
              <motion.div
                key="settings"
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="space-y-6"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Impostazioni
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gestisci le impostazioni della tua attività
                      </p>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Informazioni Account
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
                          <p className="font-medium text-gray-900 dark:text-white">{profile?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-white">{profile?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Ruolo</p>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {profile?.role?.replace('_', ' ') || 'Business Owner'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Membro dal</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Settings */}
                  <div className="mb-8">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Impostazioni Attività
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Piano Abbonamento</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {business?.subscription_plan === 'free' ? 'Gratuito' : 
                             business?.subscription_plan === 'basic' ? 'Basic' : 
                             business?.subscription_plan === 'premium' ? 'Premium' : 'Enterprise'}
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => showNotification('🔧 Funzione upgrade piano in sviluppo', 'info')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Upgrade
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Stato Attività</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {business?.status === 'active' ? 'Attiva (in vetrina)' : 
                             business?.status === 'pending' ? 'In attesa di approvazione' : 
                             business?.status === 'suspended' ? 'Sospesa (nascosta)' : 'Rifiutata'}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(business?.status || 'pending')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Verifica Attività</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {business?.is_verified ? 'Attività verificata' : 'Attività non verificata'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          business?.is_verified 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          <Shield className="h-3 w-3" />
                          <span>{business?.is_verified ? 'Verificata' : 'Non Verificata'}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">In Evidenza</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {business?.is_featured ? 'Attività in evidenza' : 'Attività non in evidenza'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          business?.is_featured 
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          <Crown className="h-3 w-3" />
                          <span>{business?.is_featured ? 'In Evidenza' : 'Standard'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Help & Support */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Aiuto e Supporto
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => showNotification('📧 Apertura client email...', 'info')}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Contatta Supporto</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Invia email al team di supporto</p>
                          </div>
                        </div>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => showNotification('📚 Centro assistenza in arrivo!', 'info')}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Centro Assistenza</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Guide e documentazione</p>
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default BusinessOwnerDashboard;