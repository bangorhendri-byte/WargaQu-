import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  Copy,
  Upload,
  AlertCircle,
  Sparkles,
  Receipt,
  ArrowRight,
  Clock,
  Check,
  Camera,
  ShieldCheck,
  Hash
} from 'lucide-react';
import {
  MonetizationService,
  MonetizationConfig,
  MerchantLedger,
  PaymentSubmission
} from '../../services/monetization';

interface OwnerQrisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettledSuccess?: () => void;
  reason?: 'threshold' | 'closing' | 'manual';
  merchantName?: string;
}

export const OwnerQrisModal: React.FC<OwnerQrisModalProps> = ({
  isOpen,
  onClose,
  onSettledSuccess,
  reason = 'closing',
  merchantName = 'UsahaQu - Restoran Bakso Qu'
}) => {
  const [config, setConfig] = useState<MonetizationConfig>(() => MonetizationService.getConfig());
  const [ledger, setLedger] = useState<MerchantLedger>(() => MonetizationService.getLedger());
  const [isCopiedBank, setIsCopiedBank] = useState<boolean>(false);
  const [isCopiedAmount, setIsCopiedAmount] = useState<boolean>(false);
  const [transferProofNote, setTransferProofNote] = useState<string>('');
  const [proofImage, setProofImage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedTicket, setSubmittedTicket] = useState<PaymentSubmission | null>(null);

  // Generate Kode Unik 3 Digit Acak per sesi tagihan
  const [uniqueCodeData, setUniqueCodeData] = useState<{ uniqueCode: number; totalWithCode: number }>(() => {
    const due = MonetizationService.getLedger().accumulatedUnbilled;
    return MonetizationService.generateUniqueCode(due);
  });

  useEffect(() => {
    if (isOpen) {
      const curLedger = MonetizationService.getLedger();
      setLedger(curLedger);
      setConfig(MonetizationService.getConfig());
      setUniqueCodeData(MonetizationService.generateUniqueCode(curLedger.accumulatedUnbilled));
      setSubmittedTicket(null);
      setTransferProofNote('');
      setProofImage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentDue = ledger.accumulatedUnbilled;
  const { uniqueCode, totalWithCode } = uniqueCodeData;

  const handleUploadProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setProofImage(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      const submission = await MonetizationService.createPaymentSubmission({
        merchantId: ledger.merchantId,
        merchantName,
        baseAmount: currentDue,
        uniqueCode,
        totalAmount: totalWithCode,
        proofNote: transferProofNote.trim() || `Closing Kasir ${new Date().toLocaleDateString('id-ID')}`,
        proofImageUrl: proofImage,
        reason
      });

      // Permintaan Owner: Kasir langsung kembali normal tanpa menunggu karena pengecekan mutasi dilakukan berkala
      await MonetizationService.markFeeSettled(currentDue, `Setoran Diajukan (${submission.id})`);
      setLedger(MonetizationService.getLedger());

      setSubmittedTicket(submission);
      if (onSettledSuccess) onSettledSuccess();
    } catch {
      // Fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyBankInfo = () => {
    navigator.clipboard?.writeText(`${config.bankName} - ${config.bankAccount} a.n ${config.ownerName}`);
    setIsCopiedBank(true);
    setTimeout(() => setIsCopiedBank(false), 2500);
  };

  const copyExactAmount = () => {
    navigator.clipboard?.writeText(totalWithCode.toString());
    setIsCopiedAmount(true);
    setTimeout(() => setIsCopiedAmount(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative border border-emerald-100 text-slate-800 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                  Setoran Layanan Sistem
                </h3>
                <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                  {reason === 'closing' ? 'Closing Kasir' : 'Batas Rp 10.000'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Platform WargaQu • Owner QRIS &amp; Kode Unik</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 active:scale-95 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submittedTicket ? (
          /* STATE SETORAN DIAJUKAN (MENUNGGU VERIFIKASI OWNER) */
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Tiket Setoran Terkirim #{submittedTicket.uniqueCode}
              </span>
              <h4 className="font-black text-base text-slate-900 mt-2">
                Menunggu Verifikasi Mutasi Owner
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1">
                Tiket setoran nominal <strong className="text-emerald-800 font-mono">Rp {submittedTicket.totalAmount.toLocaleString('id-ID')}</strong> telah masuk ke Panel Master HQ Owner ({config.ownerEmail}).
              </p>
            </div>

            {/* Detail Tiket Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>ID Tiket Setoran:</span>
                <span className="font-mono font-bold text-slate-700">{submittedTicket.id}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 text-[11px]">
                <span>Tagihan Pokok:</span>
                <span className="font-mono">Rp {submittedTicket.baseAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-amber-800 text-[11px] font-bold">
                <span>Kode Unik Verifikasi:</span>
                <span className="font-mono bg-amber-200/80 px-1.5 py-0.2 rounded">+{submittedTicket.uniqueCode}</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 font-bold border-t border-slate-200 pt-1.5">
                <span>Total Ditransfer:</span>
                <span className="font-mono text-emerald-700 text-sm">Rp {submittedTicket.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-left flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Owner cukup mencocokkan nominal <strong className="font-mono">Rp {submittedTicket.totalAmount.toLocaleString('id-ID')}</strong> di mutasi m-banking / QRIS, lalu menekan tombol <strong>"Verifikasi Lunas"</strong> di Master HQ. Saldo kasir Anda akan otomatis lunas ke Rp 0.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 text-white font-bold text-xs rounded-2xl shadow-md transition active:scale-98"
            >
              Kembali ke Aplikasi &amp; Kasir
            </button>
          </div>
        ) : (
          <>
            {/* Financial Ledger Banner with 3-Digit Unique Code */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white rounded-2xl p-4 shadow-md space-y-3">
              <div className="flex justify-between items-center text-xs text-emerald-300 border-b border-white/10 pb-2">
                <span>Merchant / Toko:</span>
                <span className="font-bold text-white truncate max-w-[190px]">{merchantName}</span>
              </div>

              {/* Rincian Pokok + Kode Unik */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>Tagihan Layanan Pokok:</span>
                  <span className="font-mono font-bold">Rp {currentDue.toLocaleString('id-ID')}</span>
                </div>
                {uniqueCode > 0 && (
                  <div className="flex justify-between items-center text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-400/30">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kode Unik Otomatis (3 Digit):</span>
                    </span>
                    <span className="font-mono font-extrabold text-amber-200">+{uniqueCode}</span>
                  </div>
                )}
              </div>

              {/* Total Nominal Pas yang Harus Ditransfer */}
              <div className="bg-white/10 p-3 rounded-xl flex items-center justify-between border border-white/10">
                <div>
                  <div className="text-[10px] text-amber-300 uppercase font-black tracking-wide">
                    Nominal Transfer Pas (Wajib Persis):
                  </div>
                  <div className="text-2xl font-black text-[#5eead4] font-mono tracking-tight mt-0.5">
                    Rp {totalWithCode.toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyExactAmount}
                  className="px-2.5 py-1.5 bg-emerald-500/30 hover:bg-emerald-500/50 text-[#5eead4] border border-[#5eead4]/40 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition"
                  title="Salin nominal tepat beserta kode unik"
                >
                  <Copy className="w-3 h-3" />
                  <span>{isCopiedAmount ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>

              <div className="text-[10px] text-emerald-200/90 bg-emerald-950/40 p-2 rounded-xl flex items-center gap-1.5 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>3 angka ekor unik mencegah dana tertukar dan memudahkan Owner cek mutasi.</span>
              </div>
            </div>

            {/* QRIS & Payment Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-center">
              <div className="text-xs font-bold text-slate-800">
                Pindai QRIS Resmi Pengelola Platform:
              </div>

              {/* QRIS Image or Styled Mockup */}
              <div className="flex justify-center">
                {config.qrisImageUrl ? (
                  <img
                    src={config.qrisImageUrl}
                    alt="QRIS Owner WargaQu"
                    className="w-48 h-48 object-contain rounded-xl border border-slate-300 shadow-sm bg-white p-2"
                  />
                ) : (
                  <div className="w-52 h-52 bg-white rounded-2xl border-2 border-dashed border-emerald-400 p-3 flex flex-col items-center justify-center space-y-2 shadow-xs">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-700">
                      <QrCode className="w-16 h-16" />
                    </div>
                    <div className="text-[11px] font-black text-slate-800 leading-tight">
                      {config.ownerName}
                    </div>
                    <span className="text-[9px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                      QRIS Platform WargaQu
                    </span>
                    <span className="text-[9px] text-slate-400 italic">
                      (QRIS resmi disusulkan lewat Master Admin HQ)
                    </span>
                  </div>
                )}
              </div>

              {/* Rekening / e-Wallet Alternatif */}
              <div className="bg-white rounded-xl p-2.5 border border-slate-200 text-left space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Rekening / e-Wallet Pengelola:</span>
                  <button
                    type="button"
                    onClick={copyBankInfo}
                    className="text-emerald-700 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopiedBank ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
                <div className="text-xs font-mono font-bold text-slate-800">
                  {config.bankName} - {config.bankAccount}
                </div>
                <div className="text-[10px] text-slate-500">
                  Atas Nama: <strong>{config.ownerName}</strong>
                </div>
              </div>
            </div>

            {/* Input Catatan Transfer & Unggah Struk Bukti */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                  Catatan / Pengirim Transfer:
                </label>
                <input
                  type="text"
                  value={transferProofNote}
                  onChange={e => setTransferProofNote(e.target.value)}
                  placeholder="Contoh: BCA a.n Hendri - Closing Shift 1"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 text-[11px] block mb-1">
                  Foto Bukti Transfer Struk (Opsional):
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700 transition">
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{proofImage ? 'Ganti Foto Struk' : 'Unggah Tangkapan Layar Struk'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadProof}
                      className="hidden"
                    />
                  </label>
                  {proofImage && (
                    <button
                      type="button"
                      onClick={() => setProofImage('')}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {proofImage && (
                  <div className="mt-2 text-center">
                    <img
                      src={proofImage}
                      alt="Pratinjau Struk"
                      className="max-h-24 mx-auto rounded-lg border border-slate-300 shadow-xs object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isSubmitting || currentDue <= 0}
                onClick={handleConfirmPayment}
                className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-[#5eead4]" />
                <span>
                  {isSubmitting
                    ? 'Mengirim Tiket...'
                    : `Saya Sudah Transfer Rp ${totalWithCode.toLocaleString('id-ID')}`}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold"
              >
                Tutup Sementara (Bayar Nanti)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
