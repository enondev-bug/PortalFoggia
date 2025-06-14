import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Image, Trash2, Star, Eye, Plus, X, 
  Camera, Check, AlertCircle, Loader, Move, 
  RotateCcw, Crop, Download, Edit3, Crown
} from 'lucide-react';
import { uploadBusinessImage, deleteBusinessImage, compressImage, validateImageFile } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

interface BusinessImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

interface BusinessImageManagerProps {
  businessId: string;
  businessName: string;
  images: BusinessImage[];
  onImagesUpdate: (images: BusinessImage[]) => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const BusinessImageManager: React.FC<BusinessImageManagerProps> = ({
  businessId,
  businessName,
  images,
  onImagesUpdate,
  showNotification
}) => {
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [dragOverLogo, setDragOverLogo] = useState(false);
  const [dragOverGallery, setDragOverGallery] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      
      // Validazione file
      const validation = validateImageFile(file, 5);
      if (!validation.valid) {
        showNotification(`❌ ${validation.error}`, 'warning');
        setIsUploadingLogo(false);
        return;
      }

      // Comprimi se necessario
      let fileToUpload = file;
      if (file.size > 1 * 1024 * 1024) { // Se > 1MB, comprimi
        fileToUpload = await compressImage(file, 800, 0.9);
      }

      // Upload a Supabase Storage
      const result = await uploadBusinessImage(fileToUpload, businessId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Rimuovi il logo precedente se esiste
      const oldLogo = images.find(img => img.is_primary);
      if (oldLogo) {
        // Elimina il vecchio logo da Storage
        await deleteBusinessImage(oldLogo.url);
        
        // Aggiorna il record nel database
        await supabase
          .from('business_images')
          .delete()
          .eq('id', oldLogo.id);
      }
      
      // Crea nuovo record nel database
      const { data: newImage, error } = await supabase
        .from('business_images')
        .insert({
          business_id: businessId,
          url: result.url,
          alt_text: `Logo di ${businessName}`,
          is_primary: true,
          sort_order: 0
        })
        .select()
        .single();
      
      if (error) throw error;

      // Aggiorna la lista immagini
      const updatedImages = images.filter(img => !img.is_primary);
      onImagesUpdate([newImage, ...updatedImages]);
      
      showNotification('🏷️ Logo caricato con successo!', 'success');
    } catch (error) {
      console.error('Logo upload error:', error);
      showNotification('❌ Errore durante il caricamento del logo', 'warning');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setIsUploadingGallery(true);
    const newImages: BusinessImage[] = [];
    const errors: string[] = [];

    try {
      // Ottieni il numero massimo di sort_order esistente
      const maxSortOrder = images
        .filter(img => !img.is_primary)
        .reduce((max, img) => Math.max(max, img.sort_order), 0);
      
      // Processa ogni file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validazione file
        const validation = validateImageFile(file, 10);
        if (!validation.valid) {
          errors.push(`${file.name}: ${validation.error}`);
          continue;
        }

        try {
          // Comprimi se necessario
          let fileToUpload = file;
          if (file.size > 2 * 1024 * 1024) { // Se > 2MB, comprimi
            fileToUpload = await compressImage(file, 1200, 0.85);
          }

          // Upload a Supabase Storage
          const result = await uploadBusinessImage(fileToUpload, businessId);
          
          if (result.error) {
            errors.push(`${file.name}: ${result.error}`);
            continue;
          }

          // Crea record nel database
          const { data: newImage, error } = await supabase
            .from('business_images')
            .insert({
              business_id: businessId,
              url: result.url,
              alt_text: `${businessName} - Immagine ${i + 1}`,
              is_primary: false,
              sort_order: maxSortOrder + i + 1
            })
            .select()
            .single();
          
          if (error) {
            errors.push(`${file.name}: ${error.message}`);
            continue;
          }

          newImages.push(newImage);
        } catch (error) {
          errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        }
      }

      // Aggiorna la lista immagini
      if (newImages.length > 0) {
        onImagesUpdate([...images, ...newImages]);
        showNotification(`✅ ${newImages.length} immagini aggiunte alla galleria!`, 'success');
      }

      // Mostra errori se presenti
      if (errors.length > 0) {
        console.error('Gallery upload errors:', errors);
        showNotification(`❌ ${errors.length} immagini non sono state caricate`, 'warning');
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      showNotification('❌ Errore durante il caricamento delle immagini', 'warning');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverLogo(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleLogoUpload(files[0]); // Solo il primo file per il logo
    }
  };

  const handleGalleryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverGallery(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleGalleryUpload(files);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) return;
    
    const isLogo = imageToDelete.is_primary;
    
    if (!confirm(`Sei sicuro di voler eliminare ${isLogo ? 'il logo' : 'questa immagine'}?`)) return;

    try {
      // Elimina da Storage
      await deleteBusinessImage(imageToDelete.url);
      
      // Elimina dal database
      const { error } = await supabase
        .from('business_images')
        .delete()
        .eq('id', imageId);
      
      if (error) throw error;

      // Aggiorna la lista immagini
      const updatedImages = images.filter(img => img.id !== imageId);
      onImagesUpdate(updatedImages);
      
      showNotification(isLogo ? '🗑️ Logo eliminato' : '🗑️ Immagine eliminata', 'success');
    } catch (error) {
      console.error('Image delete error:', error);
      showNotification('❌ Errore durante l\'eliminazione', 'warning');
    }
  };

  const handleSetAsLogo = async (imageId: string) => {
    try {
      // Trova l'immagine da impostare come logo
      const newLogo = images.find(img => img.id === imageId);
      if (!newLogo) return;
      
      // Trova il logo attuale
      const currentLogo = images.find(img => img.is_primary);
      
      // Aggiorna il database
      const updates = [];
      
      // Rimuovi flag dal logo attuale
      if (currentLogo) {
        updates.push(
          supabase
            .from('business_images')
            .update({ is_primary: false })
            .eq('id', currentLogo.id)
        );
      }
      
      // Imposta il nuovo logo
      updates.push(
        supabase
          .from('business_images')
          .update({ is_primary: true, sort_order: 0 })
          .eq('id', newLogo.id)
      );
      
      await Promise.all(updates);
      
      // Aggiorna la lista immagini
      const updatedImages = images.map(img => ({
        ...img,
        is_primary: img.id === imageId,
        sort_order: img.id === imageId ? 0 : img.sort_order
      }));
      
      onImagesUpdate(updatedImages);
      showNotification('🏷️ Nuovo logo impostato!', 'success');
    } catch (error) {
      console.error('Set as logo error:', error);
      showNotification('❌ Errore durante l\'impostazione del logo', 'warning');
    }
  };

  const handleUpdateAltText = async (imageId: string) => {
    try {
      // Aggiorna il database
      const { error } = await supabase
        .from('business_images')
        .update({ alt_text: altText })
        .eq('id', imageId);
      
      if (error) throw error;
      
      // Aggiorna la lista immagini
      const updatedImages = images.map(img => 
        img.id === imageId ? { ...img, alt_text: altText } : img
      );
      
      onImagesUpdate(updatedImages);
      setEditingAlt(null);
      setAltText('');
      
      showNotification('✏️ Descrizione aggiornata', 'success');
    } catch (error) {
      console.error('Update alt text error:', error);
      showNotification('❌ Errore durante l\'aggiornamento della descrizione', 'warning');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    
    if (!confirm(`Sei sicuro di voler eliminare ${selectedImages.size} immagini dalla galleria?`)) return;

    try {
      // Elimina da Storage e database
      const deletePromises = Array.from(selectedImages).map(async (imageId) => {
        const imageToDelete = images.find(img => img.id === imageId);
        if (!imageToDelete) return;
        
        // Elimina da Storage
        await deleteBusinessImage(imageToDelete.url);
        
        // Elimina dal database
        return supabase
          .from('business_images')
          .delete()
          .eq('id', imageId);
      });
      
      await Promise.all(deletePromises);
      
      // Aggiorna la lista immagini
      const updatedImages = images.filter(img => !selectedImages.has(img.id));
      onImagesUpdate(updatedImages);
      setSelectedImages(new Set());
      
      showNotification(`🗑️ ${selectedImages.size} immagini eliminate dalla galleria`, 'success');
    } catch (error) {
      console.error('Bulk delete error:', error);
      showNotification('❌ Errore durante l\'eliminazione delle immagini', 'warning');
    }
  };

  const toggleImageSelection = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const logoImage = images.find(img => img.is_primary);
  const galleryImages = images.filter(img => !img.is_primary).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-8">
      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleGalleryUpload(e.target.files)}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gestione Immagini
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {images.length} immagini totali • {logoImage ? '1 logo' : 'Nessun logo'} • {galleryImages.length} in galleria
          </p>
        </div>
      </div>

      {/* SEZIONE LOGO */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-800">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              🏷️ Logo Aziendale
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Immagine principale che rappresenta l'attività
            </p>
          </div>
        </div>

        {logoImage ? (
          /* Logo esistente */
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={logoImage.url}
                alt={logoImage.alt_text || 'Logo aziendale'}
                className="w-full h-64 object-cover rounded-xl shadow-lg border-4 border-amber-200 dark:border-amber-700"
              />
              
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPreview(logoImage.url)}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-colors"
                >
                  <Eye className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setEditingAlt(logoImage.id);
                    setAltText(logoImage.alt_text || '');
                  }}
                  className="p-3 bg-blue-500/80 backdrop-blur-sm rounded-xl text-white hover:bg-blue-600/80 transition-colors"
                >
                  <Edit3 className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => logoInputRef.current?.click()}
                  className="p-3 bg-green-500/80 backdrop-blur-sm rounded-xl text-white hover:bg-green-600/80 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteImage(logoImage.id)}
                  className="p-3 bg-red-500/80 backdrop-blur-sm rounded-xl text-white hover:bg-red-600/80 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </motion.button>
              </div>
              
              {/* Logo badge */}
              <div className="absolute top-4 left-4 px-3 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg">
                <Crown className="h-4 w-4 fill-current" />
                <span>LOGO UFFICIALE</span>
              </div>
            </div>
            
            {logoImage.alt_text && (
              <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Descrizione:</strong> {logoImage.alt_text}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Upload area per logo */
          <motion.div
            className={`relative border-3 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
              dragOverLogo 
                ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/30' 
                : 'border-amber-300 dark:border-amber-600 hover:border-amber-400 dark:hover:border-amber-500'
            } ${isUploadingLogo ? 'opacity-75 pointer-events-none' : ''}`}
            onDrop={handleLogoDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOverLogo(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOverLogo(false); }}
            onClick={() => logoInputRef.current?.click()}
          >
            <div className="text-center">
              {isUploadingLogo ? (
                <div className="space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"
                  />
                  <p className="text-amber-700 dark:text-amber-300 font-medium">Caricamento logo...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-amber-200 dark:bg-amber-800 rounded-2xl flex items-center justify-center mx-auto">
                    <Crown className="h-10 w-10 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Carica il Logo Aziendale
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Trascina qui il logo o clicca per selezionare
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                      JPG, PNG, WebP • Max 5MB • Preferibilmente quadrato
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* SEZIONE GALLERIA */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Image className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                📸 Galleria Fotografica
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {galleryImages.length} immagini • Mostra i tuoi spazi e prodotti
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {selectedImages.size > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Elimina ({selectedImages.size})</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => galleryInputRef.current?.click()}
              disabled={isUploadingGallery}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Aggiungi Foto</span>
            </motion.button>
          </div>
        </div>

        {/* Upload area per galleria */}
        <motion.div
          className={`relative border-2 border-dashed rounded-xl p-8 mb-6 transition-all cursor-pointer ${
            dragOverGallery 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${isUploadingGallery ? 'opacity-75 pointer-events-none' : ''}`}
          onDrop={handleGalleryDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOverGallery(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOverGallery(false); }}
          onClick={() => galleryInputRef.current?.click()}
        >
          <div className="text-center">
            {isUploadingGallery ? (
              <div className="space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"
                />
                <p className="text-blue-600 dark:text-blue-400">Caricamento immagini...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto">
                  <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Aggiungi Immagini alla Galleria
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    JPG, PNG, WebP • Max 10MB per immagine • Selezione multipla
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Griglia galleria */}
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                  selectedImages.has(image.id)
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => toggleImageSelection(image.id)}
              >
                <img
                  src={image.url}
                  alt={image.alt_text || `Immagine ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    selectedImages.has(image.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white/80 border-white/80 backdrop-blur-sm'
                  }`}>
                    {selectedImages.has(image.id) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPreview(image.url);
                    }}
                    className="p-1.5 bg-white/20 backdrop-blur-sm rounded text-white hover:bg-white/30 transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAsLogo(image.id);
                    }}
                    className="p-1.5 bg-amber-500/80 backdrop-blur-sm rounded text-white hover:bg-amber-600/80 transition-colors"
                    title="Imposta come logo"
                  >
                    <Crown className="h-3 w-3" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.id);
                    }}
                    className="p-1.5 bg-red-500/80 backdrop-blur-sm rounded text-white hover:bg-red-600/80 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </motion.button>
                </div>
                
                {/* Image info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs truncate">
                    {image.alt_text || `Immagine ${index + 1}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nessuna immagine in galleria
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Aggiungi foto dei tuoi spazi, prodotti e servizi
            </p>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl"
            >
              <img
                src={showPreview}
                alt="Anteprima"
                className="w-full h-full object-contain"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPreview(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alt Text Edit Modal */}
      <AnimatePresence>
        {editingAlt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingAlt(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Modifica Descrizione
              </h3>
              <textarea
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descrivi questa immagine..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex space-x-3 mt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleUpdateAltText(editingAlt)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salva
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditingAlt(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annulla
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3">
              💡 Consigli per Immagini Efficaci
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
              <div>
                <h5 className="font-semibold mb-2">🏷️ Logo Perfetto:</h5>
                <ul className="space-y-1">
                  <li>• Formato quadrato (1:1)</li>
                  <li>• Alta risoluzione (min 512x512px)</li>
                  <li>• Sfondo trasparente o neutro</li>
                  <li>• Leggibile anche in piccolo</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">📸 Galleria Vincente:</h5>
                <ul className="space-y-1">
                  <li>• Mostra esterno e interno</li>
                  <li>• Prodotti e servizi in azione</li>
                  <li>• Immagini luminose e nitide</li>
                  <li>• Varie angolazioni e dettagli</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessImageManager;