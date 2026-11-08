import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Mail,
  Phone,
  KeyRound,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Fingerprint,
  Info
} from 'lucide-react';
import { AuthService, AuthResult } from '../../services/auth';
import { UserAccount } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onSuccess: (user: UserAccount) => void;
  onClose?: () => void;
  showNotification: (msg: string) => void;
  forceMustLogin?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  showNotification,
  forceMustLogin = false,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'lost_phone'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('bangorhendri@gmail.com');
  const [loginPin, setLoginPin] = useState('123456');
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginCode, setLoginCode] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regAddress, setRegAddress] = useState('Blok A No. ');
  const [regQuestion, setRegQuestion] = useState('Nama ibu kandung?');
  const [regAnswer, setRegAnswer] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  // Lost phone recovery state
  const [lostIdentifier, setLostIdentifier] = useState('');
  const [lostRecoveryInput, setLostRecoveryInput] = useState('');
  const [lostNewPin, setLostNewPin] = useState('');
  const [lostAction, setLostAction] = useState<'migrate' | 'freeze'>('migrate');
  const [lostMsg, setLostMsg] = useState<{ text: string; isSuccess: boolean } | null>(null);

  // Success master key alert
  const [newMasterKey, setNewMasterKey] = useState<string | null>(null);

  const maskedCurrentDevId = AuthService.getMaskedCurrentDeviceId();
  const currentBoundAccount = AuthService.getDeviceBoundAccount();

  if (!isOpen) return null;

  // Handle Standard Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginCode(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Silakan masukkan email atau nomor HP Anda.');
      return;
    }
    if (!loginPin.trim() || loginPin.length < 6) {
      setLoginError('PIN keamanan harus terdiri dari 6 digit angka.');
      return;
    }

    const res: AuthResult = AuthService.login(loginIdentifier, loginPin);
    if (res.success && res.user) {
      showNotification(res.message);
      onSuccess(res.user);
    } else {
      setLoginError(res.message);
      setLoginCode(res.code || 'ERROR');
    }
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPin.trim() || !regAnswer.trim()) {
      setRegError('Semua kolom wajib diisi lengkap untuk mengaktifkan akun.');
      return;
    }
    if (regPin.length < 6) {
      setRegError('PIN keamanan minimal 6 digit.');
      return;
    }

    const res = AuthService.register({
      name: regName,
      email: regEmail,
      phone: regPhone,
      pin: regPin,
      address: regAddress,
      rtRw: 'RT 03 / RW 05',
      securityQuestion: regQuestion,
      securityAnswer: regAnswer,
    });

    if (res.success && res.user) {
      setNewMasterKey(res.user.emergencyRecoveryKey);
      showNotification('Akun berhasil diaktifkan dan terikat ke perangkat ini!');
    } else {
      setRegError(res.message);
    }
  };

  // Handle Lost Phone Recovery
  const handleLostPhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLostMsg(null);

    if (!lostIdentifier.trim() || !lostRecoveryInput.trim()) {
      setLostMsg({ text: 'Mohon isi Email/No HP dan Kode Pemulihan/Jawaban Keamanan.', isSuccess: false });
      return;
    }

    if (lostAction === 'freeze') {
      const res = AuthService.emergencyFreezeAccount(lostIdentifier, lostRecoveryInput);
      if (res.success) {
        setLostMsg({ text: res.message, isSuccess: true });
        showNotification('Akun berhasil dibekukan secara darurat!');
      } else {
        setLostMsg({ text: res.message, isSuccess: false });
      }
    } else {
      if (lostNewPin && lostNewPin.length < 6) {
        setLostMsg({ text: 'PIN baru harus 6 digit angka.', isSuccess: false });
        return;
      }
      const res = AuthService.recoverAndBindNewDevice({
        identifier: lostIdentifier,
        recoveryKeyOrAnswer: lostRecoveryInput,
        newPin: lostNewPin || '123456',
      });
      if (res.success && res.user) {
        setLostMsg({ text: res.message, isSuccess: true });
        showNotification(res.message);
        setTimeout(() => {
          onSuccess(res.user!);
        }, 1500);
      } else {
        setLostMsg({ text: res.message, isSuccess: false });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-emerald-100 flex flex-col relative my-auto">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#047857] to-[#059669] p-5 text-white relative">
          {!forceMustLogin && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white shadow-xs">
              <Fingerprint className="w-6 h-6 text-[#5eead4]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight">warga<span className="text-[#5eead4]">Qu</span></span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/40 text-[#5eead4] border border-emerald-300/40">
                  Secure Device Binding
                </span>
              </div>
              <p className="text-[10px] text-emerald-100/90 font-medium">1 Akun Terikat 1 Perangkat • Anti Duplikasi</p>
            </div>
          </div>

          {/* Masked Device ID Badge (Hidden Hardware Identifier) */}
          <div className="mt-3 bg-emerald-950/40 border border-emerald-300/30 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#5eead4]" />
              <span className="text-emerald-200 text-[11px]">Hardware ID HP Ini:</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-bold text-white bg-emerald-900/60 px-2 py-0.5 rounded text-[11px]">
              <Lock className="w-3 h-3 text-[#5eead4]" />
              <span>{maskedCurrentDevId}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/80 p-1 text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'login' ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100' : 'hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'register' ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100' : 'hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Aktivasi</span>
          </button>
          <button
            onClick={() => setActiveTab('lost_phone')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'lost_phone' ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-200' : 'hover:text-rose-600'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>HP Hilang?</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* TAB 1: LOGIN AKUN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {currentBoundAccount && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-800">Perangkat Ini Terikat:</span>
                    <span>
                      {currentBoundAccount.name} ({currentBoundAccount.identifier})
                    </span>
                    <p className="text-[10px] text-emerald-700 mt-0.5">
                      Sesuai aturan keamanan kependudukan, hanya 1 akun yang dapat aktif di perangkat ini.
                    </p>
                  </div>
                </div>
              )}

              {loginError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold">{loginError}</span>
                    {loginCode === 'BOUND_TO_ANOTHER_DEVICE' && (
                      <button
                        type="button"
                        onClick={() => {
                          setLostIdentifier(loginIdentifier);
                          setActiveTab('lost_phone');
                        }}
                        className="block text-[11px] font-bold text-rose-700 underline hover:text-rose-900 mt-1"
                      >
                        ➡️ Klik di sini: Buka Prosedur Solusi HP Hilang
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email atau Nomor HP Warga
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="nama@email.com atau 081234567890"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    PIN Keamanan (6 Digit)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLostIdentifier(loginIdentifier);
                      setActiveTab('lost_phone');
                    }}
                    className="text-[11px] text-emerald-700 hover:underline font-semibold"
                  >
                    Lupa PIN / HP Hilang?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPin ? 'text' : 'password'}
                    maxLength={6}
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Masukkan 6 angka PIN"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-mono tracking-widest font-bold"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPin(!showLoginPin)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk &amp; Verifikasi Device ID</span>
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER / AKTIVASI AKUN WARGA BARU */}
          {activeTab === 'register' && (
            <div>
              {newMasterKey ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-sm">Akun Berhasil Diaktivasi!</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Perangkat Anda telah terikat resmi. Simpan <strong>Master Recovery Key</strong> berikut jika HP Anda hilang di masa depan:
                    </p>
                  </div>

                  <div className="bg-white border-2 border-dashed border-emerald-400 rounded-xl p-3 font-mono font-extrabold text-sm text-emerald-950 tracking-wider">
                    {newMasterKey}
                  </div>

                  <p className="text-[10px] text-slate-500">
                    Salin &amp; simpan kode di tempat aman. Kode ini adalah solusi kunci utama jika HP Anda hilang atau rusak.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(newMasterKey);
                      showNotification('Kode Pemulihan Darurat disalin ke clipboard!');
                      setActiveTab('login');
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    Salin Kode &amp; Lanjut ke Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {regError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Sesuai KTP</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Contoh: Hendriana Putra"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email</label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="nama@gmail.com"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="081234567890"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Keamanan (6 Digit)</label>
                      <input
                        type="password"
                        maxLength={6}
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="6 Digit PIN"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono tracking-widest font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Blok Rumah / No</label>
                      <input
                        type="text"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="Blok A No. 12"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Pertanyaan Keamanan (Solusi jika HP Hilang)</span>
                    </div>
                    <select
                      value={regQuestion}
                      onChange={(e) => setRegQuestion(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                    >
                      <option value="Nama ibu kandung?">Nama ibu kandung?</option>
                      <option value="Nama jalan tempat tinggal masa kecil?">Nama jalan tempat tinggal masa kecil?</option>
                      <option value="Nama hewan peliharaan pertama?">Nama hewan peliharaan pertama?</option>
                      <option value="Nama sekolah dasar Anda?">Nama sekolah dasar Anda?</option>
                    </select>
                    <input
                      type="text"
                      value={regAnswer}
                      onChange={(e) => setRegAnswer(e.target.value)}
                      placeholder="Tuliskan jawaban rahasia Anda"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-800"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95"
                  >
                    Aktivasi &amp; Kunci ke Device Ini
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: SOLUSI HP HILANG (EMERGENCY RECOVERY & MIGRATION) */}
          {activeTab === 'lost_phone' && (
            <form onSubmit={handleLostPhoneSubmit} className="space-y-3.5">
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Solusi Darurat Jika HP Hilang / Ganti Device</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Jika HP Anda hilang, dicuri, atau rusak, gunakan formulir ini untuk <strong>memutus tautan HP lama</strong> dan memindahkan otorisasi akun secara aman ke HP baru ini.
                </p>
              </div>

              {lostMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                    lostMsg.isSuccess ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {lostMsg.isSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5" />}
                  <span>{lostMsg.text}</span>
                </div>
              )}

              {/* Pilihan Tindakan Darurat */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Tindakan Darurat:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLostAction('migrate')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      lostAction === 'migrate'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">🔄 Pindah ke HP Ini</div>
                    <div className="text-[10px] text-slate-500 font-normal">Putus HP lama &amp; aktifkan di HP ini.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLostAction('freeze')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      lostAction === 'freeze'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">🚨 Bekukan Akun</div>
                    <div className="text-[10px] text-slate-500 font-normal">Kunci darurat agar saldo aman.</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email atau No. HP Terdaftar</label>
                <input
                  type="text"
                  value={lostIdentifier}
                  onChange={(e) => setLostIdentifier(e.target.value)}
                  placeholder="bangorhendri@gmail.com / 081234567890"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Master Recovery Key ATAU Jawaban Pertanyaan Keamanan
                </label>
                <input
                  type="text"
                  value={lostRecoveryInput}
                  onChange={(e) => setLostRecoveryInput(e.target.value)}
                  placeholder="WARGAQU-SEC-XXXX-XXXX atau jawaban Anda (misal: malioboro)"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 text-slate-800 font-medium"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Kunci darurat yang didapatkan saat registrasi (contoh demo: <code>WARGAQU-SEC-8924-7A2F</code> atau jawaban <code>malioboro</code>).
                </span>
              </div>

              {lostAction === 'migrate' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Buat PIN Baru untuk HP Ini (Opsional 6 Digit)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={lostNewPin}
                    onChange={(e) => setLostNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Kosongkan jika tetap pakai PIN lama"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
                  />
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                  lostAction === 'freeze' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {lostAction === 'freeze' ? (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Eksekusi Kunci Akun Jarak Jauh (Freeze)</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Putus HP Lama &amp; Pindahkan ke Perangkat Ini</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Security Note */}
        <div className="bg-slate-50 border-t border-slate-100 p-3 text-center">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Enkripsi Perangkat WargaQu • Data Terikat Hardware ID</span>
          </p>
        </div>
      </div>
    </div>
  );
};
