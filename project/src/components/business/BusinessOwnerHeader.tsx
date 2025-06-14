import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Search, Moon, Sun, User, LogOut, 
  Settings, HelpCircle, ChevronDown, Building2,
  CheckCircle, Clock, AlertCircle, Eye
} from 'lucide-react';
import { BusinessOwnerView } from './BusinessOwnerDashboard';
import { useAuth } from '../../contexts/AuthContext';
import UserProfile from '../UserProfile';
import HelpCenter from '../HelpCenter';

interface BusinessOwnerHeaderProps {
  user: any;
  business: any | null;
  currentView: BusinessOwnerView;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessOwnerHeader: React.FC<BusinessOwnerHeaderProps> = ({ 
  user, 
  business, 
  currentView, 
  showNotification 
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const { logout } = useAuth();

  const viewTitles = {
    overview: 'Dashboard Attività',
    details: 'Dettagli Attività',
    reviews: 'Gestione Recensioni',
    offers: 'Offerte Speciali',
    analytics: 'Analytics & Statistiche',
    contacts: 'Richieste di Contatto',
    images: 'Gestione Immagini'
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            <span>Attiva</span>
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3" />
            <span>In Attesa</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            <span>Sospesa</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      
      console.log('🚪 Business owner logout initiated');
      showNotification('🚪 Disconnessione in corso...', 'info');
      
      // Esegui logout che forzerà il redirect
      await logout();
      
    } catch (error) {
      console.error('❌ Business owner logout error:', error);
      showNotification('❌ Errore durante la disconnessione', 'warning');
      
      // Forza comunque il redirect in caso di errore
      setTimeout(() => {
        window.location.replace('/');
      }, 1000);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleProfileClick = () => {
    setShowUserProfile(true);
    setShowUserMenu(false);
  };

  const handleHelpClick = () => {
    setShowHelpCenter(true);
    setShowUserMenu(false);
  };

  const handleViewBusiness = () => {
    if (!business) return;
    
    // Apri la pagina dell'attività in una nuova tab
    window.open(`/business/${business.slug || business.id}`, '_blank');
    showNotification('🔍 Visualizzazione pubblica dell\'attività', 'info');
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {viewTitles[currentView]}
              </h1>
              
              {business && getStatusBadge(business.status)}
              
              {business && business.is_featured && (
                <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-xs font-medium">
                  In Evidenza
                </span>
              )}
              
              {business && business.is_verified && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                  Verificata
                </span>
              )}
            </div>
            
            {business && (
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                  {business.name}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewBusiness}
                  className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Eye className="h-3 w-3" />
                  <span>Visualizza pubblica</span>
                </motion.button>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => showNotification('🔔 3 nuove notifiche', 'info')}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </motion.button>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </motion.button>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                disabled={isLoggingOut}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-colors disabled:opacity-50 ${
                  isLoggingOut ? 'cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <img
                  src={user.avatar_url || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
                {isLoggingOut ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </motion.button>

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && !isLoggingOut && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    <button 
                      onClick={handleProfileClick}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <User className="h-4 w-4" />
                      <span>Profilo</span>
                    </button>
                    <button 
                      onClick={handleHelpClick}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span>Aiuto</span>
                    </button>
                    <hr className="my-2 border-gray-200 dark:border-gray-700" />
                    <button 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"
                          />
                          <span>Disconnessione...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <AnimatePresence>
        {showUserProfile && (
          <UserProfile
            onClose={() => setShowUserProfile(false)}
            showNotification={showNotification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelpCenter && (
          <HelpCenter
            onClose={() => setShowHelpCenter(false)}
            showNotification={showNotification}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default BusinessOwnerHeader;