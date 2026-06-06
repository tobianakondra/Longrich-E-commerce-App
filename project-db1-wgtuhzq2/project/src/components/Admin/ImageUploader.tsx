import React, { useState, useRef, type FC, useEffect } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value: string; // L'URL actuelle (si elle existe déjà dans Firestore)
  onFileSelect: (file: File | null) => void; // Pour transmettre le fichier au parent
  onRemove: () => void;
  label?: string;
}

export const ImageUploader: FC<ImageUploaderProps> = ({ value, onFileSelect, onRemove, label = "Image du produit" }) => {
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nettoyer l'URL de preview pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Veuillez sélectionner une image (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("L'image est trop lourde (max 10Mo)");
      return;
    }

    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    onFileSelect(file);
  };

  const handleRemove = () => {
    setLocalPreview(null);
    onFileSelect(null);
    onRemove();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentImage = localPreview || value;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} *
      </label>

      {!currentImage ? (
        <div 
          className={`border-2 border-dashed rounded-xl p-8 transition-all duration-200 flex flex-col items-center justify-center space-y-4 cursor-pointer
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="bg-purple-100 p-3 rounded-full">
            <Upload className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">Cliquez pour choisir une image</p>
            <p className="text-xs text-gray-500 mt-1">L'image sera envoyée uniquement lors de l'enregistrement</p>
          </div>
          {error && (
            <div className="flex items-center space-x-1 text-red-600 text-xs mt-2">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white p-2">
          <img 
            src={currentImage} 
            alt="Aperçu" 
            className="h-48 w-full object-contain rounded-lg bg-gray-50"
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
             <button
              type="button"
              onClick={handleRemove}
              className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors shadow-lg"
              title="Supprimer l'image"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              {localPreview ? (
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-600 flex items-center">
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Nouvelle image (En attente)
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider font-bold text-green-600 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Déjà dans le cloud
                </span>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-bold text-purple-600 hover:underline"
            >
              Remplacer
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      )}
    </div>
  );
};
