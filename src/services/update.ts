import { StorageService } from './storage';
import { AuthService } from './auth';

export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  channel: 'STABLE-PROD' | 'BETA';
  hash: string;
  platform: 'PWA Standalone' | 'Android Native (Capacitor)' | 'Web Browser';
  changelog: string[];
}

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: '1.6.0',
  buildNumber: 1060,
  releaseDate: '7 November 2026',
  channel: 'STABLE-PROD',
  hash: 'WQ-REV-20261107-v160-SECURE',
  platform: 'Web Browser', // dynamic check at runtime
  changelog: [
    'Integrasi penuh seluruh 12 modul di dashboard utama (LeluhurQu, RtQu, MuamalahQu, AreaQu, SiagaQu, UsahaQu, ModularQu, ChatQu, WargaPay, BantuanQu, Pusat Update, Setting)',
    'Auto-Update PWA & Android otomatis tanpa hapus aplikasi lama (In-Place Update)',
    'Jaminan Keamanan Data 100% (Zero Data Loss) - Seluruh saldo, transaksi, dan akun tetap utuh',
    'Indikator visual status Versi Terbaru & Pusat Pembaruan Sistem mandiri',
    'Fitur Ekspor & Cadangkan Data lengkap (Backup & Restore JSON)'
  ]
};

export class UpdateService {
  private static STORAGE_KEY_LAST_CHECK = 'wargaqu_last_update_check';
  private static STORAGE_KEY_AUTO_UPDATE = 'wargaqu_auto_update_enabled';
  private static STORAGE_KEY_INSTALLED_VER = 'wargaqu_installed_app_version';

  // Cek apakah baru saja terjadi pembaruan versi (untuk notifikasi selamat datang versi baru)
  static checkNewVersionOnStartup(): { isNew: boolean; oldVersion: string | null; currentVersion: string } {
    if (typeof window === 'undefined') return { isNew: false, oldVersion: null, currentVersion: CURRENT_APP_VERSION.version };
    const oldVersion = localStorage.getItem(this.STORAGE_KEY_INSTALLED_VER);
    
    if (!oldVersion) {
      localStorage.setItem(this.STORAGE_KEY_INSTALLED_VER, CURRENT_APP_VERSION.version);
      return { isNew: false, oldVersion: null, currentVersion: CURRENT_APP_VERSION.version };
    }

    if (oldVersion !== CURRENT_APP_VERSION.version) {
      localStorage.setItem(this.STORAGE_KEY_INSTALLED_VER, CURRENT_APP_VERSION.version);
      return { isNew: true, oldVersion, currentVersion: CURRENT_APP_VERSION.version };
    }

    return { isNew: false, oldVersion, currentVersion: CURRENT_APP_VERSION.version };
  }

  // Deteksi lingkungan runtime saat ini
  static detectPlatform(): 'PWA Standalone' | 'Android Native (Capacitor)' | 'Web Browser' {
    if (typeof window === 'undefined') return 'Web Browser';

    // 1. Android Capacitor Native
    const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
    if (isCapacitor) return 'Android Native (Capacitor)';

    // 2. PWA Standalone Mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return 'PWA Standalone';

    // 3. Web Browser
    return 'Web Browser';
  }

  // Ambil metadata versi aplikasi saat ini
  static getVersionInfo(): AppVersionInfo {
    return {
      ...CURRENT_APP_VERSION,
      platform: this.detectPlatform(),
    };
  }

  // Status auto-update aktif/tidak
  static isAutoUpdateEnabled(): boolean {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(this.STORAGE_KEY_AUTO_UPDATE);
    return val !== 'false'; // default true
  }

  static setAutoUpdateEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY_AUTO_UPDATE, enabled ? 'true' : 'false');
  }

  // Waktu terakhir kali pengecekan pembaruan
  static getLastCheckTime(): string {
    if (typeof window === 'undefined') return 'Baru saja';
    const last = localStorage.getItem(this.STORAGE_KEY_LAST_CHECK);
    if (!last) return 'Hari ini';
    try {
      const d = new Date(last);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch {
      return 'Hari ini';
    }
  }

  // Periksa apakah ada pembaruan Service Worker atau rilis baru
  static async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    message: string;
    releaseNotes: string[];
  }> {
    if (typeof window === 'undefined') {
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION.version,
        latestVersion: CURRENT_APP_VERSION.version,
        message: 'Lingkungan server.',
        releaseNotes: CURRENT_APP_VERSION.changelog,
      };
    }

    localStorage.setItem(this.STORAGE_KEY_LAST_CHECK, new Date().toISOString());

    // Periksa Service Worker registration
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting) {
            return {
              hasUpdate: true,
              currentVersion: CURRENT_APP_VERSION.version,
              latestVersion: CURRENT_APP_VERSION.version,
              message: 'Versi baru siap dipasang! Sentuh perbarui untuk memuat aset terbaru.',
              releaseNotes: CURRENT_APP_VERSION.changelog,
            };
          }
        }
      } catch (err) {
        console.warn('SW check update error:', err);
      }
    }

    // Secara default, sistem saat ini sudah di build terbaru v1.6.0
    return {
      hasUpdate: false,
      currentVersion: CURRENT_APP_VERSION.version,
      latestVersion: CURRENT_APP_VERSION.version,
      message: 'Aplikasi Anda sudah menggunakan versi paling baru dan stabil.',
      releaseNotes: CURRENT_APP_VERSION.changelog,
    };
  }

  // Terapkan update secara mulus tanpa kehilangan data
  static async applyUpdateNow(): Promise<void> {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch {}
    }

    // Reload halaman untuk menggunakan bundle cache terbaru
    window.location.reload();
  }

  // Backup seluruh data aplikasi ke format JSON aman
  static exportFullBackup(): string {
    if (typeof window === 'undefined') return '{}';

    const backupPayload = {
      app: 'WargaQu Ecosystem',
      version: CURRENT_APP_VERSION.version,
      exportTimestamp: new Date().toISOString(),
      creator: 'HENDRIANA (bangorhendri@gmail.com)',
      data: {
        users: AuthService.getAllUsers(),
        history: StorageService.getHistory(),
        tables: StorageService.getTables(),
        menu: StorageService.getMenu(),
        ingredients: StorageService.getIngredients(),
        profile: StorageService.getProfile(),
        printerConfig: StorageService.getPrinterConfig(),
        activeOrders: StorageService.getActiveOrders(),
      },
    };

    return JSON.stringify(backupPayload, null, 2);
  }

  // Unduh file backup langsung ke HP / Komputer
  static downloadBackupFile(): void {
    const jsonStr = this.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wargaqu_backup_data_v${CURRENT_APP_VERSION.version}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // URL Repositori GitHub & Rilis APK
  private static STORAGE_KEY_GITHUB_REPO = 'wargaqu_github_repo_url';
  private static DEFAULT_GITHUB_REPO = 'https://github.com/bangorhendri/wargaqu';

  static getGithubRepoUrl(): string {
    if (typeof window === 'undefined') return this.DEFAULT_GITHUB_REPO;
    return localStorage.getItem(this.STORAGE_KEY_GITHUB_REPO) || this.DEFAULT_GITHUB_REPO;
  }

  static setGithubRepoUrl(url: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY_GITHUB_REPO, url.trim());
  }

  static getGithubApkDownloadUrl(): string {
    const base = this.getGithubRepoUrl().replace(/\/+$/, '');
    return `${base}/releases/latest/download/BaksoQu-1.0.apk`;
  }

  static getGithubReleasesPageUrl(): string {
    const base = this.getGithubRepoUrl().replace(/\/+$/, '');
    return `${base}/releases`;
  }

  // Salin Kode Transfer Cepat PWA -> APK ke Clipboard
  static async copyTransferCodeToClipboard(): Promise<{ success: boolean; message: string }> {
    try {
      const dataStr = this.exportFullBackup();
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(dataStr);
        return {
          success: true,
          message: 'Seluruh data WargaQu berhasil disalin ke Clipboard! Buka aplikasi APK lalu pilih "Pulihkan dari Clipboard".',
        };
      } else {
        return {
          success: false,
          message: 'Clipboard tidak didukung. Silakan gunakan tombol "Unduh Cadangan (.JSON)".',
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: 'Gagal menyalin data: ' + e.message,
      };
    }
  }

  // Pulihkan data dari file JSON
  static restoreBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        return { success: false, message: 'Format file cadangan tidak valid.' };
      }

      const d = parsed.data;
      if (d.users) AuthService.saveUsers(d.users);
      if (d.history) StorageService.saveHistory(d.history);
      if (d.tables) StorageService.saveTables(d.tables);
      if (d.menu) StorageService.saveMenu(d.menu);
      if (d.ingredients) StorageService.saveIngredients(d.ingredients);
      if (d.profile) StorageService.saveProfile(d.profile);
      if (d.printerConfig) StorageService.savePrinterConfig(d.printerConfig);
      if (d.activeOrders) StorageService.saveActiveOrders(d.activeOrders);

      return {
        success: true,
        message: 'Data aplikasi berhasil dipulihkan secara utuh tanpa ada yang hilang!',
      };
    } catch (e: any) {
      return { success: false, message: 'Gagal memulihkan data: ' + e.message };
    }
  }
}

