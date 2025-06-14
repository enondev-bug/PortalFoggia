import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Plus, Edit, Trash2, MoreVertical,
  User, Mail, Phone, Shield, CheckCircle, XCircle, 
  Clock, AlertCircle, UserPlus, UserCheck, UserX,
  Eye, EyeOff, Lock, Unlock, Settings, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: 'user' | 'business_owner' | 'admin' | 'super_admin';
  phone: string | null;
  bio: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface UserManagementProps {
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ showNotification }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'business_owner' | 'admin'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      console.log('✅ Loaded', data?.length || 0, 'users');
    } catch (error) {
      console.error('❌ Error loading users:', error);
      showNotification('❌ Errore nel caricamento degli utenti', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesVerification = 
      verificationFilter === 'all' || 
      (verificationFilter === 'verified' && user.is_verified) ||
      (verificationFilter === 'unverified' && !user.is_verified);
    
    return matchesSearch && matchesRole && matchesVerification;
  });

  const handleUpdateRole = async (userId: string, newRole: UserProfile['role']) => {
    if (processingIds.has(userId)) return;
    
    setConfirmAction({
      title: 'Conferma Cambio Ruolo',
      message: `Sei sicuro di voler cambiare il ruolo dell'utente a "${newRole}"? Questo modificherà i permessi dell'utente.`,
      action: async () => {
        try {
          setProcessingIds(prev => new Set(prev).add(userId));
          
          const { error } = await supabase
            .from('profiles')
            .update({ 
              role: newRole,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);

          if (error) throw error;

          setUsers(prev => prev.map(user => 
            user.id === userId 
              ? { ...user, role: newRole, updated_at: new Date().toISOString() }
              : user
          ));
          
          showNotification(`✅ Ruolo aggiornato a "${newRole}"`, 'success');
        } catch (error) {
          console.error('❌ Error updating user role:', error);
          showNotification('❌ Errore nell\'aggiornamento del ruolo', 'warning');
        } finally {
          setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    });
    
    setShowConfirmModal(true);
  };

  const handleToggleVerification = async (userId: string, verified: boolean) => {
    if (processingIds.has(userId)) return;
    
    try {
      setProcessingIds(prev => new Set(prev).add(userId));
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_verified: verified,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_verified: verified, updated_at: new Date().toISOString() }
          : user
      ));
      
      showNotification(
        verified ? '✅ Utente verificato' : '❌ Verifica rimossa', 
        'success'
      );
    } catch (error) {
      console.error('❌ Error updating verification status:', error);
      showNotification('❌ Errore nell\'aggiornamento della verifica', 'warning');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    if (processingIds.has(userId)) return;
    
    setConfirmAction({
      title: 'Conferma Reset Password',
      message: `Sei sicuro di voler inviare un'email di reset password a ${email}?`,
      action: async () => {
        try {
          setProcessingIds(prev => new Set(prev).add(userId));
          
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          });

          if (error) throw error;
          
          showNotification('✅ Email di reset password inviata', 'success');
        } catch (error) {
          console.error('❌ Error sending password reset:', error);
          showNotification('❌ Errore nell\'invio dell\'email di reset', 'warning');
        } finally {
          setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    });
    
    setShowConfirmModal(true);
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (processingIds.has(userId)) return;
    
    setConfirmAction({
      title: 'Conferma Eliminazione Utente',
      message: `Sei sicuro di voler eliminare l'utente ${email}? Questa azione non può essere annullata e rimuoverà tutti i dati associati.`,
      action: async () => {
        try {
          setProcessingIds(prev => new Set(prev).add(userId));
          
          // Elimina il profilo (la foreign key CASCADE eliminerà anche i dati correlati)
          const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

          if (error) throw error;

          // Aggiorna la lista utenti
          setUsers(prev => prev.filter(user => user.id !== userId));
          
          showNotification('✅ Utente eliminato con successo', 'success');
        } catch (error) {
          console.error('❌ Error deleting user:', error);
          showNotification('❌ Errore nell\'eliminazione dell\'utente', 'warning');
        } finally {
          setProcessingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        }
      }
    });
    
    setShowConfirmModal(true);
  };

  const handleExportUsers = () => {
    try {
      // Prepara i dati per l'export
      const exportData = filteredUsers.map(user => ({
        ID: user.id,
        Nome: user.name,
        Email: user.email,
        Telefono: user.phone || '',
        Ruolo: user.role,
        Verificato: user.is_verified ? 'Sì' : 'No',
        'Data Registrazione': new Date(user.created_at).toLocaleDateString(),
        'Ultimo Aggiornamento': new Date(user.updated_at).toLocaleDateString()
      }));
      
      // Converti in CSV
      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => 
            JSON.stringify(row[header as keyof typeof row])
          ).join(',')
        )
      ];
      
      const csvContent = csvRows.join('\n');
      
      // Crea e scarica il file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `utenti_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('✅ Dati utenti esportati con successo', 'success');
    } catch (error) {
      console.error('❌ Error exporting users:', error);
      showNotification('❌ Errore nell\'esportazione dei dati', 'warning');
    }
  };

  const getRoleBadge = (role: UserProfile['role']) => {
    const configs = {
      'super_admin': { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
      'admin': { label: 'Admin', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      'business_owner': { label: 'Business Owner', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      'user': { label: 'Utente', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' }
    };
    
    const config = configs[role];
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${config.color}`}>
        <span>{config.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600 dark:text-gray-400">Caricamento utenti...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestione Utenti
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredUsers.length} di {users.length} utenti
          </p>
        </div>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExportUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Esporta</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => showNotification('🔧 Funzione aggiungi utente in sviluppo', 'info')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Nuovo Utente</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Totali', value: users.length, color: 'blue' },
          { label: 'Utenti', value: users.filter(u => u.role === 'user').length, color: 'gray' },
          { label: 'Business Owner', value: users.filter(u => u.role === 'business_owner').length, color: 'green' },
          { label: 'Admin', value: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length, color: 'purple' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 border border-${stat.color}-200 dark:border-${stat.color}-800 rounded-xl`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca utenti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tutti i ruoli</option>
            <option value="user">Utenti</option>
            <option value="business_owner">Business Owner</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tutti gli stati</option>
            <option value="verified">Verificati</option>
            <option value="unverified">Non verificati</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {user.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white dark:border-gray-800">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {user.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="h-3 w-3" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-2">
                  {getRoleBadge(user.role)}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Visualizza dettagli"
                  >
                    <Eye className="h-4 w-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleVerification(user.id, !user.is_verified)}
                    disabled={processingIds.has(user.id)}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title={user.is_verified ? "Rimuovi verifica" : "Verifica utente"}
                  >
                    {user.is_verified ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <UserX className="h-4 w-4" />
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleResetPassword(user.id, user.email)}
                    disabled={processingIds.has(user.id)}
                    className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Reset password"
                  >
                    <Lock className="h-4 w-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    disabled={processingIds.has(user.id) || user.role === 'super_admin'}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Elimina utente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nessun utente trovato
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || roleFilter !== 'all' || verificationFilter !== 'all'
              ? 'Prova a modificare i filtri di ricerca' 
              : 'Non ci sono ancora utenti registrati'
            }
          </p>
        </div>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Dettagli Utente
                </h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-center space-x-4">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedUser.name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getRoleBadge(selectedUser.role)}
                      {selectedUser.is_verified && (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-semibold">
                          <CheckCircle className="h-3 w-3" />
                          <span>Verificato</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Email:</span>
                    <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Telefono:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedUser.phone || 'Non specificato'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Data registrazione:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Ultimo aggiornamento:</span>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedUser.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                {selectedUser.bio && (
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Bio:</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {selectedUser.bio}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Cambia Ruolo
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {['user', 'business_owner', 'admin', 'super_admin'].map((role) => (
                        <motion.button
                          key={role}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateRole(selectedUser.id, role as UserProfile['role'])}
                          disabled={selectedUser.role === role || processingIds.has(selectedUser.id)}
                          className={`p-2 rounded-lg transition-colors text-sm ${
                            selectedUser.role === role
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          } disabled:opacity-50`}
                        >
                          {role === 'user' ? 'Utente' : 
                           role === 'business_owner' ? 'Business Owner' : 
                           role === 'admin' ? 'Admin' : 'Super Admin'}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Azioni Rapide
                    </h5>
                    <div className="space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggleVerification(selectedUser.id, !selectedUser.is_verified)}
                        disabled={processingIds.has(selectedUser.id)}
                        className="w-full flex items-center justify-center space-x-2 p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {selectedUser.is_verified ? (
                          <>
                            <UserX className="h-4 w-4" />
                            <span>Rimuovi Verifica</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            <span>Verifica Utente</span>
                          </>
                        )}
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleResetPassword(selectedUser.id, selectedUser.email)}
                        disabled={processingIds.has(selectedUser.id)}
                        className="w-full flex items-center justify-center space-x-2 p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Reset Password</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDeleteUser(selectedUser.id, selectedUser.email)}
                        disabled={processingIds.has(selectedUser.id) || selectedUser.role === 'super_admin'}
                        className="w-full flex items-center justify-center space-x-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Elimina Utente</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {confirmAction.title}
                </h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {confirmAction.message}
              </p>
              
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setShowConfirmModal(false);
                    await confirmAction.action();
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Conferma
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annulla
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;