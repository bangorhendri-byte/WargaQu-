import React, { useState } from 'react';
import {
  ArrowLeft,
  Settings,
  Eye,
  EyeOff,
  QrCode,
  ChevronRight,
  Wallet,
  Users,
  FileText,
  Calendar,
  Megaphone,
  ShieldCheck,
  ShieldAlert,
  Newspaper,
  Home,
  CheckCircle2,
  Clock,
  Download,
  PhoneCall,
  Plus,
  X,
  Send,
  AlertCircle,
  FileCheck,
  Sparkles,
  Lock,
  Smartphone,
  Share2,
  UserPlus,
  Copy,
  ExternalLink,
  Siren,
  Shield,
  Radio,
  Check,
  LogOut
} from 'lucide-react';
import { UserAccount } from '../../types';
import { AuthService } from '../../services/auth';
import { CommunityService, RtCommunity } from '../../services/community';

interface RtQuViewProps {
  onBackToMain: () => void;
  onOpenUsahaQu: () => void;
  onOpenSiagaQu?: () => void;
  showNotification: (msg: string) => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
}

type ModalType =
  | 'keuangan'
  | 'kas'
  | 'bayar'
  | 'warga'
  | 'surat'
  | 'buat_surat'
  | 'agenda'
  | 'aspirasi'
  | 'ronda'
  | 'qris'
  | 'settings'
  | 'laporan'
  | null;

export const RtQuView: React.FC<RtQuViewProps> = ({
  onBackToMain,
  onOpenUsahaQu,
  showNotification,
  currentUser = null,
  onOpenSecurityModal,
}) => {
  // Saldo visibility toggle
  const [isSaldoHidden, setIsSaldoHidden] = useState<boolean>(false);
  const saldoReal = '12.450.000';
  const saldoMasked = '••••••••';

  // Active Bottom Nav Tab
  const [activeTab, setActiveTab] = useState<'beranda' | 'surat' | 'laporan'>('beranda');

  // Submenu Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalDesc, setModalDesc] = useState<string>('');

  // Form states for Sub-modals
  const [suratForm, setSuratForm] = useState({
    jenis: 'Surat Pengantar Pembuatan KTP / KK',
    keperluan: '',
    keterangan: '',
  });

  const [aspirasiForm, setAspirasiForm] = useState({
    kategori: 'Fasilitas Umum',
    pesan: '',
  });

  const [riwayatSurat, setRiwayatSurat] = useState<{
    id: string;
    jenis: string;
    tanggal: string;
    status: string;
    nomor: string;
  }[]>([]);

  const [isPaidIuran, setIsPaidIuran] = useState<boolean>(true);

  // RT Community & Invitation State
  const [community, setCommunity] = useState<RtCommunity>(() => CommunityService.getCommunity());
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [inputInviteCode, setInputInviteCode] = useState<string>('');
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  // Deteksi Tautan Undangan RT di URL Hash
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const match = hash.match(/invite=([^&]+)/i);
      if (match && match[1]) {
        setInputInviteCode(decodeURIComponent(match[1]));
        setShowJoinModal(true);
      }
    }
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputInviteCode.trim()) return;
    const res = CommunityService.joinByInviteCode(inputInviteCode);
    showNotification(res.message);
    if (res.success && res.community) {
      setCommunity(res.community);
      setShowJoinModal(false);
      setInputInviteCode('');
    }
  };

  const handleLeaveCommunity = () => {
    if (confirm('Keluar dari RT ini? Sinyal darurat SiagaQu Anda akan dinonaktifkan sampai Anda bergabung kembali.')) {
      CommunityService.leaveCommunity();
      setCommunity(CommunityService.getCommunity());
      setShowJoinModal(false);
      showNotification('Anda telah keluar dari RT. Jaringan SiagaQu dinonaktifkan.');
    }
  };

  const handleShareInviteToWA = () => {
    const text = CommunityService.generateShareInviteMessage(community);
    if (navigator.share) {
      navigator.share({
        title: `Undangan ${community.name}`,
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
    showNotification('Membagikan undangan warga ke WhatsApp!');
  };

  const handleCopyInvite = () => {
    const text = CommunityService.generateShareInviteMessage(community);
    navigator.clipboard?.writeText(text);
    setCopiedInvite(true);
    showNotification('Pesan & tautan undangan RT disalin ke clipboard!');
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  const openSubMenu = (title: string, desc: string, type: ModalType) => {
    setModalTitle(title);
    setModalDesc(desc);
    setActiveModal(type);
  };

  const closeSubMenu = () => {
    setActiveModal(null);
  };

  const handleAjukanSurat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suratForm.keperluan.trim()) {
      showNotification('Harap isi keperluan pengajuan surat.');
      return;
    }
    const newSurat = {
      id: `SRT-${Date.now().toString().slice(-3)}`,
      jenis: suratForm.jenis,
      tanggal: 'Hari ini',
      status: 'Diproses',
      nomor: 'Menunggu Validasi Pengurus',
    };
    setRiwayatSurat([newSurat, ...riwayatSurat]);
    setSuratForm({ jenis: 'Surat Pengantar Pembuatan KTP / KK', keperluan: '', keterangan: '' });
    showNotification('Pengajuan surat berhasil dikirim ke Pengurus RT!');
    setActiveModal('surat');
  };

  const handleKirimAspirasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspirasiForm.pesan.trim()) {
      showNotification('Mohon tuliskan isi aspirasi atau laporan.');
      return;
    }
    setAspirasiForm({ kategori: 'Fasilitas Umum', pesan: '' });
    showNotification('Terima kasih! Aspirasi Anda telah diterima pengurus RT 03.');
    closeSubMenu();
  };

  const handleBayarIuranQRIS = () => {
    setIsPaidIuran(true);
    showNotification('Alhamdulillah! Pembayaran Iuran RT Rp 50.000 berhasil.');
    closeSubMenu();
  };

  return (
    <div className="w-full h-full bg-[#f0fdf4] overflow-hidden flex flex-col relative select-none">
      {/* TOP STICKY CONTAINER */}
      <div className="sticky top-0 z-20 shrink-0">
        {/* Header Aksen Hijau Emerald RTQu / PaguyubanQu */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white pt-10 sm:pt-11 pb-4 px-4 rounded-b-[28px] shadow-lg relative android-header-safe">
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onBackToMain}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition"
              title="Kembali ke Beranda WargaQu"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-1.5">
                <span className="font-extrabold text-base tracking-wide">
                  RT<span className="text-emerald-300">Qu</span> / Paguyuban<span className="text-emerald-300">Qu</span>
                </span>
                <span className="bg-emerald-300 text-emerald-950 text-[9px] font-black px-2 py-0.2 rounded-full uppercase tracking-wider">
                  Invite Only
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 font-medium truncate max-w-[220px] mx-auto">
                {community.name}
              </p>
            </div>

            <button
              onClick={() =>
                openSubMenu('Pengaturan RT', 'Konfigurasi Hak Akses & Parameter Modul RT', 'settings')
              }
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition relative"
              title="Pengaturan RT"
            >
              <Settings className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            </button>
          </div>

          {/* Info User & Sinergi SiagaQu */}
          <div className="bg-emerald-950/50 border border-emerald-400/20 rounded-2xl p-2.5 backdrop-blur-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                  {currentUser?.name?.slice(0, 2).toUpperCase() || 'HN'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                    <span>{currentUser?.name || 'HENDRIANA'}</span>
                    <span className="text-[9px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.2 rounded font-normal shrink-0">
                      {community.isJoined ? community.memberRole : 'Belum Bergabung'}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-200/90 truncate">
                    {community.isJoined
                      ? `${community.ketuaRtName} (Ketua RT) • ${community.totalWarga} Warga`
                      : 'Perlu kode undangan untuk bergabung'}
                  </div>
                </div>
              </div>

              {/* Sinergi SiagaQu Status Badge */}
              <button
                type="button"
                onClick={() => {
                  if (onOpenSiagaQu) onOpenSiagaQu();
                }}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-2xs active:scale-95 transition shrink-0 ${
                  community.isJoined
                    ? 'bg-rose-600/90 hover:bg-rose-700 text-white border border-rose-400/40 animate-pulse'
                    : 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                }`}
                title="Status Sistem Keamanan SiagaQu"
              >
                <Siren className="w-3.5 h-3.5" />
                <span>{community.isJoined ? 'SiagaQu: AKTIF' : 'SiagaQu: STANDBY'}</span>
              </button>
            </div>

            {/* Quick Action Buttons: Bagikan Undangan RT & Kode Masuk */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-emerald-400/10">
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="py-1.5 px-2 bg-emerald-600/60 hover:bg-emerald-600 border border-emerald-400/30 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <Share2 className="w-3 h-3 text-[#5eead4]" />
                <span>Bagikan Undangan RT</span>
              </button>

              <button
                type="button"
                onClick={() => setShowJoinModal(true)}
                className="py-1.5 px-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
              >
                <UserPlus className="w-3 h-3 text-emerald-200" />
                <span>{community.isJoined ? 'Atur / Ganti RT' : 'Gabung via Undangan'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT BODY */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 hide-scrollbar pb-36 sm:pb-40 android-scroll-safe">
        {/* ARSITEKTUR INTEGRASI: RTQU & SIAGAQU TERIKAT, MODUL LAIN HANYA AKUN */}
        <div className="bg-emerald-950 text-white p-3 rounded-2xl shadow-xs border border-emerald-500/30 flex items-start gap-2.5">
          <div className="p-1.5 bg-emerald-500/20 text-[#5eead4] rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-[#5eead4] block">Koneksi Komunitas &amp; Keamanan Terpadu:</span>
            <span className="text-slate-300">
              <strong>RTQu / PaguyubanQu</strong> bersifat undangan tertutup dan <em>mengaktifkan sistem tanggap darurat <strong>SiagaQu</strong></em> di lingkungan Anda. Modul lain (<strong>UsahaQu POS</strong> &amp; <strong>LeluhurQu Silsilah</strong>) berjalan mandiri dan <em>hanya terintegrasi sebatas Akun Pengguna</em> Anda secara privat.
            </span>
          </div>
        </div>

        {/* JIKA BELUM TERGABUNG KE RT */}
        {!community.isJoined && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-black text-amber-950">Anda Belum Tergabung ke Lingkungan RT</h4>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Untuk mengaktifkan radar darurat SiagaQu &amp; layanan RT, silakan masukkan kode undangan dari Pak RT atau tetangga Anda.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Masukkan Kode Undangan RT / Paguyuban</span>
            </button>
          </div>
        )}

        {/* ALERT / ANNOUNCEMENT BANNER */}
        <div
          onClick={() =>
            openSubMenu('Agenda RT Minggu Ini', 'Jadwal Gotong Royong Saluran Air', 'agenda')
          }
          className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start space-x-3 shadow-xs cursor-pointer hover:bg-amber-100/50 active:scale-[0.99] transition"
        >
          <div className="p-1.5 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-amber-900 flex items-center justify-between">
              <span>Agenda RT Minggu Ini</span>
              <span className="text-[10px] bg-amber-200/60 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                Penting
              </span>
            </div>
            <div className="text-amber-800/90 mt-0.5">
              Gotong Royong Bersihkan Saluran Air - Minggu, 07:30 WIB di Lapangan RT 03.
            </div>
          </div>
        </div>

        {/* KARTU KEUANGAN & KAS RT */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none"></div>

          <div className="flex justify-between items-center mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
              <span>Ringkasan Kas RT 03</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live Updated
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-1">
            <span className="text-xs font-bold text-slate-400">IDR</span>
            <span className="text-2xl font-black text-emerald-950 tracking-tight font-mono">
              {isSaldoHidden ? saldoMasked : saldoReal}
            </span>
            <button
              onClick={() => setIsSaldoHidden(!isSaldoHidden)}
              className="text-slate-400 hover:text-emerald-700 transition ml-1 p-0.5 active:scale-95"
              title="Sembunyikan/Tampilkan Saldo"
            >
              {isSaldoHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${isPaidIuran ? 'bg-emerald-500' : 'bg-amber-500'}`}
              ></span>
              <span className="text-slate-600">
                Iuran Bulan Ini:{' '}
                <strong className={isPaidIuran ? 'text-emerald-700' : 'text-amber-700'}>
                  {isPaidIuran ? 'Lunas' : 'Belum Bayar'}
                </strong>
              </span>
            </div>
            <button
              onClick={() =>
                openSubMenu(
                  'Iuran & Kas RT',
                  'Kelola Tagihan, Riwayat Pembayaran & Kas RT',
                  'kas'
                )
              }
              className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
            >
              <span>Detail Kas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BANNER AKSI CEPAT - BAYAR IURAN */}
        <button
          onClick={() =>
            openSubMenu(
              'Bayar Iuran RT',
              'Lakukan Pembayaran Iuran Kebersihan & Keamanan',
              'bayar'
            )
          }
          className="w-full bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-md active:scale-[0.99] transition border border-emerald-700/50"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/50 flex items-center justify-center text-emerald-200 border border-emerald-400/30">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Bayar Iuran via RT-Pay / QRIS</span>
                <span className="text-[9px] bg-emerald-500/40 text-emerald-200 px-1.5 py-0.2 rounded font-mono">
                  Instan
                </span>
              </div>
              <div className="text-[10px] text-emerald-200">
                Iuran Kebersihan & Keamanan (Rp 50.000)
              </div>
            </div>
          </div>
          <div className="bg-emerald-700/80 p-1.5 rounded-lg text-emerald-200">
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>

        {/* MENU UTAMA MODUL RTQU (GRID DENGAN IKON TERPISAH - 6 LAYANAN UTAMA) */}
        <div className="bg-white rounded-3xl p-4 border border-emerald-100 shadow-xs">
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Layanan Modul RTQu
            </h2>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
              6 Layanan Utama
            </span>
          </div>

          {/* Grid 3x2 */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Menu 1: Keuangan */}
            <button
              onClick={() =>
                openSubMenu(
                  'Keuangan RT',
                  'Pencatatan kas, iuran warga, dan transparansi laporan.',
                  'keuangan'
                )
              }
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition active:scale-95 group shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center mb-1.5 transition shadow-xs">
                <Wallet className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                Keuangan RT
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Iuran & Kas</span>
            </button>

            {/* Menu 2: Data Warga */}
            <button
              onClick={() =>
                openSubMenu(
                  'Data Warga',
                  'Daftar Kepala Keluarga, Pengurus RT, dan status hunian.',
                  'warga'
                )
              }
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition active:scale-95 group shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center mb-1.5 transition shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                Data Warga
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">KK & Pengurus</span>
            </button>

            {/* Menu 3: Layanan Surat */}
            <button
              onClick={() =>
                openSubMenu(
                  'Layanan Surat',
                  'Pengajuan surat pengantar RT/RW secara daring.',
                  'surat'
                )
              }
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition active:scale-95 group shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center mb-1.5 transition shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                Surat RT
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Pengantar Online</span>
            </button>

            {/* Menu 4: Agenda & Kegiatan */}
            <button
              onClick={() =>
                openSubMenu(
                  'Agenda & Kegiatan',
                  'Jadwal kerja bakti, arisan, dan rapat RT.',
                  'agenda'
                )
              }
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition active:scale-95 group shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center mb-1.5 transition shadow-xs">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                Kegiatan
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Jadwal & Acara</span>
            </button>

            {/* Menu 5: Aspirasi & Laporan */}
            <button
              onClick={() =>
                openSubMenu(
                  'Aspirasi & Laporan',
                  'Pengaduan fasilitas, saran, dan masukan warga.',
                  'aspirasi'
                )
              }
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition active:scale-95 group shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center mb-1.5 transition shadow-xs">
                <Megaphone className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                Aspirasi
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Aduan Warga</span>
            </button>

            {/* Menu 6: Pos Ronda / Siaga */}
            <button
              onClick={() =>
                openSubMenu(
                  'Siaga & Ronda',
                  'Jadwal siskamling dan nomor kontak darurat RT.',
                  'ronda'
                )
              }
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 transition active:scale-95 group shadow-2xs"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center mb-1.5 transition shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                Siaga RT
              </span>
              <span className="text-[9px] text-slate-400 mt-0.5">Ronda & Kontak</span>
            </button>
          </div>
        </div>

        {/* RIWAYAT AKTIVITAS RT TERAKHIR */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kabar RT 03 Terkini
            </h2>
            <span className="text-[10px] text-slate-400 font-medium">2 jam lalu</span>
          </div>

          <div className="space-y-2.5">
            <div
              onClick={() =>
                openSubMenu('Siaga & Ronda', 'Jadwal siskamling dan nomor kontak darurat RT.', 'ronda')
              }
              className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50/40 cursor-pointer transition"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">
                <Newspaper className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  Jadwal Ronda Malam Bulan Ini Telah Diperbarui
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Pengurus RT 03 • Silakan cek shift jadwal tugas Anda.
                </div>
              </div>
            </div>

            <div
              onClick={onOpenUsahaQu}
              className="flex items-start space-x-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 hover:border-emerald-300 cursor-pointer transition"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Modul UsahaQu Warga: Bakso Qu POS</span>
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 rounded-full font-bold">
                    Aktif
                  </span>
                </div>
                <div className="text-[10px] text-emerald-800/80 mt-0.5">
                  Kelola kasir, stok bahan, omset & cetak struk bluetooth restoran Anda.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGASI BAWAH MODUL RTQU (ACCENT EMERALD) */}
      <div className="bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around z-20 shrink-0 shadow-lg">
        {/* Tab 1: Beranda RT */}
        <button
          onClick={() => {
            setActiveTab('beranda');
            closeSubMenu();
          }}
          className={`flex flex-col items-center transition ${
            activeTab === 'beranda' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-emerald-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-1">Beranda RT</span>
        </button>

        {/* Tab 2: Surat Saya */}
        <button
          onClick={() => {
            setActiveTab('surat');
            openSubMenu(
              'Riwayat Surat',
              'Status surat pengantar yang telah Anda ajukan',
              'surat'
            );
          }}
          className={`flex flex-col items-center transition ${
            activeTab === 'surat' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-emerald-600'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Surat Saya</span>
        </button>

        {/* Tab 3: Quick Scan QRIS (Center Highlight) */}
        <button
          onClick={() =>
            openSubMenu(
              'QRIS Kas RT',
              'Pindai QRIS untuk pembayaran kas & iuran',
              'qris'
            )
          }
          className="flex flex-col items-center -mt-5"
          title="Pindai QRIS Kas RT"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg border-4 border-[#f0fdf4] active:scale-90 transition">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="text-[9px] font-bold text-emerald-900 mt-0.5">QRIS Kas</span>
        </button>

        {/* Tab 4: Laporan RT */}
        <button
          onClick={() => {
            setActiveTab('laporan');
            openSubMenu(
              'Laporan RT',
              'Transparansi laporan keuangan dan kegiatan RT 03',
              'laporan'
            );
          }}
          className={`flex flex-col items-center transition ${
            activeTab === 'laporan' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-emerald-600'
          }`}
        >
          <FileCheck className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Laporan RT</span>
        </button>

        {/* Tab 5: Kembali ke Utama */}
        <button
          onClick={onBackToMain}
          className="text-slate-400 hover:text-emerald-700 flex flex-col items-center transition"
          title="Kembali ke Beranda Utama WargaQu"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Utama</span>
        </button>
      </div>

      {/* MODAL SUB-MENU INTERAKTIF (BOTTOM SHEET) */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Pill Handler */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 shrink-0"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  RT
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{modalTitle}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{modalDesc}</p>
                </div>
              </div>
              <button
                onClick={closeSubMenu}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Dynamic Content */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 hide-scrollbar text-xs">
              {/* 1. KEUANGAN / KAS MODAL */}
              {(activeModal === 'keuangan' || activeModal === 'kas' || activeModal === 'laporan') && (
                <div className="space-y-3">
                  {/* Summary Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-900 text-white shadow-sm">
                    <div className="flex justify-between items-center text-[11px] text-emerald-200">
                      <span>Total Kas Tersimpan RT 03</span>
                      <span className="bg-emerald-700/80 px-2 py-0.5 rounded-full font-mono text-[10px]">
                        Okt 2026
                      </span>
                    </div>
                    <div className="text-xl font-extrabold mt-1 font-mono text-emerald-100">
                      Rp 12.450.000
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-emerald-700/60 text-[10px]">
                      <div>
                        <span className="text-emerald-300">Total Pemasukan:</span>
                        <div className="font-bold text-white font-mono">Rp 3.100.000</div>
                      </div>
                      <div>
                        <span className="text-emerald-300">Total Pengeluaran:</span>
                        <div className="font-bold text-white font-mono">Rp 1.450.000</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Detail List */}
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-800">Status Iuran Warga Bulanan</div>
                        <div className="text-[10px] text-slate-500">Iuran Kebersihan & Keamanan</div>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        Lunas
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="font-bold text-slate-800 mb-2">Rincian Arus Kas Terakhir</div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>+ Iuran 48 Warga Blok A-C</span>
                          <span className="font-bold text-emerald-600 font-mono">+Rp 2.400.000</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>- Gaji Petugas Sampah & Kebersihan</span>
                          <span className="font-bold text-rose-600 font-mono">-Rp 800.000</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>- Perbaikan Penerangan Jalan RT 03</span>
                          <span className="font-bold text-rose-600 font-mono">-Rp 450.000</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                          <span>+ Donasi Kas Gotong Royong</span>
                          <span className="font-bold text-emerald-600 font-mono">+Rp 700.000</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => showNotification('Mengunduh Laporan Rekap Bulanan PDF...')}
                      className="w-full text-left p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/60 border border-emerald-200 flex justify-between items-center font-bold text-emerald-800 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Download className="w-4 h-4 text-emerald-700" />
                        Unduh Rekap Laporan Kas Lengkap (PDF)
                      </span>
                      <ChevronRight className="w-4 h-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. BAYAR / QRIS MODAL */}
              {(activeModal === 'bayar' || activeModal === 'qris') && (
                <div className="space-y-3 text-center">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col items-center">
                    <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">
                      QRIS RT-Pay Paguyuban RT 03
                    </div>
                    <div className="text-xs text-emerald-700 mt-0.5">
                      NMID: ID102026RT0305
                    </div>

                    {/* QR Code Canvas Mockup */}
                    <div className="w-44 h-44 bg-white p-3 rounded-2xl border-2 border-emerald-600 shadow-sm mt-3 mb-2 flex flex-col items-center justify-center">
                      <QrCode className="w-32 h-32 text-emerald-950" />
                      <div className="text-[9px] font-extrabold text-emerald-800 tracking-wider font-mono">
                        SCAN DENGAN BANK / E-WALLET
                      </div>
                    </div>

                    <div className="text-slate-600 text-xs mt-1">Total Tagihan Iuran:</div>
                    <div className="text-2xl font-black text-emerald-900 font-mono mt-0.5">
                      Rp 50.000
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Periode: Oktober 2026 (Kebersihan & Keamanan)
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleBayarIuranQRIS}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
                    >
                      Konfirmasi Bayar Lunas
                    </button>
                    <button
                      onClick={() => showNotification('Gambar QRIS telah diunduh ke galeri.')}
                      className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      Unduh QRIS
                    </button>
                  </div>
                </div>
              )}

              {/* 3. DATA WARGA MODAL */}
              {activeModal === 'warga' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Pengurus RT 03 / RW 05</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Masa Bakti 2024-2029
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { role: 'Ketua RT 03', name: 'Bpk. Bambang Sutrisno', phone: '0812-3456-7890' },
                      { role: 'Sekretaris RT', name: 'Bpk. Agus Permana', phone: '0813-8899-1122' },
                      { role: 'Bendahara RT', name: 'Ibu Sri Wahyuni', phone: '0821-4455-6677' },
                      { role: 'Seksi Keamanan & Ronda', name: 'Bpk. Dedi Suryadi', phone: '0819-7788-9900' },
                      { role: 'Seksi Kebersihan & Lingkungan', name: 'Bpk. Joko Purnomo', phone: '0857-1234-5678' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-[10px] font-bold text-emerald-700 uppercase">
                            {item.role}
                          </div>
                          <div className="font-bold text-slate-800">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.phone}</div>
                        </div>
                        <button
                          onClick={() => showNotification(`Menghubungi ${item.name} via WA/Telepon...`)}
                          className="p-2 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 active:scale-95 transition"
                          title="Hubungi"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Total Warga Terdaftar:</span>
                    <span className="font-bold text-emerald-800">48 KK (172 Jiwa)</span>
                  </div>
                </div>
              )}

              {/* 4. LAYANAN SURAT MODAL */}
              {activeModal === 'surat' && (
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveModal('buat_surat')}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Buat Surat Pengantar Baru</span>
                  </button>

                  <div className="text-xs font-bold text-slate-700">Daftar Pengajuan Surat Anda</div>

                  <div className="space-y-2">
                    {riwayatSurat.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Belum ada riwayat pengajuan surat. Klik tombol di atas untuk mengajukan surat pengantar baru.
                      </div>
                    ) : (
                      riwayatSurat.map((surat) => (
                        <div
                          key={surat.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-bold text-slate-800">{surat.jenis}</div>
                            <div className="text-[10px] text-slate-500">
                              Tanggal: {surat.tanggal} • {surat.nomor}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              surat.status === 'Diproses'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {surat.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 5. FORM BUAT SURAT */}
              {activeModal === 'buat_surat' && (
                <form onSubmit={handleAjukanSurat} className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Jenis Surat Pengantar</label>
                    <select
                      value={suratForm.jenis}
                      onChange={(e) => setSuratForm({ ...suratForm, jenis: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    >
                      <option>Surat Pengantar Pembuatan KTP / KK</option>
                      <option>Surat Pengantar Domisili Tinggal</option>
                      <option>Surat Keterangan Catatan Kepolisian (SKCK)</option>
                      <option>Surat Keterangan Usaha Warga (UMKM)</option>
                      <option>Surat Keterangan Belum Menikah</option>
                      <option>Surat Keterangan Kematian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Keperluan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pengurusan perpanjangan KTP elektronik"
                      value={suratForm.keperluan}
                      onChange={(e) => setSuratForm({ ...suratForm, keperluan: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan (Opsional)</label>
                    <textarea
                      placeholder="Tuliskan keterangan pendukung jika diperlukan..."
                      value={suratForm.keterangan}
                      onChange={(e) => setSuratForm({ ...suratForm, keterangan: e.target.value })}
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                    >
                      Kirim Pengajuan
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal('surat')}
                      className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
                    >
                      Kembali
                    </button>
                  </div>
                </form>
              )}

              {/* 6. AGENDA & KEGIATAN MODAL */}
              {activeModal === 'agenda' && (
                <div className="space-y-2.5">
                  {[
                    {
                      date: 'Minggu, 02 Nov 2026',
                      time: '07:30 WIB',
                      title: 'Gotong Royong Saluran Air & Fogging',
                      loc: 'Lapangan & Selokan Blok A - C',
                    },
                    {
                      date: 'Jumat, 07 Nov 2026',
                      time: '19:45 WIB',
                      title: 'Rapat Bulanan Pengurus RT 03',
                      loc: 'Balai Warga RT 03',
                    },
                    {
                      date: 'Sabtu, 15 Nov 2026',
                      time: '06:30 WIB',
                      title: 'Senam Pagi Bersama & Posyandu Lansia',
                      loc: 'Taman Segar RT 03',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {item.date} • {item.time}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-[10px] text-slate-500">Lokasi: {item.loc}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* 7. ASPIRASI & LAPORAN MODAL */}
              {activeModal === 'aspirasi' && (
                <form onSubmit={handleKirimAspirasi} className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Kategori Laporan</label>
                    <select
                      value={aspirasiForm.kategori}
                      onChange={(e) => setAspirasiForm({ ...aspirasiForm, kategori: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                    >
                      <option>Fasilitas Umum & Lampu Jalan</option>
                      <option>Sampah & Kebersihan Lingkungan</option>
                      <option>Keamanan & Ketertiban Warga</option>
                      <option>Saran & Masukan Program RT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Isi Laporan / Aspirasi</label>
                    <textarea
                      placeholder="Ceritakan detail aduan atau masukan Anda..."
                      value={aspirasiForm.pesan}
                      onChange={(e) => setAspirasiForm({ ...aspirasiForm, pesan: e.target.value })}
                      rows={3}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Laporan ke Pengurus</span>
                  </button>
                </form>
              )}

              {/* 8. POS RONDA / SIAGA MODAL */}
              {activeModal === 'ronda' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700">Jadwal Shift Pos Ronda RT 03</div>

                  <div className="space-y-1.5 text-xs">
                    {[
                      { hari: 'Senin', petugas: 'Bpk. Bambang, Bpk. Hendriana (Anda)', status: 'Malam Ini' },
                      { hari: 'Selasa', petugas: 'Bpk. Dedi, Bpk. Joko, Bpk. Anton', status: 'Shift Besok' },
                      { hari: 'Rabu', petugas: 'Bpk. Agus, Bpk. Wawan, Bpk. Rudi', status: 'Terjadwal' },
                      { hari: 'Kamis', petugas: 'Bpk. Farhan, Bpk. Taufik, Bpk. Ilham', status: 'Terjadwal' },
                      { hari: 'Jumat', petugas: 'Bpk. Sugeng, Bpk. Yanto, Bpk. Arif', status: 'Terjadwal' },
                    ].map((shift, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border flex justify-between items-center ${
                          shift.status === 'Malam Ini'
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-800">{shift.hari} (22:00 - 04:00)</div>
                          <div className="text-[10px] text-slate-500">{shift.petugas}</div>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            shift.status === 'Malam Ini'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {shift.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-red-900 text-[11px]">Kontak Darurat Siskamling</div>
                      <div className="text-[10px] text-red-700">Pos Keamanan RT: 0812-9999-0303</div>
                    </div>
                    <button
                      onClick={() => showNotification('Menghubungi Pos Keamanan RT...')}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[10px] active:scale-95 transition"
                    >
                      Panggil Darurat
                    </button>
                  </div>
                </div>
              )}

              {/* 9. PENGATURAN RT MODAL */}
              {activeModal === 'settings' && (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <div className="font-bold text-slate-800">Parameter Wilayah RT 03</div>
                    <div className="text-[10px] text-slate-500">
                      Rukun Tetangga 03, Rukun Warga 05, Kelurahan Sukamaju, Kec. Cilandak.
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Notifikasi WhatsApp Iuran</div>
                      <div className="text-[10px] text-slate-500">Pengingat otomatis setiap tgl 25</div>
                    </div>
                    <span className="w-9 h-5 bg-emerald-600 rounded-full flex items-center justify-end px-0.5">
                      <span className="w-4 h-4 bg-white rounded-full"></span>
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">Sinkronisasi Cloud Data Warga</div>
                      <div className="text-[10px] text-slate-500">Status: Terhubung & Aman</div>
                    </div>
                    <span className="text-emerald-700 font-bold text-[10px]">Aktif</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Button */}
            <button
              onClick={closeSubMenu}
              className="w-full mt-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl shadow-xs transition text-xs shrink-0"
            >
              Tutup Modul
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
