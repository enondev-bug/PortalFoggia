import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, MapPin, Clock, Tag, Grid3X3, List, SlidersHorizontal, Heart, Phone, Navigation } from 'lucide-react';
import { mockBusinesses } from '../data/mockData';
import { useAnalytics } from '../lib/analytics';

interface BusinessDirectoryProps {
  onViewBusiness: (id: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessDirectory: React.FC<BusinessDirectoryProps> = ({ 
  onViewBusiness, 
  searchQuery, 
  setSearchQuery,
  showNotification 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'distance'>('rating');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  
  const { trackSearch, trackBusinessContact, trackFavoriteToggle } = useAnalytics();

  const categories = ['Tutti', 'Ristoranti', 'Shopping', 'Servizi', 'Salute', 'Tempo Libero'];

  // 📊 TRACCIA RICERCA
  useEffect(() => {
    if (searchQuery || selectedCategory !== 'Tutti') {
      trackSearch(
        searchQuery || selectedCategory, 
        filteredBusinesses.length,
        { category: selectedCategory, sortBy }
      );
    }
  }, [searchQuery, selectedCategory, sortBy]);

  const filteredBusinesses = useMemo(() => {
    let filtered = mockBusinesses.filter(business => {
      const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           business.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Tutti' || business.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort businesses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'distance':
          return Math.random() - 0.5; // Mock distance sorting
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, sortBy]);

  const toggleFavorite = async (businessId: number) => {
    const newFavorites = new Set(favorites);
    const isAdding = !newFavorites.has(businessId);
    
    if (isAdding) {
      newFavorites.add(businessId);
      showNotification('Aggiunto ai preferiti', 'success');
    } else {
      newFavorites.delete(businessId);
      showNotification('Rimosso dai preferiti', 'info');
    }
    
    setFavorites(newFavorites);
    
    // 📊 TRACCIA TOGGLE PREFERITI
    await trackFavoriteToggle(businessId.toString(), isAdding ? 'add' : 'remove');
  };

  const handleGetDirections = (business: any) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`;
    window.open(url, '_blank');
    showNotification('🗺️ Apertura Google Maps...', 'info');
  };

  const handleCallBusiness = async (businessId: number) => {
    // 📊 TRACCIA CONTATTO BUSINESS
    await trackBusinessContact(businessId.toString(), 'phone');
    showNotification('📞 Chiamata in corso...', 'info');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen py-8 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Directory Attività
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Scopri {filteredBusinesses.length} attività nella tua zona
          </p>
        </motion.div>

        {/* Enhanced Search and Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca attività, servizi, prodotti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <motion.button
                  key={category}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </motion.button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl transition-colors ${
                  showFilters
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <SlidersHorizontal className="h-5 w-5" />
              </motion.button>

              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
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

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ordina per:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="rating">Valutazione</option>
                      <option value="name">Nome</option>
                      <option value="distance">Distanza</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="openNow"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="openNow" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Solo attività aperte
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasOffers"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="hasOffers" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Con offerte speciali
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}
        >
          {filteredBusinesses.map((business) => (
            <motion.div
              key={business.id}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden ${
                viewMode === 'list' ? 'flex' : ''
              }`}
            >
              <div className={`${viewMode === 'list' ? 'flex w-full' : ''}`}>
                {/* Image */}
                <div className={`relative overflow-hidden ${
                  viewMode === 'grid' 
                    ? 'h-48 rounded-t-2xl' 
                    : 'w-48 h-32 rounded-l-2xl flex-shrink-0'
                }`}>
                  <img
                    src={business.image}
                    alt={business.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                      business.isOpen 
                        ? 'bg-green-100/90 text-green-800 border border-green-200' 
                        : 'bg-red-100/90 text-red-800 border border-red-200'
                    }`}>
                      {business.isOpen ? 'Aperto' : 'Chiuso'}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(business.id);
                    }}
                    className={`absolute top-3 left-3 p-2 rounded-full backdrop-blur-sm transition-colors ${
                      favorites.has(business.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/90 text-gray-600 hover:bg-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(business.id) ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1" onClick={() => onViewBusiness(business.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {business.name}
                    </h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                        {business.rating}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {business.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm truncate">{business.address}</span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">{business.hours}</span>
                    </div>
                  </div>

                  {business.currentOffer && (
                    <div className="flex items-center bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700 mb-4">
                      <Tag className="h-4 w-4 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">
                        {business.currentOffer}
                      </span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCallBusiness(business.id);
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">Chiama</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(business);
                      }}
                      className="flex items-center justify-center py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Navigation className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onViewBusiness(business.id)}
                      className="flex-1 py-2 px-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      Dettagli
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredBusinesses.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Nessun risultato trovato
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Prova a modificare i filtri di ricerca o cerca qualcos'altro
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Tutti');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Cancella Filtri
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BusinessDirectory;