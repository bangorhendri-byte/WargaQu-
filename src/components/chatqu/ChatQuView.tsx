import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Camera,
  Search,
  MoreVertical,
  Users,
  MessageSquare,
  AlertTriangle,
  Mic,
  Send,
  Smile,
  Paperclip,
  Phone,
  Video,
  CheckCheck,
  Check,
  ShieldAlert,
  Play,
  Pause,
  MapPin,
  FileText,
  User,
  X,
  Megaphone,
  Bell,
  Plus
} from 'lucide-react';

import { UserAccount } from '../../types';
import { AuthService } from '../../services/auth';

interface ChatQuViewProps {
  onBackToMain: () => void;
  showNotification: (msg: string) => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
}

interface MessageItem {
  id: string;
  sender: string;
  isMe: boolean;
  text?: string;
  isVoice?: boolean;
  voiceDuration?: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatRoomData {
  id: string;
  title: string;
  subtitle: string;
  category: 'group' | 'personal' | 'emergency';
  unreadCount?: number;
  time: string;
  lastMessage: string;
  isEmergency?: boolean;
  avatarBg: string;
  avatarIcon: 'emergency' | 'group' | 'security' | 'personal';
  messages: MessageItem[];
}

export const ChatQuView: React.FC<ChatQuViewProps> = ({
  onBackToMain,
  showNotification,
  currentUser = null,
  onOpenSecurityModal,
}) => {
  // Tabs: 'community' | 'chats' | 'announcements' | 'emergency'
  const [activeTab, setActiveTab] = useState<'community' | 'chats' | 'announcements' | 'emergency'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ChatRoomData | null>(null);
  const [inputText, setInputText] = useState('');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState<'voice' | 'video' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial chat data
  const [chats, setChats] = useState<ChatRoomData[]>([
    {
      id: 'emergency-1',
      title: 'DARURAT: Anak Hilang (Blok A)',
      subtitle: 'SiagaQu System • Penanganan Aktif',
      category: 'emergency',
      isEmergency: true,
      time: '2 mnt',
      lastMessage: '[VOICE]: Tolong anak baju merah usia 5 thn di sekitar pos...',
      avatarBg: 'bg-red-600',
      avatarIcon: 'emergency',
      messages: [
        {
          id: 'e1',
          sender: 'SiagaQu Dispatcher',
          isMe: false,
          text: '🚨 PERINGATAN DARURAT WARGA: Anak laki-laki usia 5 tahun (baju merah, celana biru) terpantau keluar gerbang Blok A jam 10.35. Mohon warga di sekitar taman dan pos jaga membantu pengecekan.',
          time: '10.36',
          status: 'read'
        },
        {
          id: 'e2',
          sender: 'Bpk. Herman (Pos Ronda)',
          isMe: false,
          isVoice: true,
          voiceDuration: '0:18',
          text: 'Suara laporan saksi mata di depan pos ronda blok A.',
          time: '10.38',
          status: 'read'
        },
        {
          id: 'e3',
          sender: 'Anda',
          isMe: true,
          text: 'Saya sedang di taman bermain Blok B, kami bantu sisir area ayunan.',
          time: '10.40',
          status: 'read'
        }
      ]
    },
    {
      id: 'grup-rt03',
      title: 'Grup Resmi RT 03 / RW 05',
      subtitle: 'Pak RT, Pengurus & 84 Warga',
      category: 'group',
      unreadCount: 5,
      time: '10.42',
      lastMessage: 'Pak RT Ahmad: Bapak/Ibu sekalian, jadwal kerja bakti Minggu jam 07.00...',
      avatarBg: 'bg-sky-600',
      avatarIcon: 'group',
      messages: [
        {
          id: 'g1',
          sender: 'Pak RT Ahmad',
          isMe: false,
          text: 'Assalamu’alaikum Bapak/Ibu warga RT 03. Mengingatkan kembali bahwa hari Minggu ini kita adakan kerja bakti massal pembersihan selokan pencegahan nyamuk.',
          time: '10.30',
          status: 'read'
        },
        {
          id: 'g2',
          sender: 'Bu Nur (Kader Dasawisma)',
          isMe: false,
          text: 'Siap Pak RT, konsumsi teh hangat dan kue basah nanti kami siapkan dari tim ibu-ibu PKK.',
          time: '10.35',
          status: 'read'
        },
        {
          id: 'g3',
          sender: 'Pak RT Ahmad',
          isMe: false,
          text: 'Alhamdulillah terima kasih Bu Nur. Mohon yang memiliki cangkul & gerobak sorong bisa dibawa.',
          time: '10.42',
          status: 'read'
        }
      ]
    },
    {
      id: 'ronda-malam',
      title: 'Pos Ronda & Siskamling',
      subtitle: 'Regu A & Hansip RT 03',
      category: 'group',
      time: 'Kemarin',
      lastMessage: 'Kunci portal malam ini dipegang oleh Pak Asep ya.',
      avatarBg: 'bg-[#132232] border border-sky-400',
      avatarIcon: 'security',
      messages: [
        {
          id: 'r1',
          sender: 'Pak Hendra (Koord Ronda)',
          isMe: false,
          text: 'Jadwal ronda malam Kamis: Regu A (Pak Asep, Pak Joko, Mas Hendri, Pak Danu).',
          time: '20.15',
          status: 'read'
        },
        {
          id: 'r2',
          sender: 'Pak Asep',
          isMe: false,
          text: 'Siap laksanakan, kunci portal malam ini dipegang oleh Pak Asep ya.',
          time: '21.05',
          status: 'read'
        }
      ]
    },
    {
      id: 'pak-rt-ahmad',
      title: 'Pak RT Ahmad (Ketua RT)',
      subtitle: 'Online • Ketua RT 03',
      category: 'personal',
      time: 'Kemarin',
      lastMessage: 'Surat Pengantar KTP sudah diterbitkan ya mas Hendri.',
      avatarBg: 'bg-slate-700',
      avatarIcon: 'personal',
      messages: [
        {
          id: 'p1',
          sender: 'Anda',
          isMe: true,
          text: 'Assalamu’alaikum Pak RT, mohon izin mengajukan surat pengantar pembuatan KTP baru untuk anak saya.',
          time: '09.15',
          status: 'read'
        },
        {
          id: 'p2',
          sender: 'Pak RT Ahmad',
          isMe: false,
          text: 'Wa’alaikumsalam mas Hendri. Berkas KK sudah saya cek di aplikasi RtQu, semuanya lengkap.',
          time: '10.12',
          status: 'read'
        },
        {
          id: 'p3',
          sender: 'Pak RT Ahmad',
          isMe: false,
          text: 'Surat Pengantar KTP sudah diterbitkan ya mas Hendri. Bisa langsung diunduh lewat RtQu atau diambil di rumah.',
          time: '10.15',
          status: 'read'
        }
      ]
    }
  ]);

  // Announcements list for Pengumuman tab
  const announcements = [
    {
      id: 'ann-1',
      title: 'Kerja Bakti Akbar & Bersih Saluran Air',
      author: 'Pengurus RT 03',
      date: 'Hari ini • 08:00 WIB',
      content: 'Wajib hadir seluruh kepala keluarga dalam rangka mengantisipasi musim penghujan dan genangan air.',
      badge: 'Penting'
    },
    {
      id: 'ann-2',
      title: 'Pelaksanaan Fogging DBD Wilayah RW 05',
      author: 'Puskesmas & Seksi Kesehatan RT',
      date: '28 Okt • 14:00 WIB',
      content: 'Mohon warga menutup wadah makanan dan membuka jendela belakang saat petugas fogging berkeliling.',
      badge: 'Kesehatan'
    },
    {
      id: 'ann-3',
      title: 'Iuran Sampah & Keamanan Periode November',
      author: 'Bendahara RT 03',
      date: '25 Okt • 10:00 WIB',
      content: 'Bisa dibayarkan tunai melalui petugas ronda atau transfer digital lewat menu RtQu WargaPay.',
      badge: 'Keuangan'
    }
  ];

  // Citizen Directory for Community tab
  const citizens = [
    { name: 'Pak RT Ahmad Fauzi', role: 'Ketua RT 03', phone: '0812-3456-7890', block: 'Blok A No. 1' },
    { name: 'Pak Hendra Kusuma', role: 'Sekretaris RT', phone: '0813-9876-5432', block: 'Blok B No. 4' },
    { name: 'Ibu Hj. Aminah', role: 'Bendahara RT', phone: '0815-1122-3344', block: 'Blok A No. 8' },
    { name: 'Pak Asep Sunandar', role: 'Kepala Keamanan & Ronda', phone: '0818-4455-6677', block: 'Pos Ronda Utama' },
    { name: 'Bu Nurul Komariah', role: 'Ketua PKK / Dasawisma', phone: '0821-6677-8899', block: 'Blok C No. 12' }
  ];

  // Auto scroll to bottom in room
  useEffect(() => {
    if (activeRoom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeRoom?.messages]);

  // Send message handler
  const handleSendMessage = () => {
    if (!inputText.trim() || !activeRoom) return;

    const newMessage: MessageItem = {
      id: 'msg-' + Date.now(),
      sender: 'Anda',
      isMe: true,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };

    // Update active room
    const updatedMessages = [...activeRoom.messages, newMessage];
    const updatedActiveRoom = { ...activeRoom, messages: updatedMessages, lastMessage: inputText.trim(), time: 'Baru saja' };
    setActiveRoom(updatedActiveRoom);

    // Update global chats list
    setChats(prev =>
      prev.map(c => (c.id === activeRoom.id ? updatedActiveRoom : c))
    );

    setInputText('');

    // Simulate reply after 1.5 seconds if it's Pak RT
    if (activeRoom.id === 'pak-rt-ahmad') {
      setTimeout(() => {
        const replyMsg: MessageItem = {
          id: 'reply-' + Date.now(),
          sender: 'Pak RT Ahmad',
          isMe: false,
          text: 'Siap mas, terima kasih konfirmasinya. Salam untuk keluarga ya.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        };
        setActiveRoom(curr => {
          if (!curr || curr.id !== 'pak-rt-ahmad') return curr;
          const nextMsgs = [...curr.messages, replyMsg];
          const nextRoom = { ...curr, messages: nextMsgs, lastMessage: replyMsg.text || '' };
          setChats(p => p.map(c => (c.id === 'pak-rt-ahmad' ? nextRoom : c)));
          return nextRoom;
        });
      }, 1500);
    }
  };

  const handleOpenRoom = (room: ChatRoomData) => {
    // Clear unread
    const cleared = { ...room, unreadCount: undefined };
    setActiveRoom(cleared);
    setChats(prev => prev.map(c => (c.id === room.id ? cleared : c)));
  };

  const filteredChats = chats.filter(c => {
    if (searchQuery.trim()) {
      return (
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === 'emergency') {
      return c.isEmergency;
    }
    return true;
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-[#09131d] text-[#e2e8f0] font-sans select-none">
      
      {/* ========================================================================= */}
      {/* HEADER CHATQU (SKY BLUE THEME MATCHING MAIN DASHBOARD ICON) */}
      {/* ========================================================================= */}
      <header className="bg-[#101e2c] text-[#94a3b8] px-3 pt-10 sm:pt-11 pb-1 flex flex-col justify-between shadow-md z-10 border-b border-[#1b2d3f] shrink-0 android-header-safe">
        
        {/* Top Header Row */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onBackToMain}
              className="p-1 rounded-lg hover:bg-white/10 active:scale-95 transition text-sky-400"
              title="Kembali ke Beranda WargaQu"
            >
              <ArrowLeft className="w-5 h-5 text-sky-400" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
                <MessageSquare className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5 leading-none">
                  ChatQu
                  <span className="text-[9px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded-full">
                    RT 03
                  </span>
                </h1>
                <p className="text-[10px] text-sky-200/70 mt-0.5 truncate">Komunikasi & Koordinasi Warga</p>
              </div>
            </div>
          </div>

          {/* Header Action Icons */}
          <div className="flex items-center space-x-2 text-base text-slate-300">
            <button
              onClick={() => showNotification('Kamera Chat: Ambil Foto Kegiatan / Bukti')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
              title="Kamera"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-1.5 rounded-lg transition ${
                showSearch ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Cari Percakapan"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => showNotification('Menu: Setelan Notifikasi RT 03')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
              title="Opsi Lainnya"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Search Input (Collapsible) */}
        {showSearch && (
          <div className="mb-2 px-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="bg-[#172738] rounded-xl flex items-center px-3 py-1.5 border border-sky-500/30">
              <Search className="w-4 h-4 text-sky-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari warga, grup, atau topik..."
                className="bg-transparent flex-1 text-xs text-white placeholder-slate-400 focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB NAVIGATION (WA STYLE with Sky Blue accent matching ChatQu icon) */}
        <div className="flex text-center text-[11px] font-semibold border-b border-transparent">
          {/* Community Icon Tab */}
          <button
            onClick={() => setActiveTab('community')}
            className={`w-9 py-2 flex justify-center items-center transition ${
              activeTab === 'community'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Daftar Warga & Pengurus"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Chat Tab */}
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 flex justify-center items-center space-x-1 transition ${
              activeTab === 'chats'
                ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Chat</span>
            <span className="bg-sky-500 text-[#09131d] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full leading-tight">
              3
            </span>
          </button>

          {/* Pengumuman Tab */}
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-2 flex justify-center items-center space-x-1 transition truncate ${
              activeTab === 'announcements'
                ? 'text-sky-400 border-b-2 border-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Warta RT</span>
          </button>

          {/* Siaga Tab */}
          <button
            onClick={() => setActiveTab('emergency')}
            className={`flex-1 py-2 flex justify-center items-center space-x-1 transition ${
              activeTab === 'emergency'
                ? 'text-rose-400 border-b-2 border-rose-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Siaga</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 min-h-0 overflow-y-auto bg-[#0b1622] divide-y divide-[#172738]">

        {/* ================= TAB 1: CHATS LIST ================= */}
        {activeTab === 'chats' && (
          <div>
            {filteredChats.map(chat => {
              if (chat.isEmergency) {
                return (
                  /* CHAT PINNED / DARURAT SIAGAQU */
                  <div
                    key={chat.id}
                    onClick={() => handleOpenRoom(chat)}
                    className="bg-[#291316] border-l-4 border-red-500 px-4 py-3 flex items-center space-x-3 cursor-pointer hover:bg-[#33181d] active:bg-[#3d1c22] transition"
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white text-xl animate-pulse shadow-md shadow-red-900/40">
                        <AlertTriangle className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h2 className="text-sm font-bold text-red-400 truncate flex items-center gap-1.5">
                          {chat.title}
                        </h2>
                        <span className="text-[11px] text-red-400 font-semibold">{chat.time}</span>
                      </div>
                      <p className="text-xs text-red-200/90 truncate flex items-center">
                        <Mic className="w-3.5 h-3.5 text-red-400 mr-1 shrink-0" />
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                /* REGULAR CHAT ITEM */
                <div
                  key={chat.id}
                  onClick={() => handleOpenRoom(chat)}
                  className="px-4 py-3 flex items-center space-x-3 cursor-pointer hover:bg-[#132334] active:bg-[#16293d] transition"
                >
                  <div className="shrink-0">
                    <div
                      className={`w-12 h-12 ${chat.avatarBg} rounded-full flex items-center justify-center text-white text-lg font-bold shadow`}
                    >
                      {chat.avatarIcon === 'group' && <Users className="w-6 h-6 text-white" />}
                      {chat.avatarIcon === 'security' && <ShieldAlert className="w-6 h-6 text-sky-400" />}
                      {chat.avatarIcon === 'personal' && <User className="w-6 h-6 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h2 className="text-sm font-bold text-white truncate">{chat.title}</h2>
                      <span className="text-[11px] text-slate-400">{chat.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unreadCount && (
                    <span className="bg-sky-500 text-[#09131d] text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              );
            })}

            {filteredChats.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada obrolan yang sesuai dengan "{searchQuery}".
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PENGUMUMAN ================= */}
        {activeTab === 'announcements' && (
          <div className="p-4 space-y-3">
            <div className="bg-[#101e2c] border border-sky-500/30 rounded-xl p-3 text-xs text-sky-200 flex items-start gap-2.5">
              <Megaphone className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Saluran Pengumuman Resmi RT 03</span>
                Papan informasi satu arah dari pengurus RT untuk seluruh warga.
              </div>
            </div>

            {announcements.map(ann => (
              <div
                key={ann.id}
                className="bg-[#122232] border border-[#1d3348] hover:border-sky-500/40 rounded-xl p-4 space-y-2 transition shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-md">
                    {ann.badge}
                  </span>
                  <span className="text-[10px] text-slate-400">{ann.date}</span>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">{ann.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
                <div className="pt-2 border-t border-[#1d3348] flex justify-between items-center text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-sky-400 font-medium">
                    <Bell className="w-3 h-3" /> Oleh: {ann.author}
                  </span>
                  <button
                    onClick={() => showNotification(`Membagikan pengumuman: ${ann.title}`)}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                  >
                    Bagikan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= TAB 3: SIAGA (ONLY EMERGENCY THREADS) ================= */}
        {activeTab === 'emergency' && (
          <div className="p-4 space-y-3">
            <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-white block">Jalur Siaga Darurat Cepat</span>
                Kanal prioritas langsung terhubung dengan Pos Ronda, Pengurus RT, dan warga sekitar.
              </div>
            </div>

            {chats
              .filter(c => c.isEmergency)
              .map(chat => (
                <div
                  key={chat.id}
                  onClick={() => handleOpenRoom(chat)}
                  className="bg-[#241114] border-2 border-red-500 rounded-2xl p-4 cursor-pointer hover:bg-[#2d1519] transition space-y-2 shadow-lg"
                >
                  <div className="flex justify-between items-center">
                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> AKTIF SEKARANG
                    </span>
                    <span className="text-xs text-red-400 font-bold">{chat.time} lalu</span>
                  </div>
                  <h3 className="text-sm font-black text-white">{chat.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{chat.lastMessage}</p>
                  <div className="pt-2 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-mono text-[10px]">Lokasi: Sekitar Blok A</span>
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs flex items-center gap-1">
                      Buka Koordinasi
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ================= TAB 4: KOMUNITAS WARGA ================= */}
        {activeTab === 'community' && (
          <div className="p-4 space-y-3">
            <div className="bg-[#101e2c] border border-sky-500/30 rounded-xl p-3 text-xs text-sky-200">
              <span className="font-bold text-white block mb-0.5">Direktori Kontak Warga & Pengurus</span>
              RT 03 / RW 05 Kelurahan Gotong Royong
            </div>

            <div className="space-y-2">
              {citizens.map((citizen, idx) => (
                <div
                  key={idx}
                  className="bg-[#122232] border border-[#1b2f42] rounded-xl p-3 flex items-center justify-between hover:border-sky-500/40 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-sky-600/30 border border-sky-400/40 text-sky-400 flex items-center justify-center font-bold text-sm">
                      {citizen.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{citizen.name}</h4>
                      <p className="text-[11px] text-sky-400 font-medium">{citizen.role}</p>
                      <p className="text-[10px] text-slate-400">{citizen.block}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => showNotification(`Memanggil ${citizen.name} (${citizen.phone})...`)}
                      className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-[#09131d] flex items-center justify-center transition"
                      title="Telepon"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const existing = chats.find(c => c.title.includes(citizen.name.split(' ')[2] || citizen.name));
                        if (existing) {
                          handleOpenRoom(existing);
                        } else {
                          // create personal room
                          const newRoom: ChatRoomData = {
                            id: 'c-' + Date.now(),
                            title: citizen.name,
                            subtitle: citizen.role,
                            category: 'personal',
                            time: 'Baru',
                            lastMessage: 'Memulai obrolan baru...',
                            avatarBg: 'bg-sky-700',
                            avatarIcon: 'personal',
                            messages: [
                              {
                                id: 'm1',
                                sender: citizen.name,
                                isMe: false,
                                text: `Halo, ada yang bisa saya bantu terkait ${citizen.role}?`,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                status: 'read'
                              }
                            ]
                          };
                          setChats(prev => [newRoom, ...prev]);
                          handleOpenRoom(newRoom);
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-sky-500 text-[#09131d] hover:bg-sky-400 flex items-center justify-center transition"
                      title="Kirim Pesan"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* FLOATING ACTION BUTTON (BUAT OBROLAN / GRUP BARU WA STYLE) */}
      {/* ========================================================================= */}
      <button
        onClick={() => setShowNewChatModal(true)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-sky-500 hover:bg-sky-400 active:scale-95 text-[#09131d] rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-sky-500/30 transition-all z-20 group"
        title="Buat Obrolan / Grup Baru"
      >
        <Plus className="w-7 h-7 text-[#09131d] group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* ========================================================================= */}
      {/* OVERLAY / ROOM CHAT FULL INTERACTIVE (WA STYLE with Sky Blue Accent) */}
      {/* ========================================================================= */}
      {activeRoom && (
        <div className="absolute inset-0 bg-[#09131d] z-50 flex flex-col animate-in fade-in slide-in-from-right duration-200 w-full h-full overflow-hidden">
          
          {/* HEADER ROOM CHAT */}
          <div className="bg-[#101e2c] px-3 py-2 flex items-center justify-between shadow-md border-b border-[#1b2d3f] text-slate-200 shrink-0">
            <div className="flex items-center space-x-2.5 min-w-0">
              <button
                onClick={() => setActiveRoom(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-sky-400 active:scale-90 transition"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-sky-400" />
              </button>
              
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${activeRoom.avatarBg}`}
              >
                {activeRoom.isEmergency ? (
                  <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                ) : activeRoom.avatarIcon === 'group' ? (
                  <Users className="w-5 h-5 text-white" />
                ) : activeRoom.avatarIcon === 'security' ? (
                  <ShieldAlert className="w-5 h-5 text-sky-400" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white truncate max-w-[180px]">
                  {activeRoom.title}
                </h3>
                <p className="text-[10px] text-sky-300/80 truncate">{activeRoom.subtitle}</p>
              </div>
            </div>

            {/* Room Action Icons */}
            <div className="flex items-center space-x-3 text-slate-300">
              <button
                onClick={() => setShowCallModal('video')}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                title="Panggilan Video"
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCallModal('voice')}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                title="Panggilan Suara"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                onClick={() => showNotification(`Info Lengkap: ${activeRoom.title}`)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                title="Opsi"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ISI PESAN (CHAT AREA WITH ATMOSPHERIC SUBTLE PATTERN) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 bg-[#0a1622] bg-[radial-gradient(#182c40_1px,transparent_1px)] [background-size:16px_16px]">
            
            {/* DATE BADGE */}
            <div className="text-center my-2">
              <span className="bg-[#122232] text-sky-200/80 text-[10px] font-semibold px-3 py-1 rounded-md shadow border border-sky-900/40">
                HARI INI
              </span>
            </div>

            {/* EMERGENCY NOTICE IN EMERGENCY ROOM */}
            {activeRoom.isEmergency && (
              <div className="bg-red-950/70 border border-red-500/60 rounded-xl p-3 text-xs text-red-200 space-y-1.5 shadow-md">
                <div className="flex items-center gap-1.5 font-bold text-red-400">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  STATUS DARURAT RESMI WARGA
                </div>
                <p className="text-[11px] leading-relaxed">
                  Pesan di ruangan ini disiarkan secara prioritas ke ponsel seluruh warga Blok A dan tim siskamling RT 03.
                </p>
              </div>
            )}

            {/* RENDER MESSAGES */}
            {activeRoom.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] text-xs shadow-md relative p-3 ${
                    msg.isMe
                      ? 'bg-[#0284c7] text-white rounded-t-xl rounded-bl-xl rounded-br-xs'
                      : 'bg-[#152536] text-[#e2e8f0] border border-[#20364d] rounded-t-xl rounded-br-xl rounded-bl-xs'
                  }`}
                >
                  {/* Sender Name if group and not me */}
                  {!msg.isMe && (
                    <p className="font-bold text-sky-400 text-[11px] mb-1">
                      {msg.sender}
                    </p>
                  )}

                  {/* Voice note message preview */}
                  {msg.isVoice ? (
                    <div className="flex items-center gap-2.5 py-1">
                      <button
                        onClick={() => {
                          setIsPlayingVoice(!isPlayingVoice);
                          showNotification(isPlayingVoice ? 'Voice note dihentikan' : 'Memutar pesan suara...');
                        }}
                        className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shrink-0 shadow"
                      >
                        {isPlayingVoice ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="h-1.5 bg-red-400/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-red-300 transition-all duration-300 ${
                              isPlayingVoice ? 'w-2/3' : 'w-1/4'
                            }`}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-red-200 mt-1">
                          <span>{isPlayingVoice ? '0:09' : '0:00'}</span>
                          <span>{msg.voiceDuration || '0:18'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* Time and Status indicator */}
                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                      msg.isMe ? 'text-sky-100/80' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.time}</span>
                    {msg.isMe && (
                      <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* ATTACHMENT QUICK DRAWER */}
          {showAttachMenu && (
            <div className="bg-[#101e2c] border-t border-[#1b2d3f] p-3 grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => {
                  setShowAttachMenu(false);
                  showNotification('Lampirkan Dokumen Surat RT');
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#172738] hover:bg-sky-500/20 text-sky-400 transition"
              >
                <FileText className="w-5 h-5 text-sky-400" />
                <span className="text-[10px] text-slate-300">Dokumen</span>
              </button>

              <button
                onClick={() => {
                  setShowAttachMenu(false);
                  showNotification('Buka Galeri Foto / Bukti RT');
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#172738] hover:bg-sky-500/20 text-sky-400 transition"
              >
                <Camera className="w-5 h-5 text-sky-400" />
                <span className="text-[10px] text-slate-300">Galeri</span>
              </button>

              <button
                onClick={() => {
                  setShowAttachMenu(false);
                  showNotification('Kirim Koordinat GPS Posisi Anda (-6.2088, 106.8456)');
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#172738] hover:bg-sky-500/20 text-sky-400 transition"
              >
                <MapPin className="w-5 h-5 text-sky-400" />
                <span className="text-[10px] text-slate-300">Lokasi</span>
              </button>

              <button
                onClick={() => {
                  setShowAttachMenu(false);
                  showNotification('Bagikan Kontak Warga / Hansip');
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[#172738] hover:bg-sky-500/20 text-sky-400 transition"
              >
                <User className="w-5 h-5 text-sky-400" />
                <span className="text-[10px] text-slate-300">Kontak</span>
              </button>
            </div>
          )}

          {/* EMOJI QUICK PICKER */}
          {showEmojiPicker && (
            <div className="bg-[#101e2c] border-t border-[#1b2d3f] p-2 flex gap-3 overflow-x-auto text-lg animate-in fade-in duration-150">
              {['👍', '🙏', '🚨', '👏', '📢', '❤️', '😊', '👌', '🤝', '🔥'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputText(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1 hover:bg-[#1b2d3f] rounded-lg transition active:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* INPUT BAR (WA STYLE with Sky Blue Accent) */}
          <div className="bg-[#101e2c] p-2 pb-6 sm:pb-7 flex items-center space-x-2 border-t border-[#1b2d3f] shrink-0 android-navbar-safe">
            <div className="flex-1 bg-[#18293b] rounded-full flex items-center px-3 py-1 space-x-2 border border-[#243950] focus-within:border-sky-500/60 transition">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-slate-400 hover:text-sky-400 transition"
                title="Pilih Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                placeholder="Ketik pesan..."
                className="bg-transparent flex-1 text-xs text-white placeholder-slate-400 focus:outline-none py-2"
              />

              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`transition ${showAttachMenu ? 'text-sky-400 rotate-45' : 'text-slate-400 hover:text-sky-400'}`}
                title="Lampirkan File"
              >
                <Paperclip className="w-5 h-5 -rotate-45" />
              </button>

              <button
                type="button"
                onClick={() => showNotification('Buka Kamera untuk kirim foto')}
                className="text-slate-400 hover:text-sky-400 transition"
                title="Kamera Cepat"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* SEND BUTTON / MIC TOGGLE */}
            {inputText.trim() ? (
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 bg-sky-500 hover:bg-sky-400 active:scale-95 text-[#09131d] rounded-full flex items-center justify-center text-lg shadow-md shadow-sky-500/30 transition shrink-0"
                title="Kirim Pesan"
              >
                <Send className="w-4 h-4 ml-0.5 text-[#09131d]" />
              </button>
            ) : (
              <button
                onClick={() => showNotification('Tekan & tahan untuk merekam pesan suara (Voice Note)')}
                className="w-10 h-10 bg-sky-500 hover:bg-sky-400 active:scale-95 text-[#09131d] rounded-full flex items-center justify-center text-lg shadow-md shadow-sky-500/30 transition shrink-0"
                title="Rekam Suara"
              >
                <Mic className="w-4 h-4 text-[#09131d]" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BUAT OBROLAN BARU */}
      {/* ========================================================================= */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-[#101e2c] border border-sky-500/40 rounded-2xl w-full max-w-sm p-4 space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-[#1b2d3f]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                Mulai Percakapan Baru
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  showNotification('Membuat Grup Baru: Masukkan nama grup & anggota RT');
                }}
                className="w-full p-2.5 rounded-xl bg-[#172738] hover:bg-sky-500/20 text-left flex items-center gap-3 transition"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500 text-[#09131d] flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Grup Warga Baru</div>
                  <div className="text-[11px] text-slate-400">Buat grup koordinasi RT, gang, atau panitia</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  showNotification('Kanal Siaran Pengumuman RT diaktifkan');
                }}
                className="w-full p-2.5 rounded-xl bg-[#172738] hover:bg-sky-500/20 text-left flex items-center gap-3 transition"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-[#09131d] flex items-center justify-center font-bold">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Saluran Siaran (Broadcast)</div>
                  <div className="text-[11px] text-slate-400">Kirim maklumat satu arah ke seluruh warga</div>
                </div>
              </button>

              <div className="pt-2">
                <p className="text-[11px] font-bold text-sky-400 mb-1.5">PILIH DARI KONTAK PENGURUS RT:</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {citizens.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowNewChatModal(false);
                        const existing = chats.find(item => item.title.includes(c.name.split(' ')[2] || c.name));
                        if (existing) {
                          handleOpenRoom(existing);
                        } else {
                          const newRoom: ChatRoomData = {
                            id: 'c-' + Date.now(),
                            title: c.name,
                            subtitle: c.role,
                            category: 'personal',
                            time: 'Baru',
                            lastMessage: 'Obrolan dimulai...',
                            avatarBg: 'bg-sky-700',
                            avatarIcon: 'personal',
                            messages: [
                              {
                                id: 'm0',
                                sender: c.name,
                                isMe: false,
                                text: `Assalamu'alaikum, ini kontak resmi ${c.name} (${c.role}). Silakan sampaikan pesan Anda.`,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                status: 'read'
                              }
                            ]
                          };
                          setChats(prev => [newRoom, ...prev]);
                          handleOpenRoom(newRoom);
                        }
                      }}
                      className="w-full p-2 rounded-lg hover:bg-[#1a2c3e] flex items-center justify-between text-left transition"
                    >
                      <span className="font-medium text-white">{c.name}</span>
                      <span className="text-[10px] text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded">
                        {c.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PANGGILAN SUARA / VIDEO CALL WARGA */}
      {/* ========================================================================= */}
      {showCallModal && (
        <div className="fixed inset-0 bg-[#060c14]/90 backdrop-blur-md z-50 flex flex-col items-center justify-between p-8 animate-in fade-in duration-200">
          <div className="text-center mt-12 space-y-2">
            <div className="w-24 h-24 rounded-full bg-sky-500/20 border-2 border-sky-400 mx-auto flex items-center justify-center text-sky-400 text-3xl animate-pulse shadow-xl shadow-sky-500/20">
              {showCallModal === 'video' ? <Video className="w-10 h-10" /> : <Phone className="w-10 h-10" />}
            </div>
            <h3 className="text-lg font-bold text-white mt-4">{activeRoom?.title || 'Pengurus RT 03'}</h3>
            <p className="text-xs text-sky-300 animate-pulse">
              {showCallModal === 'video' ? 'Menghubungkan Panggilan Video HD...' : 'Memanggil Suara Voip WargaQu...'}
            </p>
          </div>

          <div className="w-full flex justify-center items-center gap-6 mb-8">
            <button
              onClick={() => {
                setShowCallModal(null);
                showNotification('Panggilan diakhiri');
              }}
              className="w-16 h-16 bg-red-600 hover:bg-red-700 active:scale-95 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-600/40 transition"
              title="Tutup Panggilan"
            >
              <Phone className="w-6 h-6 rotate-135" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
