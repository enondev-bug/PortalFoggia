import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Globe, Mail, 
  Tag, QrCode, Heart, Share2, Calendar, Camera, MessageCircle,
  Wifi, CreditCard, Accessibility, Car, Send, ThumbsUp, Navigation
} from 'lucide-react';
import { mockBusinesses } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../lib/analytics';
import AuthModal from './auth/AuthModal';
import GoogleMap from './GoogleMap';

interface BusinessDetailProps {
  businessId: number;
  onBack: () => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessDetail: React.FC<BusinessDetailProps> = ({ 
  businessId, 
  onBack, 
  showNotification 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'reviews' | 'photos' | 'offers' | 'map'>('info');
  const [isFavorite, setIsFavorite] = useState(false);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  const { trackBusinessView, trackBusinessContact, trackFavoriteToggle, trackReviewSubmission } = useAnalytics();
  const business = mockBusinesses.find(b => b.id === businessId);

  // 📊 TRACCIA VISUALIZZAZIONE BUSINESS
  useEffect(() => {
    if (business) {
      trackBusinessView(business.id.toString(), business.name);
    }
  }, [business, trackBusinessView]);

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Attività non trovata
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Torna alla Directory
          </motion.button>
        </div>
      </div>
    );
  }

  // Converti business per GoogleMap
  const businessForMap = {
    id: business.id,
    name: business.name,
    address: business.address,
    phone: '+39 123 456 7890', // Mock phone
    website: 'https://example.com', // Mock website
    rating: business.rating,
    category: business.category,
    isOpen: business.isOpen,
    // Coordinate simulate per Milano e dintorni
    latitude: 45.4642 + (Math.random() - 0.5) * 0.1,
    longitude: 9.1900 + (Math.random() - 0.5) * 0.1
  };

  const mockReviews = [
    { 
      id: 1, 
      author: 'Mario Rossi', 
      rating: 5, 
      comment: 'Servizio eccellente, tornerò sicuramente!', 
      date: '2 giorni fa', 
      helpful: 12,
      verified: true
    },
    { 
      id: 2, 
      author: 'Laura Bianchi', 
      rating: 4, 
      comment: 'Ottima qualità, personale cortese', 
      date: '1 settimana fa', 
      helpful: 8,
      verified: true
    },
    { 
      id: 3, 
      author: 'Giuseppe Verde', 
      rating: 5, 
      comment: 'Consiglio vivamente, esperienza fantastica', 
      date: '2 settimane fa', 
      helpful: 15,
      verified: false
    }
  ];

  const mockPhotos = [
    'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (newReview.trim()) {
      // 📊 TRACCIA INVIO RECENSIONE
      await trackReviewSubmission(business.id.toString(), newRating);
      
      showNotification('✨ Recensione inviata con successo!', 'success');
      setNewReview('');
      setNewRating(5);
    }
  };

  const handleContactBusiness = async (contactType: string = 'phone') => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    // 📊 TRACCIA CONTATTO BUSINESS
    await trackBusinessContact(business.id.toString(), contactType);
    
    showNotification('📞 Richiesta di contatto inviata!', 'success');
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    // 📊 TRACCIA TOGGLE PREFERITI
    await trackFavoriteToggle(business.id.toString(), newFavoriteState ? 'add' : 'remove');
    
    showNotification(
      newFavoriteState ? '❤️ Aggiunto ai preferiti' : '💔 Rimosso dai preferiti',
      newFavoriteState ? 'success' : 'info'
    );
  };

  const quickActions = [
    {
      icon: Phone,
      label: 'Chiama',
      color: 'from-blue-500 to-blue-600',
      action: () => handleContactBusiness('phone')
    },
    {
      icon: Calendar,
      label: 'Prenota',
      color: 'from-green-500 to-green-600',
      action: () => {
        if (!isAuthenticated) {
          setShowAuthModal(true);
          return;
        }
        handleContactBusiness('booking');
        showNotification('📅 Reindirizzamento al sistema di prenotazione...', 'info');
      }
    },
    {
      icon: Navigation,
      label: 'Indicazioni',
      color: 'from-purple-500 to-purple-600',
      action: () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`;
        window.open(url, '_blank');
        showNotification('🗺️ Apertura Google Maps...', 'info');
      }
    },
    {
      icon: QrCode,
      label: 'QR Code',
      color: 'from-orange-500 to-orange-600',
      action: () => showNotification('📱 QR Code generato!', 'success')
    }
  ];

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen dark:bg-gray-900 pb-8"
      >
        {/* Hero Section */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={business.image}
            alt={business.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          </motion.button>

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleFavorite}
              className={`p-3 backdrop-blur-sm rounded-full transition-colors shadow-lg ${
                isFavorite ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-900 hover:bg-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => showNotification('🔗 Link copiato negli appunti!', 'success')}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
            >
              <Share2 className="h-5 w-5 text-gray-900" />
            </motion.button>
          </div>

          {/* Business Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{business.name}</h1>
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  business.isOpen 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}
              >
                {business.isOpen ? 'Aperto Ora' : 'Chiuso'}
              </motion.span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                <span className="font-semibold">{business.rating}</span>
                <span className="text-white/80 ml-1">(127 recensioni)</span>
              </div>
              <span className="text-white/80">•</span>
              <span className="text-white/80">{business.category}</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Quick Actions */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map(({ icon: Icon, label, color, action }, index) => (
                    <motion.button
                      key={label}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={action}
                      className={`flex flex-col items-center p-4 bg-gradient-to-r ${color} rounded-xl text-white hover:shadow-lg transition-all`}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Tabs */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-0">
                    {[
                      { id: 'info', label: 'Informazioni', icon: MapPin },
                      { id: 'map', label: 'Mappa', icon: Navigation },
                      { id: 'reviews', label: 'Recensioni', icon: MessageCircle },
                      { id: 'photos', label: 'Foto', icon: Camera },
                      { id: 'offers', label: 'Offerte', icon: Tag }
                    ].map(({ id, label, icon: Icon }) => (
                      <motion.button
                        key={id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-all ${
                          activeTab === id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{label}</span>
                      </motion.button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {/* Map Tab */}
                    {activeTab === 'map' && (
                      <motion.div
                        key="map"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          📍 Posizione e Indicazioni
                        </h3>
                        
                        <GoogleMap 
                          business={businessForMap}
                          height="400px"
                          showControls={true}
                          interactive={true}
                          className="rounded-xl overflow-hidden shadow-lg"
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                          >
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                              🚗 Come Arrivare
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                              Facilmente raggiungibile con mezzi pubblici e auto
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`;
                                window.open(url, '_blank');
                              }}
                              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Ottieni Indicazioni
                            </motion.button>
                          </motion.div>
                          
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
                          >
                            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                              🅿️ Parcheggio
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                              Parcheggio disponibile nelle vicinanze
                            </p>
                            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                              <Car className="h-4 w-4" />
                              <span>Posti auto disponibili</span>
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                      <motion.div
                        key="reviews"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recensioni dei Clienti
                          </h3>
                          {isAuthenticated && (
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                              ✓ Utente verificato
                            </span>
                          )}
                        </div>

                        {/* Write Review */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                            {isAuthenticated ? 'Scrivi una recensione' : 'Accedi per lasciare una recensione'}
                          </h4>
                          
                          {!isAuthenticated && (
                            <div className="text-center py-4">
                              <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Devi essere registrato per lasciare una recensione
                              </p>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowAuthModal(true)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Accedi o Registrati
                              </motion.button>
                            </div>
                          )}

                          {isAuthenticated && (
                            <>
                              <div className="flex items-center space-x-1 mb-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <motion.button
                                    key={star}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setNewRating(star)}
                                    className={`p-1 ${
                                      star <= newRating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    <Star className={`h-5 w-5 ${star <= newRating ? 'fill-current' : ''}`} />
                                  </motion.button>
                                ))}
                              </div>
                              <textarea
                                value={newReview}
                                onChange={(e) => setNewReview(e.target.value)}
                                placeholder="Condividi la tua esperienza..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                              />
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmitReview}
                                className="mt-3 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Send className="h-4 w-4" />
                                <span>Invia Recensione</span>
                              </motion.button>
                            </>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {mockReviews.map((review) => (
                            <motion.div 
                              key={review.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                      {review.author.charAt(0)}
                                    </span>
                                  </div>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {review.author}
                                  </span>
                                  {review.verified && (
                                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full">
                                      ✓ Verificato
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating 
                                            ? 'text-yellow-400 fill-current' 
                                            : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {review.date}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-600 dark:text-gray-300 mb-2">{review.comment}</p>
                              <div className="flex items-center space-x-4">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    if (!isAuthenticated) {
                                      setShowAuthModal(true);
                                      return;
                                    }
                                    showNotification('👍 Recensione segnata come utile!', 'success');
                                  }}
                                  className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>Utile ({review.helpful})</span>
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Info Tab */}
                    {activeTab === 'info' && (
                      <motion.div
                        key="info"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Descrizione
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {business.description} Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad 
                            minim veniam, quis nostrud exercitation ullamco laboris.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Servizi e Caratteristiche
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { icon: Wifi, label: 'WiFi Gratuito' },
                              { icon: CreditCard, label: 'Carte di Credito' },
                              { icon: Accessibility, label: 'Accessibile' },
                              { icon: Car, label: 'Parcheggio' }
                            ].map(({ icon: Icon, label }) => (
                              <motion.div 
                                key={label}
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                              >
                                <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Photos Tab */}
                    {activeTab === 'photos' && (
                      <motion.div
                        key="photos"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Galleria Fotografica
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {mockPhotos.map((photo, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.05 }}
                              className="aspect-square overflow-hidden rounded-xl cursor-pointer"
                            >
                              <img
                                src={photo}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                              />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Offers Tab */}
                    {activeTab === 'offers' && (
                      <motion.div
                        key="offers"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Offerte Speciali
                        </h3>
                        
                        {business.currentOffer && (
                          <motion.div 
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-700 rounded-xl"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">
                                🎉 Offerta Attuale
                              </h4>
                              <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
                                Attiva
                              </span>
                            </div>
                            <p className="text-green-700 dark:text-green-300 mb-4">
                              {business.currentOffer}
                            </p>
                            <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (!isAuthenticated) {
                                  setShowAuthModal(true);
                                  return;
                                }
                                handleContactBusiness('offer');
                                showNotification('🎯 Offerta attivata!', 'success');
                              }}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Approfitta Dell'Offerta
                            </motion.button>
                          </motion.div>
                        )}

                        <div className="grid gap-4">
                          {[
                            { title: 'Sconto Fedeltà', description: '10% di sconto dopo 5 visite', expires: '31 Dic 2024' },
                            { title: 'Happy Hour', description: 'Bevande a metà prezzo dalle 17:00 alle 19:00', expires: 'Ogni giorno' },
                            { title: 'Menu Degustazione', description: 'Prova il nostro menu speciale', expires: 'Fine mese' }
                          ].map((offer, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.02 }}
                              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                            >
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {offer.title}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                                {offer.description}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Valido fino al: {offer.expires}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informazioni di Contatto
                </h3>
                
                <div className="space-y-4">
                  {[
                    { icon: MapPin, label: 'Indirizzo', value: business.address, color: 'blue' },
                    { icon: Phone, label: 'Telefono', value: '+39 123 456 7890', color: 'green' },
                    { icon: Mail, label: 'Email', value: 'info@business.com', color: 'purple' },
                    { icon: Globe, label: 'Sito Web', value: 'www.business.com', color: 'orange' }
                  ].map(({ icon: Icon, label, value, color }) => (
                    <motion.div 
                      key={label}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => {
                        if (label === 'Telefono' || label === 'Email') {
                          handleContactBusiness(label.toLowerCase());
                        }
                      }}
                    >
                      <div className={`w-10 h-10 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 text-${color}-600 dark:text-${color}-400`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Opening Hours */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Orari di Apertura
                </h3>
                
                <div className="space-y-3">
                  {[
                    { day: 'Lunedì', hours: '09:00 - 18:00', isToday: false },
                    { day: 'Martedì', hours: '09:00 - 18:00', isToday: true },
                    { day: 'Mercoledì', hours: '09:00 - 18:00', isToday: false },
                    { day: 'Giovedì', hours: '09:00 - 18:00', isToday: false },
                    { day: 'Venerdì', hours: '09:00 - 20:00', isToday: false },
                    { day: 'Sabato', hours: '10:00 - 19:00', isToday: false },
                    { day: 'Domenica', hours: 'Chiuso', isToday: false }
                  ].map((schedule) => (
                    <motion.div
                      key={schedule.day}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                        schedule.isToday 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className={`font-medium ${
                        schedule.isToday 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {schedule.day}
                      </span>
                      <span className={`text-sm ${
                        schedule.isToday 
                          ? 'text-blue-700 dark:text-blue-300 font-semibold' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {schedule.hours}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Map Preview */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Posizione
                </h3>
                
                <GoogleMap 
                  business={businessForMap}
                  height="200px"
                  showControls={false}
                  interactive={false}
                  className="rounded-xl overflow-hidden mb-4"
                />
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('map')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Visualizza Mappa Completa
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
        showNotification={showNotification}
      />
    </>
  );
};

export default BusinessDetail;