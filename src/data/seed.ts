/**
 * ─── FOMS Seed Data ───────────────────────────────────────────────
 * Single source of truth for all static/mock data in the application.
 * NO data should be hardcoded directly in components or contexts.
 * Import the constants you need from this file instead.
 * ─────────────────────────────────────────────────────────────────
 */

import type { User, UserRole } from '../types/auth';

// ─── Seeded User Accounts ─────────────────────────────────────────

export interface SeededUser extends User {
  password: string;
}

export const SEEDED_USERS: SeededUser[] = [
  {
    employeeId: 'EMP-001',
    password: 'Password@123',
    fullName: 'Maria Santos',
    role: 'Finance Manager' as UserRole,
    avatarInitials: 'MS',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    loginHistory: [
      new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    ],
  },
  {
    employeeId: 'EMP-002',
    password: 'Password@123',
    fullName: 'Juan Dela Cruz',
    role: 'Head Accountant' as UserRole,
    avatarInitials: 'JD',
    lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    loginHistory: [
      new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    ],
  },
  {
    employeeId: 'EMP-003',
    password: 'Password@123',
    fullName: 'Anna Reyes',
    role: 'Accountant' as UserRole,
    avatarInitials: 'AR',
    lastLogin: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    loginHistory: [
      new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    ],
  },
  {
    employeeId: 'EMP-004',
    password: 'Password@123',
    fullName: 'Carlos Mendoza',
    role: 'Assistant of Finance Manager' as UserRole,
    avatarInitials: 'CM',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    loginHistory: [
      new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    ],
  },
  {
    employeeId: 'EMP-005',
    password: 'Password@123',
    fullName: 'Liza Bautista',
    role: 'Coordinator' as UserRole,
    avatarInitials: 'LB',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    loginHistory: [
      new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 192).toISOString(),
      new Date(Date.now() - 1000 * 60 * 60 * 216).toISOString(),
    ],
  },
];

// ─── Login Feature Highlights ────────────────────────────────────

export interface FeatureHighlight {
  step: number;
  title: string;
  description: string;
}

export const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  { step: 1, title: 'Enter Credentials', description: 'Use your assigned Employee ID and password to access FOMS.' },
  { step: 2, title: 'Manage Receivables', description: 'Create invoices, record payments, and monitor outstanding balances in real-time.' },
  { step: 3, title: 'Track Collections', description: 'View aging reports and analytics to streamline collection workflows.' },
];

// ─── Session Config ───────────────────────────────────────────────

export const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT_MS: 30 * 60 * 1000,
  STORAGE_KEY: 'foms_session',
};

// ─── Role Display Labels ──────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  'Finance Manager': 'Finance Manager',
  'Head Accountant': 'Head Accountant',
  'Accountant': 'Accountant',
  'Assistant of Finance Manager': 'Asst. Finance Manager',
  'Coordinator': 'Coordinator',
};

// ─── Clients ──────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  region: 'Luzon' | 'Visayas' | 'Mindanao' | 'Metro Manila';
  billingSchedule: 'Monthly' | 'Semi-monthly' | 'Weekly';
  status: 'Active' | 'Inactive';
  vatStatus: 'VATable' | 'Non-VATable';
  vatRate: number | null;
  createdAt: string;
}

export const SEEDED_CLIENTS: Client[] = [
  { id: 'TEST-001', name: 'Test Client (Alpha Sub)', contactPerson: 'Test User', email: 'test@client.com', phone: '0900-000-0000', address: 'Test City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-10T08:00:00Z' },
  { id: 'CAP-001', name: 'Capstone Demo Client', contactPerson: 'Demo User', email: 'demo@capstone.ph', phone: '0912-345-6789', address: 'PUP Manila', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-10T08:00:00Z' },
  { id: 'ALP-001', name: 'Alpha Logistics Tech', contactPerson: 'John Doe', email: 'billing@alphalog.com', phone: '0917-123-4567', address: 'BGC, Taguig City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-01-15T08:00:00Z' },
  { id: 'BET-001', name: 'Beta Retail Distribution', contactPerson: 'Jane Smith', email: 'acct@betaretail.ph', phone: '0918-987-6543', address: 'Clark, Pampanga', region: 'Luzon', billingSchedule: 'Semi-monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-02-20T10:30:00Z' },
  { id: 'GAM-001', name: 'Gamma Manufacturing', contactPerson: 'Peter Jones', email: 'finance@gammamfg.com', phone: '0922-555-8888', address: 'Cebu City', region: 'Visayas', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'Non-VATable', vatRate: null, createdAt: '2026-03-05T14:15:00Z' },
  { id: 'DEL-001', name: 'Delta Supply Chain Co.', contactPerson: 'Rosa Cruz', email: 'rosa@deltasupply.ph', phone: '0933-444-2211', address: 'Davao City', region: 'Mindanao', billingSchedule: 'Weekly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-03-18T09:00:00Z' },
  { id: 'EPS-001', name: 'Epsilon Trading Corp.', contactPerson: 'Marco Villanueva', email: 'billing@epsilon.ph', phone: '0945-777-3399', address: 'Quezon City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Inactive', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-04-01T11:00:00Z' },
  { id: 'ZET-001', name: 'Zeta Freight Solutions', contactPerson: 'Ana Gomez', email: 'ana@zetafreight.com', phone: '0966-111-5544', address: 'Iloilo City', region: 'Visayas', billingSchedule: 'Semi-monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-04-10T13:30:00Z' },
  { id: 'OME-001', name: 'Omega Hardware Group', contactPerson: 'Louie Tan', email: 'billing@omegahardware.com', phone: '0919-222-3333', address: 'Makati City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-05-12T09:00:00Z' },
  { id: 'SIG-001', name: 'Sigma Pharmaceuticals', contactPerson: 'Dr. Clara Reyes', email: 'finance@sigmapharma.ph', phone: '0917-888-9999', address: 'Muntinlupa City', region: 'Metro Manila', billingSchedule: 'Weekly', status: 'Inactive', vatStatus: 'Non-VATable', vatRate: null, createdAt: '2026-05-20T10:00:00Z' },
  { id: 'THE-001', name: 'Theta E-Commerce Fulfillment', contactPerson: 'Ken Chua', email: 'accounts@thetafulfillment.com', phone: '0920-444-5555', address: 'Calamba, Laguna', region: 'Luzon', billingSchedule: 'Semi-monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-06-05T14:00:00Z' },
  { id: 'IOT-001', name: 'Iota Food Distributors', contactPerson: 'Sarah Lim', email: 'payables@iotafoods.ph', phone: '0932-111-2222', address: 'Bacolod City', region: 'Visayas', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'Non-VATable', vatRate: null, createdAt: '2026-06-25T11:30:00Z' },
  { id: 'MOC-011', name: 'Nova Logistics', contactPerson: 'Mark Lee', email: 'billing@novalogistics.ph', phone: '0917-111-2222', address: 'Pasig City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-012', name: 'Apex Freights', contactPerson: 'Sarah Cruz', email: 'finance@apexfreights.com', phone: '0918-333-4444', address: 'Mandaluyong City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Inactive', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-013', name: 'Summit Traders', contactPerson: 'Paul Santos', email: 'acctg@summittraders.ph', phone: '0919-555-6666', address: 'San Juan City', region: 'Metro Manila', billingSchedule: 'Weekly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-014', name: 'Prime Manufacturing', contactPerson: 'Liza Gomez', email: 'payables@primemfg.com', phone: '0920-777-8888', address: 'Valenzuela City', region: 'Metro Manila', billingSchedule: 'Semi-monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-015', name: 'Global Foods Corp.', contactPerson: 'Ben Reyes', email: 'billing@globalfoods.ph', phone: '0921-999-0000', address: 'Paranaque City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Inactive', vatStatus: 'Non-VATable', vatRate: null, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-016', name: 'Stellar Distributions', contactPerson: 'Tina Castro', email: 'finance@stellardist.com', phone: '0922-111-3333', address: 'Las Pinas City', region: 'Metro Manila', billingSchedule: 'Semi-monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-017', name: 'Horizon Supply Co.', contactPerson: 'David Lim', email: 'accounts@horizonsupply.ph', phone: '0923-222-4444', address: 'Muntinlupa City', region: 'Metro Manila', billingSchedule: 'Weekly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-018', name: 'Vanguard Retail', contactPerson: 'Nina Tan', email: 'billing@vanguardretail.com', phone: '0924-333-5555', address: 'Makati City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Inactive', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-019', name: 'Nexus Technologies', contactPerson: 'John Chua', email: 'finance@nexustech.ph', phone: '0925-444-6666', address: 'BGC, Taguig City', region: 'Metro Manila', billingSchedule: 'Semi-monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-020', name: 'Pioneer Hardware', contactPerson: 'Mary Sy', email: 'payables@pioneerhardware.com', phone: '0926-555-7777', address: 'Quezon City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'Non-VATable', vatRate: null, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-021', name: 'Zenith Logistics', contactPerson: 'Alex Villar', email: 'billing@zenithlogistics.ph', phone: '0927-666-8888', address: 'Pasay City', region: 'Metro Manila', billingSchedule: 'Weekly', status: 'Inactive', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-022', name: 'Atlas Enterprises', contactPerson: 'Chris Ong', email: 'finance@atlasenterprises.com', phone: '0928-777-9999', address: 'Manila City', region: 'Metro Manila', billingSchedule: 'Semi-monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-023', name: 'Titan Industrial', contactPerson: 'Joy Lopez', email: 'accounts@titanindustrial.ph', phone: '0929-888-0000', address: 'Caloocan City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-024', name: 'Frontier E-commerce', contactPerson: 'Dan Flores', email: 'billing@frontierecom.com', phone: '0930-999-1111', address: 'Marikina City', region: 'Metro Manila', billingSchedule: 'Weekly', status: 'Inactive', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-025', name: 'Crest Pharmacies', contactPerson: 'Lucy Perez', email: 'finance@crestpharmacies.ph', phone: '0931-111-2222', address: 'Antipolo City', region: 'Metro Manila', billingSchedule: 'Semi-monthly', status: 'Active', vatStatus: 'Non-VATable', vatRate: null, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-026', name: 'Luminous Decor', contactPerson: 'Rico Cruz', email: 'payables@luminousdecor.com', phone: '0932-222-3333', address: 'Pasig City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-027', name: 'Oasis Beverages', contactPerson: 'Grace Lim', email: 'billing@oasisbeverages.ph', phone: '0933-333-4444', address: 'San Juan City', region: 'Metro Manila', billingSchedule: 'Weekly', status: 'Inactive', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-028', name: 'Radiant Electronics', contactPerson: 'Roy Santos', email: 'finance@radiantelectronics.com', phone: '0934-444-5555', address: 'Mandaluyong City', region: 'Metro Manila', billingSchedule: 'Semi-monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-029', name: 'Quantum Motors', contactPerson: 'Eva Ramos', email: 'accounts@quantummotors.ph', phone: '0935-555-6666', address: 'Makati City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-030', name: 'Silverline Textiles', contactPerson: 'Noel Go', email: 'billing@silverlinetextiles.com', phone: '0936-666-7777', address: 'Quezon City', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Inactive', vatStatus: 'Non-VATable', vatRate: null, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-011', name: 'Mock Client 11', contactPerson: 'Contact 11', email: 'mock11@example.com', phone: '0900-000-0011', address: 'Address 11', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-012', name: 'Mock Client 12', contactPerson: 'Contact 12', email: 'mock12@example.com', phone: '0900-000-0012', address: 'Address 12', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-013', name: 'Mock Client 13', contactPerson: 'Contact 13', email: 'mock13@example.com', phone: '0900-000-0013', address: 'Address 13', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-014', name: 'Mock Client 14', contactPerson: 'Contact 14', email: 'mock14@example.com', phone: '0900-000-0014', address: 'Address 14', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-015', name: 'Mock Client 15', contactPerson: 'Contact 15', email: 'mock15@example.com', phone: '0900-000-0015', address: 'Address 15', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-016', name: 'Mock Client 16', contactPerson: 'Contact 16', email: 'mock16@example.com', phone: '0900-000-0016', address: 'Address 16', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-017', name: 'Mock Client 17', contactPerson: 'Contact 17', email: 'mock17@example.com', phone: '0900-000-0017', address: 'Address 17', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-018', name: 'Mock Client 18', contactPerson: 'Contact 18', email: 'mock18@example.com', phone: '0900-000-0018', address: 'Address 18', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-019', name: 'Mock Client 19', contactPerson: 'Contact 19', email: 'mock19@example.com', phone: '0900-000-0019', address: 'Address 19', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-020', name: 'Mock Client 20', contactPerson: 'Contact 20', email: 'mock20@example.com', phone: '0900-000-0020', address: 'Address 20', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-021', name: 'Mock Client 21', contactPerson: 'Contact 21', email: 'mock21@example.com', phone: '0900-000-0021', address: 'Address 21', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-022', name: 'Mock Client 22', contactPerson: 'Contact 22', email: 'mock22@example.com', phone: '0900-000-0022', address: 'Address 22', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-023', name: 'Mock Client 23', contactPerson: 'Contact 23', email: 'mock23@example.com', phone: '0900-000-0023', address: 'Address 23', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-024', name: 'Mock Client 24', contactPerson: 'Contact 24', email: 'mock24@example.com', phone: '0900-000-0024', address: 'Address 24', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-025', name: 'Mock Client 25', contactPerson: 'Contact 25', email: 'mock25@example.com', phone: '0900-000-0025', address: 'Address 25', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-026', name: 'Mock Client 26', contactPerson: 'Contact 26', email: 'mock26@example.com', phone: '0900-000-0026', address: 'Address 26', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-027', name: 'Mock Client 27', contactPerson: 'Contact 27', email: 'mock27@example.com', phone: '0900-000-0027', address: 'Address 27', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-028', name: 'Mock Client 28', contactPerson: 'Contact 28', email: 'mock28@example.com', phone: '0900-000-0028', address: 'Address 28', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-029', name: 'Mock Client 29', contactPerson: 'Contact 29', email: 'mock29@example.com', phone: '0900-000-0029', address: 'Address 29', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-030', name: 'Mock Client 30', contactPerson: 'Contact 30', email: 'mock30@example.com', phone: '0900-000-0030', address: 'Address 30', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-031', name: 'Mock Client 31', contactPerson: 'Contact 31', email: 'mock31@example.com', phone: '0900-000-0031', address: 'Address 31', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-032', name: 'Mock Client 32', contactPerson: 'Contact 32', email: 'mock32@example.com', phone: '0900-000-0032', address: 'Address 32', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-033', name: 'Mock Client 33', contactPerson: 'Contact 33', email: 'mock33@example.com', phone: '0900-000-0033', address: 'Address 33', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-034', name: 'Mock Client 34', contactPerson: 'Contact 34', email: 'mock34@example.com', phone: '0900-000-0034', address: 'Address 34', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-035', name: 'Mock Client 35', contactPerson: 'Contact 35', email: 'mock35@example.com', phone: '0900-000-0035', address: 'Address 35', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-036', name: 'Mock Client 36', contactPerson: 'Contact 36', email: 'mock36@example.com', phone: '0900-000-0036', address: 'Address 36', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-037', name: 'Mock Client 37', contactPerson: 'Contact 37', email: 'mock37@example.com', phone: '0900-000-0037', address: 'Address 37', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-038', name: 'Mock Client 38', contactPerson: 'Contact 38', email: 'mock38@example.com', phone: '0900-000-0038', address: 'Address 38', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-039', name: 'Mock Client 39', contactPerson: 'Contact 39', email: 'mock39@example.com', phone: '0900-000-0039', address: 'Address 39', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-040', name: 'Mock Client 40', contactPerson: 'Contact 40', email: 'mock40@example.com', phone: '0900-000-0040', address: 'Address 40', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-041', name: 'Mock Client 41', contactPerson: 'Contact 41', email: 'mock41@example.com', phone: '0900-000-0041', address: 'Address 41', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-042', name: 'Mock Client 42', contactPerson: 'Contact 42', email: 'mock42@example.com', phone: '0900-000-0042', address: 'Address 42', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-043', name: 'Mock Client 43', contactPerson: 'Contact 43', email: 'mock43@example.com', phone: '0900-000-0043', address: 'Address 43', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-044', name: 'Mock Client 44', contactPerson: 'Contact 44', email: 'mock44@example.com', phone: '0900-000-0044', address: 'Address 44', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-045', name: 'Mock Client 45', contactPerson: 'Contact 45', email: 'mock45@example.com', phone: '0900-000-0045', address: 'Address 45', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-046', name: 'Mock Client 46', contactPerson: 'Contact 46', email: 'mock46@example.com', phone: '0900-000-0046', address: 'Address 46', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-047', name: 'Mock Client 47', contactPerson: 'Contact 47', email: 'mock47@example.com', phone: '0900-000-0047', address: 'Address 47', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-048', name: 'Mock Client 48', contactPerson: 'Contact 48', email: 'mock48@example.com', phone: '0900-000-0048', address: 'Address 48', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-049', name: 'Mock Client 49', contactPerson: 'Contact 49', email: 'mock49@example.com', phone: '0900-000-0049', address: 'Address 49', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-050', name: 'Mock Client 50', contactPerson: 'Contact 50', email: 'mock50@example.com', phone: '0900-000-0050', address: 'Address 50', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-051', name: 'Mock Client 51', contactPerson: 'Contact 51', email: 'mock51@example.com', phone: '0900-000-0051', address: 'Address 51', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-052', name: 'Mock Client 52', contactPerson: 'Contact 52', email: 'mock52@example.com', phone: '0900-000-0052', address: 'Address 52', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-053', name: 'Mock Client 53', contactPerson: 'Contact 53', email: 'mock53@example.com', phone: '0900-000-0053', address: 'Address 53', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-054', name: 'Mock Client 54', contactPerson: 'Contact 54', email: 'mock54@example.com', phone: '0900-000-0054', address: 'Address 54', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-055', name: 'Mock Client 55', contactPerson: 'Contact 55', email: 'mock55@example.com', phone: '0900-000-0055', address: 'Address 55', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-056', name: 'Mock Client 56', contactPerson: 'Contact 56', email: 'mock56@example.com', phone: '0900-000-0056', address: 'Address 56', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-057', name: 'Mock Client 57', contactPerson: 'Contact 57', email: 'mock57@example.com', phone: '0900-000-0057', address: 'Address 57', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-058', name: 'Mock Client 58', contactPerson: 'Contact 58', email: 'mock58@example.com', phone: '0900-000-0058', address: 'Address 58', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-059', name: 'Mock Client 59', contactPerson: 'Contact 59', email: 'mock59@example.com', phone: '0900-000-0059', address: 'Address 59', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-060', name: 'Mock Client 60', contactPerson: 'Contact 60', email: 'mock60@example.com', phone: '0900-000-0060', address: 'Address 60', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-061', name: 'Mock Client 61', contactPerson: 'Contact 61', email: 'mock61@example.com', phone: '0900-000-0061', address: 'Address 61', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-062', name: 'Mock Client 62', contactPerson: 'Contact 62', email: 'mock62@example.com', phone: '0900-000-0062', address: 'Address 62', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-063', name: 'Mock Client 63', contactPerson: 'Contact 63', email: 'mock63@example.com', phone: '0900-000-0063', address: 'Address 63', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-064', name: 'Mock Client 64', contactPerson: 'Contact 64', email: 'mock64@example.com', phone: '0900-000-0064', address: 'Address 64', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-065', name: 'Mock Client 65', contactPerson: 'Contact 65', email: 'mock65@example.com', phone: '0900-000-0065', address: 'Address 65', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-066', name: 'Mock Client 66', contactPerson: 'Contact 66', email: 'mock66@example.com', phone: '0900-000-0066', address: 'Address 66', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-067', name: 'Mock Client 67', contactPerson: 'Contact 67', email: 'mock67@example.com', phone: '0900-000-0067', address: 'Address 67', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-068', name: 'Mock Client 68', contactPerson: 'Contact 68', email: 'mock68@example.com', phone: '0900-000-0068', address: 'Address 68', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-069', name: 'Mock Client 69', contactPerson: 'Contact 69', email: 'mock69@example.com', phone: '0900-000-0069', address: 'Address 69', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-070', name: 'Mock Client 70', contactPerson: 'Contact 70', email: 'mock70@example.com', phone: '0900-000-0070', address: 'Address 70', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-071', name: 'Mock Client 71', contactPerson: 'Contact 71', email: 'mock71@example.com', phone: '0900-000-0071', address: 'Address 71', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-072', name: 'Mock Client 72', contactPerson: 'Contact 72', email: 'mock72@example.com', phone: '0900-000-0072', address: 'Address 72', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-073', name: 'Mock Client 73', contactPerson: 'Contact 73', email: 'mock73@example.com', phone: '0900-000-0073', address: 'Address 73', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-074', name: 'Mock Client 74', contactPerson: 'Contact 74', email: 'mock74@example.com', phone: '0900-000-0074', address: 'Address 74', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-075', name: 'Mock Client 75', contactPerson: 'Contact 75', email: 'mock75@example.com', phone: '0900-000-0075', address: 'Address 75', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-076', name: 'Mock Client 76', contactPerson: 'Contact 76', email: 'mock76@example.com', phone: '0900-000-0076', address: 'Address 76', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-077', name: 'Mock Client 77', contactPerson: 'Contact 77', email: 'mock77@example.com', phone: '0900-000-0077', address: 'Address 77', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-078', name: 'Mock Client 78', contactPerson: 'Contact 78', email: 'mock78@example.com', phone: '0900-000-0078', address: 'Address 78', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-079', name: 'Mock Client 79', contactPerson: 'Contact 79', email: 'mock79@example.com', phone: '0900-000-0079', address: 'Address 79', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-080', name: 'Mock Client 80', contactPerson: 'Contact 80', email: 'mock80@example.com', phone: '0900-000-0080', address: 'Address 80', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-081', name: 'Mock Client 81', contactPerson: 'Contact 81', email: 'mock81@example.com', phone: '0900-000-0081', address: 'Address 81', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-082', name: 'Mock Client 82', contactPerson: 'Contact 82', email: 'mock82@example.com', phone: '0900-000-0082', address: 'Address 82', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-083', name: 'Mock Client 83', contactPerson: 'Contact 83', email: 'mock83@example.com', phone: '0900-000-0083', address: 'Address 83', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-084', name: 'Mock Client 84', contactPerson: 'Contact 84', email: 'mock84@example.com', phone: '0900-000-0084', address: 'Address 84', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-085', name: 'Mock Client 85', contactPerson: 'Contact 85', email: 'mock85@example.com', phone: '0900-000-0085', address: 'Address 85', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-086', name: 'Mock Client 86', contactPerson: 'Contact 86', email: 'mock86@example.com', phone: '0900-000-0086', address: 'Address 86', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-087', name: 'Mock Client 87', contactPerson: 'Contact 87', email: 'mock87@example.com', phone: '0900-000-0087', address: 'Address 87', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-088', name: 'Mock Client 88', contactPerson: 'Contact 88', email: 'mock88@example.com', phone: '0900-000-0088', address: 'Address 88', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-089', name: 'Mock Client 89', contactPerson: 'Contact 89', email: 'mock89@example.com', phone: '0900-000-0089', address: 'Address 89', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-090', name: 'Mock Client 90', contactPerson: 'Contact 90', email: 'mock90@example.com', phone: '0900-000-0090', address: 'Address 90', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-091', name: 'Mock Client 91', contactPerson: 'Contact 91', email: 'mock91@example.com', phone: '0900-000-0091', address: 'Address 91', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-092', name: 'Mock Client 92', contactPerson: 'Contact 92', email: 'mock92@example.com', phone: '0900-000-0092', address: 'Address 92', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-093', name: 'Mock Client 93', contactPerson: 'Contact 93', email: 'mock93@example.com', phone: '0900-000-0093', address: 'Address 93', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-094', name: 'Mock Client 94', contactPerson: 'Contact 94', email: 'mock94@example.com', phone: '0900-000-0094', address: 'Address 94', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-095', name: 'Mock Client 95', contactPerson: 'Contact 95', email: 'mock95@example.com', phone: '0900-000-0095', address: 'Address 95', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-096', name: 'Mock Client 96', contactPerson: 'Contact 96', email: 'mock96@example.com', phone: '0900-000-0096', address: 'Address 96', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-097', name: 'Mock Client 97', contactPerson: 'Contact 97', email: 'mock97@example.com', phone: '0900-000-0097', address: 'Address 97', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-098', name: 'Mock Client 98', contactPerson: 'Contact 98', email: 'mock98@example.com', phone: '0900-000-0098', address: 'Address 98', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-099', name: 'Mock Client 99', contactPerson: 'Contact 99', email: 'mock99@example.com', phone: '0900-000-0099', address: 'Address 99', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
  { id: 'MOC-100', name: 'Mock Client 100', contactPerson: 'Contact 100', email: 'mock100@example.com', phone: '0900-000-0100', address: 'Address 100', region: 'Metro Manila', billingSchedule: 'Monthly', status: 'Active', vatStatus: 'VATable', vatRate: 0.12, createdAt: '2026-07-01T00:00:00Z' },
];

// ─── Billing Rates ────────────────────────────────────────────────

export interface BillingRate {
  id: string;
  clientId: string;
  region: string;
  baseRate: number;
  vatRate: number;
  surchargeRate: number;
  effectiveDate: string;
}

export const SEEDED_RATES: BillingRate[] = [
  { id: 'R-001', clientId: 'ALP-001', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-01-01T00:00:00Z' },
  { id: 'R-002', clientId: 'BET-001', region: 'Luzon', baseRate: 200.00, vatRate: 0.12, surchargeRate: 0.08, effectiveDate: '2026-01-01T00:00:00Z' },
  { id: 'R-003', clientId: 'GAM-001', region: 'Visayas', baseRate: 250.00, vatRate: 0.12, surchargeRate: 0.10, effectiveDate: '2026-02-01T00:00:00Z' },
  { id: 'R-004', clientId: 'DEL-001', region: 'Mindanao', baseRate: 280.00, vatRate: 0.12, surchargeRate: 0.12, effectiveDate: '2026-03-01T00:00:00Z' },
  { id: 'R-005', clientId: 'EPS-001', region: 'Metro Manila', baseRate: 160.00, vatRate: 0.12, surchargeRate: 0.06, effectiveDate: '2026-04-01T00:00:00Z' },
  { id: 'R-006', clientId: 'ZET-001', region: 'Visayas', baseRate: 240.00, vatRate: 0.12, surchargeRate: 0.09, effectiveDate: '2026-04-01T00:00:00Z' },
  { id: 'R-007', clientId: 'OME-001', region: 'Metro Manila', baseRate: 155.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-05-01T00:00:00Z' },
  { id: 'R-008', clientId: 'SIG-001', region: 'Metro Manila', baseRate: 175.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-05-01T00:00:00Z' },
  { id: 'R-009', clientId: 'THE-001', region: 'Luzon', baseRate: 210.00, vatRate: 0.12, surchargeRate: 0.07, effectiveDate: '2026-06-01T00:00:00Z' },
  { id: 'R-010', clientId: 'IOT-001', region: 'Visayas', baseRate: 260.00, vatRate: 0.12, surchargeRate: 0.11, effectiveDate: '2026-06-01T00:00:00Z' },
  { id: 'R-011', clientId: 'MOC-011', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-012', clientId: 'MOC-012', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-013', clientId: 'MOC-013', region: 'Metro Manila', baseRate: 155.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-014', clientId: 'MOC-014', region: 'Metro Manila', baseRate: 160.00, vatRate: 0.12, surchargeRate: 0.06, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-015', clientId: 'MOC-015', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-016', clientId: 'MOC-016', region: 'Metro Manila', baseRate: 165.00, vatRate: 0.12, surchargeRate: 0.06, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-017', clientId: 'MOC-017', region: 'Metro Manila', baseRate: 155.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-018', clientId: 'MOC-018', region: 'Metro Manila', baseRate: 170.00, vatRate: 0.12, surchargeRate: 0.06, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-019', clientId: 'MOC-019', region: 'Metro Manila', baseRate: 175.00, vatRate: 0.12, surchargeRate: 0.07, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-020', clientId: 'MOC-020', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-021', clientId: 'MOC-021', region: 'Metro Manila', baseRate: 180.00, vatRate: 0.12, surchargeRate: 0.07, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-022', clientId: 'MOC-022', region: 'Metro Manila', baseRate: 155.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-023', clientId: 'MOC-023', region: 'Metro Manila', baseRate: 160.00, vatRate: 0.12, surchargeRate: 0.06, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-024', clientId: 'MOC-024', region: 'Metro Manila', baseRate: 165.00, vatRate: 0.12, surchargeRate: 0.06, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-025', clientId: 'MOC-025', region: 'Metro Manila', baseRate: 170.00, vatRate: 0.12, surchargeRate: 0.06, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-026', clientId: 'MOC-026', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-027', clientId: 'MOC-027', region: 'Metro Manila', baseRate: 155.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-028', clientId: 'MOC-028', region: 'Metro Manila', baseRate: 180.00, vatRate: 0.12, surchargeRate: 0.07, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-029', clientId: 'MOC-029', region: 'Metro Manila', baseRate: 175.00, vatRate: 0.12, surchargeRate: 0.07, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-030', clientId: 'MOC-030', region: 'Metro Manila', baseRate: 190.00, vatRate: 0.12, surchargeRate: 0.08, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-031', clientId: 'MOC-031', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-032', clientId: 'MOC-032', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-033', clientId: 'MOC-033', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-034', clientId: 'MOC-034', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-035', clientId: 'MOC-035', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-036', clientId: 'MOC-036', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-037', clientId: 'MOC-037', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-038', clientId: 'MOC-038', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-039', clientId: 'MOC-039', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-040', clientId: 'MOC-040', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-041', clientId: 'MOC-041', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-042', clientId: 'MOC-042', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-043', clientId: 'MOC-043', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-044', clientId: 'MOC-044', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-045', clientId: 'MOC-045', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-046', clientId: 'MOC-046', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-047', clientId: 'MOC-047', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-048', clientId: 'MOC-048', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-049', clientId: 'MOC-049', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-050', clientId: 'MOC-050', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-051', clientId: 'MOC-051', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-052', clientId: 'MOC-052', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-053', clientId: 'MOC-053', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-054', clientId: 'MOC-054', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-055', clientId: 'MOC-055', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-056', clientId: 'MOC-056', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-057', clientId: 'MOC-057', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-058', clientId: 'MOC-058', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-059', clientId: 'MOC-059', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-060', clientId: 'MOC-060', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-061', clientId: 'MOC-061', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-062', clientId: 'MOC-062', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-063', clientId: 'MOC-063', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-064', clientId: 'MOC-064', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-065', clientId: 'MOC-065', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-066', clientId: 'MOC-066', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-067', clientId: 'MOC-067', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-068', clientId: 'MOC-068', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-069', clientId: 'MOC-069', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-070', clientId: 'MOC-070', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-071', clientId: 'MOC-071', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-072', clientId: 'MOC-072', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-073', clientId: 'MOC-073', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-074', clientId: 'MOC-074', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-075', clientId: 'MOC-075', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-076', clientId: 'MOC-076', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-077', clientId: 'MOC-077', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-078', clientId: 'MOC-078', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-079', clientId: 'MOC-079', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-080', clientId: 'MOC-080', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-081', clientId: 'MOC-081', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-082', clientId: 'MOC-082', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-083', clientId: 'MOC-083', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-084', clientId: 'MOC-084', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-085', clientId: 'MOC-085', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-086', clientId: 'MOC-086', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-087', clientId: 'MOC-087', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-088', clientId: 'MOC-088', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-089', clientId: 'MOC-089', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-090', clientId: 'MOC-090', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-091', clientId: 'MOC-091', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-092', clientId: 'MOC-092', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-093', clientId: 'MOC-093', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-094', clientId: 'MOC-094', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-095', clientId: 'MOC-095', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-096', clientId: 'MOC-096', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-097', clientId: 'MOC-097', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-098', clientId: 'MOC-098', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-099', clientId: 'MOC-099', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
  { id: 'R-100', clientId: 'MOC-100', region: 'Metro Manila', baseRate: 150.00, vatRate: 0.12, surchargeRate: 0.05, effectiveDate: '2026-07-01T00:00:00Z' },
];

// ─── Waybills ─────────────────────────────────────────────────────

export type WaybillStatus = 'For Checking' | 'Validated' | 'Validated (CTC)' | 'Missing' | 'CTC Submitted' | 'Billed' | 'Failed' | 'Pending Validation';

export interface Waybill {
  id: string;
  waybillNumber: string;
  clientCode: string;
  deliveryDate: string;
  status: WaybillStatus;
  hasOriginalPOD: boolean;
  hasApprovedCTC: boolean;
  encodedBy: string;
  encodedAt: string;
  destinationArea?: string;
  
  // Verification features
  pod_image_url?: string;
  uploaded_by?: string;
  uploaded_date?: string;
  is_ctc?: boolean;
  certified_by?: string;
  certification_date?: string;
  reason_for_missing?: string;
  invoiceId?: string | null;
}

const placeholder_pod = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=600&auto=format&fit=crop';

export const SEEDED_WAYBILLS: Waybill[] = [
  { id: 'WB-CAP-001', invoiceId: 'INV-CAP-DRAFT', waybillNumber: 'WAY-2026-CAP1', clientCode: 'CAP-001', deliveryDate: '2026-07-14T10:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-13T08:00:00Z' },
  { id: 'W-1001', invoiceId: 'INV-26-004', waybillNumber: 'WB-2026-00101', clientCode: 'ALP-001', deliveryDate: '2026-07-01T10:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-02T09:00:00Z', destinationArea: 'BGC, Taguig', pod_image_url: placeholder_pod, uploaded_by: 'Driver-01', uploaded_date: '2026-07-01T12:00:00Z' },
  { id: 'W-1002', invoiceId: null, waybillNumber: 'WB-2026-00102', clientCode: 'BET-001', deliveryDate: '2026-07-03T11:30:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-04T13:45:00Z', destinationArea: 'Clark, Pampanga', pod_image_url: placeholder_pod, uploaded_by: 'Driver-02', uploaded_date: '2026-07-03T14:00:00Z' },
  { id: 'W-1003', invoiceId: null, waybillNumber: 'WB-2026-00103', clientCode: 'ALP-001', deliveryDate: '2026-07-04T15:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-05T08:30:00Z', destinationArea: 'BGC, Taguig', pod_image_url: placeholder_pod, uploaded_by: 'Driver-01', uploaded_date: '2026-07-04T18:00:00Z' },
  { id: 'W-1004', invoiceId: 'INV-26-003', waybillNumber: 'WB-2026-00104', clientCode: 'GAM-001', deliveryDate: '2026-07-05T09:00:00Z', status: 'Validated (CTC)', hasOriginalPOD: false, hasApprovedCTC: true, encodedBy: 'EMP-005', encodedAt: '2026-07-06T08:00:00Z', destinationArea: 'Cebu City', pod_image_url: placeholder_pod, uploaded_by: 'Driver-03', uploaded_date: '2026-07-05T12:00:00Z', is_ctc: true, certified_by: 'Branch Manager Cebu', certification_date: '2026-07-06T07:30:00Z', reason_for_missing: 'Lost in transit by forwarder' },
  { id: 'W-1005', invoiceId: null, waybillNumber: 'WB-2026-00105', clientCode: 'DEL-001', deliveryDate: '2026-07-06T14:00:00Z', status: 'Missing', hasOriginalPOD: false, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-06T16:00:00Z', destinationArea: 'Davao City', uploaded_by: 'Driver-04', uploaded_date: '2026-07-06T15:00:00Z' },
  { id: 'W-1006', invoiceId: 'INV-26-005', waybillNumber: 'WB-2026-00106', clientCode: 'ZET-001', deliveryDate: '2026-07-07T08:00:00Z', status: 'CTC Submitted', hasOriginalPOD: false, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-07T10:00:00Z', destinationArea: 'Iloilo City', pod_image_url: placeholder_pod, uploaded_by: 'EMP-005', uploaded_date: '2026-07-07T09:30:00Z', is_ctc: true, certified_by: 'Iloilo Hub Admin', certification_date: '2026-07-07T09:00:00Z', reason_for_missing: 'Original washed out by rain' },
  { id: 'W-1007', invoiceId: 'INV-26-001', waybillNumber: 'WB-2026-00107', clientCode: 'ALP-001', deliveryDate: '2026-06-15T10:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-06-16T09:00:00Z', destinationArea: 'BGC, Taguig', pod_image_url: placeholder_pod, uploaded_by: 'Driver-01', uploaded_date: '2026-06-15T18:00:00Z' },
  { id: 'W-1008', invoiceId: 'INV-26-002', waybillNumber: 'WB-2026-00108', clientCode: 'BET-001', deliveryDate: '2026-06-20T11:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-06-21T08:00:00Z', destinationArea: 'Clark, Pampanga', pod_image_url: placeholder_pod, uploaded_by: 'Driver-02', uploaded_date: '2026-06-20T18:00:00Z' },
  { id: 'W-1009', invoiceId: null, waybillNumber: 'WB-2026-00109', clientCode: 'OME-001', deliveryDate: '2026-07-07T12:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-07T14:00:00Z', destinationArea: 'Makati City', pod_image_url: placeholder_pod, uploaded_by: 'Driver-05', uploaded_date: '2026-07-07T13:30:00Z' },
  { id: 'W-1010', invoiceId: null, waybillNumber: 'WB-2026-00110', clientCode: 'THE-001', deliveryDate: '2026-07-08T09:00:00Z', status: 'Missing', hasOriginalPOD: false, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T10:00:00Z', destinationArea: 'Calamba, Laguna', uploaded_by: 'Driver-06', uploaded_date: '2026-07-08T11:00:00Z' },
  { id: 'W-1011', invoiceId: 'INV-26-006', waybillNumber: 'WB-2026-00111', clientCode: 'MOC-022', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1012', invoiceId: 'INV-26-007', waybillNumber: 'WB-2026-00112', clientCode: 'MOC-023', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1013', invoiceId: 'INV-26-008', waybillNumber: 'WB-2026-00113', clientCode: 'MOC-024', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1014', invoiceId: null, waybillNumber: 'WB-2026-00114', clientCode: 'MOC-025', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1015', invoiceId: null, waybillNumber: 'WB-2026-00115', clientCode: 'MOC-026', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1016', invoiceId: null, waybillNumber: 'WB-2026-00116', clientCode: 'MOC-027', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1017', invoiceId: null, waybillNumber: 'WB-2026-00117', clientCode: 'MOC-028', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1018', invoiceId: null, waybillNumber: 'WB-2026-00118', clientCode: 'MOC-029', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1019', invoiceId: null, waybillNumber: 'WB-2026-00119', clientCode: 'MOC-030', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1020', invoiceId: null, waybillNumber: 'WB-2026-00120', clientCode: 'MOC-011', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1021', invoiceId: null, waybillNumber: 'WB-2026-00121', clientCode: 'MOC-012', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1022', invoiceId: null, waybillNumber: 'WB-2026-00122', clientCode: 'MOC-013', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1023', invoiceId: null, waybillNumber: 'WB-2026-00123', clientCode: 'MOC-014', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1024', invoiceId: null, waybillNumber: 'WB-2026-00124', clientCode: 'MOC-015', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1025', invoiceId: null, waybillNumber: 'WB-2026-00125', clientCode: 'MOC-016', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1026', invoiceId: null, waybillNumber: 'WB-2026-00126', clientCode: 'MOC-017', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1027', invoiceId: null, waybillNumber: 'WB-2026-00127', clientCode: 'MOC-018', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1028', invoiceId: null, waybillNumber: 'WB-2026-00128', clientCode: 'MOC-019', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1029', invoiceId: null, waybillNumber: 'WB-2026-00129', clientCode: 'MOC-020', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1030', invoiceId: null, waybillNumber: 'WB-2026-00130', clientCode: 'MOC-021', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1031', invoiceId: null, waybillNumber: 'WB-2026-00131', clientCode: 'MOC-022', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1032', invoiceId: null, waybillNumber: 'WB-2026-00132', clientCode: 'MOC-023', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1033', invoiceId: null, waybillNumber: 'WB-2026-00133', clientCode: 'MOC-024', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1034', invoiceId: null, waybillNumber: 'WB-2026-00134', clientCode: 'MOC-025', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1035', invoiceId: null, waybillNumber: 'WB-2026-00135', clientCode: 'MOC-026', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1036', invoiceId: null, waybillNumber: 'WB-2026-00136', clientCode: 'MOC-027', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1037', invoiceId: null, waybillNumber: 'WB-2026-00137', clientCode: 'MOC-028', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1038', invoiceId: null, waybillNumber: 'WB-2026-00138', clientCode: 'MOC-029', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1039', invoiceId: null, waybillNumber: 'WB-2026-00139', clientCode: 'MOC-030', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1040', invoiceId: null, waybillNumber: 'WB-2026-00140', clientCode: 'MOC-011', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1011', invoiceId: 'INV-26-006', waybillNumber: 'WB-2026-00111', clientCode: 'MOC-022', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1012', invoiceId: 'INV-26-007', waybillNumber: 'WB-2026-00112', clientCode: 'MOC-023', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1013', invoiceId: 'INV-26-008', waybillNumber: 'WB-2026-00113', clientCode: 'MOC-024', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1014', invoiceId: null, waybillNumber: 'WB-2026-00114', clientCode: 'MOC-025', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1015', invoiceId: null, waybillNumber: 'WB-2026-00115', clientCode: 'MOC-026', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1016', invoiceId: null, waybillNumber: 'WB-2026-00116', clientCode: 'MOC-027', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1017', invoiceId: null, waybillNumber: 'WB-2026-00117', clientCode: 'MOC-028', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1018', invoiceId: null, waybillNumber: 'WB-2026-00118', clientCode: 'MOC-029', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1019', invoiceId: null, waybillNumber: 'WB-2026-00119', clientCode: 'MOC-030', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1020', invoiceId: null, waybillNumber: 'WB-2026-00120', clientCode: 'MOC-011', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1021', invoiceId: null, waybillNumber: 'WB-2026-00121', clientCode: 'MOC-012', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1022', invoiceId: null, waybillNumber: 'WB-2026-00122', clientCode: 'MOC-013', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1023', invoiceId: null, waybillNumber: 'WB-2026-00123', clientCode: 'MOC-014', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1024', invoiceId: null, waybillNumber: 'WB-2026-00124', clientCode: 'MOC-015', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1025', invoiceId: null, waybillNumber: 'WB-2026-00125', clientCode: 'MOC-016', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1026', invoiceId: null, waybillNumber: 'WB-2026-00126', clientCode: 'MOC-017', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1027', invoiceId: null, waybillNumber: 'WB-2026-00127', clientCode: 'MOC-018', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1028', invoiceId: null, waybillNumber: 'WB-2026-00128', clientCode: 'MOC-019', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1029', invoiceId: null, waybillNumber: 'WB-2026-00129', clientCode: 'MOC-020', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1030', invoiceId: null, waybillNumber: 'WB-2026-00130', clientCode: 'MOC-021', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1031', invoiceId: null, waybillNumber: 'WB-2026-00131', clientCode: 'MOC-022', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1032', invoiceId: null, waybillNumber: 'WB-2026-00132', clientCode: 'MOC-023', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1033', invoiceId: null, waybillNumber: 'WB-2026-00133', clientCode: 'MOC-024', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1034', invoiceId: null, waybillNumber: 'WB-2026-00134', clientCode: 'MOC-025', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1035', invoiceId: null, waybillNumber: 'WB-2026-00135', clientCode: 'MOC-026', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1036', invoiceId: null, waybillNumber: 'WB-2026-00136', clientCode: 'MOC-027', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1037', invoiceId: null, waybillNumber: 'WB-2026-00137', clientCode: 'MOC-028', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1038', invoiceId: null, waybillNumber: 'WB-2026-00138', clientCode: 'MOC-029', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1039', invoiceId: null, waybillNumber: 'WB-2026-00139', clientCode: 'MOC-030', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1040', invoiceId: null, waybillNumber: 'WB-2026-00140', clientCode: 'MOC-011', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1041', invoiceId: null, waybillNumber: 'WB-2026-00141', clientCode: 'MOC-072', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1042', invoiceId: null, waybillNumber: 'WB-2026-00142', clientCode: 'MOC-073', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1043', invoiceId: null, waybillNumber: 'WB-2026-00143', clientCode: 'MOC-074', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1044', invoiceId: null, waybillNumber: 'WB-2026-00144', clientCode: 'MOC-075', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1045', invoiceId: null, waybillNumber: 'WB-2026-00145', clientCode: 'MOC-076', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1046', invoiceId: null, waybillNumber: 'WB-2026-00146', clientCode: 'MOC-077', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1047', invoiceId: null, waybillNumber: 'WB-2026-00147', clientCode: 'MOC-078', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1048', invoiceId: null, waybillNumber: 'WB-2026-00148', clientCode: 'MOC-079', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1049', invoiceId: null, waybillNumber: 'WB-2026-00149', clientCode: 'MOC-080', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1050', invoiceId: null, waybillNumber: 'WB-2026-00150', clientCode: 'MOC-081', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1051', invoiceId: null, waybillNumber: 'WB-2026-00151', clientCode: 'MOC-082', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1052', invoiceId: null, waybillNumber: 'WB-2026-00152', clientCode: 'MOC-083', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1053', invoiceId: null, waybillNumber: 'WB-2026-00153', clientCode: 'MOC-084', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1054', invoiceId: null, waybillNumber: 'WB-2026-00154', clientCode: 'MOC-085', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1055', invoiceId: null, waybillNumber: 'WB-2026-00155', clientCode: 'MOC-086', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1056', invoiceId: null, waybillNumber: 'WB-2026-00156', clientCode: 'MOC-087', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1057', invoiceId: null, waybillNumber: 'WB-2026-00157', clientCode: 'MOC-088', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1058', invoiceId: null, waybillNumber: 'WB-2026-00158', clientCode: 'MOC-089', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1059', invoiceId: null, waybillNumber: 'WB-2026-00159', clientCode: 'MOC-090', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1060', invoiceId: null, waybillNumber: 'WB-2026-00160', clientCode: 'MOC-091', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1061', invoiceId: null, waybillNumber: 'WB-2026-00161', clientCode: 'MOC-092', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1062', invoiceId: null, waybillNumber: 'WB-2026-00162', clientCode: 'MOC-093', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1063', invoiceId: null, waybillNumber: 'WB-2026-00163', clientCode: 'MOC-094', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1064', invoiceId: null, waybillNumber: 'WB-2026-00164', clientCode: 'MOC-095', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1065', invoiceId: null, waybillNumber: 'WB-2026-00165', clientCode: 'MOC-096', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1066', invoiceId: null, waybillNumber: 'WB-2026-00166', clientCode: 'MOC-097', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1067', invoiceId: null, waybillNumber: 'WB-2026-00167', clientCode: 'MOC-098', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1068', invoiceId: null, waybillNumber: 'WB-2026-00168', clientCode: 'MOC-099', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1069', invoiceId: null, waybillNumber: 'WB-2026-00169', clientCode: 'MOC-100', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1070', invoiceId: null, waybillNumber: 'WB-2026-00170', clientCode: 'MOC-031', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1071', invoiceId: null, waybillNumber: 'WB-2026-00171', clientCode: 'MOC-032', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1072', invoiceId: null, waybillNumber: 'WB-2026-00172', clientCode: 'MOC-033', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1073', invoiceId: null, waybillNumber: 'WB-2026-00173', clientCode: 'MOC-034', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1074', invoiceId: null, waybillNumber: 'WB-2026-00174', clientCode: 'MOC-035', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1075', invoiceId: null, waybillNumber: 'WB-2026-00175', clientCode: 'MOC-036', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1076', invoiceId: null, waybillNumber: 'WB-2026-00176', clientCode: 'MOC-037', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1077', invoiceId: null, waybillNumber: 'WB-2026-00177', clientCode: 'MOC-038', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1078', invoiceId: null, waybillNumber: 'WB-2026-00178', clientCode: 'MOC-039', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1079', invoiceId: null, waybillNumber: 'WB-2026-00179', clientCode: 'MOC-040', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1080', invoiceId: null, waybillNumber: 'WB-2026-00180', clientCode: 'MOC-041', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1081', invoiceId: null, waybillNumber: 'WB-2026-00181', clientCode: 'MOC-042', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1082', invoiceId: null, waybillNumber: 'WB-2026-00182', clientCode: 'MOC-043', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1083', invoiceId: null, waybillNumber: 'WB-2026-00183', clientCode: 'MOC-044', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1084', invoiceId: null, waybillNumber: 'WB-2026-00184', clientCode: 'MOC-045', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1085', invoiceId: null, waybillNumber: 'WB-2026-00185', clientCode: 'MOC-046', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1086', invoiceId: null, waybillNumber: 'WB-2026-00186', clientCode: 'MOC-047', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1087', invoiceId: null, waybillNumber: 'WB-2026-00187', clientCode: 'MOC-048', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1088', invoiceId: null, waybillNumber: 'WB-2026-00188', clientCode: 'MOC-049', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1089', invoiceId: null, waybillNumber: 'WB-2026-00189', clientCode: 'MOC-050', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1090', invoiceId: null, waybillNumber: 'WB-2026-00190', clientCode: 'MOC-051', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1091', invoiceId: null, waybillNumber: 'WB-2026-00191', clientCode: 'MOC-052', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1092', invoiceId: null, waybillNumber: 'WB-2026-00192', clientCode: 'MOC-053', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1093', invoiceId: null, waybillNumber: 'WB-2026-00193', clientCode: 'MOC-054', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1094', invoiceId: null, waybillNumber: 'WB-2026-00194', clientCode: 'MOC-055', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1095', invoiceId: null, waybillNumber: 'WB-2026-00195', clientCode: 'MOC-056', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1096', invoiceId: null, waybillNumber: 'WB-2026-00196', clientCode: 'MOC-057', deliveryDate: '2026-07-08T00:00:00Z', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1097', invoiceId: null, waybillNumber: 'WB-2026-00197', clientCode: 'MOC-058', deliveryDate: '2026-07-08T00:00:00Z', status: 'Missing', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1098', invoiceId: null, waybillNumber: 'WB-2026-00198', clientCode: 'MOC-059', deliveryDate: '2026-07-08T00:00:00Z', status: 'CTC Submitted', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-1099', invoiceId: null, waybillNumber: 'WB-2026-00199', clientCode: 'MOC-060', deliveryDate: '2026-07-08T00:00:00Z', status: 'Billed', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },
  { id: 'W-10100', invoiceId: null, waybillNumber: 'WB-2026-00200', clientCode: 'MOC-061', deliveryDate: '2026-07-08T00:00:00Z', status: 'For Checking', hasOriginalPOD: true, hasApprovedCTC: false, encodedBy: 'EMP-005', encodedAt: '2026-07-08T00:00:00Z', destinationArea: 'Mock Area', pod_image_url: placeholder_pod, uploaded_by: 'Driver-X', uploaded_date: '2026-07-08T00:00:00Z' },

  // --- Unbilled Waybills added dynamically ---
  { id: 'WB-U-001', invoiceId: null, clientCode: 'ALP-001', waybillNumber: 'WB-ALP-U001', deliveryDate: '2026-07-01T10:00:00Z', destinationArea: 'Makati City', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: true, encodedBy: 'EMP-005', encodedAt: '2026-07-06T09:00:00Z' },
  { id: 'WB-U-002', invoiceId: null, clientCode: 'ALP-001', waybillNumber: 'WB-ALP-U002', deliveryDate: '2026-07-03T10:00:00Z', destinationArea: 'BGC, Taguig', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: true, encodedBy: 'EMP-005', encodedAt: '2026-07-06T09:00:00Z' },
  { id: 'WB-U-003', invoiceId: null, clientCode: 'ALP-001', waybillNumber: 'WB-ALP-U003', deliveryDate: '2026-07-05T10:00:00Z', destinationArea: 'Quezon City', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: true, encodedBy: 'EMP-005', encodedAt: '2026-07-06T09:00:00Z' },
  
  { id: 'WB-U-004', invoiceId: null, clientCode: 'CAP-001', waybillNumber: 'WB-CAP-U001', deliveryDate: '2026-07-02T10:00:00Z', destinationArea: 'Manila', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: true, encodedBy: 'EMP-005', encodedAt: '2026-07-06T09:00:00Z' },
  { id: 'WB-U-005', invoiceId: null, clientCode: 'CAP-001', waybillNumber: 'WB-CAP-U002', deliveryDate: '2026-07-04T10:00:00Z', destinationArea: 'Manila', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: true, encodedBy: 'EMP-005', encodedAt: '2026-07-06T09:00:00Z' },
  
  { id: 'WB-U-006', invoiceId: null, clientCode: 'BET-001', waybillNumber: 'WB-BET-U001', deliveryDate: '2026-07-02T10:00:00Z', destinationArea: 'Clark', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: true, encodedBy: 'EMP-005', encodedAt: '2026-07-06T09:00:00Z' },
  { id: 'WB-U-007', invoiceId: null, clientCode: 'BET-001', waybillNumber: 'WB-BET-U002', deliveryDate: '2026-07-05T10:00:00Z', destinationArea: 'Subic', status: 'Validated', hasOriginalPOD: true, hasApprovedCTC: true, encodedBy: 'EMP-005', encodedAt: '2026-07-06T09:00:00Z' },
];

// ─── Invoices ─────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  waybillIds: string[];
  amount: number;
  vatAmount: number;
  surchargeAmount: number;
  totalAmount: number;
  billingSchedule: 'Monthly' | 'Semi-monthly' | 'Weekly';
  billingPeriod: string;
  status: 'Draft' | 'Pending Approval' | 'Verified' | 'Needs Revision' | 'Finalized' | 'Paid' | 'Overdue';
  createdBy: string;
  createdAt: string;
  dueDate: string;
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  notes?: string;
  proofFileUrl?: string;
}

export const SEEDED_INVOICES: Invoice[] = [
  { id: 'INV-TEST-001', invoiceNumber: 'INV-TEST-001', clientId: 'TEST-001', waybillIds: [], amount: 1500, vatAmount: 180, surchargeAmount: 0, totalAmount: 1680, status: 'Finalized', billingSchedule: 'Monthly', billingPeriod: 'July 1-15, 2026', dueDate: '2026-07-30T23:59:59Z', createdBy: 'EMP-003', createdAt: '2026-07-14T01:00:00Z' },

  { id: 'INV-CAP-DRAFT', invoiceNumber: 'INV-26-CAP1', clientId: 'CAP-001', waybillIds: ['WB-CAP-001'], amount: 5000, vatAmount: 600, surchargeAmount: 0, totalAmount: 5600, status: 'Draft', billingSchedule: 'Monthly', billingPeriod: 'July 1-15, 2026', dueDate: '2026-07-30T23:59:59Z', createdBy: 'EMP-003', createdAt: '2026-07-14T01:00:00Z' },
  { id: 'INV-CAP-REVIEW', invoiceNumber: 'INV-26-CAP2', clientId: 'CAP-001', waybillIds: [], amount: 8000, vatAmount: 960, surchargeAmount: 0, totalAmount: 8960, status: 'Pending Approval', billingSchedule: 'Monthly', billingPeriod: 'July 1-15, 2026', dueDate: '2026-07-30T23:59:59Z', createdBy: 'EMP-003', createdAt: '2026-07-14T02:00:00Z' },
  { id: 'INV-CAP-APPROVE', invoiceNumber: 'INV-26-CAP3', clientId: 'CAP-001', waybillIds: [], amount: 10000, vatAmount: 1200, surchargeAmount: 0, totalAmount: 11200, status: 'Verified', billingSchedule: 'Monthly', billingPeriod: 'July 1-15, 2026', dueDate: '2026-07-30T23:59:59Z', createdBy: 'EMP-003', createdAt: '2026-07-14T03:00:00Z', approvedBy: 'EMP-002', approvedAt: '2026-07-14T04:00:00Z' },
  { id: 'INV-CAP-SENT', invoiceNumber: 'INV-26-CAP4', clientId: 'CAP-001', waybillIds: [], amount: 15000, vatAmount: 1800, surchargeAmount: 0, totalAmount: 16800, status: 'Finalized', billingSchedule: 'Monthly', billingPeriod: 'July 1-15, 2026', dueDate: '2026-07-30T23:59:59Z', createdBy: 'EMP-003', createdAt: '2026-07-14T05:00:00Z', sentAt: '2026-07-14T10:00:00Z' },
  { id: 'INV-CAP-PAYING', invoiceNumber: 'INV-26-CAP5', clientId: 'CAP-001', waybillIds: [], amount: 20000, vatAmount: 2400, surchargeAmount: 0, totalAmount: 22400, status: 'Finalized', billingSchedule: 'Monthly', billingPeriod: 'July 1-15, 2026', dueDate: '2026-07-30T23:59:59Z', createdBy: 'EMP-003', createdAt: '2026-07-14T07:00:00Z', sentAt: '2026-07-14T10:00:00Z' },

  {
    id: 'INV-26-001', invoiceNumber: 'INV-2026-001', clientId: 'ALP-001', waybillIds: ['W-1007'],
    amount: 150.00, vatAmount: 18.00, surchargeAmount: 7.50, totalAmount: 175.50,
    billingSchedule: 'Monthly', billingPeriod: 'June 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-06-30T10:00:00Z',
    dueDate: '2026-07-30T00:00:00Z', approvedBy: 'EMP-002', approvedAt: '2026-07-01T09:00:00Z', sentAt: '2026-07-02T10:00:00Z',
  },
  {
    id: 'INV-26-002', invoiceNumber: 'INV-2026-002', clientId: 'BET-001', waybillIds: ['W-1008'],
    amount: 200.00, vatAmount: 24.00, surchargeAmount: 16.00, totalAmount: 240.00,
    billingSchedule: 'Semi-monthly', billingPeriod: 'June 16–30, 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-06-30T11:00:00Z',
    dueDate: '2026-07-05T00:00:00Z', approvedBy: 'EMP-002', approvedAt: '2026-07-01T10:00:00Z', sentAt: '2026-07-02T11:00:00Z',
  },
  {
    id: 'INV-26-003', invoiceNumber: 'INV-2026-003', clientId: 'GAM-001', waybillIds: ['W-1004'],
    amount: 250.00, vatAmount: 30.00, surchargeAmount: 25.00, totalAmount: 305.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-004', invoiceNumber: 'INV-2026-004', clientId: 'ALP-001', waybillIds: ['W-1001'],
    amount: 150.00, vatAmount: 18.00, surchargeAmount: 7.50, totalAmount: 175.50,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-05T10:00:00Z',
    dueDate: '2026-08-04T00:00:00Z', approvedBy: 'EMP-002', approvedAt: '2026-07-06T08:00:00Z', sentAt: '2026-07-06T10:00:00Z',
  },
  {
    id: 'INV-26-005', invoiceNumber: 'INV-2026-005', clientId: 'ZET-001', waybillIds: ['W-1006'],
    amount: 240.00, vatAmount: 28.80, surchargeAmount: 21.60, totalAmount: 290.40,
    billingSchedule: 'Semi-monthly', billingPeriod: 'July 1–15, 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-07T08:00:00Z',
    dueDate: '2026-08-07T00:00:00Z', approvedBy: 'EMP-002', approvedAt: '2026-07-07T11:00:00Z',
  },
  {
    id: 'INV-26-006', invoiceNumber: 'INV-2026-006', clientId: 'GAM-001', waybillIds: ['W-1011'],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'April 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-04-30T10:00:00Z',
    dueDate: '2026-05-30T00:00:00Z', 
    approvedBy: 'EMP-002', approvedAt: '2026-05-01T09:00:00Z', sentAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'INV-26-007', invoiceNumber: 'INV-2026-007', clientId: 'DEL-001', waybillIds: ['W-1012'],
    amount: 300.00, vatAmount: 36.00, surchargeAmount: 14.00, totalAmount: 350.00,
    billingSchedule: 'Monthly', billingPeriod: 'March 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-03-31T10:00:00Z',
    dueDate: '2026-04-30T00:00:00Z', 
    approvedBy: 'EMP-002', approvedAt: '2026-04-01T09:00:00Z', sentAt: '2026-04-02T10:00:00Z',
  },
  {
    id: 'INV-26-008', invoiceNumber: 'INV-2026-008', clientId: 'EPS-001', waybillIds: ['W-1013'],
    amount: 1000.00, vatAmount: 120.00, surchargeAmount: 80.00, totalAmount: 1200.00,
    billingSchedule: 'Monthly', billingPeriod: 'January 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-01-31T10:00:00Z',
    dueDate: '2026-02-28T00:00:00Z', 
    approvedBy: 'EMP-002', approvedAt: '2026-02-01T09:00:00Z', sentAt: '2026-02-02T10:00:00Z',
  },
  {
    id: 'INV-26-009', invoiceNumber: 'INV-2026-009', clientId: 'MOC-040', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-010', invoiceNumber: 'INV-2026-010', clientId: 'MOC-041', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-011', invoiceNumber: 'INV-2026-011', clientId: 'MOC-042', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-012', invoiceNumber: 'INV-2026-012', clientId: 'MOC-043', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-013', invoiceNumber: 'INV-2026-013', clientId: 'MOC-044', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-014', invoiceNumber: 'INV-2026-014', clientId: 'MOC-045', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-015', invoiceNumber: 'INV-2026-015', clientId: 'MOC-046', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-016', invoiceNumber: 'INV-2026-016', clientId: 'MOC-047', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-017', invoiceNumber: 'INV-2026-017', clientId: 'MOC-048', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-018', invoiceNumber: 'INV-2026-018', clientId: 'MOC-049', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-019', invoiceNumber: 'INV-2026-019', clientId: 'MOC-050', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-020', invoiceNumber: 'INV-2026-020', clientId: 'MOC-051', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-021', invoiceNumber: 'INV-2026-021', clientId: 'MOC-052', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-022', invoiceNumber: 'INV-2026-022', clientId: 'MOC-053', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-023', invoiceNumber: 'INV-2026-023', clientId: 'MOC-054', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-024', invoiceNumber: 'INV-2026-024', clientId: 'MOC-055', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-025', invoiceNumber: 'INV-2026-025', clientId: 'MOC-056', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-026', invoiceNumber: 'INV-2026-026', clientId: 'MOC-057', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-027', invoiceNumber: 'INV-2026-027', clientId: 'MOC-058', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-028', invoiceNumber: 'INV-2026-028', clientId: 'MOC-059', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-029', invoiceNumber: 'INV-2026-029', clientId: 'MOC-060', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-030', invoiceNumber: 'INV-2026-030', clientId: 'MOC-061', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-031', invoiceNumber: 'INV-2026-031', clientId: 'MOC-062', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-032', invoiceNumber: 'INV-2026-032', clientId: 'MOC-063', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-033', invoiceNumber: 'INV-2026-033', clientId: 'MOC-064', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-034', invoiceNumber: 'INV-2026-034', clientId: 'MOC-065', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-035', invoiceNumber: 'INV-2026-035', clientId: 'MOC-066', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-036', invoiceNumber: 'INV-2026-036', clientId: 'MOC-067', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-037', invoiceNumber: 'INV-2026-037', clientId: 'MOC-068', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-038', invoiceNumber: 'INV-2026-038', clientId: 'MOC-069', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-039', invoiceNumber: 'INV-2026-039', clientId: 'MOC-070', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-040', invoiceNumber: 'INV-2026-040', clientId: 'MOC-071', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-041', invoiceNumber: 'INV-2026-041', clientId: 'MOC-072', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-042', invoiceNumber: 'INV-2026-042', clientId: 'MOC-073', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-043', invoiceNumber: 'INV-2026-043', clientId: 'MOC-074', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-044', invoiceNumber: 'INV-2026-044', clientId: 'MOC-075', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-045', invoiceNumber: 'INV-2026-045', clientId: 'MOC-076', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-046', invoiceNumber: 'INV-2026-046', clientId: 'MOC-077', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-047', invoiceNumber: 'INV-2026-047', clientId: 'MOC-078', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-048', invoiceNumber: 'INV-2026-048', clientId: 'MOC-079', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-049', invoiceNumber: 'INV-2026-049', clientId: 'MOC-080', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-050', invoiceNumber: 'INV-2026-050', clientId: 'MOC-081', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-051', invoiceNumber: 'INV-2026-051', clientId: 'MOC-082', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-052', invoiceNumber: 'INV-2026-052', clientId: 'MOC-083', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-053', invoiceNumber: 'INV-2026-053', clientId: 'MOC-084', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-054', invoiceNumber: 'INV-2026-054', clientId: 'MOC-085', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-055', invoiceNumber: 'INV-2026-055', clientId: 'MOC-086', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-056', invoiceNumber: 'INV-2026-056', clientId: 'MOC-087', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-057', invoiceNumber: 'INV-2026-057', clientId: 'MOC-088', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-058', invoiceNumber: 'INV-2026-058', clientId: 'MOC-089', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-059', invoiceNumber: 'INV-2026-059', clientId: 'MOC-090', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-060', invoiceNumber: 'INV-2026-060', clientId: 'MOC-091', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-061', invoiceNumber: 'INV-2026-061', clientId: 'MOC-092', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-062', invoiceNumber: 'INV-2026-062', clientId: 'MOC-093', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-063', invoiceNumber: 'INV-2026-063', clientId: 'MOC-094', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-064', invoiceNumber: 'INV-2026-064', clientId: 'MOC-095', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-065', invoiceNumber: 'INV-2026-065', clientId: 'MOC-096', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-066', invoiceNumber: 'INV-2026-066', clientId: 'MOC-097', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-067', invoiceNumber: 'INV-2026-067', clientId: 'MOC-098', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-068', invoiceNumber: 'INV-2026-068', clientId: 'MOC-099', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-069', invoiceNumber: 'INV-2026-069', clientId: 'MOC-100', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-070', invoiceNumber: 'INV-2026-070', clientId: 'MOC-031', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-071', invoiceNumber: 'INV-2026-071', clientId: 'MOC-032', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-072', invoiceNumber: 'INV-2026-072', clientId: 'MOC-033', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-073', invoiceNumber: 'INV-2026-073', clientId: 'MOC-034', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-074', invoiceNumber: 'INV-2026-074', clientId: 'MOC-035', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-075', invoiceNumber: 'INV-2026-075', clientId: 'MOC-036', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-076', invoiceNumber: 'INV-2026-076', clientId: 'MOC-037', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-077', invoiceNumber: 'INV-2026-077', clientId: 'MOC-038', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-078', invoiceNumber: 'INV-2026-078', clientId: 'MOC-039', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-079', invoiceNumber: 'INV-2026-079', clientId: 'MOC-040', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-080', invoiceNumber: 'INV-2026-080', clientId: 'MOC-041', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-081', invoiceNumber: 'INV-2026-081', clientId: 'MOC-042', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-082', invoiceNumber: 'INV-2026-082', clientId: 'MOC-043', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-083', invoiceNumber: 'INV-2026-083', clientId: 'MOC-044', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-084', invoiceNumber: 'INV-2026-084', clientId: 'MOC-045', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-085', invoiceNumber: 'INV-2026-085', clientId: 'MOC-046', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-086', invoiceNumber: 'INV-2026-086', clientId: 'MOC-047', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-087', invoiceNumber: 'INV-2026-087', clientId: 'MOC-048', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-088', invoiceNumber: 'INV-2026-088', clientId: 'MOC-049', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-089', invoiceNumber: 'INV-2026-089', clientId: 'MOC-050', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-090', invoiceNumber: 'INV-2026-090', clientId: 'MOC-051', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-091', invoiceNumber: 'INV-2026-091', clientId: 'MOC-052', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-092', invoiceNumber: 'INV-2026-092', clientId: 'MOC-053', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-093', invoiceNumber: 'INV-2026-093', clientId: 'MOC-054', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-094', invoiceNumber: 'INV-2026-094', clientId: 'MOC-055', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Needs Revision', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-095', invoiceNumber: 'INV-2026-095', clientId: 'MOC-056', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Finalized', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-096', invoiceNumber: 'INV-2026-096', clientId: 'MOC-057', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Paid', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-097', invoiceNumber: 'INV-2026-097', clientId: 'MOC-058', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Overdue', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-098', invoiceNumber: 'INV-2026-098', clientId: 'MOC-059', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Draft', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-099', invoiceNumber: 'INV-2026-099', clientId: 'MOC-060', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Pending Approval', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
  {
    id: 'INV-26-100', invoiceNumber: 'INV-2026-100', clientId: 'MOC-061', waybillIds: [],
    amount: 500.00, vatAmount: 60.00, surchargeAmount: 20.00, totalAmount: 580.00,
    billingSchedule: 'Monthly', billingPeriod: 'July 2026',
    status: 'Verified', createdBy: 'EMP-003', createdAt: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
  },
];

// ─── Payments ────────────────────────────────────────────────────

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  paymentMethod: 'Check' | 'Cash' | 'Bank Transfer' | 'Online Bank Transfer' | 'GCash' | 'Maya';
  referenceNumber: string;
  bankConfirmed: boolean;
  proofOfPaymentUrl?: string;
  recordedBy: string;
  recordedAt: string;
  validatedBy?: string;
  validatedAt?: string;
  status: 'Pending Validation' | 'Validated' | 'Approved' | 'Rejected';
  notes?: string;
}

export const SEEDED_PAYMENTS: Payment[] = [
  {
    id: 'PAY-001', invoiceId: 'INV-26-001', clientId: 'ALP-001',
    amount: 351.00, paymentMethod: 'Online Bank Transfer', referenceNumber: 'BDO-20260710-001',
    bankConfirmed: true, recordedBy: 'EMP-004', recordedAt: '2026-07-10T10:00:00Z',
    validatedBy: 'EMP-001', validatedAt: '2026-07-10T11:00:00Z', status: 'Validated',
  },
  {
    id: 'PAY-002', invoiceId: 'INV-26-002', clientId: 'BET-001',
    amount: 240.00, paymentMethod: 'Check', referenceNumber: 'CHK-998877',
    bankConfirmed: false, recordedBy: 'EMP-003', recordedAt: '2026-07-12T09:00:00Z',
    status: 'Pending Validation',
  },
  {
    id: 'PAY-003', invoiceId: 'INV-26-004', clientId: 'ALP-001',
    amount: 100.00, paymentMethod: 'GCash', referenceNumber: 'GC-123456',
    bankConfirmed: true, recordedBy: 'EMP-003', recordedAt: '2026-07-11T14:00:00Z',
    validatedBy: 'EMP-001', validatedAt: '2026-07-11T15:00:00Z', status: 'Validated',
  },
  {
    id: 'PAY-004', invoiceId: 'INV-26-005', clientId: 'ZET-001',
    amount: 290.40, paymentMethod: 'Online Bank Transfer', referenceNumber: 'BPI-445566',
    bankConfirmed: true, recordedBy: 'EMP-003', recordedAt: '2026-07-13T10:00:00Z',
    validatedBy: 'EMP-001', validatedAt: '2026-07-13T11:00:00Z', status: 'Validated',
  },
  {
    id: 'PAY-005', invoiceId: 'INV-26-004', clientId: 'ALP-001',
    amount: 75.50, paymentMethod: 'Maya', referenceNumber: 'MY-112233',
    bankConfirmed: true, recordedBy: 'EMP-003', recordedAt: '2026-07-14T10:00:00Z',
    validatedBy: 'EMP-001', validatedAt: '2026-07-14T11:00:00Z', status: 'Validated',
  },
  {
    id: 'PAY-006', invoiceId: 'INV-26-006', clientId: 'BET-001',
    amount: 500.00, paymentMethod: 'Bank Transfer', referenceNumber: 'BPI-998811',
    bankConfirmed: false, recordedBy: 'EMP-003', recordedAt: '2026-07-14T08:30:00Z',
    status: 'Pending Validation',
  },
  {
    id: 'PAY-007', invoiceId: 'INV-26-007', clientId: 'ZET-001',
    amount: 150.00, paymentMethod: 'Cash', referenceNumber: 'CR-001',
    bankConfirmed: false, recordedBy: 'EMP-004', recordedAt: '2026-07-14T13:15:00Z',
    status: 'Pending Validation',
  },
  {
    id: 'PAY-008', invoiceId: 'INV-26-008', clientId: 'ALP-001',
    amount: 1200.00, paymentMethod: 'Check', referenceNumber: 'CHK-555666',
    bankConfirmed: true, recordedBy: 'EMP-004', recordedAt: '2026-07-13T16:45:00Z',
    validatedBy: 'EMP-001', validatedAt: '2026-07-14T09:20:00Z', status: 'Validated',
  },
  {
    id: 'PAY-009', invoiceId: 'INV-26-009', clientId: 'BET-001',
    amount: 300.00, paymentMethod: 'GCash', referenceNumber: 'GC-999000',
    bankConfirmed: false, recordedBy: 'EMP-003', recordedAt: '2026-07-12T11:10:00Z',
    status: 'Rejected', notes: 'Reference number mismatch, please re-check with client.',
  },
  {
    id: 'PAY-010', invoiceId: 'INV-26-010', clientId: 'ZET-001',
    amount: 850.00, paymentMethod: 'Online Bank Transfer', referenceNumber: 'UBP-777888',
    bankConfirmed: true, recordedBy: 'EMP-003', recordedAt: '2026-07-10T14:30:00Z',
    validatedBy: 'EMP-001', validatedAt: '2026-07-11T10:00:00Z', status: 'Approved',
  }
];

// ─── Accounts Receivable ──────────────────────────────────────────

export interface ARRecord {
  id: string;
  invoiceId: string;
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  originalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  agingBracket: 'Current' | '0-30 days' | '31-60 days' | '61-90 days' | '90+ days';
  agingDays: number;
  status: 'Current' | 'Due Soon' | 'Overdue';
}

// Helper to compute aging bracket
function computeAging(dueDateStr: string): { bracket: ARRecord['agingBracket']; days: number; status: ARRecord['status'] } {
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilDue = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let bracket: ARRecord['agingBracket'] = 'Current';
  let status: ARRecord['status'] = 'Current';

  if (diffDays > 0) {
    status = 'Overdue';
    if (diffDays <= 30) bracket = '0-30 days';
    else if (diffDays <= 60) bracket = '31-60 days';
    else if (diffDays <= 90) bracket = '61-90 days';
    else bracket = '90+ days';
  } else if (daysUntilDue <= 7) {
    status = 'Due Soon';
    bracket = '0-30 days';
  }

  return { bracket, days: Math.abs(diffDays), status };
}

export const SEEDED_AR_RECORDS: ARRecord[] = SEEDED_INVOICES
  .filter(inv => ['Finalized', 'Overdue', 'Verified'].includes(inv.status))
  .map((inv, i) => {
    const { bracket, days, status } = computeAging(inv.dueDate);
    const paid = SEEDED_PAYMENTS.filter(p => p.invoiceId === inv.id && p.status === 'Validated').reduce((s, p) => s + p.amount, 0);
    return {
      id: `AR-${String(i + 1).padStart(3, '0')}`,
      invoiceId: inv.id,
      clientId: inv.clientId,
      invoiceDate: inv.createdAt,
      dueDate: inv.dueDate,
      originalAmount: inv.totalAmount,
      paidAmount: paid,
      outstandingBalance: inv.totalAmount - paid,
      agingBracket: bracket,
      agingDays: days,
      status,
    };
  });

// ─── Official Receipts ────────────────────────────────────────────

export interface Receipt {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  paymentId: string;
  clientId: string;
  amount: number;
  referenceNumber: string;
  issuedBy: string;
  issuedAt: string;
}

export const SEEDED_RECEIPTS: Receipt[] = [
  {
    id: 'OR-001', receiptNumber: 'OR-2026-0001',
    invoiceId: 'INV-26-001', paymentId: 'PAY-001', clientId: 'ALP-001',
    amount: 351.00, referenceNumber: 'BDO-20260710-001',
    issuedBy: 'EMP-001', issuedAt: '2026-07-10T14:00:00Z',
  },
  {
    id: 'OR-002', receiptNumber: 'OR-2026-0004',
    invoiceId: 'INV-26-004', paymentId: 'PAY-003', clientId: 'ALP-001',
    amount: 100.00, referenceNumber: 'GC-123456',
    issuedBy: 'EMP-003', issuedAt: '2026-07-11T16:00:00Z',
  },
  {
    id: 'OR-003', receiptNumber: 'OR-2026-0005',
    invoiceId: 'INV-26-005', paymentId: 'PAY-004', clientId: 'ZET-001',
    amount: 290.40, referenceNumber: 'BPI-445566',
    issuedBy: 'EMP-003', issuedAt: '2026-07-13T12:00:00Z',
  },
  {
    id: 'OR-004', receiptNumber: 'OR-2026-0004',
    invoiceId: 'INV-26-004', paymentId: 'PAY-005', clientId: 'ALP-001',
    amount: 75.50, referenceNumber: 'MY-112233',
    issuedBy: 'EMP-003', issuedAt: '2026-07-14T12:00:00Z',
  },
  {
    id: 'OR-005', receiptNumber: 'OR-2026-0001',
    invoiceId: 'INV-26-001', paymentId: 'PAY-001', clientId: 'ALP-001',
    amount: 0.00, referenceNumber: 'TEST-000',
    issuedBy: 'EMP-003', issuedAt: '2026-07-14T12:00:00Z',
  },
];

// ─── SpeedPay Submissions ─────────────────────────────────────────

export interface SpeedPaySubmission {
  id: string;
  invoiceId: string;
  clientName: string;
  clientEmail: string;
  paymentMethod: 'GCash' | 'Maya' | 'BDO Online' | 'BPI Online';
  referenceNumber: string;
  amountPaid: number;
  proofFileName: string;
  proofFileUrl?: string;
  submittedAt: string;
  status: 'Pending Validation' | 'Validated' | 'Rejected';
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

export const SEEDED_SPEEDPAY: SpeedPaySubmission[] = [
  { id: 'SP-CAP-001', invoiceId: 'INV-CAP-PAYING', clientName: 'Demo User', clientEmail: 'demo@capstone.ph', paymentMethod: 'GCash', referenceNumber: 'GC-CAP-999', amountPaid: 22400, proofFileName: 'gcash_proof.png', submittedAt: '2026-07-14T09:00:00Z', status: 'Pending Validation' },
  {
    id: 'SP-SUB-001', invoiceId: 'INV-26-002',
    clientName: 'Jane Smith', clientEmail: 'acct@betaretail.ph',
    paymentMethod: 'GCash', referenceNumber: 'GCash-9900-2026-001',
    amountPaid: 240.00, proofFileName: 'gcash_proof_001.jpg',
    submittedAt: '2026-07-08T09:30:00Z', status: 'Pending Validation',
  },
  {
    id: 'SP-SUB-002', invoiceId: 'INV-26-003',
    clientName: 'Peter Jones', clientEmail: 'finance@gammamfg.com',
    paymentMethod: 'BDO Online', referenceNumber: 'BDO-777-2026-002',
    amountPaid: 305.00, proofFileName: 'bdo_transfer_002.pdf',
    submittedAt: '2026-07-09T10:15:00Z', status: 'Pending Validation',
  },
  {
    id: 'SP-SUB-003', invoiceId: 'INV-26-004',
    clientName: 'John Doe', clientEmail: 'billing@alphalog.com',
    paymentMethod: 'Maya', referenceNumber: 'Maya-1122-2026-003',
    amountPaid: 175.50, proofFileName: 'maya_receipt_003.png',
    submittedAt: '2026-07-09T14:45:00Z', status: 'Validated',
    validatedBy: 'EMP-001', validatedAt: '2026-07-09T15:30:00Z'
  },
  {
    id: 'SP-SUB-004', invoiceId: 'INV-26-005',
    clientName: 'Ana Gomez', clientEmail: 'ana@zetafreight.com',
    paymentMethod: 'BPI Online', referenceNumber: 'BPI-4455-2026-004',
    amountPaid: 290.40, proofFileName: 'bpi_proof_004.pdf',
    submittedAt: '2026-07-10T11:20:00Z', status: 'Rejected',
    validatedBy: 'EMP-004', validatedAt: '2026-07-10T12:00:00Z',
    rejectionReason: 'Blurry screenshot, reference number unreadable.'
  },
  {
    id: 'SP-SUB-005', invoiceId: 'INV-26-001',
    clientName: 'John Doe', clientEmail: 'billing@alphalog.com',
    paymentMethod: 'GCash', referenceNumber: 'GCash-8888-2026-005',
    amountPaid: 175.50, proofFileName: 'gcash_proof_005.jpg',
    submittedAt: '2026-07-11T08:10:00Z', status: 'Pending Validation',
  }
];

// ─── Audit Trail ─────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userFullName: string;
  userRole: UserRole;
  action: string;
  module: string;
  recordId: string;
  recordType: string;
  details: string;
  ipAddress: string;
}

export const SEEDED_AUDIT_LOGS: AuditLog[] = [
  { id: 'AL-001', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), userId: 'EMP-001', userFullName: 'Maria Santos', userRole: 'Finance Manager', action: 'LOGIN', module: 'Auth', recordId: 'EMP-001', recordType: 'User', details: 'Successful login', ipAddress: '192.168.1.10' },
  { id: 'AL-002', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), userId: 'EMP-003', userFullName: 'Anna Reyes', userRole: 'Accountant', action: 'INVOICE_CREATED', module: 'Invoicing', recordId: 'INV-26-003', recordType: 'Invoice', details: 'Created invoice INV-2026-003 for Gamma Manufacturing', ipAddress: '192.168.1.12' },
  { id: 'AL-003', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), userId: 'EMP-002', userFullName: 'Juan Dela Cruz', userRole: 'Head Accountant', action: 'INVOICE_VERIFIED', module: 'Invoice Review', recordId: 'INV-26-005', recordType: 'Invoice', details: 'Verified invoice INV-2026-005 for Zeta Freight Solutions', ipAddress: '192.168.1.11' },
  { id: 'AL-004', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), userId: 'EMP-004', userFullName: 'Carlos Mendoza', userRole: 'Assistant of Finance Manager', action: 'PAYMENT_RECORDED', module: 'Payments', recordId: 'PAY-001', recordType: 'Payment', details: 'Recorded payment PAY-001 for INV-2026-001 via Online Bank Transfer', ipAddress: '192.168.1.13' },
  { id: 'AL-005', timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(), userId: 'EMP-001', userFullName: 'Maria Santos', userRole: 'Finance Manager', action: 'PAYMENT_VALIDATED', module: 'Payments', recordId: 'PAY-001', recordType: 'Payment', details: 'Validated payment PAY-001 — bank confirmation received', ipAddress: '192.168.1.10' },
  { id: 'AL-006', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'WAYBILL_ENCODED', module: 'Operations Intake', recordId: 'W-1006', recordType: 'Waybill', details: 'Encoded waybill WB-2026-00106 for Zeta Freight Solutions', ipAddress: '192.168.1.15' },
  { id: 'AL-007', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), userId: 'EMP-003', userFullName: 'Anna Reyes', userRole: 'Accountant', action: 'POD_VALIDATED', module: 'Invoicing', recordId: 'W-1004', recordType: 'Waybill', details: 'Validated original POD for waybill WB-2026-00104', ipAddress: '192.168.1.12' },
  { id: 'AL-008', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'WAYBILL_VALIDATED', module: 'Waybill Records', recordId: 'W-1001', recordType: 'Waybill', details: 'Validated original POD for waybill WB-2026-00101', ipAddress: '192.168.1.15' },
  { id: 'AL-009', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'CLIENT_UPDATED', module: 'Client Accounts', recordId: 'BET-001', recordType: 'Client', details: 'Updated billing details for client Beta Retail Distribution', ipAddress: '192.168.1.15' },
  { id: 'AL-010', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'CTC_SUBMITTED', module: 'Waybill Records', recordId: 'W-1004', recordType: 'Waybill', details: 'Submitted CTC details for waybill WB-2026-00104', ipAddress: '192.168.1.15' },
  { id: 'AL-011', timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'LOGIN', module: 'Auth', recordId: 'EMP-005', recordType: 'User', details: 'Successful login', ipAddress: '192.168.1.15' },
  { id: 'AL-012', timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'WAYBILL_VALIDATED', module: 'Waybill Records', recordId: 'W-1006', recordType: 'Waybill', details: 'Validated original POD for waybill WB-2026-00106', ipAddress: '192.168.1.15' },
  { id: 'AL-013', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'CLIENT_UPDATED', module: 'Client Accounts', recordId: 'ALP-001', recordType: 'Client', details: 'Updated contact person for client Alpha Logistics Tech', ipAddress: '192.168.1.15' },
  { id: 'AL-014', timestamp: new Date(Date.now() - 1000 * 60 * 70).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'WAYBILL_VALIDATED', module: 'Waybill Records', recordId: 'W-1007', recordType: 'Waybill', details: 'Validated original POD for waybill WB-2026-00107', ipAddress: '192.168.1.15' },
  { id: 'AL-015', timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'WAYBILL_VALIDATED', module: 'Waybill Records', recordId: 'W-1008', recordType: 'Waybill', details: 'Validated original POD for waybill WB-2026-00108', ipAddress: '192.168.1.15' },
  { id: 'AL-016', timestamp: new Date(Date.now() - 1000 * 60 * 100).toISOString(), userId: 'EMP-005', userFullName: 'Liza Bautista', userRole: 'Coordinator', action: 'CTC_SUBMITTED', module: 'Waybill Records', recordId: 'W-1002', recordType: 'Waybill', details: 'Submitted CTC details for waybill WB-2026-00102', ipAddress: '192.168.1.15' },
];

// ─── Role-Based Navigation Configuration ──────────────────────────

export interface NavLinkConfig {
  label: string;
  path: string;
  icon: string;
  children?: { label: string; path: string }[];
}

export const NAV_CONFIG: Record<UserRole, { groups: { label?: string; items: NavLinkConfig[] }[] }> = {
  'Coordinator': {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Operations',
        items: [
          { label: 'Client Search', path: '/clients', icon: 'ti ti-search' },
          { label: 'Waybill / POD Records', path: '/waybills', icon: 'ti ti-file-import' },
        ],
      },
    ],
  },
  'Accountant': {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Operations',
        items: [
          { label: 'Client Accounts', path: '/clients', icon: 'ti ti-users' },
          { label: 'Billing Rates', path: '/rate-configuration', icon: 'ti ti-calculator' },
        ],
      },
      {
        label: 'Invoicing',
        items: [
          { label: 'Create Invoice', path: '/invoice-create', icon: 'ti ti-file-plus' },
          { label: 'Invoice List', path: '/invoicing-desk', icon: 'ti ti-file-invoice' },
        ],
      },
      {
        label: 'Receivables & Payments',
        items: [
          { label: 'Accounts Receivable', path: '/accounts-receivable', icon: 'ti ti-report-money' },
          { label: 'Payments', path: '/payments', icon: 'ti ti-cash' },
          { label: 'SpeedPay Validation', path: '/speedpay-validation', icon: 'ti ti-device-mobile-message' },
          { label: 'Official Receipts', path: '/receipts', icon: 'ti ti-receipt' },
        ],
      },
      {
        label: 'Analytics',
        items: [
          { label: 'Reports', path: '/reports', icon: 'ti ti-chart-bar' },
        ],
      },
    ],
  },
  'Head Accountant': {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Auditing & Receivables',
        items: [
          { label: 'Invoice Review', path: '/invoice-review', icon: 'ti ti-file-check' },
          { label: 'Accounts Receivable', path: '/accounts-receivable', icon: 'ti ti-report-money' },
          { label: 'Payment Validation', path: '/payments', icon: 'ti ti-cash' },
        ],
      },
      {
        label: 'Analytics & Control',
        items: [
          { label: 'Reports', path: '/reports', icon: 'ti ti-chart-bar' },
          { label: 'Audit Trail', path: '/audit-trail', icon: 'ti ti-shield-check' },
        ],
      },
    ],
  },
  'Assistant of Finance Manager': {
    groups: [
      {
        label: 'Overview',
        items: [
          { label: 'Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
    ],
  },
  'Finance Manager': {
    groups: [
      {
        label: 'Executive',
        items: [
          { label: 'Executive Dashboard', path: '/dashboard', icon: 'ti ti-layout-dashboard' },
        ],
      },
      {
        label: 'Receivables',
        items: [
          { label: 'Accounts Receivable', path: '/accounts-receivable', icon: 'ti ti-report-money' },
        ],
      },
      {
        label: 'Analytics & Control',
        items: [
          { label: 'Reports', path: '/reports', icon: 'ti ti-chart-bar' },
          { label: 'Audit Trail', path: '/audit-trail', icon: 'ti ti-shield-check' },
        ],
      },
    ],
  },
};

// ─── Extended Invoice Data for Modals ─────────────────────────────

export interface ExtendedInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientBillingAddress: string;
  clientContactDetails: string;
  billingSchedule: 'Weekly' | 'Semi-monthly' | 'Monthly';
  invoiceDate: string;
  dueDate: string;
  waybills: {
    waybillNumber: string;
    documentType: 'Original' | 'Certified True Copy';
    deliveryDate: string;
    deliveryArea: string;
    baseFreightRate: number;
  }[];
  financials: {
    totalBaseFreight: number;
    vatAmount: number;
    surcharges: number;
    invoiceGrossTotal: number;
    creditMemos: number;
    netOutstandingBalance: number;
    invoiceStatus: 'Unpaid' | 'Overdue' | 'Paid';
  };
}

export const SEEDED_EXTENDED_INVOICES: ExtendedInvoice[] = [
  {
    id: 'INV-26-001',
    invoiceNumber: 'INV-2026-001',
    clientId: 'ALP-001',
    clientName: 'Alpha Logistics Tech',
    clientBillingAddress: 'BGC, Taguig City',
    clientContactDetails: 'finance@alphalog.com | 0917-123-4567',
    billingSchedule: 'Monthly',
    invoiceDate: '2026-06-30T10:00:00Z',
    dueDate: '2026-07-30T00:00:00Z',
    waybills: [
      {
        waybillNumber: 'WB-2026-00107',
        documentType: 'Original',
        deliveryDate: '2026-06-15T10:00:00Z',
        deliveryArea: 'BGC, Taguig',
        baseFreightRate: 150.00
      }
    ],
    financials: {
      totalBaseFreight: 150.00,
      vatAmount: 18.00,
      surcharges: 7.50,
      invoiceGrossTotal: 175.50,
      creditMemos: 0.00,
      netOutstandingBalance: 175.50,
      invoiceStatus: 'Paid'
    }
  },
  {
    id: 'INV-26-002',
    invoiceNumber: 'INV-2026-002',
    clientId: 'BET-001',
    clientName: 'Beta Retail Distribution',
    clientBillingAddress: 'Clark, Pampanga',
    clientContactDetails: 'acct@betaretail.ph | 0918-987-6543',
    billingSchedule: 'Semi-monthly',
    invoiceDate: '2026-06-30T11:00:00Z',
    dueDate: '2026-07-05T00:00:00Z',
    waybills: [
      {
        waybillNumber: 'WB-2026-00108',
        documentType: 'Original',
        deliveryDate: '2026-06-20T11:00:00Z',
        deliveryArea: 'Clark, Pampanga',
        baseFreightRate: 200.00
      }
    ],
    financials: {
      totalBaseFreight: 200.00,
      vatAmount: 24.00,
      surcharges: 16.00,
      invoiceGrossTotal: 240.00,
      creditMemos: 0.00,
      netOutstandingBalance: 240.00,
      invoiceStatus: 'Overdue'
    }
  },
  {
    id: 'INV-26-003',
    invoiceNumber: 'INV-2026-003',
    clientId: 'GAM-001',
    clientName: 'Gamma Manufacturing',
    clientBillingAddress: 'Cebu City',
    clientContactDetails: 'finance@gammamfg.com | 0922-555-8888',
    billingSchedule: 'Monthly',
    invoiceDate: '2026-07-06T09:00:00Z',
    dueDate: '2026-08-06T00:00:00Z',
    waybills: [
      {
        waybillNumber: 'WB-2026-00104',
        documentType: 'Certified True Copy',
        deliveryDate: '2026-07-05T09:00:00Z',
        deliveryArea: 'Cebu City',
        baseFreightRate: 250.00
      }
    ],
    financials: {
      totalBaseFreight: 250.00,
      vatAmount: 30.00,
      surcharges: 25.00,
      invoiceGrossTotal: 305.00,
      creditMemos: 0.00,
      netOutstandingBalance: 305.00,
      invoiceStatus: 'Unpaid'
    }
  },
  {
    id: 'INV-26-004',
    invoiceNumber: 'INV-2026-004',
    clientId: 'ALP-001',
    clientName: 'Alpha Logistics Tech',
    clientBillingAddress: 'BGC, Taguig City',
    clientContactDetails: 'finance@alphalog.com | 0917-123-4567',
    billingSchedule: 'Monthly',
    invoiceDate: '2026-07-05T10:00:00Z',
    dueDate: '2026-08-04T00:00:00Z',
    waybills: [
      {
        waybillNumber: 'WB-2026-00101',
        documentType: 'Original',
        deliveryDate: '2026-07-01T10:00:00Z',
        deliveryArea: 'BGC, Taguig',
        baseFreightRate: 150.00
      }
    ],
    financials: {
      totalBaseFreight: 150.00,
      vatAmount: 18.00,
      surcharges: 7.50,
      invoiceGrossTotal: 175.50,
      creditMemos: 0.00,
      netOutstandingBalance: 175.50,
      invoiceStatus: 'Paid'
    }
  },
  {
    id: 'INV-26-005',
    invoiceNumber: 'INV-2026-005',
    clientId: 'ZET-001',
    clientName: 'Zeta Freight Solutions',
    clientBillingAddress: 'Iloilo City',
    clientContactDetails: 'ana@zetafreight.com | 0966-111-5544',
    billingSchedule: 'Semi-monthly',
    invoiceDate: '2026-07-07T08:00:00Z',
    dueDate: '2026-08-07T00:00:00Z',
    waybills: [
      {
        waybillNumber: 'WB-2026-00106',
        documentType: 'Certified True Copy',
        deliveryDate: '2026-07-07T08:00:00Z',
        deliveryArea: 'Iloilo City',
        baseFreightRate: 240.00
      }
    ],
    financials: {
      totalBaseFreight: 240.00,
      vatAmount: 28.80,
      surcharges: 21.60,
      invoiceGrossTotal: 290.40,
      creditMemos: 0.00,
      netOutstandingBalance: 290.40,
      invoiceStatus: 'Paid'
    }
  }
];

// ─── Follow Up Logs ───────────────────────────────────────────────

export interface FollowUpRecord {
  id: string;
  invoiceId: string;
  referenceFields: {
    clientName: string;
    invoiceRefNumber: string;
    agingCategory: '0-30 days' | '31-60 days' | '61-90 days' | '90+ days';
    totalOutstandingAmount: number;
  };
  formInputs: {
    followUpTimestamp: string;
    communicationChannel: 'Phone Call' | 'Email' | 'SMS';
    clientContactPerson: string;
    clientPaymentStatus: 'Billing Approved/Processing Check' | 'Billing Under Review' | 'Check Ready for Pick-up' | 'Discrepancy Flagged by Client';
    expectedCollectionDate: string;
    actionRemarks: string;
    authorizedUserLogged: string;
  };
}

export const FOLLOW_UP_CHANNELS = ['Phone Call', 'Email', 'SMS'] as const;
export const FOLLOW_UP_STATUSES = ['Billing Approved/Processing Check', 'Billing Under Review', 'Check Ready for Pick-up', 'Discrepancy Flagged by Client'] as const;

export const SEEDED_FOLLOW_UP_RECORDS: FollowUpRecord[] = [
  {
    id: 'FU-1001',
    invoiceId: 'INV-26-002',
    referenceFields: {
      clientName: 'Beta Retail Distribution',
      invoiceRefNumber: 'INV-2026-002',
      agingCategory: '31-60 days',
      totalOutstandingAmount: 240.00
    },
    formInputs: {
      followUpTimestamp: '2026-07-10T09:30:00Z',
      communicationChannel: 'Phone Call',
      clientContactPerson: 'Jane Smith (Finance Officer)',
      clientPaymentStatus: 'Check Ready for Pick-up',
      expectedCollectionDate: '2026-07-12T00:00:00Z',
      actionRemarks: 'Check has been signed and is ready for courier pickup this Friday.',
      authorizedUserLogged: 'Carlos Mendoza (Assistant of Finance Manager)'
    }
  },
  {
    id: 'FU-1002',
    invoiceId: 'INV-26-002',
    referenceFields: {
      clientName: 'Beta Retail Distribution',
      invoiceRefNumber: 'INV-2026-002',
      agingCategory: '0-30 days',
      totalOutstandingAmount: 240.00
    },
    formInputs: {
      followUpTimestamp: '2026-07-06T14:15:00Z',
      communicationChannel: 'Email',
      clientContactPerson: 'Jane Smith (Finance Officer)',
      clientPaymentStatus: 'Billing Under Review',
      expectedCollectionDate: '2026-07-15T00:00:00Z',
      actionRemarks: 'Sent a gentle reminder via email. Client responded that they are verifying the waybills.',
      authorizedUserLogged: 'Carlos Mendoza (Assistant of Finance Manager)'
    }
  },
  {
    id: 'FU-1003',
    invoiceId: 'INV-26-003',
    referenceFields: {
      clientName: 'Gamma Manufacturing',
      invoiceRefNumber: 'INV-2026-003',
      agingCategory: '0-30 days',
      totalOutstandingAmount: 305.00
    },
    formInputs: {
      followUpTimestamp: '2026-07-08T10:00:00Z',
      communicationChannel: 'SMS',
      clientContactPerson: 'Peter Jones',
      clientPaymentStatus: 'Billing Approved/Processing Check',
      expectedCollectionDate: '2026-07-25T00:00:00Z',
      actionRemarks: 'Texted Peter. He said it is queued for processing next week.',
      authorizedUserLogged: 'Carlos Mendoza (Assistant of Finance Manager)'
    }
  },
  {
    id: 'FU-1004',
    invoiceId: 'INV-26-001',
    referenceFields: {
      clientName: 'Alpha Logistics Tech',
      invoiceRefNumber: 'INV-2026-001',
      agingCategory: '0-30 days',
      totalOutstandingAmount: 175.50
    },
    formInputs: {
      followUpTimestamp: '2026-07-05T09:00:00Z',
      communicationChannel: 'Phone Call',
      clientContactPerson: 'John Doe',
      clientPaymentStatus: 'Discrepancy Flagged by Client',
      expectedCollectionDate: '2026-07-10T00:00:00Z',
      actionRemarks: 'Client pointed out an incorrect rate. Clarified that it was correct per the new contract.',
      authorizedUserLogged: 'Carlos Mendoza (Assistant of Finance Manager)'
    }
  },
  {
    id: 'FU-1005',
    invoiceId: 'INV-26-005',
    referenceFields: {
      clientName: 'Zeta Freight Solutions',
      invoiceRefNumber: 'INV-2026-005',
      agingCategory: '0-30 days',
      totalOutstandingAmount: 290.40
    },
    formInputs: {
      followUpTimestamp: '2026-07-11T13:30:00Z',
      communicationChannel: 'Email',
      clientContactPerson: 'Ana Gomez',
      clientPaymentStatus: 'Billing Approved/Processing Check',
      expectedCollectionDate: '2026-07-14T00:00:00Z',
      actionRemarks: 'Client confirmed receipt of invoice and will process payment via BPI Online.',
      authorizedUserLogged: 'Carlos Mendoza (Assistant of Finance Manager)'
    }
  }
];
