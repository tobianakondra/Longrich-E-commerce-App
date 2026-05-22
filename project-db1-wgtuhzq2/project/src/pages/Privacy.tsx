import { type FC } from 'react';
import { Shield, Eye, Lock, UserCheck } from 'lucide-react';
import { useSEOEnhanced } from '../hooks/useSEOEnhanced';

export const Privacy: FC = () => {
  useSEOEnhanced({
    title: 'Politique de Confidentialit\u00E9',
    description: 'Chez Longrich, nous nous engageons \u00E0 prot\u00E9ger et respecter votre vie priv\u00E9e. D\u00E9couvrez comment nous g\u00E9rons vos donn\u00E9es personnelles.',
    keywords: 'Longrich,confidentialit\u00E9,donn\u00E9es personnelles,politique,protection,S\u00E9n\u00E9gal',
    type: 'website',
    url: 'https://longrich.online/privacy',
    canonical: 'https://longrich.online/privacy',
    language: 'fr',
  });
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <Shield className="w-12 h-12 md:w-16 md:h-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Politique de Confidentialité
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Votre vie privée est notre priorité
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6 md:space-y-8">
          {/* Introduction */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
                <Eye className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Notre Engagement</h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Chez Longrich, nous nous engageons à protéger et respecter votre vie privée.
              Cette politique de confidentialité explique comment nous collectons, utilisons et
              protégeons vos informations personnelles lorsque vous utilisez notre site web et nos services.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
                <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Collecte des Données</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Nous collectons uniquement les informations nécessaires pour vous fournir nos services :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm md:text-base ml-4">
                <li>Informations de compte (email, nom) lors de votre inscription</li>
                <li>Informations de commande pour traiter vos achats</li>
                <li>Données de navigation pour améliorer votre expérience</li>
                <li>Communications que vous nous envoyez</li>
              </ul>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-green-800 font-medium text-sm md:text-base">
                  ✓ Aucune donnée n'est collectée sans votre consentement explicite
                </p>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3">Utilisation des Données</h3>
            <p className="text-gray-600 text-sm md:text-base mb-4">Nous utilisons vos informations pour :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm md:text-base ml-4">
              <li>Traiter et expédier vos commandes</li>
              <li>Vous contacter concernant votre compte ou vos commandes</li>
              <li>Améliorer nos produits et services</li>
              <li>Vous envoyer des informations sur nos nouveautés (avec votre accord)</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-lg">
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Protection des Données</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Nous mettons en place des mesures de sécurité appropriées pour protéger vos
                informations personnelles contre tout accès non autorisé, modification,
                divulgation ou destruction.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm md:text-base">Chiffrement</h4>
                  <p className="text-blue-800 text-xs md:text-sm">
                    Toutes vos données sont chiffrées lors de la transmission
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm md:text-base">Accès Limité</h4>
                  <p className="text-purple-800 text-xs md:text-sm">
                    Seules les personnes autorisées ont accès à vos données
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Vos Droits</h2>
            <p className="text-gray-600 text-sm md:text-base mb-4">Vous avez le droit de :</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 text-sm md:text-base ml-4">
              <li>Accéder à vos données personnelles</li>
              <li>Rectifier ou mettre à jour vos informations</li>
              <li>Supprimer votre compte et vos données</li>
              <li>Vous opposer au traitement de vos données</li>
              <li>Recevoir une copie de vos données</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Cookies</h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Nous utilisons des cookies pour améliorer votre expérience de navigation.
              Ces cookies nous permettent de mémoriser vos préférences et d'analyser
              l'utilisation de notre site. Vous pouvez désactiver les cookies dans
              les paramètres de votre navigateur.
            </p>
          </section>

          {/* Third Parties */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Partage avec des Tiers</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium text-sm md:text-base">
                ❌ Nous ne vendons jamais vos données personnelles à des tiers
              </p>
            </div>
            <p className="text-gray-600 text-sm md:text-base mt-4 leading-relaxed">
              Nous pouvons partager vos informations uniquement avec nos partenaires de confiance
              nécessaires pour traiter vos commandes (transporteurs, processeurs de paiement)
              et uniquement dans la mesure nécessaire pour fournir nos services.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t pt-6 md:pt-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Nous Contacter</h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Si vous avez des questions concernant cette politique de confidentialité
              ou si vous souhaitez exercer vos droits, contactez-nous :
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-800 text-sm md:text-base">
                <strong>Email :</strong> privacy@longrich.sn<br />
                <strong>Téléphone :</strong> +221 77 956 87 21<br />
                <strong>Adresse :</strong> Kénia, Ziguinchor, Sénégal
              </p>
            </div>
          </section>

          {/* Last Update */}
          <section className="text-center pt-6 md:pt-8 border-t">
            <p className="text-gray-500 text-xs md:text-sm">
              Dernière mise à jour : Décembre 2024
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};