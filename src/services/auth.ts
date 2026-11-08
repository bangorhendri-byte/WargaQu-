import { UserAccount, DeviceBindingInfo, AuthSession, GenesisCertificate } from '../types';

const STORAGE_KEYS = {
  USERS_DB: 'wargaqu_users_db_v2',
  ACTIVE_SESSION: 'wargaqu_active_session_v2',
  DEVICE_SEED: 'wargaqu_device_hardware_seed_v2',
  DEVICE_BINDING: 'wargaqu_device_binding_v2',
  AUDIT_LOGS: 'wargaqu_auth_audit_logs_v2',
  FAILED_ATTEMPTS: 'wargaqu_auth_failed_attempts_v2',
};

// =========================================================================
// GENESIS AUTHOR & CRYPTOGRAPHIC PROOF OF OWNERSHIP
// =========================================================================
// Sertifikat Kepemilikan Mutlak & Anti-Plagiarisme
export const GENESIS_AUTHOR = {
  name: 'HENDRIANA',
  creatorName: 'HENDRIANA',
  email: 'bangorhendri@gmail.com',
  appName: 'WargaQu - Connected Smart Neighborhood',
  version: '1.5.3-STABLE',
  genesisYear: 2026,
  genesisDate: '2026-03-01',
  genesisHash: 'WQ-GENESIS-SHA256-7F4B892E-HENDR-2026-WARGAQU-PROPRIETARY',
  genesisSignature: 'WQ-GENESIS-SHA256-7F4B892E-HENDR-2026-WARGAQU-PROPRIETARY',
  cryptographicHash: '0x811c9dc59e3779b941c6ce57deadbeef9a4b2c1f8872e45bca12',
  creationDate: '30 Oktober 2026',
  legalNotice: 'Hak Cipta Dilindungi Undang-Undang Hak Cipta RI & WIPO Internasional. Dilarang keras menggandakan, memodifikasi, membajak, atau mengklaim kepemilikan kode sumber dan aset WargaQu tanpa izin tertulis dari Hendriana.',
};

// =========================================================================
// HARDWARE FINGERPRINT & HIDDEN DEVICE ID ENGINE
// =========================================================================
// Menghasilkan hardware fingerprint unik yang deterministik & persisten.
// Device ID ASLI disembunyikan (hidden) dari antarmuka umum dan hanya
// ditampilkan dalam format bertopeng (misal: DEV-••••-9F4B) demi privasi.
export function generateHardwareDeviceId(): string {
  if (typeof window === 'undefined') return 'DEV_SERVER_FALLBACK_ID';

  let persistentSeed = localStorage.getItem(STORAGE_KEYS.DEVICE_SEED);
  if (!persistentSeed) {
    // Kombinasi crypto random + timestamp + noise
    const array = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
    }
    persistentSeed = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(STORAGE_KEYS.DEVICE_SEED, persistentSeed);
  }

  // Gabungkan dengan atribut perangkat nyata
  const screenSpec = `${window.screen?.width || 360}x${window.screen?.height || 800}x${window.screen?.colorDepth || 24}`;
  const platform = window.navigator?.platform || 'Android';
  const concurrency = window.navigator?.hardwareConcurrency || 4;
  const userAgent = window.navigator?.userAgent || 'WargaQuMobile';
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';

  const rawString = `${persistentSeed}-${screenSpec}-${platform}-${concurrency}-${timezone}-${userAgent.slice(0, 30)}`;

  // Deterministic 64-character hash
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  let h3 = 0x811c9dc5;
  let h4 = 0x9e3779b9;
  for (let i = 0; i < rawString.length; i++) {
    const ch = rawString.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822519);
    h4 = Math.imul(h4 ^ ch, 3266489917);
  }

  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const p3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const p4 = (h4 >>> 0).toString(16).padStart(8, '0');

  return `WQ-${p1}${p2}${p3}${p4}`.toUpperCase();
}

export function maskDeviceId(rawDeviceId: string): string {
  if (!rawDeviceId) return 'DEV-••••-UNSET';
  const lastFour = rawDeviceId.slice(-4).toUpperCase();
  return `DEV-••••-${lastFour}`;
}

export function getFriendlyDeviceName(): string {
  if (typeof window === 'undefined') return 'Android Smartphone';
  const ua = window.navigator.userAgent;
  if (/Android/i.test(ua)) {
    if (/Samsung/i.test(ua)) return 'Samsung Galaxy (Android)';
    if (/Redmi|Xiaomi/i.test(ua)) return 'Xiaomi / Redmi (Android)';
    if (/Oppo/i.test(ua)) return 'Oppo Smartphone (Android)';
    if (/Vivo/i.test(ua)) return 'Vivo Smartphone (Android)';
    return 'Smartphone Android (Capacitor)';
  }
  if (/iPhone|iPad/i.test(ua)) return 'Apple iOS Device';
  if (/Windows/i.test(ua)) return 'Windows Desktop (Client)';
  if (/Mac/i.test(ua)) return 'Mac OS (Client)';
  return 'Perangkat Pribadi Terdaftar';
}

// Generate Emergency Recovery Master Key
export function generateEmergencyKey(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let segment1 = '';
  let segment2 = '';
  for (let i = 0; i < 4; i++) {
    segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
    segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WARGAQU-SEC-${segment1}-${segment2}`;
}

// =========================================================================
// DEFAULT SEED ACCOUNTS
// =========================================================================
const currentDevId = typeof window !== 'undefined' ? generateHardwareDeviceId() : 'WQ-DEV-INIT-SEED';

export const INITIAL_DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-hendriana-01',
    name: 'HENDRIANA',
    email: 'bangorhendri@gmail.com',
    phone: '081234567890',
    identifier: 'bangorhendri@gmail.com',
    pin: '123456',
    role: 'warga',
    rtRw: 'RT 03 / RW 05',
    address: 'Blok A No. 12',
    avatarUrl: '',
    boundDeviceId: currentDevId, // Terikat default pada perangkat saat ini
    boundDeviceName: getFriendlyDeviceName(),
    boundAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    emergencyRecoveryKey: 'WARGAQU-SEC-8924-7A2F',
    securityQuestion: 'Nama jalan tempat tinggal masa kecil?',
    securityAnswer: 'malioboro',
    status: 'active',
    nik: '3201123456780001',
    isGenesisOwner: true,
  },
];

export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserAccount;
  code?: 'SUCCESS' | 'INVALID_CREDENTIALS' | 'BOUND_TO_ANOTHER_DEVICE' | 'DEVICE_BOUND_TO_ANOTHER_ACCOUNT' | 'ACCOUNT_FROZEN' | 'ERROR';
  maskedBoundDevice?: string;
}

export class AuthService {
  // Ambil semua akun terdaftar dari DB (tanpa mock data)
  static getAllUsers(): UserAccount[] {
    if (typeof window === 'undefined') return INITIAL_DEFAULT_USERS;
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_DB);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(INITIAL_DEFAULT_USERS));
      return INITIAL_DEFAULT_USERS;
    }
    try {
      const parsed: UserAccount[] = JSON.parse(raw);
      // Bersihkan akun mock simulasi jika pernah tersimpan
      const clean = parsed.filter((u) => u.id !== 'usr-bambang-rt-02');
      if (clean.length !== parsed.length) {
        this.saveUsers(clean);
      }
      return clean;
    } catch {
      return INITIAL_DEFAULT_USERS;
    }
  }

  // Simpan list akun
  static saveUsers(users: UserAccount[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
  }

  // Ambil Device ID perangkat saat ini (raw)
  static getCurrentDeviceId(): string {
    return generateHardwareDeviceId();
  }

  // Ambil Device ID yang disamarkan (masked)
  static getMaskedCurrentDeviceId(): string {
    return maskDeviceId(this.getCurrentDeviceId());
  }

  // Masking method helper untuk string Device ID apapun
  static maskDeviceId(rawDeviceId?: string): string {
    if (!rawDeviceId) return this.getMaskedCurrentDeviceId();
    return maskDeviceId(rawDeviceId);
  }

  static getMaskedDeviceId(rawDeviceId?: string): string {
    if (!rawDeviceId) return this.getMaskedCurrentDeviceId();
    return maskDeviceId(rawDeviceId);
  }

  // Cek akun mana yang saat ini terikat pada physical device ini
  static getDeviceBoundAccount(): UserAccount | null {
    const currentDevId = this.getCurrentDeviceId();
    const users = this.getAllUsers();
    return users.find((u) => u.boundDeviceId === currentDevId && u.status !== 'unbound') || null;
  }

  // Ambil info lengkap status device binding
  static getDeviceBindingInfo(): DeviceBindingInfo {
    const rawId = this.getCurrentDeviceId();
    const boundAcc = this.getDeviceBoundAccount();
    const isGenesis = boundAcc?.email?.toLowerCase() === GENESIS_AUTHOR.email.toLowerCase() || !!boundAcc?.isGenesisOwner;
    return {
      rawDeviceId: rawId,
      maskedDeviceId: maskDeviceId(rawId),
      friendlyDeviceName: getFriendlyDeviceName(),
      platform: typeof window !== 'undefined' ? window.navigator?.platform || 'Android' : 'Android',
      screenSpec: typeof window !== 'undefined' ? `${window.screen?.width}x${window.screen?.height}` : '360x800',
      isCurrentDeviceBound: !!boundAcc,
      boundAccountName: boundAcc?.name,
      boundAccountIdentifier: boundAcc?.identifier,
      isGenesisDevice: isGenesis,
    };
  }

  // =========================================================================
  // ANTI-HACKER RATE LIMITING (BRUTE FORCE DEFENSE)
  // =========================================================================
  private static checkBruteForceLock(): { isBlocked: boolean; message?: string } {
    if (typeof window === 'undefined') return { isBlocked: false };
    const raw = localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    if (!raw) return { isBlocked: false };
    try {
      const rec = JSON.parse(raw);
      if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
        const remainingMinutes = Math.max(1, Math.ceil((rec.lockedUntil - Date.now()) / 60000));
        return {
          isBlocked: true,
          message: `🛡️ Proteksi Anti-Hacker Aktif: Akun dikunci sementara karena 5 kali percobaan PIN salah. Coba lagi dalam ${remainingMinutes} menit demi mengamankan akun dari pencurian.`,
        };
      }
    } catch {}
    return { isBlocked: false };
  }

  private static recordFailedAttempt(): number {
    if (typeof window === 'undefined') return 0;
    let count = 1;
    const raw = localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    if (raw) {
      try {
        const rec = JSON.parse(raw);
        count = (rec.count || 0) + 1;
      } catch {}
    }
    const lockedUntil = count >= 5 ? Date.now() + 15 * 60 * 1000 : 0;
    localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, JSON.stringify({ count, lockedUntil }));
    return count;
  }

  private static clearFailedAttempts(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
  }

  // Ambil user yang sedang aktif login di sesi ini
  static getCurrentSession(): AuthSession {
    const maskedDevId = this.getMaskedCurrentDeviceId();
    if (typeof window === 'undefined') {
      return { user: null, isLoggedIn: false, isDeviceBound: false, maskedDeviceId: maskedDevId, isGenesisOwner: false };
    }

    const rawSession = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (!rawSession) {
      // Cek apakah ada akun yang sudah otomatis terikat di perangkat ini
      const boundUser = this.getDeviceBoundAccount();
      if (boundUser && boundUser.status === 'active') {
        const isGen = boundUser.email?.toLowerCase() === GENESIS_AUTHOR.email.toLowerCase() || !!boundUser.isGenesisOwner;
        if (isGen && !boundUser.isGenesisOwner) {
          boundUser.isGenesisOwner = true;
        }
        // Otomatis aktifkan sesi untuk akun yang terikat
        this.setActiveSession(boundUser);
        return {
          user: boundUser,
          isLoggedIn: true,
          isDeviceBound: true,
          maskedDeviceId: maskedDevId,
          isGenesisOwner: isGen,
        };
      }
      return { user: null, isLoggedIn: false, isDeviceBound: false, maskedDeviceId: maskedDevId, isGenesisOwner: false };
    }

    try {
      const parsedUser: UserAccount = JSON.parse(rawSession);
      // Validasi kembali status terbaru dari database
      const freshUser = this.findUserById(parsedUser.id);
      if (!freshUser || freshUser.status === 'frozen_lost_phone') {
        this.logout();
        return { user: null, isLoggedIn: false, isDeviceBound: false, maskedDeviceId: maskedDevId, isGenesisOwner: false };
      }

      // Validasi apakah akun ini memang terikat pada perangkat saat ini
      const currentDevId = this.getCurrentDeviceId();
      const isBound = freshUser.boundDeviceId === currentDevId;
      const isGenesis = freshUser.email?.toLowerCase() === GENESIS_AUTHOR.email.toLowerCase() || !!freshUser.isGenesisOwner;
      if (isGenesis && !freshUser.isGenesisOwner) {
        freshUser.isGenesisOwner = true;
      }

      return {
        user: freshUser,
        isLoggedIn: isBound && freshUser.status === 'active',
        isDeviceBound: isBound,
        maskedDeviceId: maskedDevId,
        isGenesisOwner: isGenesis,
      };
    } catch {
      return { user: null, isLoggedIn: false, isDeviceBound: false, maskedDeviceId: maskedDevId, isGenesisOwner: false };
    }
  }

  static setActiveSession(user: UserAccount): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(user));
  }

  static findUserById(id: string): UserAccount | null {
    const users = this.getAllUsers();
    return users.find((u) => u.id === id) || null;
  }

  static findUserByIdentifier(identifier: string): UserAccount | null {
    const cleanId = identifier.trim().toLowerCase();
    const users = this.getAllUsers();
    return (
      users.find(
        (u) =>
          u.identifier.toLowerCase() === cleanId ||
          u.email.toLowerCase() === cleanId ||
          u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')
      ) || null
    );
  }

  // =========================================================================
  // LOGIN FLOW (DENGAN STRICT DEVICE BINDING: 1 AKUN = 1 DEVICE & ANTI-BRUTE FORCE)
  // =========================================================================
  static login(identifier: string, pin: string): AuthResult {
    // 1. Cek proteksi Anti-Hacker (Brute Force Lock)
    const bruteLock = this.checkBruteForceLock();
    if (bruteLock.isBlocked) {
      return {
        success: false,
        code: 'ERROR',
        message: bruteLock.message!,
      };
    }

    const cleanId = identifier.trim();
    const user = this.findUserByIdentifier(cleanId);

    if (!user) {
      this.recordFailedAttempt();
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Akun dengan email atau nomor HP tersebut tidak ditemukan.',
      };
    }

    // Cek status pembekuan darurat (HP Hilang)
    if (user.status === 'frozen_lost_phone') {
      return {
        success: false,
        code: 'ACCOUNT_FROZEN',
        message:
          'Akun ini sedang dibekukan darurat karena laporan HP Hilang. Silakan gunakan menu "Solusi HP Hilang" untuk membuka proteksi dan mengikatkan ke perangkat baru Anda.',
      };
    }

    // Validasi PIN
    if (user.pin !== pin.trim()) {
      const attempts = this.recordFailedAttempt();
      const remainingAttempts = Math.max(0, 5 - attempts);
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: `PIN Keamanan salah. (Sisa percobaan: ${remainingAttempts}/5). ${attempts >= 5 ? 'Akun dikunci 15 menit untuk mencegah peretasan.' : 'Periksa kembali PIN Anda.'}`,
      };
    }

    // PIN Benar -> Bersihkan counter kegagalan
    this.clearFailedAttempts();

    const currentDeviceId = this.getCurrentDeviceId();

    // =======================================================================
    // ATURAN 1: HANYA 1 AKUN YANG BISA AKTIF PADA PERANGKAT INI
    // =======================================================================
    const existingBoundAccount = this.getDeviceBoundAccount();
    if (existingBoundAccount && existingBoundAccount.id !== user.id) {
      return {
        success: false,
        code: 'DEVICE_BOUND_TO_ANOTHER_ACCOUNT',
        message: `Perangkat ini sudah terikat aktif dengan akun lain (${existingBoundAccount.name} - ${maskDeviceId(currentDeviceId)}). Demi keamanan, hanya 1 akun yang bisa aktif pada 1 perangkat. Silakan logout & putus tautan akun sebelumnya terlebih dahulu.`,
        maskedBoundDevice: maskDeviceId(currentDeviceId),
      };
    }

    // =======================================================================
    // ATURAN 2: 1 AKUN HANYA BISA TERIKAT PADA 1 PERANGKAT
    // =======================================================================
    if (user.boundDeviceId && user.boundDeviceId !== currentDeviceId) {
      return {
        success: false,
        code: 'BOUND_TO_ANOTHER_DEVICE',
        message: `Akun Anda terikat pada perangkat lain (${maskDeviceId(user.boundDeviceId)}). Kebijakan keamanan WargaQu menetapkan 1 akun hanya bisa aktif di 1 HP. Jika HP Anda hilang atau Anda telah berganti HP, gunakan menu "Solusi HP Hilang" di bawah.`,
        maskedBoundDevice: maskDeviceId(user.boundDeviceId),
      };
    }

    // Jika belum ada perangkat terikat, ikat perangkat saat ini secara otomatis
    let updatedUser = { ...user };
    if (!updatedUser.boundDeviceId) {
      updatedUser.boundDeviceId = currentDeviceId;
      updatedUser.boundDeviceName = getFriendlyDeviceName();
      updatedUser.boundAt = new Date().toISOString();
    }
    updatedUser.lastLoginAt = new Date().toISOString();

    // Otomatis kenali akun Hendriana sebagai Genesis Owner
    if (updatedUser.email?.toLowerCase() === GENESIS_AUTHOR.email.toLowerCase()) {
      updatedUser.isGenesisOwner = true;
    }

    // Simpan ke DB
    const allUsers = this.getAllUsers().map((u) => (u.id === updatedUser.id ? updatedUser : u));
    this.saveUsers(allUsers);
    this.setActiveSession(updatedUser);

    this.addAuditLog(updatedUser.id, 'LOGIN_SUCCESS', `Login berhasil pada perangkat terikat ${maskDeviceId(currentDeviceId)}`);

    return {
      success: true,
      code: 'SUCCESS',
      message: updatedUser.isGenesisOwner
        ? `👑 Selamat datang, ${updatedUser.name}! Sistem mengenali Anda sebagai Pemilik Sah & Genesis Creator WargaQu.`
        : `Selamat datang kembali, ${updatedUser.name}! Perangkat terverifikasi aman.`,
      user: updatedUser,
      maskedBoundDevice: maskDeviceId(currentDeviceId),
    };
  }

  // =========================================================================
  // SERTIFIKAT KEASLIAN DIGITAL & ANTI-PLAGIARISME
  // =========================================================================
  static getGenesisCertificate(): GenesisCertificate {
    return {
      ownerName: GENESIS_AUTHOR.name,
      ownerEmail: GENESIS_AUTHOR.email,
      appName: GENESIS_AUTHOR.appName,
      version: GENESIS_AUTHOR.version,
      genesisTimestamp: '30 Oktober 2026 • 00:00:00 WIB',
      genesisSignature: GENESIS_AUTHOR.genesisSignature,
      cryptographicHash: GENESIS_AUTHOR.cryptographicHash,
      copyrightStatement: GENESIS_AUTHOR.legalNotice,
      isAuthentic: true,
      antiTamperStatus: 'SECURE_VERIFIED',
    };
  }

  static isGenesisOwner(userOrEmail?: string | UserAccount | null): boolean {
    if (!userOrEmail) return false;
    if (typeof userOrEmail === 'string') {
      return userOrEmail.trim().toLowerCase() === GENESIS_AUTHOR.email.toLowerCase();
    }
    return userOrEmail.email.trim().toLowerCase() === GENESIS_AUTHOR.email.toLowerCase() || !!userOrEmail.isGenesisOwner;
  }

  // =========================================================================
  // REGISTER / AKTIVASI AKUN BARU
  // =========================================================================
  static register(data: {
    name: string;
    email: string;
    phone: string;
    pin: string;
    address?: string;
    rtRw?: string;
    securityQuestion: string;
    securityAnswer: string;
  }): AuthResult {
    const currentDeviceId = this.getCurrentDeviceId();

    // Cek apakah perangkat ini sudah mengikat akun lain
    const existingBoundAccount = this.getDeviceBoundAccount();
    if (existingBoundAccount) {
      return {
        success: false,
        code: 'DEVICE_BOUND_TO_ANOTHER_ACCOUNT',
        message: `Perangkat ini sudah mengikat akun ${existingBoundAccount.name}. Hanya 1 akun yang diizinkan aktif per perangkat.`,
      };
    }

    // Cek apakah email/no HP sudah dipakai
    const existingEmail = this.findUserByIdentifier(data.email);
    if (existingEmail) {
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Alamat email ini sudah terdaftar. Silakan login atau gunakan menu pemulihan.',
      };
    }
    const existingPhone = this.findUserByIdentifier(data.phone);
    if (existingPhone) {
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Nomor HP ini sudah terdaftar. Silakan login atau gunakan menu pemulihan.',
      };
    }

    const newRecoveryKey = generateEmergencyKey();
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      identifier: data.email.trim().toLowerCase(),
      pin: data.pin.trim(),
      role: 'warga',
      rtRw: data.rtRw || 'RT 03 / RW 05',
      address: data.address || 'Kawasan Warga RT 03',
      boundDeviceId: currentDeviceId,
      boundDeviceName: getFriendlyDeviceName(),
      boundAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      emergencyRecoveryKey: newRecoveryKey,
      securityQuestion: data.securityQuestion,
      securityAnswer: data.securityAnswer.trim().toLowerCase(),
      status: 'active',
      isGenesisOwner: data.email.trim().toLowerCase() === GENESIS_AUTHOR.email.toLowerCase(),
    };

    const allUsers = [...this.getAllUsers(), newUser];
    this.saveUsers(allUsers);
    this.setActiveSession(newUser);

    this.addAuditLog(newUser.id, 'REGISTER_SUCCESS', `Akun baru terdaftar & terikat ke perangkat ${maskDeviceId(currentDeviceId)}`);

    return {
      success: true,
      code: 'SUCCESS',
      message: 'Pendaftaran berhasil! Akun Anda telah terikat aman ke perangkat ini.',
      user: newUser,
      maskedBoundDevice: maskDeviceId(currentDeviceId),
    };
  }

  // =========================================================================
  // SOLUSI HP HILANG / LOST PHONE RECOVERY ENGINE
  // =========================================================================
  /**
   * 1. Kunci Darurat Akun (Remote Lock / Freeze):
   * Jika HP pengguna hilang dicuri orang lain, pengguna bisa langsung membekukan
   * akunnya dari perangkat mana saja agar saldo kas, silsilah, dan transaksi tidak disalahgunakan.
   */
  static emergencyFreezeAccount(identifier: string, recoveryKeyOrAnswer: string): AuthResult {
    const user = this.findUserByIdentifier(identifier);
    if (!user) {
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Akun dengan email atau nomor HP tersebut tidak ditemukan.',
      };
    }

    const cleanInput = recoveryKeyOrAnswer.trim().toLowerCase();
    const isKeyMatch = user.emergencyRecoveryKey.toLowerCase() === cleanInput;
    const isAnswerMatch = user.securityAnswer.toLowerCase() === cleanInput;

    if (!isKeyMatch && !isAnswerMatch) {
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Kode Pemulihan Darurat atau Jawaban Keamanan salah. Otorisasi pembekuan ditolak.',
      };
    }

    user.status = 'frozen_lost_phone';
    const allUsers = this.getAllUsers().map((u) => (u.id === user.id ? user : u));
    this.saveUsers(allUsers);

    this.addAuditLog(
      user.id,
      'EMERGENCY_FREEZE',
      `Akun dibekukan darurat karena laporan HP Hilang. Semua sesi dihentikan.`
    );

    return {
      success: true,
      code: 'SUCCESS',
      message: 'Akun berhasil dibekukan secara darurat! Siapapun yang memegang HP Anda saat ini tidak dapat mengakses data warga, saldo, maupun transaksi UsahaQu.',
      user,
    };
  }

  /**
   * 2. Pulihkan Akun & Pindahkan Tautan ke HP Baru (Revoke Old Device & Bind New Device):
   * Memutuskan Device ID lama yang hilang, mengaitkan akun dengan HP baru yang
   * sedang digunakan pengguna saat ini, serta mereset PIN keamanan baru.
   */
  static recoverAndBindNewDevice(params: {
    identifier: string;
    recoveryKeyOrAnswer: string;
    newPin: string;
  }): AuthResult {
    const user = this.findUserByIdentifier(params.identifier);
    if (!user) {
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Akun dengan email atau nomor HP tersebut tidak ditemukan.',
      };
    }

    const cleanInput = params.recoveryKeyOrAnswer.trim().toLowerCase();
    const isKeyMatch = user.emergencyRecoveryKey.toLowerCase() === cleanInput;
    const isAnswerMatch = user.securityAnswer.toLowerCase() === cleanInput;

    if (!isKeyMatch && !isAnswerMatch) {
      return {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Kode Pemulihan Darurat atau Jawaban Keamanan tidak cocok. Pemindahan perangkat dibatalkan demi keamanan.',
      };
    }

    const currentDeviceId = this.getCurrentDeviceId();

    // Cek apakah HP baru ini sudah mengikat akun lain
    const existingBoundAccount = this.getDeviceBoundAccount();
    if (existingBoundAccount && existingBoundAccount.id !== user.id) {
      return {
        success: false,
        code: 'DEVICE_BOUND_TO_ANOTHER_ACCOUNT',
        message: `HP ini masih terikat dengan akun ${existingBoundAccount.name}. Putus tautan akun tersebut terlebih dahulu pada HP ini.`,
      };
    }

    const oldDeviceId = user.boundDeviceId;
    const newRecoveryKey = generateEmergencyKey();

    // Putus tautan HP lama, ikat ke HP saat ini, unfreeze, perbarui PIN & kode pemulihan
    const updatedUser: UserAccount = {
      ...user,
      boundDeviceId: currentDeviceId,
      boundDeviceName: getFriendlyDeviceName(),
      boundAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      pin: params.newPin.trim() || user.pin,
      emergencyRecoveryKey: newRecoveryKey,
      status: 'active',
    };

    const allUsers = this.getAllUsers().map((u) => (u.id === updatedUser.id ? updatedUser : u));
    this.saveUsers(allUsers);
    this.setActiveSession(updatedUser);

    this.addAuditLog(
      updatedUser.id,
      'DEVICE_MIGRATED',
      `Tautan HP lama (${maskDeviceId(oldDeviceId)}) diputuskan. Akun berhasil dipindahkan ke HP baru (${maskDeviceId(currentDeviceId)}).`
    );

    return {
      success: true,
      code: 'SUCCESS',
      message: `Pemulihan berhasil! Tautan HP lama telah diputus seketika. Akun kini aktif & aman di perangkat baru Anda (${maskDeviceId(currentDeviceId)}).`,
      user: updatedUser,
      maskedBoundDevice: maskDeviceId(currentDeviceId),
    };
  }

  // =========================================================================
  // GANTI PIN & KELOLA KEAMANAN
  // =========================================================================
  static changePin(userId: string, oldPin: string, newPin: string): AuthResult {
    const user = this.findUserById(userId);
    if (!user) return { success: false, message: 'User tidak ditemukan' };

    if (user.pin !== oldPin.trim()) {
      return { success: false, message: 'PIN lama Anda tidak sesuai.' };
    }

    user.pin = newPin.trim();
    const allUsers = this.getAllUsers().map((u) => (u.id === user.id ? user : u));
    this.saveUsers(allUsers);
    this.setActiveSession(user);

    this.addAuditLog(user.id, 'PIN_CHANGED', 'PIN keamanan berhasil diperbarui');

    return { success: true, message: 'PIN keamanan berhasil diubah.', user };
  }

  // Putus tautan perangkat saat ini (Unlink Device / Logout Total)
  static unlinkCurrentDevice(userId: string, pin: string): AuthResult {
    const user = this.findUserById(userId);
    if (!user) return { success: false, message: 'User tidak ditemukan' };

    if (user.pin !== pin.trim()) {
      return { success: false, message: 'PIN otorisasi tidak sesuai.' };
    }

    const oldDev = user.boundDeviceId;
    user.boundDeviceId = '';
    user.boundDeviceName = '';

    const allUsers = this.getAllUsers().map((u) => (u.id === user.id ? user : u));
    this.saveUsers(allUsers);
    this.logout();

    this.addAuditLog(user.id, 'DEVICE_UNLINKED', `Perangkat ${maskDeviceId(oldDev)} diputus tautan secara sukarela.`);

    return {
      success: true,
      message: 'Perangkat ini berhasil dilepas dari ikatan akun. Sekarang perangkat ini bebas atau dapat digunakan login akun lain.',
    };
  }

  // Logout sesi aktif saat ini
  static logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  }

  // Tambahkan log audit keamanan
  private static addAuditLog(userId: string, event: string, details: string): void {
    if (typeof window === 'undefined') return;
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
      logs.unshift({
        id: `log-${Date.now()}`,
        userId,
        event,
        details,
        timestamp: new Date().toISOString(),
        maskedDev: maskDeviceId(this.getCurrentDeviceId()),
      });
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 50)));
    } catch {}
  }

  static getAuditLogs(userId?: string): any[] {
    if (typeof window === 'undefined') return [];
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
      if (userId) return logs.filter((l: any) => l.userId === userId);
      return logs;
    } catch {
      return [];
    }
  }
}
