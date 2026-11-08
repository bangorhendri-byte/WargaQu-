import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Flame,
  ShieldAlert,
  Ambulance,
  Users,
  MapPin,
  PhoneCall,
  Volume2,
  VolumeX,
  Clock,
  Check,
  AlertTriangle,
  History,
  Trash2,
  Radio,
  Zap,
  Phone,
  Waves,
  LifeBuoy,
  Play,
  Square,
  Lightbulb,
  Megaphone,
  UserCheck,
  Plus,
  X,
  Compass,
  RotateCcw,
  Navigation,
  Copy,
  Crosshair,
  Sparkles,
  Lock,
  Smartphone
} from 'lucide-react';
import { UserAccount } from '../../types';
import { AuthService } from '../../services/auth';
import { RealtimeSyncService } from '../../services/realtimeSync';

interface SiagaQuViewProps {
  onBackToMain: () => void;
  showNotification: (msg: string) => void;
  onOpenChatQu?: () => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
}

interface EmergencyLog {
  id: string;
  timestamp: string;
  date: string;
  category: string;
  mode: 'Simulasi' | 'REAL';
  location: string;
  transcript: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  role: string;
  priority: 'Prioritas' | 'Darurat' | 'Aktif';
}

type SiagaSubTab = 'siaga' | 'naviqu' | 'morse' | 'sandi' | 'contacts' | 'history';

export const SiagaQuView: React.FC<SiagaQuViewProps> = ({
  onBackToMain,
  showNotification,
  onOpenChatQu,
  currentUser = null,
  onOpenSecurityModal,
}) => {
  // Navigation tabs (SiagaQu, NaviQu, MorseQu, SandiQu, Kontak, Riwayat)
  const [activeTab, setActiveTab] = useState<SiagaSubTab>('siaga');

  // Mode: Simulasi vs Real
  const [isSimulasiMode, setIsSimulasiMode] = useState<boolean>(true);

  // Category
  const [selectedCategory, setSelectedCategory] = useState<string>('Banjir / Evakuasi');

  // Holding state for Panic Button (3 Seconds)
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number>(0);

  // Overlay state for Panic sequence
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);
  const [emergencySecondsLeft, setEmergencySecondsLeft] = useState<number>(5);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeTranscript, setActiveTranscript] = useState<string>('Merekam audio...');
  const [activeEmergencyData, setActiveEmergencyData] = useState<EmergencyLog | null>(null);
  const emergencyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio Context & Oscillator References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenOscillatorRef = useRef<OscillatorNode | null>(null);

  // --- NaviQu (Compass & GPS) States ---
  const [compassHeading, setCompassHeading] = useState<number>(0);
  const [isCompassActive, setIsCompassActive] = useState<boolean>(false);
  const [gpsCoords, setGpsCoords] = useState<{
    lat: string;
    long: string;
    accuracy?: string;
    altitude?: string;
  }>({
    lat: '-6.2088° S',
    long: '106.8456° E',
    accuracy: '±5 meter',
    altitude: '24m dpl',
  });

  // --- MorseQu States & References ---
  const [isMorsePlaying, setIsMorsePlaying] = useState<boolean>(false);
  const [morseFlashColor, setMorseFlashColor] = useState<string | null>(null);
  const [activeMorseChar, setActiveMorseChar] = useState<string>('');
  const morseAbortRef = useRef<boolean>(false);

  // --- SandiQu (Flood Beacon) States & References ---
  const [isFloodBeaconActive, setIsFloodBeaconActive] = useState<boolean>(false);
  const [beaconColor, setBeaconColor] = useState<string | null>(null);
  const beaconAbortRef = useRef<boolean>(false);

  // Contacts
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: 'c-1',
      name: 'Pak RT Bambang (Ketua RT 03)',
      phone: '0812-3456-7890',
      role: 'Pengurus Utama',
      priority: 'Prioritas',
    },
    {
      id: 'c-2',
      name: 'Istri / Keluarga Rumah',
      phone: '0813-9988-7766',
      role: 'Kontak Kerabat',
      priority: 'Darurat',
    },
    {
      id: 'c-3',
      name: 'Bpk. Dedi (Koordinator Siskamling)',
      phone: '0819-7788-9900',
      role: 'Keamanan Lingkungan',
      priority: 'Aktif',
    },
  ]);

  // Add contact modal
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactRole, setNewContactRole] = useState<string>('Keluarga');
  // Berlangganan sinyal darurat realtime antar warga RT
  useEffect(() => {
    const unsub = RealtimeSyncService.subscribeActiveSOS((signals) => {
      if (signals.length > 0) {
        const latest = signals[0];
        if (latest.userId !== currentUser?.id) {
          showNotification(`🚨 ALARM SOS WARGA RT: ${latest.userName} butuh bantuan (${latest.type})!`);
        }
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Emergency History Logs (clean, no mock data)
  const [logs, setLogs] = useState<EmergencyLog[]>(() => {
    try {
      const saved = localStorage.getItem('siagaqu_logs');
      if (saved) {
        const parsed: EmergencyLog[] = JSON.parse(saved);
        const clean = parsed.filter((l) => l.id !== 'LOG-INIT');
        if (clean.length !== parsed.length) {
          localStorage.setItem('siagaqu_logs', JSON.stringify(clean));
        }
        return clean;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('siagaqu_logs', JSON.stringify(logs));
    } catch {}
  }, [logs]);

  // Clean up sounds and listeners on unmount
  useEffect(() => {
    return () => {
      stopSirenSound();
      morseAbortRef.current = true;
      beaconAbortRef.current = true;
      window.removeEventListener('deviceorientation', handleDeviceOrientation as any);
    };
  }, []);

  // Audio helper
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq: number, durationMs: number, type: OscillatorType = 'sine') => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      }, durationMs);
    } catch {}
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // --- Panic Siren Audio ---
  const playSirenSound = () => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.1, now);

      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.5);
      osc.frequency.linearRampToValueAtTime(650, now + 1.0);
      osc.frequency.linearRampToValueAtTime(1200, now + 1.5);
      osc.frequency.linearRampToValueAtTime(650, now + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      sirenOscillatorRef.current = osc;
    } catch {}
  };

  const stopSirenSound = () => {
    if (sirenOscillatorRef.current) {
      try {
        sirenOscillatorRef.current.stop();
        sirenOscillatorRef.current.disconnect();
      } catch {}
      sirenOscillatorRef.current = null;
    }
  };

  // --- NaviQu Compass Logic ---
  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    let heading = 0;
    if ((event as any).webkitCompassHeading) {
      heading = (event as any).webkitCompassHeading;
    } else if (event.alpha !== null) {
      heading = 360 - event.alpha;
    }
    setCompassHeading(Math.round(heading % 360));
  };

  const getDirectionCardinal = (degree: number): string => {
    const directions = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
    const index = Math.round((degree % 360) / 45) % 8;
    return `${Math.round(degree)}° ${directions[index]}`;
  };

  const initCompass = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation as any, true);
          setIsCompassActive(true);
          showNotification('Sensor kompas & magnetik berhasil diaktifkan.');
        } else {
          showNotification('Izin sensor gerak tidak diberikan.');
        }
      } catch {
        window.addEventListener('deviceorientation', handleDeviceOrientation as any, true);
        setIsCompassActive(true);
      }
    } else if ('ondeviceorientation' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation as any, true);
      setIsCompassActive(true);
      showNotification('Sensor kompas & magnetik aktif.');
    } else {
      // Desktop / simulation fallback: rotate heading by 45 degrees
      setCompassHeading((prev) => (prev + 45) % 360);
      showNotification('Sensor fisik tidak tersedia. Simulasi kalibrasi arah +45°.');
    }
  };

  const getGPSLocation = () => {
    if ('geolocation' in navigator) {
      showNotification('Mencari sinyal GPS satelit...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const long = pos.coords.longitude.toFixed(6);
          const latDir = pos.coords.latitude >= 0 ? 'N' : 'S';
          const longDir = pos.coords.longitude >= 0 ? 'E' : 'W';
          setGpsCoords({
            lat: `${Math.abs(parseFloat(lat))}° ${latDir}`,
            long: `${Math.abs(parseFloat(long))}° ${longDir}`,
            accuracy: `±${Math.round(pos.coords.accuracy || 10)} meter`,
            altitude: pos.coords.altitude ? `${Math.round(pos.coords.altitude)}m dpl` : '24m dpl',
          });
          showNotification('Koordinat GPS berhasil diperbarui secara presisi!');
        },
        () => {
          showNotification('Menggunakan koordinat cache lokal RT 03 Blok A No. 12.');
          setGpsCoords({
            lat: '-6.2088° S',
            long: '106.8456° E',
            accuracy: '±12 meter (Offline Cache)',
            altitude: '24m dpl',
          });
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      showNotification('GPS tidak didukung pada browser ini.');
    }
  };

  const copyCoordinates = () => {
    const text = `Koordinat Darurat: Lat ${gpsCoords.lat}, Long ${gpsCoords.long} (Akurasi: ${gpsCoords.accuracy || '±5m'})`;
    navigator.clipboard.writeText(text);
    showNotification('Koordinat berhasil disalin! Siap dibacakan via Radio HT.');
  };

  // --- Auto-SOS Morse Player ---
  const startMorseSOS = async () => {
    if (isMorsePlaying) {
      morseAbortRef.current = true;
      setIsMorsePlaying(false);
      setMorseFlashColor(null);
      showNotification('Auto-SOS Morse dihentikan.');
      return;
    }

    setIsMorsePlaying(true);
    morseAbortRef.current = false;
    showNotification('Auto-SOS Morse aktif! Memancarkan sinyal suara & kedipan cahaya.');

    const dot = 180;
    const dash = 540;
    const elementGap = 150;
    const charGap = 400;

    const pattern = [
      { type: '.', duration: dot, char: 'S' },
      { type: '.', duration: dot, char: 'S' },
      { type: '.', duration: dot, char: 'S' },
      { type: 'gap', duration: charGap, char: ' ' },
      { type: '-', duration: dash, char: 'O' },
      { type: '-', duration: dash, char: 'O' },
      { type: '-', duration: dash, char: 'O' },
      { type: 'gap', duration: charGap, char: ' ' },
      { type: '.', duration: dot, char: 'S' },
      { type: '.', duration: dot, char: 'S' },
      { type: '.', duration: dot, char: 'S' },
    ];

    for (let cycle = 0; cycle < 3; cycle++) {
      if (morseAbortRef.current) break;

      for (const item of pattern) {
        if (morseAbortRef.current) break;

        if (item.type === 'gap') {
          setActiveMorseChar('');
          await sleep(item.duration);
        } else {
          setActiveMorseChar(item.char);
          setMorseFlashColor('bg-amber-400');
          playTone(850, item.duration, 'sine');
          await sleep(item.duration);
          setMorseFlashColor(null);
          await sleep(elementGap);
        }
      }
      await sleep(1000);
    }

    setIsMorsePlaying(false);
    setMorseFlashColor(null);
    setActiveMorseChar('');
    showNotification('Siklus Auto-SOS Morse selesai.');
  };

  const playWordMorse = async (word: string, morseCode: string) => {
    showNotification(`Membunyikan sandi morse: ${word}`);
    const dot = 150;
    const dash = 450;
    const gap = 120;

    for (const char of morseCode) {
      if (char === '.') {
        playTone(850, dot, 'sine');
        await sleep(dot + gap);
      } else if (char === '-') {
        playTone(850, dash, 'sine');
        await sleep(dash + gap);
      } else if (char === ' ') {
        await sleep(300);
      }
    }
  };

  // --- SandiQu (Flood Beacon SAR) ---
  const toggleFloodBeacon = async () => {
    if (isFloodBeaconActive) {
      beaconAbortRef.current = true;
      setIsFloodBeaconActive(false);
      setBeaconColor(null);
      showNotification('Sinyal pemancar banjir dimatikan.');
      return;
    }

    setIsFloodBeaconActive(true);
    beaconAbortRef.current = false;
    showNotification('Sinyal Evakuasi Banjir Aktif! Memancarkan kedipan SAR & sirine 1200Hz.');

    while (!beaconAbortRef.current) {
      setBeaconColor('bg-red-600');
      playTone(1200, 320, 'sawtooth');
      await sleep(350);

      if (beaconAbortRef.current) break;

      setBeaconColor('bg-white');
      playTone(900, 250, 'sawtooth');
      await sleep(350);

      if (beaconAbortRef.current) break;
      setBeaconColor(null);
      await sleep(200);
    }

    setIsFloodBeaconActive(false);
    setBeaconColor(null);
  };

  // Hold 3 seconds button logic
  const startHold = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e && e.type === 'touchstart') {
      // touch start
    }
    setIsHolding(true);
    holdStartTimeRef.current = Date.now();

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progressPercent = Math.min(100, (elapsed / 3000) * 100);
      setHoldProgress(progressPercent);

      if (elapsed >= 3000) {
        endHold();
        triggerEmergency();
      }
    }, 40);
  };

  const endHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  // Trigger Panic Sequence
  const triggerEmergency = () => {
    playSirenSound();
    setIsEmergencyActive(true);
    setEmergencySecondsLeft(5);
    setActiveStep(1);

    const sampleTranscripts: Record<string, string> = {
      'Banjir / Evakuasi':
        '"Air naik cepat setinggi dada di Blok A No 12 RT 03! Butuh perahu karet evakuasi keluarga & lansia!"',
      'Anak / Orang Hilang':
        '"Tolong, anak saya usia 5 tahun memakai baju merah celana biru hilang di dekat pos ronda RT 03!"',
      'Maling / Kejahatan':
        '"Ada orang mencurigakan memanjat pagar rumah Blok A No 12, tolong warga bantu ketuk kentongan!"',
      'Kebakaran':
        '"Asap tebal dan api terlihat di bagian dapur Blok B No 4, tolong bantuan damkar warga membawa APAR sekarang!"',
      'Medis / Ambulans':
        '"Kondisi darurat, lansia pingsan mendadak dan sesak nafas di Blok A No 12, butuh ambulans secepatnya!"',
    };

    const transcript =
      sampleTranscripts[selectedCategory] ||
      '"Tolong, ada keadaan darurat di lokasi saya Blok A No 12 RT 03 sekarang!"';
    setActiveTranscript(transcript);

    const newLog: EmergencyLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      category: selectedCategory,
      mode: isSimulasiMode ? 'Simulasi' : 'REAL',
      location: 'RT 03 / RW 05 - Blok A No. 12',
      transcript,
    };
    setActiveEmergencyData(newLog);

    // Broadcast Real-time SOS ke seluruh warga via Cloud
    RealtimeSyncService.broadcastSOS({
      id: newLog.id,
      userId: currentUser?.id || 'warga-rt03',
      userName: currentUser?.name || 'Warga RT 03',
      type: selectedCategory,
      status: 'active',
      address: 'RT 03 / RW 05 - Blok A No. 12',
      timestamp: new Date().toISOString()
    });

    let sec = 5;
    let stepCount = 1;
    if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);

    emergencyIntervalRef.current = setInterval(() => {
      sec -= 1;
      stepCount += 1;
      setEmergencySecondsLeft(sec);
      setActiveStep(stepCount);

      if (sec <= 0) {
        if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);
      }
    }, 1000);
  };

  const cancelEmergency = () => {
    stopSirenSound();
    if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);
    setIsEmergencyActive(false);
    showNotification('Sinyal darurat dibatalkan.');
  };

  const saveAndComplete = () => {
    stopSirenSound();
    if (emergencyIntervalRef.current) clearInterval(emergencyIntervalRef.current);

    if (activeEmergencyData) {
      setLogs((prev) => [activeEmergencyData, ...prev]);
    }
    setIsEmergencyActive(false);
    showNotification(`Sinyal tersimpan! Menghubungkan ke ChatQu RT 03...`);
    setActiveTab('history');
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) {
      showNotification('Harap lengkapi nama dan nomor telepon.');
      return;
    }
    const newC: EmergencyContact = {
      id: `c-${Date.now()}`,
      name: newContactName,
      phone: newContactPhone,
      role: newContactRole,
      priority: 'Aktif',
    };
    setContacts([...contacts, newC]);
    setNewContactName('');
    setNewContactPhone('');
    setIsAddContactModalOpen(false);
    showNotification('Kontak darurat baru berhasil ditambahkan.');
  };

  const handleClearHistory = () => {
    if (confirm('Hapus semua catatan log darurat dari perangkat ini?')) {
      setLogs([]);
      try {
        localStorage.removeItem('siagaqu_logs');
      } catch {}
      showNotification('Riwayat log berhasil dibersihkan.');
    }
  };

  const circumference = 502;
  const strokeDashoffset = circumference - (circumference * holdProgress) / 100;

  return (
    <div
      className={`w-full h-full text-slate-100 overflow-hidden flex flex-col relative select-none transition-colors duration-200 ${
        beaconColor || morseFlashColor || 'bg-slate-900'
      }`}
    >
      {/* HEADER SIAGAQU */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800 p-4 pt-10 sm:pt-11 z-20 shrink-0 shadow-md android-header-safe">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBackToMain}
            className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 active:scale-95 flex items-center justify-center transition text-slate-300"
            title="Kembali ke Beranda WargaQu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-black text-lg tracking-wide text-white">
                Siaga<span className="text-red-500">Qu</span>
              </span>
              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                {activeTab === 'naviqu'
                  ? 'NaviQu'
                  : activeTab === 'morse'
                  ? 'MorseQu'
                  : activeTab === 'sandi'
                  ? 'SandiQu'
                  : 'Panic Button'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              RT 03 / RW 05 • Pos Radar & Taktis SAR
            </p>
          </div>

          {/* GPS Status Badge */}
          <div className="flex items-center space-x-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-full text-[10px] font-bold">
            <MapPin className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>GPS Lock</span>
          </div>
        </div>

        {/* TOGGLE MODE SIMULASI vs REAL */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-1.5 rounded-lg ${
                isSimulasiMode
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400 animate-pulse'
              }`}
            >
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{isSimulasiMode ? 'Mode Latihan / Simulasi' : 'Mode REAL / DARURAT'}</span>
                {!isSimulasiMode && (
                  <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-black uppercase">
                    SIAGA 1
                  </span>
                )}
              </div>
              <div className="text-[9px] text-slate-400">
                {isSimulasiMode
                  ? 'Sirine aman, sinyal hanya dites di HP ini.'
                  : 'PERINGATAN: Sinyal membunyikan sirine warga 1km!'}
              </div>
            </div>
          </div>

          {/* Switch Toggle */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSimulasiMode}
              onChange={(e) => {
                setIsSimulasiMode(e.target.checked);
                showNotification(
                  e.target.checked
                    ? 'Beralih ke Mode Simulasi / Latihan'
                    : 'Peringatan: Beralih ke Mode DARURAT SUNGGUHAN (Real)'
                );
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-red-600 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 hide-scrollbar pb-24">
        {/* ======================================================== */}
        {/* MENU 1: SIAGAQU (TOMBOL DARURAT UTAMA) */}
        {/* ======================================================== */}
        {activeTab === 'siaga' && (
          <div className="space-y-4">
            {/* SELECTOR JENIS DARURAT */}
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1. Pilih Kategori Kejadian
                </span>
                <span className="text-[10px] text-red-400 font-semibold bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30">
                  {selectedCategory}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Category 1: Banjir / Evakuasi */}
                <button
                  onClick={() => setSelectedCategory('Banjir / Evakuasi')}
                  className={`p-3 rounded-2xl flex items-center space-x-3 transition active:scale-95 text-left border-2 ${
                    selectedCategory === 'Banjir / Evakuasi'
                      ? 'border-blue-500 bg-blue-950/40 text-white shadow-md shadow-blue-900/30'
                      : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      selectedCategory === 'Banjir / Evakuasi'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Waves className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Banjir / Evakuasi</div>
                    <div className="text-[9px] text-slate-400">Terjebak & Perahu SAR</div>
                  </div>
                </button>

                {/* Category 2: Anak / Orang Hilang */}
                <button
                  onClick={() => setSelectedCategory('Anak / Orang Hilang')}
                  className={`p-3 rounded-2xl flex items-center space-x-3 transition active:scale-95 text-left border-2 ${
                    selectedCategory === 'Anak / Orang Hilang'
                      ? 'border-red-500 bg-red-950/40 text-white shadow-md shadow-red-900/30'
                      : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      selectedCategory === 'Anak / Orang Hilang'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Anak / Orang Hilang</div>
                    <div className="text-[9px] text-slate-400">Butuh sebar mata cepat</div>
                  </div>
                </button>

                {/* Category 3: Kebakaran */}
                <button
                  onClick={() => setSelectedCategory('Kebakaran')}
                  className={`p-3 rounded-2xl flex items-center space-x-3 transition active:scale-95 text-left border-2 ${
                    selectedCategory === 'Kebakaran'
                      ? 'border-orange-500 bg-orange-950/40 text-white shadow-md shadow-orange-900/30'
                      : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      selectedCategory === 'Kebakaran'
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Kebakaran</div>
                    <div className="text-[9px] text-slate-400">Bantuan damkar warga</div>
                  </div>
                </button>

                {/* Category 4: Pencurian / Maling */}
                <button
                  onClick={() => setSelectedCategory('Maling / Kejahatan')}
                  className={`p-3 rounded-2xl flex items-center space-x-3 transition active:scale-95 text-left border-2 ${
                    selectedCategory === 'Maling / Kejahatan'
                      ? 'border-purple-500 bg-purple-950/40 text-white shadow-md shadow-purple-900/30'
                      : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      selectedCategory === 'Maling / Kejahatan'
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Pencurian / Maling</div>
                    <div className="text-[9px] text-slate-400">Penyergapan & Ronda</div>
                  </div>
                </button>
              </div>
            </div>

            {/* TOMBOL PANIC BUTTON BUNDAR MENGAMBANG */}
            <div className="flex flex-col items-center justify-center py-2 relative">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>2. Tekan & Tahan 3 Detik</span>
                {isHolding && (
                  <span className="text-red-400 font-mono text-[11px] animate-pulse">
                    ({Math.round(holdProgress)}%)
                  </span>
                )}
              </div>

              {/* Outer Ring Glow */}
              <div className="relative flex items-center justify-center my-2">
                <div className="absolute w-56 h-56 rounded-full bg-red-600/15 border border-red-500/20 animate-pulse-ring pointer-events-none"></div>
                <div className="absolute w-48 h-48 rounded-full bg-red-600/25 animate-ping pointer-events-none opacity-40"></div>

                {/* Progress SVG Ring */}
                <svg className="w-44 h-44 -rotate-90 relative z-10 pointer-events-none">
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-red-500 transition-all duration-75"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Main Panic Button */}
                <button
                  onMouseDown={startHold}
                  onMouseUp={endHold}
                  onMouseLeave={endHold}
                  onTouchStart={startHold}
                  onTouchEnd={endHold}
                  onTouchCancel={endHold}
                  className="absolute z-20 w-36 h-36 rounded-full bg-gradient-to-tr from-red-900 via-red-600 to-red-500 hover:from-red-800 hover:to-red-400 active:scale-95 shadow-2xl shadow-red-900/60 flex flex-col items-center justify-center border-4 border-red-300/40 text-white transition-all cursor-pointer select-none"
                  title="Tekan dan tahan selama 3 detik untuk membunyikan sinyal darurat"
                >
                  <AlertTriangle className="w-11 h-11 mb-1 drop-shadow-md animate-bounce text-white" />
                  <span className="text-xs font-black uppercase tracking-wider">PANIC</span>
                  <span className="text-[9px] font-bold text-red-200">
                    {isHolding ? 'TAHAN TERUS...' : 'HOLD 3 DETIK'}
                  </span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 text-center mt-3 max-w-xs">
                Sinyal radio otomatis membunyikan alarm warga radius{' '}
                <strong className="text-white">500m - 1km</strong> + pengurus RT domisili.
              </p>
            </div>

            {/* CARDS INFORMASI SIAGA QUICK TARGET */}
            <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/60 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Target Broadcast Otomatis</span>
                <span className="text-emerald-400">3 Kontak Aktif</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-700">
                  <div className="text-white font-bold">Pengurus RT 03</div>
                  <div className="text-emerald-400 font-medium">Auto Acc</div>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-700">
                  <div className="text-white font-bold">Siskamling</div>
                  <div className="text-emerald-400 font-medium">Sirine On</div>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-700">
                  <div className="text-white font-bold">Keluarga Utama</div>
                  <div className="text-emerald-400 font-medium">SMS + Call</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MENU 2: NAVIQU (KOMPAS & KOORDINAT GPS) */}
        {/* ======================================================== */}
        {activeTab === 'naviqu' && (
          <div className="space-y-3.5">
            {/* Header Banner NaviQu */}
            <div className="bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950 text-teal-100 p-4 rounded-2xl border border-teal-700/50 shadow-md">
              <div className="flex items-center space-x-2.5 mb-1">
                <div className="p-2 rounded-xl bg-teal-800/80 text-teal-300">
                  <Compass className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">NaviQu - Navigasi Off-Grid & Kompas</h3>
                  <p className="text-[10px] text-teal-200">
                    Petunjuk arah & lokasi presisi untuk pendakian, tempat terpencil, atau sinyal mati.
                  </p>
                </div>
              </div>
            </div>

            {/* VISUAL KOMPAS DIGITAL */}
            <div className="bg-slate-800/90 p-5 rounded-2xl shadow-sm border border-teal-900/50 text-center space-y-4">
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                {/* Dial Kompas */}
                <div
                  className="absolute inset-0 rounded-full border-4 border-teal-500 flex items-center justify-center bg-slate-950 shadow-inner transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${-compassHeading}deg)` }}
                >
                  {/* Cardinal Points */}
                  <div className="absolute top-2 text-xs font-black text-red-500">U</div>
                  <div className="absolute right-2 text-xs font-bold text-slate-400">T</div>
                  <div className="absolute bottom-2 text-xs font-bold text-slate-400">S</div>
                  <div className="absolute left-2 text-xs font-bold text-slate-400">B</div>

                  {/* Sub-cardinal marks */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-teal-500/20 pointer-events-none"></div>
                  <div className="absolute top-4 right-7 text-[8px] font-mono text-teal-400/60">TL</div>
                  <div className="absolute bottom-4 right-7 text-[8px] font-mono text-teal-400/60">TG</div>
                  <div className="absolute bottom-4 left-7 text-[8px] font-mono text-teal-400/60">BD</div>
                  <div className="absolute top-4 left-7 text-[8px] font-mono text-teal-400/60">BL</div>
                </div>

                {/* Fixed Center Pointer / Arrow Needle */}
                <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                  <Navigation className="w-10 h-10 text-teal-400 drop-shadow-md" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-black text-teal-300 font-mono tracking-wide">
                  {getDirectionCardinal(compassHeading)}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Putar HP untuk mengkalibrasi arah magnetik real-time
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={initCompass}
                  className="px-4 py-2 bg-teal-900/60 hover:bg-teal-800 text-teal-300 text-xs font-bold rounded-xl border border-teal-600/50 flex items-center gap-1.5 active:scale-95 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    {isCompassActive ? 'Kalibrasi Ulang (+45°)' : 'Aktifkan Sensor Magnetik'}
                  </span>
                </button>
              </div>
            </div>

            {/* KOORDINAT GPS LOKAL */}
            <div className="bg-slate-800/90 p-4 rounded-2xl shadow-sm border border-slate-700/80 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-white uppercase flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>Koordinat GPS Saya (Offline)</span>
                </h4>
                <button
                  onClick={getGPSLocation}
                  className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>Cek GPS</span>
                </button>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl font-mono text-xs text-slate-200 space-y-1.5 border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Latitude:</span>
                  <span className="font-bold text-teal-300">{gpsCoords.lat}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Longitude:</span>
                  <span className="font-bold text-teal-300">{gpsCoords.long}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[10px]">
                  <span className="text-slate-500">Akurasi / Ketinggian:</span>
                  <span className="text-slate-400">
                    {gpsCoords.accuracy || '±5m'} • {gpsCoords.altitude || '24m dpl'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copyCoordinates}
                  className="w-full py-2.5 px-3 bg-teal-800/60 hover:bg-teal-700/60 text-teal-200 border border-teal-600/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Koordinat (Bisa Dibacakan via Radio/HT)</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                * Koordinat bekerja otomatis tanpa perlu kuota internet melalui satelit GPS HP.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MENU 3: MORSEQU (PANDUAN & AUTO-MORSE) */}
        {/* ======================================================== */}
        {activeTab === 'morse' && (
          <div className="space-y-3.5">
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-emerald-100 p-4 rounded-2xl border border-emerald-700/50 shadow-md">
              <div className="flex items-center space-x-2.5 mb-1">
                <div className="p-2 rounded-xl bg-emerald-800/80 text-emerald-300">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">MorseQu - Komunikasi Tanpa Sinyal</h3>
                  <p className="text-[10px] text-emerald-300">
                    Modus komunikasi darurat menggunakan sandi morse cahaya & suara.
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-SOS Morse Pemancar */}
            <div className="bg-slate-800/90 p-4 rounded-2xl shadow-sm border border-slate-700/80 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-white uppercase flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Auto-SOS Morse Pemancar</span>
                </h4>
                {isMorsePlaying && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold animate-pulse">
                    Memancarkan Sinyal
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300">
                Pancarkan pola SOS darurat otomatis melalui kedipan visual layar & speaker frekuensi 850Hz:
              </p>

              {/* Status Display when playing */}
              {isMorsePlaying && (
                <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="font-bold text-amber-300">
                      Sinyal Aktif: Huruf &quot;{activeMorseChar || '...'}&quot;
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">850Hz Tone</span>
                </div>
              )}

              <button
                onClick={startMorseSOS}
                className={`w-full py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 active:scale-98 transition ${
                  isMorsePlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isMorsePlaying ? (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Hentikan Auto-SOS Morse</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Mulai Auto-SOS Morse (Cahaya & Suara)</span>
                  </>
                )}
              </button>
            </div>

            {/* Sandi Morse SOS Universal */}
            <div className="bg-slate-800/90 p-4 rounded-2xl shadow-sm border border-slate-700/80 space-y-2.5">
              <h4 className="font-bold text-xs text-white uppercase flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Sandi Morse SOS Universal</span>
              </h4>

              <div className="bg-slate-900 p-3 rounded-xl text-center border border-slate-700">
                <div className="font-mono text-base font-extrabold text-amber-400 tracking-widest">
                  ( . . . ) &nbsp; ( - - - ) &nbsp; ( . . . )
                </div>
                <div className="text-[11px] text-slate-300 font-medium mt-1">
                  S (Pendek 3x) — O (Panjang 3x) — S (Pendek 3x)
                </div>
              </div>
            </div>

            {/* Kamus Sandi Morse Darurat Cepat */}
            <div className="bg-slate-800/90 p-4 rounded-2xl shadow-sm border border-slate-700/80 space-y-2.5">
              <h4 className="font-bold text-xs text-white uppercase flex items-center space-x-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Kamus Sandi Morse Darurat</span>
              </h4>

              <div className="space-y-2">
                {[
                  { word: 'SOS', code: '... --- ...', desc: 'Darurat Umum Minta Bantuan Segera' },
                  { word: 'TOLONG', code: '- --- .-.. --- -. --.', desc: 'Membutuhkan Pertolongan Cepat' },
                  { word: 'BAHAYA', code: '-... .- .... .- -.-- .-', desc: 'Peringatan Ancaman Sekitar' },
                  { word: 'AIR / SAR', code: '.- .. .-.', desc: 'Kebutuhan Pasokan Logistik' },
                  { word: 'AMAN', code: '.- -- .- -.', desc: 'Kondisi Telah Terkendali' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-900 rounded-xl border border-slate-700/70 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.word}</span>
                        <span className="font-mono text-amber-400 text-xs font-bold">{item.code}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => playWordMorse(item.word, item.code)}
                      className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-600/40 hover:bg-emerald-900 text-xs font-semibold flex items-center gap-1 active:scale-95 transition"
                      title="Dengarkan Suara"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Bunyi</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MENU 4: SANDIQU (ISYARAT EVAKUASI SAR & BANJIR) */}
        {/* ======================================================== */}
        {activeTab === 'sandi' && (
          <div className="space-y-3.5">
            {/* Header Banner */}
            <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 text-blue-100 p-4 rounded-2xl border border-blue-700/50 shadow-md">
              <div className="flex items-center space-x-2.5 mb-1">
                <div className="p-2 rounded-xl bg-blue-800/80 text-blue-300">
                  <LifeBuoy className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">SandiQu - Taktis Tim SAR & Banjir</h3>
                  <p className="text-[10px] text-blue-200">
                    Panduan isyarat evakuasi & alat pemancar penanda lokasi saat terjebak banjir.
                  </p>
                </div>
              </div>
            </div>

            {/* Fitur Pemancar Sinyal Lokasi Banjir */}
            <div className="bg-slate-800/90 p-4 rounded-2xl shadow-sm border border-blue-900/50 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-white uppercase flex items-center space-x-2">
                  <Waves className="w-4 h-4 text-blue-400" />
                  <span>Sinyal Lokasi Terjebak Banjir</span>
                </h4>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  Darurat Malam
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Aktifkan saat terjebak di atap/lantai 2 rumah. HP akan memancarkan kedipan layar darurat merah-putih kontras tinggi & sirine penembus bising hujan (1200Hz):
              </p>

              {isFloodBeaconActive && (
                <div className="p-3 bg-slate-900 rounded-xl border border-red-500/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                    <span className="font-bold text-red-400 uppercase">
                      BEACON AKTIF: RADAR SAR 1200Hz
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white">Layar Berkedip</span>
                </div>
              )}

              <button
                onClick={toggleFloodBeacon}
                className={`w-full py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 active:scale-98 transition ${
                  isFloodBeaconActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isFloodBeaconActive ? (
                  <>
                    <Square className="w-4 h-4" />
                    <span>HENTIKAN SINYAL EVAKUASI</span>
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4" />
                    <span>Pancarkan Sinyal Evakuasi SAR (1200Hz)</span>
                  </>
                )}
              </button>
            </div>

            {/* Kode Isyarat Tubuh Kepada Tim SAR */}
            <div className="bg-slate-800/90 p-4 rounded-2xl shadow-sm border border-slate-700/80 space-y-2.5">
              <h4 className="font-bold text-xs text-white uppercase flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Isyarat Tangan Ke Perahu / Helikopter SAR</span>
              </h4>

              <div className="space-y-2 pt-1 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-blue-500/30">
                  <span className="font-bold text-blue-400 block mb-0.5">
                    1. BENTUK HURUF &quot;Y&quot; (YES / BUTUH BANTUAN)
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Rentangkan kedua tangan lurus ke atas membentuk huruf V/Y. Artinya:{' '}
                    <strong className="text-white">&quot;Kami butuh evakuasi segera!&quot;</strong>
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <span className="font-bold text-slate-300 block mb-0.5">
                    2. BENTUK HURUF &quot;N&quot; (NO / AMAN)
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Satu tangan lurus ke atas, satu tangan lurus ke bawah. Artinya:{' '}
                    <strong className="text-white">&quot;Kami selamat / Tidak butuh bantuan.&quot;</strong>
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-red-500/30">
                  <span className="font-bold text-red-400 block mb-0.5">
                    3. KAIN MERAH / WARNA MENYALA
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Kibarkan kain/pakaian warna menyala di ujung galah atau genteng atap rumah agar posisi mudah ditandai tim evakuasi di siang hari.
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-amber-500/30">
                  <span className="font-bold text-amber-400 block mb-0.5">
                    4. ISYARAT CERMIN / PANTULAN CAHAYA 3X
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Pantulkan sinar matahari menggunakan cermin atau senter secara berulang 3 kali ke arah helikopter / perahu SAR.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MENU 5: KONTAK DARURAT (SETTING) */}
        {/* ======================================================== */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Kontak Ring 1 (Keluarga & RT)
              </h3>
              <button
                onClick={() => setIsAddContactModalOpen(true)}
                className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah
              </button>
            </div>

            <div className="space-y-2.5">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-slate-800 p-3 rounded-2xl border border-slate-700 flex items-center justify-between shadow-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-slate-700 text-emerald-400 flex items-center justify-center font-bold text-xs border border-slate-600">
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{contact.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {contact.phone} • {contact.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        contact.priority === 'Prioritas'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : contact.priority === 'Darurat'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      {contact.priority}
                    </span>
                    <a
                      href={`tel:${contact.phone}`}
                      className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 active:scale-90 transition"
                      title="Panggil"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Instansi Resmi Terdekat */}
            <div className="bg-slate-800/40 p-3 rounded-2xl border border-slate-700/50 mt-4 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Instansi Resmi Terdekat
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href="tel:110"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white flex items-center justify-between active:scale-98 transition"
                >
                  <span>Polsek Terdekat</span>
                  <span className="text-red-400 font-bold font-mono">110</span>
                </a>
                <a
                  href="tel:113"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white flex items-center justify-between active:scale-98 transition"
                >
                  <span>Pemadam (Damkar)</span>
                  <span className="text-red-400 font-bold font-mono">113</span>
                </a>
                <a
                  href="tel:118"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white flex items-center justify-between active:scale-98 transition"
                >
                  <span>Ambulans Darurat</span>
                  <span className="text-red-400 font-bold font-mono">118</span>
                </a>
                <a
                  href="tel:081299990303"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-white flex items-center justify-between active:scale-98 transition"
                >
                  <span>Pos Ronda RT 03</span>
                  <span className="text-emerald-400 font-bold font-mono">Pos 03</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MENU 6: RIWAYAT DARURAT & LOG */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Log Kejadian Tersimpan
              </h3>
              {logs.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[10px] text-slate-400 hover:text-red-400 underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus Log
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs bg-slate-800/30 rounded-2xl border border-slate-800">
                  Belum ada log sinyal darurat tersimpan di perangkat ini.
                </div>
              ) : (
                logs.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.mode === 'Simulasi' ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                        ></span>
                        <span className="text-xs font-extrabold text-white">{item.category}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-medium">
                          {item.mode}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.date} • {item.timestamp}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 italic bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                      {item.transcript}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                      <span>📍 {item.location}</span>
                      <span className="text-emerald-400 font-bold">Saved LocalDevice ✓</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* NAVIGASI BAWAH SIAGAQU (LENGKAP DENGAN NAVIQU, MORSEQU, DAN SANDIQU) */}
      <div className="bg-slate-900 border-t border-slate-800 px-1 pt-1.5 pb-6 sm:pb-7 flex items-center justify-around z-20 shrink-0 shadow-xl android-navbar-safe">
        {/* Tab 1: SiagaQu (Panic Button) */}
        <button
          onClick={() => setActiveTab('siaga')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
            activeTab === 'siaga' ? 'text-red-500 font-bold' : 'text-slate-500 hover:text-red-400'
          }`}
          title="Panic Button"
        >
          <AlertTriangle className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold mt-0.5">SiagaQu</span>
        </button>

        {/* Tab 2: NaviQu (Kompas & GPS) */}
        <button
          onClick={() => setActiveTab('naviqu')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
            activeTab === 'naviqu' ? 'text-teal-400 font-bold' : 'text-slate-500 hover:text-teal-400'
          }`}
          title="NaviQu Kompas"
        >
          <Compass className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold mt-0.5">NaviQu</span>
        </button>

        {/* Tab 3: MorseQu (Auto-SOS Morse) */}
        <button
          onClick={() => setActiveTab('morse')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
            activeTab === 'morse'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-500 hover:text-emerald-400'
          }`}
          title="MorseQu"
        >
          <Radio className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold mt-0.5">MorseQu</span>
        </button>

        {/* Tab 4: SandiQu (Taktis SAR & Banjir) */}
        <button
          onClick={() => setActiveTab('sandi')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
            activeTab === 'sandi' ? 'text-blue-400 font-bold' : 'text-slate-500 hover:text-blue-400'
          }`}
          title="SandiQu"
        >
          <LifeBuoy className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold mt-0.5">SandiQu</span>
        </button>

        {/* Tab 5: Kontak Siaga */}
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
            activeTab === 'contacts'
              ? 'text-amber-400 font-bold'
              : 'text-slate-500 hover:text-amber-400'
          }`}
          title="Kontak Siaga"
        >
          <PhoneCall className="w-4.5 h-4.5" />
          <span className="text-[9px] font-medium mt-0.5">Kontak</span>
        </button>

        {/* Tab 6: Riwayat Log */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center py-1 px-1.5 rounded-xl transition ${
            activeTab === 'history'
              ? 'text-purple-400 font-bold'
              : 'text-slate-500 hover:text-purple-400'
          }`}
          title="Riwayat Log"
        >
          <History className="w-4.5 h-4.5" />
          <span className="text-[9px] font-medium mt-0.5">Log</span>
        </button>
      </div>

      {/* OVERLAY SIMULASI DARURAT AKTIF (ALUR 3-5 DETIK) */}
      {isEmergencyActive && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col justify-between p-5 animate-in fade-in duration-200">
          {/* Header Overlay */}
          <div className="flex items-center justify-between border-b border-red-500/30 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <span className="font-extrabold text-sm text-red-400 uppercase tracking-widest">
                SINYAL DARURAT AKTIF
              </span>
            </div>
            <div className="text-[11px] font-bold text-slate-300 font-mono">
              00:0{Math.max(0, emergencySecondsLeft)}
            </div>
          </div>

          {/* Body Flow Visualizer */}
          <div className="my-auto text-center space-y-5">
            {/* Animated Radar / Siren Visual */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping"></div>
              <div className="absolute inset-2 rounded-full border border-red-500/20 animate-radar"></div>
              <div className="w-24 h-24 rounded-full bg-red-600/30 border-2 border-red-500 flex flex-col items-center justify-center text-white shadow-2xl">
                <Volume2 className="w-8 h-8 text-red-400 animate-pulse" />
                <span className="text-[9px] font-black uppercase text-red-200 mt-1">
                  {selectedCategory}
                </span>
              </div>
            </div>

            {/* Status Step Sequence */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 text-left space-y-2.5 max-w-xs mx-auto shadow-xl">
              <div className="flex items-center space-x-3 text-xs">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] border border-emerald-500/40">
                  ✓
                </div>
                <span className="text-slate-200">0s: Titik GPS Terkunci (RT 03 Blok A/12)</span>
              </div>

              <div
                className={`flex items-center space-x-3 text-xs transition-opacity duration-300 ${
                  activeStep >= 2 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                    activeStep >= 2
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {activeStep >= 2 ? '✓' : '2'}
                </div>
                <span className="text-slate-200">1-2s: Broadcast Sirine Radius 500m-1km</span>
              </div>

              <div
                className={`flex items-center space-x-3 text-xs transition-opacity duration-300 ${
                  activeStep >= 3 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                    activeStep >= 3
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {activeStep >= 3 ? '✓' : '3'}
                </div>
                <span className="text-slate-200">3s: Auto-Create Group ChatQu RT</span>
              </div>

              <div
                className={`flex items-center space-x-3 text-xs transition-opacity duration-300 ${
                  activeStep >= 4 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                    activeStep >= 4
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {activeStep >= 4 ? '✓' : '4'}
                </div>
                <span className="text-slate-200">4-5s: Rekam Mic & Subtitel Teks Active</span>
              </div>
            </div>

            {/* Real-time Voice Transcript Box */}
            <div className="bg-slate-900 border border-red-500/40 rounded-2xl p-3 max-w-xs mx-auto text-left relative overflow-hidden">
              <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span>Live Transkrip Suara Pelapor</span>
                </span>
                <span className="text-slate-400 font-mono">00:0{Math.max(0, emergencySecondsLeft)}</span>
              </div>
              <div className="text-xs font-medium text-white italic bg-slate-950 p-2 rounded-xl border border-slate-800 min-h-[44px]">
                {activeStep >= 4 ? activeTranscript : '"Merekam audio & mendeteksi suara..."'}
              </div>
            </div>
          </div>

          {/* Action Buttons Overlay */}
          <div className="space-y-2 shrink-0">
            <button
              onClick={saveAndComplete}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl shadow-lg transition text-xs uppercase tracking-wider flex items-center justify-center space-x-2 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Ke Device & Buka ChatQu</span>
            </button>
            <button
              onClick={cancelEmergency}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-2.5 rounded-2xl transition text-xs active:scale-98"
            >
              Batalkan Sinyal (Salah Tekan)
            </button>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KONTAK DARURAT */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white">Tambah Kontak Darurat</h3>
              <button
                onClick={() => setIsAddContactModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nama Kontak</label>
                <input
                  type="text"
                  placeholder="Contoh: Pak RT Agus / Kakak Kandung"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Contoh: 0812-3456-7890"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-red-500 outline-hidden font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Peran / Hubungan</label>
                <select
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:ring-2 focus:ring-red-500 outline-hidden"
                >
                  <option>Keluarga</option>
                  <option>Pengurus RT/RW</option>
                  <option>Tetangga Terdekat</option>
                  <option>Dokter / Nakes</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                >
                  Simpan Kontak
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
