import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, AlertCircle, Loader, Image, Trash2 } from 'lucide-react';
import { uploadAvatar, compressImage, validateImageFile } from '../lib/storage';

interface AvatarUploadProps {
  currentAvatar?: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
  className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onUploadSuccess,
  onUploadError,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    try {
      // Validazione file
      const validation = validateImageFile(file, 5);
      if (!validation.valid) {
        onUploadError(validation.error || 'File non valido');
        return;
      }

      setIsUploading(true);
      
      // Crea preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Comprimi l'immagine se necessario
      let fileToUpload = file;
      if (file.size > 1024 * 1024) { // Se > 1MB, comprimi
        fileToUpload = await compressImage(file, 400, 0.8);
      }

      // Upload
      const result = await uploadAvatar(fileToUpload);
      
      if (result.error) {
        onUploadError(result.error);
        setPreview(null);
      } else {
        onUploadSuccess(result.url);
        setPreview(null); // Rimuovi preview dopo upload riuscito
      }
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError('Errore durante l\'upload dell\'immagine');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    } else {
      onUploadError('Per favore seleziona un file immagine valido');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeCurrentAvatar = () => {
    onUploadSuccess(''); // Rimuovi avatar impostando URL vuoto
  };

  const displayImage = preview || currentAvatar;

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Avatar container */}
      <motion.div
        className={`relative w-24 h-24 rounded-full overflow-hidden border-4 transition-all duration-300 cursor-pointer ${
          dragOver 
            ? 'border-blue-500 border-dashed shadow-lg' 
            : 'border-gray-200 dark:border-gray-600 hover:border-blue-400'
        } ${isUploading ? 'opacity-75' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={openFileDialog}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Foto</p>
              </div>
            </div>
          )}
        </div>

        {/* Hover overlay */}
        <AnimatePresence>
          {showControls && !isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <div className="text-center">
                <Camera className="h-6 w-6 text-white mx-auto mb-1" />
                <p className="text-xs text-white font-medium">
                  {displayImage ? 'Cambia' : 'Carica'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag overlay */}
        <AnimatePresence>
          {dragOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-blue-500/80 flex items-center justify-center"
            >
              <div className="text-center">
                <Upload className="h-6 w-6 text-white mx-auto mb-1" />
                <p className="text-xs text-white font-medium">Rilascia qui</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mb-2"
                >
                  <Loader className="h-6 w-6 text-white" />
                </motion.div>
                <p className="text-xs text-white font-medium">Caricamento...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Action buttons */}
      <div className="flex justify-center mt-4 space-x-2">
        {/* Upload button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openFileDialog}
          disabled={isUploading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          <Image className="h-4 w-4" />
          <span className="text-sm font-medium">
            {displayImage ? 'Cambia Foto' : 'Carica Foto'}
          </span>
        </motion.button>

        {/* Remove button - solo se c'è un avatar */}
        <AnimatePresence>
          {currentAvatar && !preview && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={removeCurrentAvatar}
              disabled={isUploading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm font-medium">Rimuovi</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Preview controls */}
        <AnimatePresence>
          {preview && !isUploading && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearPreview}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
            >
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">Annulla</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Upload instructions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-center"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Trascina un'immagine o clicca per selezionare
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          JPG, PNG, WebP, GIF • Max 5MB
        </p>
      </motion.div>

      {/* Success indicator */}
      <AnimatePresence>
        {!isUploading && currentAvatar && !preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <Check className="h-3 w-3 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag and drop zone indicator */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute -inset-6 border-2 border-blue-500 border-dashed rounded-2xl bg-blue-50/80 dark:bg-blue-900/20 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center p-4">
              <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Rilascia l'immagine qui
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-300 mt-1">
                Formati supportati: JPG, PNG, WebP, GIF
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AvatarUpload;