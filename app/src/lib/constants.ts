/**
 * Application Constants
 * Rainbow Towers Conference & Event Booking System
 */

import { UserRole, BookingStatus } from '@/types';

// Application Info
export const APP_NAME = 'Rainbow Towers Conference & Event Booking System';
export const APP_SHORT_NAME = 'RT Bookings';
export const APP_VERSION = '1.0.0';

// Timezone
export const TIMEZONE = 'Africa/Harare'; // CAT (UTC+2)

// Session Configuration
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Role Labels
export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.RESERVATIONS]: 'Reservations Officer',
  [UserRole.SALES]: 'Sales Officer',
  [UserRole.FINANCE]: 'Finance Officer',
  [UserRole.AUDITOR]: 'Auditor',
};

// Role Permissions
export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    canManageUsers: true,
    canManageRooms: true,
    canManageBookings: true,
    canViewReports: true,
    canViewLogs: true,
    canManageFinance: true,
    canGenerateDocuments: true,
  },
  [UserRole.RESERVATIONS]: {
    canManageUsers: false,
    canManageRooms: false,
    canManageBookings: true,
    canViewReports: true,
    canViewLogs: false,
    canManageFinance: false,
    canGenerateDocuments: true,
  },
  [UserRole.SALES]: {
    canManageUsers: false,
    canManageRooms: false,
    canManageBookings: false,
    canViewReports: true,
    canViewLogs: false,
    canManageFinance: false,
    canGenerateDocuments: true,
  },
  [UserRole.FINANCE]: {
    canManageUsers: false,
    canManageRooms: false,
    canManageBookings: false,
    canViewReports: true,
    canViewLogs: false,
    canManageFinance: true,
    canGenerateDocuments: true,
  },
  [UserRole.AUDITOR]: {
    canManageUsers: false,
    canManageRooms: false,
    canManageBookings: false,
    canViewReports: true,
    canViewLogs: true,
    canManageFinance: false,
    canGenerateDocuments: false,
  },
};

// Booking Status Labels
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.TENTATIVE]: 'Tentative',
  [BookingStatus.CONFIRMED]: 'Confirmed',
  [BookingStatus.CANCELLED]: 'Cancelled',
};

// Booking Status Colors (for UI)
export const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  [BookingStatus.TENTATIVE]: '#FFA500', // Orange
  [BookingStatus.CONFIRMED]: '#4CAF50', // Green
  [BookingStatus.CANCELLED]: '#F44336', // Red
};

// Document ID Prefixes
export const DOCUMENT_PREFIXES = {
  QUOTATION: 'QT',
  INVOICE: 'INV',
  BOOKING: 'BK',
};

// Date Formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';
export const DISPLAY_DATE_FORMAT = 'dd MMM yyyy';
export const DISPLAY_DATETIME_FORMAT = 'dd MMM yyyy, HH:mm';

// Company Information (for documents)
export const COMPANY_INFO = {
  name: 'Rainbow Towers Hotel Group',
  address: 'Rainbow Towers Hotel & Conference Centre',
  city: 'Harare',
  country: 'Zimbabwe',
  phone: '+263 XXX XXXX',
  email: 'reservations@rainbowtowers.co.zw',
  website: 'www.rainbowtowers.co.zw',
};

// Activity Log Actions
export const LOG_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  FAILED_LOGIN: 'failed_login',
  VIEW: 'view',
  EXPORT: 'export',
  GENERATE_DOCUMENT: 'generate_document',
} as const;

// Entity Types (for activity logs)
export const ENTITY_TYPES = {
  BOOKING: 'booking',
  CLIENT: 'client',
  ROOM: 'room',
  USER: 'user',
  ADDON: 'addon',
  DOCUMENT: 'document',
} as const;
