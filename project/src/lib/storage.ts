import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload di un file avatar per l'utente corrente
 */
export const uploadAvatar = async (file: File): Promise<UploadResult> => {
  try {
    // Validazione file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (file.size > maxSize) {
      return { url: '', path: '', error: 'File troppo grande. Massimo 5MB consentiti.' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { url: '', path: '', error: 'Tipo file non supportato. Usa JPG, PNG, WebP o GIF.' };
    }

    // Ottieni l'utente corrente
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { url: '', path: '', error: 'Utente non autenticato' };
    }

    // Genera nome file unico
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload del file
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: '', path: '', error: `Errore upload: ${error.message}` };
    }

    // Ottieni URL pubblico
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      error: undefined
    };

  } catch (error) {
    console.error('Upload exception:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Errore sconosciuto' 
    };
  }
};

/**
 * Elimina un avatar dal storage
 */
export const deleteAvatar = async (path: string): Promise<boolean> => {
  try {
    // Se è un URL completo, estrai il path
    if (path.includes('/storage/v1/object/public/')) {
      path = path.split('/storage/v1/object/public/')[1];
      // Rimuovi il bucket name
      if (path.startsWith('avatars/')) {
        path = path.substring('avatars/'.length);
      }
    }

    const { error } = await supabase.storage
      .from('avatars')
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
};

/**
 * Upload di immagini per attività commerciali
 */
export const uploadBusinessImage = async (file: File, businessId: string): Promise<UploadResult> => {
  try {
    // Validazione file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
      return { url: '', path: '', error: 'File troppo grande. Massimo 10MB consentiti.' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { url: '', path: '', error: 'Tipo file non supportato. Usa JPG, PNG o WebP.' };
    }

    // Genera nome file unico
    const fileExt = file.name.split('.').pop();
    const fileName = `${businessId}/${Date.now()}.${fileExt}`;

    // Upload del file
    const { data, error } = await supabase.storage
      .from('business-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Business image upload error:', error);
      return { url: '', path: '', error: `Errore upload: ${error.message}` };
    }

    // Ottieni URL pubblico
    const { data: { publicUrl } } = supabase.storage
      .from('business-images')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      error: undefined
    };

  } catch (error) {
    console.error('Business image upload exception:', error);
    return { 
      url: '', 
      path: '', 
      error: error instanceof Error ? error.message : 'Errore sconosciuto' 
    };
  }
};

/**
 * Elimina un'immagine di attività dal storage
 */
export const deleteBusinessImage = async (path: string): Promise<boolean> => {
  try {
    // Se è un URL completo, estrai il path
    if (path.includes('/storage/v1/object/public/')) {
      path = path.split('/storage/v1/object/public/')[1];
      // Rimuovi il bucket name
      if (path.startsWith('business-images/')) {
        path = path.substring('business-images/'.length);
      }
    }

    const { error } = await supabase.storage
      .from('business-images')
      .remove([path]);

    if (error) {
      console.error('Business image delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Business image delete exception:', error);
    return false;
  }
};

/**
 * Ottieni URL pubblico per un file
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Lista file in un bucket
 */
export const listFiles = async (bucket: string, folder?: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('List files exception:', error);
    return [];
  }
};

/**
 * Comprimi un'immagine prima dell'upload
 */
export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calcola nuove dimensioni mantenendo aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Disegna l'immagine ridimensionata
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Converti in blob
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, file.type, quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Valida un file immagine
 */
export const validateImageFile = (file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo file non supportato. Usa JPG, PNG, WebP o GIF.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File troppo grande. Massimo ${maxSizeMB}MB consentiti.`
    };
  }

  return { valid: true };
};