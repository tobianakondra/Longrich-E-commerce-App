import { useState, type FC } from 'react';
import {
    MessageCircle,
    Trash2,
    Star,
    Search,
    AlertCircle,
    ExternalLink,
    CheckCircle2
} from 'lucide-react';
import { useReviews } from '../../contexts/ReviewContext';
import { useNavigate } from 'react-router-dom';

export const ReviewManagement: FC = () => {
    const { reviews, deleteReview } = useReviews();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredReviews = reviews.filter(review => {
        const matchesSearch =
            review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            review.comment.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <MessageCircle className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Gestion des Avis</h2>
                            <p className="text-sm text-gray-500">Tous les avis sont publics par défaut</p>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un avis..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none w-full sm:w-80 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Reviews Grid */}
            {filteredReviews.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Aucun avis trouvé.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredReviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:border-purple-200 transition-all group">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                                            {review.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-bold text-gray-900">{review.userName}</h4>
                                                <span className="flex items-center text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100 font-black">
                                                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                                                    PUBLIC
                                                </span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5">
                                                <span className="text-gray-400 text-xs">
                                                    {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <button
                                                    onClick={() => navigate(`/product/detail/${review.productId}`)}
                                                    className="flex items-center text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                                                >
                                                    <ExternalLink className="w-3 h-3 mr-1" />
                                                    {review.productName}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="flex space-x-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Voulez-vous vraiment supprimer cet avis ?')) {
                                                    deleteReview(review.id);
                                                }
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Supprimer l'avis"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 group-hover:bg-white transition-colors">
                                    <p className="text-gray-700 leading-relaxed italic text-lg">"{review.comment}"</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
