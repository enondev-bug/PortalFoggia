import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

interface NotificationToastProps {
  notification: {
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  if (!notification) return null;

  const icons = {
    success: CheckCircle,
    info: Info,
    warning: AlertTriangle
  };

  const colors = {
    success: 'from-green-500 to-green-600',
    info: 'from-blue-500 to-blue-600',
    warning: 'from-yellow-500 to-yellow-600'
  };

  const Icon = icons[notification.type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-24 lg:bottom-6 right-6 z-50"
      >
        <div className={`bg-gradient-to-r ${colors[notification.type]} text-white p-4 rounded-2xl shadow-2xl max-w-sm flex items-center space-x-3`}>
          <Icon className="h-6 w-6 flex-shrink-0" />
          <p className="flex-1 font-medium">{notification.message}</p>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationToast;