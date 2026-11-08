import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Sliders,
  QrCode,
  History,
  X,
  Save,
  Check,
  Upload,
  AlertCircle,
  Copy,
  DollarSign,
  Store,
  GitFork,
  MapPin,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Wallet,
  CheckCircle2,
  Clock,
  Eye,
  Hash,
  Inbox,
  CheckCheck
} from 'lucide-react';
import {
  MonetizationService,
  MonetizationConfig,
  MerchantLedger,
  PaymentSubmission
} from '../../services/monetization';

interface MasterAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  showNotification: (msg: string) => void;
}

export const MasterAdminModal: React.FC<MasterAdminModalProps> = ({
  isOpen,
  onClose,
  showNotification
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'inbox' | 'toggles' | 'qris' | 'history'>('stats');
  const [config, setConfig] = useState<MonetizationConfig>(() => MonetizationService.getConfig());
  const [ledger, setLedger] = useState<MerchantLedger>(() => MonetizationService.getLedger());
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>(() => MonetizationService.getLocalSubmissions());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [qrisPreview, setQrisPreview] = useState<string>(config.qrisImageUrl || '');
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(MonetizationService.getConfig());
      setLedger(MonetizationService.getLedger());
      setSubmissions(MonetizationService.getLocalSubmissions());

      // Realtime listener dari Firestore untuk setoran kasir masuk
      const unsubscribe = MonetizationService.subscribeSubmissions((subs) => {
        setSubmissions(subs);
        setLedger(MonetizationService.getLedger());
      });

      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const pendingCount = pendingSubmissions.length;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updated = await MonetizationService.saveConfig({
        ...config,
        qrisImageUrl: qrisPreview
      });
      setConfig(updated);
      showNotification('Pengaturan monetisasi & QRIS berhasil disimpan!');
    } catch {
      showNotification('Gagal menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadQris = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const base64 = evt.target?.result as string;
      setQrisPreview(base64);
      setConfig(prev => ({ ...prev, qrisImageUrl: base64 }));
      showNotification('Foto QRIS berhasil dipilih! Ketuk Simpan untuk menerapkan.');
    };
    reader.readAsDataURL(file);
  };

  const handleApproveSubmission = async (sub: PaymentSubmission) => {
    try {
      await MonetizationService.approvePaymentSubmission(sub.id, sub.merchantId, sub.baseAmount);
      setLedger(MonetizationService.getLedger());
      showNotification(`Setoran Rp ${sub.totalAmount.toLocaleString('id-ID')} (#${sub.uniqueCode}) berhasil diverifikasi lunas!`);
    } catch {
      showNotification('Gagal memverifikasi setoran.');
    }
  };

  const handleRejectSubmission = async (sub: PaymentSubmission) => {
    if (confirm(`Yakin tandai setoran #${sub.uniqueCode} belum masuk / ditolak?`)) {
      try {
        await MonetizationService.rejectPaymentSubmission(sub.id);
        showNotification(`Setoran #${sub.uniqueCode} ditandai ditolak.`);
      } catch {
        showNotification('Gagal menolak setoran.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-3.5 shadow-2xl relative border border-emerald-200 text-slate-800 max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header Master Admin */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-slate-900 leading-tight">WargaQu Master HQ</h3>
                <span className="text-[9px] bg-emerald-100 text-emerald-900 font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-300">
                  Owner Gate
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Pusat Monetisasi, Cek Mutasi Kode Unik &amp; QRIS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (5 Tabs) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 shrink-0 text-xs font-bold text-slate-600 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 shrink-0 ${
              activeTab === 'stats' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Statistik</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 shrink-0 relative ${
              activeTab === 'inbox' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Verifikasi</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('toggles')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 shrink-0 ${
              activeTab === 'toggles' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Saklar Fee</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qris')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 shrink-0 ${
              activeTab === 'qris' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QRIS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1 shrink-0 ${
              activeTab === 'history' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pr-0.5">
          {/* TAB 1: STATISTIK & BISNIS EKOSISTEM */}
          {activeTab === 'stats' && (
            <div className="space-y-3.5">
              {/* Card 3 Matriks */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-3.5 space-y-1 col-span-2 shadow-sm">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Total Estimasi Omset Terproses (Gross):
                  </div>
                  <div className="text-2xl font-black text-[#5eead4] font-mono tracking-tight">
                    Rp {ledger.totalGrossVolume.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-emerald-300">
                    Akumulasi transaksi seluruh merchant dan layanan warga
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-1">
                  <div className="text-[10px] text-emerald-800 font-bold uppercase">
                    Fee Terkumpul &amp; Disetor:
                  </div>
                  <div className="text-base font-black text-emerald-900 font-mono">
                    Rp {ledger.totalPaidToOwner.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[9px] text-emerald-700">Sudah Masuk ke QRIS/Rekening Owner</div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1">
                  <div className="text-[10px] text-amber-800 font-bold uppercase">
                    Fee Belum Disetor (Unbilled):
                  </div>
                  <div className="text-base font-black text-amber-950 font-mono">
                    Rp {ledger.accumulatedUnbilled.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[9px] text-amber-700">Tergantung Closing Kasir</div>
                </div>
              </div>

              {/* Status Pembayaran Pending Banner */}
              {pendingCount > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-xs font-bold text-red-900">
                      Ada {pendingCount} setoran kasir menunggu verifikasi!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('inbox')}
                    className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold rounded-xl active:scale-95"
                  >
                    Buka Verifikasi
                  </button>
                </div>
              )}

              {/* Rekap Sumber Pendapatan Modular */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  Aliran Monetisasi Modular:
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-amber-600" />
                      <span>POS UsahaQu (Bakso Qu)</span>
                    </span>
                    <span className="font-bold font-mono">
                      {config.posMode === 'percentage' ? `${config.posRate}% / trx` : `Rp ${config.posFlatMonthly.toLocaleString('id-ID')}/bln`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-red-600" />
                      <span>MuamalahQu (Belanja RT)</span>
                    </span>
                    <span className="font-bold font-mono">{config.muamalahRate}% / trx</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <GitFork className="w-3.5 h-3.5 text-emerald-600" />
                      <span>LeluhurQu (Cetak Silsilah)</span>
                    </span>
                    <span className="font-bold font-mono">Rp {config.cetakSilsilahFee.toLocaleString('id-ID')} / ekspor</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>AreaQu (Sewa Lapak Warga)</span>
                    </span>
                    <span className="font-bold font-mono">Rp {config.sewaLapakMonthly.toLocaleString('id-ID')} / bln</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INBOX VERIFIKASI SETORAN (DENGAN KODE UNIK 3 DIGIT) */}
          {activeTab === 'inbox' && (
            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl text-emerald-900 leading-relaxed text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cara Mudah Cek Mutasi Bank / QRIS Owner:</span>
                </div>
                <p>
                  Kasir mentransfer nominal persis beserta <strong>3 digit kode unik di belakang</strong> (contoh: <strong className="font-mono">Rp 10.147</strong>). Buka m-banking / notifikasi QRIS Anda, cocokkan nominalnya, lalu tekan <strong>"✅ Verifikasi Masuk (Lunas)"</strong> di bawah.
                </p>
              </div>

              {submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Inbox className="w-10 h-10 mx-auto text-slate-300" />
                  <p>Belum ada tiket setoran yang diajukan kasir.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                        sub.status === 'pending'
                          ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                          : sub.status === 'verified'
                          ? 'bg-emerald-50/50 border-emerald-200 opacity-90'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      {/* Baris Atas: Merchant + Nominal Unik */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-black text-slate-900 text-xs">
                            {sub.merchantName}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(sub.createdAt).toLocaleString('id-ID')}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-black text-base text-emerald-800">
                            Rp {sub.totalAmount.toLocaleString('id-ID')}
                          </div>
                          {sub.uniqueCode > 0 && (
                            <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.2 rounded font-mono">
                              Kode Unik: +{sub.uniqueCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Catatan / No Referensi */}
                      <div className="bg-white/80 p-2 rounded-xl text-[11px] text-slate-700 border border-slate-200 flex items-center justify-between">
                        <span>Catatan: <strong>{sub.proofNote}</strong></span>
                        {sub.proofImageUrl && (
                          <button
                            type="button"
                            onClick={() => setSelectedProofImg(sub.proofImageUrl || null)}
                            className="text-emerald-700 font-bold text-[10px] flex items-center gap-1 hover:underline"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat Foto Struk</span>
                          </button>
                        )}
                      </div>

                      {/* Status & Aksi Tombol 1-Klik */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sub.status === 'pending'
                              ? 'bg-amber-200 text-amber-950 animate-pulse'
                              : sub.status === 'verified'
                              ? 'bg-emerald-200 text-emerald-950'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {sub.status === 'pending'
                            ? '⏳ Menunggu Verifikasi'
                            : sub.status === 'verified'
                            ? '✅ Terverifikasi Lunas'
                            : '❌ Ditolak'}
                        </span>

                        {sub.status === 'pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRejectSubmission(sub)}
                              className="px-2.5 py-1 bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 text-[10px] font-bold rounded-lg transition"
                            >
                              Tolak
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApproveSubmission(sub)}
                              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[10px] font-black rounded-lg shadow-xs active:scale-95 transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-[#5eead4]" />
                              <span>Verifikasi Masuk (Lunas)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAKLAR FEE MODULAR (ON/OFF DI BELAKANG LAYAR) */}
          {activeTab === 'toggles' && (
            <div className="space-y-3.5 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-900 leading-relaxed text-[11px]">
                💡 <strong>Monetisasi Senyap:</strong> Semua opsi fee di bawah berjalan 100% di belakang layar tanpa mengubah harga menu/transaksi kasir di depan pembeli.
              </div>

              {/* Saklar Kode Unik 3 Digit (BARU!) */}
              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-700" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">
                        Kode Unik 3 Digit Otomatis
                      </div>
                      <div className="text-[10px] text-emerald-800">
                        Menambahkan 3 angka acak (+101 s/d +998) pada nominal transfer setoran
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.uniqueCodeEnabled}
                    onChange={e => setConfig({ ...config, uniqueCodeEnabled: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Saklar POS Kasir */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">
                        Fee POS Kasir Restoran (UsahaQu)
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Bagi hasil layanan kasir Bakso Qu
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enablePosFee}
                    onChange={e => setConfig({ ...config, enablePosFee: e.target.checked })}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                </div>

                {config.enablePosFee && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, posMode: 'percentage' })}
                        className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold ${
                          config.posMode === 'percentage'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        1% Per Transaksi
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, posMode: 'flat' })}
                        className={`flex-1 py-1.5 rounded-xl border text-[11px] font-bold ${
                          config.posMode === 'flat'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Rp 30.000 / Bulan (Flat)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Saklar MuamalahQu */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-red-600" />
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs">
                      Fee MuamalahQu (Marketplace Warga)
                    </div>
                    <div className="text-[10px] text-slate-500">1% per transaksi checkout belanja warga</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableMuamalahFee}
                  onChange={e => setConfig({ ...config, enableMuamalahFee: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Saklar Cetak Silsilah LeluhurQu */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs">
                      Fee Cetak / Ekspor Silsilah LeluhurQu
                    </div>
                    <div className="text-[10px] text-slate-500">Rp 10.000 per ekspor bagan keluarga</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableCetakSilsilahFee}
                  onChange={e => setConfig({ ...config, enableCetakSilsilahFee: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Saklar Sewa Lapak AreaQu */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs">
                      Sewa Lapak &amp; Radar AreaQu
                    </div>
                    <div className="text-[10px] text-slate-500">Rp 25.000 / bulan untuk titik POI lapak usaha</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableSewaLapakFee}
                  onChange={e => setConfig({ ...config, enableSewaLapakFee: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              {/* Pengaturan Ambang Batas Notifikasi QRIS */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                <label className="text-[11px] font-bold text-emerald-900 block">
                  Ambang Batas Akumulasi Muncul Pop-up QRIS:
                </label>
                <input
                  type="number"
                  value={config.thresholdQris}
                  onChange={e => setConfig({ ...config, thresholdQris: Number(e.target.value) })}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold"
                  placeholder="10000"
                />
                <p className="text-[10px] text-emerald-700">
                  Pop-up QRIS otomatis muncul saat saldo fee mencapai angka ini (misal Rp 10.000) atau saat Kasir menekan Closing.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: KELOLA QRIS & REKENING OWNER */}
          {activeTab === 'qris' && (
            <div className="space-y-3.5 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-amber-900 leading-relaxed text-[11px]">
                ℹ️ <strong>QRIS Anda Menyusul:</strong> Anda dapat mengunggah gambar QRIS kapan saja lewat tombol di bawah. Jika belum ada, sistem tetap menampilkan rekening bank dan e-wallet Anda.
              </div>

              {/* Upload QRIS Box */}
              <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-4 text-center bg-slate-50 space-y-2.5">
                {qrisPreview ? (
                  <div className="space-y-2">
                    <img
                      src={qrisPreview}
                      alt="Preview QRIS Owner"
                      className="w-44 h-44 object-contain mx-auto rounded-xl border border-slate-300 shadow-sm bg-white p-1"
                    />
                    <div className="text-[10px] text-emerald-700 font-bold">QRIS Terpasang</div>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-4">
                    <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
                    <div className="font-bold text-slate-700">Belum Ada Gambar QRIS</div>
                    <div className="text-[10px] text-slate-400">
                      Format PNG, JPG atau screenshot QRIS statis Anda
                    </div>
                  </div>
                )}

                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer transition active:scale-95 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{qrisPreview ? 'Ganti Gambar QRIS' : 'Unggah Foto QRIS Sekarang'}</span>
                  <input type="file" accept="image/*" onChange={handleUploadQris} className="hidden" />
                </label>
              </div>

              {/* Profil Rekening & e-Wallet Alternatif */}
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Pemilik Akun / QRIS:</label>
                  <input
                    type="text"
                    value={config.ownerName}
                    onChange={e => setConfig({ ...config, ownerName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Bank / Nama e-Wallet:</label>
                  <input
                    type="text"
                    value={config.bankName}
                    onChange={e => setConfig({ ...config, bankName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    placeholder="BCA / Mandiri / GoPay / DANA"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nomor Rekening / No. HP e-Wallet:</label>
                  <input
                    type="text"
                    value={config.bankAccount}
                    onChange={e => setConfig({ ...config, bankAccount: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    placeholder="Contoh: 1234-5678-90 atau 0812-xxxx-xxxx"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RIWAYAT LEDGER TRANSAKSI */}
          {activeTab === 'history' && (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                <span>Riwayat Perhitungan Fee Otomatis</span>
                <span>{ledger.history.length} Catatan</span>
              </div>

              {ledger.history.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  Belum ada transaksi fee tercatat. Begitu kasir bertransaksi, data langsung masuk ke sini secara otomatis.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar">
                  {ledger.history.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          Order #{entry.orderId} ({entry.module.toUpperCase()})
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(entry.timestamp).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-700">
                          +Rp {entry.feeAmount.toLocaleString('id-ID')}
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            entry.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {entry.status === 'paid' ? 'Lunas' : 'Belum Disetor'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Lihat Foto Struk */}
        {selectedProofImg && (
          <div className="fixed inset-0 z-60 bg-black/90 p-4 flex flex-col items-center justify-center animate-in fade-in">
            <button
              onClick={() => setSelectedProofImg(null)}
              className="absolute top-4 right-4 text-white bg-white/20 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedProofImg}
              alt="Foto Bukti Struk"
              className="max-h-[80vh] max-w-full rounded-2xl border border-white/20 object-contain"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveSettings}
            className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
