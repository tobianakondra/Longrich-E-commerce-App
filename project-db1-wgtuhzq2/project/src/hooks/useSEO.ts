import { useEffect } from 'react';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    keywords?: string;
}

export const useSEO = ({
    title,
    description,
    image,
    url,
    type = 'website',
    keywords,
}: SEOProps) => {
    useEffect(() => {
        const siteName = 'Longrich';
        const finalTitle = title ? `${title} | ${siteName}` : siteName;
        const finalDescription = description || 'Votre boutique en ligne de produits de beauté et bien-être. Soins du visage, corps, santé et cosmétiques de qualité.';
        const finalImage = image || '/logo-social.png'; // Make sure you have a default social image
        const finalUrl = url || window.location.href;

        // Title
        document.title = finalTitle;

        // Meta tags
        const metaTags = {
            'description': finalDescription,
            'keywords': keywords || 'Longrich, beauté, santé, bien-être, cosmétiques, Sénégal, Ziguinchor',
            'og:title': finalTitle,
            'og:description': finalDescription,
            'og:image': finalImage,
            'og:url': finalUrl,
            'og:type': type,
            'twitter:card': 'summary_large_image',
            'twitter:title': finalTitle,
            'twitter:description': finalDescription,
            'twitter:image': finalImage,
        };

        Object.entries(metaTags).forEach(([name, content]) => {
            let tag = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                if (name.startsWith('og:')) {
                    tag.setAttribute('property', name);
                } else {
                    tag.setAttribute('name', name);
                }
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
        });

        // Cleanup or optional: restore default title on unmount
        return () => {
            // Optional: reset to default if needed
        };
    }, [title, description, image, url, type, keywords]);
};
