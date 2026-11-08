import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  CheckCircle,
  Sparkles,
  MoreVertical,
  ShieldCheck,
  FileDown,
  ArrowRightLeft,
  ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { UpdateService } from '../../services/update';

interface PWAInstallBannerProps {
  onDismiss?: () => void;
  showToast?: (msg: string) => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  onDismiss,
  showToast
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('wargaqu_pwa_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // If already installed, don't show the banner
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const result = await install();
      if (result === 'accepted') {
        showToast?.('Terima kasih! WargaQu sedang dipasang ke Layar Utama Anda.');
      }
    } else {
      // Show manual guide modal (especially for iOS Safari or manual browser menus)
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('wargaqu_pwa_dismissed', 'true');
    } catch {
      // ignore
    }
    onDismiss?.();
  };

  return (
    <>
      {/* FLOATING PWA INSTALL BANNER ON MOBILE */}
      <div className="mx-4 mt-3 mb-2 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl p-3 shadow-lg border border-emerald-400/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300 relative z-20">
        
        {/* App Icon + Text info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-0.5 border border-mint-accent/40 shadow-sm shrink-0 flex items-center justify-center">
            <img
              src="./pwa-192x192.png"
              alt="WargaQu Icon"
              className="w-full h-full rounded-lg object-cover"
              onError={e => {
                // fallback to SVG if PNG is resolving
                (e.target as HTMLImageElement).src = './icon.svg';
              }}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-white tracking-tight leading-none">
                Pasang WargaQu
              </h4>
              <span className="text-[9px] bg-emerald-400/20 text-[#5eead4] border border-emerald-400/30 font-bold px-1.5 py-0.2 rounded-full">
                Gratis
              </span>
            </div>
            <p className="text-[10px] text-emerald-200/80 truncate mt-0.5">
              Langsung di HP • Akses Offline & Cepat
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-[#34d399] to-[#2dd4bf] hover:from-[#5eead4] hover:to-[#34d399] text-[#064e3b] font-black text-xs px-3 py-1.5 rounded-xl shadow-md active:scale-95 transition flex items-center gap-1"
            title="Install ke HP Sekarang"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1 text-emerald-400/70 hover:text-white rounded-lg transition"
            title="Tutup banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STEP-BY-STEP INSTALL GUIDE MODAL (FOR IOS SAFARI OR MANUAL CHROME MENU) */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-xs p-5 space-y-4 shadow-2xl text-slate-800">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">Cara Pasang ke HP</h3>
                  <p className="text-[10px] text-slate-400">
                    {isIOS ? 'Petunjuk Khusus iPhone / iOS' : 'Petunjuk Browser Android'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* iOS Safari Guide */}
            {isIOS ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Ketuk Tombol Bagikan</span>
                    Ketuk ikon <b>Bagikan (Share)</b> <Share className="w-3.5 h-3.5 inline text-blue-500 mx-0.5" /> pada menu bawah peramban Safari.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Pilih Tambah ke Layar Utama</span>
                    Gulir ke bawah pada menu opsi, lalu pilih <b>"Tambah ke Layar Utama" (Add to Home Screen)</b> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Selesai & Buka App</span>
                    Ketuk <b>"Tambah" (Add)</b> di pojok kanan atas. Ikon WargaQu akan langsung muncul di beranda HP Anda!
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Chrome Manual Guide */
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Buka Menu Browser</span>
                    Ketuk ikon titik tiga <MoreVertical className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" /> di pojok kanan atas Google Chrome.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Pilih "Instal Aplikasi"</span>
                    Pilih menu <b>"Instal Aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">Konfirmasi Instalasi</span>
                    Tekan <b>Instal</b>. Aplikasi WargaQu siap digunakan layaknya aplikasi bawaan ponsel.
                  </div>
                </div>
              </div>
            )}

            {/* Pilihan Khusus: Unduh File APK Android Langsung dari GitHub */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
                    <FileDown className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Lebih Suka File APK Android?</span>
                  </span>
                  <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-black">
                    GitHub Release
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                  Jika butuh fitur native Android seperti cetak printer Bluetooth thermal, Anda bisa mengunduh file <strong>BaksoQu-1.0.apk</strong> yang di-build dari repositori yang sama.
                </p>

                <div className="mt-2 flex flex-col gap-1.5">
                  <a
                    href={UpdateService.getGithubApkDownloadUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh APK Android (.apk)</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <button
                    type="button"
                    onClick={async () => {
                      const res = await UpdateService.copyTransferCodeToClipboard();
                      showToast?.(res.message);
                    }}
                    className="w-full py-1.5 px-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-900 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                    <span>Salin Data PWA untuk Dipulihkan di APK</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
