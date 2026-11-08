export type TableStatus = 'kosong' | 'terisi' | 'menunggu_bayar';

export interface TableItem {
  id: string;
  name: string;
  number: number;
  status: TableStatus;
  orderId?: string;
  customerName?: string;
  pax?: number;
  totalAmount?: number;
  itemsCount?: number;
  openedAt?: string;
  positionIndex: number;
}

export type MenuCategory = 'bakso_kuah' | 'pelengkap' | 'minuman' | 'paket';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description: string;
  imageUrl: string;
  isAvailable: boolean;
}

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type OrderType = 'meja' | 'bungkus';

export type PaymentMethod = 'tunai' | 'qris';

export interface Order {
  id: string;
  receiptNumber: string;
  type: OrderType;
  tableId?: string;
  tableName?: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: 'draft' | 'saved' | 'paid' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  cashAmount?: number;
  changeAmount?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  initialQty: number;
  unit: 'kg' | 'gr' | 'pcs' | 'liter' | 'ikat' | 'pack';
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  updatedAt: string;
}

export interface RestaurantProfile {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  receiptHeader: string;
  receiptFooter: string;
  currency: string;
}

export interface PrinterConfig {
  paperSize: '58mm' | '80mm';
  autoPrintKitchen: boolean;
  autoPrintReceipt: boolean;
  connectedDeviceName?: string;
  isSimulator: boolean;
}

// ==========================================
// MODULARQU (USAHAQU POS MODULAR) TYPES
// ==========================================
export interface ModularProduct {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
}

export interface ModularCartItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  qty: number;
}

export interface ModularExpense {
  id: string;
  desc: string;
  amount: number;
  category: 'Bahan Baku' | 'Operasional' | 'Gaji & Perawatan' | 'Lainnya' | string;
  date: string;
}

export interface ModularTransaction {
  id: string;
  date: string;
  items: ModularCartItem[];
  total: number;
  totalCost: number;
  payAmount: number;
  change: number;
  payMethod: 'Tunai' | 'QRIS / Transfer' | 'Tempo / Utang' | string;
  note: string;
}

export interface ModularProfile {
  bizName: string;
  bizType: string;
  address: string;
  phone: string;
  footer: string;
}

// ==========================================
// PUSAT BANTUAN & SMART CARE TICKET TYPES
// ==========================================
export interface SupportTicket {
  id: string;
  time: string;
  complaint: string;
  device: string;
  severity: 'High Severity' | 'Medium' | 'Low' | 'Auto Analyzed';
  status: 'open' | 'resolved';
  module: string;
  detectedError: string;
  prompt: string;
}

// ==========================================
// WARGAQU AUTH & DEVICE BINDING TYPES
// ==========================================
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  identifier: string; // email or phone
  pin: string; // 6-digit secure PIN
  role: 'warga' | 'pengurus_rt' | 'pelaku_usaha';
  rtRw: string;
  address: string;
  avatarUrl?: string;
  boundDeviceId: string; // raw hardware fingerprint hash (disembunyikan dari UI)
  boundDeviceName: string; // e.g. "Smartphone Android"
  boundAt: string;
  lastLoginAt: string;
  emergencyRecoveryKey: string; // Master Key e.g. "WARGAQU-SEC-8924-7A2F"
  securityQuestion: string;
  securityAnswer: string;
  status: 'active' | 'frozen_lost_phone' | 'unbound';
  nik?: string;
  isGenesisOwner?: boolean; // Tanda bukti kepemilikan mutlak pencipta pertama
}

export interface DeviceBindingInfo {
  rawDeviceId: string;
  maskedDeviceId: string; // e.g. "DEV-••••-9F4B"
  friendlyDeviceName: string;
  platform: string;
  screenSpec: string;
  isCurrentDeviceBound: boolean;
  boundAccountName?: string;
  boundAccountIdentifier?: string;
  isGenesisDevice?: boolean;
}

export interface AuthSession {
  user: UserAccount | null;
  isLoggedIn: boolean;
  isDeviceBound: boolean;
  maskedDeviceId: string;
  isGenesisOwner?: boolean;
}

export interface GenesisCertificate {
  ownerName: string;
  ownerEmail: string;
  appName: string;
  version: string;
  genesisTimestamp: string;
  genesisSignature: string;
  cryptographicHash: string;
  copyrightStatement: string;
  isAuthentic: boolean;
  antiTamperStatus: 'SECURE_VERIFIED' | 'TAMPER_DETECTED';
}

