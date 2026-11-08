import React, { useState } from 'react';
import {
  Bell,
  Headphones,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Receipt,
  ChevronRight,
  Sparkles,
  Home,
  Siren,
  ShoppingBag,
  MapPin,
  HeartHandshake,
  MessageSquare,
  Settings,
  QrCode,
  Newspaper,
  History,
  UserCheck,
  SlidersHorizontal,
  Info,
  Download,
  Mic,
  Store,
  CreditCard,
  GitFork,
  X,
  Share2,
  Check,
  Palette,
  Heart,
  Lock,
  Smartphone,
  KeyRound,
  ShieldAlert,
  Fingerprint,
  AlertTriangle,
  Crown,
  Award,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { PWAInstallBanner } from '../pwa/PWAInstallBanner';
import { UserAccount } from '../../types';
import { AuthService } from '../../services/auth';

interface WargaDashboardProps {
  onOpenLeluhurQu: () => void;
  onOpenRtQu: () => void;
  onOpenSiagaQu: () => void;
  onOpenUsahaQu: () => void;
  onOpenModularQu: () => void;
  onOpenBantuan: () => void;
  onOpenChatQu: () => void;
  onOpenMuamalahQu: () => void;
  onOpenAreaQu: () => void;
  onOpenSetting?: () => void;
  onOpenEmptyModule: (moduleId: string) => void;
  activeOrderCount?: number;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
  onOpenLoginModal?: () => void;
  onOpenUpdateModal?: () => void;
}

export const WargaDashboard: React.FC<WargaDashboardProps> = ({
  onOpenLeluhurQu,
  onOpenRtQu,
  onOpenSiagaQu,
  onOpenUsahaQu,
  onOpenModularQu,
  onOpenBantuan,
  onOpenChatQu,
  onOpenMuamalahQu,
  onOpenAreaQu,
  onOpenSetting,
  onOpenEmptyModule,
  activeOrderCount = 0,
  currentUser = null,
  onOpenSecurityModal,
  onOpenLoginModal,
  onOpenUpdateModal,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLogoModal, setShowLogoModal] = useState<boolean>(false);
  const [copiedPhilosophy, setCopiedPhilosophy] = useState<boolean>(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 2500);
  };

  const realBalance = '2.450.000';
  const maskedBalance = '••••••••';

  return (
    <div className="w-full h-full bg-[#f0fdf4] overflow-hidden flex flex-col relative no-scrollbar select-none">
      {/* TOP APP BAR & HEADER CONTAINER (Emerald Green #047857 to #059669) */}
      <div className="bg-gradient-to-b from-[#047857] via-[#059669] to-[#059669] pt-11 sm:pt-12 px-5 pb-16 rounded-b-[32px] relative text-white shrink-0 shadow-md android-header-safe">
        {/* Top Header Row */}
        <div className="flex justify-between items-center mb-3">
          {/* Logo / Title with Connected Smart Neighborhood 3D Icon */}
          <div
            onClick={() => setShowLogoModal(true)}
            className="flex items-center gap-2 cursor-pointer group active:scale-95 transition"
            title="Lihat Konsep & Filosofi Logo WargaQu"
          >
            <div className="relative shrink-0">
              <img
                src="./wargaqu_logo.png"
                alt="WargaQu App Logo"
                className="w-11 h-11 rounded-2xl shadow-md border-2 border-white/60 object-contain ring-2 ring-emerald-300/50 group-hover:ring-emerald-200 group-hover:scale-105 transition-all bg-emerald-800/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = './pwa-192x192.png';
                }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#5eead4] border border-[#047857]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xl font-extrabold italic tracking-tight text-white leading-none">
                  warga<span className="text-[#5eead4] font-black drop-shadow-xs">Qu</span>
                </span>
                <span className="text-[9px] bg-emerald-950/40 border border-emerald-300/40 px-1.5 py-0.5 rounded-full font-bold text-[#5eead4]">
                  RT 03
                </span>
                {onOpenUpdateModal && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenUpdateModal();
                    }}
                    className="text-[9px] bg-emerald-950/50 hover:bg-emerald-950/80 border border-[#5eead4]/40 px-1.5 py-0.5 rounded-full font-bold text-[#5eead4] flex items-center gap-1 active:scale-95 transition"
                    title="Pusat Pembaruan Sistem WargaQu (v1.6.0)"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>v1.6.0</span>
                  </button>
                )}
              </div>
              <p className="text-[9px] text-emerald-200/90 font-medium tracking-tight mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                Connected Smart Neighborhood
              </p>
            </div>
          </div>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Masked Device ID Indicator Badge (Disembunyikan) */}
            <button
              onClick={onOpenSecurityModal || onOpenLoginModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-300/40 text-[10px] font-mono font-bold text-[#5eead4] active:scale-95 transition"
              title="Perangkat Terikat (Hardware Fingerprint Aman)"
            >
              <Lock className="w-3 h-3 text-[#5eead4]" />
              <span>
                {currentUser?.boundDeviceId
                  ? AuthService.maskDeviceId(currentUser.boundDeviceId)
                  : AuthService.getMaskedCurrentDeviceId()}
              </span>
            </button>

            <button
              className="relative p-2 rounded-full hover:bg-white/10 active:scale-95 transition"
              onClick={onOpenRtQu}
              title="Notifikasi & Agenda RT 03"
            >
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-300 rounded-full ring-2 ring-emerald-800"></span>
            </button>
            <button
              className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition"
              onClick={onOpenBantuan}
              title="Pusat Bantuan UsahaQu & WargaQu"
            >
              <Headphones className="w-5 h-5 text-[#5eead4]" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition bg-white/10"
              onClick={onOpenSecurityModal || onOpenLoginModal}
              title="Profil & Keamanan Device Terikat"
            >
              <User className="w-5 h-5 text-emerald-100" />
            </button>
          </div>
        </div>

        {/* Greeting User with Active Bound Account Info */}
        <div className="mt-1 mb-1 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-emerald-200 tracking-wider uppercase font-medium">Halo,</p>
              {(currentUser?.isGenesisOwner || currentUser?.email?.toLowerCase() === 'bangorhendri@gmail.com') ? (
                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs uppercase tracking-wider">
                  <Crown className="w-2.5 h-2.5" />
                  <span>Genesis Creator &amp; Hak Cipta Sah</span>
                </span>
              ) : (
                <span className="text-[9px] bg-emerald-950/60 text-[#5eead4] border border-emerald-300/40 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Warga Terverifikasi</span>
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              {currentUser?.name || 'HENDRIANA'}
            </h1>
            <p className="text-[10px] text-emerald-200/90 font-mono">
              {currentUser?.email || currentUser?.phone || 'bangorhendri@gmail.com'}
            </p>
          </div>
          <button
            onClick={onOpenSecurityModal || onOpenLoginModal}
            className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-950/60 rounded-xl border border-emerald-300/30 text-white text-[10px] font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition"
            title="Kelola Keamanan & Perangkat Terikat"
          >
            <ShieldCheck className="w-4 h-4 text-[#5eead4]" />
            <span className="hidden xs:inline">1 Device Aktif</span>
          </button>
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 -mt-12 pb-36 sm:pb-40 space-y-3.5 android-scroll-safe">
        {/* PWA Direct Mobile Install Banner */}
        <PWAInstallBanner showToast={showToast} />

        {/* CARD KEAMANAN AKUN & DEVICE BINDING (DISEMBUNYIKAN) + SOLUSI HP HILANG */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-3.5 shadow-md border border-emerald-400/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-[#5eead4] border border-emerald-400/40 flex items-center justify-center">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Keamanan Akun &amp; Device Terikat</span>
                  <span className="text-[9px] bg-emerald-500/30 text-[#5eead4] border border-emerald-400/30 px-1.5 py-0.2 rounded-full font-bold">
                    1 HP Aktif
                  </span>
                </h4>
                <p className="text-[10px] text-emerald-200/80">Hardware Fingerprint ID Terikat &amp; Disembunyikan</p>
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono text-xs font-bold text-[#5eead4] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-400/30">
                {currentUser?.boundDeviceId
                  ? AuthService.maskDeviceId(currentUser.boundDeviceId)
                  : AuthService.getMaskedCurrentDeviceId()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-2.5">
            <button
              onClick={onOpenSecurityModal}
              className="py-2 px-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition"
            >
              <ShieldCheck className="w-3 h-3 text-[#5eead4]" />
              <span className="truncate">Perangkat</span>
            </button>

            <button
              onClick={onOpenSecurityModal}
              className="py-2 px-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-200 text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition"
              title="Lihat Sertifikat Hak Cipta & Keaslian Pencipta"
            >
              <Award className="w-3 h-3 text-amber-300" />
              <span className="truncate">Hak Cipta</span>
            </button>

            <button
              onClick={onOpenLoginModal}
              className="py-2 px-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-[11px] font-bold flex items-center justify-center gap-1 active:scale-95 transition"
              title="Buka Prosedur Darurat Jika HP Hilang / Ganti Perangkat"
            >
              <AlertTriangle className="w-3 h-3 text-rose-300" />
              <span className="truncate">HP Hilang</span>
            </button>
          </div>
        </div>

        {/* MAIN CARD WIDGET: TOTAL IURAN */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100/90 relative overflow-hidden">
          {/* Top ID Badge Row */}
          <div className="flex justify-between items-center pb-3 border-b border-emerald-50">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-semibold border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ID WARGA: {currentUser?.rtRw || 'RT 03 / RW 05'}</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">{currentUser?.address || 'Blok A No. 12'}</span>
          </div>

          {/* Primary Metric Display */}
          <div className="pt-3 pb-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500">
                Total Iuran Masuk (Awal - Sekarang)
              </span>
              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="text-emerald-700 hover:text-emerald-900 transition p-1 active:scale-95"
                title="Sembunyikan / Tampilkan Saldo"
              >
                {isBalanceHidden ? (
                  <EyeOff className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Eye className="w-4 h-4 text-emerald-600" />
                )}
              </button>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-sm font-bold text-emerald-700">IDR</span>
              <span className="text-2xl font-extrabold text-slate-800 tracking-tight font-mono">
                {isBalanceHidden ? maskedBalance : realBalance}
              </span>
            </div>
          </div>

          {/* Card Footer Link */}
          <div className="pt-2 border-t border-emerald-50 flex justify-between items-center text-xs font-semibold text-emerald-700">
            <button
              onClick={() => onOpenEmptyModule('riwayat_iuran')}
              className="flex items-center gap-1.5 hover:text-emerald-800 hover:underline active:opacity-80"
            >
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Lihat Riwayat Pembayaran</span>
            </button>
            <ChevronRight className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* MENU UTAMA (MODULE GRID) - LAYER & POSISI SEJAJAR DENGAN LELUHURQU */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100/90 relative z-10">
          {/* Section Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Menu Utama</h3>
            <button
              onClick={onOpenSetting || (() => showToast('Mode Pengaturan Sistem'))}
              className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline active:scale-95 transition"
              title="Atur Menu &amp; Pengaturan Sistem"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Atur
            </button>
          </div>

          {/* Grid Items (Menu Utama): Baris 1: LeluhurQu, RtQu, MuamalahQu, AreaQu (Sejajar) */}
          <div className="grid grid-cols-4 gap-y-4 gap-x-2">
            {/* 1. LeluhurQu */}
            {/* 1. LeluhurQu & OrbitQu */}
            <button
              onClick={onOpenLeluhurQu}
              className="flex flex-col items-center group relative active:scale-95 transition"
              title="Buka Modul LeluhurQu (Undangan Keluarga Besar, 2-4 Trah & Medsos Privat Mandiri)"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition shadow-xs relative">
                <GitFork className="w-6 h-6 rotate-180 text-emerald-700" />
                <span className="absolute -top-1.5 -right-1 bg-amber-400 text-slate-900 text-[8px] font-black px-1 rounded-full shadow-2xs animate-pulse">
                  🪐 Orbit
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                LeluhurQu
              </span>
            </button>

            {/* 2. RtQu */}
            <button
              onClick={onOpenRtQu}
              className="flex flex-col items-center group active:scale-95 transition"
              title="Buka Modul RtQu"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition shadow-xs">
                <Home className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                RtQu
              </span>
            </button>

            {/* 3. MuamalahQu */}
            <button
              onClick={onOpenMuamalahQu}
              className="flex flex-col items-center group active:scale-95 transition"
              title="Buka Modul MuamalahQu"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition shadow-xs">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                MuamalahQu
              </span>
            </button>

            {/* 4. AreaQu */}
            <button
              onClick={onOpenAreaQu}
              className="flex flex-col items-center group active:scale-95 transition"
              title="Buka Modul AreaQu"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:scale-105 transition shadow-xs">
                <MapPin className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                AreaQu
              </span>
            </button>

            {/* 5. SiagaQu (Panic Button) */}
            <button
              onClick={onOpenSiagaQu}
              className="flex flex-col items-center group relative active:scale-95 transition"
              title="Buka Modul SiagaQu (Panic Button)"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 group-hover:scale-105 transition shadow-xs">
                <Siren className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-extrabold px-1 rounded-full">
                SOS
              </span>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                SiagaQu
              </span>
            </button>

            {/* 6. UsahaQu (BAKSO QU POS SYSTEM) */}
            <button
              onClick={onOpenUsahaQu}
              className="flex flex-col items-center group relative active:scale-95 transition"
              title="Buka POS Kasir Bakso Qu"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 via-teal-100 to-emerald-200 border-2 border-emerald-500 flex items-center justify-center text-emerald-800 group-hover:scale-105 transition shadow-md shadow-emerald-200/50">
                <ShoppingBag className="w-6 h-6 text-emerald-700" />
              </div>
              {/* Highlight badge for Bakso Qu */}
              <span className="absolute -top-1.5 -right-1 bg-emerald-700 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs uppercase tracking-tight">
                POS
              </span>
              {activeOrderCount > 0 && (
                <span className="absolute -top-1.5 -left-1 bg-rose-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {activeOrderCount}
                </span>
              )}
              <span className="text-[11px] font-bold text-emerald-900 mt-1.5 text-center leading-tight flex items-center gap-0.5">
                UsahaQu
              </span>
              <span className="text-[9px] text-emerald-600 font-semibold leading-none">
                Bakso Qu
              </span>
            </button>

            {/* 7. POS ModularQu (MODULAR VOICE POS SYSTEM) */}
            <button
              onClick={onOpenModularQu}
              className="flex flex-col items-center group relative active:scale-95 transition"
              title="Buka POS ModularQu (Voice AI Kasir)"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 via-emerald-100 to-emerald-200 border-2 border-emerald-500 flex items-center justify-center text-emerald-800 group-hover:scale-105 transition shadow-md shadow-emerald-200/50">
                <Store className="w-6 h-6 text-emerald-700" />
              </div>
              <span className="absolute -top-1.5 -right-1 bg-teal-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full shadow-xs uppercase tracking-tight">
                MODULAR
              </span>
              <span className="text-[11px] font-bold text-emerald-900 mt-1.5 text-center leading-tight flex items-center gap-0.5">
                ModularQu
              </span>
              <span className="text-[9px] text-teal-600 font-semibold leading-none">
                Voice POS
              </span>
            </button>

            {/* 8. ChatQu */}
            <button
              onClick={onOpenChatQu}
              className="flex flex-col items-center group relative active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 group-hover:scale-105 transition shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 right-1 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded-full">
                3
              </span>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                ChatQu
              </span>
            </button>

            {/* 9. WargaPay (QRIS & Dompet) */}
            <button
              onClick={() => onOpenEmptyModule('qris')}
              className="flex flex-col items-center group active:scale-95 transition"
              title="Buka WargaPay & QRIS"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                WargaPay
              </span>
            </button>

            {/* 10. BantuanQu (Smart Care & CS) */}
            <button
              onClick={onOpenBantuan}
              className="flex flex-col items-center group active:scale-95 transition"
              title="Buka UsahaQu Smart Care & Pusat Bantuan"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:scale-105 transition shadow-xs">
                <Headphones className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                BantuanQu
              </span>
            </button>

            {/* 11. Pusat Update (Auto-Update v1.6.0) */}
            <button
              onClick={onOpenUpdateModal}
              className="flex flex-col items-center group relative active:scale-95 transition"
              title="Buka Pusat Pembaruan Sistem (v1.6.0)"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 group-hover:scale-105 transition shadow-xs">
                <RefreshCw className="w-6 h-6 text-emerald-700" />
              </div>
              <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[8px] font-black px-1 rounded-full shadow-2xs">
                v1.6
              </span>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                Pembaruan
              </span>
            </button>

            {/* 12. Setting (Profil Toko, Menu, Printer) */}
            <button
              onClick={onOpenSetting || (() => onOpenEmptyModule('setting'))}
              className="flex flex-col items-center group active:scale-95 transition"
              title="Buka Pengaturan Toko & Printer"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 group-hover:scale-105 transition shadow-xs">
                <Settings className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-slate-700 mt-1.5 text-center leading-tight">
                Setting
              </span>
            </button>
          </div>

          {/* Indicator dots */}
          <div className="flex justify-center items-center gap-1.5 mt-5">
            <span className="w-5 h-1.5 bg-emerald-600 rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-emerald-200 rounded-full"></span>
          </div>
        </div>

        {/* FOKUS USAHAQU: SPOTLIGHT CARD (BAKSO QU + MODULARQU) */}
        <div className="bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#065f46] rounded-2xl p-3.5 text-white shadow-md border border-emerald-400/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                Fokus UsahaQu • POS Kasir Cerdas
              </span>
            </div>
            <span className="text-[9px] bg-emerald-500/20 text-[#5eead4] border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
              Resto & Multi-Usaha
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 1. Bakso Qu Resto Card */}
            <button
              onClick={onOpenUsahaQu}
              className="bg-emerald-950/70 hover:bg-emerald-950/90 border border-emerald-500/30 rounded-xl p-2.5 text-left flex flex-col justify-between active:scale-98 transition group shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4 text-emerald-300" />
                  </div>
                  <span className="text-[8px] bg-emerald-500 text-zinc-950 font-black px-1.5 py-0.5 rounded uppercase">
                    Meja
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition">
                  Bakso Qu Resto
                </h4>
                <p className="text-[10px] text-emerald-200/80 leading-tight mt-0.5">
                  POS Dine-in, denah meja & dapur
                </p>
              </div>
              <div className="mt-2 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                <span>Buka Resto</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>

            {/* 2. POS ModularQu Card */}
            <button
              onClick={onOpenModularQu}
              className="bg-emerald-950/70 hover:bg-emerald-950/90 border border-teal-400/40 rounded-xl p-2.5 text-left flex flex-col justify-between active:scale-98 transition group relative shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                    <Mic className="w-4 h-4 text-teal-300" />
                  </div>
                  <span className="text-[8px] bg-teal-400 text-zinc-950 font-black px-1.5 py-0.5 rounded uppercase">
                    Voice AI
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition">
                  POS ModularQu
                </h4>
                <p className="text-[10px] text-emerald-200/80 leading-tight mt-0.5">
                  Voice Kasir, 4 format struk & omset
                </p>
              </div>
              <div className="mt-2 text-[10px] font-bold text-teal-300 flex items-center gap-1">
                <span>Buka Modular</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          </div>
        </div>

        {/* ANNOUNCEMENT / BANNER CAROUSEL */}
        <div
          onClick={onOpenRtQu}
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-xl p-3.5 text-white shadow-sm flex items-center justify-between cursor-pointer hover:opacity-95 active:scale-[0.99] transition border border-emerald-500/30"
          title="Buka Agenda Kegiatan di Modul RtQu"
        >
          <div className="space-y-0.5">
            <div className="inline-block bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
              Kegiatan Warga RT 03
            </div>
            <h4 className="text-xs font-bold leading-tight">Gotong Royong Minggu Ini!</h4>
            <p className="text-[11px] text-emerald-100 flex items-center gap-1">
              <span>Buka Modul RtQu untuk Detail</span>
              <ChevronRight className="w-3.5 h-3.5 inline" />
            </p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
        </div>

        {/* EXTRA FEATURE STRIP (NFC / QUICK BAYAR BANNER) */}
        <div
          onClick={() => onOpenEmptyModule('qris')}
          className="bg-white rounded-xl p-3 border border-emerald-100/90 flex items-center justify-between shadow-xs cursor-pointer hover:bg-emerald-50/50 active:scale-[0.99] transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-800">Bayar Iuran via WargaPay</h5>
              <p className="text-[10px] text-slate-500">Scan QRIS atau Transfer Otomatis</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-600" />
        </div>

        {/* PUSAT BANTUAN & AUTO-FIX CS STRIP */}
        <div
          onClick={onOpenBantuan}
          className="bg-slate-900 rounded-xl p-3 border border-slate-700/80 flex items-center justify-between shadow-sm cursor-pointer hover:bg-slate-800 active:scale-[0.99] transition text-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 text-slate-950 rounded-lg flex items-center justify-center font-bold shadow-md shadow-emerald-500/30">
              <Headphones className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h5 className="text-xs font-bold text-white">UsahaQu Smart Care</h5>
                <span className="bg-emerald-900/80 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border border-emerald-500/30">
                  AI Auto-Fix
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Pusat Bantuan &amp; Prompt Engine Konsol CS</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-400" />
        </div>

        {/* IDENTITAS RESMI: CONNECTED SMART NEIGHBORHOOD (MODERN 3D GLASSMORPHISM) */}
        <div className="bg-gradient-to-br from-white via-emerald-50/70 to-teal-50/60 rounded-2xl p-4 shadow-sm border border-emerald-200/90 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div
              className="relative shrink-0 cursor-pointer group"
              onClick={() => setShowLogoModal(true)}
              title="Ketuk untuk melihat detail konsep 3D & filosofi logo"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-300 ring-2 ring-emerald-400/40 group-hover:scale-105 group-hover:ring-emerald-400 transition-all bg-gradient-to-br from-emerald-100/50 to-teal-50/50 p-1">
                <img
                  src="./wargaqu_logo.png"
                  alt="WargaQu Connected Smart Neighborhood"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = './pwa-192x192.png';
                  }}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                3D
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300/60">
                  Identitas Terpilih
                </span>
                <span className="text-[9px] bg-teal-100/90 text-teal-800 font-bold px-1.5 py-0.5 rounded-md">
                  Pilihan 2
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-800 tracking-tight mt-1 leading-snug">
                Connected Smart Neighborhood
              </h4>
              <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                Dua rumah bertaut dalam keharmonisan modern, simpul digital berpendar, dan kehangatan hati gotong royong.
              </p>
            </div>
          </div>

          {/* Color Palette Indicators & Modal Trigger */}
          <div className="mt-3 pt-2.5 border-t border-emerald-100/90 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-emerald-300" title="Mint Emerald"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-1 ring-sky-300" title="Cobalt Cyan Blue"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-amber-300" title="Golden Warm Glow"></span>
              <span className="text-[10px] text-slate-500 font-medium ml-0.5">3D Glassmorphism</span>
            </div>

            <button
              onClick={() => setShowLogoModal(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-emerald-200/90 shadow-2xs hover:shadow-xs active:scale-95 transition"
            >
              <span>Filosofi &amp; Download</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* LATEST NEWS / COMMUNITY INFO */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100/90 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-emerald-900 text-xs uppercase tracking-wider">
              Kabar RT 03 &amp; Ronda
            </h3>
            <button
              onClick={onOpenRtQu}
              className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
            >
              <span>Buka RtQu</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div
            onClick={onOpenRtQu}
            className="flex gap-3 items-center cursor-pointer hover:opacity-85 transition bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60"
            title="Buka Jadwal Ronda & Informasi di Modul RtQu"
          >
            <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-lg shrink-0 flex items-center justify-center text-emerald-800">
              <Newspaper className="w-6 h-6" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                Jadwal Ronda Malam Bulan Ini Telah Diperbarui
              </p>
              <p className="text-[10px] text-slate-400">2 Jam yang lalu • Pengurus RT 03 • Ketuk untuk buka</p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
        </div>

        {/* FOOTER BADGE: STATUS VERSI TERKINI & ZERO DATA LOSS */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 text-white rounded-2xl p-3.5 border border-emerald-500/30 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#5eead4] flex items-center justify-center border border-emerald-400/30 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-white">WargaQu v1.6.0</span>
                <span className="text-[9px] bg-emerald-500/30 text-[#5eead4] border border-emerald-400/40 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" />
                  <span>Auto-Update Aktif</span>
                </span>
              </div>
              <p className="text-[10px] text-emerald-200/80 truncate">Data Transaksi &amp; Akun Aman (Zero Data Loss)</p>
            </div>
          </div>
          {onOpenUpdateModal && (
            <button
              onClick={onOpenUpdateModal}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shrink-0 transition active:scale-95 shadow-xs"
            >
              Cek Update
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM NAVIGATION BAR WITH FLOATING QRIS BUTTON */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 px-3 pt-2.5 pb-6 sm:pb-7 flex justify-around items-end z-40 shadow-xl android-navbar-safe">
        {/* Beranda */}
        <button
          className="flex flex-col items-center gap-0.5 text-emerald-700 active:scale-95 transition"
          onClick={() => showToast('Anda sedang di Beranda WargaQu')}
        >
          <Home className="w-5 h-5 text-emerald-700" />
          <span className="text-[10px] font-bold">Beranda</span>
        </button>

        {/* Aktivitas */}
        <button
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-emerald-700 active:scale-95 transition"
          onClick={() => onOpenEmptyModule('aktivitas')}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-medium">Aktivitas</span>
        </button>

        {/* CENTER FLOATING WargaPay / QRIS BUTTON */}
        <div className="relative -top-6 flex flex-col items-center">
          <button
            onClick={() => onOpenEmptyModule('qris')}
            className="w-14 h-14 bg-gradient-to-tr from-[#047857] via-[#059669] to-[#2dd4bf] rounded-full p-0.5 shadow-lg shadow-emerald-700/30 flex items-center justify-center text-white border-4 border-[#f0fdf4] pulse-animation active:scale-95 transition"
            title="Scan QRIS WargaQu"
          >
            <div className="w-full h-full rounded-full flex flex-col items-center justify-center">
              <QrCode className="w-6 h-6 text-white" />
            </div>
          </button>
          <span className="text-[10px] font-extrabold text-emerald-700 mt-0.5">QRIS</span>
        </div>

        {/* Untukmu */}
        <button
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-emerald-700 relative active:scale-95 transition"
          onClick={() => onOpenEmptyModule('untukmu')}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-medium">Untukmu</span>
          <span className="absolute top-0 right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
        </button>

        {/* Akun Saya */}
        <button
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-emerald-700 active:scale-95 transition"
          onClick={() => onOpenEmptyModule('akun')}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] font-medium">Akun Saya</span>
        </button>
      </div>

      {/* TOAST NOTIFICATION CONTAINER */}
      <div
        className={`absolute top-10 left-1/2 -translate-x-1/2 bg-emerald-950/95 text-[#5eead4] border border-emerald-500/50 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md shadow-xl z-50 flex items-center gap-2 transition-all duration-300 pointer-events-none ${
          toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <Info className="w-4 h-4 text-[#5eead4]" />
        <span>{toastMessage}</span>
      </div>

      {/* MODAL DETAIL: FILOSOFI LOGO RESMI WARGAQU (PILIHAN 2: CONNECTED SMART NEIGHBORHOOD) */}
      {showLogoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden border border-emerald-200 animate-in zoom-in-95 duration-200 text-slate-800">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-4 text-white relative shrink-0">
              <button
                onClick={() => setShowLogoModal(false)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-emerald-100 hover:text-white transition"
                title="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] bg-emerald-400/20 text-[#5eead4] border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Identitas Terpilih • Pilihan 2
                </span>
              </div>
              <h3 className="text-base font-black tracking-tight leading-snug">
                Connected Smart Neighborhood
              </h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                Modern 3D Glassmorphism App Icon
              </p>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 text-left">
              {/* Center 3D Logo Showcase */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="absolute inset-0 bg-radial from-emerald-400/20 via-teal-400/10 to-transparent blur-xl pointer-events-none"></div>
                <div className="w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-300 ring-4 ring-emerald-400/30 bg-gradient-to-br from-emerald-100/60 to-teal-50/60 p-2 relative z-10 transition-transform hover:scale-105 duration-300">
                  <img
                    src="./wargaqu_logo.png"
                    alt="WargaQu 3D Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = './pwa-512x512.png';
                    }}
                  />
                </div>
                <span className="mt-2.5 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Full 3D Glossy • Icon WargaQu
                </span>
              </div>

              {/* Konsep & Filosofi */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Konsep &amp; Filosofi</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bentuk <b>squircle glossy</b> dengan <b>dua rumah modern yang saling bertaut</b> (<i>interlocking houses</i>), disatukan oleh <b>jaringan simpul digital berpendar</b> (<i>connected nodes</i>) dan <b>lambang kehangatan hati</b> di bagian tengah.
                </p>
                <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200/60 text-[11px] text-emerald-900 leading-relaxed font-medium">
                  Merepresentasikan <b>WargaQu</b> sebagai platform digital pintar yang mempererat tali silaturahmi, kepedulian gotong royong, dan keharmonisan warga di era modern.
                </div>
              </div>

              {/* Palet Warna */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Palet Warna Filosofis</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center space-y-1">
                    <div className="w-full h-4 rounded-md bg-gradient-to-r from-emerald-600 to-teal-400"></div>
                    <p className="text-[10px] font-bold text-slate-800">Mint Emerald</p>
                    <p className="text-[9px] text-slate-500">Ketentraman &amp; Kesegaran</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center space-y-1">
                    <div className="w-full h-4 rounded-md bg-gradient-to-r from-sky-500 to-blue-600"></div>
                    <p className="text-[10px] font-bold text-slate-800">Kobalt Cerah</p>
                    <p className="text-[9px] text-slate-500">Teknologi &amp; Jaringan</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-center space-y-1">
                    <div className="w-full h-4 rounded-md bg-gradient-to-r from-amber-300 to-amber-500"></div>
                    <p className="text-[10px] font-bold text-slate-800">Golden Glow</p>
                    <p className="text-[9px] text-slate-500">Kehangatan Hati</p>
                  </div>
                </div>
              </div>

              {/* Karakter Visual */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Karakter Visual</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Berkesan <b>teknologi mutakhir, futuristik, dan ramah pengguna</b> (<i>playful &amp; tech-savvy</i>). Sangat ideal dan memukau sebagai ikon aplikasi Android (PWA / APK) di layar utama smartphone.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
              <a
                href="./wargaqu_logo.png"
                download="WargaQu_Connected_Smart_Neighborhood_Logo.png"
                onClick={() => showToast('Mengunduh logo WargaQu HD 512x512...')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Logo HD</span>
              </a>

              <button
                onClick={() => {
                  const text = `WargaQu - Connected Smart Neighborhood (Modern 3D Glassmorphism)\n\nKonsep & Filosofi: Bentuk squircle glossy dengan dua rumah modern yang saling bertaut (interlocking houses), disatukan oleh jaringan simpul digital berpendar (connected nodes) dan lambang kehangatan hati di bagian tengah. Merepresentasikan WargaQu sebagai platform digital pintar yang mempererat silaturahmi warga di era modern.\n\nPalet Warna: Gradasi mint emerald, biru kobalt cerah, dan cahaya hangat (golden glow).\nKarakter Visual: Berkesan teknologi mutakhir, futuristik, dan ramah pengguna (playful & tech-savvy).`;
                  navigator.clipboard.writeText(text).then(() => {
                    setCopiedPhilosophy(true);
                    showToast('Spesifikasi filosofi logo berhasil disalin!');
                    setTimeout(() => setCopiedPhilosophy(false), 2000);
                  });
                }}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs active:scale-95 transition flex items-center gap-1"
                title="Salin Teks Konsep & Filosofi"
              >
                {copiedPhilosophy ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
