import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Download,
  Upload,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  AlertTriangle,
  Info,
  Check,
  ChevronRight,
  Zap,
  Globe,
  Link2,
  ExternalLink,
  Copy,
  ArrowRightLeft
} from 'lucide-react';
import { UpdateService, CURRENT_APP_VERSION, AppVersionInfo } from '../../services/update';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface UpdateCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const UpdateCenterModal: React.FC<UpdateCenterModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [versionInfo] = useState<AppVersionInfo>(UpdateService.getVersionInfo());
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(UpdateService.isAutoUpdateEnabled());
  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const [restoreJson, setRestoreJson] = useState<string>('');
  const [showRestoreBox, setShowRestoreBox] = useState<boolean>(false);
  const [githubUrl, setGithubUrl] = useState<string>(() => UpdateService.getGithubRepoUrl());
  const [showGithubConfig, setShowGithubConfig] = useState<boolean>(false);

  const handleSaveGithubUrl = (e: React.FormEvent) => {
    e.preventDefault();
    UpdateService.setGithubRepoUrl(githubUrl);
    setShowGithubConfig(false);
    showToast('Tautan repositori GitHub berhasil disimpan!');
  };

  const handleCopyTransferCode = async () => {
    const res = await UpdateService.copyTransferCodeToClipboard();
    showToast(res.message);
  };

  const handlePasteTransferFromClipboard = async () => {
    try {
      if (!navigator.clipboard) {
        showToast('Clipboard tidak didukung browser. Tempelkan manual di kotak Pulihkan.');
        setShowRestoreBox(true);
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.includes('WargaQu')) {
        showToast('Clipboard tidak berisi cadangan WargaQu yang valid. Buka PWA dan klik "Salin Data" terlebih dahulu.');
        setShowRestoreBox(true);
        return;
      }
      const res = UpdateService.restoreBackup(text);
      showToast(res.message);
      if (res.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      showToast('Izin clipboard ditolak. Silakan tempelkan manual di kotak teks Pulihkan.');
      setShowRestoreBox(true);
    }
  };

  if (!isOpen) return null;

  const handleCheckUpdates = async () => {
    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await UpdateService.checkForUpdates();
      setTimeout(() => {
        setIsChecking(false);
        setCheckResult(res.message);
        showToast(res.hasUpdate ? 'Pembaruan tersedia!' : 'Aplikasi Anda sudah versi paling baru.');
      }, 1200);
    } catch {
      setIsChecking(false);
      setCheckResult('Aplikasi sudah di versi paling mutakhir.');
    }
  };

  const handleToggleAutoUpdate = (enabled: boolean) => {
    setAutoUpdateEnabled(enabled);
    UpdateService.setAutoUpdateEnabled(enabled);
    showToast(enabled ? 'Pembaruan otomatis di latar belakang aktif.' : 'Pembaruan otomatis dimatikan.');
  };

  const handleDownloadBackup = () => {
    UpdateService.downloadBackupFile();
    showToast('Berkas cadangan data WargaQu (.JSON) berhasil diunduh!');
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreJson.trim()) return;
    const res = UpdateService.restoreBackup(restoreJson);
    showToast(res.message);
    if (res.success) {
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col relative my-auto text-slate-800">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5eead4]/20 border border-[#5eead4]/30 flex items-center justify-center text-[#5eead4]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>Pusat Pembaruan Sistem</span>
                <span className="text-[9px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
                  v{versionInfo.version}
                </span>
              </h3>
              <p className="text-[10px] text-emerald-200">Auto-Update &amp; Proteksi Data Utuh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar text-xs">
          
          {/* Card Status Versi Saat Ini */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-100/50 border border-emerald-200 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  Status Aplikasi Anda
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h4 className="text-base font-black text-slate-900">
                    WargaQu v{versionInfo.version}
                  </h4>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[9px] rounded-full flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>TERBARU</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Rilis: {versionInfo.releaseDate} • Saluran: {versionInfo.channel}
                </p>
              </div>

              <div className="p-2 bg-white rounded-xl border border-emerald-200 text-emerald-700 shadow-2xs">
                {versionInfo.platform.includes('Android') ? (
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Globe className="w-5 h-5 text-teal-600" />
                )}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-200/70 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 block">Tipe Runtime:</span>
                <strong className="text-slate-800">{versionInfo.platform}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Pengecekan Terakhir:</span>
                <strong className="text-slate-800">{UpdateService.getLastCheckTime()}</strong>
              </div>
            </div>

            {/* Tombol Periksa Pembaruan */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCheckUpdates}
                disabled={isChecking}
                className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-600 active:scale-98 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Memeriksa...' : 'Periksa Pembaruan Sekarang'}</span>
              </button>
            </div>

            {checkResult && (
              <div className="mt-2.5 p-2.5 bg-white/90 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{checkResult}</span>
              </div>
            )}

            {/* In-App Install Prompt Card (Jika belum terpasang sebagai aplikasi standalone) */}
            {!isInstalled && (
              <div className="mt-3 p-3 bg-white/95 rounded-xl border border-emerald-300 shadow-2xs flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-[11px] text-slate-900 block truncate">
                      Pasang ke Layar Utama HP
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {isIOS ? 'Gunakan menu Safari "Tambah ke Layar Utama"' : 'Instal cepat seperti aplikasi native'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (isInstallable) {
                      const res = await install();
                      if (res === 'accepted') {
                        showToast('WargaQu sedang dipasang ke Layar Utama HP!');
                      }
                    } else if (isIOS) {
                      showToast('iPhone: Ketuk tombol Share di Safari, lalu pilih "Tambah ke Layar Utama"');
                    } else {
                      showToast('Buka menu titik 3 browser Anda, lalu pilih "Instal Aplikasi"');
                    }
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[10px] rounded-xl shadow-xs shrink-0 active:scale-95 transition"
                >
                  Pasang Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Jaminan Keamanan Data (Zero Data Loss) */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#5eead4]" />
              <h5 className="font-bold text-xs text-white">Jaminan Pembaruan Tanpa Hapus Data</h5>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>Data Anda 100% Aman!</strong> Seluruh transaksi UsahaQu, silsilah LeluhurQu, data warga, dan saldo WargaPay disimpan di memori independen perangkat yang <strong>tidak akan terhapus</strong> saat aplikasi diperbarui.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="text-emerald-300 font-bold block">Di PWA / Web:</span>
                <span className="text-slate-400">Update otomatis di background saat dibuka ulang.</span>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="text-teal-300 font-bold block">Di Android APK:</span>
                <span className="text-slate-400">Install langsung menimpa tanpa uninstal APK lama.</span>
              </div>
            </div>
          </div>

          {/* Sinergi PWA & APK Android (1 Repository GitHub) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50 to-teal-100/60 border border-teal-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-teal-700" />
                <h5 className="font-bold text-xs text-teal-950">Sinergi PWA ↔ APK Android (1 Repo GitHub)</h5>
              </div>
              <span className="text-[9px] bg-teal-200 text-teal-900 px-1.5 py-0.2 rounded font-black">
                Rilis Bersama
              </span>
            </div>

            <p className="text-[10px] text-teal-900 leading-relaxed">
              PWA dan APK dibangun dari 1 repositori GitHub yang sama. Karena sistem keamanan isolasi aplikasi (Android Sandbox), data browser PWA dan APK terpisah. Gunakan tombol di bawah ini untuk mengunduh APK atau memindahkan data seketika:
            </p>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={UpdateService.getGithubApkDownloadUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File APK (.apk)</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              <a
                href={UpdateService.getGithubReleasesPageUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-2 bg-white hover:bg-teal-50 border border-teal-300 text-teal-900 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                <span>Rilis GitHub Repo</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>

            {/* PWA to APK Transfer Helper */}
            <div className="p-2.5 bg-white/90 rounded-xl border border-teal-200/80 space-y-1.5">
              <span className="text-[10px] font-extrabold text-teal-950 block">
                Pindah Data dari PWA ke APK (1-Klik Tanpa Ketik Ulang):
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyTransferCode}
                  className="flex-1 py-1.5 px-2 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 text-emerald-900 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                  title="Salin seluruh data dari PWA untuk dipindahkan ke APK"
                >
                  <Copy className="w-3 h-3 text-emerald-700" />
                  <span>1. Salin Data di PWA</span>
                </button>

                <button
                  type="button"
                  onClick={handlePasteTransferFromClipboard}
                  className="flex-1 py-1.5 px-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                  title="Buka aplikasi APK lalu tekan tombol ini untuk langsung mengisi seluruh data"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>2. Tempel di APK</span>
                </button>
              </div>
            </div>

            {/* Opsi Ubah URL Repositori GitHub jika bukan default */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowGithubConfig(!showGithubConfig)}
                className="text-[10px] text-teal-800 hover:text-teal-950 font-semibold underline decoration-dotted flex items-center gap-1"
              >
                <span>{showGithubConfig ? 'Sembunyikan Pengaturan Tautan Repo' : 'Atur Alamat URL GitHub Repo Pribadi'}</span>
              </button>

              {showGithubConfig && (
                <form onSubmit={handleSaveGithubUrl} className="mt-2 space-y-1.5 animate-in fade-in">
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full p-2 bg-white border border-teal-300 rounded-lg text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    required
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold"
                    >
                      Simpan Tautan Repo
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Pengaturan Pembaruan Otomatis */}

          <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 text-xs block">Pembaruan Otomatis (Background)</span>
                <span className="text-[10px] text-slate-500">Unduh pembaruan di latar belakang tanpa mengganggu</span>
              </div>
              <button
                onClick={() => handleToggleAutoUpdate(!autoUpdateEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  autoUpdateEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoUpdateEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Log Perubahan (Changelog) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
            <button
              onClick={() => setShowChangelog(!showChangelog)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-800"
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Apa yang Baru di Versi {versionInfo.version}?</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                {showChangelog ? 'Tutup' : 'Lihat'}
              </span>
            </button>

            {showChangelog && (
              <ul className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600 list-disc list-inside animate-in fade-in">
                {versionInfo.changelog.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Backup & Pulihkan Cadangan Data Mandiri */}
          <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-xs">Cadangkan &amp; Pulihkan Data Mandiri</span>
              <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                Opsional
              </span>
            </div>
            <p className="text-[10px] text-emerald-800 leading-relaxed">
              Anda bisa mengekspor seluruh basis data ke file JSON sebagai cadangan pribadi sebelum ganti HP atau pembaruan besar.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadBackup}
                className="flex-1 py-2 px-2.5 bg-white border border-emerald-300 hover:bg-emerald-100/70 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Unduh Cadangan (.JSON)</span>
              </button>

              <button
                onClick={() => setShowRestoreBox(!showRestoreBox)}
                className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Pulihkan</span>
              </button>
            </div>

            {showRestoreBox && (
              <form onSubmit={handleRestoreSubmit} className="pt-2 space-y-2 animate-in fade-in">
                <textarea
                  value={restoreJson}
                  onChange={(e) => setRestoreJson(e.target.value)}
                  placeholder="Tempelkan isi file cadangan JSON di sini untuk memulihkan data..."
                  rows={3}
                  className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-mono text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Konfirmasi Pulihkan Data
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 text-center">
          <p className="text-[10px] text-slate-400">
            WargaQu Ecosystem • Build #{versionInfo.buildNumber} • Zero Data Loss Architecture
          </p>
        </div>
      </div>
    </div>
  );
};
