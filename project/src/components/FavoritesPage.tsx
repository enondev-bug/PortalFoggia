import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Star, MapPin, Phone, Eye, Trash2, 
  Search, Filter, Grid3X3, List, SortAsc
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mockBusinesses } from '../data/mockData';

interface FavoriteItem {
  id: string;
  business: {
    id: string;
    name: string;
    description: string;
    category: string;
    address: string;
    rating: number;
    image: string;
    phone?: string;
  };
  created_at: string;
}

interface FavoritesPageProps {
  onClose: () => void;
  onViewBusiness: (id: number) => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ 
  onClose, 
  onViewBusiness, 
  showNotification 
}) => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'rating'>('date');

  useEffect(() => {
    loadFavorites();
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      // Simulazione dati reali basati sui mockBusinesses
      const mockFavorites: FavoriteItem[] = [
        {
          id: '1',
          business: {
            id: '1',
            name: mockBusinesses[0].name,
            description: mockBusinesses[0].description,
            category: mockBusinesses[0].category,
            address: mockBusinesses[0].address,
            rating: mockBusinesses[0].rating,
            image: mockBusinesses[0].image,
            phone: '+39 123 456 7890'
          },
          created_at: '2024-01-15T10:30:00Z'
        }
      ];

      setFavorites(mockFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      showNotification('❌ Errore nel caricamento dei preferiti', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (businessId: string) => {
    try {
      setFavorites(prev => prev.filter(fav => fav.business.id !== businessId));
      showNotification('💔 Rimosso dai preferiti', 'info');
    } catch (error) {
      showNotification('❌ Errore nella rimozione', 'warning');
    }
  };

  const filteredFavorites = favorites
    .filter(fav => 
      fav.business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.business.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.business.name.localeCompare(b.business.name);
        case 'rating':
          return b.business.rating - a.business.rating;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Accesso Richiesto
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Devi essere registrato per visualizzare i tuoi preferiti
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Chiudi
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  I Miei Preferiti
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {filteredFavorites.length} attività salvate
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ✕
            </motion.button>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca nei preferiti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Data aggiunta</option>
                <option value="name">Nome</option>
                <option value="rating">Valutazione</option>
              </select>

              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <List className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          ) : filteredFavorites.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💔</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'Nessun risultato' : 'Nessun preferito'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchQuery 
                  ? 'Prova a modificare i termini di ricerca'
                  : 'Inizia ad aggiungere attività ai tuoi preferiti!'
                }
              </p>
              {searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Cancella Ricerca
                </motion.button>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              <AnimatePresence>
                {filteredFavorites.map((favorite, index) => (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`group bg-white dark:bg-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 overflow-hidden ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`${viewMode === 'list' ? 'flex w-full' : ''}`}>
                      {/* Image */}
                      <div className={`relative overflow-hidden ${
                        viewMode === 'grid' 
                          ? 'h-48' 
                          : 'w-48 h-32 flex-shrink-0'
                      }`}>
                        <img
                          src={favorite.business.image}
                          alt={favorite.business.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveFavorite(favorite.business.id)}
                          className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {favorite.business.name}
                          </h3>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                              {favorite.business.rating}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                          {favorite.business.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">{favorite.business.address}</span>
                          </div>
                          {favorite.business.phone && (
                            <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                              <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span>{favorite.business.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onViewBusiness(parseInt(favorite.business.id))}
                            className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Visualizza</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => showNotification('📞 Chiamata in corso...', 'info')}
                            className="flex items-center justify-center py-2 px-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                          </motion.button>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          Aggiunto il {new Date(favorite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FavoritesPage;