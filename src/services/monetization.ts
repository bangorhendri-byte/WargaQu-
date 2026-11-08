import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface PaymentSubmission {
  id: string;
  merchantId: string;
  merchantName: string;
  baseAmount: number;
  uniqueCode: number; // 3-digit unique verification code (e.g. 147)
  totalAmount: number; // e.g. 10147
  proofNote: string;
  proofImageUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  verifiedAt?: string;
  reason?: 'closing' | 'threshold' | 'manual';
}

export interface MonetizationConfig {
  enablePosFee: boolean;
  posMode: 'percentage' | 'flat';
  posRate: number; // 1%
  posFlatMonthly: number; // Rp 30.000
  enableMuamalahFee: boolean;
  muamalahRate: number; // 1%
  enableCetakSilsilahFee: boolean;
  cetakSilsilahFee: number; // Rp 10.000
  enableSewaLapakFee: boolean;
  sewaLapakMonthly: number; // Rp 25.000
  thresholdQris: number; // Ambang batas Rp 10.000
  ownerName: string;
  ownerEmail: string;
  qrisImageUrl: string;
  bankName: string;
  bankAccount: string;
  uniqueCodeEnabled: boolean; // Saklar auto 3-digit kode unik
  updatedAt: string;
}

export interface FeeEntry {
  id: string;
  timestamp: string;
  orderId: string;
  module: 'pos' | 'muamalah' | 'silsilah' | 'lapak';
  grossAmount: number;
  feeAmount: number;
  status: 'unbilled' | 'paid';
}

export interface MerchantLedger {
  merchantId: string;
  merchantName: string;
  accumulatedUnbilled: number;
  totalGrossVolume: number;
  totalPaidToOwner: number;
  history: FeeEntry[];
  lastPaymentDate?: string;
}

const DEFAULT_CONFIG: MonetizationConfig = {
  enablePosFee: true,
  posMode: 'percentage',
  posRate: 1, // 1%
  posFlatMonthly: 30000,
  enableMuamalahFee: true,
  muamalahRate: 1,
  enableCetakSilsilahFee: true,
  cetakSilsilahFee: 10000,
  enableSewaLapakFee: true,
  sewaLapakMonthly: 25000,
  thresholdQris: 10000, // Rp 10.000
  ownerName: 'Bangor Hendriana (WargaQu Master)',
  ownerEmail: 'bangorhendri@gmail.com',
  qrisImageUrl: '', // Placeholder (Bisa diisi / menyusul lewat Panel Master)
  bankName: 'BCA / Mandiri / GoPay / DANA',
  bankAccount: 'Hubungi Admin / Menunggu QRIS Resmi',
  uniqueCodeEnabled: true,
  updatedAt: new Date().toISOString()
};

export class MonetizationService {
  private static STORAGE_KEY_CONFIG = 'wargaqu_monetization_config_v1';
  private static STORAGE_KEY_LEDGER = 'wargaqu_merchant_ledger_v1';
  private static STORAGE_KEY_SUBMISSIONS = 'wargaqu_payment_submissions_v1';

  /**
   * Mengambil Konfigurasi Monetisasi (Local-First + Auto Cloud Sync)
   */
  public static getConfig(): MonetizationConfig {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_CONFIG);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch {}
    return { ...DEFAULT_CONFIG };
  }

  /**
   * Menyimpan Konfigurasi Monetisasi (Simpan ke Local + Push ke Firestore)
   */
  public static async saveConfig(config: Partial<MonetizationConfig>): Promise<MonetizationConfig> {
    const current = this.getConfig();
    const updated: MonetizationConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(this.STORAGE_KEY_CONFIG, JSON.stringify(updated));
      // Push ke Firestore global settings
      const docRef = doc(db, 'platform_settings', 'monetization');
      await setDoc(docRef, updated, { merge: true });
    } catch (e) {
      console.warn('Gagal sync config monetisasi ke cloud:', e);
    }
    return updated;
  }

  /**
   * Mengambil Buku Kas (Ledger) Akumulasi Fee Merchant Lokal
   */
  public static getLedger(merchantId = 'merchant_bakso_qu'): MerchantLedger {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_LEDGER);
      if (saved) {
        const parsed: MerchantLedger = JSON.parse(saved);
        if (parsed.merchantId === merchantId) {
          return parsed;
        }
      }
    } catch {}
    return {
      merchantId,
      merchantName: 'UsahaQu - Restoran Bakso Qu',
      accumulatedUnbilled: 0,
      totalGrossVolume: 0,
      totalPaidToOwner: 0,
      history: []
    };
  }

  /**
   * Menyimpan Ledger Merchant
   */
  public static async saveLedger(ledger: MerchantLedger): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY_LEDGER, JSON.stringify(ledger));
      const docRef = doc(db, 'fee_ledgers', ledger.merchantId);
      await setDoc(docRef, {
        ...ledger,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Gagal sync fee ledger ke cloud:', e);
    }
  }

  /**
   * Mencatat Transaksi Penjualan & Menghitung Akumulasi Fee Platform di Belakang Layar
   */
  public static recordTransaction(
    orderId: string,
    grossAmount: number,
    module: 'pos' | 'muamalah' | 'silsilah' | 'lapak' = 'pos'
  ): { feeAmount: number; accumulated: number; triggerPopup: boolean } {
    const config = this.getConfig();
    let feeAmount = 0;

    // Hitung berdasarkan modul & saklar on/off
    if (module === 'pos' && config.enablePosFee) {
      feeAmount = config.posMode === 'percentage'
        ? Math.round((grossAmount * config.posRate) / 100)
        : 0; // Mode flat dihitung per bulan saat closing
    } else if (module === 'muamalah' && config.enableMuamalahFee) {
      feeAmount = Math.round((grossAmount * config.muamalahRate) / 100);
    } else if (module === 'silsilah' && config.enableCetakSilsilahFee) {
      feeAmount = config.cetakSilsilahFee;
    } else if (module === 'lapak' && config.enableSewaLapakFee) {
      feeAmount = config.sewaLapakMonthly;
    }

    const ledger = this.getLedger();
    const newAccumulated = ledger.accumulatedUnbilled + feeAmount;

    const newEntry: FeeEntry = {
      id: `fee_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      orderId,
      module,
      grossAmount,
      feeAmount,
      status: 'unbilled'
    };

    const updatedLedger: MerchantLedger = {
      ...ledger,
      accumulatedUnbilled: newAccumulated,
      totalGrossVolume: ledger.totalGrossVolume + grossAmount,
      history: [newEntry, ...ledger.history].slice(0, 50)
    };

    this.saveLedger(updatedLedger);

    // Cek apakah menyentuh ambang batas (contoh: >= Rp 10.000)
    const triggerPopup = newAccumulated >= config.thresholdQris;

    return {
      feeAmount,
      accumulated: newAccumulated,
      triggerPopup
    };
  }

  /**
   * Pelunasan Setoran Fee Layanan Kasir ke Owner
   */
  public static async markFeeSettled(
    amountSettled: number,
    proofNote = 'Transfer QRIS Berhasil'
  ): Promise<MerchantLedger> {
    const ledger = this.getLedger();
    const remaining = Math.max(0, ledger.accumulatedUnbilled - amountSettled);

    const updatedLedger: MerchantLedger = {
      ...ledger,
      accumulatedUnbilled: remaining,
      totalPaidToOwner: ledger.totalPaidToOwner + amountSettled,
      lastPaymentDate: new Date().toISOString(),
      history: ledger.history.map(h => ({
        ...h,
        status: 'paid'
      }))
    };

    await this.saveLedger(updatedLedger);
    return updatedLedger;
  }

  /**
   * Menghasilkan 3 digit kode unik acak untuk verifikasi transfer manual
   * Contoh: Base tagihan Rp 10.000 + Kode 147 = Rp 10.147
   */
  public static generateUniqueCode(baseAmount: number): { uniqueCode: number; totalWithCode: number } {
    const config = this.getConfig();
    if (!config.uniqueCodeEnabled || baseAmount <= 0) {
      return { uniqueCode: 0, totalWithCode: baseAmount };
    }
    // Generate 3-digit random (101 - 998)
    const uniqueCode = Math.floor(100 + Math.random() * 899);
    return {
      uniqueCode,
      totalWithCode: baseAmount + uniqueCode
    };
  }

  /**
   * Mengambil daftar tiket setoran dari local storage
   */
  public static getLocalSubmissions(): PaymentSubmission[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_SUBMISSIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }

  /**
   * Menyimpan daftar tiket setoran ke local storage
   */
  public static saveLocalSubmissions(submissions: PaymentSubmission[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
    } catch {}
  }

  /**
   * Kasir/Merchant mengajukan tiket konfirmasi setoran QRIS / transfer manual
   */
  public static async createPaymentSubmission(data: {
    merchantId: string;
    merchantName: string;
    baseAmount: number;
    uniqueCode: number;
    totalAmount: number;
    proofNote: string;
    proofImageUrl?: string;
    reason?: 'closing' | 'threshold' | 'manual';
  }): Promise<PaymentSubmission> {
    const newSubmission: PaymentSubmission = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      merchantId: data.merchantId,
      merchantName: data.merchantName,
      baseAmount: data.baseAmount,
      uniqueCode: data.uniqueCode,
      totalAmount: data.totalAmount,
      proofNote: data.proofNote || 'Setoran Closing Kasir',
      proofImageUrl: data.proofImageUrl || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      reason: data.reason || 'closing'
    };

    // Simpan local
    const locals = this.getLocalSubmissions();
    this.saveLocalSubmissions([newSubmission, ...locals].slice(0, 50));

    // Push ke Firestore Cloud real-time
    try {
      const docRef = doc(db, 'payment_submissions', newSubmission.id);
      await setDoc(docRef, newSubmission);
    } catch (e) {
      console.warn('Gagal push tiket setoran ke firestore:', e);
    }

    return newSubmission;
  }

  /**
   * Real-time listener untuk Master Admin HQ memantau setoran masuk
   */
  public static subscribeSubmissions(callback: (submissions: PaymentSubmission[]) => void): () => void {
    try {
      const collRef = collection(db, 'payment_submissions');
      const q = query(collRef, orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, (snapshot) => {
        const items: PaymentSubmission[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as PaymentSubmission);
        });
        if (items.length > 0) {
          this.saveLocalSubmissions(items);
          callback(items);
        } else {
          callback(this.getLocalSubmissions());
        }
      }, (err) => {
        console.warn('Firestore subscription fallback:', err);
        callback(this.getLocalSubmissions());
      });
    } catch {
      callback(this.getLocalSubmissions());
      return () => {};
    }
  }

  /**
   * Owner 1-Klik: Verifikasi Setoran Masuk (Lunas Sesuai Mutasi Bank)
   */
  public static async approvePaymentSubmission(
    submissionId: string,
    merchantId: string,
    baseAmount: number
  ): Promise<void> {
    const verifiedAt = new Date().toISOString();

    // 1. Update status tiket
    try {
      const docRef = doc(db, 'payment_submissions', submissionId);
      await updateDoc(docRef, {
        status: 'verified',
        verifiedAt
      });
    } catch (e) {
      console.warn('Gagal update status tiket di cloud:', e);
    }

    // Update local submission
    const locals = this.getLocalSubmissions();
    const updatedLocals = locals.map(s => s.id === submissionId ? { ...s, status: 'verified' as const, verifiedAt } : s);
    this.saveLocalSubmissions(updatedLocals);

    // 2. Lunaskan buku kas merchant terkait
    await this.markFeeSettled(baseAmount, `Lunas Verifikasi Manual Owner (${submissionId})`);
  }

  /**
   * Owner 1-Klik: Tolak Setoran (Dana Belum Masuk / Nominal Tidak Cocok)
   */
  public static async rejectPaymentSubmission(submissionId: string): Promise<void> {
    try {
      const docRef = doc(db, 'payment_submissions', submissionId);
      await updateDoc(docRef, {
        status: 'rejected'
      });
    } catch (e) {
      console.warn('Gagal tolak tiket:', e);
    }

    const locals = this.getLocalSubmissions();
    const updatedLocals = locals.map(s => s.id === submissionId ? { ...s, status: 'rejected' as const } : s);
    this.saveLocalSubmissions(updatedLocals);
  }
}
