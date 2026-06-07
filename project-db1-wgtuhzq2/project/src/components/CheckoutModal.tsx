import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import { sendVerificationCode, verifyCode } from '../services/twilioService';
import { useSmsConfig, SmsConfig } from '../hooks/useSmsConfig';
import { sanitizeAndValidate } from '../utils/inputValidation';

// URL du serveur de paiement
const PAYMENT_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSmsConfig?: SmsConfig | null;
}

interface FormData {
  phoneNumber: string;
  region: string;
  quartier: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, initialSmsConfig = null }) => {
  const { items, totalPrice } = useCart();
  const { currentUser } = useAuth();
  const { config: fetchedSmsConfig, loading: smsConfigLoading } = useSmsConfig();
  // Utiliser la configuration initiale si elle existe, sinon utiliser celle du hook
  const smsConfig = initialSmsConfig || fetchedSmsConfig;
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: currentUser?.phone || '',
    region: '',
    quartier: ''
  });
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneVerification, setPhoneVerification] = useState({
    isVerifying: false,
    isLoading: false,
    code: '',
    isVerified: currentUser?.phone ? true : false,
    error: '',
    verificationSid: ''
  });

  // Ne récupérer que la liste des régions à l'ouverture du modal
  useEffect(() => {
    if (isOpen) {
      fetchRegions();
    }
  }, [isOpen]);

  // Récupérer la liste des régions
  const fetchRegions = async () => {
    try {
      const response = await fetch(`${PAYMENT_SERVER_URL}/api/regions`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des régions');
      }

      const data = await response.json();
      setRegions(data.regions);
    } catch (error) {
      setError('Erreur de chargement des régions');
      console.error('Erreur régions:', error);
    }
  };

  // Valider le numéro de téléphone
  const validatePhone = (phone: string): boolean => {
    const cleanedPhone = phone.replace(/\s+|-|\(|\)|\+/g, '');
    const phoneRegex = /^(77|78|76|70|75)[0-9]{7}$/;
    return phoneRegex.test(cleanedPhone) && cleanedPhone.length === 9;
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Si c'est le numéro de téléphone, valider en temps réel
    if (name === 'phoneNumber') {
      // Autoriser seulement les chiffres et quelques caractères de formatage
      const sanitizedValue = value.replace(/[^\d\s+-]/g, '');

      // Valider le format si le champ n'est pas vide
      if (sanitizedValue && sanitizedValue.length > 2) {
        const isValid = validatePhone(sanitizedValue);
        if (!isValid) {
          setPhoneError('Format invalide. Utilisez un numéro à 9 chiffres commençant par 77, 78, 76, 70 ou 75.');
        } else {
          setPhoneError(null);
        }
      } else {
        setPhoneError(null);
      }

      setFormData({
        ...formData,
        [name]: sanitizedValue
      });

      // Réinitialiser la vérification si le numéro change
      if (sanitizedValue !== currentUser?.phone) {
        setPhoneVerification(prev => ({
          ...prev,
          isVerified: false,
          error: ''
        }));
      }
    } else if (name === 'quartier') {
      // Valider et sanitiser le quartier
      const result = sanitizeAndValidate(value, 'quartier');
      
      setFormData({
        ...formData,
        [name]: result.value
      });
      
      // Afficher l'erreur si invalide et non vide
      if (result.value && !result.isValid) {
        setError(result.error || 'Quartier invalide');
      } else {
        setError(null);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleVerifyPhone = async () => {
    // Valider le format du numéro de téléphone
    if (!validatePhone(formData.phoneNumber)) {
      setPhoneVerification({
        ...phoneVerification,
        error: 'Format invalide. Utilisez un numéro à 9 chiffres commençant par 77, 78, 76, 70 ou 75.',
        isLoading: false,
        isVerifying: false,
        isVerified: false,
        code: '',
        verificationSid: ''
      });
      return;
    }

    try {
      setPhoneVerification(prev => ({
        ...prev,
        isLoading: true,
        error: ''
      }));

      // Vérifier si la vérification SMS est activée
      if (smsConfig && !smsConfig.smsEnabled) {
        console.log('Vérification SMS désactivée - acceptation automatique sans requête réseau');
        // Marquer directement le numéro comme vérifié sans ouvrir le modal ni envoyer de requête
        setPhoneVerification(prev => ({
          ...prev,
          isVerified: true,
          isLoading: false,
          error: ''
        }));
        return;
      }

      // Envoyer le code de vérification seulement si SMS est activé
      const result = await sendVerificationCode(formData.phoneNumber);

      if (result.success) {
        // Si le mode bypass est activé (SMS désactivé côté serveur)
        if (result.bypassed) {
          setPhoneVerification(prev => ({
            ...prev,
            isVerified: true,
            isLoading: false,
            error: ''
          }));
        } else {
          setPhoneVerification(prev => ({
            ...prev,
            isVerifying: true,
            isLoading: false,
            verificationSid: result.sid || ''
          }));
        }
      } else {
        setPhoneVerification(prev => ({
          ...prev,
          isLoading: false,
          error: result.message
        }));
      }
    } catch (error) {
      setPhoneVerification(prev => ({
        ...prev,
        isLoading: false,
        error: 'Une erreur est survenue lors de l\'envoi du code'
      }));
      console.error('Erreur lors de la vérification du téléphone:', error);
    }
  };

  const handleVerifyCode = async () => {
    // Vérifier si la vérification SMS est activée
    if (smsConfig && !smsConfig.smsEnabled) {
      setPhoneVerification(prev => ({
        ...prev,
        isVerified: true,
        isVerifying: false,
        isLoading: false,
        error: ''
      }));
      return;
    }

    // Vérifier que le code a 6 chiffres
    if (!/^\d{6}$/.test(phoneVerification.code)) {
      setPhoneVerification({
        ...phoneVerification,
        error: 'Le code doit contenir 6 chiffres'
      });
      return;
    }

    try {
      setPhoneVerification(prev => ({
        ...prev,
        isLoading: true,
        error: ''
      }));

      // Vérifier le code
      const result = await verifyCode(formData.phoneNumber, phoneVerification.code);

      if (result.success) {
        setPhoneVerification(prev => ({
          ...prev,
          isVerifying: false,
          isLoading: false,
          isVerified: true,
          error: ''
        }));
      } else {
        setPhoneVerification(prev => ({
          ...prev,
          isLoading: false,
          error: result.message
        }));
      }
    } catch (error) {
      setPhoneVerification(prev => ({
        ...prev,
        isLoading: false,
        error: 'Une erreur est survenue lors de la vérification du code'
      }));
      console.error('Erreur lors de la vérification du code:', error);
    }
  };

  // Soumettre le formulaire de paiement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Vérifier si le numéro est vérifié
    if (!phoneVerification.isVerified) {
      handleVerifyPhone();
      return;
    }

    setLoading(true);

    try {
      // Valider le formulaire côté client
      if (!formData.phoneNumber || !formData.region || !formData.quartier) {
        throw new Error('Veuillez remplir tous les champs');
      }

      // Nettoyer le numéro de téléphone
      const cleanedPhone = formData.phoneNumber.replace(/\s+|-|\(|\)|\+/g, '');

      // Valider le format du numéro de téléphone (format sénégalais)
      if (!validatePhone(cleanedPhone)) {
        throw new Error('Format de numéro de téléphone invalide. Utilisez un numéro à 9 chiffres commençant par 77, 78, 76, 70 ou 75.');
      }

      // Récupérer le token CSRF juste avant l'envoi
      const tokenResponse = await fetch(`${PAYMENT_SERVER_URL}/api/csrf-token`, {
        credentials: 'include'
      });

      if (!tokenResponse.ok) {
        throw new Error('Erreur lors de la récupération du token CSRF');
      }

      const { csrfToken } = await tokenResponse.json();

      if (!csrfToken) {
        throw new Error('Token CSRF non disponible');
      }

      // Envoyer la requête au serveur
      const response = await fetch(`${PAYMENT_SERVER_URL}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: cleanedPhone, // Utiliser le numéro nettoyé
          region: formData.region,
          quartier: formData.quartier,
          amount: totalPrice,
          customerName: currentUser?.displayName || 'Client',
          userId: currentUser?.uid,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          description: `Commande Longrich - ${items.length} produit(s)`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur de réponse:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          error: errorData
        });
        throw new Error(errorData.error || 'Erreur lors du traitement du paiement');
      }

      const data = await response.json();

            // Ouvrir directement l'URL de paiement dans un nouvel onglet
      console.log('Ouverture de l\'URL de paiement:', data.paymentUrl);
      window.open(data.paymentUrl, '_blank');
      setLoading(false);

      // Fermer le modal après ouverture du paiement
      onClose();

    } catch (error: any) {
      console.error('Erreur complète:', error);
      setError(error.message || 'Erreur lors du traitement du paiement');
    } finally {
      setLoading(false);
    }
  };

  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Modal de vérification du téléphone */}
      {phoneVerification.isVerifying && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Vérification du numéro de téléphone</h3>
            <p className="text-gray-600 mb-4">
              Un code de vérification a été envoyé au {formData.phoneNumber}. Veuillez entrer ce code pour confirmer votre numéro.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code de vérification
              </label>
              <input
                type="text"
                value={phoneVerification.code}
                onChange={(e) => setPhoneVerification({ ...phoneVerification, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="Entrez le code à 6 chiffres"
                maxLength={6}
              />
              {phoneVerification.error && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>{phoneVerification.error}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleVerifyCode}
                disabled={phoneVerification.isLoading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
              >
                {phoneVerification.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  <span>Vérifier</span>
                )}
              </button>
              <button
                onClick={() => setPhoneVerification({ ...phoneVerification, isVerifying: false })}
                disabled={phoneVerification.isLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Finaliser votre commande</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {smsConfigLoading ? (
          <div className="flex justify-center my-4">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="phoneNumber" className="block text-gray-700 font-medium mb-2">
                Numéro de téléphone (Wave)
              </label>
              <div className="flex">
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="77XXXXXXX"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 ${phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  required
                  disabled={loading}
                  maxLength={9}
                  pattern="^(77|78|76|70|75)[0-9]{7}$"
                />
                {phoneVerification.isVerified ? (
                  <div className="bg-green-500 text-white px-3 flex items-center justify-center rounded-r-lg">
                    <Check className="w-4 h-4" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerifyPhone}
                    disabled={phoneVerification.isLoading || !formData.phoneNumber}
                    className="bg-purple-600 text-white px-3 rounded-r-lg hover:bg-purple-700 transition-colors flex items-center justify-center disabled:bg-purple-300"
                  >
                    {phoneVerification.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Vérifier</span>
                    )}
                  </button>
                )}
              </div>
              {phoneError ? (
                <p className="text-xs text-red-500 mt-1">{phoneError}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Format: 77XXXXXXX, 78XXXXXXX, etc.</p>
              )}
              {smsConfig && !smsConfig.smsEnabled && (
                <p className="text-xs text-blue-500 mt-1">Mode vérification SMS désactivé - validation automatique</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="region" className="block text-gray-700 font-medium mb-2">
                Région
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="">Sélectionner une région</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="quartier" className="block text-gray-700 font-medium mb-2">
                Quartier
              </label>
              <input
                type="text"
                id="quartier"
                name="quartier"
                placeholder="Votre quartier"
                value={formData.quartier}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                Lettres, chiffres et caractères spéciaux basiques uniquement (2-100 caractères)
              </p>
            </div>

            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Total à payer:</span>
                <span className="font-bold">{totalPrice.toLocaleString()} FCFA</span>
              </div>
              <div className="text-xs text-gray-500">
                {items.length} produit(s) dans votre panier
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${loading || !phoneVerification.isVerified
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                } transition-colors duration-200 flex items-center justify-center`}
              disabled={loading || !phoneVerification.isVerified}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Traitement en cours...
                </>
              ) : !phoneVerification.isVerified ? (
                'Vérifiez votre numéro pour continuer'
              ) : (
                'Payer maintenant'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal; 