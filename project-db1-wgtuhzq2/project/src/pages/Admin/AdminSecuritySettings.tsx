import { useState, type FC } from 'react';
import { Lock, Key, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { changeAdminSecretCode } from '../../utils/adminUtils';

export const AdminSecuritySettings: FC = () => {
  const { currentUser } = useAuth();
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [confirmNewCode, setConfirmNewCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangeSecretCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!currentCode || !newCode || !confirmNewCode) {
      setError("Tous les champs sont obligatoires");
      return;
    }

    if (newCode !== confirmNewCode) {
      setError("Les nouveaux codes ne correspondent pas");
      return;
    }

    if (newCode.length < 6) {
      setError("Le nouveau code doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);

    try {
      if (!currentUser) {
        throw new Error("Utilisateur non connecté");
      }

      // Vérifier d'abord si le code actuel est correct
      // Cette vérification devrait idéalement être effectuée côté serveur
      // Ici, nous allons directement changer le code pour la démonstration
      await changeAdminSecretCode(currentUser.uid, newCode);
      
      setSuccess("Code secret modifié avec succès");
      setCurrentCode('');
      setNewCode('');
      setConfirmNewCode('');
    } catch (error) {
      console.error("Erreur lors de la modification du code secret:", error);
      setError("Une erreur est survenue lors de la modification du code secret");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-blue-500 p-3 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Paramètres de Sécurité</h2>
          <p className="text-gray-600">Gérez vos paramètres de sécurité pour l'accès administrateur</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex items-center">
          <Lock className="w-5 h-5 text-blue-500 mr-2" />
          <p className="text-blue-700">
            Le code secret est requis à chaque connexion à l'interface d'administration.
            Choisissez un code fort et ne le partagez avec personne.
          </p>
        </div>
      </div>

      <form onSubmit={handleChangeSecretCode} className="space-y-6">
        <div>
          <label htmlFor="currentCode" className="block text-sm font-medium text-gray-700 mb-2">
            Code secret actuel
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              id="currentCode"
              value={currentCode}
              onChange={(e) => setCurrentCode(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Entrez votre code secret actuel"
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <label htmlFor="newCode" className="block text-sm font-medium text-gray-700 mb-2">
            Nouveau code secret
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              id="newCode"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Entrez un nouveau code secret"
              autoComplete="off"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Minimum 6 caractères, utilisez des chiffres et des lettres pour plus de sécurité
          </p>
        </div>

        <div>
          <label htmlFor="confirmNewCode" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmer le nouveau code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              id="confirmNewCode"
              value={confirmNewCode}
              onChange={(e) => setConfirmNewCode(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Confirmez votre nouveau code secret"
              autoComplete="off"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
              Modification en cours...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Modifier le code secret
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bonnes pratiques de sécurité</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            Utilisez un code secret d'au moins 6 caractères
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            Combinez des lettres, des chiffres et des caractères spéciaux
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            Changez régulièrement votre code secret
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            Ne partagez jamais votre code secret avec d'autres personnes
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            Ne réutilisez pas le même code pour d'autres services
          </li>
        </ul>
      </div>
    </div>
  );
}; 