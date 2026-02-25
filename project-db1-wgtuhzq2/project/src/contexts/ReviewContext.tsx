import { createContext, useContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { Review } from '../types';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ReviewContextType {
    reviews: Review[];
    loading: boolean;
    addReview: (review: Omit<Review, 'id' | 'status' | 'createdAt'>) => Promise<string>;
    getReviewsByProduct: (productId: string) => Review[];
    // Admin Methods
    updateReviewStatus: (id: string, status: Review['status']) => Promise<void>;
    deleteReview: (id: string) => Promise<void>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const useReviews = () => {
    const context = useContext(ReviewContext);
    if (context === undefined) {
        throw new Error('useReviews must be used within a ReviewProvider');
    }
    return context;
};

export const ReviewProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // Charger tous les avis (Admin) ou écouter les changements
    useEffect(() => {
        const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Review[];
            setReviews(reviewsData);
            setLoading(false);
        }, (error) => {
            console.error('Erreur lors du chargement des avis:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addReview = async (reviewData: Omit<Review, 'id' | 'status' | 'createdAt'>): Promise<string> => {
        try {
            const newReview = {
                ...reviewData,
                status: 'approved' as const,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'reviews'), newReview);
            return docRef.id;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'avis:', error);
            throw error;
        }
    };

    const updateReviewStatus = async (id: string, status: Review['status']): Promise<void> => {
        try {
            const reviewRef = doc(db, 'reviews', id);
            await updateDoc(reviewRef, { status });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'avis:', error);
            throw error;
        }
    };

    const deleteReview = async (id: string): Promise<void> => {
        try {
            const reviewRef = doc(db, 'reviews', id);
            await deleteDoc(reviewRef);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'avis:', error);
            throw error;
        }
    };

    const getReviewsByProduct = (productId: string) => {
        return reviews.filter(r => r.productId === productId);
    };

    const value = {
        reviews,
        loading,
        addReview,
        getReviewsByProduct,
        updateReviewStatus,
        deleteReview
    };

    return (
        <ReviewContext.Provider value={value}>
            {children}
        </ReviewContext.Provider>
    );
};
