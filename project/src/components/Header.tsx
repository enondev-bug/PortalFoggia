import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Moon, Sun, Home, Grid3X3, ArrowLeft, Bell, User, Menu, X, Shield, LogOut, Settings, Heart, HelpCircle, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './auth/AuthModal';
import UserProfile from './UserProfile';
import FavoritesPage from './FavoritesPage';
import HelpCenter from './HelpCenter';
import BusinessOwnerDashboard from './BusinessOwnerDashboard';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentView: 'home' | 'directory' | 'detail';
  setCurrentView: (view: 'home' | 'directory' | 'detail') => void;
  onBackToHome: () => void;
  onBackToDirectory: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAdminAccess: () => void;
  onViewBusiness: (id: number) => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  darkMode, 
  setDarkMode, 
  currentView, 
  setCurrentView,
  onBackToHome,
  onBackToDirectory,
  searchQuery,
  setSearchQuery,
  onAdminAccess,
  onViewBusiness,
  showNotification
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showBusinessDashboard, setShowBusinessDashboard] = useState(false);

  const { isAuthenticated, profile, logout, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
        setIsMobileMenuOpen(false);
        setShowUserMenu(false);
      } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleAuthAction = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
    setShowUserMenu(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Previeni doppi click
    
    try {
      setIsLoggingOut(true);
      setShowUserMenu(false);
      setIsMobileMenuOpen(false);
      
      // Mostra notifica immediata
      showNotification('🚪 Disconnessione in corso...', 'info');
      
      // Esegui logout
      await logout();
      
      // Il reindirizzamento è gestito nel context
      showNotification('✅ Disconnesso con successo', 'success');
      
    } catch (error) {
      console.error('Logout error:', error);
      showNotification('❌ Errore durante la disconnessione', 'warning');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAdminAccess = () => {
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      onAdminAccess();
      setShowUserMenu(false);
    } else {
      showNotification('❌ Accesso negato: privilegi admin richiesti', 'warning');
    }
  };

  const handleBusinessDashboard = () => {
    if (profile?.role === 'business_owner' || profile?.role === 'admin' || profile?.role === 'super_admin') {
      setShowBusinessDashboard(true);
      setShowUserMenu(false);
    } else {
      showNotification('❌ Accesso negato: devi essere proprietario di un\'attività', 'warning');
    }
  };

  const handleProfileClick = () => {
    setShowUserProfile(true);
    setShowUserMenu(false);
  };

  const handleFavoritesClick = () => {
    setShowFavorites(true);
    setShowUserMenu(false);
  };

  const handleHelpClick = () => {
    setShowHelp(true);
    setShowUserMenu(false);
  };

  // Mostra la dashboard business owner se attiva
  if (showBusinessDashboard) {
    return (
      <BusinessOwnerDashboard 
        onBack={() => setShowBusinessDashboard(false)}
        showNotification={showNotification}
      />
    );
  }

  return (
    <>
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: isHeaderVisible ? 0 : -100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          darkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
        } backdrop-blur-xl border-b shadow-lg`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {currentView === 'detail' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBackToDirectory}
                  className={`p-2 rounded-xl transition-colors ${
                    darkMode ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
              )}
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3 cursor-pointer"
                onClick={onBackToHome}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">PF</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Portale Foggiano 
                  </h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Scopri • Connetti • Cresci
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Center Search */}
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <motion.div 
                className="relative"
                animate={{ scale: isSearchFocused ? 1.02 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
                  isSearchFocused 
                    ? 'text-blue-500' 
                    : darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Cerca attività, servizi, prodotti..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                    isSearchFocused
                      ? 'border-blue-500 shadow-lg'
                      : darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none`}
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                )}
              </motion.div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2">
              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1 mr-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBackToHome}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                    currentView === 'home'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView('directory')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                    currentView === 'directory' || currentView === 'detail'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Directory</span>
                </motion.button>
              </nav>

              {/* Notifications */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => showNotification('🔔 3 nuove notifiche', 'info')}
                className={`p-3 rounded-xl transition-colors relative ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Bell className="h-5 w-5" />
                {isAuthenticated && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </motion.button>

              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDarkMode(!darkMode)}
                className={`p-3 rounded-xl transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.button>

              {/* User Menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  disabled={loading || isLoggingOut}
                  className={`flex items-center space-x-2 p-3 rounded-xl transition-colors disabled:opacity-50 ${
                    darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {isAuthenticated && profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  {isAuthenticated && (
                    <span className="hidden md:inline text-sm font-medium">
                      {profile?.name}
                    </span>
                  )}
                  {(loading || isLoggingOut) && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                  )}
                </motion.button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {showUserMenu && !loading && !isLoggingOut && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-64 rounded-xl shadow-lg border z-50 ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-700' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="py-2">
                        {isAuthenticated ? (
                          <>
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                              <div className="flex items-center space-x-3">
                                {profile?.avatar_url && (
                                  <img 
                                    src={profile.avatar_url} 
                                    alt={profile.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {profile?.name}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {profile?.email}
                                  </p>
                                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                    profile?.role === 'admin' || profile?.role === 'super_admin'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                      : profile?.role === 'business_owner'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  }`}>
                                    {profile?.role === 'admin' || profile?.role === 'super_admin' 
                                      ? 'Amministratore' 
                                      : profile?.role === 'business_owner'
                                      ? 'Proprietario Attività'
                                      : 'Utente'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Menu Items */}
                            <button
                              onClick={handleProfileClick}
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                                darkMode 
                                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Settings className="h-4 w-4" />
                              <span>Profilo e Impostazioni</span>
                            </button>

                            <button
                              onClick={handleFavoritesClick}
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                                darkMode 
                                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Heart className="h-4 w-4" />
                              <span>I Miei Preferiti</span>
                            </button>

                            {/* Business Owner Dashboard */}
                            {(profile?.role === 'business_owner' || profile?.role === 'admin' || profile?.role === 'super_admin') && (
                              <button
                                onClick={handleBusinessDashboard}
                                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                                  darkMode 
                                    ? 'text-green-400 hover:bg-gray-700 hover:text-green-300' 
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                              >
                                <Building2 className="h-4 w-4" />
                                <span>Dashboard Attività</span>
                              </button>
                            )}

                            <button
                              onClick={handleHelpClick}
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                                darkMode 
                                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <HelpCircle className="h-4 w-4" />
                              <span>Centro Assistenza</span>
                            </button>

                            {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                              <>
                                <hr className={`my-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                                <button
                                  onClick={handleAdminAccess}
                                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                                    darkMode 
                                      ? 'text-purple-400 hover:bg-gray-700 hover:text-purple-300' 
                                      : 'text-purple-600 hover:bg-purple-50'
                                  }`}
                                >
                                  <Shield className="h-4 w-4" />
                                  <span>Dashboard Admin</span>
                                </button>
                              </>
                            )}

                            <hr className={`my-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                            
                            <button
                              onClick={handleLogout}
                              disabled={isLoggingOut}
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                                darkMode 
                                  ? 'text-red-400 hover:bg-gray-700' 
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <LogOut className="h-4 w-4" />
                              <span>{isLoggingOut ? 'Disconnessione...' : 'Logout'}</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAuthAction('login')}
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                                darkMode 
                                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <User className="h-4 w-4" />
                              <span>Accedi</span>
                            </button>
                            
                            <button
                              onClick={() => handleAuthAction('register')}
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                                darkMode 
                                  ? 'text-blue-400 hover:bg-gray-700 hover:text-blue-300' 
                                  : 'text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              <User className="h-4 w-4" />
                              <span>Registrati</span>
                            </button>

                            <hr className={`my-2 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                            
                            <button
                              onClick={handleHelpClick}
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                                darkMode 
                                  ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <HelpCircle className="h-4 w-4" />
                              <span>Centro Assistenza</span>
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden p-3 rounded-xl transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4"
              >
                <div className="space-y-4">
                  {/* Mobile Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cerca..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        onBackToHome();
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
                        currentView === 'home'
                          ? 'bg-blue-600 text-white'
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Home className="h-4 w-4" />
                      <span>Home</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentView('directory');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg transition-colors ${
                        currentView === 'directory' || currentView === 'detail'
                          ? 'bg-blue-600 text-white'
                          : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                      <span>Directory</span>
                    </button>
                  </div>

                  {/* Mobile Auth Actions */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {profile?.avatar_url && (
                            <img 
                              src={profile.avatar_url} 
                              alt={profile.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {profile?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {profile?.role === 'admin' || profile?.role === 'super_admin' 
                                ? 'Amministratore' 
                                : profile?.role === 'business_owner'
                                ? 'Proprietario Attività'
                                : 'Utente'}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            handleProfileClick();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Profilo</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            handleFavoritesClick();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Heart className="h-4 w-4" />
                          <span>Preferiti</span>
                        </button>
                        
                        {/* Business Owner Dashboard Button */}
                        {(profile?.role === 'business_owner' || profile?.role === 'admin' || profile?.role === 'super_admin') && (
                          <button
                            onClick={() => {
                              handleBusinessDashboard();
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Building2 className="h-4 w-4" />
                            <span>Dashboard Attività</span>
                          </button>
                        )}
                        
                        {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                          <button
                            onClick={() => {
                              handleAdminAccess();
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Shield className="h-4 w-4" />
                            <span>Dashboard Admin</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          disabled={isLoggingOut}
                          className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{isLoggingOut ? 'Disconnessione...' : 'Logout'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            handleAuthAction('login');
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex-1 flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span>Accedi</span>
                        </button>
                        <button
                          onClick={() => {
                            handleAuthAction('register');
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex-1 flex items-center justify-center space-x-2 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span>Registrati</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
        showNotification={showNotification}
      />

      <AnimatePresence>
        {showUserProfile && (
          <UserProfile
            onClose={() => setShowUserProfile(false)}
            showNotification={showNotification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFavorites && (
          <FavoritesPage
            onClose={() => setShowFavorites(false)}
            onViewBusiness={onViewBusiness}
            showNotification={showNotification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <HelpCenter
            onClose={() => setShowHelp(false)}
            showNotification={showNotification}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;