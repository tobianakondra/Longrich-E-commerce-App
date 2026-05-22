import { useEffect } from 'react';

interface SEOEnhancedProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  canonical?: string;
  schema?: object;
  noindex?: boolean;
  nofollow?: boolean;
  language?: string;
}

export const useSEOEnhanced = ({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords,
  canonical,
  schema,
  noindex = false,
  nofollow = false,
  language = 'fr',
}: SEOEnhancedProps) => {
  useEffect(() => {
    const siteName = 'Longrich';
    const finalTitle = title ? `${title} | ${siteName}` : siteName;
    const finalDescription = description || 'Votre boutique en ligne de produits de beauté et bien-être. Soins du visage, corps, santé et cosmétiques de qualité.';
    const finalImage = image || '/logo-social.png';
    const finalUrl = url || window.location.href;
    const finalCanonical = canonical || finalUrl;

    // Title
    document.title = finalTitle;
    document.documentElement.lang = language;

    // Canonical Tag (important pour le SEO)
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
    const canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');
    canonicalTag.setAttribute('href', finalCanonical);
    document.head.appendChild(canonicalTag);

    // Meta robots (noindex, nofollow)
    let robotsContent = 'index, follow';
    if (noindex && nofollow) {
      robotsContent = 'noindex, nofollow';
    } else if (noindex) {
      robotsContent = 'noindex, follow';
    } else if (nofollow) {
      robotsContent = 'index, nofollow';
    }
    
    const existingRobots = document.querySelector('meta[name="robots"]');
    if (existingRobots) {
      existingRobots.remove();
    }
    const robotsMeta = document.createElement('meta');
    robotsMeta.setAttribute('name', 'robots');
    robotsMeta.setAttribute('content', robotsContent);
    document.head.appendChild(robotsMeta);

    // Googlebot specific
    const existingGoogleBot = document.querySelector('meta[name="googlebot"]');
    if (existingGoogleBot) {
      existingGoogleBot.remove();
    }
    const googlebotMeta = document.createElement('meta');
    googlebotMeta.setAttribute('name', 'googlebot');
    googlebotMeta.setAttribute('content', robotsContent);
    document.head.appendChild(googlebotMeta);

    // Basic meta tags
    const metaTags: Record<string, string> = {
      'description': finalDescription,
      'keywords': keywords || 'Longrich, beauté, santé, bien-être, cosmétiques, Sénégal, Ziguinchor',
      'og:title': finalTitle,
      'og:description': finalDescription,
      'og:image': finalImage,
      'og:url': finalUrl,
      'og:type': type,
      'og:site_name': 'Longrich',
      'og:locale': `${language}_SN`,
      'twitter:card': 'summary_large_image',
      'twitter:title': finalTitle,
      'twitter:description': finalDescription,
      'twitter:image': finalImage,
      'twitter:site': '@longrich', // À changer si vous avez un compte Twitter
    };

    Object.entries(metaTags).forEach(([name, content]) => {
      if (!content) return;
      
      let selector: string;
      if (name.startsWith('og:')) {
        selector = `meta[property="${name}"]`;
      } else {
        selector = `meta[name="${name}"]`;
      }
      
      let tag = document.querySelector(selector);
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

    // JSON-LD Schema.org
    if (schema) {
      let existingSchema = document.querySelector('script[type="application/ld+json"]');
      if (existingSchema) {
        existingSchema.remove();
      }
      
      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.textContent = JSON.stringify(schema, null, 2);
      document.head.appendChild(schemaScript);
    }

    // Cleanup on unmount
    return () => {
      // Optionnel : nettoyer les éléments créés
    };
  }, [title, description, image, url, type, keywords, canonical, schema, noindex, nofollow, language]);
};

export default useSEOEnhanced;
