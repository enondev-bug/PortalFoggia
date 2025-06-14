export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  avatar?: string;
  lastLogin: string;
  permissions: string[];
}

export interface BusinessStats {
  totalBusinesses: number;
  activeBusinesses: number;
  pendingApproval: number;
  totalReviews: number;
  averageRating: number;
  monthlyGrowth: number;
}

export interface AdminBusiness extends Business {
  status: 'active' | 'pending' | 'suspended' | 'rejected';
  createdAt: string;
  updatedAt: string;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  verificationStatus: 'verified' | 'pending' | 'rejected';
  subscriptionPlan: 'free' | 'basic' | 'premium' | 'enterprise';
}

export interface AdminReview {
  id: number;
  businessId: number;
  businessName: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  status: 'approved' | 'pending' | 'flagged' | 'rejected';
  reports: number;
}

export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  requireApproval: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  analyticsEnabled: boolean;
  maxBusinessesPerUser: number;
  reviewModerationEnabled: boolean;
}

export interface AnalyticsData {
  visitors: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
  searches: {
    total: number;
    topKeywords: string[];
    conversionRate: number;
  };
  businesses: {
    views: number;
    contacts: number;
    bookings: number;
  };
}

import { Business } from '../data/mockData';