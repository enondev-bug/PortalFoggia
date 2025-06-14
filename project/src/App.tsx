import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedBusinesses from './components/FeaturedBusinesses';
import BusinessDirectory from './components/BusinessDirectory';
import BusinessDetail from './components/BusinessDetail';
import AdminDashboard from './components/admin/AdminDashboard';
import BusinessOwnerDashboard from './components/business/BusinessOwnerDashboard';
import Footer from './components/Footer';
import QuickActions from './components/QuickActions';
import NotificationToast from './components/NotificationToast';
import { AuthProvider } from './contexts/AuthContext';
import { analytics } from './lib/analytics';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'directory' | 'detail' | 'admin' | 'business'>('home');
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'warning'} | null>(null);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 📊 TRACCIA CAMBIO PAGINA
  useEffect(() => {
    const trackPageView = async () => {
      await analytics.trackEvent('page_view', 'user', {
        page: currentView,
        title: getPageTitle(),
        timestamp: new Date().toISOString()
      });
    };
    
    trackPageView();
  }, [currentView]);

  const getPageTitle = () => {
    switch (currentView) {
      case 'home': return 'Home - Business Hub';
      case 'directory': return 'Directory Attività - Business Hub';
      case 'detail': return 'Dettaglio Attività - Business Hub';
      case 'admin': return 'Dashboard Admin - Business Hub';
      case 'business': return 'Dashboard Business - Business Hub';
      default: return 'Business Hub';
    }
  };

  const handleViewBusiness = (id: number) => {
    setSelectedBusiness(id);
    setCurrentView('detail');
  };

  const handleBackToDirectory = () => {
    setCurrentView('directory');
    setSelectedBusiness(null);
  };

  const handleBackToHome = () => {
    console.log('🏠 Navigating back to home');
    setCurrentView('home');
    setSelectedBusiness(null);
    setSearchQuery(''); // Reset search quando si torna alla home
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  return (
    <AuthProvider>
      <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        {/* Admin Dashboard */}
        {currentView === 'admin' && (
          <AdminDashboard 
            onBack={handleBackToHome}
            showNotification={showNotification}
          />
        )}

        {/* Business Owner Dashboard */}
        {currentView === 'business' && (
          <BusinessOwnerDashboard 
            onBack={handleBackToHome}
            showNotification={showNotification}
          />
        )}

        {/* Main App */}
        {currentView !== 'admin' && currentView !== 'business' && (
          <>
            <Header 
              darkMode={darkMode} 
              setDarkMode={setDarkMode}
              currentView={currentView}
              setCurrentView={setCurrentView}
              onBackToHome={handleBackToHome}
              onBackToDirectory={handleBackToDirectory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAdminAccess={() => {
                console.log('🔐 Accessing admin dashboard');
                setCurrentView('admin');
              }}
              onBusinessAccess={() => {
                console.log('🏢 Accessing business dashboard');
                setCurrentView('business');
              }}
              onViewBusiness={handleViewBusiness}
              showNotification={showNotification}
            />
            
            <div className="pt-16">
              <AnimatePresence mode="wait">
                {currentView === 'home' && (
                  <motion.div
                    key="home"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <Hero 
                      onExplore={() => setCurrentView('directory')} 
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                    />
                    <FeaturedBusinesses 
                      onViewBusiness={handleViewBusiness}
                      showNotification={showNotification}
                    />
                  </motion.div>
                )}
                
                {currentView === 'directory' && (
                  <motion.div
                    key="directory"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <BusinessDirectory 
                      onViewBusiness={handleViewBusiness}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      showNotification={showNotification}
                    />
                  </motion.div>
                )}
                
                {currentView === 'detail' && selectedBusiness && (
                  <motion.div
                    key="detail"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <BusinessDetail 
                      businessId={selectedBusiness} 
                      onBack={handleBackToDirectory}
                      showNotification={showNotification}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <QuickActions 
              currentView={currentView}
              onHomeClick={handleBackToHome}
              onDirectoryClick={() => setCurrentView('directory')}
              showNotification={showNotification}
            />
            
            <Footer />
          </>
        )}
        
        <NotificationToast 
          notification={notification}
          onClose={() => setNotification(null)}
        />
      </div>
    </AuthProvider>
  );
}

export default App;