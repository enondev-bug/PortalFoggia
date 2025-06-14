import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Search, Moon, Sun, User, LogOut, 
  Settings, HelpCircle, ChevronDown
} from 'lucide-react';
import { AdminUser } from '../../types/admin';
import { AdminView } from './AdminDashboard';
import { useAuth } from '../../contexts/AuthContext';
import UserProfile from '../UserProfile';
import SystemSettings from './SystemSettings';
import HelpCenter from '../HelpCenter';

interface AdminHeaderProps {
  user: AdminUser;
  currentView: AdminView;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  user, 
  currentView, 
  showNotification 
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const { logout } = useAuth();

  const viewTitles = {
    overview: 'Dashboard Overview',
    businesses: 'Gestione Attività',
    reviews: 'Gestione Recensioni',
    users: 'Gestione Utenti',
    analytics: 'Analytics & Report',
    settings: 'Impostazioni Sistema'
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      
      console.log('🚪 Admin logout initiated');
      showNotification('🚪 Disconnessione in corso...', 'info');
      
      // Esegui logout che forzerà il redirect
      await logout();
      
    } catch (error) {
      console.error('❌ Admin logout error:', error);
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

  const handleSettingsClick = () => {
    setShowSystemSettings(true);
    setShowUserMenu(false);
  };

  const handleHelpClick = () => {
    setShowHelpCenter(true);
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {viewTitles[currentView]}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gestisci e monitora la tua piattaforma
            </p>
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
                  src={user.avatar}
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
                      onClick={handleSettingsClick}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Impostazioni</span>
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
        {showSystemSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSystemSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Impostazioni Sistema
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSystemSettings(false)}
                    className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    ✕
                  </motion.button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <SystemSettings showNotification={showNotification} />
              </div>
            </motion.div>
          </motion.div>
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

export default AdminHeader;