import React, { useState } from 'react';
import {
  ArrowLeft,
  Home,
  Siren,
  ShoppingBag,
  MapPin,
  HeartHandshake,
  MessageSquare,
  Settings,
  History,
  QrCode,
  Sparkles,
  UserCheck,
  Receipt,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Smartphone,
  ChevronRight,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Camera,
  CheckCircle2,
  Copy,
  Check,
  Crown,
  Award,
  Zap,
  Tag,
  Calendar,
  DollarSign
} from 'lucide-react';
import { UserAccount, Order } from '../../types';
import { AuthService, GENESIS_AUTHOR } from '../../services/auth';
import { StorageService } from '../../services/storage';

interface EmptyModuleViewProps {
  moduleId: string;
  onBack: () => void;
  onOpenUsahaQu: () => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
  onOpenLoginModal?: () => void;
  onOpenUpdateModal?: () => void;
  showNotification?: (msg: string) => void;
}

export const EmptyModuleView: React.FC<EmptyModuleViewProps> = ({
  moduleId,
  onBack,
  onOpenUsahaQu,
  currentUser,
  onOpenSecurityModal,
  onOpenLoginModal,
  onOpenUpdateModal,
  showNotification = () => {},
}) => {
  // QRIS Sub-Tab
  const [qrisTab, setQrisTab] = useState<'scan' | 'show' | 'topup' | 'tarik'>(() => {
    if (moduleId === 'topup') return 'topup';
    if (moduleId === 'tarik') return 'tarik';
    return 'scan';
  });
  const [customNominal, setCustomNominal] = useState<string>('50000');
  const [qrisSimulating, setQrisSimulating] = useState<boolean>(false);
  const [qrisSuccessMsg, setQrisSuccessMsg] = useState<string | null>(null);

  // Aktivitas Filter
  const [aktivitasFilter, setAktivitasFilter] = useState<'semua' | 'usahaqu' | 'iuran' | 'donasi'>('semua');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  // Get real orders from storage
  const realOrders: Order[] = StorageService.getHistory();

  // Simulated RT Dues & Donations records
  const rtDuesHistory = [
    {
      id: 'IUR-2026-11',
      title: 'Iuran Kas RT 03 & Kebersihan',
      category: 'iuran',
      amount: 50000,
      date: '01 Nov 2026 • 09:15 WIB',
      status: 'LUNAS',
      method: 'WargaPay QRIS',
      ref: 'REF-RT03-882910'
    },
    {
      id: 'IUR-2026-10',
      title: 'Iuran Keamanan Ronda Malam',
      category: 'iuran',
      amount: 30000,
      date: '01 Okt 2026 • 14:20 WIB',
      status: 'LUNAS',
      method: 'Tunai (Bendahara RT)',
      ref: 'REF-RT03-771239'
    },
    {
      id: 'DON-2026-02',
      title: 'Infaq Jumat Berkah Warga RT 03',
      category: 'donasi',
      amount: 25000,
      date: '31 Okt 2026 • 11:45 WIB',
      status: 'LUNAS',
      method: 'WargaPay Infaq',
      ref: 'REF-INFAQ-441290'
    }
  ];

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  // Combine activity records
  const orderActivities = realOrders.map((o) => ({
    id: o.id,
    title: `Resto Bakso Qu • ${o.customerName || 'Pelanggan'} (${o.items.length} Menu)`,
    category: 'usahaqu',
    amount: o.total,
    date: new Date(o.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    status: o.status === 'paid' ? 'LUNAS' : o.status.toUpperCase(),
    method: o.paymentMethod === 'qris' ? 'QRIS UsahaQu' : 'Tunai',
    ref: o.receiptNumber || o.id,
    items: o.items
  }));

  const allActivities = [...orderActivities, ...rtDuesHistory].sort((a, b) => b.id.localeCompare(a.id));
  const filteredActivities =
    aktivitasFilter === 'semua'
      ? allActivities
      : allActivities.filter((a) => a.category === aktivitasFilter);

  // Handle Scan Simulator
  const handleSimulateScan = () => {
    setQrisSimulating(true);
    setTimeout(() => {
      setQrisSimulating(false);
      setQrisSuccessMsg('QRIS Terdeteksi: Iuran Kas RT 03 (Rp 50.000). Pembayaran Berhasil Diproses!');
      showNotification('Pembayaran WargaPay QRIS Berhasil!');
      setTimeout(() => setQrisSuccessMsg(null), 4000);
    }, 1800);
  };

  // Screen Title & Subtitle helper
  const getHeaderMeta = () => {
    if (moduleId === 'qris' || moduleId === 'topup' || moduleId === 'tarik') {
      return { title: 'WargaPay & QRIS', subtitle: 'Pembayaran Cepat & Dompet Warga' };
    }
    if (moduleId === 'aktivitas' || moduleId === 'riwayat_iuran') {
      return { title: 'Aktivitas & Riwayat', subtitle: 'Catatan Transaksi & Kas Warga' };
    }
    if (moduleId === 'untukmu') {
      return { title: 'Untukmu • Rekomendasi', subtitle: 'Poin Warga & Promo Lingkungan' };
    }
    if (moduleId === 'akun') {
      return { title: 'Profil & Kartu Warga', subtitle: 'Identitas Digital & Perangkat Terikat' };
    }
    return { title: moduleId.toUpperCase(), subtitle: 'Modul Aplikasi WargaQu' };
  };

  const header = getHeaderMeta();

  return (
    <div className="flex-1 flex flex-col bg-[#f0fdf4] overflow-hidden text-slate-800 select-none">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-[#047857] via-[#059669] to-[#047857] pt-10 sm:pt-11 pb-4 px-4 text-white shadow-md flex items-center justify-between shrink-0 android-header-safe">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-xs font-semibold text-emerald-100 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm font-bold text-white tracking-wide">{header.title}</h2>
          <p className="text-[10px] text-[#5eead4]">{header.subtitle}</p>
        </div>

        <div className="w-16 flex justify-end">
          {onOpenUpdateModal && (
            <button
              onClick={onOpenUpdateModal}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition"
              title="Periksa Pembaruan Sistem"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CASE 1: WARGAPAY & QRIS HUB (qris, topup, tarik) */}
      {/* ========================================================================= */}
      {(moduleId === 'qris' || moduleId === 'topup' || moduleId === 'tarik') && (
        <div className="flex-1 overflow-y-auto p-4 pb-32 sm:pb-36 space-y-4 max-w-md mx-auto w-full android-scroll-safe">
          {/* Sub-tab navigation */}
          <div className="bg-emerald-950/10 p-1 rounded-2xl flex border border-emerald-200/80 text-xs font-bold">
            <button
              onClick={() => setQrisTab('scan')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                qrisTab === 'scan' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-900 hover:bg-white/50'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan QRIS</span>
            </button>
            <button
              onClick={() => setQrisTab('show')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                qrisTab === 'show' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-900 hover:bg-white/50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Saya</span>
            </button>
            <button
              onClick={() => setQrisTab('topup')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                qrisTab === 'topup' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-900 hover:bg-white/50'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Top Up</span>
            </button>
            <button
              onClick={() => setQrisTab('tarik')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                qrisTab === 'tarik' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-900 hover:bg-white/50'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Tarik</span>
            </button>
          </div>

          {/* Saldo Mini Card */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl p-3.5 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-200 block font-semibold">Saldo Aktif WargaPay:</span>
              <strong className="text-base font-extrabold font-mono tracking-tight text-white">
                Rp 2.450.000
              </strong>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#5eead4] border border-emerald-400/30 text-[10px] font-bold">
              Siap Transaksi
            </span>
          </div>

          {/* TAB 1: SCAN QRIS SIMULATOR */}
          {qrisTab === 'scan' && (
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm text-center space-y-4 animate-in fade-in">
              <div className="relative w-64 h-64 mx-auto rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center border-4 border-emerald-500/80 shadow-inner">
                {/* Scanner viewfinder lines */}
                <div className="absolute inset-4 border-2 border-dashed border-[#5eead4]/60 rounded-xl pointer-events-none" />
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                {/* Laser animation */}
                <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#5eead4] to-transparent animate-bounce top-1/2 opacity-80" />

                <Camera className="w-12 h-12 text-emerald-400/40 mb-2" />
                <p className="text-[11px] text-emerald-200/90 font-medium px-6">
                  Arahkan kamera ke kode QRIS Toko Warga, Kas RT, atau Merchant UsahaQu
                </p>
              </div>

              {qrisSuccessMsg ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-bold flex items-center justify-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{qrisSuccessMsg}</span>
                </div>
              ) : (
                <button
                  onClick={handleSimulateScan}
                  disabled={qrisSimulating}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition disabled:opacity-50"
                >
                  <Camera className={`w-4 h-4 ${qrisSimulating ? 'animate-spin' : ''}`} />
                  <span>{qrisSimulating ? 'Memindai Kode QRIS...' : 'Simulasikan Pindai QRIS (Uji Coba)'}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 2: SHOW MY QRIS */}
          {qrisTab === 'show' && (
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm text-center space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 inline-block mx-auto shadow-inner">
                {/* SVG QR Code Simulation */}
                <div className="w-48 h-48 bg-white p-3 rounded-xl border border-slate-300 flex flex-col items-center justify-center relative">
                  <QrCode className="w-36 h-36 text-slate-900" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md border-2 border-white">
                      WQ
                    </div>
                  </div>
                </div>
                <p className="text-[11px] font-mono font-bold text-emerald-950 mt-2">
                  NMID: ID102688920194 • WARGAQU RT03
                </p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700">Set Nominal Terima (Opsional):</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customNominal}
                    onChange={(e) => setCustomNominal(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                  <button
                    onClick={() => showNotification(`QRIS Dinamis diset: Rp ${Number(customNominal || 0).toLocaleString('id-ID')}`)}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition"
                  >
                    Set
                  </button>
                </div>
              </div>

              <button
                onClick={() => showNotification('Kode QRIS WargaQu berhasil disalin ke clipboard!')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Salin Tautan Pembayaran QRIS</span>
              </button>
            </div>
          )}

          {/* TAB 3: TOP UP */}
          {qrisTab === 'topup' && (
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4 animate-in fade-in">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Pilih Nominal Top Up Saldo:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[20000, 50000, 100000, 200000, 500000, 1000000].map((nominal) => (
                  <button
                    key={nominal}
                    onClick={() => {
                      showNotification(`Top Up ${formatRupiah(nominal)} berhasil diproses via Virtual Account!`);
                    }}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 font-mono font-extrabold text-slate-800 hover:text-emerald-800 active:scale-95 transition text-center shadow-2xs"
                  >
                    {formatRupiah(nominal)}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block">Metode Pembayaran Tersedia:</span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  BCA Virtual Account, Mandiri, BRI, BNI, QRIS Otomatis, dan Agen Kas RT 03.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TARIK SALDO */}
          {qrisTab === 'tarik' && (
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-4 animate-in fade-in">
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Tarik Saldo ke Rekening Bank / E-Wallet:
              </h4>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Nominal Penarikan (IDR):</label>
                  <input
                    type="number"
                    defaultValue={100000}
                    placeholder="Minimal Rp 50.000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Pilih Rekening Tujuan:</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
                    <option>BCA - 8810294812 (HENDRIANA)</option>
                    <option>Mandiri - 1320094182 (HENDRIANA)</option>
                    <option>GoPay / OVO - 08123456789</option>
                  </select>
                </div>
                <button
                  onClick={() => showNotification('Permintaan penarikan saldo sebesar Rp 100.000 berhasil dikirim!')}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Ajukan Penarikan Dana
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 2: AKTIVITAS & RIWAYAT TRANSAKSI LENGKAP (aktivitas, riwayat_iuran) */}
      {/* ========================================================================= */}
      {(moduleId === 'aktivitas' || moduleId === 'riwayat_iuran') && (
        <div className="flex-1 overflow-y-auto p-4 pb-32 sm:pb-36 space-y-3.5 max-w-md mx-auto w-full android-scroll-safe">
          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-bold">
            <button
              onClick={() => setAktivitasFilter('semua')}
              className={`px-3 py-1.5 rounded-xl transition ${
                aktivitasFilter === 'semua'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              Semua ({allActivities.length})
            </button>
            <button
              onClick={() => setAktivitasFilter('usahaqu')}
              className={`px-3 py-1.5 rounded-xl transition ${
                aktivitasFilter === 'usahaqu'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              Bakso Qu ({orderActivities.length})
            </button>
            <button
              onClick={() => setAktivitasFilter('iuran')}
              className={`px-3 py-1.5 rounded-xl transition ${
                aktivitasFilter === 'iuran'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              Iuran RT (2)
            </button>
            <button
              onClick={() => setAktivitasFilter('donasi')}
              className={`px-3 py-1.5 rounded-xl transition ${
                aktivitasFilter === 'donasi'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              Donasi (1)
            </button>
          </div>

          {/* List Activities */}
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
              <History className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">Belum Ada Riwayat</h4>
              <p className="text-[11px] text-slate-400">Transaksi dan iuran yang selesai akan tercatat otomatis di sini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => setSelectedReceipt(act)}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs active:scale-[0.99] transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        act.category === 'usahaqu'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.category === 'iuran'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {act.category === 'usahaqu' ? (
                        <ShoppingBag className="w-5 h-5" />
                      ) : act.category === 'iuran' ? (
                        <Home className="w-5 h-5" />
                      ) : (
                        <HeartHandshake className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{act.date} • {act.method}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <strong className="text-xs font-mono font-extrabold text-emerald-700 block">
                      {formatRupiah(act.amount)}
                    </strong>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">
                      {act.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick link to Bakso Qu Resto POS */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <h5 className="font-bold text-xs text-white">Buka Kasir UsahaQu Resto</h5>
              <p className="text-[10px] text-emerald-200">Kelola denah meja &amp; transaksi aktif</p>
            </div>
            <button
              onClick={onOpenUsahaQu}
              className="px-3 py-1.5 bg-[#5eead4] hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-xl transition shadow-xs"
            >
              Buka POS &gt;
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 3: UNTUKMU • REKOMENDASI PINTAR & POIN WARGA (untukmu) */}
      {/* ========================================================================= */}
      {moduleId === 'untukmu' && (
        <div className="flex-1 overflow-y-auto p-4 pb-32 sm:pb-36 space-y-3.5 max-w-md mx-auto w-full android-scroll-safe">
          {/* Poin Keaktifan Warga */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-md space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">
                Poin Loyalitas &amp; Keaktifan RT 03
              </span>
              <span className="px-2 py-0.5 bg-amber-950/40 text-amber-200 text-[10px] font-bold rounded-full">
                Tier Emas
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black font-mono">750</h3>
              <span className="text-xs font-bold text-amber-200">Poin Aktif</span>
            </div>
            <p className="text-[11px] text-amber-100 leading-relaxed">
              Dapat ditukarkan dengan diskon menu Bakso Qu atau pembebasan retribusi sampah RT.
            </p>
          </div>

          {/* Rekomendasi Menu Bakso Qu Terlaris */}
          <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-900">Promo Restoran Bakso Qu</h4>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                Diskon 10%
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Khusus warga RT 03 / RW 05: Dapatkan potongan harga 10% untuk menu <strong>Bakso Urat Jumbo</strong> dan <strong>Bakso Komplit</strong> dengan menunjukkan aplikasi WargaQu.
            </p>
            <button
              onClick={onOpenUsahaQu}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-2xs"
            >
              Lihat Menu &amp; Pesan Sekarang
            </button>
          </div>

          {/* Agenda & Kegiatan Warga Mendatang */}
          <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <h4 className="text-xs font-bold text-slate-900">Agenda Warga Pekan Ini</h4>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-800 block text-xs">Gotong Royong &amp; Fogging</strong>
                  <span className="text-[10px] text-slate-500">Minggu, 07:00 WIB • Balai Warga RT 03</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                  +50 Poin
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <strong className="text-slate-800 block text-xs">Posyandu Balita &amp; Lansia</strong>
                  <span className="text-[10px] text-slate-500">Rabu, 09:00 WIB • Posyandu Melati 3</span>
                </div>
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-1 rounded-lg">
                  Terbuka
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CASE 4: AKUN SAYA • BIODATA WARGA & PERANGKAT TERIKAT (akun) */}
      {/* ========================================================================= */}
      {moduleId === 'akun' && (
        <div className="flex-1 overflow-y-auto p-4 pb-32 sm:pb-36 space-y-3.5 max-w-md mx-auto w-full text-left android-scroll-safe">
          {/* User Profile Card */}
          <div className="bg-white rounded-3xl p-4.5 border border-emerald-100 shadow-sm flex items-center gap-3.5 relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0 ring-2 ring-emerald-200">
              {currentUser ? currentUser.name.charAt(0).toUpperCase() : 'H'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-sm truncate uppercase">
                  {currentUser ? currentUser.name : GENESIS_AUTHOR.creatorName}
                </h3>
                {(currentUser?.isGenesisOwner || currentUser?.email?.toLowerCase() === GENESIS_AUTHOR.email.toLowerCase()) && (
                  <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                    <Crown className="w-2.5 h-2.5" />
                    <span>OWNER</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {currentUser?.email || GENESIS_AUTHOR.email}
              </p>
              <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                RT 03 / RW 05 • Blok A No. 12 • Kelurahan Sukamaju
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={onOpenSecurityModal || onOpenLoginModal}
              className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-2xs hover:bg-emerald-50/50 flex items-center gap-2.5 text-slate-800 font-bold transition active:scale-98"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-xs">Pusat Keamanan</span>
                <span className="text-[10px] text-slate-400 font-normal">Hak cipta &amp; device</span>
              </div>
            </button>

            {onOpenUpdateModal && (
              <button
                onClick={onOpenUpdateModal}
                className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-2xs hover:bg-emerald-50/50 flex items-center gap-2.5 text-slate-800 font-bold transition active:scale-98"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-xs">Pusat Update</span>
                  <span className="text-[10px] text-slate-400 font-normal">Cek versi terbaru</span>
                </div>
              </button>
            )}
          </div>

          {/* Kartu Status Hardware Terikat */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-white">
                <Smartphone className="w-4 h-4 text-[#5eead4]" />
                Perangkat Terikat (1 Device Policy)
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/30 text-[#5eead4] border border-emerald-400/30 rounded-full text-[9px] font-bold">
                AKTIF
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/80 leading-relaxed">
              Akun Anda terkunci aman pada HP ini dengan Hardware ID:
            </p>
            <div className="p-2 bg-black/30 rounded-xl font-mono text-xs font-bold text-[#5eead4] border border-white/10 flex items-center justify-between">
              <span>
                {currentUser?.boundDeviceId
                  ? AuthService.maskDeviceId(currentUser.boundDeviceId)
                  : AuthService.getMaskedCurrentDeviceId()}
              </span>
              <span className="text-[10px] text-emerald-300 font-sans">Terproteksi</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECEIPT DETAIL MODAL POPUP */}
      {/* ========================================================================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xs p-5 shadow-2xl border border-slate-200 text-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-xs">Detail Bukti Transaksi</h4>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>No. Referensi:</span>
                <span className="font-mono font-bold text-slate-800">{selectedReceipt.ref}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Waktu:</span>
                <span>{selectedReceipt.date}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Metode:</span>
                <span>{selectedReceipt.method}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Status:</span>
                <span className="font-bold text-emerald-600">{selectedReceipt.status}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm">
                <span>Total:</span>
                <span className="font-mono text-emerald-700">{formatRupiah(selectedReceipt.amount)}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
