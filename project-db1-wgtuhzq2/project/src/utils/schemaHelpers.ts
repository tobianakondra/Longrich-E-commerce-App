/**
 * Helpers pour générer les données structurées Schema.org en JSON-LD
 * Documentation : https://schema.org/
 */

interface ProductData {
  name: string;
  description: string;
  image: string;
  price: number;
  url: string;
  brand?: string;
  sku?: string;
  category?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  currency?: string;
}

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

interface FAQItem {
  question: string;
  acceptedAnswer: string;
}

/**
 * Génère les données structurées pour un produit (Product)
 */
export const generateProductSchema = (product: ProductData): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Longrich',
    },
    sku: product.sku || product.name,
    category: product.category || 'Produits de beauté et bien-être',
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: product.currency || 'XOF',
      price: product.price.toString(),
      availability: `https://schema.org/${product.availability || 'InStock'}`,
      seller: {
        '@type': 'Organization',
        name: 'Longrich',
      },
    },
  };
};

/**
 * Génère les données structurées pour l'organisation (Organization)
 */
export const generateOrganizationSchema = (org: OrganizationData): object => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
    logo: org.logo,
    description: org.description,
  };

  if (org.telephone) schema.telephone = org.telephone;
  if (org.email) schema.email = org.email;
  if (org.sameAs) schema.sameAs = org.sameAs;

  if (org.address) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: org.address.streetAddress,
      addressLocality: org.address.addressLocality,
      addressRegion: org.address.addressRegion,
      addressCountry: org.address.addressCountry,
    };
  }

  return schema;
};

/**
 * Génère les données structurées pour un site Web (WebSite)
 * Permet d'activer la recherche par site dans les résultats Google
 */
export const generateWebSiteSchema = (url: string, searchUrl: string): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrl,
      },
      'query-input': 'required name=search_term_string',
    },
  };
};

/**
 * Génère les données structurées pour une page locale (LocalBusiness)
 */
export const generateLocalBusinessSchema = (data: {
  name: string;
  url: string;
  telephone: string;
  email: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  image?: string;
  priceRange?: string;
  openingHours?: string[];
  geo?: {
    latitude: number;
    longitude: number;
  };
}): object => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: data.name,
    url: data.url,
    telephone: data.telephone,
    email: data.email,
    address: {
      '@type': 'PostalAddress',
      ...data.address,
    },
    priceRange: data.priceRange || '$$',
  };

  if (data.image) schema.image = data.image;
  if (data.openingHours) schema.openingHours = data.openingHours;
  if (data.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.geo.latitude,
      longitude: data.geo.longitude,
    };
  }

  return schema;
};

/**
 * Génère les données structurées pour une FAQ
 */
export const generateFAQSchema = (items: FAQItem[]): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.acceptedAnswer,
      },
    })),
  };
};

/**
 * Génère les données structurées pour une page de contact (ContactPage)
 */
export const generateContactPageSchema = (): object => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contactez Longrich',
    description: 'Contactez notre équipe pour toute question ou conseil personnalisé',
    url: 'https://longrich.online/contact',
  };
};

/**
 * Convertit un objet Schema.org en balise JSON-LD pour l'insertion dans le HTML
 */
export const schemaToJSONLD = (schema: object): string => {
  return JSON.stringify(schema, null, 2);
};

export { ProductData, OrganizationData, FAQItem };
