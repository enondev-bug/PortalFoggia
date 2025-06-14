import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Heart, MapPin, Phone, Plus, X } from 'lucide-react';

interface QuickActionsProps {
  currentView: 'home' | 'directory' | 'detail';
  onHomeClick: () => void;
  onDirectoryClick: () => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  currentView,
  onHomeClick,
  onDirectoryClick,
  showNotification
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setIsVisible(false);
        setIsExpanded(false);
      } else if (currentScrollY < lastScrollY - 20 || currentScrollY < 100) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const actions = [
    {
      icon: Home,
      label: 'Home',
      action: () => {
        onHomeClick();
        setIsExpanded(false);
      },
      active: currentView === 'home',
      color: 'from-blue-500 to-blue-600',
      position: { x: -60, y: -40 }
    },
    {
      icon: Search,
      label: 'Directory',
      action: () => {
        onDirectoryClick();
        setIsExpanded(false);
      },
      active: currentView === 'directory' || currentView === 'detail',
      color: 'from-purple-500 to-purple-600',
      position: { x: 60, y: -40 }
    },
    {
      icon: Heart,
      label: 'Preferiti',
      action: () => {
        showNotification('Funzione Preferiti in arrivo!', 'info');
        setIsExpanded(false);
      },
      active: false,
      color: 'from-red-500 to-red-600',
      position: { x: -80, y: 10 }
    },
    {
      icon: MapPin,
      label: 'Vicino a me',
      action: () => {
        showNotification('Ricerca nelle vicinanze attivata', 'success');
        setIsExpanded(false);
      },
      active: false,
      color: 'from-green-500 to-green-600',
      position: { x: 0, y: -70 }
    },
    {
      icon: Phone,
      label: 'Contatti',
      action: () => {
        showNotification('Sezione contatti in sviluppo', 'info');
        setIsExpanded(false);
      },
      active: false,
      color: 'from-orange-500 to-orange-600',
      position: { x: 80, y: 10 }
    }
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25
          }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 lg:hidden"
        >
          <div className="relative">
            {/* Sfondo blur quando espanso */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/10 backdrop-blur-[2px] -z-10"
                  onClick={() => setIsExpanded(false)}
                />
              )}
            </AnimatePresence>

            {/* Menu espanso */}
            <AnimatePresence>
              {isExpanded && (
                <div className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2">
                  {actions.map(({ icon: Icon, label, action, active, color, position }, index) => (
                    <motion.div
                      key={label}
                      initial={{ 
                        opacity: 0, 
                        scale: 0,
                        x: 0,
                        y: 0
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        x: position.x,
                        y: position.y
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0,
                        x: 0,
                        y: 0
                      }}
                      transition={{ 
                        delay: index * 0.08,
                        type: "spring",
                        stiffness: 400,
                        damping: 20
                      }}
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <motion.button
                        whileHover={{ 
                          scale: 1.15,
                          y: -2
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={action}
                        className={`group relative p-3 rounded-2xl shadow-xl transition-all duration-300 ${
                          active 
                            ? `bg-gradient-to-r ${color} text-white shadow-lg` 
                            : 'bg-white/95 dark:bg-gray-800/95 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 shadow-lg hover:shadow-xl'
                        } backdrop-blur-xl border border-white/20 dark:border-gray-700/50`}
                      >
                        <Icon className="h-5 w-5" />
                        
                        {/* Tooltip migliorato */}
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <div className="bg-gray-900/90 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap backdrop-blur-sm">
                            {label}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                              <div className="w-2 h-2 bg-gray-900/90 transform rotate-45"></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Indicatore attivo */}
                        {active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-sm"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          />
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {/* Bottone principale ottimizzato */}
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className={`relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${
                isExpanded 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-red-500/30' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-blue-500/30'
              } backdrop-blur-xl border-2 border-white/20`}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 45 : 0 }}
                transition={{ 
                  duration: 0.3, 
                  type: "spring", 
                  stiffness: 200 
                }}
                className="flex items-center justify-center"
              >
                {isExpanded ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </motion.div>
              
              {/* Anello pulsante sottile */}
              <motion.div
                animate={{ 
                  scale: isExpanded ? [1, 1.3, 1] : 1,
                  opacity: isExpanded ? [0.3, 0.6, 0.3] : 0
                }}
                transition={{ 
                  duration: isExpanded ? 2 : 0.3,
                  repeat: isExpanded ? Infinity : 0,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full border border-white/40"
              />
              
              {/* Indicatore di stato minimalista */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 0.4, 0.8]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-white shadow-sm"
              />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickActions;