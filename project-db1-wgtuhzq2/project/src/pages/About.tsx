import { type FC } from 'react';
import { Heart, Award, Users, Sparkles } from 'lucide-react';

export const About: FC = () => {
  const values = [
    {
      icon: Heart,
      title: 'Passion',
      description: 'Nous sommes passionnés par la beauté sous toutes ses formes et nous nous engageons à vous offrir les meilleurs produits.'
    },
    {
      icon: Award,
      title: 'Qualité',
      description: 'Chaque produit est soigneusement sélectionné pour sa qualité exceptionnelle et ses bienfaits pour votre peau.'
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Nous créons une communauté bienveillante où chacun peut exprimer sa beauté unique et authentique.'
    },
    {
      icon: Sparkles,
      title: 'Innovation',
      description: 'Nous restons à l\'avant-garde des tendances beauté pour vous proposer les dernières innovations.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            À propos de Longrich
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto px-4">
            Votre destination beauté et bien-être, dédiée à révéler votre éclat naturel
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-12 md:mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Notre Mission</h2>
                <p className="text-gray-600 text-base md:text-lg mb-6 leading-relaxed">
                  Beaucoup pensent que le MLM c'est vendre des produits à tout le monde. Mais avec Longrich, c'est différent.
                  Ce n'est pas la vente qui fait qui fait la force du businss. C'est la consommation intelligente et la recommandation
                  naturelle.
                  Tu utilises les produits, tu en parles à ton entourage... ils testent, ils aiment, ils recommandent à leur tour.
                  
                  C'est simple et c'est duplicable.
                  Et c'est ça qui va crée un reseau solide et des revenus durables.
                  Pas besoin d'être un vendeur, juste quelqu'un qui partage ce qu'il utilise vraiment.
                  Longrich, ce n'est pas une affaire de vente, c'est une affaire de vision.
                </p>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                  Nous nous engageons à rendre la beauté accessible à tous, en proposant des produits 
                  adaptés à tous les types de peau et à tous les budgets, tout en respectant 
                  l'environnement et les valeurs éthiques.
                </p>
              </div>
              <div className="relative">
                <img
                  src="https://images.pexels.com/photos/3785804/pexels-photo-3785804.jpeg?auto=compress&cs=tinysrgb&w=600"
                  alt="Produits de beauté"
                  className="rounded-xl shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-12 md:mb-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
              Nos Valeurs
            </h2>
            <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4">
              Les principes qui guident notre approche et notre engagement envers vous
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 md:p-8 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <value.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">{value.title}</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section className="mb-12 md:mb-16">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white p-8 md:p-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Notre Histoire</h2>
              <p className="text-pink-100 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
                Fondée en 2025, Longrich est née de la passion de créer un espace où la beauté 
                rime avec santé et bien-être. Notre équipe de passionnés parcourt le monde 
                pour dénicher les meilleurs produits et vous les proposer à des prix justes.
              </p>
              <p className="text-pink-100 text-base md:text-lg leading-relaxed">
                Aujourd'hui, nous sommes fiers d'accompagner des milliers de clients dans leur 
                routine beauté quotidienne, en proposant des conseils personnalisés et des produits 
                qui respectent votre peau et l'environnement.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section>
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
              Notre Engagement
            </h2>
            <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto px-4">
              Nous nous engageons à vous offrir une expérience d'achat exceptionnelle, 
              des produits de qualité et un service client à votre écoute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8 text-center">
              <div className="text-3xl md:text-4xl mb-4">🌿</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Produits Naturels</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Nous privilégions les produits naturels et biologiques pour respecter votre peau et la planète.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 md:p-8 text-center">
              <div className="text-3xl md:text-4xl mb-4">🚚</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Livraison Rapide</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Livraison rapide pour que vous puissiez profiter de vos produits sans attendre.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 md:p-8 text-center">
              <div className="text-3xl md:text-4xl mb-4">💬</div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Conseils Experts</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Notre équipe est là pour vous conseiller et vous accompagner.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};