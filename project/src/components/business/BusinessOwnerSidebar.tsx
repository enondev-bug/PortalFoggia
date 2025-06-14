import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, MessageSquare, Tag, Settings,
  ChevronLeft, ChevronRight, Home, Building2,
  FileEdit, Image, Phone, Plus
} from 'lucide-react';
import { BusinessOwnerView } from './BusinessOwnerDashboard';

interface BusinessOwnerSidebarProps {
  businesses: any[];
  selectedBusiness: any | null;
  onBusinessSelect: (business: any) => void;
  currentView: BusinessOwnerView;
  setCurrentView: (view: BusinessOwnerView) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onBack: () => void;
}

const BusinessOwnerSidebar: React.FC<BusinessOwnerSidebarProps> = ({
  businesses,
  selectedBusiness,
  onBusinessSelect,
  currentView,
  setCurrentView,
  collapsed,
  setCollapsed,
  onBack
}) => {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { id: 'details', label: 'Dettagli', icon: FileEdit, color: 'from-green-500 to-green-600' },
    { id: 'reviews', label: 'Recensioni', icon: MessageSquare, color: 'from-purple-500 to-purple-600' },
    { id: 'offers', label: 'Offerte', icon: Tag, color: 'from-orange-500 to-orange-600' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-pink-500 to-pink-600' },
    { id: 'contacts', label: 'Contatti', icon: Phone, color: 'from-indigo-500 to-indigo-600' },
    { id: 'images', label: 'Immagini', icon: Image, color: 'from-yellow-500 to-yellow-600' }
  ];

  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-40"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Business Panel</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gestione Attività</p>
                </div>
              </motion.div>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Business Selector */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleziona Attività
            </label>
            <div className="relative">
              <select
                value={selectedBusiness?.id || ''}
                onChange={(e) => {
                  const business = businesses.find(b => b.id === e.target.value);
                  if (business) onBusinessSelect(business);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {businesses.length === 0 ? (
                  <option value="" disabled>Nessuna attività</option>
                ) : (
                  businesses.map(business => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => alert('Funzione in sviluppo')}
              className="w-full mt-3 flex items-center justify-center space-x-2 p-2 border border-green-500 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Nuova Attività</span>
            </motion.button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(({ id, label, icon: Icon, color }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView(id as BusinessOwnerView)}
              disabled={!selectedBusiness}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                !selectedBusiness 
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  : currentView === id
                    ? `bg-gradient-to-r ${color} text-white shadow-lg`
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
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
            {!collapsed && (
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
  );
};

export default BusinessOwnerSidebar;