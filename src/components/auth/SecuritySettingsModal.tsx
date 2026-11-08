import React, { useState } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Lock,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  LogOut,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  History,
  ShieldAlert,
  Info,
  Download,
  Crown,
  Award,
  CheckCircle2,
  Zap,
  Fingerprint
} from 'lucide-react';
import { AuthService, GENESIS_AUTHOR } from '../../services/auth';
import { UserAccount } from '../../types';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserUpdated: (user: UserAccount | null) => void;
  showNotification: (msg: string) => void;
  onTriggerLostPhoneWizard?: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  showNotification,
  onTriggerLostPhoneWizard,
}) => {
  const [activeTab, setActiveTab] = useState<'perangkat' | 'hak_cipta' | 'anti_hacker'>('perangkat');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSignature, setCopiedSignature] = useState(false);
  const [showFullRawId, setShowFullRawId] = useState(false);

  // Ganti PIN states
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Unlink confirm state
  const [isConfirmingUnlink, setIsConfirmingUnlink] = useState(false);
  const [unlinkPin, setUnlinkPin] = useState('');
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  // Audit logs state
  const [showLogs, setShowLogs] = useState(false);

  if (!isOpen) return null;

  const bindingInfo = AuthService.getDeviceBindingInfo();
  const maskedDev = AuthService.getMaskedCurrentDeviceId();
  const rawDev = AuthService.getCurrentDeviceId();
  const auditLogs = AuthService.getAuditLogs(currentUser.id);

  const handleCopyKey = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUser.emergencyRecoveryKey);
      setCopiedKey(true);
      showNotification('Master Recovery Key disalin ke clipboard!');
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);
    if (!oldPin || !newPin || newPin.length < 6) {
      setPinMsg({ text: 'PIN baru harus 6 digit angka.', isError: true });
      return;
    }

    const res = AuthService.changePin(currentUser.id, oldPin, newPin);
    if (res.success && res.user) {
      setPinMsg({ text: 'PIN keamanan berhasil diubah.', isError: false });
      showNotification('PIN keamanan berhasil diperbarui!');
      onUserUpdated(res.user);
      setOldPin('');
      setNewPin('');
      setTimeout(() => setIsChangingPin(false), 1500);
    } else {
      setPinMsg({ text: res.message, isError: true });
    }
  };

  const handleUnlinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlinkError(null);
    if (!unlinkPin) {
      setUnlinkError('Masukkan PIN untuk konfirmasi pelepasan tautan.');
      return;
    }

    const res = AuthService.unlinkCurrentDevice(currentUser.id, unlinkPin);
    if (res.success) {
      showNotification('Perangkat ini berhasil dilepas dari ikatan akun.');
      onUserUpdated(null);
      onClose();
    } else {
      setUnlinkError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col relative my-auto">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#5eead4]" />
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Pusat Keamanan &amp; Hak Cipta</span>
                {(currentUser.isGenesisOwner || currentUser.email?.toLowerCase() === GENESIS_AUTHOR.email.toLowerCase()) && (
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black flex items-center gap-0.5 shadow-xs">
                    <Crown className="w-2.5 h-2.5" />
                    <span>OWNER</span>
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-emerald-200">WargaQu Security &amp; Anti-Plagiarism Shield</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('perangkat')}
            className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'perangkat'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Perangkat &amp; PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('hak_cipta')}
            className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'hak_cipta'
                ? 'border-amber-500 text-amber-800 bg-white font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>Hak Cipta &amp; Pemilik</span>
          </button>

          <button
            onClick={() => setActiveTab('anti_hacker')}
            className={`flex-1 py-2.5 px-2 flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'anti_hacker'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
            <span>Anti-Hacker</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar text-xs">
          {activeTab === 'perangkat' && (
            <div className="space-y-3.5 animate-in fade-in">
              {/* Card Status Device Binding */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-700" />
                <span>Status Perangkat Saat Ini</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3 h-3" />
                <span>Terikat Aktif</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
              <div>
                <span className="text-slate-500 block">Nama Perangkat:</span>
                <span className="font-semibold text-slate-800">{bindingInfo.friendlyDeviceName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Hardware ID (Disamarkan):</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                    {showFullRawId ? rawDev : maskedDev}
                  </span>
                  <button
                    onClick={() => setShowFullRawId(!showFullRawId)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                    title={showFullRawId ? 'Sembunyikan Hardware ID' : 'Buka Topeng Hardware ID'}
                  >
                    {showFullRawId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 bg-white/70 p-2 rounded-xl border border-emerald-100 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Device ID dibuat dari tanda tangan chip unik perangkat dan <strong>disembunyikan</strong> dari publik. Akun Anda tidak dapat di-clone atau dibuka di HP lain tanpa otorisasi pemulihan.
              </span>
            </div>
          </div>

          {/* KOTAK MASTER EMERGENCY RECOVERY KEY */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Master Recovery Key (Solusi HP Hilang)</span>
              </span>
            </div>

            <p className="text-[11px] text-amber-900/80 leading-relaxed">
              Catat atau simpan kode ini di tempat aman. Jika HP Anda hilang, kode ini adalah <strong>kunci resmi</strong> untuk mencabut akses di HP lama dan memindahkan akun ke HP baru Anda.
            </p>

            <div className="flex items-center justify-between bg-white border border-amber-300 rounded-xl p-2.5 shadow-2xs">
              <span className="font-mono font-extrabold text-slate-800 tracking-wider text-xs sm:text-sm select-all">
                {currentUser.emergencyRecoveryKey}
              </span>
              <button
                onClick={handleCopyKey}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition active:scale-95 shadow-xs"
              >
                {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* TINDAKAN KEAMANAN */}
          <div className="space-y-2 pt-1">
            <span className="font-bold text-slate-800 block text-xs">Pilihan Keamanan Akun:</span>

            {/* Tombol Ganti PIN */}
            {!isChangingPin ? (
              <button
                onClick={() => setIsChangingPin(true)}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>Ganti PIN Keamanan (6 Digit)</span>
                </div>
                <span className="text-[11px] text-slate-400">Ubah &gt;</span>
              </button>
            ) : (
              <form onSubmit={handleChangePinSubmit} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Ubah PIN Keamanan:</span>
                  <button type="button" onClick={() => setIsChangingPin(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {pinMsg && (
                  <div className={`p-2 rounded text-[11px] ${pinMsg.isError ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {pinMsg.text}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="PIN Lama (6 digit)"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono tracking-widest"
                    required
                  />
                  <input
                    type="password"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="PIN Baru (6 digit)"
                    className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono tracking-widest font-bold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Simpan PIN Baru
                </button>
              </form>
            )}

            {/* Riwayat Audit Keamanan */}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                <span>Log Aktivitas &amp; Verifikasi Perangkat</span>
              </div>
              <span className="text-[11px] text-slate-400">{showLogs ? 'Tutup' : 'Lihat'}</span>
            </button>

            {showLogs && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar text-[11px]">
                {auditLogs.length === 0 ? (
                  <span className="text-slate-400">Belum ada catatan aktivitas.</span>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="pb-1.5 border-b border-slate-200 last:border-none">
                      <div className="flex justify-between text-slate-700 font-semibold">
                        <span>{log.event}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
                      </div>
                      <div className="text-slate-500 text-[10px]">{log.details}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Putus Tautan Perangkat (Unlink) */}
            {!isConfirmingUnlink ? (
              <button
                onClick={() => setIsConfirmingUnlink(true)}
                className="w-full p-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Putus Tautan Perangkat Ini (Unlink Device)</span>
                </div>
                <span className="text-[11px] text-rose-500">Lepas &gt;</span>
              </button>
            ) : (
              <form onSubmit={handleUnlinkSubmit} className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 text-xs">Konfirmasi Putus Tautan HP:</span>
                  <button type="button" onClick={() => setIsConfirmingUnlink(false)} className="text-rose-400 hover:text-rose-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-rose-700">
                  Perangkat ini akan dilepas dari ikatan akun. Anda harus login kembali jika ingin memakainya lagi.
                </p>
                {unlinkError && <div className="text-[10px] text-rose-700 font-bold">{unlinkError}</div>}
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={unlinkPin}
                    onChange={(e) => setUnlinkPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Ketik PIN untuk konfirmasi"
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg font-mono tracking-widest font-bold"
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    Putus Tautan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

          {/* TAB 2: HAK CIPTA & PEMILIK SAH (GENESIS CERTIFICATE) */}
          {activeTab === 'hak_cipta' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Genesis Certificate Card */}
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50/70 to-emerald-500/10 border-2 border-amber-300 shadow-md overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-amber-950 text-xs tracking-tight">SERTIFIKAT KEASLIAN HAK CIPTA</h4>
                      <p className="text-[10px] text-amber-700">Digital Genesis Proof of Authorship</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold text-[9px] rounded-full flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ORIGINAL</span>
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-[11px]">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 space-y-1.5 backdrop-blur-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Pencipta &amp; Pemilik Sah:</span>
                      <strong className="text-slate-900 font-extrabold flex items-center gap-1 text-xs">
                        <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {GENESIS_AUTHOR.creatorName}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Akun Pemilik Utama:</span>
                      <strong className="text-emerald-700 font-mono text-[11px]">{GENESIS_AUTHOR.email}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Ekosistem:</span>
                      <span className="text-slate-800 font-semibold">{GENESIS_AUTHOR.appName}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Tahun Genesis:</span>
                      <span className="text-slate-800 font-semibold">{GENESIS_AUTHOR.genesisYear}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Status Kepemilikan:</span>
                      <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                        Exclusive Intellectual Property
                      </span>
                    </div>
                  </div>

                  {/* Genesis Signature */}
                  <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl space-y-1 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-slate-400 text-[9px]">
                      <span>CRYPTOGRAPHIC GENESIS HASH (SHA-256):</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(GENESIS_AUTHOR.genesisHash);
                          showNotification('Genesis Hash tersalin!');
                        }}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-sans text-[10px]"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </button>
                    </div>
                    <p className="break-all text-amber-400 font-bold leading-relaxed selection:bg-amber-500 selection:text-slate-900">
                      {GENESIS_AUTHOR.genesisHash}
                    </p>
                  </div>
                </div>
              </div>

              {/* Jawaban Cara Mengenali Pemilik */}
              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded-lg bg-emerald-600 text-white mt-0.5">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-emerald-950 text-xs">
                      Bagaimana Aplikasi Mengenali Anda sebagai Pemilik?
                    </h5>
                    <p className="text-[11px] text-emerald-800 leading-relaxed mt-1">
                      <strong>Tepat Sekali!</strong> Akun pertama yang Anda daftarkan (<code className="bg-emerald-100 text-emerald-900 px-1 rounded font-bold">{GENESIS_AUTHOR.email}</code>) secara permanen dikunci di dalam <strong>Genesis Ledger</strong> kode sumber sebagai <strong>Genesis Creator &amp; Root Owner</strong>.
                    </p>
                    <ul className="mt-2 space-y-1 text-[10px] text-emerald-900 list-disc list-inside">
                      <li>Akun Anda ditandai lencana khusus Mahkota Emas (<strong>👑 Owner</strong>).</li>
                      <li>Perangkat pertama Anda diikat sebagai <strong>Genesis Trusted Hardware</strong>.</li>
                      <li>Pengguna lain tidak bisa mengklaim kepemilikan karena genesis ledger terkunci kriptografis.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Anti-Plagiat & Anti-Klaim Palsu */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h5 className="font-bold text-slate-800 text-xs">Perlindungan dari Plagiat &amp; Klaim Pihak Lain</h5>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Jika ada pihak lain yang menduplikasi kode atau mengaku-ngaku sebagai pembuat aplikasi ini, mereka tidak dapat menghapus jejak digital:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">1. Digital Watermark HTML</span>
                    <span className="text-slate-500 text-[9px]">Tersimpan di metadata &lt;head&gt; dokumen HTML permanen atas nama Hendriana.</span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-800 block">2. Immutable Genesis Ledger</span>
                    <span className="text-slate-500 text-[9px]">Terkunci pada auth service dan diverifikasi saat boot aplikasi.</span>
                  </div>
                </div>
              </div>

              {/* Download Certificate JSON */}
              <button
                onClick={() => {
                  const cert = AuthService.getGenesisCertificate();
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cert, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute('href', dataStr);
                  downloadAnchor.setAttribute('download', `wargaqu_genesis_certificate_${GENESIS_AUTHOR.creatorName.toLowerCase()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  showNotification('Sertifikat Genesis berhasil diunduh!');
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Bukti Digital Hak Cipta (.JSON)</span>
              </button>
            </div>
          )}

          {/* TAB 3: ANTI-HACKER & VIRUS (BRUTE FORCE SHIELD) */}
          {activeTab === 'anti_hacker' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Brute Force Defense Status */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">Active Defense Shield</h4>
                      <p className="text-[10px] text-emerald-300">Proteksi Brute-Force &amp; Tampering</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[9px] rounded-full animate-pulse">
                    ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block">Batas Percobaan PIN:</span>
                    <strong className="text-white text-xs">Maksimal 5 Kali</strong>
                  </div>
                  <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block">Hukuman Lockout:</span>
                    <strong className="text-amber-300 text-xs">Kunci 15 Menit</strong>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                  🛡️ Jika penyusup mencoba menebak PIN secara berulang (brute-force attack), sistem otomatis membekukan akses login dan mencatat insiden ke dalam audit log.
                </p>
              </div>

              {/* Anti-Virus & Code Hygiene */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h5 className="font-bold text-slate-800 text-xs">Integritas Kode &amp; Sanitasi Input (Anti-Virus)</h5>
                </div>
                <div className="space-y-1.5 text-[10px] text-slate-600">
                  <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Anti-XSS Sanitization:</strong> Seluruh input teks pengguna difilter agar tidak dapat menyisipkan virus skrip atau malware.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Sandboxed Storage:</strong> Database lokal disimpan terenkripsi di domain penyimpanan aman per perangkat.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>1 Device Strict Policy:</strong> Mencegah sesi paralel dan pencurian token autentikasi.</span>
                  </div>
                </div>
              </div>

              {/* Security Audit Trail */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    Audit Log Keamanan Terkini
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Tercatat di Ledger</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {AuthService.getAuditLogs().slice(0, 5).map((log) => (
                    <div key={log.id} className="p-2 bg-slate-50 rounded-lg text-[10px] border border-slate-100 flex items-center justify-between">
                      <div>
                        <strong className="text-slate-800 block uppercase font-mono text-[9px]">{log.action}</strong>
                        <span className="text-slate-500 text-[9px]">{log.details}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 text-center">
          <p className="text-[10px] text-slate-400">
            WargaQu Security Architecture • Zero Data Leaks • 1 Device Policy
          </p>
        </div>
      </div>
    </div>
  );
};
