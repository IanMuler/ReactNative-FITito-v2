import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { validateExerciseImage } from '../utils';

interface UseImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  onImageSelected?: (uri: string) => void;
  onError?: (error: string) => void;
}

export const useImagePicker = (options: UseImagePickerOptions = {}) => {
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  
  const {
    allowsEditing = true,
    aspect = [1, 1],
    quality = 1,
    onImageSelected,
    onError,
  } = options;

  /* Image validation */
  const validateImage = useCallback((imageUri: string): boolean => {
    const validation = validateExerciseImage(imageUri);
    
    if (!validation.isValid) {
      setImageValidationError(validation.error || 'Imagen inválida');
      onError?.(validation.error || 'Imagen inválida');
      return false;
    }
    
    setImageValidationError(null);
    return true;
  }, [onError]);
  
  const pickFromLibrary = useCallback(async () => {
    try {
      setIsPickingImage(true);
      
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          "Permisos requeridos",
          "Necesitas dar permisos para acceder a la galería de fotos"
        );
        return null;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        if (validateImage(imageUri)) {
          onImageSelected?.(imageUri);
          return imageUri;
        }
        return null;
      }
      
      return null;
    } catch (error) {
      const errorMessage = 'Error al seleccionar la imagen';
      onError?.(errorMessage);
      Alert.alert("Error", errorMessage);
      return null;
    } finally {
      setIsPickingImage(false);
    }
  }, [allowsEditing, aspect, quality, onImageSelected, onError]);
  
  const pickFromCamera = useCallback(async () => {
    try {
      setIsPickingImage(true);
      
      // Request permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          "Permisos requeridos",
          "Necesitas dar permisos para acceder a la cámara"
        );
        return null;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing,
        aspect,
        quality,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        if (validateImage(imageUri)) {
          onImageSelected?.(imageUri);
          return imageUri;
        }
        return null;
      }
      
      return null;
    } catch (error) {
      const errorMessage = 'Error al tomar la foto';
      onError?.(errorMessage);
      Alert.alert("Error", errorMessage);
      return null;
    } finally {
      setIsPickingImage(false);
    }
  }, [allowsEditing, aspect, quality, onImageSelected, onError]);
  
  const showImagePickerOptions = useCallback(() => {
    Alert.alert(
      "Seleccionar imagen",
      "¿Cómo quieres agregar la imagen?",
      [
        {
          text: "Cámara",
          onPress: pickFromCamera,
        },
        {
          text: "Galería",
          onPress: pickFromLibrary,
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ]
    );
  }, [pickFromCamera, pickFromLibrary]);
  
  return {
    isPickingImage,
    imageValidationError,
    pickFromLibrary,
    pickFromCamera,
    showImagePickerOptions,
    validateImage,
  };
};