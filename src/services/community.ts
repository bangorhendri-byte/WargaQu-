export interface RtCommunity {
  id: string;
  name: string;
  inviteCode: string;
  rtNumber: string;
  rwNumber: string;
  kelurahan: string;
  kecamatan: string;
  ketuaRtName: string;
  posRondaPhone: string;
  posRondaLocation: string;
  totalWarga: number;
  isJoined: boolean;
  joinedAt?: string;
  memberRole: 'Warga Tetap' | 'Pengurus RT' | 'Warga Tamu';
  description?: string;
}

const STORAGE_KEY_COMMUNITY = 'wargaqu_rt_community_v2';

export const DEFAULT_COMMUNITY: RtCommunity = {
  id: 'RT03-RW05-BOGOR',
  name: 'RT 03 / RW 05 - Paguyuban Warga Asri',
  inviteCode: 'WARGAQU-RT03-RW05-7721',
  rtNumber: '03',
  rwNumber: '05',
  kelurahan: 'Sukasari',
  kecamatan: 'Bogor Selatan',
  ketuaRtName: 'Bpk. Bambang Sutrisno',
  posRondaPhone: '0812-3456-7890',
  posRondaLocation: 'Pos Kamling Blok B No. 12',
  totalWarga: 42,
  isJoined: true, // Default terhubung untuk akun demo Hendriana
  joinedAt: '2026-01-15T08:00:00.000Z',
  memberRole: 'Warga Tetap',
  description: 'Komunitas warga guyub rukun RT 03 RW 05 dengan sistem ronda malam terpadu dan respons darurat SiagaQu.',
};

export class CommunityService {
  static getCommunity(): RtCommunity {
    if (typeof window === 'undefined') return DEFAULT_COMMUNITY;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMMUNITY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Gagal memuat data komunitas RT:', e);
    }
    // Simpan default awal
    this.saveCommunity(DEFAULT_COMMUNITY);
    return DEFAULT_COMMUNITY;
  }

  static saveCommunity(comm: RtCommunity): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_COMMUNITY, JSON.stringify(comm));
    } catch (e) {
      console.error('Gagal menyimpan data komunitas RT:', e);
    }
  }

  // Apakah SiagaQu aktif (hanya aktif jika warga tergabung dalam RTQu / PaguyubanQu)
  static isSiagaQuActive(): boolean {
    const comm = this.getCommunity();
    return !!comm && comm.isJoined;
  }

  // Gabung ke RT / Paguyuban via Kode Undangan
  static joinByInviteCode(
    codeInput: string,
    role: 'Warga Tetap' | 'Pengurus RT' | 'Warga Tamu' = 'Warga Tetap'
  ): { success: boolean; message: string; community?: RtCommunity } {
    const cleanCode = codeInput.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Kode undangan tidak boleh kosong.' };
    }

    const current = this.getCommunity();

    // Verifikasi kode undangan (bisa format WARGAQU-RT... atau kode custom)
    if (
      cleanCode === current.inviteCode.toUpperCase() ||
      cleanCode.includes('RT03') ||
      cleanCode.includes('WARGAQU') ||
      cleanCode.startsWith('RT-') ||
      cleanCode.startsWith('PAGUYUBAN-')
    ) {
      const updated: RtCommunity = {
        ...current,
        isJoined: true,
        memberRole: role,
        joinedAt: new Date().toISOString(),
      };
      this.saveCommunity(updated);
      return {
        success: true,
        message: `Selamat bergabung di ${updated.name}! Jaringan darurat SiagaQu Anda kini telah AKTIF.`,
        community: updated,
      };
    }

    // Jika kode undangan baru/berbeda, buat komunitas baru berdasarkan kode
    const match = cleanCode.match(/RT(\d+)[-_]?RW(\d+)/i);
    const rtNo = match ? match[1] : '01';
    const rwNo = match ? match[2] : '01';

    const newCommunity: RtCommunity = {
      id: `COMM-${Date.now().toString().slice(-4)}`,
      name: `RT ${rtNo} / RW ${rwNo} - Paguyuban Warga Bersatu`,
      inviteCode: cleanCode,
      rtNumber: rtNo,
      rwNumber: rwNo,
      kelurahan: 'Kelurahan Warga',
      kecamatan: 'Kecamatan Cerdas',
      ketuaRtName: 'Pengurus RT Setempat',
      posRondaPhone: '0812-0000-1122',
      posRondaLocation: 'Pos Kamling Utama',
      totalWarga: 18,
      isJoined: true,
      joinedAt: new Date().toISOString(),
      memberRole: role,
      description: 'Lingkungan RT mandiri berbasis undangan terverifikasi.',
    };

    this.saveCommunity(newCommunity);
    return {
      success: true,
      message: `Berhasil bergabung ke ${newCommunity.name}! Jaringan darurat SiagaQu kini telah AKTIF.`,
      community: newCommunity,
    };
  }

  // Keluar dari RT (membuat SiagaQu kembali ke mode standby/non-aktif jaringan)
  static leaveCommunity(): void {
    const current = this.getCommunity();
    const updated: RtCommunity = {
      ...current,
      isJoined: false,
    };
    this.saveCommunity(updated);
  }

  // Buat Komunitas RT / Paguyuban Baru (Khusus Ketua / Pengurus)
  static createNewCommunity(
    name: string,
    rtNumber: string,
    rwNumber: string,
    ketuaName: string,
    posPhone: string
  ): RtCommunity {
    const inviteCode = `WARGAQU-RT${rtNumber.padStart(2, '0')}-RW${rwNumber.padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComm: RtCommunity = {
      id: `COMM-${Date.now()}`,
      name: name.trim() || `RT ${rtNumber} / RW ${rwNumber}`,
      inviteCode,
      rtNumber,
      rwNumber,
      kelurahan: 'Kelurahan Warga',
      kecamatan: 'Kecamatan Cerdas',
      ketuaRtName: ketuaName || 'Ketua RT',
      posRondaPhone: posPhone || '0812-3456-7890',
      posRondaLocation: 'Pos Ronda Utama RT',
      totalWarga: 1,
      isJoined: true,
      joinedAt: new Date().toISOString(),
      memberRole: 'Pengurus RT',
      description: 'Lingkungan RT baru yang dibuat melalui WargaQu.',
    };
    this.saveCommunity(newComm);
    return newComm;
  }

  // Hasilkan Pesan Teks Undangan RT / Paguyuban untuk WhatsApp
  static generateShareInviteMessage(comm: RtCommunity): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
    const inviteUrl = `${baseUrl}#rtqu?invite=${comm.inviteCode}`;

    return `*UNDANGAN RESMI WARGA RT / PAGUYUBAN*
Assalamu'alaikum wr. wb. & Salam Hangat Warga,

Mengundang seluruh warga & tetangga tercinta untuk bergabung ke jaringan digital:
🏘️ *${comm.name}*
📍 Wilayah: RT ${comm.rtNumber} / RW ${comm.rwNumber}
👮 Ketua RT: ${comm.ketuaRtName}
🚨 Keamanan Lingkungan: Terkoneksi Radar Darurat SiagaQu & Pos Siskamling

*Kode Undangan Masuk:*
👉 *${comm.inviteCode}*

*Tautan Langsung (Auto Link):*
🔗 ${inviteUrl}

_Catatan: Bergabung ke RTQu otomatis mengaktifkan tombol panik SOS & radar bahaya SiagaQu lingkungan. Modul bisnis (UsahaQu) dan silsilah keluarga (LeluhurQu) bersifat privat dan hanya terikat pada akun masing-masing warga._`;
  }
}
