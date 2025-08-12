import { type FC, useState } from 'react';
import { MapPin, Phone, Mail, Send, Clock } from 'lucide-react';
import { ContactForm } from '../types';

export const Contact: FC = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Contactez-nous
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto px-4">
            Une question ? Un conseil personnalisé ? Notre équipe est là pour vous accompagner
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Contact Information */}
          <div className="space-y-6 md:space-y-8">
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Nos informations</h2>
              
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-lg">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Adresse</h3>
                    <p className="text-gray-600 text-sm md:text-base">123 Avenue de la Beauté<br />Ziguinchor, Sénégal</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-lg">
                    <Phone className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Téléphone</h3>
                    <p className="text-gray-600 text-sm md:text-base">+221 78 956 87 21</p>
                    <p className="text-gray-600 text-sm md:text-base">+221 77 440 40 26</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-lg">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <p className="text-gray-600 text-sm md:text-base">contact@longrich.sn</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-lg">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Horaires</h3>
                    <p className="text-gray-600 text-sm md:text-base">
                      Lun - Ven: 9h00 - 18h00<br />
                      Sam: 9h00 - 17h00<br />
                      Dim: Fermé
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Notre localisation</h3>
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d780.9456891568574!2d-16.282767546673004!3d12.543543127786302!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1s12.5435431%2C-16.2827675%2C179m!5e1!3m2!1sen!2ssn!4v1751309294267!5m2!1sen!2ssn"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
                Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                  placeholder="Votre nom complet"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
                  placeholder="Votre message..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Envoi en cours...' : 'Envoyer le message'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};