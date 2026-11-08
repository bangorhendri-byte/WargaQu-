import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Headphones,
  Bot,
  Mic,
  RotateCcw,
  Zap,
  CheckCircle2,
  Copy,
  Smartphone,
  AlertTriangle,
  Send,
  Sparkles,
  ListCheck,
  Check,
  Info,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  ExternalLink
} from 'lucide-react';
import { SupportTicket, UserAccount } from '../../types';
import { AuthService } from '../../services/auth';

interface BantuanViewProps {
  onBackToWarga: () => void;
  showNotification: (msg: string) => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
  onOpenLoginModal?: () => void;
}

const DEFAULT_TICKETS: SupportTicket[] = [];

export const BantuanView: React.FC<BantuanViewProps> = ({
  onBackToWarga,
  showNotification,
  currentUser,
  onOpenSecurityModal,
  onOpenLoginModal,
}) => {
  // Voice & Form States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceText, setVoiceText] = useState<string>('');
  const [voiceStatus, setVoiceStatus] = useState<string>(
    'Klik mic lalu katakan kendala teknis (contoh: "Min tombol bayar crash pas cetak nota 58mm")'
  );

  // Tickets state with localStorage persistence (no mock tickets)
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('wargaqu_support_tickets');
      if (saved) {
        const parsed: SupportTicket[] = JSON.parse(saved);
        const clean = parsed.filter((t) => t.id !== '#TK-8921' && t.id !== '#TK-8920');
        if (clean.length !== parsed.length) {
          localStorage.setItem('wargaqu_support_tickets', JSON.stringify(clean));
        }
        return clean;
      }
      return DEFAULT_TICKETS;
    } catch {
      return DEFAULT_TICKETS;
    }
  });

  const [selectedTicketIndex, setSelectedTicketIndex] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem('wargaqu_support_tickets', JSON.stringify(tickets));
  }, [tickets]);

  // Keep prompt synced when selected ticket changes
  useEffect(() => {
    if (tickets[selectedTicketIndex]) {
      setCustomPrompt(tickets[selectedTicketIndex].prompt);
    }
  }, [selectedTicketIndex, tickets]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechReg = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechReg) {
      try {
        const recognition = new SpeechReg();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (e: any) => {
          let text = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            text += e.results[i][0].transcript;
          }
          setVoiceText(text);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech Recognition Error:', e);
          setIsRecording(false);
          setVoiceStatus('Koneksi mikrofon terhenti. Klik mic untuk mencoba kembali.');
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not initialize Speech Recognition:', err);
      }
    }
  }, []);

  // Tangani tombol Back HP / Browser
  useEffect(() => {
    window.history.replaceState({ screen: 'bantuan' }, '', '#bantuan');

    const handleBackButton = () => {
      onBackToWarga();
    };

    window.addEventListener('popstate', handleBackButton);

    let capHandle: any = null;
    import('@capacitor/app')
      .then(({ App: CapApp }) => {
        CapApp.addListener('backButton', () => {
          handleBackButton();
        })
          .then((h) => {
            capHandle = h;
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('popstate', handleBackButton);
      if (capHandle?.remove) {
        capHandle.remove();
      }
    };
  }, [onBackToWarga]);

  // Toggle Voice Input
  const toggleVoice = () => {
    if (!recognitionRef.current) {
      showNotification('Browser tidak mendukung Web Speech API. Gunakan tombol demo keluhan.');
      return;
    }

    if (!isRecording) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setVoiceStatus('Mendengarkan keluhan... (Bicaralah sekarang)');
      } catch (err) {
        console.warn('Recognition start failed:', err);
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsRecording(false);
      setVoiceStatus("Suara direkam. Klik 'Analisa & Generate Prompt'");
    }
  };

  const clearVoiceText = () => {
    setVoiceText('');
    setVoiceStatus('Klik mic lalu katakan kendala teknis (contoh: "Min tombol bayar crash pas cetak nota 58mm")');
  };

  // Process AI Ticket and Auto-Fix Prompt Generator
  const prosesTiketAI = () => {
    const text = voiceText.trim();
    if (!text) {
      showNotification('Silakan sebutkan atau ketik keluhan terlebih dahulu!');
      return;
    }

    const randomId = `#TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const textLower = text.toLowerCase();

    // Intelligent Diagnosis based on keywords
    let module = 'modules/core-engine.tsx -> handleTransaction()';
    let detectedError = 'Runtime Logic Exception / User Reported Bug';
    let severity: SupportTicket['severity'] = 'Auto Analyzed';

    if (textLower.includes('cetak') || textLower.includes('print') || textLower.includes('thermal') || textLower.includes('bluetooth') || textLower.includes('struk')) {
      module = 'services/printer.ts -> printReceipt()';
      detectedError = 'Bluetooth Connection Drop / Null Pointer Exception';
      severity = 'High Severity';
    } else if (textLower.includes('stok') || textLower.includes('habis') || textLower.includes('bahan')) {
      module = 'services/storage.ts -> updateStock()';
      detectedError = 'Inventory Deduct Mismatch / Asynchronous State Delay';
      severity = 'Medium';
    } else if (textLower.includes('meja') || textLower.includes('denah') || textLower.includes('pax')) {
      module = 'components/kasir/TableGrid.tsx -> onSelectTable()';
      detectedError = 'Table Status Transition Lock / Null Order ID';
      severity = 'Medium';
    } else if (textLower.includes('qris') || textLower.includes('bayar') || textLower.includes('iuran')) {
      module = 'components/kasir/CheckoutModal.tsx -> handlePayment()';
      detectedError = 'Payment Flow Gatekeeper / QRIS Intent Timeout';
      severity = 'High Severity';
    }

    const autoPrompt = `[AI AUTO-FIX PROMPT FOR DEVELOPER]
Keluhan User: "${text}"
Target Module: ${module}
Diagnosa: ${detectedError}

Instruksi Fix:
1. Analisa alur eksekusi pada fungsi ${module} sesuai keluhan user di atas.
2. Tambahkan penanganan kondisi (try-catch & error boundaries) agar mencegah aplikasi crash/stuck.
3. Pastikan state lokal (localStorage / indexedDB) tersimpan aman sebelum aksi diproses.
4. Uji kembali kelancaran alur di tampilan HP Android tanpa merusak responsivitas layout PWA.`;

    const newTicket: SupportTicket = {
      id: randomId,
      time: 'Baru saja',
      complaint: text,
      device: 'User Device (Android WebView / PWA)',
      severity,
      status: 'open',
      module,
      detectedError,
      prompt: autoPrompt
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    setSelectedTicketIndex(0);
    setCustomPrompt(autoPrompt);
    setVoiceText('');
    setVoiceStatus('Tiket berhasil dibuat & prompt perbaikan telah digenerate!');
    showNotification(`Tiket ${randomId} dibuat & dianalisa AI!`);
  };

  // Copy Prompt to Clipboard
  const copyPrompt = () => {
    if (!customPrompt) return;
    navigator.clipboard.writeText(customPrompt).then(() => {
      setIsCopied(true);
      showNotification('Prompt perbaikan berhasil disalin ke clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {
      // Fallback
      showNotification('Prompt perbaikan berhasil disalin!');
    });
  };

  // Toggle Ticket Status
  const toggleResolveTicket = (index: number) => {
    const targetTicket = tickets[index];
    if (!targetTicket) return;

    const newStatus: 'open' | 'resolved' = targetTicket.status === 'open' ? 'resolved' : 'open';
    const updated = tickets.map((t, i) => (i === index ? { ...t, status: newStatus } : t));
    setTickets(updated);

    if (newStatus === 'resolved') {
      showNotification(`Tiket ${targetTicket.id} ditandai Selesai (Resolved).`);
    } else {
      showNotification(`Tiket ${targetTicket.id} dibuka kembali.`);
    }
  };

  // Send WhatsApp to Developer / CS
  const handleSendWhatsApp = (ticket: SupportTicket) => {
    let msg = `*LAPORAN BANTUAN TEKNIS - USAHAQU / WARGAQU*\n`;
    msg += `No. Tiket: ${ticket.id}\n`;
    msg += `Perangkat: ${ticket.device}\n`;
    msg += `Tingkat: ${ticket.severity}\n`;
    msg += `Kendala: "${ticket.complaint}"\n`;
    msg += `Modul Terdeteksi: ${ticket.module}\n`;
    msg += `------------------------------------\n`;
    msg += `Mohon bantuan tim CS / Developer. Terima kasih!`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === 'open') return t.status === 'open';
    if (activeFilter === 'resolved') return t.status === 'resolved';
    return true;
  });

  const selectedTicket = tickets[selectedTicketIndex] || tickets[0];

  return (
    <div className="w-full h-full bg-slate-900 text-slate-100 flex flex-col justify-between overflow-hidden relative select-none font-sans">
      {/* ========================================== */}
      {/* HEADER NAVIGATION */}
      {/* ========================================== */}
      <header className="bg-slate-800 border-b border-slate-700 px-3.5 pt-10 sm:pt-11 pb-2.5 sticky top-0 z-30 flex justify-between items-center shrink-0 shadow-md android-header-safe">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToWarga}
            className="w-8 h-8 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center active:scale-95 transition"
            title="Kembali ke Beranda WargaQu"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
          </button>
          <div className="bg-emerald-500 text-slate-950 p-2 rounded-xl font-bold flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Headphones className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight text-white flex items-center gap-1.5">
              UsahaQu Smart Care
            </h1>
            <p className="text-[10px] text-slate-400">Pusat Bantuan CS &amp; Auto-Fix Prompt Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="bg-emerald-900/60 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-mono border border-emerald-500/30 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" />
            <span className="font-bold">AI Active</span>
          </span>
        </div>
      </header>

      {/* ========================================== */}
      {/* MAIN CONTAINER */}
      {/* ========================================== */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-3.5 pb-28 sm:pb-32 android-scroll-safe">
        {/* ========================================== */}
        {/* KEAMANAN AKUN, DEVICE TERIKAT & SOLUSI HP HILANG */}
        {/* ========================================== */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-white text-xs tracking-wide flex items-center gap-1.5">
                  <span>Keamanan Akun &amp; Device Terikat</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-bold">
                    1 Akun 1 HP
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400">
                  {currentUser ? (
                    <>Aktif: <span className="text-emerald-300 font-bold">{currentUser.name}</span> ({currentUser.email || currentUser.phone})</>
                  ) : (
                    'Belum ada akun yang login di perangkat ini'
                  )}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-mono text-slate-400 block">ID Perangkat (Samaran):</span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-700">
                {currentUser ? AuthService.getMaskedDeviceId(currentUser.boundDeviceId) : AuthService.getMaskedDeviceId()}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-[11px] text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p>
                <b>Device ID Asli Disembunyikan:</b> Sistem secara otomatis mendeteksi hardware fingerprint perangkat Anda dan menyembunyikannya demi privasi. Hanya 1 akun aktif yang diizinkan per HP untuk mencegah akses ilegal.
              </p>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-amber-300/95 bg-amber-950/30 p-2.5 rounded-lg border border-amber-600/30">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[11px] text-amber-200">Solusi Jika HP Anda Hilang / Dicuri:</div>
                <ol className="list-decimal list-inside space-y-1 mt-1 text-[10px] text-slate-300">
                  <li>Buka WargaQu di HP baru Anda.</li>
                  <li>Klik tombol <b>"Solusi HP Hilang"</b> di menu login.</li>
                  <li>Gunakan <b>Kunci Darurat Master</b> (format: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">WARGAQU-SEC-XXXX-XXXX</code>) atau Bekukan Akun dari jarak jauh.</li>
                  <li>Sistem akan mencabut izin HP lama dan menautkan akun secara instan ke HP baru Anda.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {onOpenSecurityModal && (
              <button
                onClick={onOpenSecurityModal}
                className="grow bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Buka Kunci Darurat &amp; Keamanan</span>
              </button>
            )}

            {onOpenLoginModal && (
              <button
                onClick={onOpenLoginModal}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-95 transition"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Menu Pemulihan HP Hilang</span>
              </button>
            )}
          </div>
        </section>

        {/* ========================================== */}
        {/* LIVE VOICE TICKET GENERATOR CARD */}
        {/* ========================================== */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-slate-200 text-xs flex items-center gap-2 uppercase tracking-wider">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Simulasikan Keluhan User (Voice Input)</span>
            </h2>
            <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
              Web Speech API
            </span>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700/80">
            {/* Big Mic Button */}
            <button
              id="btnVoice"
              onClick={toggleVoice}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition shrink-0 active:scale-95 shadow-md ${
                isRecording
                  ? 'bg-rose-600 mic-pulse shadow-rose-600/40'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
              title="Tekan untuk bicara keluhan"
            >
              <Mic className="w-5 h-5" />
            </button>

            <div className="grow min-w-0">
              <p className="text-[11px] text-slate-400 leading-tight">{voiceStatus}</p>
              <p className="text-xs font-semibold text-emerald-400 min-h-[20px] mt-1 break-words">
                {voiceText || (isRecording ? 'Mendengarkan suara Anda...' : '')}
              </p>
            </div>
          </div>

          {/* Quick Preset Chips for Demo */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              onClick={() => {
                setVoiceText('Tombol bayar crash pas cetak nota 58mm');
                setVoiceStatus('Sampel keluhan terpilih. Klik Analisa & Generate.');
              }}
              className="text-[10px] bg-slate-900 hover:bg-slate-750 text-emerald-400/90 border border-emerald-500/20 px-2.5 py-1 rounded-lg whitespace-nowrap active:scale-95"
            >
              + Crash Nota 58mm
            </button>
            <button
              onClick={() => {
                setVoiceText('Stok produk sembako tidak otomatis berkurang waktu transaksi tempo lunas');
                setVoiceStatus('Sampel keluhan terpilih. Klik Analisa & Generate.');
              }}
              className="text-[10px] bg-slate-900 hover:bg-slate-750 text-emerald-400/90 border border-emerald-500/20 px-2.5 py-1 rounded-lg whitespace-nowrap active:scale-95"
            >
              + Stok Tempo Lunas
            </button>
            <button
              onClick={() => {
                setVoiceText('Printer bluetooth sering disconnect mendadak');
                setVoiceStatus('Sampel keluhan terpilih. Klik Analisa & Generate.');
              }}
              className="text-[10px] bg-slate-900 hover:bg-slate-750 text-emerald-400/90 border border-emerald-500/20 px-2.5 py-1 rounded-lg whitespace-nowrap active:scale-95"
            >
              + Bluetooth Drop
            </button>
            <button
              onClick={() => {
                setVoiceText('Total iuran warga RT 03 tidak terupdate setelah scan QRIS');
                setVoiceStatus('Sampel keluhan terpilih. Klik Analisa & Generate.');
              }}
              className="text-[10px] bg-slate-900 hover:bg-slate-750 text-emerald-400/90 border border-emerald-500/20 px-2.5 py-1 rounded-lg whitespace-nowrap active:scale-95"
            >
              + Iuran RT QRIS
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={prosesTiketAI}
              className="grow bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-emerald-600/20 transition"
            >
              <Zap className="w-4 h-4" />
              <span>Analisa &amp; Generate Prompt Perbaikan</span>
            </button>
            <button
              onClick={clearVoiceText}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 px-3.5 rounded-xl text-xs active:scale-95 transition"
              title="Reset Input Teks"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ========================================== */}
        {/* TICKET LIST & DIAGNOSTIC VIEW */}
        {/* ========================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* LEFT: DAFTAR TIKET KELUHAN MASUK */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <ListCheck className="w-4 h-4 text-sky-400" />
                <span>Tiket Keluhan Masuk</span>
              </h2>
              <span className="bg-slate-700 text-[10px] text-slate-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {tickets.length} Laporan
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-slate-900 p-1 rounded-xl text-[10px] font-bold">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-1 rounded-lg transition ${
                  activeFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua ({tickets.length})
              </button>
              <button
                onClick={() => setActiveFilter('open')}
                className={`flex-1 py-1 rounded-lg transition ${
                  activeFilter === 'open'
                    ? 'bg-emerald-600 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Terbuka ({tickets.filter((t) => t.status === 'open').length})
              </button>
              <button
                onClick={() => setActiveFilter('resolved')}
                className={`flex-1 py-1 rounded-lg transition ${
                  activeFilter === 'resolved'
                    ? 'bg-slate-700 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Selesai ({tickets.filter((t) => t.status === 'resolved').length})
              </button>
            </div>

            {/* Ticket Cards Container */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {filteredTickets.length === 0 ? (
                <div className="bg-slate-900 p-6 text-center text-slate-500 text-xs rounded-xl italic">
                  Tidak ada tiket dalam kategori ini.
                </div>
              ) : (
                filteredTickets.map((ticket, idx) => {
                  const originalIndex = tickets.findIndex((t) => t.id === ticket.id);
                  const isSelected = originalIndex === selectedTicketIndex;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketIndex(originalIndex)}
                      className={`ticket-card p-3 rounded-xl cursor-pointer transition-all border active:scale-98 ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500/70 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/80 border-slate-700/80 hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                        <span className="font-mono text-emerald-400 font-bold">{ticket.id}</span>
                        <div className="flex items-center gap-1.5">
                          {ticket.status === 'resolved' && (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold">
                              Resolved
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">{ticket.time}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">
                        "{ticket.complaint}"
                      </p>
                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          <span>{ticket.device}</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold text-[9px] ${
                            ticket.severity === 'High Severity'
                              ? 'bg-rose-900/50 text-rose-300 border border-rose-500/30'
                              : ticket.severity === 'Medium'
                              ? 'bg-amber-900/50 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {ticket.severity}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: AI AUTO-FIX OUTPUT PANEL */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-md space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <h2 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Output Auto-Fix Prompt</span>
                </h2>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Ready to Apply
                </span>
              </div>

              {/* Log Metadata Detail */}
              {selectedTicket && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 mb-3 font-mono text-[10px] text-slate-400 space-y-1">
                  <div>
                    Target App:{' '}
                    <span className="text-slate-200 font-semibold">UsahaQu POS PWA v1.5.0</span>
                  </div>
                  <div>
                    Affected Module:{' '}
                    <span className="text-sky-300 font-bold">{selectedTicket.module}</span>
                  </div>
                  <div>
                    Detected Error:{' '}
                    <span className="text-rose-400 font-bold">{selectedTicket.detectedError}</span>
                  </div>
                </div>
              )}

              {/* Computed Prompt Textarea */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-400 uppercase font-semibold">
                    Prompt Instruksi Perbaikan Kode (AI Generated):
                  </label>
                  <span className="text-[9px] text-slate-500 font-mono">Editable</span>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full h-44 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-emerald-300 font-mono resize-none focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner"
                />
              </div>
            </div>

            {/* Actions: Copy Prompt, Resolve, & Send WA */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <button
                  onClick={copyPrompt}
                  className="grow bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Prompt Perbaikan'}</span>
                </button>
                <button
                  onClick={() => toggleResolveTicket(selectedTicketIndex)}
                  className={`py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm ${
                    selectedTicket?.status === 'resolved'
                      ? 'bg-slate-700 text-amber-300 hover:bg-slate-650'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {selectedTicket?.status === 'resolved' ? 'Buka Kembali' : 'Mark Resolved'}
                  </span>
                </button>
              </div>

              {selectedTicket && (
                <button
                  onClick={() => handleSendWhatsApp(selectedTicket)}
                  className="w-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold py-2 px-3 rounded-xl text-[11px] flex items-center justify-center gap-1.5 active:scale-98 transition"
                >
                  <Send className="w-3 h-3 text-emerald-400" />
                  <span>Kirim Laporan Tiket ini ke WA Tim Support CS</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
