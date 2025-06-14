import { AdminUser, BusinessStats, AdminBusiness, AdminReview, SystemSettings, AnalyticsData } from '../types/admin';
import { mockBusinesses } from './mockData';

export const mockAdminUser: AdminUser = {
  id: '1',
  name: 'Marco Rossi',
  email: 'admin@businesshub.com',
  role: 'super_admin',
  avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
  lastLogin: '2024-01-15 14:30:00',
  permissions: ['manage_businesses', 'manage_users', 'manage_reviews', 'system_settings', 'analytics']
};

export const mockBusinessStats: BusinessStats = {
  totalBusinesses: 0,
  activeBusinesses: 0,
  pendingApproval: 0,
  totalReviews: 0,
  averageRating: 0,
  monthlyGrowth: 0
};

const mockAdminBusinesses: AdminBusiness[] = [];

const mockAdminReviews: AdminReview[] = [];

const mockSystemSettings: SystemSettings = {
  siteName: 'Business Hub',
  siteDescription: 'La piattaforma completa per scoprire le migliori attività locali',
  maintenanceMode: false,
  allowRegistrations: true,
  requireApproval: true,
  emailNotifications: true,
  smsNotifications: false,
  analyticsEnabled: true,
  maxBusinessesPerUser: 5,
  reviewModerationEnabled: true
};

export const mockAnalyticsData: AnalyticsData = {
  visitors: {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    growth: 0
  },
  searches: {
    total: 0,
    topKeywords: [],
    conversionRate: 0
  },
  businesses: {
    views: 0,
    contacts: 0,
    bookings: 0
  }
};