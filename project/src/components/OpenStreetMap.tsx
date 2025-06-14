import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Phone, Globe, Star, Clock, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import L from 'leaflet';

// Fix per le icone di Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface OpenStreetMapProps {
  business: Business;
  className?: string;
  height?: string;
  showControls?: boolean;
  interactive?: boolean;
}

// Componente per gestire il controllo della mappa
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ 
  business, 
  className = '', 
  height = '300px',
  showControls = true,
  interactive = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<[number, number]>([45.4642, 9.1900]); // Default Milano
  const [zoom, setZoom] = useState(16);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    initializeCoordinates();
  }, [business]);

  const initializeCoordinates = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Se abbiamo già le coordinate, usale
      if (business.latitude && business.longitude) {
        setCoordinates([business.latitude, business.longitude]);
        setIsLoading(false);
        return;
      }

      // Altrimenti usa geocoding gratuito con Nominatim (OpenStreetMap)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(business.address + ', Italy')}&limit=1`
        );
        
        if (!response.ok) {
          throw new Error('Geocoding service non disponibile');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setCoordinates([lat, lon]);
        } else {
          console.warn('Indirizzo non trovato, uso coordinate di default');
        }
      } catch (geocodeError) {
        console.warn('Geocoding fallito, uso coordinate di default:', geocodeError);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Errore inizializzazione mappa:', error);
      setError('Errore nel caricamento della mappa');
      setIsLoading(false);
    }
  };

  const createCustomIcon = (category: string) => {
    const color = getCategoryColor(category);
    const icon = getCategoryIcon(category);
    
    const svgIcon = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <circle cx="16" cy="16" r="14" fill="${color}" filter="url(#shadow)" stroke="white" stroke-width="2"/>
        <text x="16" y="21" text-anchor="middle" fill="white" font-size="12" font-family="Arial">${icon}</text>
      </svg>
    `;
    
    return L.divIcon({
      html: svgIcon,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
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

  const handleGetDirections = () => {
    // Usa OpenStreetMap per le indicazioni o Google Maps come fallback
    const osmUrl = `https://www.openstreetmap.org/directions?from=&to=${coordinates[0]},${coordinates[1]}`;
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(business.address)}`;
    
    // Prova prima OpenStreetMap, poi Google Maps come fallback
    window.open(osmUrl, '_blank');
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.setView(coordinates, 16);
      setZoom(16);
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
            onClick={initializeCoordinates}
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
        {!isLoading && (
          <MapContainer
            center={coordinates}
            zoom={zoom}
            style={{ 
              height: isFullscreen ? '100vh' : height,
              width: '100%',
              borderRadius: isFullscreen ? '0' : '0.75rem'
            }}
            zoomControl={interactive}
            scrollWheelZoom={interactive}
            dragging={interactive}
            touchZoom={interactive}
            doubleClickZoom={interactive}
            ref={mapRef}
            className={isFullscreen ? '' : 'rounded-xl'}
          >
            <MapController center={coordinates} zoom={zoom} />
            
            {/* Tile Layer - OpenStreetMap gratuito */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Marker personalizzato */}
            <Marker 
              position={coordinates} 
              icon={createCustomIcon(business.category)}
            >
              <Popup className="custom-popup">
                <div className="p-3 min-w-[250px] font-sans">
                  <div className="flex items-center mb-2">
                    <h3 className="text-base font-semibold text-gray-900 mr-2">{business.name}</h3>
                    {business.isOpen !== undefined && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        business.isOpen 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {business.isOpen ? 'APERTO' : 'CHIUSO'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium text-gray-700">{business.rating}</span>
                    <span className="text-xs text-gray-500 ml-2">{business.category}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                    📍 {business.address}
                  </p>
                  
                  <div className="flex gap-2">
                    {business.phone && (
                      <a 
                        href={`tel:${business.phone}`}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                      >
                        📞 Chiama
                      </a>
                    )}
                    <button
                      onClick={handleGetDirections}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                    >
                      🧭 Indicazioni
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        )}

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
              <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
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

export default OpenStreetMap;