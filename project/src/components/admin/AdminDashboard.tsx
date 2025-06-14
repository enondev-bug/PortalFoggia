import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, Building2, MessageSquare, Settings, 
  TrendingUp, Eye, Phone, Calendar, Star, AlertTriangle,
  CheckCircle, Clock, XCircle, Search, Filter, Plus,
  Edit, Trash2, MoreVertical, Download, Upload
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import DashboardOverview from './DashboardOverview';
import BusinessManagement from './BusinessManagement';
import ReviewManagement from './ReviewManagement';
import UserManagement from './UserManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import SystemSettings from './SystemSettings';
import BusinessOwnerDashboard from '../business/BusinessOwnerDashboard';
import { mockAdminUser } from '../../data/adminData';
import { useAuth } from '../../contexts/AuthContext';

export type AdminView = 'overview' | 'businesses' | 'reviews' | 'users' | 'analytics' | 'settings' | 'business_dashboard';

interface AdminDashboardProps {
  onBack: () => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, showNotification }) => {
  const [currentView, setCurrentView] = useState<AdminView>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const { isAuthenticated, profile, loading } = useAuth();

  // Verifica accesso admin
  useEffect(() => {
    if (loading) return; // Aspetta che l'auth sia caricata
    
    console.log('🔍 Checking admin access:', { 
      isAuthenticated, 
      profile: profile ? { 
        name: profile.name, 
        role: profile.role 
      } : 'no profile'
    });
    
    if (!isAuthenticated || !profile) {
      console.log('❌ No auth or profile, redirecting to home');
      showNotification('❌ Accesso negato: login richiesto', 'warning');
      onBack();
      return;
    }

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      console.log('❌ Insufficient permissions, redirecting to home');
      showNotification('❌ Accesso negato: privilegi admin richiesti', 'warning');
      onBack();
      return;
    }

    console.log('✅ Admin access verified for:', profile.name, profile.role);
    setAccessChecked(true);
    showNotification('✅ Accesso admin verificato', 'success');
  }, [isAuthenticated, profile, loading, onBack, showNotification]);

  // Se non autenticato o non admin, non renderizzare nulla
  if (loading || (!accessChecked && (!isAuthenticated || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')))) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Verifica accesso admin...</span>
      </div>
    );
  }

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
    switch (currentView) {
      case 'overview':
        return <DashboardOverview showNotification={showNotification} />;
      case 'businesses':
        return <BusinessManagement showNotification={showNotification} />;
      case 'reviews':
        return <ReviewManagement showNotification={showNotification} />;
      case 'users':
        return <UserManagement showNotification={showNotification} />;
      case 'analytics':
        return <AnalyticsDashboard showNotification={showNotification} />;
      case 'settings':
        return <SystemSettings showNotification={showNotification} />;
      case 'business_dashboard':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Dashboard Business Owner
            </h2>
            <BusinessOwnerDashboard 
              onBack={() => setCurrentView('overview')}
              showNotification={showNotification}
            />
          </div>
        );
      default:
        return <DashboardOverview showNotification={showNotification} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <AdminSidebar
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
        <AdminHeader
          user={{
            ...mockAdminUser,
            name: profile.name,
            email: profile.email,
            role: profile.role as any,
            avatar: profile.avatar_url || mockAdminUser.avatar
          }}
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

export default AdminDashboard;