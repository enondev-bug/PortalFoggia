import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Building2, MessageSquare, Settings, 
  TrendingUp, Eye, Phone, Calendar, Star, Tag,
  CheckCircle, Clock, XCircle, Search, Filter, Plus,
  Edit, Trash2, MoreVertical, Download, Upload, Image,
  Mail, Globe, MapPin, Heart, Users, DollarSign, Zap,
  Bell, AlertTriangle, CheckSquare, FileText, Camera
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import BusinessOwnerSidebar from './BusinessOwnerSidebar';
import BusinessOwnerHeader from './BusinessOwnerHeader';
import BusinessOverview from './BusinessOverview';
import BusinessDetails from './BusinessDetails';
import BusinessReviews from './BusinessReviews';
import BusinessOffers from './BusinessOffers';
import BusinessAnalytics from './BusinessAnalytics';
import BusinessContacts from './BusinessContacts';
import BusinessImageManager from '../admin/BusinessImageManager';

export type BusinessOwnerView = 'overview' | 'details' | 'reviews' | 'offers' | 'analytics' | 'contacts' | 'images';

interface BusinessOwnerDashboardProps {
  onBack: () => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessOwnerDashboard: React.FC<BusinessOwnerDashboardProps> = ({ 
  onBack, 
  showNotification 
}) => {
  const [currentView, setCurrentView] = useState<BusinessOwnerView>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any | null>(null);
  
  const { isAuthenticated, profile } = useAuth();

  // Verifica accesso business owner
  useEffect(() => {
    if (!isAuthenticated || !profile) {
      console.log('❌ No auth or profile, redirecting to home');
      showNotification('❌ Accesso negato: login richiesto', 'warning');
      onBack();
      return;
    }

    if (profile.role !== 'business_owner' && profile.role !== 'admin' && profile.role !== 'super_admin') {
      console.log('❌ Insufficient permissions, redirecting to home');
      showNotification('❌ Accesso negato: privilegi business owner richiesti', 'warning');
      onBack();
      return;
    }

    console.log('✅ Business owner access verified for:', profile.name, profile.role);
    loadBusinesses();
  }, [isAuthenticated, profile, onBack, showNotification]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_user_businesses', {
        user_id: profile?.id
      });

      if (error) throw error;

      console.log('✅ Loaded', data?.length || 0, 'businesses');
      setBusinesses(data || []);
      
      // Seleziona la prima attività se disponibile
      if (data && data.length > 0) {
        setSelectedBusiness(data[0]);
        loadBusinessStats(data[0].id);
      }
    } catch (error) {
      console.error('❌ Error loading businesses:', error);
      showNotification('❌ Errore nel caricamento delle attività', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessStats = async (businessId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_business_stats', {
        business_id: businessId
      });

      if (error) throw error;

      setStats(data);
      console.log('✅ Loaded business stats:', data);
    } catch (error) {
      console.error('❌ Error loading business stats:', error);
      showNotification('❌ Errore nel caricamento delle statistiche', 'warning');
    }
  };

  const handleBusinessChange = (business: any) => {
    setSelectedBusiness(business);
    loadBusinessStats(business.id);
  };

  const handleBusinessUpdate = async (businessId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', businessId)
        .select()
        .single();

      if (error) throw error;

      // Aggiorna la lista delle attività
      setBusinesses(prev => prev.map(b => 
        b.id === businessId ? data : b
      ));
      
      // Aggiorna l'attività selezionata se necessario
      if (selectedBusiness?.id === businessId) {
        setSelectedBusiness(data);
      }
      
      showNotification('✅ Attività aggiornata con successo', 'success');
      return data;
    } catch (error) {
      console.error('❌ Error updating business:', error);
      showNotification('❌ Errore nell\'aggiornamento dell\'attività', 'warning');
      throw error;
    }
  };

  const handleImagesUpdate = (businessId: string, updatedImages: any[]) => {
    // Aggiorna lo stato locale se necessario
    if (selectedBusiness?.id === businessId) {
      setSelectedBusiness(prev => ({
        ...prev,
        business_images: updatedImages
      }));
    }
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

  const renderCurrentView = () => {
    if (!selectedBusiness) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Nessuna attività selezionata
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
            Seleziona un'attività dal menu laterale o crea una nuova attività per iniziare
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => showNotification('🔧 Funzione aggiungi attività in sviluppo', 'info')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2 inline-block" />
            Crea Nuova Attività
          </motion.button>
        </div>
      );
    }

    switch (currentView) {
      case 'overview':
        return <BusinessOverview 
          business={selectedBusiness} 
          stats={stats}
          showNotification={showNotification}
        />;
      case 'details':
        return <BusinessDetails 
          business={selectedBusiness} 
          onUpdate={(updates) => handleBusinessUpdate(selectedBusiness.id, updates)}
          showNotification={showNotification}
        />;
      case 'reviews':
        return <BusinessReviews 
          business={selectedBusiness} 
          showNotification={showNotification}
        />;
      case 'offers':
        return <BusinessOffers 
          business={selectedBusiness} 
          showNotification={showNotification}
        />;
      case 'analytics':
        return <BusinessAnalytics 
          business={selectedBusiness} 
          showNotification={showNotification}
        />;
      case 'contacts':
        return <BusinessContacts 
          business={selectedBusiness} 
          showNotification={showNotification}
        />;
      case 'images':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestione Immagini
            </h2>
            <BusinessImageManager
              businessId={selectedBusiness.id}
              businessName={selectedBusiness.name}
              images={selectedBusiness.business_images || []}
              onImagesUpdate={(updatedImages) => handleImagesUpdate(selectedBusiness.id, updatedImages)}
              showNotification={showNotification}
            />
          </div>
        );
      default:
        return <BusinessOverview 
          business={selectedBusiness} 
          stats={stats}
          showNotification={showNotification}
        />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <BusinessOwnerSidebar
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onBusinessSelect={handleBusinessChange}
        currentView={currentView}
        setCurrentView={setCurrentView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onBack={onBack}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <BusinessOwnerHeader
          user={profile}
          business={selectedBusiness}
          currentView={currentView}
          showNotification={showNotification}
        />

        {/* Page Content */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default BusinessOwnerDashboard;