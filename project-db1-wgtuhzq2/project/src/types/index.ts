export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string; // URL ou chaîne base64
  category: ProductCategory;
  description: string;
  featured?: boolean;
  discount?: number | null;
  stock: number;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CartItem extends Product {
  quantity: number;
}

export type ProductCategory = 'health' | 'body-care' | 'face-care' | 'beauty' | 'wellness';

export type UserRole = 'customer' | 'admin';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin?: boolean;
  role?: UserRole;
  phone?: string;
  address?: string;
  secretCode?: string;
  failedAttempts?: number;
  lastFailedAttempt?: Date;
  lastLogin?: Date;
}

export interface AccessLog {
  userId: string;
  email: string | null;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  action: 'login_success' | 'login_failed' | 'admin_access' | 'admin_access_failed';
  details?: string;
}

export interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export interface AdminProductForm {
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string; // URL ou chaîne base64
  category: ProductCategory;
  description: string;
  featured: boolean;
  discount?: number | null;
  stock: number;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lr-config': any;
      'lr-file-uploader-regular': any;
      'lr-upload-ctx-provider': any;
    }
  }
}