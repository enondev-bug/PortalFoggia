import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone, Globe, Star, Clock, Maximize2, Minimize2 } from 'lucide-react';

interface Business {
  id: number;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating: number;
  category: string;
  isOpen?: boolean;
  latitude?: number;
  longitude?: number;
}

interface GoogleMapProps {
  business: Business;
  className?: string;
  height?: string;
  showControls?: boolean;
  interactive?: boolean;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleMap: React.FC<GoogleMapProps> = ({ 
  business, 
  className = '', 
  height = '300px',
  showControls = true,
  interactive = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Coordinate di default per Milano se non disponibili
  const defaultLat = business.latitude || 45.4642;
  const defaultLng = business.longitude || 9.1900;

  useEffect(() => {
    initializeMap();
  }, [business]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Verifica se Google Maps è caricato
      if (!window.google) {
        setError('Google Maps non è disponibile. Verifica la connessione internet.');
        setIsLoading(false);
        return;
      }

      // Geocoding se non abbiamo coordinate
      let lat = defaultLat;
      let lng = defaultLng;

      if (!business.latitude || !business.longitude) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const result = await new Promise((resolve, reject) => {
            geocoder.geocode(
              { address: `${business.address}, Italy` },
              (results: any, status: any) => {
                if (status === 'OK' && results[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error('Indirizzo non trovato'));
                }
              }
            );
          });

          const location = (result as any).geometry.location;
          lat = location.lat();
          lng = location.lng();
        } catch (geocodeError) {
          console.warn('Geocoding fallito, uso coordinate di default:', geocodeError);
        }
      }

      // Configurazione mappa
      const mapOptions = {
        center: { lat, lng },
        zoom: 16,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: !interactive,
        gestureHandling: interactive ? 'auto' : 'none',
        zoomControl: interactive,
        streetViewControl: interactive,
        fullscreenControl: false, // Gestiamo noi il fullscreen
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      // Crea mappa
      const googleMap = new window.google.maps.Map(mapRef.current, mapOptions);

      // Crea marker personalizzato
      const markerIcon = {
        url: createCustomMarkerIcon(business.category),
        scaledSize: new window.google.maps.Size(40, 40),
        origin: new window.google.maps.Point(0, 0),
        anchor: new window.google.maps.Point(20, 40)
      };

      const googleMarker = new window.google.maps.Marker({
        position: { lat, lng },
        map: googleMap,
        title: business.name,
        icon: markerIcon,
        animation: window.google.maps.Animation.DROP
      });

      // Info Window
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(business)
      });

      // Event listeners
      googleMarker.addListener('click', () => {
        infoWindow.open(googleMap, googleMarker);
      });

      // Salva riferimenti
      setMap(googleMap);
      setMarker(googleMarker);
      setIsLoading(false);

    } catch (error) {
      console.error('Errore inizializzazione mappa:', error);
      setError('Errore nel caricamento della mappa');
      setIsLoading(false);
    }
  };

  const createCustomMarkerIcon = (category: string): string => {
    // Crea un marker SVG personalizzato basato sulla categoria
    const color = getCategoryColor(category);
    const icon = getCategoryIcon(category);
    
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <circle cx="20" cy="20" r="18" fill="${color}" filter="url(#shadow)" stroke="white" stroke-width="2"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-family="Arial">${icon}</text>
      </svg>
    `;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Ristoranti': '#EF4444',
      'Shopping': '#8B5CF6',
      'Salute': '#10B981',
      'Servizi': '#F59E0B',
      'Tempo Libero': '#3B82F6',
      'Automotive': '#6B7280',
      'Casa e Giardino': '#84CC16',
      'Tecnologia': '#06B6D4'
    };
    return colors[category] || '#6B7280';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      'Ristoranti': '🍽️',
      'Shopping': '🛍️',
      'Salute': '🏥',
      'Servizi': '✂️',
      'Tempo Libero': '🎮',
      'Automotive': '🚗',
      'Casa e Giardino': '🏠',
      'Tecnologia': '📱'
    };
    return icons[category] || '📍';
  };

  const createInfoWindowContent = (business: Business): string => {
    return `
      <div style="padding: 12px; min-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${business.name}</h3>
          ${business.isOpen ? 
            '<span style="margin-left: 8px; padding: 2px 8px; background: #10b981; color: white; border-radius: 12px; font-size: 10px; font-weight: 500;">APERTO</span>' :
            '<span style="margin-left: 8px; padding: 2px 8px; background: #ef4444; color: white; border-radius: 12px; font-size: 10px; font-weight: 500;">CHIUSO</span>'
          }
        </div>
        
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="color: #fbbf24; margin-right: 4px;">⭐</span>
          <span style="font-size: 14px; font-weight: 500; color: #374151;">${business.rating}</span>
          <span style="font-size: 12px; color: #6b7280; margin-left: 4px;">${business.category}</span>
        </div>
        
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">
          📍 ${business.address}
        </p>
        
        <div style="display: flex; gap: 8px;">
          ${business.phone ? 
            `<a href="tel:${business.phone}" style="padding: 6px 12px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 500;">📞 Chiama</a>` : 
            ''
          }
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}" target="_blank" style="padding: 6px 12px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 500;">🧭 Indicazioni</a>
        </div>
      </div>
    `;
  };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`;
    window.open(url, '_blank');
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRecenter = () => {
    if (map && marker) {
      map.setCenter(marker.getPosition());
      map.setZoom(16);
    }
  };

  if (error) {
    return (
      <div className={`${className} bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center`} style={{ height }}>
        <div className="text-center p-6">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={initializeMap}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Riprova
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center z-10">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"
              />
              <p className="text-gray-600 dark:text-gray-400 text-sm">Caricamento mappa...</p>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div 
          ref={mapRef} 
          className={`w-full rounded-xl ${isFullscreen ? 'h-screen' : ''}`}
          style={{ height: isFullscreen ? '100vh' : height }}
        />

        {/* Map Controls */}
        {showControls && !isLoading && (
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            {/* Fullscreen Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleFullscreen}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-600"
              title={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </motion.button>

            {/* Recenter */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRecenter}
              className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-600"
              title="Centra mappa"
            >
              <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </motion.button>

            {/* Directions */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetDirections}
              className="p-2 bg-blue-600 rounded-lg shadow-lg hover:shadow-xl transition-all text-white hover:bg-blue-700"
              title="Ottieni indicazioni"
            >
              <Navigation className="h-4 w-4" />
            </motion.button>
          </div>
        )}

        {/* Business Info Overlay */}
        {!isFullscreen && (
          <div className="absolute bottom-4 left-4 right-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {business.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    📍 {business.address}
                  </p>
                  <div className="flex items-center space-x-3 mt-2">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-1">
                        {business.rating}
                      </span>
                    </div>
                    {business.isOpen !== undefined && (
                      <span className={`text-xs font-medium ${
                        business.isOpen ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {business.isOpen ? 'Aperto' : 'Chiuso'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {business.phone && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`tel:${business.phone}`}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Chiama"
                    >
                      <Phone className="h-3 w-3" />
                    </motion.a>
                  )}
                  {business.website && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Sito web"
                    >
                      <Globe className="h-3 w-3" />
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleToggleFullscreen}
        />
      )}
    </>
  );
};

export default GoogleMap;