import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Users, Building2, MessageSquare, Settings,
  ChevronLeft, ChevronRight, Home, Shield
} from 'lucide-react';
import { AdminView } from './AdminDashboard';

interface AdminSidebarProps {
  currentView: AdminView;
  setCurrentView: (view: AdminView) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onBack: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  setCurrentView,
  collapsed,
  setCollapsed,
  onBack
}) => {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { id: 'businesses', label: 'Attività', icon: Building2, color: 'from-green-500 to-green-600' },
    { id: 'reviews', label: 'Recensioni', icon: MessageSquare, color: 'from-purple-500 to-purple-600' },
    { id: 'users', label: 'Utenti', icon: Users, color: 'from-orange-500 to-orange-600' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'from-pink-500 to-pink-600' },
    { id: 'settings', label: 'Impostazioni', icon: Settings, color: 'from-gray-500 to-gray-600' },
    { id: 'business_dashboard', label: 'Dashboard Business', icon: Building2, color: 'from-green-500 to-green-600' }
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
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Business Hub</p>
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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(({ id, label, icon: Icon, color }) => (
            <motion.button
              key={id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentView(id as AdminView)}
              className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                currentView === id
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

export default AdminSidebar;