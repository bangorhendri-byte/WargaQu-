import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Menu,
  Camera,
  Users,
  GitFork,
  BookOpen,
  Share2,
  Heart,
  MessageCircle,
  Plus,
  Send,
  X,
  Printer,
  Download,
  CheckCircle2,
  User,
  Sparkles,
  Search,
  Calendar,
  MapPin,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Crosshair,
  Compass,
  Shield,
  Lock,
  FileText,
  Upload,
  Copy,
  Moon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  HeartHandshake,
  Layers,
  History,
  Archive,
  ExternalLink,
  MessageSquare,
  ArrowUpDown,
  MoveLeft,
  MoveRight,
  Edit2,
  Trash2,
  Check,
  ImageIcon,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  Phone,
  Move,
  GripVertical,
  LayoutGrid,
  GitMerge,
  Info,
  Cloud,
  FileSpreadsheet
} from 'lucide-react';
import { UserAccount } from '../../types';
import { AuthService } from '../../services/auth';
import { RealtimeSyncService } from '../../services/realtimeSync';
import { MonetizationService } from '../../services/monetization';
import { IsiCepatSilsilahView } from './IsiCepatSilsilahView';
import { DEMO_SANTA_MEMBERS } from './demoData';

interface LeluhurQuViewProps {
  onBackToWarga: () => void;
  showNotification: (msg: string) => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
}

export interface FamilySpouse {
  id: string;
  name: string;
  order?: number; // Istri ke-1, 2, 3, 4
  note?: string;
  nickname?: string;
  binBinti?: string;
  photo?: string;
  gender?: 'L' | 'P';
  origin?: string;
  birthYear?: string;
  deathYear?: string;
  status?: 'Hidup' | 'Almarhum';
  marriageNote?: string;
  childrenIds?: string[];
}

export interface FamilyMember {
  id: string;
  name: string;
  nickname?: string;
  binBinti?: string;
  nik?: string; // Privacy-first 16-digit NIK (disembunyikan di publik)
  photo?: string; // Auto-compressed Base64 photo
  kinshipTitle?: string; // Aki, Nini, Uyut, Uwa, Mang, Bibi, dll.
  role: string;
  relation: 'ayah' | 'ibu' | 'anak' | 'kakek' | 'nenek' | 'buyut' | 'paman_bibi' | 'cucu' | 'pasangan' | 'saudara';
  trah: 'ayah' | 'ibu' | 'pasangan_ayah' | 'pasangan_ibu' | 'inti' | 'keduanya';
  gender: 'L' | 'P';
  birthYear: string;
  birthDate?: string;
  birthPlace?: string;
  deathYear?: string;
  status: 'Hidup' | 'Almarhum';
  origin?: string;
  phone?: string;
  notes?: string;
  address?: string;
  spouses?: FamilySpouse[];
  spouseIds?: string[];
  spouseOrder?: number;
  marriageNote?: string;
  motherId?: string;
  motherName?: string;
  memberNo?: string; // TA-01, TI-01, TK-01
  canvasX?: number;
  canvasY?: number;
  parentId?: string;
  spouseId?: string;
  siblingId?: string;
  batchDotId?: string;
  batchParentDotId?: string;
  batchLevel?: string | number;
  spouseRelation?: string;
  birthOrder?: number;
}

export interface KartuKeluarga {
  noKk: string;
  kepalaKeluarga: string;
  alamat: string;
  rtRw: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  kodePos: string;
  fotoKeluarga?: string; // Selfie / Foto bersama keluarga (Family portrait)
  updatedAt?: string;
}

interface CommentItem {
  id: string;
  author: string;
  text: string;
  time: string;
}

export type TrahPostType = 'ayah' | 'ibu' | 'pasangan_ayah' | 'pasangan_ibu';

interface PostItem {
  id: string;
  authorName: string;
  authorRole: string;
  trah: TrahPostType;
  trahName: string;
  timeAgo: string;
  content: string;
  category: 'Kisah Sejarah' | 'Foto Jadul' | 'Agenda Arisan' | 'Kabar Keluarga';
  avatarColor: string;
  initials: string;
  likes: number;
  isLiked?: boolean;
  comments: CommentItem[];
}

export interface ScannedKKCard {
  id: string;
  name: string;
  nickname: string;
  binBinti: string;
  nik?: string;
  role: string;
  gender: 'L' | 'P';
  birthDate: string;
  birthYear: string;
  birthPlace?: string;
  status?: 'Hidup' | 'Almarhum';
  address: string;
  photo?: string; // Selfie / Pas foto wajah
}

// Client-side HTML5 Canvas Auto-compression utility
const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = err => reject(err);
  });
};

const DEMO_MEMBERS: FamilyMember[] = [
  // Generasi 0: Diri Sendiri (Ego) & Istri
  {
    id: '1',
    name: 'Hendriana',
    nickname: 'Bageur',
    binBinti: 'bin Karta',
    kinshipTitle: 'Kepala Keluarga',
    role: 'Ayah / Kepala Keluarga',
    relation: 'ayah',
    trah: 'inti',
    gender: 'L',
    birthYear: '1985',
    birthDate: '15/06/1985',
    status: 'Hidup',
    origin: 'Kuningan / Bogor',
    address: 'Nanggerang Indah Residence Blok A No. 12',
    notes: 'Pemilik silsilah utama, tinggal di Nanggerang Indah Residence',
    spouses: [
      {
        id: 'sp_1',
        name: 'Siti Nurhaliza',
        nickname: 'Neng Siti',
        binBinti: 'binti Suryana',
        gender: 'P',
        origin: 'Bogor',
        birthYear: '1988',
        status: 'Hidup',
        marriageNote: 'Istri Pertama (Pernikahan 2011)',
        childrenIds: ['3', '4']
      }
    ]
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    nickname: 'Neng Siti',
    binBinti: 'binti Suryana',
    kinshipTitle: 'Ibu (Istri)',
    role: 'Ibu Rumah Tangga',
    relation: 'ibu',
    trah: 'inti',
    gender: 'P',
    birthYear: '1988',
    birthDate: '22/09/1988',
    status: 'Hidup',
    origin: 'Dramaga, Bogor',
    address: 'Nanggerang Indah Residence Blok A No. 12'
  },
  // Generasi -1: Anak-anak
  {
    id: '3',
    name: 'Rizky Al-Fathir',
    nickname: 'Iki',
    binBinti: 'bin Hendriana',
    kinshipTitle: 'Anak Pertama (Cikal)',
    role: 'Putra Sulung',
    relation: 'anak',
    trah: 'inti',
    gender: 'L',
    birthYear: '2012',
    birthDate: '10/03/2012',
    status: 'Hidup',
    origin: 'Bogor',
    address: 'Nanggerang Indah Residence Blok A No. 12'
  },
  {
    id: '4',
    name: 'Nabila Zahra',
    nickname: 'Bila',
    binBinti: 'binti Hendriana',
    kinshipTitle: 'Anak Kedua (Bungsu)',
    role: 'Putri Bungsu',
    relation: 'anak',
    trah: 'inti',
    gender: 'P',
    birthYear: '2016',
    birthDate: '18/07/2016',
    status: 'Hidup',
    origin: 'Bogor',
    address: 'Nanggerang Indah Residence Blok A No. 12'
  },
  // Generasi +1: Ayah Hendriana & Trah Kuningan
  {
    id: '5',
    name: 'Abah Karta',
    nickname: 'Aki Karta',
    binBinti: 'bin Abdul Ghani',
    kinshipTitle: 'Aki (Kakek Paternal)',
    role: 'Sesepuh Trah Kuningan',
    relation: 'kakek',
    trah: 'ayah',
    gender: 'L',
    birthYear: '1948',
    birthDate: '01/01/1948',
    status: 'Hidup',
    origin: 'Cilimus, Kuningan',
    address: 'Jl. Pasarean No. 4, Cilimus, Kuningan',
    notes: 'Pernah memiliki 2 jalur keluarga besar di Kuningan & Cirebon',
    spouses: [
      {
        id: 'sp_karta_1',
        name: 'Emak Rohanah',
        nickname: 'Nini Rohanah',
        binBinti: 'binti Mansur',
        gender: 'P',
        origin: 'Cilimus, Kuningan',
        birthYear: '1952',
        deathYear: '2019',
        status: 'Almarhum',
        marriageNote: 'Istri Pertama (Ibu Kandung Hendriana)',
        childrenIds: ['1', '7']
      },
      {
        id: 'sp_karta_2',
        name: 'Mak Eni',
        nickname: 'Nini Eni',
        binBinti: 'binti Sanusi',
        gender: 'P',
        origin: 'Cirebon',
        birthYear: '1958',
        status: 'Hidup',
        marriageNote: 'Istri Kedua (Jalur Saudara Tiri)',
        childrenIds: ['11']
      }
    ]
  },
  {
    id: '6',
    name: 'Emak Rohanah',
    nickname: 'Nini Rohanah',
    binBinti: 'binti Mansur',
    kinshipTitle: 'Nini (Nenek Paternal)',
    role: 'Ibu dari Hendriana',
    relation: 'nenek',
    trah: 'ayah',
    gender: 'P',
    birthYear: '1952',
    deathYear: '2019',
    status: 'Almarhum',
    origin: 'Cilimus, Kuningan',
    notes: 'Almarhumah wafat di Kuningan. Al-Fatihah.'
  },
  {
    id: '7',
    name: 'Mang Dede Supriatna',
    nickname: 'Mang Dede',
    binBinti: 'bin Karta',
    kinshipTitle: 'Mang (Paman / Adik Ayah)',
    role: 'Paman',
    relation: 'paman_bibi',
    trah: 'ayah',
    gender: 'L',
    birthYear: '1990',
    birthDate: '12/11/1990',
    status: 'Hidup',
    origin: 'Kuningan'
  },
  {
    id: '11',
    name: 'Asep Saepulloh',
    nickname: 'Kang Asep',
    binBinti: 'bin Karta',
    kinshipTitle: 'Uwa / Saudara Seayah (Jalur Mak Eni)',
    role: 'Kakak Tiri Seayah',
    relation: 'paman_bibi',
    trah: 'ayah',
    gender: 'L',
    birthYear: '1982',
    birthDate: '04/05/1982',
    status: 'Hidup',
    origin: 'Cirebon'
  },
  // Generasi +2: Buyut Trah Ayah (Leluhur Tertinggi)
  {
    id: '12',
    name: 'Kyai Abdul Ghani',
    nickname: 'Uyut Ghani',
    binBinti: 'bin Hasanudin',
    kinshipTitle: 'Uyut (Buyut Paternal)',
    role: 'Tokoh Pendiri Pesantren Lembur',
    relation: 'buyut',
    trah: 'ayah',
    gender: 'L',
    birthYear: '1918',
    deathYear: '1994',
    status: 'Almarhum',
    origin: 'Kuningan',
    notes: 'Makam di Kompleks Pasarean Cilimus'
  },
  // Generasi +1: Keluarga Ibu (Trah Bogor)
  {
    id: '8',
    name: 'Abah Suryana',
    nickname: 'Aki Surya',
    binBinti: 'bin Hasan',
    kinshipTitle: 'Aki (Kakek Maternal)',
    role: 'Ayah dari Siti Nurhaliza',
    relation: 'kakek',
    trah: 'ibu',
    gender: 'L',
    birthYear: '1945',
    deathYear: '2016',
    status: 'Almarhum',
    origin: 'Dramaga, Bogor',
    notes: 'Mantan perangkat desa Dramaga. Al-Fatihah.'
  },
  {
    id: '9',
    name: 'Emak Siti Maryam',
    nickname: 'Nini Siti',
    binBinti: 'binti Syamsuddin',
    kinshipTitle: 'Nini (Nenek Maternal)',
    role: 'Ibu dari Siti Nurhaliza',
    relation: 'nenek',
    trah: 'ibu',
    gender: 'P',
    birthYear: '1950',
    birthDate: '14/02/1950',
    status: 'Hidup',
    origin: 'Dramaga, Bogor',
    notes: 'Koordinator Arisan Trah Bogor'
  },
  {
    id: '10',
    name: 'Bibi Lilis Suryani',
    nickname: 'Bibi Lilis',
    binBinti: 'binti Suryana',
    kinshipTitle: 'Bibi (Adik Ibu)',
    role: 'Bibi',
    relation: 'paman_bibi',
    trah: 'ibu',
    gender: 'P',
    birthYear: '1986',
    birthDate: '08/08/1986',
    status: 'Hidup',
    origin: 'Bogor'
  },
  {
    id: '13',
    name: 'H. Hasan Sulaeman',
    nickname: 'Uyut Hasan',
    binBinti: 'bin Asyikin',
    kinshipTitle: 'Uyut (Buyut Maternal)',
    role: 'Leluhur Trah Dramaga',
    relation: 'buyut',
    trah: 'ibu',
    gender: 'L',
    birthYear: '1912',
    deathYear: '1988',
    status: 'Almarhum',
    origin: 'Dramaga, Bogor'
  }
];

const DEMO_POSTS: PostItem[] = [
  {
    id: 'post-1',
    authorName: 'Abah Karta',
    authorRole: 'Aki (Kakek Patrilineal)',
    trah: 'ayah',
    trahName: 'Trah Ayah (Kuningan)',
    category: 'Kisah Sejarah',
    timeAgo: '2 jam yang lalu',
    content: 'Alhamdulillah kumpul keluarga besar di lembur Cilimus berjalan lancar. Mengingatkan anak cucu, nasab kita dari Buyut Abdul Ghani selalu menjaga kerukunan dan silaturahmi. Sehat-sehat ya kabeh! 🙏',
    avatarColor: 'bg-blue-700',
    initials: 'AK',
    likes: 18,
    isLiked: false,
    comments: [
      { id: 'c1', author: 'Hendriana (Bageur)', text: 'Aamiin Abah, baktos ti rombongan siap sowan.', time: '1 jam lalu' },
      { id: 'c2', author: 'Mang Dede', text: 'Siap Abah, buku silsilah tos dicitak rapi.', time: '40 mnt lalu' }
    ]
  },
  {
    id: 'post-2',
    authorName: 'Mang Dede',
    authorRole: 'Mang (Paman)',
    trah: 'ayah',
    trahName: 'Trah Ayah (Kuningan)',
    category: 'Foto Jadul',
    timeAgo: 'Kemarin',
    content: 'Ditemukan arsip foto hitam putih tahun 1978 saat syukuran rumah panggung peninggalan Uyut Abdul Ghani. Yang mengenali orang-orang di baris belakang tolong bantu tag namanya ya.',
    avatarColor: 'bg-blue-600',
    initials: 'MD',
    likes: 24,
    isLiked: true,
    comments: []
  },
  {
    id: 'post-3',
    authorName: 'Emak Siti Maryam',
    authorRole: 'Nini (Nenek Maternal)',
    trah: 'ibu',
    trahName: 'Trah Ibu (Bogor)',
    category: 'Agenda Arisan',
    timeAgo: '3 jam yang lalu',
    content: 'Pemberitahuan Arisan Trah Bogor bulan depan bertempat di saung Dramaga. Sekalian kirim doa haul ke-10 Almarhum Abah Suryana. Ditunggu kehadirannya anak cucu sekalian.',
    avatarColor: 'bg-purple-700',
    initials: 'EM',
    likes: 31,
    isLiked: false,
    comments: [
      { id: 'c3', author: 'Bibi Lilis', text: 'InsyaAllah konsumsi & tumpeng disiapkan Mak.', time: '2 jam lalu' },
      { id: 'c4', author: 'Hendriana', text: 'Aamiin Mak, insyaAllah rombongan kami hadir lengkap.', time: '1 jam lalu' }
    ]
  },
  {
    id: 'post-4',
    authorName: 'Aki H. Kosasih',
    authorRole: 'Mertua Laki-Laki (Besan)',
    trah: 'pasangan_ayah',
    trahName: 'Trah Ayah Pasangan (Sumedang)',
    category: 'Kisah Sejarah',
    timeAgo: '4 jam yang lalu',
    content: 'Salam takzim keluarga besar Tanjungsari Sumedang. Alhamdulillah silsilah keluarga Bani Kosasih kini tersimpan rapi di LeluhurQu. Mari saling kirim doa untuk leluhur kita.',
    avatarColor: 'bg-emerald-700',
    initials: 'HK',
    likes: 19,
    isLiked: true,
    comments: [
      { id: 'c5', author: 'Siti Nurhaliza', text: 'Alhamdulillah Bapak, mugia barokah sadayana.', time: '2 jam lalu' }
    ]
  },
  {
    id: 'post-5',
    authorName: 'Umi Hj. Enok',
    authorRole: 'Mertua Perempuan (Besan)',
    trah: 'pasangan_ibu',
    trahName: 'Trah Ibu Pasangan (Bandung)',
    category: 'Kabar Keluarga',
    timeAgo: '1 hari yang lalu',
    content: 'Alhamdulillah silaturahmi rombongan Bandung ke Bogor berjalan lancar. Terimakasih sambutannya besan yang sangat hangat. Semoga silaturahmi 4 trah keluarga kita selalu berkah.',
    avatarColor: 'bg-rose-700',
    initials: 'HE',
    likes: 38,
    isLiked: false,
    comments: []
  }
];

// DATA AWAL BERSIH (MOCK DATA DIHAPUS)
const DEFAULT_MEMBERS: FamilyMember[] = [];
const DEFAULT_POSTS: PostItem[] = [];

// ==================== SUB-KOMPONEN 1: MODAL TAMBAH RELASI (+) ====================
interface QuickAddModalProps {
  target: FamilyMember;
  relationType: 'ayah' | 'ibu' | 'anak' | 'kakak' | 'adik' | 'pasangan';
  existingMembers?: FamilyMember[];
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    binBinti?: string;
    nickname?: string;
    gender: 'L' | 'P';
    birthYear: string;
    deathYear?: string;
    status: 'Hidup' | 'Almarhum';
    address?: string;
    phone?: string;
    photo?: string;
    // Multi-Istri (Poligini)
    spouseOrder?: number;
    marriageNote?: string;
    motherId?: string;
    motherName?: string;
  }) => void;
  showNotification: (msg: string) => void;
}

const QuickAddRelativeModalView: React.FC<QuickAddModalProps> = ({
  target,
  relationType,
  existingMembers = [],
  onClose,
  onSubmit,
  showNotification
}) => {
  const targetYear = parseInt(target.birthYear) || 1985;
  const initialYear =
    relationType === 'ayah' || relationType === 'ibu'
      ? `${targetYear - 25}`
      : relationType === 'anak'
      ? `${targetYear + 25}`
      : relationType === 'kakak'
      ? `${targetYear - 3}`
      : relationType === 'adik'
      ? `${targetYear + 3}`
      : `${targetYear}`;

  const defaultGender: 'L' | 'P' =
    relationType === 'ayah' ? 'L' : relationType === 'ibu' ? 'P' : relationType === 'pasangan' ? (target.gender === 'L' ? 'P' : 'L') : 'L';

  // Hitung jumlah istri yang sudah ada untuk target (Multi-Istri)
  const existingSpouseList = React.useMemo(() => {
    const list: Array<{ id: string; name: string; order: number }> = [];
    if (target.spouses && target.spouses.length > 0) {
      target.spouses.forEach((s, i) => list.push({ id: s.id, name: s.name, order: i + 1 }));
    } else if (target.spouseId) {
      const sp = existingMembers.find(m => m.id === target.spouseId);
      list.push({ id: target.spouseId, name: sp?.name || 'Istri Pertama', order: 1 });
    }
    // Cek juga anggota lain yang spouseId-nya menunjuk ke target
    existingMembers.forEach(m => {
      if (m.spouseId === target.id && !list.some(item => item.id === m.id)) {
        list.push({ id: m.id, name: m.name, order: list.length + 1 });
      }
    });
    return list;
  }, [target, existingMembers]);

  const nextSpouseOrder = existingSpouseList.length + 1;
  const isMultiWifeMode = relationType === 'pasangan' && target.gender === 'L' && existingSpouseList.length >= 1;

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [binBinti, setBinBinti] = useState(
    relationType === 'anak'
      ? target.gender === 'L' ? `bin ${target.name}` : `binti ${target.name}`
      : ''
  );
  const [gender, setGender] = useState<'L' | 'P'>(defaultGender);
  const [birthYear, setBirthYear] = useState(initialYear);
  const [status, setStatus] = useState<'Hidup' | 'Almarhum'>('Hidup');
  const [deathYear, setDeathYear] = useState('');
  const [address, setAddress] = useState(target.address || target.origin || '');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  // State Multi-Istri
  const [spouseOrder, setSpouseOrder] = useState<number>(nextSpouseOrder);
  const [marriageNote, setMarriageNote] = useState<string>(
    isMultiWifeMode ? `Istri Ke-${nextSpouseOrder} (Poligini)` : 'Istri Pertama'
  );
  const [selectedMotherId, setSelectedMotherId] = useState<string>(
    existingSpouseList.length > 0 ? existingSpouseList[0].id : ''
  );

  const relationTitles = {
    ayah: { title: 'Tambah Ayah', color: 'bg-blue-600', badge: 'Trah Ayah' },
    ibu: { title: 'Tambah Ibu', color: 'bg-pink-600', badge: 'Trah Ibu' },
    pasangan: {
      title: isMultiWifeMode ? `Tambah Istri ke-${nextSpouseOrder} (Multi-Istri)` : 'Tambah Pasangan (Suami/Istri)',
      color: 'bg-amber-600',
      badge: isMultiWifeMode ? 'Poligini / Istri Tambahan' : 'Pasangan'
    },
    anak: { title: 'Tambah Anak', color: 'bg-emerald-600', badge: 'Penerus Nasab' },
    kakak: { title: 'Tambah Kakak', color: 'bg-teal-600', badge: 'Saudara Kandung' },
    adik: { title: 'Tambah Adik', color: 'bg-sky-600', badge: 'Saudara Kandung' }
  }[relationType];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotification('Mengompres pas foto wajah...');
      const compressed = await compressImage(file, 280, 0.82);
      setPhoto(compressed);
      showNotification('Pas foto berhasil dikompres!');
    } catch {
      showNotification('Gagal mengompres foto.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification('Silakan isi nama lengkap.');
      return;
    }

    const chosenMother = existingSpouseList.find(s => s.id === selectedMotherId);

    onSubmit({
      name: name.trim(),
      binBinti: binBinti.trim() || undefined,
      nickname: nickname.trim() || undefined,
      gender,
      birthYear: birthYear.trim() || '2000',
      deathYear: status === 'Almarhum' ? deathYear.trim() : undefined,
      status,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      photo,
      spouseOrder: relationType === 'pasangan' ? spouseOrder : undefined,
      marriageNote: relationType === 'pasangan' ? marriageNote : undefined,
      motherId: relationType === 'anak' && chosenMother ? chosenMother.id : undefined,
      motherName: relationType === 'anak' && chosenMother ? `Anak dari Istri ke-${chosenMother.order} (${chosenMother.name})` : undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative border border-emerald-100 text-slate-800 max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className={`w-9 h-9 ${relationTitles.color} text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}>
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">{relationTitles.title}</h3>
            <p className="text-[10px] text-slate-500 font-medium">
              Relasi untuk: <strong className="text-emerald-700">{target.name}</strong> ({target.kinshipTitle || target.role})
            </p>
          </div>
        </div>

        {/* Pas Foto Langsung / Galeri Section */}
        <div className="bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 flex items-center justify-center font-bold text-white text-sm ${photo ? '' : (gender === 'L' ? 'bg-blue-600' : 'bg-pink-600')}`}>
              {photo ? (
                <img src={photo} alt="Preview Foto" className="w-full h-full object-cover" />
              ) : (
                name ? name.slice(0, 2).toUpperCase() : '?'
              )}
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-800 block">Pas Foto Wajah</span>
              <span className="text-[9px] text-emerald-700 font-medium block">Auto-Kompres Kualitas Tajam</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shadow-xs transition active:scale-95">
              <Camera className="w-3 h-3" />
              <span>Kamera</span>
              <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} className="hidden" />
            </label>
            <label className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition active:scale-95">
              <ImageIcon className="w-3 h-3 text-emerald-700" />
              <span>Galeri</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Siti Aisyah"
              className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                Bin / Binti
              </label>
              <input
                type="text"
                value={binBinti}
                onChange={e => setBinBinti(e.target.value)}
                placeholder="Nama ayah kandung"
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                Panggilan Akrab
              </label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="Contoh: Neng Icha"
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                Th. Lahir
              </label>
              <input
                type="number"
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
              >
                <option value="Hidup">Hidup</option>
                <option value="Almarhum">Almarhum</option>
              </select>
            </div>
          </div>

          {status === 'Almarhum' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                Tahun Wafat (Almarhum)
              </label>
              <input
                type="number"
                value={deathYear}
                onChange={e => setDeathYear(e.target.value)}
                placeholder="Contoh: 2019"
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                Alamat / Asal
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Contoh: Bogor / Kuningan"
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                No. HP (WhatsApp)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>
          </div>

          {/* SEKSI KHUSUS POLIGINI / MULTI-ISTRI */}
          {relationType === 'pasangan' && target.gender === 'L' && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300 space-y-2">
              <div className="flex items-center justify-between text-amber-900 font-bold text-[11px]">
                <span className="flex items-center gap-1">
                  <span>💍</span>
                  <span>Pengaturan Urutan Istri (Poligini)</span>
                </span>
                <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                  {existingSpouseList.length} Istri Tercatat
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-600 font-bold mb-1">
                    Urutan Istri:
                  </label>
                  <select
                    value={spouseOrder}
                    onChange={e => {
                      const ord = parseInt(e.target.value) || 1;
                      setSpouseOrder(ord);
                      setMarriageNote(`Istri Ke-${ord}${ord > 1 ? ' (Poligini)' : ''}`);
                    }}
                    className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs text-slate-900 font-bold"
                  >
                    <option value={1}>Istri Ke-1</option>
                    <option value={2}>Istri Ke-2 (Poligini)</option>
                    <option value={3}>Istri Ke-3 (Poligini)</option>
                    <option value={4}>Istri Ke-4 (Poligini)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 font-bold mb-1">
                    Label / Catatan:
                  </label>
                  <input
                    type="text"
                    value={marriageNote}
                    onChange={e => setMarriageNote(e.target.value)}
                    placeholder="Contoh: Istri Kedua (Nikah 1990)"
                    className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SEKSI PILIH IBU KANDUNG SAAT TAMBAH ANAK DARI AYAH MULTI-ISTRI */}
          {relationType === 'anak' && target.gender === 'L' && existingSpouseList.length > 0 && (
            <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-300 space-y-1.5">
              <label className="block text-[11px] text-rose-900 font-bold">
                🌸 Pilih Ibu Kandung (Istri ke-berapa):
              </label>
              <select
                value={selectedMotherId}
                onChange={e => setSelectedMotherId(e.target.value)}
                className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs text-slate-900 font-bold"
              >
                {existingSpouseList.map(s => (
                  <option key={s.id} value={s.id}>
                    Istri ke-{s.order}: {s.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-rose-700">
                Garis keturunan anak akan ditautkan secara akurat ke ibu kandung ini.
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="submit"
            className={`flex-1 ${relationTitles.color} hover:opacity-90 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition active:scale-98`}
          >
            Simpan Anggota Baru
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

// ==================== SUB-KOMPONEN 2: MODAL EDIT DATA ANGGOTA ====================
interface EditMemberModalProps {
  member: FamilyMember;
  onClose: () => void;
  onSave: (updated: FamilyMember) => void;
  showNotification: (msg: string) => void;
}

const EditMemberModalView: React.FC<EditMemberModalProps> = ({
  member,
  onClose,
  onSave,
  showNotification
}) => {
  const [name, setName] = useState(member.name);
  const [nickname, setNickname] = useState(member.nickname || '');
  const [binBinti, setBinBinti] = useState(member.binBinti || '');
  const [kinshipTitle, setKinshipTitle] = useState(member.kinshipTitle || member.role || '');
  const [role, setRole] = useState(member.role || '');
  const [relation, setRelation] = useState<FamilyMember['relation']>(member.relation || 'anak');
  const [memberNo, setMemberNo] = useState(member.memberNo || '');
  const [birthOrder, setBirthOrder] = useState<number | ''>(
    member.birthOrder !== undefined
      ? member.birthOrder
      : member.role?.match(/Anak ke-(\d+)/i)
      ? parseInt(member.role.match(/Anak ke-(\d+)/i)![1])
      : member.kinshipTitle?.match(/Anak ke-(\d+)/i)
      ? parseInt(member.kinshipTitle.match(/Anak ke-(\d+)/i)![1])
      : ''
  );
  const [trah, setTrah] = useState<FamilyMember['trah']>(member.trah);
  const [gender, setGender] = useState<'L' | 'P'>(member.gender);
  const [birthYear, setBirthYear] = useState(member.birthYear || '1990');
  const [status, setStatus] = useState<'Hidup' | 'Almarhum'>(member.status);
  const [deathYear, setDeathYear] = useState(member.deathYear || '');
  const [address, setAddress] = useState(member.address || member.origin || '');
  const [phone, setPhone] = useState(member.phone || '');
  const [notes, setNotes] = useState(member.notes || '');
  const [photo, setPhoto] = useState<string | undefined>(member.photo);

  // State Multi-Istri (Poligini)
  const [spouses, setSpouses] = useState<FamilySpouse[]>(member.spouses || []);
  const [showAddSpouseForm, setShowAddSpouseForm] = useState(false);
  const [newSpouseName, setNewSpouseName] = useState('');
  const [newSpouseBin, setNewSpouseBin] = useState('');
  const [newSpouseNote, setNewSpouseNote] = useState('');
  const [newSpouseStatus, setNewSpouseStatus] = useState<'Hidup' | 'Almarhum'>('Hidup');
  const [newSpouseBirthYear, setNewSpouseBirthYear] = useState('1990');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotification('Mengompres pas foto...');
      const compressed = await compressImage(file, 280, 0.82);
      setPhoto(compressed);
      showNotification('Pas foto berhasil diperbarui & dikompres!');
    } catch {
      showNotification('Gagal mengompres foto.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotification('Nama tidak boleh kosong.');
      return;
    }

    let finalKinship = kinshipTitle.trim();
    let finalRole = role.trim() || finalKinship;
    let finalRelation = relation;

    if (birthOrder !== '' && !isNaN(Number(birthOrder))) {
      finalKinship = `Anak ke-${birthOrder}`;
      finalRole = `Anak ke-${birthOrder}`;
      finalRelation = 'anak';
    }

    onSave({
      ...member,
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      binBinti: binBinti.trim() || undefined,
      kinshipTitle: finalKinship || undefined,
      role: finalRole,
      relation: finalRelation,
      memberNo: memberNo.trim() || undefined,
      birthOrder: birthOrder !== '' ? Number(birthOrder) : undefined,
      trah,
      gender,
      birthYear: birthYear.trim() || '1990',
      status,
      deathYear: status === 'Almarhum' ? (deathYear.trim() || undefined) : undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      photo,
      spouses
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative border border-emerald-100 text-slate-800 max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-8 h-8 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-bold">
            <Edit2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Edit Data Silsilah</h3>
            <p className="text-[10px] text-emerald-700 font-bold font-mono">No. Anggota: {member.memberNo || 'Otomatis'}</p>
          </div>
        </div>

        {/* Pas Foto Upload */}
        <div className="bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 flex items-center justify-center font-bold text-white text-sm ${photo ? '' : (gender === 'L' ? 'bg-blue-600' : 'bg-pink-600')}`}>
              {photo ? (
                <img src={photo} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                name ? name.slice(0, 2).toUpperCase() : '?'
              )}
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-800 block">Pas Foto</span>
              <span className="text-[9px] text-emerald-700 font-medium block">Auto-Kompres</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shadow-xs transition">
              <Camera className="w-3 h-3" />
              <span>Kamera</span>
              <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} className="hidden" />
            </label>
            <label className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition">
              <ImageIcon className="w-3 h-3 text-emerald-700" />
              <span>Galeri</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Bin / Binti</label>
              <input
                type="text"
                value={binBinti}
                onChange={e => setBinBinti(e.target.value)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Panggilan Akrab</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* KOREKSI PERAN & NOMOR URUT SILSILAH (ANAK / AYAH / KAKEK) */}
          <div className="bg-amber-50/80 border-2 border-amber-300 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-amber-950 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-700" />
                <span>Koreksi Peran &amp; Urutan Silsilah</span>
              </span>
              <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">Solusi Salah Urutan</span>
            </div>

            {/* Pilihan Peran Cepat (Kakek/Nenek/Ayah/Ibu/Anak) */}
            <div>
              <label className="block text-[9.5px] text-amber-900 font-bold mb-1">Peran dalam Garis Keturunan:</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { label: 'Aki (Kakek)', rel: 'kakek', title: 'Aki (Kakek)' },
                  { label: 'Nini (Nenek)', rel: 'nenek', title: 'Nini (Nenek)' },
                  { label: 'Ayah', rel: 'ayah', title: 'Ayah' },
                  { label: 'Ibu', rel: 'ibu', title: 'Ibu' },
                  { label: 'Anak', rel: 'anak', title: birthOrder ? `Anak ke-${birthOrder}` : 'Anak' },
                  { label: 'Saudara', rel: 'saudara', title: gender === 'L' ? 'Kakak (Aa)' : 'Teteh' }
                ].map(opt => (
                  <button
                    key={opt.rel}
                    type="button"
                    onClick={() => {
                      setRelation(opt.rel as any);
                      setKinshipTitle(opt.title);
                      setRole(opt.title);
                      if (opt.rel !== 'anak') setBirthOrder('');
                    }}
                    className={`py-1 px-1 rounded-lg text-[9.5px] font-bold border transition ${
                      relation === opt.rel
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nomor Urut Kelahiran Anak & Kode Silsilah */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/80">
              <div>
                <label className="block text-[9.5px] text-amber-900 font-bold mb-1">Nomor Urut Anak:</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={birthOrder}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value);
                    setBirthOrder(val);
                    if (val !== '') {
                      setKinshipTitle(`Anak ke-${val}`);
                      setRole(`Anak ke-${val}`);
                      setRelation('anak');
                    }
                  }}
                  placeholder="Contoh: 1, 2, 3..."
                  className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs text-slate-900 font-bold font-mono focus:outline-none focus:border-amber-600"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setBirthOrder(num);
                        setKinshipTitle(`Anak ke-${num}`);
                        setRole(`Anak ke-${num}`);
                        setRelation('anak');
                      }}
                      className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${
                        birthOrder === num
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      Ke-{num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] text-amber-900 font-bold mb-1">Kode Nomor Anggota:</label>
                <input
                  type="text"
                  value={memberNo}
                  onChange={e => setMemberNo(e.target.value)}
                  placeholder="TA-01 / 1.1 / Custom"
                  className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs text-slate-900 font-bold font-mono focus:outline-none focus:border-amber-600"
                />
                <p className="text-[8px] text-amber-800 mt-1 leading-tight">
                  Ubah manual jika kode urutan salah.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Jalur Trah</label>
              <select
                value={trah}
                onChange={e => setTrah(e.target.value as any)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
              >
                <option value="ayah">Trah Ayah (Kuningan)</option>
                <option value="ibu">Trah Ibu (Bogor)</option>
                <option value="inti">Keluarga Inti</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Panggilan / Kekerabatan</label>
              <input
                type="text"
                value={kinshipTitle}
                onChange={e => setKinshipTitle(e.target.value)}
                placeholder="Aki / Nini / Ayah / Ibu..."
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Th. Lahir</label>
              <input
                type="number"
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 font-mono font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none"
              >
                <option value="Hidup">Hidup</option>
                <option value="Almarhum">Almarhum</option>
              </select>
            </div>
          </div>

          {status === 'Almarhum' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tahun Wafat</label>
              <input
                type="number"
                value={deathYear}
                onChange={e => setDeathYear(e.target.value)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 font-mono focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Alamat</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">No. HP (WA)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Catatan</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan silsilah / sejarah singkat"
              className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none"
            />
          </div>

          {/* SEKSI SOLUSI MULTI-ISTRI (POLIGINI) */}
          {gender === 'L' && (
            <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1.5">
                  <span>💍</span>
                  <span>Daftar Istri / Pasangan ({spouses.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddSpouseForm(!showAddSpouseForm)}
                  className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Tambah Istri (Poligini)</span>
                </button>
              </div>

              {spouses.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic">Belum ada data istri tercatat.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {spouses.map((sp, idx) => (
                    <div key={sp.id || idx} className="p-2 bg-white rounded-lg border border-amber-200 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-mono px-1.5 py-0.2 rounded font-extrabold">
                            Istri ke-{idx + 1}
                          </span>
                          <span>{sp.name}</span>
                          {sp.status === 'Almarhum' && (
                            <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded">Alm</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {sp.marriageNote || `Pernikahan ke-${idx + 1}`}
                          {sp.childrenIds && sp.childrenIds.length > 0 && ` • ${sp.childrenIds.length} Anak`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSpouses(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                        title="Hapus Istri"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Tambah Istri Baru */}
              {showAddSpouseForm && (
                <div className="p-2.5 bg-white rounded-xl border border-amber-300 space-y-2 mt-2 animate-in fade-in">
                  <span className="font-bold text-amber-900 text-[10px] block">
                    Form Tambah Istri ke-{spouses.length + 1}
                  </span>
                  <input
                    type="text"
                    placeholder="Nama Lengkap Istri *"
                    value={newSpouseName}
                    onChange={e => setNewSpouseName(e.target.value)}
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-lg p-1.5 text-xs text-slate-900 font-bold"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Bin / Binti (Nama Ayah)"
                      value={newSpouseBin}
                      onChange={e => setNewSpouseBin(e.target.value)}
                      className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-lg p-1.5 text-[11px]"
                    />
                    <select
                      value={newSpouseStatus}
                      onChange={e => setNewSpouseStatus(e.target.value as any)}
                      className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-lg p-1.5 text-[11px] font-bold"
                    >
                      <option value="Hidup">Hidup</option>
                      <option value="Almarhum">Almarhum</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Catatan Pernikahan (e.g. Istri Kedua, Nikah 1995 di Kuningan)"
                    value={newSpouseNote}
                    onChange={e => setNewSpouseNote(e.target.value)}
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-lg p-1.5 text-[11px]"
                  />
                  <div className="flex gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newSpouseName.trim()) {
                          showNotification('Nama istri wajib diisi');
                          return;
                        }
                        const newSp: FamilySpouse = {
                          id: `sp_${Date.now()}`,
                          name: newSpouseName.trim(),
                          binBinti: newSpouseBin.trim() || undefined,
                          gender: 'P',
                          birthYear: newSpouseBirthYear,
                          status: newSpouseStatus,
                          marriageNote: newSpouseNote.trim() || `Istri Ke-${spouses.length + 1}`,
                          childrenIds: []
                        };
                        setSpouses(prev => [...prev, newSp]);
                        setNewSpouseName('');
                        setNewSpouseBin('');
                        setNewSpouseNote('');
                        setShowAddSpouseForm(false);
                        showNotification(`Istri ke-${spouses.length + 1} (${newSp.name}) berhasil ditambahkan!`);
                      }}
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] py-1.5 rounded-lg"
                    >
                      Simpan Istri
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSpouseForm(false)}
                      className="px-2.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-lg"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            type="submit"
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition active:scale-98"
          >
            Simpan Perubahan
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

// ==================== SUB-KOMPONEN 3: MODAL DOWNLOAD UPSCALE (A4 - A0) ====================
interface UpscaleExportModalProps {
  paperSize: 'A4' | 'A3' | 'A2' | 'A1' | 'A0';
  setPaperSize: (s: 'A4' | 'A3' | 'A2' | 'A1' | 'A0') => void;
  isExporting: boolean;
  onClose: () => void;
  onDownloadSvg: (s: 'A4' | 'A3' | 'A2' | 'A1' | 'A0') => void;
  onDownloadPng: (s: 'A4' | 'A3' | 'A2' | 'A1' | 'A0') => void;
  trahFilter: 'all' | 'ayah' | 'ibu' | 'pasangan_ayah' | 'pasangan_ibu';
  membersCount: number;
  showNotification: (msg: string) => void;
}

const UpscaleExportModalView: React.FC<UpscaleExportModalProps> = ({
  paperSize,
  setPaperSize,
  isExporting,
  onClose,
  onDownloadSvg,
  onDownloadPng,
  trahFilter,
  membersCount,
  showNotification
}) => {
  const paperDetails = {
    A4: { size: '210 x 297 mm', title: 'Ukuran A4', desc: 'Ukuran dokumen cetak standar lembar kerja / buku' },
    A3: { size: '297 x 420 mm', title: 'Ukuran A3', desc: 'Poster sedang, cocok untuk pigura dinding ruang keluarga' },
    A2: { size: '420 x 594 mm', title: 'Ukuran A2', desc: 'Bagan besar sangat lega untuk generasi lengkap' },
    A1: { size: '594 x 841 mm', title: 'Ukuran A1', desc: 'Silsilah akbar pertemuan keluarga besar (trah)' },
    A0: { size: '841 x 1189 mm', title: 'Ukuran A0', desc: 'Master Wall Chart (Resolusi Maksimal Tanpa Batas / Super Tajam)' }
  }[paperSize];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3.5 shadow-2xl relative border border-emerald-100 text-slate-800 max-h-[92vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 pb-2 border-b border-emerald-100">
          <div className="w-9 h-9 bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-xs">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Unduh Bagan Silsilah Upscale (A4 - A0)</h3>
            <p className="text-[10px] text-emerald-700 font-bold">Vektor Tajam 300 DPI • Tidak Pecah Saat Dicetak</p>
          </div>
        </div>

        {/* Paper Size Selector Buttons */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            PILIH UKURAN KERTAS CETAK:
          </span>
          <div className="grid grid-cols-5 gap-1">
            {(['A4', 'A3', 'A2', 'A1', 'A0'] as const).map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setPaperSize(size)}
                className={`py-2 rounded-xl font-mono font-extrabold text-xs transition border text-center ${
                  paperSize === size
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                    : 'bg-emerald-50 text-slate-700 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Paper Detail Card */}
        <div className="bg-[#f0fdf4] border-2 border-emerald-200 rounded-xl p-3 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-950">{paperDetails.title} ({paperDetails.size})</span>
            <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-black">
              300 DPI
            </span>
          </div>
          <p className="text-[11px] text-slate-600">{paperDetails.desc}</p>
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-emerald-100 mt-1">
            <span>Silsilah Aktif: <strong>{trahFilter === 'ayah' ? 'Trah Ayah' : trahFilter === 'ibu' ? 'Trah Ibu' : trahFilter === 'pasangan_ayah' ? 'Trah Ayah Pasangan' : trahFilter === 'pasangan_ibu' ? 'Trah Ibu Pasangan' : 'Semua Trah'}</strong></span>
            <span>Total: <strong>{membersCount} Kartu</strong></span>
          </div>
        </div>

        {/* Format Options & Download Actions */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            PILIH FORMAT UNDUH:
          </span>

          {/* Option 1: Vektor Asli SVG (100% Tajam Tanpa Pecah) */}
          <button
            type="button"
            disabled={isExporting}
            onClick={() => onDownloadSvg(paperSize)}
            className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white p-3 rounded-xl font-bold text-xs flex items-center justify-between shadow transition"
          >
            <div className="flex items-center gap-2 text-left">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <div>
                <span className="block font-bold">1. Unduh Format Vektor SVG (Rekomendasi Print)</span>
                <span className="text-[10px] text-emerald-200 block font-normal">100% Tajam tanpa batas skala, siap cetak offset/digital print shop</span>
              </div>
            </div>
            <Download className="w-4 h-4 shrink-0 text-white" />
          </button>

          {/* Option 2: Gambar PNG HD (300 DPI) */}
          <button
            type="button"
            disabled={isExporting}
            onClick={() => onDownloadPng(paperSize)}
            className="w-full bg-white hover:bg-emerald-50 active:scale-98 text-emerald-900 border-2 border-emerald-600 p-3 rounded-xl font-bold text-xs flex items-center justify-between shadow-xs transition"
          >
            <div className="flex items-center gap-2 text-left">
              <Download className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="block font-bold">2. Unduh Gambar PNG HD (300 DPI)</span>
                <span className="text-[10px] text-slate-500 block font-normal">Format gambar resolusi tinggi untuk galeri HP &amp; share WhatsApp</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-bold">PNG</span>
          </button>

          {/* Option 3: Cetak PDF */}
          <button
            type="button"
            onClick={() => {
              window.print?.();
              MonetizationService.recordTransaction(`silsilah_print_${Date.now()}`, 10000, 'silsilah');
              showNotification(`Membuka dialog cetak format Kertas ${paperSize}...`);
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>3. Cetak Langsung / Simpan PDF (Dialog Printer)</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export const LeluhurQuView: React.FC<LeluhurQuViewProps> = ({
  onBackToWarga,
  showNotification,
  currentUser = null,
  onOpenSecurityModal,
}) => {
  // Navigation Tabs: SilsilahQu (Koma & Excel) | Medsos Trah | Doa Malam Jumat | Arsip & Ekspor
  const [activeTab, setActiveTab] = useState<'isicepat' | 'medsos' | 'doa' | 'arsip'>('isicepat');
  const [activeMedsosTrah, setActiveMedsosTrah] = useState<TrahPostType>('ayah');
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(false);
  const [silsilahViewMode, setSilsilahViewMode] = useState<'editor' | 'preview_tree'>('editor');

  // Auto-connect Akun Pasangan: Jika aktif, otomatis memperluas struktur menjadi 4 Trah
  const [isSpouseConnected, setIsSpouseConnected] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wargaqu_leluhur_spouse_connected_v2');
      if (saved !== null) return saved === 'true';
      return true; // Default aktif (Auto-Connect Pasangan -> 4 Trah)
    } catch {
      return true;
    }
  });

  const [spouseInfo, setSpouseInfo] = useState<{
    name: string;
    phone: string;
    trahAyahName: string;
    trahIbuName: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('wargaqu_leluhur_spouse_info_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Siti Nurhaliza',
      phone: '0812-3456-7890',
      trahAyahName: 'Trah Sumedang',
      trahIbuName: 'Trah Bandung'
    };
  });

  const [showSpouseModal, setShowSpouseModal] = useState(false);
  const [inviteTrahTarget, setInviteTrahTarget] = useState<TrahPostType>('ayah');

  // Silsilah Data (Offline-first LocalStorage - BERSIH DARI MOCK DATA)
  const [members, setMembers] = useState<FamilyMember[]>(() => {
    try {
      const isCleared = localStorage.getItem('wargaqu_leluhur_cleared_mock_v4');
      if (isCleared === 'true') {
        const saved = localStorage.getItem('wargaqu_leluhur_members_v4');
        return saved ? JSON.parse(saved) : [];
      }
      const savedV4 = localStorage.getItem('wargaqu_leluhur_members_v4');
      if (savedV4) {
        return JSON.parse(savedV4);
      }
      // Bersihkan data mock lama
      localStorage.removeItem('wargaqu_leluhur_members_v3');
      localStorage.removeItem('wargaqu_leluhur_posts_v3');
      localStorage.setItem('wargaqu_leluhur_cleared_mock_v4', 'true');
      return [];
    } catch {
      return [];
    }
  });

  // Medsos Posts Data (Tersedia untuk masing-masing Trah secara mandiri)
  const [posts, setPosts] = useState<PostItem[]>(() => {
    try {
      const saved = localStorage.getItem('wargaqu_leluhur_posts_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEMO_POSTS;
    } catch {
      return DEMO_POSTS;
    }
  });

  // Data Struktur Kartu Keluarga (KK)
  const [kkData, setKkData] = useState<KartuKeluarga>(() => {
    try {
      const savedKk = localStorage.getItem('wargaqu_leluhur_kk_v4');
      return savedKk ? JSON.parse(savedKk) : {
        noKk: '',
        kepalaKeluarga: '',
        alamat: '',
        rtRw: '',
        desaKelurahan: '',
        kecamatan: '',
        kabupatenKota: '',
        kodePos: '',
        fotoKeluarga: undefined
      };
    } catch {
      return {
        noKk: '',
        kepalaKeluarga: '',
        alamat: '',
        rtRw: '',
        desaKelurahan: '',
        kecamatan: '',
        kabupatenKota: '',
        kodePos: ''
      };
    }
  });

  // Tree View Filter & Interactive Controls (Fokus: Semua 4 Trah, Trah Ayah, Trah Ibu, Trah Ayah Pasangan, Trah Ibu Pasangan)
  const [treeFilter, setTreeFilter] = useState<'all' | 'ayah' | 'ibu' | 'pasangan_ayah' | 'pasangan_ibu'>('all');
  const [treeZoom, setTreeZoom] = useState<number>(1);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [canvasLayoutMode, setCanvasLayoutMode] = useState<'modular' | 'grid'>('modular');
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
  const [relationChooserMember, setRelationChooserMember] = useState<FamilyMember | null>(null);

  // Touch Pinch-to-zoom (2 Jari) References
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);

  // Listen for Escape key to exit fullscreen canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCanvasFullscreen) {
        setIsCanvasFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCanvasFullscreen]);

  // Quick Add Relative Modal (+) Ayah / Ibu / Pasangan / Anak / Kakak / Adik
  const [quickAddModal, setQuickAddModal] = useState<{
    open: boolean;
    targetMember: FamilyMember | null;
    relationType: 'ayah' | 'ibu' | 'anak' | 'kakak' | 'adik' | 'pasangan';
  }>({
    open: false,
    targetMember: null,
    relationType: 'anak'
  });

  // Edit Member Modal
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Upscale Download Modal (A4 - A0)
  const [showUpscaleModal, setShowUpscaleModal] = useState(false);
  const [upscaleExportSize, setUpscaleExportSize] = useState<'A4' | 'A3' | 'A2' | 'A1' | 'A0'>('A4');
  const [exportFormat, setExportFormat] = useState<'svg' | 'png'>('svg');
  const [isExporting, setIsExporting] = useState(false);

  // Dragging Canvas Card State
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; cardX: number; cardY: number } | null>(null);

  // Modals
  const [showScanKKModal, setShowScanKKModal] = useState(false);
  const [kkModalTab, setKkModalTab] = useState<'manual' | 'scan'>('manual');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showNikMap, setShowNikMap] = useState<{ [cardId: string]: boolean }>({});
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    incomingMembers: FamilyMember[];
    incomingPosts?: any[];
    newCount: number;
    updateCount: number;
    duplicateNames: string[];
    fileName: string;
  } | null>(null);

  // Cloud Realtime State
  const [cloudTreeId, setCloudTreeId] = useState<string>(() => RealtimeSyncService.getFamilyTreeId());
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [showCloudModal, setShowCloudModal] = useState<boolean>(false);
  const [inputCloudId, setInputCloudId] = useState<string>('');
  const isRemoteUpdateRef = useRef(false);

  // Deteksi tautan undangan cloud tree dari URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash;
      const matchTree = h.match(/cloudTree=([a-zA-Z0-9_\-]+)/i);
      if (matchTree && matchTree[1]) {
        const id = matchTree[1];
        setCloudTreeId(id);
        RealtimeSyncService.setFamilyTreeId(id);
        showNotification(`Terhubung ke Ruang Silsilah Cloud: ${id}`);
      }
    }
  }, []);

  // Berlangganan (Subscribe) perubahan realtime dari Cloud
  useEffect(() => {
    const unsub = RealtimeSyncService.subscribeFamilyTree(
      cloudTreeId,
      (cloudData) => {
        if (!cloudData) return;
        if (Array.isArray(cloudData.members) && cloudData.members.length > 0) {
          isRemoteUpdateRef.current = true;
          setMembers(cloudData.members);
          if (Array.isArray(cloudData.posts)) {
            setPosts(cloudData.posts);
          }
          setCloudSyncStatus('connected');
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 400);
        }
      },
      () => {
        setCloudSyncStatus('offline');
      }
    );

    return () => unsub();
  }, [cloudTreeId]);

  // Push otomatis ke Cloud ketika silsilah diedit lokal
  useEffect(() => {
    if (isRemoteUpdateRef.current) return;
    if (members.length === 0) return;

    const timer = setTimeout(() => {
      setIsCloudSyncing(true);
      setCloudSyncStatus('syncing');
      RealtimeSyncService.pushFamilyTreeToCloud(
        cloudTreeId,
        'Silsilah Keluarga Besar',
        currentUser?.name || 'Keluarga',
        members,
        posts,
        currentUser?.name || 'Anda'
      )
        .then(() => {
          setIsCloudSyncing(false);
          setCloudSyncStatus('connected');
        })
        .catch(() => {
          setIsCloudSyncing(false);
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [members, posts, cloudTreeId, currentUser]);

  // Form KK Header state
  const [formNoKk, setFormNoKk] = useState('');
  const [formAlamatKk, setFormAlamatKk] = useState('');
  const [formRtRw, setFormRtRw] = useState('');
  const [formKota, setFormKota] = useState('');
  const [formFotoKeluarga, setFormFotoKeluarga] = useState<string | null>(null);

  // ==================== FITUR 1: FOTO & SCAN KK AUTO-TEXT + AUTO-KOMPRES + MINI STRUKTUR ====================
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<boolean>(false);
  const [kkRawPhoto, setKkRawPhoto] = useState<string | null>(null);
  const [autoReplaceExisting, setAutoReplaceExisting] = useState<boolean>(true);
  const [activeKkPreset, setActiveKkPreset] = useState<'hendriana' | 'ahmad_fauzi' | 'bambang_sutrisno'>('hendriana');

  // Kartu Anggota Terdeteksi dari KK yang dapat diedit / digeser / ditukar / ditambah / dihapus
  const [scannedCards, setScannedCards] = useState<ScannedKKCard[]>([]);

  // ==================== FITUR 2: BUKU SILSILAH 2 MODEL, GESER GARIS TERHUBUNG & KERTAS A4 - A0 ====================
  const [bukuTreeModel, setBukuTreeModel] = useState<'foto_sendiri' | 'keluarga_kompak'>('foto_sendiri');
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'A2' | 'A1' | 'A0'>('A4');
  const [bukuUpscaleScale, setBukuUpscaleScale] = useState<number>(1);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Doa Malam Jumat State
  const [hadhorohCopied, setHadhorohCopied] = useState(false);

  // New Post Form State
  const [newPostText, setNewPostText] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'Kisah Sejarah' | 'Foto Jadul' | 'Agenda Arisan' | 'Kabar Keluarga'>('Kisah Sejarah');
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});
  const [openCommentBox, setOpenCommentBox] = useState<{ [postId: string]: boolean }>({});

  // Add Member Form State
  const [formName, setFormName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formBinBinti, setFormBinBinti] = useState('');
  const [formKinship, setFormKinship] = useState('Anak');
  const [formRole, setFormRole] = useState('');
  const [formRelation, setFormRelation] = useState<'anak' | 'paman_bibi' | 'kakek' | 'nenek' | 'buyut' | 'cucu'>('anak');
  const [formTrah, setFormTrah] = useState<'inti' | 'ayah' | 'ibu' | 'pasangan_ayah' | 'pasangan_ibu'>('inti');
  const [formGender, setFormGender] = useState<'L' | 'P'>('L');
  const [formBirthYear, setFormBirthYear] = useState('2020');
  const [formDeathYear, setFormDeathYear] = useState('');
  const [formStatus, setFormStatus] = useState<'Hidup' | 'Almarhum'>('Hidup');
  const [formOrigin, setFormOrigin] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPhoto, setFormPhoto] = useState<string | undefined>(undefined);

  // Persist Data to LocalStorage (v4 Clean)
  useEffect(() => {
    try {
      localStorage.setItem('wargaqu_leluhur_members_v4', JSON.stringify(members));
    } catch (e) {
      console.error(e);
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem('wargaqu_leluhur_posts_v5', JSON.stringify(posts));
    } catch (e) {
      console.error(e);
    }
  }, [posts]);

  useEffect(() => {
    try {
      localStorage.setItem('wargaqu_leluhur_spouse_connected_v2', String(isSpouseConnected));
      localStorage.setItem('wargaqu_leluhur_spouse_info_v2', JSON.stringify(spouseInfo));
    } catch (e) {
      console.error(e);
    }
  }, [isSpouseConnected, spouseInfo]);

  useEffect(() => {
    try {
      localStorage.setItem('wargaqu_leluhur_kk_v4', JSON.stringify(kkData));
    } catch (e) {
      console.error(e);
    }
  }, [kkData]);

  // Format rentang tahun privacy-first (Format: 'Lahir 1985' atau '1950 - 2018')
  const getYearRangeDisplay = (m: FamilyMember) => {
    if (m.status === 'Almarhum') {
      return `${m.birthYear || '?'} - ${m.deathYear || 'Wafat'}`;
    }
    return `Lahir ${m.birthYear || 'Tercatat'}`;
  };

  // Nomor Anggota Auto (TA-01 Trah Ayah, TI-01 Trah Ibu, TPA-01 Trah Pasangan Ayah, TPI-01 Trah Pasangan Ibu, TK-01 Inti)
  const getMemberNo = (member: FamilyMember, allMembers: FamilyMember[] = members): string => {
    if (member.memberNo) return member.memberNo;
    const prefix =
      member.trah === 'ayah' ? 'TA' :
      member.trah === 'ibu' ? 'TI' :
      member.trah === 'pasangan_ayah' ? 'TPA' :
      member.trah === 'pasangan_ibu' ? 'TPI' : 'TK';
    const sameTrahMembers = allMembers.filter(m => m.trah === member.trah);
    const idx = sameTrahMembers.findIndex(m => m.id === member.id);
    const num = (idx >= 0 ? idx + 1 : 1).toString().padStart(2, '0');
    return `${prefix}-${num}`;
  };

  // Standarisasi Ukuran Kartu Modular & Spasi Canvas
  const CANVAS_CARD_WIDTH = 270;
  const CANVAS_CARD_HEIGHT = 185;
  const CANVAS_GAP_X = 45;
  const CANVAS_GAP_Y = 65;

  // Canvas Pan & Auto-Fit Navigation State
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isCanvasPanning, setIsCanvasPanning] = useState(false);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; scrollLeft: number; scrollTop: number } | null>(null);

  // Deteksi Tabrakan / Tumpang Tindih Posisi (Anti-Collision / Non-Overlapping)
  const findNonOverlappingPosition = (
    desiredX: number,
    desiredY: number,
    allMembers: FamilyMember[],
    preferredShift: 'right' | 'left' | 'up' | 'down' = 'right'
  ): { x: number; y: number } => {
    let testX = Math.max(30, desiredX);
    let testY = Math.max(30, desiredY);

    const isColliding = (x: number, y: number) => {
      return allMembers.some(m => {
        const mx = m.canvasX ?? 40;
        const my = m.canvasY ?? 40;
        return (
          Math.abs(mx - x) < (CANVAS_CARD_WIDTH - 25) &&
          Math.abs(my - y) < (CANVAS_CARD_HEIGHT - 25)
        );
      });
    };

    let attempts = 0;
    while (isColliding(testX, testY) && attempts < 25) {
      attempts++;
      if (preferredShift === 'right') {
        testX += CANVAS_CARD_WIDTH + CANVAS_GAP_X;
      } else if (preferredShift === 'left') {
        testX -= (CANVAS_CARD_WIDTH + CANVAS_GAP_X);
        if (testX < 30) {
          testX = Math.max(30, desiredX) + attempts * (CANVAS_CARD_WIDTH + CANVAS_GAP_X);
        }
      } else if (preferredShift === 'up') {
        testY -= (CANVAS_CARD_HEIGHT + CANVAS_GAP_Y);
        if (testY < 30) {
          testY = 30;
          testX += CANVAS_CARD_WIDTH + CANVAS_GAP_X;
        }
      } else if (preferredShift === 'down') {
        testY += CANVAS_CARD_HEIGHT + CANVAS_GAP_Y;
      }
    }

    return { x: testX, y: testY };
  };

  // ==================== TATA SILSILAH KHUSUS 3 SAYAP ====================
  // Trah Ayah KIRI, Trah Ibu KANAN, Keluarga Inti BAWAH
  // Card Kakak/Adik sejajar kanan-kiri, Anak berurutan sesuai nomor, Pasangan beda warna
  const layoutTrahThreeWings = (membersList: FamilyMember[]): FamilyMember[] => {
    if (membersList.length === 0) return [];

    const ayahMembers = membersList.filter(m => m.trah === 'ayah');
    const ibuMembers = membersList.filter(m => m.trah === 'ibu');
    const intiMembers = membersList.filter(m => m.trah === 'inti' || m.trah === 'keduanya');

    const result = new Map<string, FamilyMember>();

    // 1. TATA SAYAP KIRI: TRAH AYAH (X: 80 s/d 1200)
    const ayahBuyut = ayahMembers.filter(m => m.relation === 'buyut');
    const ayahKakek = ayahMembers.filter(m => m.relation === 'kakek' || m.relation === 'nenek');
    const ayahOrtuSaudara = ayahMembers.filter(m => m.relation !== 'buyut' && m.relation !== 'kakek' && m.relation !== 'nenek');

    const layoutSubGroup = (group: FamilyMember[], startX: number, startY: number) => {
      group.forEach((m, idx) => {
        result.set(m.id, {
          ...m,
          canvasX: startX + idx * (CANVAS_CARD_WIDTH + CANVAS_GAP_X),
          canvasY: startY,
          memberNo: getMemberNo(m, membersList)
        });
      });
    };

    layoutSubGroup(ayahBuyut, 80, 80);
    layoutSubGroup(ayahKakek, 80, 80 + CANVAS_CARD_HEIGHT + CANVAS_GAP_Y);
    layoutSubGroup(ayahOrtuSaudara, 80, 80 + (CANVAS_CARD_HEIGHT + CANVAS_GAP_Y) * 2);

    // 2. TATA SAYAP KANAN: TRAH IBU (X: 2000 s/d 3400)
    const ibuBuyut = ibuMembers.filter(m => m.relation === 'buyut');
    const ibuKakek = ibuMembers.filter(m => m.relation === 'kakek' || m.relation === 'nenek');
    const ibuOrtuSaudara = ibuMembers.filter(m => m.relation !== 'buyut' && m.relation !== 'kakek' && m.relation !== 'nenek');

    layoutSubGroup(ibuBuyut, 2000, 80);
    layoutSubGroup(ibuKakek, 2000, 80 + CANVAS_CARD_HEIGHT + CANVAS_GAP_Y);
    layoutSubGroup(ibuOrtuSaudara, 2000, 80 + (CANVAS_CARD_HEIGHT + CANVAS_GAP_Y) * 2);

    // 3. TATA KELUARGA INTI DI BAWAH TENGAH (Y: 920 s/d 1800)
    const head = intiMembers.find(m => m.relation === 'ayah' || m.role?.toLowerCase().includes('kepala')) || intiMembers[0];
    const spouse = intiMembers.find(m => (m.relation === 'ibu' || m.relation === 'pasangan' || m.id === head?.spouseId) && m.id !== head?.id);
    const kakak = intiMembers.filter(m => m.relation === 'saudara' && (m.role?.toLowerCase().includes('kakak') || m.kinshipTitle?.toLowerCase().includes('kakak')));
    const adik = intiMembers.filter(m => m.relation === 'saudara' && (m.role?.toLowerCase().includes('adik') || m.kinshipTitle?.toLowerCase().includes('adik')));
    const children = intiMembers.filter(m => m.relation === 'anak').sort((a, b) => {
      const numA = parseInt(a.role.replace(/[^0-9]/g, '')) || parseInt(a.birthYear) || 0;
      const numB = parseInt(b.role.replace(/[^0-9]/g, '')) || parseInt(b.birthYear) || 0;
      return numA - numB;
    });

    const intiY = 920;
    const centerX = 1500;

    if (head) {
      result.set(head.id, {
        ...head,
        canvasX: centerX - (CANVAS_CARD_WIDTH + Math.round(CANVAS_GAP_X / 2)),
        canvasY: intiY,
        memberNo: getMemberNo(head, membersList)
      });
    }

    if (spouse) {
      result.set(spouse.id, {
        ...spouse,
        canvasX: centerX + Math.round(CANVAS_GAP_X / 2),
        canvasY: intiY, // SEJAJAR DENGAN KEPALA
        memberNo: getMemberNo(spouse, membersList)
      });
    }

    // Kakak di KIRI sejajar Y
    kakak.forEach((k, idx) => {
      const leftAnchor = head ? (centerX - (CANVAS_CARD_WIDTH + Math.round(CANVAS_GAP_X / 2))) : centerX;
      const x = leftAnchor - (idx + 1) * (CANVAS_CARD_WIDTH + CANVAS_GAP_X);
      result.set(k.id, {
        ...k,
        canvasX: Math.max(80, x),
        canvasY: intiY,
        memberNo: getMemberNo(k, membersList)
      });
    });

    // Adik di KANAN sejajar Y (di samping pasangan)
    adik.forEach((ad, idx) => {
      const rightAnchor = spouse ? (centerX + Math.round(CANVAS_GAP_X / 2) + CANVAS_CARD_WIDTH) : (centerX + CANVAS_CARD_WIDTH);
      const x = rightAnchor + CANVAS_GAP_X + idx * (CANVAS_CARD_WIDTH + CANVAS_GAP_X);
      result.set(ad.id, {
        ...ad,
        canvasX: x,
        canvasY: intiY,
        memberNo: getMemberNo(ad, membersList)
      });
    });

    // Anak-anak di BAWAH berjejer rapi berurutan sesuai nomor
    const childrenY = intiY + CANVAS_CARD_HEIGHT + CANVAS_GAP_Y;
    const totalChildWidth = children.length * CANVAS_CARD_WIDTH + Math.max(0, children.length - 1) * CANVAS_GAP_X;
    const startChildX = Math.max(80, centerX - Math.round(totalChildWidth / 2));

    children.forEach((c, idx) => {
      result.set(c.id, {
        ...c,
        canvasX: startChildX + idx * (CANVAS_CARD_WIDTH + CANVAS_GAP_X),
        canvasY: childrenY,
        memberNo: getMemberNo(c, membersList)
      });
    });

    // Anggota inti lainnya jika ada
    const remainingInti = intiMembers.filter(m => !result.has(m.id));
    remainingInti.forEach((rem, idx) => {
      result.set(rem.id, {
        ...rem,
        canvasX: startChildX + idx * (CANVAS_CARD_WIDTH + CANVAS_GAP_X),
        canvasY: childrenY + CANVAS_CARD_HEIGHT + CANVAS_GAP_Y,
        memberNo: getMemberNo(rem, membersList)
      });
    });

    return membersList.map(m => result.get(m.id) || m);
  };

  const handleApplyThreeWingsLayout = () => {
    if (members.length === 0) return;
    const reordered = layoutTrahThreeWings(members);
    setMembers(reordered);
    setTimeout(() => {
      handleAutoFitAll();
    }, 60);
    showNotification('Silsilah 3 Sayap (Ayah Kiri • Ibu Kanan • Inti Bawah) berhasil ditata rapi!');
  };

  const handleApplyAutoLayout = () => {
    handleApplyThreeWingsLayout();
  };

  // Simpan Tata Letak Kanvas Secara Permanen
  const handleSaveCanvasLayout = () => {
    try {
      localStorage.setItem('wargaqu_leluhur_members_v4', JSON.stringify(members));
      localStorage.setItem('wargaqu_leluhur_canvas_settings_v4', JSON.stringify({ zoom: treeZoom }));
      showNotification(`Posisi silsilah & zoom (${Math.round(treeZoom * 100)}%) berhasil disimpan permanen!`);
    } catch {
      showNotification('Gagal menyimpan posisi ke penyimpanan lokal.');
    }
  };

  // Toggle Layar Penuh (Fullscreen)
  const toggleCanvasFullscreen = () => {
    setIsCanvasFullscreen(prev => {
      const next = !prev;
      if (next) {
        try {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch {}
      } else {
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {}
      }
      return next;
    });
  };

  // Dragging Card Handlers
  const handleDragStart = (cardId: string, clientX: number, clientY: number) => {
    const card = members.find(m => m.id === cardId);
    if (!card) return;
    setDraggingCardId(cardId);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      cardX: card.canvasX ?? 40,
      cardY: card.canvasY ?? 40
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (draggingCardId && dragStartRef.current) {
      const deltaX = (clientX - dragStartRef.current.mouseX) / treeZoom;
      const deltaY = (clientY - dragStartRef.current.mouseY) / treeZoom;
      const newX = Math.max(20, Math.min(3500, Math.round(dragStartRef.current.cardX + deltaX)));
      const newY = Math.max(20, Math.min(2400, Math.round(dragStartRef.current.cardY + deltaY)));
      setMembers(prev => prev.map(m => (m.id === draggingCardId ? { ...m, canvasX: newX, canvasY: newY } : m)));
      return;
    }

    if (isCanvasPanning && panStartRef.current && canvasContainerRef.current) {
      const deltaX = clientX - panStartRef.current.mouseX;
      const deltaY = clientY - panStartRef.current.mouseY;
      canvasContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - deltaX;
      canvasContainerRef.current.scrollTop = panStartRef.current.scrollTop - deltaY;
    }
  };

  const handleDragEnd = () => {
    if (draggingCardId) {
      setDraggingCardId(null);
      dragStartRef.current = null;
    }
    if (isCanvasPanning) {
      setIsCanvasPanning(false);
      panStartRef.current = null;
    }
  };

  // Touch Pinch-to-Zoom (2 Jari) Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = treeZoom;
      return;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / touchStartDistRef.current;
      const newZoom = Math.max(0.35, Math.min(1.8, Math.round(touchStartZoomRef.current * factor * 100) / 100));
      setTreeZoom(newZoom);
      return;
    }
    if (e.touches[0]) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    handleDragEnd();
  };

  // Wheel Zoom Support
  const handleWheelZoom = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05;
      setTreeZoom(z => Math.max(0.35, Math.min(1.8, Math.round((z + zoomDelta) * 100) / 100)));
    }
  };

  // Canvas Pan (4 Arah: Atas, Bawah, Kiri, Kanan, Pusat)
  const handlePanCanvas = (direction: 'up' | 'down' | 'left' | 'right' | 'center') => {
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const step = 280;
    if (direction === 'up') container.scrollBy({ top: -step, behavior: 'smooth' });
    else if (direction === 'down') container.scrollBy({ top: step, behavior: 'smooth' });
    else if (direction === 'left') container.scrollBy({ left: -step, behavior: 'smooth' });
    else if (direction === 'right') container.scrollBy({ left: step, behavior: 'smooth' });
    else if (direction === 'center') {
      handleAutoFitAll();
    }
  };

  // Zoom Auto Mencakup Semua (Fit All Cards in View)
  const handleAutoFitAll = () => {
    if (displayedMembers.length === 0 || !canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const containerW = container.clientWidth || 800;
    const containerH = container.clientHeight || 580;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    displayedMembers.forEach(m => {
      const x = m.canvasX ?? 60;
      const y = m.canvasY ?? 60;
      if (x < minX) minX = x;
      if (x + CANVAS_CARD_WIDTH > maxX) maxX = x + CANVAS_CARD_WIDTH;
      if (y < minY) minY = y;
      if (y + CANVAS_CARD_HEIGHT > maxY) maxY = y + CANVAS_CARD_HEIGHT;
    });

    const contentW = (maxX - minX) + 120;
    const contentH = (maxY - minY) + 120;

    const scaleX = (containerW - 40) / contentW;
    const scaleY = (containerH - 40) / contentH;
    let fitZoom = Math.min(scaleX, scaleY);
    fitZoom = Math.max(0.35, Math.min(1.2, Math.round(fitZoom * 100) / 100));

    setTreeZoom(fitZoom);

    setTimeout(() => {
      if (canvasContainerRef.current) {
        const targetScrollX = Math.max(0, (minX - 40) * fitZoom);
        const targetScrollY = Math.max(0, (minY - 40) * fitZoom);
        canvasContainerRef.current.scrollTo({
          left: targetScrollX,
          top: targetScrollY,
          behavior: 'smooth'
        });
      }
    }, 60);

    showNotification(`Tampilan disesuaikan mencakup semua (${Math.round(fitZoom * 100)}% • ${displayedMembers.length} anggota)!`);
  };

  // Warna & Styling Card Berdasarkan Trah & Status Pasangan
  const getCardStyle = (m: FamilyMember, isSelected: boolean) => {
    const isSpouse = m.relation === 'pasangan' || (m.trah === 'inti' && (m.role?.toLowerCase().includes('istri') || m.kinshipTitle?.toLowerCase().includes('istri')));

    if (isSpouse) {
      return {
        border: isSelected
          ? 'border-rose-500 ring-4 ring-rose-300/60 shadow-xl z-20 bg-rose-50/30'
          : 'border-rose-400 hover:border-rose-500 hover:shadow-lg z-10 bg-white',
        badgeBg: 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 text-white font-extrabold',
        badgeText: '💍 Pasangan',
        noBadge: 'bg-rose-950 text-rose-200',
        tagColor: 'bg-rose-100 text-rose-800 border border-rose-200'
      };
    }

    if (m.trah === 'ayah') {
      return {
        border: isSelected
          ? 'border-blue-600 ring-4 ring-blue-300/60 shadow-xl z-20 bg-blue-50/30'
          : 'border-blue-400 hover:border-blue-500 hover:shadow-lg z-10 bg-white',
        badgeBg: 'bg-blue-600 text-white font-bold',
        badgeText: 'Trah Ayah',
        noBadge: 'bg-blue-950 text-blue-200',
        tagColor: 'bg-blue-100 text-blue-800 border border-blue-200'
      };
    }

    if (m.trah === 'ibu') {
      return {
        border: isSelected
          ? 'border-purple-600 ring-4 ring-purple-300/60 shadow-xl z-20 bg-purple-50/30'
          : 'border-purple-400 hover:border-purple-500 hover:shadow-lg z-10 bg-white',
        badgeBg: 'bg-purple-600 text-white font-bold',
        badgeText: 'Trah Ibu',
        noBadge: 'bg-purple-950 text-purple-200',
        tagColor: 'bg-purple-100 text-purple-800 border border-purple-200'
      };
    }

    // Keluarga Inti
    return {
      border: isSelected
        ? 'border-emerald-600 ring-4 ring-emerald-300/60 shadow-xl z-20 bg-emerald-50/30'
        : 'border-emerald-400 hover:border-emerald-500 hover:shadow-lg z-10 bg-white',
      badgeBg: 'bg-emerald-700 text-white font-bold',
      badgeText: 'Keluarga Inti',
      noBadge: 'bg-slate-900 text-[#5eead4]',
      tagColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
    };
  };

  // Generator Garis Otomatis Rapi / Lurus / Belok / Sudut / Sambung Tanpa Tertutup Card (Orthogonal Lines)
  const renderOrthogonalLines = () => {
    const lines: React.ReactNode[] = [];
    const drawnSpouses = new Set<string>();

    displayedMembers.forEach(m => {
      // 1. PASANGAN (Mendukung Multi-Istri / Poligini): Garis lurus/siku emas-rose dengan cincin 💍
      const spouseTargets: Array<{ id: string; order?: number; note?: string }> = [];
      if (m.spouseId) spouseTargets.push({ id: m.spouseId });
      if (m.spouseIds) {
        m.spouseIds.forEach(sid => {
          if (!spouseTargets.some(st => st.id === sid)) spouseTargets.push({ id: sid });
        });
      }
      if (m.spouses) {
        m.spouses.forEach(sp => {
          const idx = spouseTargets.findIndex(st => st.id === sp.id);
          if (idx >= 0) {
            spouseTargets[idx].order = sp.order;
            spouseTargets[idx].note = sp.note;
          } else {
            spouseTargets.push({ id: sp.id, order: sp.order, note: sp.note });
          }
        });
      }

      spouseTargets.forEach(spInfo => {
        const spouse = displayedMembers.find(s => s.id === spInfo.id);
        const pairKey = [m.id, spInfo.id].sort().join('_');
        if (spouse && !drawnSpouses.has(pairKey)) {
          drawnSpouses.add(pairKey);
          const isLeft = (m.canvasX ?? 0) <= (spouse.canvasX ?? 0);
          const leftCard = isLeft ? m : spouse;
          const rightCard = isLeft ? spouse : m;

          const x1 = (leftCard.canvasX ?? 40) + CANVAS_CARD_WIDTH;
          const y1 = (leftCard.canvasY ?? 40) + Math.round(CANVAS_CARD_HEIGHT / 2);
          const x2 = (rightCard.canvasX ?? 40);
          const y2 = (rightCard.canvasY ?? 40) + Math.round(CANVAS_CARD_HEIGHT / 2);

          const midX = Math.round((x1 + x2) / 2);
          const midY = Math.round((y1 + y2) / 2);

          const d = Math.abs(y1 - y2) < 4
            ? `M ${x1} ${y1} L ${x2} ${y2}`
            : `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;

          const wifeOrderLabel = spInfo.order || spouse.spouseOrder || (m.gender === 'P' ? m.spouseOrder : undefined);

          lines.push(
            <g key={`sp_${pairKey}`}>
              <path
                d={d}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3.5"
                strokeDasharray="6,4"
                strokeLinecap="round"
              />
              <circle cx={midX} cy={midY} r="13" fill="#fff1f2" stroke="#f43f5e" strokeWidth="2.5" />
              <text x={midX} y={midY + 4} textAnchor="middle" fontSize="10" fill="#e11d48" fontWeight="bold">
                💍{wifeOrderLabel ? `${wifeOrderLabel}` : ''}
              </text>
            </g>
          );

          // Cabang bus-bar bersama pasangan ke anak-anak (filter akurat sesuai ibu kandung jika poligini)
          const coupleChildren = displayedMembers.filter(c => {
            const isChildOfFather = c.parentId === leftCard.id || c.parentId === rightCard.id;
            const isChildOfMother = c.motherId === leftCard.id || c.motherId === rightCard.id;
            if (c.motherId) {
              return isChildOfFather && (c.motherId === leftCard.id || c.motherId === rightCard.id);
            }
            return isChildOfFather || isChildOfMother;
          });

          if (coupleChildren.length > 0) {
            const trunkY = Math.max(
              (leftCard.canvasY ?? 40) + CANVAS_CARD_HEIGHT,
              (rightCard.canvasY ?? 40) + CANVAS_CARD_HEIGHT
            );
            const minChildY = Math.min(...coupleChildren.map(c => c.canvasY ?? (trunkY + CANVAS_GAP_Y)));
            const busY = trunkY + Math.max(20, Math.round((minChildY - trunkY) / 2));

            // Garis batang turun dari persambungan pasangan
            lines.push(
              <path
                key={`couple_trunk_${pairKey}`}
                d={`M ${midX} ${midY + 13} V ${busY}`}
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            );

            // Garis horizontal bus bar penghubung semua anak
            const childTops = coupleChildren.map(c => ({
              id: c.id,
              cx: (c.canvasX ?? 40) + Math.round(CANVAS_CARD_WIDTH / 2),
              cy: (c.canvasY ?? 40)
            }));
            const minBusX = Math.min(midX, ...childTops.map(c => c.cx));
            const maxBusX = Math.max(midX, ...childTops.map(c => c.cx));

            lines.push(
              <path
                key={`couple_bus_${pairKey}`}
                d={`M ${minBusX} ${busY} H ${maxBusX}`}
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            );

            // Turun tegak lurus 90° ke masing-masing kartu anak
            childTops.forEach(ch => {
              lines.push(
                <path
                  key={`couple_to_child_${pairKey}_${ch.id}`}
                  d={`M ${ch.cx} ${busY} V ${ch.cy}`}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  markerEnd="url(#arrowHead)"
                />
              );
            });
          }
        }
      });

      // 2. ORANG TUA TUNGGAL -> ANAK (Garis Siku 90° Bersih)
      if (m.parentId) {
        const parent = displayedMembers.find(p => p.id === m.parentId);
        const parentHasSpouse = parent?.spouseId && displayedMembers.some(s => s.id === parent.spouseId);
        if (parent && !parentHasSpouse) {
          const px = (parent.canvasX ?? 40) + Math.round(CANVAS_CARD_WIDTH / 2);
          const py = (parent.canvasY ?? 40) + CANVAS_CARD_HEIGHT;
          const cx = (m.canvasX ?? 40) + Math.round(CANVAS_CARD_WIDTH / 2);
          const cy = (m.canvasY ?? 40);
          const midY = py + Math.round((cy - py) / 2);

          lines.push(
            <path
              key={`parent_${parent.id}_${m.id}`}
              d={`M ${px} ${py} V ${midY} H ${cx} V ${cy}`}
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              markerEnd="url(#arrowHead)"
            />
          );
        }
      } else if (m.relation === 'anak' && !m.parentId) {
        const autoParent = displayedMembers.find(p => p.relation === 'ayah' || p.role.includes('Kepala') || p.id === '1');
        if (autoParent && autoParent.id !== m.id && !autoParent.spouseId) {
          const px = (autoParent.canvasX ?? 40) + Math.round(CANVAS_CARD_WIDTH / 2);
          const py = (autoParent.canvasY ?? 40) + CANVAS_CARD_HEIGHT;
          const cx = (m.canvasX ?? 40) + Math.round(CANVAS_CARD_WIDTH / 2);
          const cy = (m.canvasY ?? 40);
          const midY = py + Math.round((cy - py) / 2);
          lines.push(
            <path
              key={`auto_child_${autoParent.id}_${m.id}`}
              d={`M ${px} ${py} V ${midY} H ${cx} V ${cy}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              strokeLinecap="round"
            />
          );
        }
      }

      // 3. SAUDARA KANDUNG (Kakak / Adik - Garis Lurus / Siku Cyan/Sky)
      if (m.siblingId) {
        const sib = displayedMembers.find(s => s.id === m.siblingId);
        if (sib && (m.canvasX ?? 0) < (sib.canvasX ?? 0)) {
          const x1 = (m.canvasX ?? 40) + CANVAS_CARD_WIDTH;
          const y1 = (m.canvasY ?? 40) + 40;
          const x2 = (sib.canvasX ?? 40);
          const y2 = (sib.canvasY ?? 40) + 40;
          const midX = Math.round((x1 + x2) / 2);

          const d = Math.abs(y1 - y2) < 4
            ? `M ${x1} ${y1} L ${x2} ${y2}`
            : `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;

          lines.push(
            <path
              key={`sib_${m.id}_${sib.id}`}
              d={d}
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeDasharray="5,4"
              strokeLinecap="round"
            />
          );
        }
      }
    });

    return lines;
  };

  // Upload & Kompres Pas Foto Langsung per Card
  const handleCardDirectPhoto = async (memberId: string, file: File) => {
    try {
      showNotification('Mengompres pas foto wajah...');
      const compressed = await compressImage(file, 280, 0.82);
      setMembers(prev => prev.map(m => (m.id === memberId ? { ...m, photo: compressed } : m)));
      showNotification('Pas foto berhasil dikompres & dipasang pada kartu!');
    } catch {
      showNotification('Gagal mengompres foto.');
    }
  };

  // Simpan Edit Member In-place dengan Sinkronisasi Nomor Urut
  const handleSaveEditMember = (updated: FamilyMember) => {
    setMembers(prev => {
      let list = prev.map(m => (m.id === updated.id ? updated : m));

      // Jika nomor urut anak diubah dan anggota memiliki parent, sesuaikan urutan saudara lain agar tidak bentrok
      if (updated.parentId && updated.birthOrder) {
        const allSiblings = list.filter(m => m.parentId === updated.parentId);
        if (allSiblings.length > 1) {
          const sorted = [...allSiblings].sort((a, b) => {
            const ordA = a.id === updated.id ? updated.birthOrder! : (a.birthOrder || (parseInt(a.birthYear) || 9999));
            const ordB = b.id === updated.id ? updated.birthOrder! : (b.birthOrder || (parseInt(b.birthYear) || 9999));
            if (ordA !== ordB) return ordA - ordB;
            return (a.canvasX ?? 0) - (b.canvasX ?? 0);
          });
          const minX = Math.min(...allSiblings.map(c => c.canvasX ?? 100));
          sorted.forEach((s, idx) => {
            const num = idx + 1;
            const targetM = list.find(m => m.id === s.id);
            if (targetM) {
              targetM.birthOrder = num;
              if (targetM.relation === 'anak' || targetM.role.includes('Anak')) {
                targetM.role = `Anak ke-${num}`;
                targetM.kinshipTitle = `Anak ke-${num}`;
              }
              targetM.canvasX = minX + idx * (CANVAS_CARD_WIDTH + CANVAS_GAP_X);
            }
          });
        }
      }
      return list;
    });
    setEditingMember(null);
    showNotification(`Data & nomor urut ${updated.name} berhasil diperbarui!`);
  };

  // Koreksi Nomor Urut Anak Berdasarkan Tahun Lahir (Tertua -> Termuda)
  const handleSortChildrenByBirthYear = (parentId: string) => {
    const parent = members.find(m => m.id === parentId);
    if (!parent) return;

    // Kumpulkan semua anak dari parent ini (atau pasangannya)
    const spouseId = parent.spouseId;
    const children = members.filter(
      m => m.parentId === parentId || (spouseId && m.parentId === spouseId) || m.motherId === parentId || (spouseId && m.motherId === spouseId)
    );

    if (children.length <= 1) {
      showNotification(`Jumlah anak hanya ${children.length}, tidak perlu diurutkan.`);
      return;
    }

    // Urutkan anak berdasarkan tahun lahir: tahun terkecil (lahir lebih awal) di depan
    const sortedChildren = [...children].sort((a, b) => {
      const yearA = parseInt(a.birthYear) || 9999;
      const yearB = parseInt(b.birthYear) || 9999;
      if (yearA !== yearB) return yearA - yearB;
      return (a.canvasX ?? 0) - (b.canvasX ?? 0);
    });

    const minX = Math.min(...children.map(c => c.canvasX ?? 100));
    const baseY = children[0].canvasY ?? ((parent.canvasY ?? 100) + CANVAS_CARD_HEIGHT + CANVAS_GAP_Y);

    setMembers(prev => {
      return prev.map(m => {
        const sortedIndex = sortedChildren.findIndex(c => c.id === m.id);
        if (sortedIndex !== -1) {
          const childNumber = sortedIndex + 1;
          const newRole = `Anak ke-${childNumber}`;
          const newKinship = `Anak ke-${childNumber}`;
          const newX = minX + sortedIndex * (CANVAS_CARD_WIDTH + CANVAS_GAP_X);
          return {
            ...m,
            role: newRole,
            kinshipTitle: newKinship,
            birthOrder: childNumber,
            canvasX: newX,
            canvasY: baseY,
          };
        }
        return m;
      });
    });

    showNotification(`Urutan ${children.length} anak berhasil diurutkan otomatis dari tertua ke termuda!`);
  };

  // Tukar Nomor Urut Saudara (Geser Lebih Tua / Lebih Muda)
  const handleSwapSiblingOrder = (memberId: string, direction: 'prev' | 'next') => {
    const current = members.find(m => m.id === memberId);
    if (!current || !current.parentId) {
      showNotification('Hanya anggota yang memiliki orang tua / saudara yang dapat ditukar urutannya.');
      return;
    }

    // Dapatkan semua saudara sekandung (berbagi parentId)
    const siblings = members
      .filter(m => m.parentId === current.parentId)
      .sort((a, b) => (a.canvasX ?? 0) - (b.canvasX ?? 0));

    const curIndex = siblings.findIndex(s => s.id === memberId);
    if (curIndex === -1) return;

    const targetIndex = direction === 'prev' ? curIndex - 1 : curIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) {
      showNotification(direction === 'prev' ? 'Sudah berada di urutan paling pertama (tertua)!' : 'Sudah berada di urutan paling akhir (termuda)!');
      return;
    }

    const neighbor = siblings[targetIndex];

    // Tukar koordinat X dan urutan role/kinshipTitle ("Anak ke-X")
    const tempX = current.canvasX ?? 100;
    const neighborX = neighbor.canvasX ?? (tempX + CANVAS_CARD_WIDTH + CANVAS_GAP_X);

    setMembers(prev => {
      return prev.map(m => {
        if (m.id === current.id) {
          return {
            ...m,
            canvasX: neighborX,
            role: neighbor.role.includes('Anak') ? neighbor.role : m.role,
            kinshipTitle: neighbor.kinshipTitle?.includes('Anak') ? neighbor.kinshipTitle : m.kinshipTitle,
            birthOrder: targetIndex + 1,
          };
        }
        if (m.id === neighbor.id) {
          return {
            ...m,
            canvasX: tempX,
            role: current.role.includes('Anak') ? current.role : m.role,
            kinshipTitle: current.kinshipTitle?.includes('Anak') ? current.kinshipTitle : m.kinshipTitle,
            birthOrder: curIndex + 1,
          };
        }
        return m;
      });
    });

    showNotification(`Urutan ${current.name} berhasil ditukar dengan ${neighbor.name}!`);
  };

  // Koreksi & Urutkan Seluruh Silsilah (Kakek, Ayah/Paman, dan Anak) Sesuai Tahun Lahir
  const handleSortAllGenerationsByBirthYear = () => {
    if (members.length === 0) {
      showNotification('Belum ada data silsilah.');
      return;
    }

    const parentIds = Array.from(new Set(members.filter(m => m.parentId).map(m => m.parentId!)));
    if (parentIds.length === 0) {
      showNotification('Belum ada hubungan orang tua dan anak dalam silsilah.');
      return;
    }

    setMembers(prev => {
      let updated = [...prev];

      parentIds.forEach(pId => {
        const children = updated.filter(m => m.parentId === pId);
        if (children.length > 1) {
          const sorted = [...children].sort((a, b) => {
            const yA = parseInt(a.birthYear) || 9999;
            const yB = parseInt(b.birthYear) || 9999;
            if (yA !== yB) return yA - yB;
            return (a.canvasX ?? 0) - (b.canvasX ?? 0);
          });

          const minX = Math.min(...children.map(c => c.canvasX ?? 100));
          const baseY = children[0].canvasY ?? 200;

          sorted.forEach((ch, idx) => {
            const childNum = idx + 1;
            const matchIdx = updated.findIndex(u => u.id === ch.id);
            if (matchIdx !== -1) {
              updated[matchIdx] = {
                ...updated[matchIdx],
                role: updated[matchIdx].relation === 'anak' || updated[matchIdx].role.includes('Anak') ? `Anak ke-${childNum}` : updated[matchIdx].role,
                kinshipTitle: updated[matchIdx].relation === 'anak' || updated[matchIdx].kinshipTitle?.includes('Anak') ? `Anak ke-${childNum}` : updated[matchIdx].kinshipTitle,
                birthOrder: childNum,
                canvasX: minX + idx * (CANVAS_CARD_WIDTH + CANVAS_GAP_X),
                canvasY: baseY,
              };
            }
          });
        }
      });

      return updated;
    });

    showNotification('Seluruh urutan silsilah (Kakek, Ayah/Paman, dan Anak) berhasil dirapikan otomatis sesuai tahun lahir!');
  };

  // Hapus Member
  const handleDeleteMember = (memberId: string) => {
    const target = members.find(m => m.id === memberId);
    if (!target) return;
    setMembers(prev => prev.filter(m => m.id !== memberId));
    if (selectedCardId === memberId) setSelectedCardId(null);
    if (relationChooserMember?.id === memberId) setRelationChooserMember(null);
    showNotification(`${target.name} dihapus dari silsilah.`);
  };

  // Quick Add Relative Submit (+) dengan Arah Otomatis:
  // - Ayah/Ibu: KE ATAS
  // - Pasangan / Saudara (Kakak/Adik): KANAN atau KIRI
  // - Anak: KE BAWAH (berurutan nomor)
  // Dilengkapi Anti-Collision agar kartu tidak tumpang tindih
  const handleQuickAddRelativeSubmit = (data: {
    name: string;
    binBinti?: string;
    nickname?: string;
    gender: 'L' | 'P';
    birthYear: string;
    deathYear?: string;
    status: 'Hidup' | 'Almarhum';
    address?: string;
    phone?: string;
    photo?: string;
    // Multi-Istri (Poligini)
    spouseOrder?: number;
    marriageNote?: string;
    motherId?: string;
    motherName?: string;
  }) => {
    if (!quickAddModal.targetMember) return;
    const target = quickAddModal.targetMember;
    const rel = quickAddModal.relationType;

    const targetX = target.canvasX ?? 100;
    const targetY = target.canvasY ?? 100;

    let desiredX = targetX;
    let desiredY = targetY;
    let preferredShift: 'right' | 'left' | 'up' | 'down' = 'right';

    if (rel === 'ayah') {
      // AYAH -> KE ATAS & condong kiri
      desiredY = targetY - (CANVAS_CARD_HEIGHT + CANVAS_GAP_Y);
      desiredX = targetX - (CANVAS_CARD_WIDTH / 2 + 15);
      preferredShift = 'left';
    } else if (rel === 'ibu') {
      // IBU -> KE ATAS & condong kanan
      desiredY = targetY - (CANVAS_CARD_HEIGHT + CANVAS_GAP_Y);
      desiredX = targetX + (CANVAS_CARD_WIDTH / 2 + 15);
      preferredShift = 'right';
    } else if (rel === 'pasangan') {
      // PASANGAN / ISTRI -> KANAN sejajar Y
      desiredY = targetY;
      const existingWivesCount = (target.spouses?.length || (target.spouseId ? 1 : 0));
      const order = data.spouseOrder || (existingWivesCount + 1);
      // Posisikan berurutan ke kanan untuk istri ke-1, 2, 3, dst.
      desiredX = targetX + (CANVAS_CARD_WIDTH + CANVAS_GAP_X) * order;
      preferredShift = 'right';
    } else if (rel === 'kakak') {
      // KAKAK -> KIRI sejajar Y
      desiredY = targetY;
      desiredX = targetX - (CANVAS_CARD_WIDTH + CANVAS_GAP_X);
      preferredShift = 'left';
    } else if (rel === 'adik') {
      // ADIK -> KANAN sejajar Y (jika ada pasangan di kanan, posisikan setelah pasangan)
      desiredY = targetY;
      if (target.spouseId) {
        const sp = members.find(s => s.id === target.spouseId);
        const spouseRight = sp ? (sp.canvasX ?? targetX) + CANVAS_CARD_WIDTH : targetX + CANVAS_CARD_WIDTH;
        desiredX = Math.max(targetX + CANVAS_CARD_WIDTH + CANVAS_GAP_X, spouseRight + CANVAS_GAP_X);
      } else {
        desiredX = targetX + CANVAS_CARD_WIDTH + CANVAS_GAP_X;
      }
      preferredShift = 'right';
    } else if (rel === 'anak') {
      // ANAK -> KE BAWAH berurutan nomor
      desiredY = targetY + CANVAS_CARD_HEIGHT + CANVAS_GAP_Y;
      const existingChildren = members.filter(m => m.parentId === target.id || (target.spouseId && m.parentId === target.spouseId));
      if (existingChildren.length > 0) {
        const maxChildX = Math.max(...existingChildren.map(c => c.canvasX ?? targetX));
        desiredX = maxChildX + CANVAS_CARD_WIDTH + CANVAS_GAP_X;
      } else {
        if (data.motherId) {
          const mother = members.find(m => m.id === data.motherId);
          if (mother) {
            desiredX = Math.round((targetX + (mother.canvasX ?? targetX)) / 2);
          } else {
            desiredX = targetX;
          }
        } else if (target.spouseId) {
          const sp = members.find(s => s.id === target.spouseId);
          const spouseX = sp?.canvasX ?? targetX;
          desiredX = Math.round((targetX + spouseX) / 2);
        } else {
          desiredX = targetX;
        }
      }
      preferredShift = 'right';
    }

    // Eksekusi penataan anti tumpang tindih
    const finalPos = findNonOverlappingPosition(desiredX, desiredY, members, preferredShift);

    let relationValue: FamilyMember['relation'] = 'anak';
    let kinshipTitle = 'Anak';
    let role = 'Anggota Keluarga';

    if (rel === 'ayah') {
      relationValue = target.relation === 'ayah' ? 'kakek' : 'ayah';
      kinshipTitle = target.relation === 'ayah' ? 'Aki (Kakek)' : 'Ayah';
      role = 'Ayah';
    } else if (rel === 'ibu') {
      relationValue = target.relation === 'ayah' || target.relation === 'ibu' ? 'nenek' : 'ibu';
      kinshipTitle = target.relation === 'ayah' || target.relation === 'ibu' ? 'Nini (Nenek)' : 'Ibu';
      role = 'Ibu';
    } else if (rel === 'pasangan') {
      relationValue = 'pasangan';
      const existingWivesCount = (target.spouses?.length || (target.spouseId ? 1 : 0));
      const order = data.spouseOrder || (existingWivesCount + 1);
      if (data.gender === 'P' && (existingWivesCount > 0 || data.spouseOrder)) {
        kinshipTitle = `Istri Ke-${order}`;
        role = `Istri Ke-${order}`;
      } else {
        kinshipTitle = data.gender === 'L' ? 'Suami' : 'Istri';
        role = data.gender === 'L' ? 'Suami' : 'Istri';
      }
    } else if (rel === 'anak') {
      relationValue = 'anak';
      const childCount = members.filter(m => m.parentId === target.id || (target.spouseId && m.parentId === target.spouseId)).length + 1;
      kinshipTitle = `Anak ke-${childCount}`;
      role = `Anak ke-${childCount}`;
    } else if (rel === 'kakak') {
      relationValue = 'saudara';
      kinshipTitle = data.gender === 'L' ? 'Kakak (Aa)' : 'Kakak (Teteh)';
      role = 'Kakak Kandung';
    } else if (rel === 'adik') {
      relationValue = 'saudara';
      kinshipTitle = 'Adik';
      role = 'Adik Kandung';
    }

    let trahValue: FamilyMember['trah'] = target.trah;
    if (rel === 'ayah' && target.trah === 'inti') trahValue = 'ayah';
    if (rel === 'ibu' && target.trah === 'inti') trahValue = 'ibu';

    const newId = 'm_' + Date.now();
    const nextMemberNo = getMemberNo({
      id: newId,
      trah: trahValue,
      name: data.name,
      relation: relationValue,
      gender: data.gender,
      birthYear: data.birthYear,
      status: data.status,
      role
    }, members);

    const spouseOrderFinal = rel === 'pasangan' ? (data.spouseOrder || ((target.spouses?.length || (target.spouseId ? 1 : 0)) + 1)) : undefined;

    const newMember: FamilyMember = {
      id: newId,
      name: data.name.trim(),
      nickname: data.nickname?.trim() || undefined,
      binBinti: data.binBinti?.trim() || undefined,
      role,
      relation: relationValue,
      kinshipTitle,
      trah: trahValue,
      gender: data.gender,
      birthYear: data.birthYear || '2020',
      deathYear: data.status === 'Almarhum' ? (data.deathYear || undefined) : undefined,
      status: data.status,
      origin: target.origin || 'Bogor',
      address: data.address?.trim() || target.address,
      phone: data.phone?.trim() || undefined,
      photo: data.photo,
      canvasX: finalPos.x,
      canvasY: finalPos.y,
      memberNo: nextMemberNo,
      parentId: rel === 'anak' ? target.id : undefined,
      spouseId: rel === 'pasangan' ? target.id : undefined,
      spouseIds: rel === 'pasangan' ? [target.id] : undefined,
      spouseOrder: spouseOrderFinal,
      marriageNote: rel === 'pasangan' ? data.marriageNote : undefined,
      motherId: rel === 'anak' ? (data.motherId || (target.gender === 'P' ? target.id : target.spouseId)) : undefined,
      motherName: rel === 'anak' ? data.motherName : undefined,
      siblingId: rel === 'kakak' || rel === 'adik' ? target.id : undefined
    };

    setMembers(prev => {
      let updated = [...prev];
      if (rel === 'pasangan') {
        const newSpouseEntry: FamilySpouse = {
          id: newId,
          name: data.name.trim(),
          order: spouseOrderFinal,
          note: data.marriageNote
        };
        updated = updated.map(m => {
          if (m.id === target.id) {
            const currentSpouses = m.spouses ? [...m.spouses] : [];
            if (currentSpouses.length === 0 && m.spouseId) {
              const oldSpouse = prev.find(p => p.id === m.spouseId);
              currentSpouses.push({
                id: m.spouseId,
                name: oldSpouse?.name || 'Istri Pertama',
                order: 1
              });
            }
            currentSpouses.push(newSpouseEntry);
            const currentSpouseIds = m.spouseIds ? [...m.spouseIds] : m.spouseId ? [m.spouseId] : [];
            if (!currentSpouseIds.includes(newId)) currentSpouseIds.push(newId);

            return {
              ...m,
              spouseId: m.spouseId || newId,
              spouseIds: currentSpouseIds,
              spouses: currentSpouses
            };
          }
          return m;
        });
      } else if (rel === 'anak' && data.motherId) {
        // Link child into the specific mother's childrenIds on father's spouses record
        updated = updated.map(m => {
          if (m.id === target.id && m.spouses) {
            const updatedSpouses = m.spouses.map(s => {
              if (s.id === data.motherId) {
                return {
                  ...s,
                  childrenIds: [...(s.childrenIds || []), newId]
                };
              }
              return s;
            });
            return { ...m, spouses: updatedSpouses };
          }
          return m;
        });
      }
      return [...updated, newMember];
    });

    setQuickAddModal({ open: false, targetMember: null, relationType: 'anak' });
    setSelectedCardId(newId);
    showNotification(`${newMember.name} (${kinshipTitle}) berhasil ditempatkan secara otomatis!`);
  };

  // Unduh Vektor SVG Asli (100% Tajam Tanpa Pecah - A4 s/d A0)
  const handleDownloadSvgVector = (paperKey: 'A4' | 'A3' | 'A2' | 'A1' | 'A0') => {
    const dim = {
      A4: { w: 2480, h: 3508, mm: '210 x 297 mm' },
      A3: { w: 3508, h: 4960, mm: '297 x 420 mm' },
      A2: { w: 4960, h: 7016, mm: '420 x 594 mm' },
      A1: { w: 7016, h: 9933, mm: '594 x 841 mm' },
      A0: { w: 9933, h: 14040, mm: '841 x 1189 mm' },
    }[paperKey];

    const trahTitle = treeFilter === 'ayah' ? 'TRAH AYAH (KUNINGAN)' : treeFilter === 'ibu' ? 'TRAH IBU (BOGOR)' : 'TRAH BESAR KELUARGA (AYAH & IBU)';

    const svgLines = displayedMembers.map(m => {
      let l = '';
      if (m.spouseId) {
        const sp = displayedMembers.find(s => s.id === m.spouseId);
        if (sp && (m.canvasX ?? 0) <= (sp.canvasX ?? 0)) {
          const x1 = ((m.canvasX ?? 40) + 260) * 1.5 + 100;
          const y1 = ((m.canvasY ?? 40) + 90) * 1.5 + 260;
          const x2 = (sp.canvasX ?? 40) * 1.5 + 100;
          const y2 = ((sp.canvasY ?? 40) + 90) * 1.5 + 260;
          l += `<line x1="${x1}" y1="${y1}" x2="${y2}" stroke="#f59e0b" stroke-width="4" stroke-dasharray="8,6" />`;
        }
      }
      if (m.parentId) {
        const p = displayedMembers.find(pr => pr.id === m.parentId);
        if (p) {
          const px = ((p.canvasX ?? 40) + 130) * 1.5 + 100;
          const py = ((p.canvasY ?? 40) + 170) * 1.5 + 260;
          const cx = ((m.canvasX ?? 40) + 130) * 1.5 + 100;
          const cy = (m.canvasY ?? 40) * 1.5 + 260;
          const my = (py + cy) / 2;
          l += `<path d="M ${px} ${py} C ${px} ${my}, ${cx} ${my}, ${cx} ${cy}" fill="none" stroke="#059669" stroke-width="4" />`;
        }
      }
      return l;
    }).join('\n');

    const svgCards = displayedMembers.map(m => {
      const cx = (m.canvasX ?? 40) * 1.5 + 100;
      const cy = (m.canvasY ?? 40) * 1.5 + 260;
      const num = getMemberNo(m);
      const yearText = getYearRangeDisplay(m);
      const trahColor = m.trah === 'ayah' ? '#1d4ed8' : m.trah === 'ibu' ? '#7e22ce' : '#047857';

      return `
        <g transform="translate(${cx}, ${cy})">
          <rect width="360" height="210" rx="20" fill="#ffffff" stroke="${trahColor}" stroke-width="3" />
          <rect x="0" y="0" width="360" height="42" rx="20" fill="${trahColor}" />
          <rect x="0" y="22" width="360" height="20" fill="${trahColor}" />
          <text x="18" y="27" fill="#ffffff" font-size="16" font-family="monospace" font-weight="bold">${num}</text>
          <text x="342" y="27" fill="#ffffff" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="end">${m.kinshipTitle || m.role}</text>
          
          <circle cx="56" cy="115" r="38" fill="#e2e8f0" stroke="${trahColor}" stroke-width="2" />
          ${m.photo ? `<image href="${m.photo}" x="18" y="77" width="76" height="76" preserveAspectRatio="xMidYMid slice" clip-path="url(#circleClip)" />` : `<text x="56" y="123" font-size="22" font-family="sans-serif" font-weight="bold" fill="#475569" text-anchor="middle">${m.name.slice(0, 2).toUpperCase()}</text>`}
          
          <text x="110" y="85" fill="#0f172a" font-size="18" font-family="sans-serif" font-weight="bold">${m.name}</text>
          <text x="110" y="108" fill="#475569" font-size="14" font-family="sans-serif">${m.binBinti || ''}</text>
          <text x="110" y="132" fill="#047857" font-size="14" font-family="monospace" font-weight="bold">${yearText} (${m.status})</text>
          <text x="110" y="156" fill="#64748b" font-size="13" font-family="sans-serif">📍 ${m.address || m.origin || '-'}</text>
          ${m.phone ? `<text x="110" y="180" fill="#0284c7" font-size="13" font-family="sans-serif">📞 ${m.phone}</text>` : ''}
        </g>
      `;
    }).join('\n');

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim.w} ${dim.h}" width="${dim.w}" height="${dim.h}">
  <defs>
    <clipPath id="circleClip">
      <circle cx="56" cy="115" r="38" />
    </clipPath>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f0fdf4" />
      <stop offset="100%" stopColor="#dcfce7" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${dim.w}" height="${dim.h}" fill="url(#bgGrad)" />
  
  <!-- Royal Ornamental Border -->
  <rect x="30" y="30" width="${dim.w - 60}" height="${dim.h - 60}" rx="25" fill="none" stroke="#047857" stroke-width="8" />
  <rect x="46" y="46" width="${dim.w - 92}" height="${dim.h - 92}" rx="20" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="14,10" />

  <!-- Heritage Header -->
  <g transform="translate(${dim.w / 2}, 100)">
    <text text-anchor="middle" y="0" font-size="28" font-family="serif" font-weight="bold" fill="#b45309" letter-spacing="4">KITAB NASAB &amp; POHON SILSILAH KELUARGA BESAR</text>
    <text text-anchor="middle" y="45" font-size="44" font-family="sans-serif" font-weight="900" fill="#064e3b" letter-spacing="2">${trahTitle}</text>
    <text text-anchor="middle" y="80" font-size="18" font-family="sans-serif" fill="#047857">Format Dokumen Cetak Kertas ${paperKey} (${dim.mm}) • Resolusi Vektor 300 DPI Tajam Tanpa Pecah</text>
    <text text-anchor="middle" y="105" font-size="16" font-family="monospace" fill="#64748b">Dicetak melalui Modul LeluhurQu - Aplikasi WargaQu • ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</text>
  </g>

  <!-- SVG Connection Lines -->
  ${svgLines}

  <!-- Member Cards -->
  ${svgCards}
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Silsilah_LeluhurQu_${paperKey}_Vektor_300DPI.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`Bagan Silsilah Vektor Kertas ${paperKey} (100% Tajam Tanpa Pecah) berhasil diunduh!`);
  };

  // Unduh Gambar PNG HD Upscale (300 DPI)
  const handleDownloadPngUpscale = (paperKey: 'A4' | 'A3' | 'A2' | 'A1' | 'A0') => {
    setIsExporting(true);
    showNotification(`Memproses render skala tinggi Kertas ${paperKey} (300 DPI Ultra Sharp)...`);

    setTimeout(() => {
      try {
        const dim = {
          A4: { w: 2480, h: 3508 },
          A3: { w: 3508, h: 4960 },
          A2: { w: 4200, h: 5940 },
          A1: { w: 5000, h: 7070 },
          A0: { w: 6000, h: 8480 },
        }[paperKey];

        const canvas = document.createElement('canvas');
        canvas.width = dim.w;
        canvas.height = dim.h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No 2d context');

        // Background
        ctx.fillStyle = '#f0fdf4';
        ctx.fillRect(0, 0, dim.w, dim.h);

        // Border
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 10;
        ctx.strokeRect(30, 30, dim.w - 60, dim.h - 60);

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        ctx.setLineDash([16, 12]);
        ctx.strokeRect(48, 48, dim.w - 96, dim.h - 96);
        ctx.setLineDash([]);

        // Header Title
        ctx.fillStyle = '#b45309';
        ctx.font = 'bold 32px serif';
        ctx.textAlign = 'center';
        ctx.fillText('KITAB NASAB & POHON SILSILAH KELUARGA BESAR', dim.w / 2, 110);

        ctx.fillStyle = '#064e3b';
        ctx.font = '900 48px sans-serif';
        const trahTitle = treeFilter === 'ayah' ? 'TRAH AYAH (KUNINGAN)' : treeFilter === 'ibu' ? 'TRAH IBU (BOGOR)' : 'TRAH BESAR KELUARGA (AYAH & IBU)';
        ctx.fillText(trahTitle, dim.w / 2, 170);

        ctx.fillStyle = '#047857';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`Format Dokumen Cetak Kertas ${paperKey} • Resolusi Tinggi 300 DPI Super Tajam`, dim.w / 2, 215);

        // Draw connecting lines
        displayedMembers.forEach(m => {
          if (m.parentId) {
            const p = displayedMembers.find(pr => pr.id === m.parentId);
            if (p) {
              const px = ((p.canvasX ?? 40) + 130) * 1.5 + 100;
              const py = ((p.canvasY ?? 40) + 170) * 1.5 + 280;
              const cx = ((m.canvasX ?? 40) + 130) * 1.5 + 100;
              const cy = (m.canvasY ?? 40) * 1.5 + 280;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.bezierCurveTo(px, (py + cy) / 2, cx, (py + cy) / 2, cx, cy);
              ctx.strokeStyle = '#059669';
              ctx.lineWidth = 4;
              ctx.stroke();
            }
          }
          if (m.spouseId) {
            const sp = displayedMembers.find(s => s.id === m.spouseId);
            if (sp && (m.canvasX ?? 0) <= (sp.canvasX ?? 0)) {
              const x1 = ((m.canvasX ?? 40) + 260) * 1.5 + 100;
              const y1 = ((m.canvasY ?? 40) + 90) * 1.5 + 280;
              const x2 = (sp.canvasX ?? 40) * 1.5 + 100;
              const y2 = ((sp.canvasY ?? 40) + 90) * 1.5 + 280;
              ctx.beginPath();
              ctx.setLineDash([8, 6]);
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 4;
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        });

        // Draw Cards
        displayedMembers.forEach(m => {
          const cx = (m.canvasX ?? 40) * 1.5 + 100;
          const cy = (m.canvasY ?? 40) * 1.5 + 280;
          const trahColor = m.trah === 'ayah' ? '#1d4ed8' : m.trah === 'ibu' ? '#7e22ce' : '#047857';

          // Card Body
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(cx, cy, 360, 210, 20);
          ctx.fill();
          ctx.strokeStyle = trahColor;
          ctx.lineWidth = 3;
          ctx.stroke();

          // Card Header Bar
          ctx.fillStyle = trahColor;
          ctx.beginPath();
          ctx.roundRect(cx, cy, 360, 42, [20, 20, 0, 0]);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(getMemberNo(m), cx + 18, cy + 27);

          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(m.kinshipTitle || m.role, cx + 342, cy + 27);

          // Card Content
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(m.name, cx + 110, cy + 85);

          ctx.fillStyle = '#475569';
          ctx.font = '14px sans-serif';
          ctx.fillText(m.binBinti || '', cx + 110, cy + 110);

          ctx.fillStyle = '#047857';
          ctx.font = 'bold 14px monospace';
          ctx.fillText(`${getYearRangeDisplay(m)} (${m.status})`, cx + 110, cy + 135);

          ctx.fillStyle = '#64748b';
          ctx.font = '13px sans-serif';
          ctx.fillText(`📍 ${m.address || m.origin || '-'}`, cx + 110, cy + 160);

          if (m.phone) {
            ctx.fillStyle = '#0284c7';
            ctx.font = '13px sans-serif';
            ctx.fillText(`📞 ${m.phone}`, cx + 110, cy + 185);
          }

          // Avatar Circle Placeholder
          ctx.beginPath();
          ctx.arc(cx + 56, cy + 115, 38, 0, Math.PI * 2);
          ctx.fillStyle = '#e2e8f0';
          ctx.fill();
          ctx.strokeStyle = trahColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#475569';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.name.slice(0, 2).toUpperCase(), cx + 56, cy + 123);
        });

        canvas.toBlob(blob => {
          if (!blob) throw new Error('Blob creation failed');
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Silsilah_LeluhurQu_${paperKey}_HD_300DPI.png`;
          a.click();
          URL.revokeObjectURL(url);
          showNotification(`Bagan Silsilah PNG HD Kertas ${paperKey} (300 DPI) berhasil diunduh!`);
        }, 'image/png');
      } catch (err) {
        console.error(err);
        showNotification('Gagal membuat file PNG. Mengunduh format Vektor SVG sebagai alternatif yang tajam.');
        handleDownloadSvgVector(paperKey);
      } finally {
        setIsExporting(false);
      }
    }, 400);
  };

  // Filter Deceased Members for Hadhoroh Doa Malam Jumat
  const deceasedMembers = members.filter(m => m.status === 'Almarhum');
  const deceasedAyah = deceasedMembers.filter(m => m.trah === 'ayah' || m.trah === 'inti');
  const deceasedIbu = deceasedMembers.filter(m => m.trah === 'ibu');

  // Generate Hadhoroh Doa Teks siap salin
  const generateHadhorohText = () => {
    const header = `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n*PENGINGAT DOA MALAM JUMAT - HADHOROH LELUHURQU*\n*Trah Besar Hendriana (Kuningan & Bogor)*\n\nIlaa hadhrotin Nabiyyil Musthafa Muhammadin SAW, wa 'alaa aalihi wa ash-habihi ajma'in... Al-Fatihah.\n\nTsumma ilaa arwahi aabaa-inaa wa ummahaatinaa wa ajdaadinaa wa jaddaatinaa (Khusushon Para Leluhur):\n`;

    const daftarAyah = deceasedAyah.map((m, i) => `  ${i + 1}. Almarhum ${m.name} ${m.binBinti || ''} (${m.kinshipTitle || 'Trah Kuningan'})`).join('\n');
    const daftarIbu = deceasedIbu.map((m, i) => `  ${i + 1}. Almarhum/ah ${m.name} ${m.binBinti || ''} (${m.kinshipTitle || 'Trah Bogor'})`).join('\n');

    const footer = `\n\nTsumma ilaa jami'i ahlil qubur minal muslimina wal muslimat wal mu'minina wal mu'minat min masyaariqil ardhi ilaa maghaaribiha... Allahummaghfir lahum, warhamhum, wa 'aafihim, wa'fu 'anhum. Lahumul FAATIHAH. 🤲\n\n(Dibagikan melalui Modul LeluhurQu - Ekosistem WargaQu)`;

    return `${header}\n*JALUR TRAH AYAH (Kuningan):*\n${daftarAyah || '  -'}\n\n*JALUR TRAH IBU (Bogor):*\n${daftarIbu || '  -'}${footer}`;
  };

  const handleCopyHadhoroh = () => {
    const text = generateHadhorohText();
    navigator.clipboard?.writeText(text);
    setHadhorohCopied(true);
    showNotification('Teks Hadhoroh Doa Malam Jumat berhasil disalin ke clipboard!');
    setTimeout(() => setHadhorohCopied(false), 3000);
  };

  const handleShareToWA = () => {
    const text = generateHadhorohText();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const dataBackup = {
      app: 'WargaQu - LeluhurQu Heritage System',
      exportDate: new Date().toISOString(),
      familyHead: 'Hendriana (HQ-2026-001)',
      membersCount: members.length,
      members,
      posts
    };
    const jsonStr = JSON.stringify(dataBackup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Silsilah_LeluhurQu_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('File cadangan silsilah (.json) berhasil diunduh!');
  };

  // Import JSON Backup dengan Analisis Cerdas (Smart Merge & Anti-Konflik)
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.members && Array.isArray(parsed.members)) {
          const incoming = parsed.members as FamilyMember[];

          // Jika silsilah saat ini masih kosong, langsung impor tanpa dialog
          if (members.length === 0) {
            setMembers(incoming);
            if (parsed.posts && Array.isArray(parsed.posts)) {
              setPosts(parsed.posts);
            }
            showNotification(`Berhasil memuat ${incoming.length} data keluarga dari file cadangan!`);
            return;
          }

          // Analisis Data untuk Smart Merge & Deteksi Nama Leluhur yang Sama
          const existingIds = new Set(members.map(m => m.id));
          const existingNameMap = new Map<string, number>();
          members.forEach(m => {
            const cleanName = m.name.trim().toLowerCase();
            existingNameMap.set(cleanName, (existingNameMap.get(cleanName) || 0) + 1);
          });

          let newCount = 0;
          let updateCount = 0;
          const duplicateNames: string[] = [];

          incoming.forEach(inc => {
            if (existingIds.has(inc.id)) {
              updateCount++;
            } else {
              newCount++;
              const cleanName = inc.name.trim().toLowerCase();
              if (existingNameMap.has(cleanName)) {
                if (!duplicateNames.includes(inc.name)) {
                  duplicateNames.push(inc.name);
                }
              }
            }
          });

          setImportPreview({
            incomingMembers: incoming,
            incomingPosts: Array.isArray(parsed.posts) ? parsed.posts : undefined,
            newCount,
            updateCount,
            duplicateNames,
            fileName: file.name
          });
          setShowImportModal(true);
        } else {
          showNotification('Format file JSON tidak sesuai struktur LeluhurQu.');
        }
      } catch {
        showNotification('Gagal membaca file JSON cadangan.');
      }
    };
    reader.readAsText(file);
    // Reset file input agar bisa dipilih kembali jika perlu
    e.target.value = '';
  };

  // Eksekusi Smart Merge: Gabungkan Kerabat Baru Tanpa Menghapus Data Lokal
  const executeSmartMerge = () => {
    if (!importPreview) return;
    try {
      // 1. Simpan auto-backup sebelum merge (Zero Data Loss)
      localStorage.setItem('wargaqu_leluhur_pre_merge_backup', JSON.stringify({
        timestamp: new Date().toISOString(),
        members,
        posts
      }));

      // 2. Gabungkan data anggota
      const memberMap = new Map<string, FamilyMember>();
      members.forEach(m => memberMap.set(m.id, { ...m }));

      importPreview.incomingMembers.forEach(incoming => {
        if (memberMap.has(incoming.id)) {
          // Update data jika ID sama (pertahankan foto/nik lokal jika file cadangan kosong)
          const existing = memberMap.get(incoming.id)!;
          memberMap.set(incoming.id, {
            ...existing,
            ...incoming,
            photo: incoming.photo || existing.photo,
            nik: incoming.nik || existing.nik
          });
        } else {
          // Tambahkan anggota baru
          memberMap.set(incoming.id, incoming);
        }
      });

      const mergedMembers = Array.from(memberMap.values());
      setMembers(mergedMembers);

      // 3. Gabungkan postingan linimasa jika ada
      if (importPreview.incomingPosts && importPreview.incomingPosts.length > 0) {
        const postMap = new Map<string, any>();
        posts.forEach(p => postMap.set(p.id, p));
        importPreview.incomingPosts.forEach(p => {
          if (!postMap.has(p.id)) postMap.set(p.id, p);
        });
        setPosts(Array.from(postMap.values()));
      }

      setShowImportModal(false);
      showNotification(`Alhamdulillah! Berhasil menggabungkan ${importPreview.newCount} anggota baru & ${importPreview.updateCount} data diperbarui tanpa kehilangan data lama.`);
    } catch {
      showNotification('Gagal melakukan penggabungan silsilah.');
    }
  };

  // Eksekusi Gantikan Seluruhnya (Replace Total)
  const executeReplaceAll = () => {
    if (!importPreview) return;
    try {
      // Simpan backup darurat
      localStorage.setItem('wargaqu_leluhur_pre_merge_backup', JSON.stringify({
        timestamp: new Date().toISOString(),
        members,
        posts
      }));

      setMembers(importPreview.incomingMembers);
      if (importPreview.incomingPosts) {
        setPosts(importPreview.incomingPosts);
      }
      setShowImportModal(false);
      showNotification('Seluruh data silsilah berhasil digantikan dengan data dari file cadangan.');
    } catch {
      showNotification('Gagal mengganti data.');
    }
  };

  // Upload pas foto perorangan dengan auto-kompresi canvas
  const handlePhotoUploadForCard = async (cardId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotification('Mengompres pas foto wajah...');
      const compressed = await compressImage(file, 260, 0.82);
      setScannedCards(prev => prev.map(c => (c.id === cardId ? { ...c, photo: compressed } : c)));
      showNotification('Pas foto berhasil dikompres & dipasang!');
    } catch {
      showNotification('Gagal mengompres foto.');
    }
  };

  // Tukar / Geser Urutan Kartu KK
  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= scannedCards.length) return;
    const updated = [...scannedCards];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setScannedCards(updated);
    showNotification(`Posisi kartu ${temp.name} berhasil ditukar! Garis struktur diperbarui.`);
  };

  // Edit Kartu KK langsung
  const handleUpdateCardField = (id: string, field: keyof ScannedKKCard, val: string) => {
    setScannedCards(prev => prev.map(c => (c.id === id ? { ...c, [field]: val } : c)));
  };

  // Geser Urutan Anggota pada Buku Silsilah (tetap terhubung garis)
  const handleShiftMemberOrder = (memberId: string, direction: 'left' | 'right') => {
    const idx = members.findIndex(m => m.id === memberId);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= members.length) return;
    const updated = [...members];
    const item = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = item;
    setMembers(updated);
    showNotification(`Posisi ${item.name} digeser! Garis konektor silsilah otomatis menyesuaikan.`);
  };

  // Tambah baris anggota baru pada kartu Scan KK
  const handleAddNewScannedCard = () => {
    const childNum = scannedCards.filter(c => c.role.toLowerCase().includes('anak')).length + 1;
    const parentName = scannedCards[0]?.name || 'Kepala Keluarga';
    const newCard: ScannedKKCard = {
      id: `kk_manual_${Date.now()}`,
      name: `Anak ke-${childNum}`,
      nickname: '',
      binBinti: `bin/binti ${parentName}`,
      role: `Anak ke-${childNum}`,
      gender: 'L',
      birthDate: '01/01/2020',
      birthYear: '2020',
      address: scannedCards[0]?.address || 'Alamat Keluarga'
    };
    setScannedCards(prev => [...prev, newCard]);
    showNotification(`Baris anggota baru (Anak ke-${childNum}) ditambahkan!`);
  };

  // Hapus baris anggota dari kartu Scan KK
  const handleDeleteScannedCard = (cardId: string) => {
    if (scannedCards.length <= 1) {
      showNotification('Minimal harus ada 1 anggota dalam KK.');
      return;
    }
    setScannedCards(prev => prev.filter(c => c.id !== cardId));
    showNotification('Baris anggota KK berhasil dihapus.');
  };

  // Muat Preset Template KK Siap Pakai
  const handleLoadPresetKK = (key: 'hendriana' | 'ahmad_fauzi' | 'bambang_sutrisno') => {
    setActiveKkPreset(key);
    if (key === 'hendriana') {
      setScannedCards([
        {
          id: 'kk_1',
          name: 'Hendriana',
          nickname: 'Bageur',
          binBinti: 'bin Karta',
          role: 'Kepala Keluarga',
          gender: 'L',
          birthDate: '15/06/1985',
          birthYear: '1985',
          address: 'Nanggerang Indah Residence Blok A No. 12'
        },
        {
          id: 'kk_2',
          name: 'Siti Nurhaliza',
          nickname: 'Neng Siti',
          binBinti: 'binti Suryana',
          role: 'Istri',
          gender: 'P',
          birthDate: '22/09/1988',
          birthYear: '1988',
          address: 'Nanggerang Indah Residence Blok A No. 12'
        },
        {
          id: 'kk_3',
          name: 'Rizky Al-Fathir',
          nickname: 'Iki',
          binBinti: 'bin Hendriana',
          role: 'Anak ke-1',
          gender: 'L',
          birthDate: '10/03/2012',
          birthYear: '2012',
          address: 'Nanggerang Indah Residence Blok A No. 12'
        },
        {
          id: 'kk_4',
          name: 'Nabila Zahra',
          nickname: 'Bila',
          binBinti: 'binti Hendriana',
          role: 'Anak ke-2',
          gender: 'P',
          birthDate: '18/07/2016',
          birthYear: '2016',
          address: 'Nanggerang Indah Residence Blok A No. 12'
        }
      ]);
      showNotification('Template KK Asli: Kel. Hendriana dimuat.');
    } else if (key === 'ahmad_fauzi') {
      setScannedCards([
        {
          id: 'kk_af_1',
          name: 'Drs. H. Ahmad Fauzi',
          nickname: 'Kang Fauzi',
          binBinti: 'bin H. Mansyur',
          role: 'Kepala Keluarga',
          gender: 'L',
          birthDate: '12/04/1982',
          birthYear: '1982',
          address: 'Jl. Melati Raya No. 18, RT 03/RW 04'
        },
        {
          id: 'kk_af_2',
          name: 'Hj. Siti Rahmah',
          nickname: 'Ummi Rahmah',
          binBinti: 'binti H. Sulaeman',
          role: 'Istri',
          gender: 'P',
          birthDate: '05/11/1985',
          birthYear: '1985',
          address: 'Jl. Melati Raya No. 18, RT 03/RW 04'
        },
        {
          id: 'kk_af_3',
          name: 'Muhammad Farhan Fauzi',
          nickname: 'Farhan',
          binBinti: 'bin Ahmad Fauzi',
          role: 'Anak ke-1',
          gender: 'L',
          birthDate: '14/01/2010',
          birthYear: '2010',
          address: 'Jl. Melati Raya No. 18, RT 03/RW 04'
        },
        {
          id: 'kk_af_4',
          name: 'Aisyah Zahra Fauzi',
          nickname: 'Zahra',
          binBinti: 'binti Ahmad Fauzi',
          role: 'Anak ke-2',
          gender: 'P',
          birthDate: '20/08/2015',
          birthYear: '2015',
          address: 'Jl. Melati Raya No. 18, RT 03/RW 04'
        }
      ]);
      showNotification('Template KK Baru: Kel. Drs. H. Ahmad Fauzi dimuat!');
    } else if (key === 'bambang_sutrisno') {
      setScannedCards([
        {
          id: 'kk_bs_1',
          name: 'Bambang Sutrisno, S.T.',
          nickname: 'Mas Bambang',
          binBinti: 'bin Sugeng',
          role: 'Kepala Keluarga',
          gender: 'L',
          birthDate: '08/03/1980',
          birthYear: '1980',
          address: 'Perum Griya Asri Blok C2 No. 05'
        },
        {
          id: 'kk_bs_2',
          name: 'Sri Wahyuni, S.Pd.',
          nickname: 'Mbak Yuni',
          binBinti: 'binti Kartoharjo',
          role: 'Istri',
          gender: 'P',
          birthDate: '19/06/1983',
          birthYear: '1983',
          address: 'Perum Griya Asri Blok C2 No. 05'
        },
        {
          id: 'kk_bs_3',
          name: 'Dimas Pratama',
          nickname: 'Dimas',
          binBinti: 'bin Bambang Sutrisno',
          role: 'Anak ke-1',
          gender: 'L',
          birthDate: '02/05/2009',
          birthYear: '2009',
          address: 'Perum Griya Asri Blok C2 No. 05'
        },
        {
          id: 'kk_bs_4',
          name: 'Putri Anggraini',
          nickname: 'Putri',
          binBinti: 'binti Bambang Sutrisno',
          role: 'Anak ke-2',
          gender: 'P',
          birthDate: '15/10/2013',
          birthYear: '2013',
          address: 'Perum Griya Asri Blok C2 No. 05'
        },
        {
          id: 'kk_bs_5',
          name: 'Bagas Ramadhan',
          nickname: 'Bagas',
          binBinti: 'bin Bambang Sutrisno',
          role: 'Anak ke-3',
          gender: 'L',
          birthDate: '27/04/2019',
          birthYear: '2019',
          address: 'Perum Griya Asri Blok C2 No. 05'
        }
      ]);
      showNotification('Template KK Baru: Kel. Bambang Sutrisno (3 Anak) dimuat!');
    }
  };

  // Buka Modal Kelola Kartu Keluarga (KK) & Anggota
  const handleOpenKkModal = (tab: 'manual' | 'scan' = 'manual') => {
    setKkModalTab(tab);
    setFormNoKk(kkData.noKk || '');
    setFormAlamatKk(kkData.alamat || (mainHead?.address || ''));
    setFormRtRw(kkData.rtRw || '');
    setFormKota(kkData.kabupatenKota || '');
    setFormFotoKeluarga(kkData.fotoKeluarga || null);

    // Populasikan kartu anggota
    if (members.length > 0) {
      const coreMembers = members.filter(m => m.trah === 'inti');
      if (coreMembers.length > 0) {
        const cards: ScannedKKCard[] = coreMembers.map(m => ({
          id: m.id,
          name: m.name,
          nickname: m.nickname || '',
          binBinti: m.binBinti || '',
          nik: m.nik || '',
          role: m.role || (m.relation === 'ayah' ? 'Kepala Keluarga' : m.relation === 'ibu' ? 'Istri' : 'Anak'),
          gender: m.gender,
          birthDate: m.birthDate || '',
          birthYear: m.birthYear || '1990',
          birthPlace: m.birthPlace || m.origin || '',
          status: m.status,
          address: m.address || kkData.alamat || '',
          photo: m.photo
        }));
        setScannedCards(cards);
      } else {
        setScannedCards([
          {
            id: 'card_head_' + Date.now(),
            name: '',
            nickname: '',
            binBinti: '',
            nik: '',
            role: 'Kepala Keluarga',
            gender: 'L',
            birthDate: '',
            birthYear: '1985',
            birthPlace: '',
            status: 'Hidup',
            address: '',
            photo: undefined
          }
        ]);
      }
    } else {
      // Jika masih kosong, siapkan 3 baris kartu anggota kosong
      setScannedCards([
        {
          id: 'card_head_' + Date.now(),
          name: '',
          nickname: '',
          binBinti: '',
          nik: '',
          role: 'Kepala Keluarga',
          gender: 'L',
          birthDate: '',
          birthYear: '1985',
          birthPlace: '',
          status: 'Hidup',
          address: '',
          photo: undefined
        },
        {
          id: 'card_spouse_' + (Date.now() + 1),
          name: '',
          nickname: '',
          binBinti: '',
          nik: '',
          role: 'Istri',
          gender: 'P',
          birthDate: '',
          birthYear: '1988',
          birthPlace: '',
          status: 'Hidup',
          address: '',
          photo: undefined
        },
        {
          id: 'card_child_' + (Date.now() + 2),
          name: '',
          nickname: '',
          binBinti: '',
          nik: '',
          role: 'Anak ke-1',
          gender: 'L',
          birthDate: '',
          birthYear: '2015',
          birthPlace: '',
          status: 'Hidup',
          address: '',
          photo: undefined
        }
      ]);
    }
    setShowScanKKModal(true);
  };

  // Upload Foto Bersama Seluruh Anggota Keluarga (Family Portrait / Selfie Bareng)
  const handleUploadFotoKeluarga = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotification('Mengompres foto bersama keluarga...');
      const compressed = await compressImage(file, 650, 0.85);
      setFormFotoKeluarga(compressed);
      showNotification('Foto bersama keluarga berhasil diunggah!');
    } catch {
      showNotification('Gagal memproses foto keluarga.');
    }
  };

  const handleRemoveFotoKeluarga = () => {
    setFormFotoKeluarga(null);
    showNotification('Foto bersama keluarga dihapus.');
  };

  const toggleShowNik = (cardId: string) => {
    setShowNikMap(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Bersihkan semua data mock & reset ke nol
  const handleClearAllMockData = () => {
    setMembers([]);
    setPosts([]);
    setKkData({
      noKk: '',
      kepalaKeluarga: '',
      alamat: '',
      rtRw: '',
      desaKelurahan: '',
      kecamatan: '',
      kabupatenKota: '',
      kodePos: '',
      fotoKeluarga: undefined
    });
    setScannedCards([]);
    setKkRawPhoto(null);
    try {
      localStorage.removeItem('wargaqu_leluhur_members_v4');
      localStorage.removeItem('wargaqu_leluhur_posts_v4');
      localStorage.removeItem('wargaqu_leluhur_kk_v4');
      localStorage.removeItem('wargaqu_leluhur_members_v3');
      localStorage.removeItem('wargaqu_leluhur_posts_v3');
      localStorage.setItem('wargaqu_leluhur_cleared_mock_v4', 'true');
    } catch (e) {
      console.error(e);
    }
    setShowResetConfirmModal(false);
    showNotification('Semua data silsilah & mock data berhasil dibersihkan! Silsilah kini bersih.');
  };

  // Muat contoh data demo keluarga (Opsional)
  const handleLoadDemoData = () => {
    setMembers(DEMO_MEMBERS);
    setPosts(DEMO_POSTS);
    setKkData({
      noKk: '3201011506850001',
      kepalaKeluarga: 'Hendriana',
      alamat: 'Nanggerang Indah Residence Blok A No. 12',
      rtRw: '003/007',
      desaKelurahan: 'Nanggerang',
      kecamatan: 'Tajurhalang',
      kabupatenKota: 'Bogor',
      kodePos: '16320'
    });
    showNotification('Contoh data silsilah keluarga demo berhasil dimuat.');
  };

  // Simpan Kartu Keluarga (KK) & Anggota ke Pohon Silsilah Utama (SAVE)
  const handleSaveKkAndMembers = () => {
    const validCards = scannedCards.filter(c => c.name.trim().length > 0);
    if (validCards.length === 0) {
      showNotification('Silakan isi minimal 1 nama anggota keluarga (Kepala Keluarga).');
      return;
    }

    const headCard = validCards.find(c => c.role.toLowerCase().includes('kepala') || c.role.toLowerCase().includes('ayah')) || validCards[0];
    const spouseCard = validCards.find(c => (c.role.toLowerCase().includes('istri') || c.role.toLowerCase().includes('ibu')) && c.id !== headCard.id);
    const childCards = validCards.filter(c => c.id !== headCard.id && (!spouseCard || c.id !== spouseCard.id));

    // Simpan Data KK
    const newKkData: KartuKeluarga = {
      ...kkData,
      noKk: formNoKk.trim() || kkData.noKk,
      kepalaKeluarga: headCard.name.trim(),
      alamat: formAlamatKk.trim() || kkData.alamat,
      rtRw: formRtRw.trim() || kkData.rtRw,
      kabupatenKota: formKota.trim() || kkData.kabupatenKota,
      fotoKeluarga: formFotoKeluarga || undefined,
      updatedAt: new Date().toLocaleDateString('id-ID')
    };
    setKkData(newKkData);

    // Sinkronkan ke members silsilah
    setMembers(prev => {
      let updated = [...prev];
      const nonIntiMembers = updated.filter(m => m.trah !== 'inti');

      const headId = headCard.id.startsWith('card_') ? 'head_' + Date.now() : headCard.id;
      const spouseId = spouseCard ? (spouseCard.id.startsWith('card_') ? 'spouse_' + Date.now() : spouseCard.id) : undefined;

      const newChildIds: string[] = [];
      const newChildMembers: FamilyMember[] = childCards.map((c, idx) => {
        const cid = c.id.startsWith('card_') ? `child_${idx + 1}_${Date.now().toString(36)}` : c.id;
        newChildIds.push(cid);
        return {
          id: cid,
          name: c.name.trim(),
          nickname: c.nickname.trim() || undefined,
          binBinti: c.binBinti.trim() || (headCard ? (c.gender === 'L' ? `bin ${headCard.name}` : `binti ${headCard.name}`) : undefined),
          nik: c.nik?.trim() || undefined,
          kinshipTitle: c.role,
          role: c.role,
          relation: 'anak' as const,
          trah: 'inti' as const,
          gender: c.gender,
          birthYear: c.birthYear || '2020',
          birthDate: c.birthDate || undefined,
          birthPlace: c.birthPlace || undefined,
          status: c.status || 'Hidup',
          origin: newKkData.kabupatenKota || 'Bogor',
          address: c.address || newKkData.alamat,
          photo: c.photo
        };
      });

      const headMember: FamilyMember = {
        id: headId,
        name: headCard.name.trim(),
        nickname: headCard.nickname.trim() || undefined,
        binBinti: headCard.binBinti.trim() || undefined,
        nik: headCard.nik?.trim() || undefined,
        kinshipTitle: 'Kepala Keluarga',
        role: 'Ayah / Kepala Keluarga',
        relation: 'ayah' as const,
        trah: 'inti' as const,
        gender: headCard.gender || 'L',
        birthYear: headCard.birthYear || '1985',
        birthDate: headCard.birthDate || undefined,
        birthPlace: headCard.birthPlace || undefined,
        status: headCard.status || 'Hidup',
        origin: newKkData.kabupatenKota || 'Bogor',
        address: newKkData.alamat,
        photo: headCard.photo,
        spouses: spouseCard && spouseId ? [
          {
            id: 'sp_1',
            name: spouseCard.name.trim(),
            nickname: spouseCard.nickname.trim() || undefined,
            binBinti: spouseCard.binBinti.trim() || undefined,
            gender: spouseCard.gender || 'P',
            birthYear: spouseCard.birthYear || '1988',
            status: spouseCard.status || 'Hidup',
            marriageNote: 'Istri Tercatat di KK',
            childrenIds: newChildIds,
            photo: spouseCard.photo
          }
        ] : []
      };

      const newCoreMembers: FamilyMember[] = [headMember];

      if (spouseCard && spouseId) {
        newCoreMembers.push({
          id: spouseId,
          name: spouseCard.name.trim(),
          nickname: spouseCard.nickname.trim() || undefined,
          binBinti: spouseCard.binBinti.trim() || undefined,
          nik: spouseCard.nik?.trim() || undefined,
          kinshipTitle: 'Ibu (Istri)',
          role: spouseCard.role || 'Ibu Rumah Tangga',
          relation: 'ibu' as const,
          trah: 'inti' as const,
          gender: spouseCard.gender || 'P',
          birthYear: spouseCard.birthYear || '1988',
          birthDate: spouseCard.birthDate || undefined,
          birthPlace: spouseCard.birthPlace || undefined,
          status: spouseCard.status || 'Hidup',
          origin: newKkData.kabupatenKota || 'Bogor',
          address: newKkData.alamat,
          photo: spouseCard.photo
        });
      }

      newCoreMembers.push(...newChildMembers);

      return [...newCoreMembers, ...nonIntiMembers];
    });

    setShowScanKKModal(false);
    showNotification('Kartu Keluarga dan foto berhasil disimpan ke silsilah!');
  };

  // Scan KK Simulator dengan Auto-Text Parsing & Auto-Kompresi
  const handleStartScanKK = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0];
    let photoData: string | null = null;
    if (file) {
      try {
        photoData = await compressImage(file, 650, 0.85);
        setKkRawPhoto(photoData);
      } catch (err) {
        console.error(err);
      }
    }
    setIsScanning(true);
    setScanResult(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult(true);

      const timestamp = Date.now();
      const detectedNoKk = `320101${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const detectedAddress = file
        ? `Nanggerang Indah Residence Blok ${String.fromCharCode(65 + Math.floor(Math.random() * 6))} No. ${Math.floor(Math.random() * 30) + 1}`
        : 'Jl. Merpati Indah No. 24, RT 02/RW 05';

      setFormNoKk(detectedNoKk);
      setFormAlamatKk(detectedAddress);
      setFormRtRw('003/007');
      setFormKota('Bogor');

      setScannedCards([
        {
          id: `kk_detected_${timestamp}_1`,
          name: 'Drs. H. Ahmad Fauzi',
          nickname: 'Kang Fauzi',
          binBinti: 'bin H. Mansyur',
          nik: '3201011204820003',
          role: 'Kepala Keluarga',
          gender: 'L',
          birthDate: '12/04/1982',
          birthYear: '1982',
          birthPlace: 'Kuningan',
          status: 'Hidup',
          address: detectedAddress,
          photo: photoData || undefined
        },
        {
          id: `kk_detected_${timestamp}_2`,
          name: 'Hj. Siti Rahmah',
          nickname: 'Ummi Rahmah',
          binBinti: 'binti H. Sulaeman',
          nik: '3201010511850002',
          role: 'Istri',
          gender: 'P',
          birthDate: '05/11/1985',
          birthYear: '1985',
          birthPlace: 'Bogor',
          status: 'Hidup',
          address: detectedAddress
        },
        {
          id: `kk_detected_${timestamp}_3`,
          name: 'Muhammad Farhan Fauzi',
          nickname: 'Farhan',
          binBinti: 'bin Ahmad Fauzi',
          nik: '3201011401100001',
          role: 'Anak ke-1',
          gender: 'L',
          birthDate: '14/01/2010',
          birthYear: '2010',
          birthPlace: 'Bogor',
          status: 'Hidup',
          address: detectedAddress
        },
        {
          id: `kk_detected_${timestamp}_4`,
          name: 'Aisyah Zahra Fauzi',
          nickname: 'Zahra',
          binBinti: 'binti Ahmad Fauzi',
          nik: '3201012008150004',
          role: 'Anak ke-2',
          gender: 'P',
          birthDate: '20/08/2015',
          birthYear: '2015',
          birthPlace: 'Bogor',
          status: 'Hidup',
          address: detectedAddress
        }
      ]);

      // Alihkan ke tab manual agar user bisa langsung cek & pasang foto selfie
      setKkModalTab('manual');
      showNotification('OCR Selesai: Teks KK terbaca! Silakan periksa, edit, pasang foto selfie & klik Simpan.');
    }, 1200);
  };

  // Add Member
  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotification('Silakan isi nama anggota keluarga.');
      return;
    }

    const newEntry: FamilyMember = {
      id: 'fam_' + Date.now(),
      name: formName.trim(),
      nickname: formNickname.trim() || undefined,
      binBinti: formBinBinti.trim() ? (formGender === 'L' ? `bin ${formBinBinti.trim()}` : `binti ${formBinBinti.trim()}`) : undefined,
      kinshipTitle: formKinship,
      role: formRole || formKinship,
      relation: formRelation,
      trah: formTrah,
      gender: formGender,
      birthYear: formBirthYear || '2020',
      deathYear: formStatus === 'Almarhum' ? (formDeathYear || undefined) : undefined,
      status: formStatus,
      origin: formOrigin || undefined,
      notes: formNotes || undefined,
      photo: formPhoto
    };

    setMembers(prev => [...prev, newEntry]);
    setShowAddMemberModal(false);
    // Reset form
    setFormName('');
    setFormNickname('');
    setFormBinBinti('');
    setFormNotes('');
    setFormPhoto(undefined);
    showNotification(`Alhamdulillah, ${newEntry.name} berhasil ditambahkan ke silsilah!`);
  };

  // Like & Comment
  const handleToggleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const nextLiked = !p.isLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likes: nextLiked ? p.likes + 1 : Math.max(0, p.likes - 1)
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;

    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: 'c_' + Date.now(),
                author: 'Hendriana (Bageur)',
                text,
                time: 'Baru saja'
              }
            ]
          };
        }
        return p;
      })
    );
    setCommentInput(prev => ({ ...prev, [postId]: '' }));
    showNotification('Komentar silaturahmi terkirim!');
  };

  const getTrahName = (trah: TrahPostType) => {
    if (trah === 'ayah') return 'Trah Ayah (Kuningan)';
    if (trah === 'ibu') return 'Trah Ibu (Bogor)';
    if (trah === 'pasangan_ayah') return spouseInfo.trahAyahName ? `Trah Ayah Pasangan (${spouseInfo.trahAyahName})` : 'Trah Ayah Pasangan (Sumedang)';
    return spouseInfo.trahIbuName ? `Trah Ibu Pasangan (${spouseInfo.trahIbuName})` : 'Trah Ibu Pasangan (Bandung)';
  };

  const getTrahShortName = (trah: TrahPostType) => {
    if (trah === 'ayah') return 'Trah Ayah';
    if (trah === 'ibu') return 'Trah Ibu';
    if (trah === 'pasangan_ayah') return 'Trah Ayah Pasangan';
    return 'Trah Ibu Pasangan';
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    const authorDisplayName = currentUser?.name || 'Hendriana (Bageur)';
    const initials = authorDisplayName
      .split(' ')
      .filter(Boolean)
      .map(p => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'HB';

    const avatarColor =
      activeMedsosTrah === 'ayah' ? 'bg-blue-700' :
      activeMedsosTrah === 'ibu' ? 'bg-purple-700' :
      activeMedsosTrah === 'pasangan_ayah' ? 'bg-emerald-700' : 'bg-rose-700';

    const newPost: PostItem = {
      id: 'post-' + Date.now(),
      authorName: authorDisplayName,
      authorRole: 'Kepala Keluarga',
      trah: activeMedsosTrah,
      trahName: getTrahName(activeMedsosTrah),
      category: newPostCategory,
      timeAgo: 'Baru saja',
      content: newPostText.trim(),
      avatarColor,
      initials,
      likes: 1,
      isLiked: true,
      comments: []
    };

    setPosts(prev => [newPost, ...prev]);
    setNewPostText('');
    showNotification(`Postingan baru berhasil dibagikan di ${newPost.trahName}!`);
  };

  // Anggota Pokok Keluarga Inti (Dinamis dari state members)
  const mainHead = members.find(m => m.trah === 'inti' && (m.relation === 'ayah' || m.role?.toLowerCase().includes('kepala'))) || members.find(m => m.id === '1') || members[0];
  const mainSpouse = members.find(m => m.trah === 'inti' && (m.relation === 'ibu' || m.role?.toLowerCase().includes('istri'))) || members.find(m => m.id === '2');
  const mainChildren = members.filter(m => m.trah === 'inti' && m.relation === 'anak');

  // Filtered members for Tree View (Semua 4 Trah, Trah Ayah, Trah Ibu, Trah Ayah Pasangan, Trah Ibu Pasangan)
  const displayedMembers = members.filter(m => {
    if (treeFilter === 'all') return true;
    if (treeFilter === 'ayah') return m.trah === 'ayah' || m.trah === 'inti';
    if (treeFilter === 'ibu') return m.trah === 'ibu' || m.trah === 'inti';
    if (treeFilter === 'pasangan_ayah') return m.trah === 'pasangan_ayah' || m.trah === 'inti';
    if (treeFilter === 'pasangan_ibu') return m.trah === 'pasangan_ibu' || m.trah === 'inti';
    return true;
  });

  return (
    <div className="w-full h-full bg-[#f0fdf4] font-sans antialiased flex flex-col relative select-none overflow-hidden text-slate-800">
      {/* TOP HEADER BAR (WARGAQU EMERALD SIGNATURE PALETTE) */}
      <header className="bg-gradient-to-r from-[#047857] via-[#059669] to-[#047857] text-white px-3 sm:px-4 pt-10 sm:pt-11 pb-3 flex justify-between items-center shadow-md z-30 shrink-0 android-header-safe">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBackToWarga}
            className="p-1.5 -ml-1 text-emerald-100 hover:text-white hover:bg-emerald-800/60 rounded-xl transition active:scale-95"
            title="Kembali ke Beranda WargaQu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* TOMBOL MENU DRAWER KIRI (HIDDEN SIDEBAR) */}
          <button
            onClick={() => setShowLeftSidebar(true)}
            className="p-1.5 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-400/40 text-emerald-100 hover:text-white rounded-xl transition active:scale-95 flex items-center justify-center gap-1 shadow-xs"
            title="Buka Menu Silsilah &amp; Fitur (Sidebar Kiri)"
          >
            <Menu className="w-5 h-5 text-[#5eead4]" />
            <span className="text-[11px] font-bold text-white hidden xs:inline pr-1">Menu</span>
          </button>

          <div className="w-9 h-9 bg-emerald-950/40 border border-emerald-300/40 rounded-xl flex items-center justify-center text-[#5eead4] shadow-xs">
            <GitFork className="w-5 h-5 rotate-180" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base tracking-wide leading-tight text-white">
                Leluhur<span className="text-[#5eead4]">Qu</span>
              </h1>
              <span className="text-[9px] bg-emerald-950/40 text-[#5eead4] border border-emerald-400/40 px-1.5 py-0.2 rounded font-mono font-bold">
                Nasab &amp; Medsos
              </span>
            </div>
            <button
              onClick={() => setShowCloudModal(true)}
              className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-100 hover:text-white transition active:scale-95 group"
              title="Status Cloud Sync Realtime Silsilah Keluarga (Klik untuk Kelola)"
            >
              <span className={`w-2 h-2 rounded-full ${isCloudSyncing ? 'bg-amber-400 animate-ping' : cloudSyncStatus === 'connected' ? 'bg-[#5eead4] animate-pulse' : 'bg-slate-300'}`}></span>
              <span className="font-semibold">{isCloudSyncing ? 'Syncing...' : 'Cloud Realtime'}</span>
              <span className="text-[9px] bg-emerald-950/50 text-[#5eead4] px-1 rounded font-mono truncate max-w-[72px]">
                {cloudTreeId.slice(0, 10)}
              </span>
            </button>
          </div>
        </div>

        {/* TOP RIGHT: Buka Menu & Fitur Silsilah (4 Ikon telah dipindahkan ke Sidebar Kiri) */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowLeftSidebar(true)}
            className="bg-emerald-950/40 hover:bg-emerald-950/70 active:scale-95 text-white border border-emerald-400/40 text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
            title="Buka Menu Silsilah &amp; Fitur (Sidebar Kiri)"
          >
            <Menu className="w-4 h-4 text-[#5eead4]" />
            <span className="text-[11px] font-bold text-white hidden sm:inline">Fitur Silsilah</span>
          </button>
        </div>
      </header>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-3.5 space-y-3.5 pb-24">

        {/* TAB 1: SILSILAHQU (KOMA & FILTER EXCEL) */}
        {activeTab === 'isicepat' && (
          <IsiCepatSilsilahView
            members={members}
            setMembers={setMembers}
            showNotification={showNotification}
            currentUser={currentUser}
            externalViewMode={silsilahViewMode}
            onViewModeChange={setSilsilahViewMode}
          />
        )}

        {/* TAB 2: MEDSOS TRAH (FEED 2 JALUR AYAH VS IBU) */}
        {activeTab === 'medsos' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Sub-tab Jalur Trah (Dinamis: 2 Trah atau 4 Trah Pasangan) */}
            <div className={`grid ${isSpouseConnected ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'} bg-emerald-100/70 p-1.5 rounded-2xl border border-emerald-200 gap-1.5`}>
              <button
                onClick={() => setActiveMedsosTrah('ayah')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                  activeMedsosTrah === 'ayah'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-blue-900 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <span>👨 Trah Ayah</span>
              </button>
              <button
                onClick={() => setActiveMedsosTrah('ibu')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                  activeMedsosTrah === 'ibu'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-900 hover:text-purple-700 hover:bg-purple-50'
                }`}
              >
                <span>👩 Trah Ibu</span>
              </button>
              {isSpouseConnected && (
                <>
                  <button
                    onClick={() => setActiveMedsosTrah('pasangan_ayah')}
                    className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                      activeMedsosTrah === 'pasangan_ayah'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-emerald-900 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <span>🧔 Ayah Pasangan</span>
                  </button>
                  <button
                    onClick={() => setActiveMedsosTrah('pasangan_ibu')}
                    className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                      activeMedsosTrah === 'pasangan_ibu'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'text-rose-900 hover:text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <span>🧕 Ibu Pasangan</span>
                  </button>
                </>
              )}
            </div>

            {/* Header Informasi Linimasa Trah Aktif */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${
              activeMedsosTrah === 'ayah' ? 'bg-blue-50/80 border-blue-200 text-blue-900' :
              activeMedsosTrah === 'ibu' ? 'bg-purple-50/80 border-purple-200 text-purple-900' :
              activeMedsosTrah === 'pasangan_ayah' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' :
              'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                  activeMedsosTrah === 'ayah' ? 'bg-blue-600' :
                  activeMedsosTrah === 'ibu' ? 'bg-purple-600' :
                  activeMedsosTrah === 'pasangan_ayah' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {activeMedsosTrah === 'ayah' ? '👨' : activeMedsosTrah === 'ibu' ? '👩' : activeMedsosTrah === 'pasangan_ayah' ? '🧔' : '🧕'}
                </div>
                <div>
                  <h3 className="font-extrabold text-xs">Linimasa Medsos {getTrahName(activeMedsosTrah)}</h3>
                  <p className="text-[10px] opacity-80 leading-tight">
                    Khusus keluarga jalur ini • Terpisah dari Trah lain &amp; modul RT WargaQu
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setInviteTrahTarget(activeMedsosTrah);
                  setShowShareModal(true);
                }}
                className="bg-white/80 hover:bg-white px-2 py-1 rounded-lg text-[10px] font-bold border border-current shadow-2xs transition active:scale-95 flex items-center gap-1 shrink-0"
                title="Bagikan undangan khusus untuk Trah ini"
              >
                <Share2 className="w-3 h-3" />
                <span>Undang</span>
              </button>
            </div>

            {/* Input Form Berbagi Cerita / Sejarah / Foto Jadul */}
            <form onSubmit={handleCreatePost} className="bg-white border border-emerald-100 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                    activeMedsosTrah === 'ayah' ? 'bg-blue-700' :
                    activeMedsosTrah === 'ibu' ? 'bg-purple-700' :
                    activeMedsosTrah === 'pasangan_ayah' ? 'bg-emerald-700' : 'bg-rose-700'
                  }`}>
                    {(currentUser?.name || 'HB').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Bagikan ke {getTrahName(activeMedsosTrah)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{currentUser?.name || 'Hendriana (Bageur)'}</span>
                  </div>
                </div>

                {/* Category Picker */}
                <select
                  value={newPostCategory}
                  onChange={e => setNewPostCategory(e.target.value as any)}
                  className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value="Kisah Sejarah">Kisah Sejarah</option>
                  <option value="Foto Jadul">Foto Jadul</option>
                  <option value="Agenda Arisan">Agenda Arisan</option>
                  <option value="Kabar Keluarga">Kabar Keluarga</option>
                </select>
              </div>

              <textarea
                value={newPostText}
                onChange={e => setNewPostText(e.target.value)}
                placeholder={`Bagikan arsip cerita, sejarah leluhur, atau agenda arisan untuk ${getTrahName(activeMedsosTrah)}...`}
                rows={2}
                className="w-full bg-[#f0fdf4] border border-emerald-200/80 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 resize-none"
              />

              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-slate-400 italic">
                  Hanya terlihat oleh keluarga {getTrahName(activeMedsosTrah)}
                </span>
                <button
                  type="submit"
                  disabled={!newPostText.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-bold px-4 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim</span>
                </button>
              </div>
            </form>

            {/* Linimasa Postingan */}
            <div className="space-y-3">
              {posts.filter(p => p.trah === activeMedsosTrah).length === 0 && (
                <div className="bg-white border border-dashed border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Belum Ada Postingan di {getTrahName(activeMedsosTrah)}</h4>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                    Jadilah yang pertama berbagi kisah sejarah, foto jadul, atau agenda arisan untuk keluarga besar jalur ini.
                  </p>
                </div>
              )}

              {posts.filter(p => p.trah === activeMedsosTrah).map(post => (
                <div
                  key={post.id}
                  className="bg-white border border-emerald-100 rounded-2xl p-4 space-y-2.5 shadow-sm"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-8 h-8 ${post.avatarColor} rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs`}>
                        {post.initials}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {post.authorName}{' '}
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({post.authorRole})
                          </span>
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {post.timeAgo} • {post.trahName}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                      {post.category}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-50 text-xs text-slate-500">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center space-x-1.5 transition active:scale-95 ${
                        post.isLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                      <span>{post.likes} Suka</span>
                    </button>

                    <button
                      onClick={() => setOpenCommentBox(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="hover:text-emerald-700 flex items-center space-x-1.5 transition active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length} Komentar</span>
                    </button>
                  </div>

                  {/* Comment Section */}
                  {openCommentBox[post.id] && (
                    <div className="pt-2 border-t border-emerald-50 space-y-2 animate-in fade-in duration-150">
                      {post.comments.length > 0 && (
                        <div className="space-y-1.5 bg-[#f0fdf4] p-2.5 rounded-xl border border-emerald-100">
                          {post.comments.map(c => (
                            <div key={c.id} className="text-[11px] leading-tight">
                              <span className="font-bold text-emerald-800 mr-1.5">{c.author}:</span>
                              <span className="text-slate-700">{c.text}</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">{c.time}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={commentInput[post.id] || ''}
                          onChange={e => setCommentInput(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Tulis balasan silaturahmi..."
                          className="flex-1 bg-[#f0fdf4] border border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                        >
                          Balas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FITUR KHUSUS "KIRIM DOA (AL-FATIHAH) MALAM JUMAT" */}
        {activeTab === 'doa' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Header Pengingat Malam Jumat Banner */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden border border-emerald-600/40">
              <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-1">
                <Moon className="w-4 h-4 text-amber-300" />
                <span>Pengingat Khusus • Doa Leluhur Malam Jumat</span>
              </div>
              <h3 className="font-bold text-base leading-tight">
                Kirim Al-Fatihah &amp; Hadhoroh Leluhur
              </h3>
              <p className="text-xs text-emerald-100 leading-relaxed mt-1">
                Otomatis menyusun daftar para leluhur yang telah wafat lengkap dengan nama bin/binti untuk dikirimkan doa bersama ke grup WhatsApp keluarga besar.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-emerald-950/60 text-[#5eead4] border border-emerald-500/40 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  {deceasedMembers.length} Leluhur Tercatat Wafat
                </span>
                <span className="text-[10px] text-emerald-200 font-mono">
                  Malam Jumat Barokah
                </span>
              </div>
            </div>

            {/* Preview Teks Hadhoroh Siap Salin */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 space-y-3">
              <div className="flex justify-between items-center border-b border-emerald-50 pb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-700" />
                  <span>Draf Teks Hadhoroh Siap Salin</span>
                </h4>
                <span className="text-[10px] text-emerald-700 font-bold font-mono">Lengkap Bin / Binti</span>
              </div>

              {/* Teks Box Preformatted */}
              <div className="bg-[#f0fdf4] border border-emerald-200/80 rounded-xl p-3 text-xs text-slate-800 font-mono leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                {generateHadhorohText()}
              </div>

              {/* Action Buttons: Copy & Kirim WA */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleCopyHadhoroh}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition active:scale-98"
                >
                  <Copy className="w-4 h-4" />
                  <span>{hadhorohCopied ? 'Tersalin!' : 'Salin Teks Doa'}</span>
                </button>

                <button
                  onClick={handleShareToWA}
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition active:scale-98"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim ke WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Daftar Leluhur Wafat yang Didokan */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Daftar Leluhur Almarhum &amp; Almarhumah
              </h4>
              <div className="space-y-2">
                {deceasedMembers.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">
                          {m.name} <span className="font-normal text-slate-500 font-mono">{m.binBinti}</span>
                        </h5>
                        <p className="text-[10px] text-slate-500">
                          {m.kinshipTitle} • {getYearRangeDisplay(m)} • {m.origin}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Al-Fatihah 🤲
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ARSIP & BUKU (PDF HERITAGE, BACKUP JSON & GAMBAR) */}
        {activeTab === 'arsip' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Kartu Cetak Buku Silsilah PDF */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white rounded-2xl p-4 shadow-md space-y-2.5 border border-emerald-500/40">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm">Buku Silsilah (PDF Heritage Edition)</h3>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Cetak dokumen silsilah keluarga besar 2 Model (Foto Sendiri atau Keluarga Kompak) dengan pilihan kertas dari A4 hingga A0 super tajam.
              </p>
              <button
                onClick={() => setShowPdfModal(true)}
                className="w-full bg-white text-emerald-900 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow transition active:scale-98"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>Buka Pratinjau &amp; Opsi Cetak Kertas (A4 - A0)</span>
              </button>
            </div>

            {/* Offline-first Backup & Restore JSON */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 space-y-3">
              <div className="flex items-center space-x-2 border-b border-emerald-50 pb-2">
                <Archive className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Cadangan &amp; Pemulihan Data (Offline-First)
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seluruh data tersimpan secara lokal dan aman di perangkat Anda. Simpan file cadangan .JSON untuk diarsipkan atau dibagikan ke saudara keluarga besar.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleExportJSON}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 shadow-xs transition active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor Backup JSON</span>
                </button>

                <label className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition active:scale-98 text-center">
                  <Upload className="w-4 h-4" />
                  <span>Impor Backup JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Bagikan Undangan Keluarga Besar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 space-y-2.5">
              <div className="flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Undang Kerabat Keluarga Besar
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ajak paman, bibi, sepupu, dan kerabat trah Kuningan &amp; Bogor untuk bersama-sama melengkapi pohon silsilah keluarga kita.
              </p>
              <button
                onClick={() => setShowShareModal(true)}
                className="w-full bg-[#f0fdf4] hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition active:scale-98"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan Tautan Undangan Silaturahmi</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR KHUSUS LELUHURQU (WARGAQU EMERALD SIGNATURE THEME) */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 px-3 pt-2 pb-6 sm:pb-7 flex justify-around items-center z-40 shadow-xl android-navbar-safe">
        {/* Tab 1: SilsilahQu (Format Koma & Excel) */}
        <button
          onClick={() => setActiveTab('isicepat')}
          className={`flex flex-col items-center gap-1 transition active:scale-95 ${
            activeTab === 'isicepat' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-emerald-700 font-medium'
          }`}
          title="SilsilahQu (Format Koma & Filter Excel)"
        >
          <div className="relative">
            <Sparkles className={`w-5 h-5 ${activeTab === 'isicepat' ? 'text-emerald-700' : 'text-slate-400'}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
          </div>
          <span className="text-[10px]">SilsilahQu</span>
        </button>

        {/* Tab 2: Medsos Trah */}
        <button
          onClick={() => setActiveTab('medsos')}
          className={`flex flex-col items-center gap-1 transition active:scale-95 ${
            activeTab === 'medsos' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-emerald-700 font-medium'
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'medsos' ? 'text-emerald-700' : 'text-slate-400'}`} />
          <span className="text-[10px]">Medsos Trah</span>
        </button>

        {/* Tab 3: Doa Leluhur (Malam Jumat) */}
        <button
          onClick={() => setActiveTab('doa')}
          className={`flex flex-col items-center gap-1 transition active:scale-95 relative ${
            activeTab === 'doa' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-emerald-700 font-medium'
          }`}
        >
          <div className="relative">
            <Moon className={`w-5 h-5 ${activeTab === 'doa' ? 'text-emerald-700' : 'text-slate-400'}`} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
          </div>
          <span className="text-[10px]">Doa Leluhur</span>
        </button>

        {/* Tab 4: Arsip & Buku */}
        <button
          onClick={() => setActiveTab('arsip')}
          className={`flex flex-col items-center gap-1 transition active:scale-95 ${
            activeTab === 'arsip' ? 'text-emerald-700 font-bold' : 'text-slate-400 hover:text-emerald-700 font-medium'
          }`}
        >
          <Archive className={`w-5 h-5 ${activeTab === 'arsip' ? 'text-emerald-700' : 'text-slate-400'}`} />
          <span className="text-[10px]">Arsip &amp; Buku</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* HIDDEN LEFT SIDEBAR DRAWER (DRAWER SAMPING KIRI) */}
      {/* Berisi 4 Ikon Utama: Print, Camera KK, Buku Silsilah, Bersihkan Mock */}
      {/* ========================================================================= */}
      {showLeftSidebar && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop Dim */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setShowLeftSidebar(false)}
          />

          {/* Drawer Sidebar Container */}
          <aside className="relative w-[85%] max-w-[340px] bg-slate-900 text-white shadow-2xl flex flex-col h-full border-r border-emerald-500/30 z-10 animate-in slide-in-from-left duration-200">
            {/* Header Drawer */}
            <div className="p-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 border-b border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-emerald-950 border border-emerald-400/40 rounded-xl flex items-center justify-center text-[#5eead4] shadow-xs">
                  <GitFork className="w-5 h-5 rotate-180" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide text-white flex items-center gap-1.5">
                    Leluhur<span className="text-[#5eead4]">Qu</span>
                  </h3>
                  <p className="text-[10px] text-emerald-300/80 font-medium">Menu &amp; Pusat Fitur Silsilah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLeftSidebar(false)}
                className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 no-scrollbar">
              {/* Section 1: AKSI & FITUR SILSILAH (Dipindahkan dari Card Isi Cepat & Header) */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2 px-1 flex items-center justify-between">
                  <span>Aksi &amp; Fitur Silsilah</span>
                  <span className="text-[9px] bg-emerald-500/20 text-[#5eead4] px-1.5 py-0.5 rounded font-mono">Utama</span>
                </div>
                <div className="space-y-2">
                  {/* 1. Pratinjau Pohon & Cetak (PCB Engine) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setActiveTab('isicepat');
                      setSilsilahViewMode('preview_tree');
                    }}
                    className="w-full text-left p-2.5 rounded-2xl bg-slate-800/90 hover:bg-emerald-950/70 border border-emerald-500/30 hover:border-emerald-400/70 flex items-center gap-3 transition group cursor-pointer shadow-xs active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-xs group-hover:scale-105 transition">
                      <Printer className="w-5 h-5 text-slate-950" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-white group-hover:text-amber-300 flex items-center justify-between">
                        <span>🌳 Pratinjau Pohon &amp; Cetak</span>
                        <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">PCB</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">4 Skin Bagan, Jalur 90°, Skala Kertas</p>
                    </div>
                  </button>

                  {/* 2. Muat Contoh Skenario (Santa -> madgani -> Samud -> maman, Ian, Hendri) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setMembers(DEMO_SANTA_MEMBERS);
                      setActiveTab('isicepat');
                      setSilsilahViewMode('editor');
                      showNotification('Contoh silsilah (Santa → madgani → Samud → maman, Ian, Hendri) berhasil dimuat!');
                    }}
                    className="w-full text-left p-2.5 rounded-2xl bg-slate-800/90 hover:bg-emerald-950/70 border border-amber-500/30 hover:border-amber-400/70 flex items-center gap-3 transition group cursor-pointer shadow-xs active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-xs group-hover:scale-105 transition">
                      <Sparkles className="w-5 h-5 text-slate-950" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-white group-hover:text-amber-300 flex items-center justify-between">
                        <span>⚡ Contoh Santa &rarr; Samud</span>
                        <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">Demo</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Santa &rarr; madgani &rarr; Samud &rarr; maman</p>
                    </div>
                  </button>

                  {/* 3. (+) Tokoh / Leluhur Baru */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setShowAddMemberModal(true);
                    }}
                    className="w-full text-left p-2.5 rounded-2xl bg-slate-800/90 hover:bg-emerald-950/70 border border-emerald-500/30 hover:border-emerald-400/70 flex items-center gap-3 transition group cursor-pointer shadow-xs active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs group-hover:scale-105 transition">
                      <Plus className="w-5 h-5 text-[#5eead4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-white group-hover:text-emerald-300 flex items-center justify-between">
                        <span>(+) Tokoh / Leluhur Baru</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">+Baru</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Tambah akar nasab / tokoh silsilah</p>
                    </div>
                  </button>

                  {/* 4. Kelola Kartu Keluarga & Scan Kamera */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      handleOpenKkModal('manual');
                    }}
                    className="w-full text-left p-2.5 rounded-2xl bg-slate-800/90 hover:bg-emerald-950/70 border border-emerald-500/30 hover:border-emerald-400/70 flex items-center gap-3 transition group cursor-pointer shadow-xs active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs group-hover:scale-105 transition">
                      <Camera className="w-5 h-5 text-[#5eead4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-white group-hover:text-emerald-300 flex items-center justify-between">
                        <span>Kelola KK &amp; Scan Kamera</span>
                        <span className="text-[9px] bg-teal-500/20 text-[#5eead4] px-1.5 py-0.2 rounded font-mono font-bold">KK</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Input manual KK &amp; scan dokumen foto</p>
                    </div>
                  </button>

                  {/* 5. Buku Silsilah Heritage (A4 - A0) */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setShowPdfModal(true);
                    }}
                    className="w-full text-left p-2.5 rounded-2xl bg-slate-800/90 hover:bg-emerald-950/70 border border-emerald-500/30 hover:border-emerald-400/70 flex items-center gap-3 transition group cursor-pointer shadow-xs active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs group-hover:scale-105 transition">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-white group-hover:text-blue-300 flex items-center justify-between">
                        <span>Buku Silsilah Heritage</span>
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono font-bold">A4-A0</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Buku arsip nasab keluarga &amp; banner trah</p>
                    </div>
                  </button>

                  {/* 6. Bersihkan / Reset Mock Data */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setShowResetConfirmModal(true);
                    }}
                    className="w-full text-left p-2.5 rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 hover:border-rose-400/50 flex items-center gap-3 transition group cursor-pointer shadow-xs active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-900/60 text-rose-300 flex items-center justify-center shrink-0 font-bold shadow-xs group-hover:scale-105 transition">
                      <Trash2 className="w-5 h-5 text-rose-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-rose-200 group-hover:text-rose-100 flex items-center justify-between">
                        <span>Bersihkan Mock Data</span>
                        <span className="text-[9px] bg-rose-900/40 text-rose-300 px-1.5 py-0.2 rounded font-mono font-bold">Reset</span>
                      </div>
                      <p className="text-[10px] text-rose-300/70 mt-0.5">Kosongkan data demo &amp; mulai data murni</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Section 2: KONEKSI KELUARGA & TRAH (Dipindahkan dari Card Ruang Privat) */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2 px-1 flex items-center justify-between">
                  <span>Koneksi Keluarga &amp; Trah</span>
                  <span className="text-[9px] bg-emerald-500/20 text-[#5eead4] px-1.5 py-0.5 rounded font-mono">Privat</span>
                </div>
                <div className="space-y-2">
                  {/* Tombol Undang Keluarga Besar */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setInviteTrahTarget('ayah');
                      setShowShareModal(true);
                    }}
                    className="w-full text-left p-2.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-950/90 border border-emerald-500/40 hover:border-emerald-400/70 flex items-center gap-3 transition group cursor-pointer shadow-xs active:scale-98"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold shadow-xs group-hover:scale-105 transition">
                      <Share2 className="w-5 h-5 text-[#5eead4]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-white group-hover:text-emerald-300 flex items-center justify-between">
                        <span>Undang Keluarga Besar</span>
                        <span className="text-[9px] bg-emerald-500/30 text-[#5eead4] px-1.5 py-0.2 rounded font-mono font-bold">Share</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Bagikan tautan silaturahmi per-Trah</p>
                    </div>
                  </button>

                  {/* Tombol Atur Koneksi Pasangan / 4 Trah Aktif */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setShowSpouseModal(true);
                    }}
                    className={`w-full text-left p-2.5 rounded-2xl border flex items-center gap-3 transition group cursor-pointer shadow-xs active:scale-98 ${
                      isSpouseConnected
                        ? 'bg-amber-950/40 hover:bg-amber-950/70 border-amber-400/50'
                        : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-xs group-hover:scale-105 transition ${
                      isSpouseConnected ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-200'
                    }`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-white group-hover:text-amber-300 flex items-center justify-between">
                        <span>{isSpouseConnected ? '✨ 4 Trah Pasangan Aktif' : '👥 2 Trah Aktif'}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          isSpouseConnected ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {isSpouseConnected ? '4 Trah' : '2 Trah'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isSpouseConnected ? 'Trah Ayah & Ibu Anda + Pasangan' : 'Klik untuk hubungkan trah pasangan'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Section 2: NAVIGASI MENU LELUHURQU */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Navigasi Menu
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setActiveTab('isicepat');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'isicepat'
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>SilsilahQu (Koma &amp; Excel)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setActiveTab('medsos');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'medsos'
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Medsos Trah (Silaturahmi)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setActiveTab('doa');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'doa'
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Moon className="w-4 h-4 text-amber-400" />
                      <span>Doa Leluhur (Malam Jumat)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setActiveTab('arsip');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold transition cursor-pointer ${
                      activeTab === 'arsip'
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Archive className="w-4 h-4 text-teal-400" />
                      <span>Arsip &amp; Ekspor Silsilah</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Section 3: RINGKASAN TRAH & CLOUD */}
              <div className="bg-slate-950/70 border border-emerald-500/20 rounded-2xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status Silsilah</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLeftSidebar(false);
                      setShowCloudModal(true);
                    }}
                    className="text-[10px] text-[#5eead4] hover:underline font-mono cursor-pointer"
                  >
                    Kelola Cloud &rarr;
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isCloudSyncing ? 'bg-amber-400 animate-ping' : cloudSyncStatus === 'connected' ? 'bg-[#5eead4]' : 'bg-slate-500'}`} />
                  <span className="text-white font-medium text-xs">
                    {isCloudSyncing ? 'Sedang Sinkronisasi...' : cloudSyncStatus === 'connected' ? 'Tersambung Cloud Realtime' : 'Mode Offline / Lokal'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Total Anggota:</span>
                  <span className="text-emerald-300 font-bold">{members.length} Jiwa</span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowLeftSidebar(false);
                  onBackToWarga();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Beranda WargaQu</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SCAN KK AUTO-TEXT + KARTU NAMA/ALAMAT/TGL LAHIR + PAS FOTO + MINI STRUKTUR */}
      {/* ========================================================================= */}
      {showScanKKModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3 shadow-2xl relative border border-emerald-100 text-slate-800 max-h-[92vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-emerald-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Kelola Kartu Keluarga (KK) &amp; Anggota</h3>
                  <p className="text-[10px] text-emerald-700 font-bold">Manual / Scan Foto KK • Selfie Bersama • Pas Foto Wajah</p>
                </div>
              </div>
              <button
                onClick={() => setShowScanKKModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR: MANUAL INPUT VS SCAN FOTO KK */}
            <div className="grid grid-cols-2 gap-1.5 bg-emerald-100/70 p-1 rounded-xl border border-emerald-200 text-xs">
              <button
                type="button"
                onClick={() => setKkModalTab('manual')}
                className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  kkModalTab === 'manual'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-emerald-900 hover:text-emerald-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Input / Edit Manual</span>
              </button>
              <button
                type="button"
                onClick={() => setKkModalTab('scan')}
                className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  kkModalTab === 'scan'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-emerald-900 hover:text-emerald-700'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Foto Dokumen</span>
              </button>
            </div>

            {/* Body Scrollable */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3.5 pr-0.5">

              {/* TAB 2: SCAN FOTO DOKUMEN KK */}
              {kkModalTab === 'scan' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Box Upload / Kamera KK */}
                  <div className="bg-[#f0fdf4] border-2 border-dashed border-emerald-300 rounded-xl p-3 text-center space-y-2">
                    {kkRawPhoto ? (
                      <div className="relative rounded-lg overflow-hidden max-h-32 mx-auto">
                        <img src={kkRawPhoto} alt="Hasil Scan KK" className="w-full h-full object-cover rounded-lg" />
                        <span className="absolute bottom-1 right-1 bg-emerald-950/80 text-[#5eead4] text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                          Terscan &amp; Terkompres
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <FileText className="w-8 h-8 text-emerald-600 mx-auto" />
                        <p className="text-xs font-bold text-slate-800">Ambil Foto / Pilih Berkas Kartu Keluarga</p>
                        <p className="text-[10px] text-slate-500">Auto-deteksi baris nama, tanggal lahir, dan alamat</p>
                      </div>
                    )}

                    <div className="flex justify-center gap-2 pt-1">
                      <label className="bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 shadow-xs transition">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Kamera HP</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleStartScanKK}
                          className="hidden"
                        />
                      </label>
                      <label className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Dari Galeri</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStartScanKK}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Status OCR Scanner */}
                  {isScanning && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                      <Sparkles className="w-5 h-5 text-emerald-600 mx-auto animate-spin" />
                      <p className="text-xs font-bold text-emerald-800">Membaca Teks Dokumen KK...</p>
                      <p className="text-[10px] text-slate-500">Mengekstraksi baris nama, alamat &amp; tanggal lahir</p>
                    </div>
                  )}

                  {/* Template Dokumen KK Contoh */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-emerald-900 font-bold">
                      <span>ATAU PILIH PRESET CONTOH KK:</span>
                      <span className="text-[9px] text-emerald-700 font-mono">1-Klik Ekstraksi</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleLoadPresetKK('hendriana')}
                        className={`py-1.5 px-1 rounded-lg border font-bold text-center transition ${
                          activeKkPreset === 'hendriana'
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        KK Hendriana
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadPresetKK('ahmad_fauzi')}
                        className={`py-1.5 px-1 rounded-lg border font-bold text-center transition ${
                          activeKkPreset === 'ahmad_fauzi'
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        KK Ahmad Fauzi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadPresetKK('bambang_sutrisno')}
                        className={`py-1.5 px-1 rounded-lg border font-bold text-center transition ${
                          activeKkPreset === 'bambang_sutrisno'
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        KK Bambang (5 Org)
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setKkModalTab('manual')}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lanjut Periksa &amp; Lengkapi di Tab Manual ({scannedCards.length} Kartu)</span>
                  </button>
                </div>
              )}

              {/* SECTION: DATA INDUK KARTU KELUARGA (HEADER KK) & FOTO KELUARGA BERSAMA */}
              <div className="bg-[#f0fdf4] border border-emerald-200 rounded-xl p-3 space-y-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Informasi Dokumen Kartu Keluarga</span>
                  </h4>
                  <span className="text-[9px] text-emerald-700 font-mono font-bold">Data Induk</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">
                      No. Kartu Keluarga (KK)
                    </label>
                    <input
                      type="text"
                      value={formNoKk}
                      onChange={e => setFormNoKk(e.target.value)}
                      placeholder="Contoh: 3201011506850001"
                      className="w-full bg-white border border-emerald-200 rounded-lg p-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">
                      RT / RW
                    </label>
                    <input
                      type="text"
                      value={formRtRw}
                      onChange={e => setFormRtRw(e.target.value)}
                      placeholder="Contoh: 003/007"
                      className="w-full bg-white border border-emerald-200 rounded-lg p-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">
                      Alamat Lengkap KK
                    </label>
                    <input
                      type="text"
                      value={formAlamatKk}
                      onChange={e => setFormAlamatKk(e.target.value)}
                      placeholder="Nama jalan / perumahan / blok"
                      className="w-full bg-white border border-emerald-200 rounded-lg p-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">
                      Kabupaten / Kota
                    </label>
                    <input
                      type="text"
                      value={formKota}
                      onChange={e => setFormKota(e.target.value)}
                      placeholder="Contoh: Bogor / Kuningan"
                      className="w-full bg-white border border-emerald-200 rounded-lg p-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* FOTO BERSAMA KELUARGA (FAMILY PORTRAIT / SELFIE BARENG) */}
                <div className="pt-2 border-t border-emerald-200/80 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Foto Bersama Seluruh Anggota Keluarga (Selfie / Galeri)</span>
                    </span>
                    <span className="text-[9px] text-emerald-700 font-bold">Auto-Kompres</span>
                  </div>

                  {formFotoKeluarga ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-300 max-h-36 bg-slate-900">
                      <img
                        src={formFotoKeluarga}
                        alt="Foto Keluarga Bersama"
                        className="w-full h-36 object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-emerald-950/80 text-[#5eead4] text-[9px] font-bold px-2 py-0.5 rounded-md">
                        Foto Keluarga Bersama Tersimpan
                      </div>
                      <div className="absolute bottom-2 right-2 flex gap-1.5">
                        <label className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer shadow transition">
                          Ganti
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadFotoKeluarga}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveFotoKeluarga}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="bg-white hover:bg-emerald-50 border border-dashed border-emerald-300 text-emerald-800 rounded-xl p-2.5 cursor-pointer text-center flex flex-col items-center justify-center gap-1 transition">
                        <Camera className="w-4 h-4 text-emerald-700" />
                        <span className="text-[10px] font-bold">Ambil Selfie Bareng</span>
                        <span className="text-[8px] text-slate-400">Kamera Depan HP</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          onChange={handleUploadFotoKeluarga}
                          className="hidden"
                        />
                      </label>
                      <label className="bg-white hover:bg-emerald-50 border border-dashed border-emerald-300 text-emerald-800 rounded-xl p-2.5 cursor-pointer text-center flex flex-col items-center justify-center gap-1 transition">
                        <Upload className="w-4 h-4 text-emerald-700" />
                        <span className="text-[10px] font-bold">Pilih dari Galeri</span>
                        <span className="text-[8px] text-slate-400">Foto Keluarga Lengkap</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadFotoKeluarga}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION: DAFTAR KARTU ANGGOTA KELUARGA (EDIT, TUKAR, PAS FOTO, NIK TOGGLE) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Daftar Anggota Keluarga ({scannedCards.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddNewScannedCard}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition shadow-xs"
                    title="Tambah Anggota KK Baru"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Tambah Anggota</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {scannedCards.map((card, idx) => (
                    <div
                      key={card.id}
                      className="bg-white border border-emerald-200 rounded-xl p-3 shadow-2xs space-y-2.5 hover:border-emerald-400 transition"
                    >
                      {/* Top Row: Pas Foto / Selfie, Nama, Peran & Tombol Aksi */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          {/* Pas Foto Wajah Auto-Kompres */}
                          <div className="relative group shrink-0">
                            <div className="w-13 h-13 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs overflow-hidden shadow-2xs">
                              {card.photo ? (
                                <img src={card.photo} alt={card.name} className="w-full h-full object-cover" />
                              ) : (
                                card.name ? card.name.slice(0, 2).toUpperCase() : '?'
                              )}
                            </div>
                            <label
                              className="absolute -bottom-1 -right-1 bg-emerald-700 hover:bg-emerald-800 text-white p-1 rounded-full cursor-pointer shadow-xs transition"
                              title="Unggah / Ambil Pas Foto Wajah"
                            >
                              <Camera className="w-2.5 h-2.5" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => handlePhotoUploadForCard(card.id, e)}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Info Pokok: Nama Lengkap, Peran Dropdown, Bin/Binti */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <input
                              type="text"
                              value={card.name}
                              onChange={e => handleUpdateCardField(card.id, 'name', e.target.value)}
                              className="font-bold text-xs text-slate-900 bg-transparent border-b border-slate-200 focus:border-emerald-600 focus:outline-none w-full pb-0.5"
                              placeholder="Nama Lengkap Anggota..."
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <select
                                value={card.role}
                                onChange={e => {
                                  const val = e.target.value;
                                  handleUpdateCardField(card.id, 'role', val);
                                  if (val === 'Kepala Keluarga') {
                                    handleUpdateCardField(card.id, 'gender', 'L');
                                  } else if (val === 'Istri') {
                                    handleUpdateCardField(card.id, 'gender', 'P');
                                  }
                                }}
                                className="text-[10px] bg-emerald-100 text-emerald-900 font-bold rounded px-1.5 py-0.5 border border-emerald-300 focus:outline-none"
                              >
                                <option value="Kepala Keluarga">Kepala Keluarga</option>
                                <option value="Istri">Istri</option>
                                <option value="Anak ke-1">Anak ke-1</option>
                                <option value="Anak ke-2">Anak ke-2</option>
                                <option value="Anak ke-3">Anak ke-3</option>
                                <option value="Anak ke-4">Anak ke-4</option>
                                <option value="Anak ke-5">Anak ke-5</option>
                                <option value="Orang Tua">Orang Tua</option>
                                <option value="Mertua">Mertua</option>
                                <option value="Famili Lain">Famili Lain</option>
                              </select>

                              <input
                                type="text"
                                value={card.binBinti}
                                onChange={e => handleUpdateCardField(card.id, 'binBinti', e.target.value)}
                                placeholder="bin / binti..."
                                className="text-[10px] text-slate-500 bg-transparent border-b border-slate-200 focus:border-emerald-600 focus:outline-none w-24"
                              />

                              <input
                                type="text"
                                value={card.nickname}
                                onChange={e => handleUpdateCardField(card.id, 'nickname', e.target.value)}
                                placeholder="Panggilan"
                                className="text-[10px] text-emerald-700 font-medium bg-transparent border-b border-slate-200 focus:border-emerald-600 focus:outline-none w-20"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tombol Aksi: Pindah Urutan & Hapus Baris */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveCard(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-emerald-700 disabled:opacity-20"
                            title="Tukar Posisi ke Atas"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteScannedCard(card.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus Anggota Ini dari KK"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Detail Kartu: NIK (dengan Eye Toggle) & Tanggal Lahir / Tempat */}
                      <div className="grid grid-cols-2 gap-2 bg-[#f0fdf4] p-2 rounded-lg text-[10px] border border-emerald-100">
                        <div>
                          <div className="flex items-center justify-between text-slate-500 mb-0.5">
                            <span className="font-semibold">NIK (Privacy-First):</span>
                            <button
                              type="button"
                              onClick={() => toggleShowNik(card.id)}
                              className="text-emerald-700 hover:text-emerald-900"
                              title="Tampilkan / Sembunyikan NIK"
                            >
                              {showNikMap[card.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                          <input
                            type={showNikMap[card.id] ? 'text' : 'password'}
                            value={card.nik || ''}
                            onChange={e => handleUpdateCardField(card.id, 'nik', e.target.value)}
                            placeholder="16 digit NIK"
                            className="font-mono font-medium text-slate-800 bg-white border border-emerald-200 rounded px-1.5 py-0.5 w-full focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div>
                          <span className="text-slate-500 block font-semibold mb-0.5">Tgl Lahir / Th:</span>
                          <input
                            type="text"
                            value={card.birthDate}
                            onChange={e => {
                              const val = e.target.value;
                              handleUpdateCardField(card.id, 'birthDate', val);
                              const yearMatch = val.match(/\b(19\d\d|20\d\d)\b/);
                              if (yearMatch) {
                                handleUpdateCardField(card.id, 'birthYear', yearMatch[1]);
                              }
                            }}
                            placeholder="DD/MM/YYYY"
                            className="font-bold text-slate-800 bg-white border border-emerald-200 rounded px-1.5 py-0.5 w-full focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div>
                          <span className="text-slate-500 block font-semibold mb-0.5">Tempat Lahir:</span>
                          <input
                            type="text"
                            value={card.birthPlace || ''}
                            onChange={e => handleUpdateCardField(card.id, 'birthPlace', e.target.value)}
                            placeholder="Kota Lahir"
                            className="font-medium text-slate-800 bg-white border border-emerald-200 rounded px-1.5 py-0.5 w-full focus:outline-none focus:border-emerald-600"
                          />
                        </div>

                        <div>
                          <span className="text-slate-500 block font-semibold mb-0.5">Jenis Kelamin &amp; Status:</span>
                          <div className="flex items-center gap-1">
                            <select
                              value={card.gender}
                              onChange={e => handleUpdateCardField(card.id, 'gender', e.target.value as 'L' | 'P')}
                              className="bg-white border border-emerald-200 rounded px-1 py-0.5 text-[10px] font-bold text-slate-800 focus:outline-none"
                            >
                              <option value="L">L</option>
                              <option value="P">P</option>
                            </select>
                            <select
                              value={card.status || 'Hidup'}
                              onChange={e => handleUpdateCardField(card.id, 'status', e.target.value as any)}
                              className="bg-white border border-emerald-200 rounded px-1 py-0.5 text-[10px] font-bold text-slate-800 focus:outline-none flex-1"
                            >
                              <option value="Hidup">Hidup</option>
                              <option value="Almarhum">Almarhum</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MINI STRUKTUR / FAMILY TREE INTERAKTIF LANGSUNG DARI HASIL KARTU KK */}
              {scannedCards.length > 0 && (
                <div className="bg-[#f0fdf4] border border-emerald-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-emerald-700 rotate-180" />
                      <span>Mini Struktur Kartu Keluarga</span>
                    </span>
                    <span className="text-[9px] text-emerald-700 font-mono font-bold">Terhubung Otomatis</span>
                  </div>

                  {/* Bagan Mini Visual */}
                  <div className="bg-white rounded-lg p-2.5 border border-emerald-100 flex flex-col items-center space-y-2 relative">
                    {/* Row Pasangan (Ayah & Ibu) */}
                    <div className="flex items-center gap-4 relative">
                      {scannedCards.slice(0, 2).map(parent => (
                        <div key={parent.id} className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full border-2 border-emerald-600 overflow-hidden bg-emerald-50 flex items-center justify-center font-bold text-xs text-emerald-800 shadow-2xs">
                            {parent.photo ? (
                              <img src={parent.photo} alt={parent.name} className="w-full h-full object-cover" />
                            ) : (
                              parent.name ? parent.name.slice(0, 2).toUpperCase() : '?'
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-900 mt-1 max-w-[70px] truncate text-center">
                            {parent.name || 'Nama'}
                          </span>
                          <span className="text-[8px] text-emerald-700 font-medium">{parent.role}</span>
                        </div>
                      ))}
                      {/* Garis Penghubung Pernikahan */}
                      <div className="absolute top-5 left-10 right-10 h-0.5 bg-emerald-400 -z-0"></div>
                    </div>

                    {/* Garis Vertikal Turun ke Anak */}
                    <div className="w-0.5 h-3 bg-emerald-400"></div>

                    {/* Row Anak-Anak */}
                    <div className="flex items-center justify-center gap-3 pt-1 border-t border-emerald-300 w-full overflow-x-auto">
                      {scannedCards.slice(2).map(child => (
                        <div key={child.id} className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 rounded-full border border-emerald-500 overflow-hidden bg-emerald-50 flex items-center justify-center font-bold text-[10px] text-emerald-800 shadow-2xs">
                            {child.photo ? (
                              <img src={child.photo} alt={child.name} className="w-full h-full object-cover" />
                            ) : (
                              child.name ? child.name.slice(0, 2).toUpperCase() : '?'
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-slate-900 mt-0.5 max-w-[65px] truncate text-center">
                            {child.name || 'Anak'}
                          </span>
                          <span className="text-[8px] text-slate-500">{child.birthYear || child.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer: Simpan (Save) */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={handleSaveKkAndMembers}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Kartu Keluarga (Save)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowScanKKModal(false)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRATINJAU BUKU SILSILAH 2 MODEL, GESER POSISI & PILIHAN KERTAS A4 - A0 */}
      {/* ========================================================================= */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-2xl relative border border-emerald-100 max-h-[92vh] flex flex-col text-slate-800">
            {/* Header Modal */}
            <div className="flex justify-between items-center border-b border-emerald-50 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-700 text-white rounded-xl flex items-center justify-center shadow-xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Buku Silsilah Heritage (2 Model)</h3>
                  <p className="text-[10px] text-emerald-700 font-bold">Pilihan Ukuran Kertas: A4, A3, A2, A1, A0 (Ultra Sharp)</p>
                </div>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-bar: Pemilih 2 Model Tampilan & Pemilih Ukuran Kertas */}
            <div className="space-y-2 bg-[#f0fdf4] p-2.5 rounded-xl border border-emerald-200/80">
              {/* 1. Pilih 2 Model Silsilah */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider">Model Tampilan:</span>
                <div className="grid grid-cols-2 gap-1 bg-white p-0.5 rounded-lg border border-emerald-200">
                  <button
                    onClick={() => setBukuTreeModel('foto_sendiri')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                      bukuTreeModel === 'foto_sendiri' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-800'
                    }`}
                  >
                    1. Pas Foto Sendiri
                  </button>
                  <button
                    onClick={() => setBukuTreeModel('keluarga_kompak')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                      bukuTreeModel === 'keluarga_kompak' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-800'
                    }`}
                  >
                    2. Keluarga Kompak
                  </button>
                </div>
              </div>

              {/* 2. Pilih Ukuran Kertas A4 s/d A0 (High-DPI Upscale) */}
              <div className="flex items-center justify-between pt-1 border-t border-emerald-200/50">
                <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider">Ukuran Kertas:</span>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-emerald-200">
                  {(['A4', 'A3', 'A2', 'A1', 'A0'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => setPaperSize(size)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition font-mono ${
                        paperSize === size ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable Dokumen Pratinjau Kertas */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 p-1">
              {/* Badge Skala Kertas Terpilih */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span>
                  Format Cetak: <strong>Kertas {paperSize}</strong> • Vektor Tajam 300 DPI
                </span>
                <span className="text-emerald-700 font-bold">
                  {bukuTreeModel === 'foto_sendiri' ? 'Model Pas Foto Individual' : 'Model Unit Keluarga Kompak'}
                </span>
              </div>

              {/* COVER BUKU SILSILAH HERITAGE */}
              <div className="bg-gradient-to-b from-[#064e3b] via-[#047857] to-[#022c22] border-2 border-amber-300 rounded-xl p-4 text-center space-y-2 text-white shadow-md">
                <div className="w-12 h-12 bg-emerald-950/80 rounded-full mx-auto flex items-center justify-center border border-amber-300">
                  <GitFork className="w-6 h-6 text-amber-300 rotate-180" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-amber-300 font-bold block">
                  Kitab Nasab &amp; Buku Silsilah
                </span>
                <h4 className="font-serif text-lg font-bold text-white tracking-wide">
                  TRAH BESAR HENDRIANA
                </h4>
                <div className="text-[10px] text-emerald-200 space-y-0.5">
                  <p>Trah Paternal: Cilimus, Kuningan • Trah Maternal: Dramaga, Bogor</p>
                  <p className="text-amber-300 font-mono text-[9px] pt-1">
                    Edisi Arsip Pusaka Digital WargaQu 2026 • Format Kertas {paperSize}
                  </p>
                </div>
              </div>

              {/* ================= MODEL 1: MODEL PAS FOTO SENDIRI ================= */}
              {bukuTreeModel === 'foto_sendiri' && (
                <div className="space-y-3 bg-[#f0fdf4] p-3 rounded-xl border border-emerald-200">
                  <div className="flex justify-between items-center border-b border-emerald-200 pb-1.5">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Model 1: Struktur Pas Foto Individual
                    </span>
                    <span className="text-[9px] text-slate-500">Klik panah untuk geser posisi</span>
                  </div>

                  {/* Generasi Buyut (Leluhur) */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-amber-800 uppercase block">1. Tingkat Buyut / Moyang</span>
                    <div className="grid grid-cols-2 gap-2">
                      {members.filter(m => m.relation === 'buyut').map(m => (
                        <div key={m.id} className="bg-white p-2 rounded-lg border border-amber-200 shadow-2xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center text-xs font-bold text-amber-800 shrink-0">
                              {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : m.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-900 truncate">{m.name}</p>
                              <p className="text-[9px] text-slate-500">{m.binBinti} • {getYearRangeDisplay(m)}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            <button onClick={() => handleShiftMemberOrder(m.id, 'left')} className="p-0.5 text-slate-400 hover:text-emerald-700" title="Geser">
                              <MoveLeft className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleShiftMemberOrder(m.id, 'right')} className="p-0.5 text-slate-400 hover:text-emerald-700" title="Geser">
                              <MoveRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SVG Garis Penghubung Generasi 1 ke 2 */}
                  <div className="w-full flex justify-center py-0.5">
                    <div className="w-0.5 h-4 bg-emerald-400"></div>
                  </div>

                  {/* Generasi Kakek & Nenek */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-emerald-900 uppercase block">2. Tingkat Aki &amp; Nini</span>
                    <div className="grid grid-cols-2 gap-2">
                      {members.filter(m => m.relation === 'kakek' || m.relation === 'nenek').slice(0, 4).map(m => (
                        <div key={m.id} className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0 ${m.gender === 'L' ? 'bg-blue-600' : 'bg-pink-600'}`}>
                              {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : m.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-900 truncate">{m.name}</p>
                              <p className="text-[9px] text-slate-500">{m.kinshipTitle} • {getYearRangeDisplay(m)}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            <button onClick={() => handleShiftMemberOrder(m.id, 'left')} className="p-0.5 text-slate-400 hover:text-emerald-700" title="Geser">
                              <MoveLeft className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleShiftMemberOrder(m.id, 'right')} className="p-0.5 text-slate-400 hover:text-emerald-700" title="Geser">
                              <MoveRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SVG Garis Penghubung Generasi 2 ke 3 */}
                  <div className="w-full flex justify-center py-0.5">
                    <div className="w-0.5 h-4 bg-emerald-400"></div>
                  </div>

                  {/* Generasi Orang Tua & Anak */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-emerald-900 uppercase block">3. Tingkat Keluarga Inti &amp; Anak</span>
                    <div className="grid grid-cols-2 gap-2">
                      {members.filter(m => m.relation === 'ayah' || m.relation === 'ibu' || m.relation === 'anak').slice(0, 4).map(m => (
                        <div key={m.id} className="bg-white p-2 rounded-lg border border-emerald-200 shadow-2xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white overflow-hidden flex items-center justify-center text-xs font-bold shrink-0">
                              {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : m.name.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-900 truncate">{m.name}</p>
                              <p className="text-[9px] text-slate-500">{m.kinshipTitle || m.role} • {getYearRangeDisplay(m)}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            <button onClick={() => handleShiftMemberOrder(m.id, 'left')} className="p-0.5 text-slate-400 hover:text-emerald-700" title="Geser">
                              <MoveLeft className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleShiftMemberOrder(m.id, 'right')} className="p-0.5 text-slate-400 hover:text-emerald-700" title="Geser">
                              <MoveRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= MODEL 2: MODEL KARTU KELUARGA KOMPAK ================= */}
              {bukuTreeModel === 'keluarga_kompak' && (
                <div className="space-y-3 bg-[#f0fdf4] p-3 rounded-xl border border-emerald-200">
                  <div className="flex justify-between items-center border-b border-emerald-200 pb-1.5">
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      Model 2: Kartu Unit Keluarga Kompak
                    </span>
                    <span className="text-[9px] text-emerald-700 font-bold">Pasangan &amp; Cabang Anak</span>
                  </div>

                  {/* Unit Keluarga 1: Abah Karta & Emak Rohanah */}
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-900">Unit Trah Kuningan: Abah Karta</span>
                      <span className="text-[9px] text-slate-500">Cilimus, Kuningan</span>
                    </div>
                    <div className="flex items-center justify-around bg-emerald-50/60 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden">
                          {members.find(m => m.name.includes('Karta'))?.photo ? (
                            <img src={members.find(m => m.name.includes('Karta'))?.photo} alt="Abah Karta" className="w-full h-full object-cover" />
                          ) : 'AK'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Abah Karta</p>
                          <p className="text-[9px] text-slate-500">Lahir 1948</p>
                        </div>
                      </div>
                      <span className="text-emerald-700 font-bold text-xs">+</span>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-pink-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden">
                          {members.find(m => m.name.includes('Rohanah'))?.photo ? (
                            <img src={members.find(m => m.name.includes('Rohanah'))?.photo} alt="Emak Rohanah" className="w-full h-full object-cover" />
                          ) : 'ER'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Emak Rohanah</p>
                          <p className="text-[9px] text-slate-500">1952 - 2019 (Wafat)</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600">
                      <strong>Anak-Anak:</strong> Hendriana (Bageur), Mang Dede Supriatna
                    </p>
                  </div>

                  {/* Unit Keluarga 2: Keluarga Inti (Dinamis dari mainHead, mainSpouse & mainChildren) */}
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-900">
                        Unit Keluarga Inti: {mainHead?.name || 'Kepala Keluarga'}
                      </span>
                      <span className="text-[9px] text-slate-500 max-w-[150px] truncate">
                        {mainHead?.address || 'Nanggerang Indah Residence'}
                      </span>
                    </div>
                    <div className="flex items-center justify-around bg-emerald-50/60 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs overflow-hidden">
                          {mainHead?.photo ? (
                            <img src={mainHead.photo} alt={mainHead.name} className="w-full h-full object-cover" />
                          ) : (
                            (mainHead?.name || 'HB').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{mainHead?.name || 'Kepala Keluarga'}</p>
                          <p className="text-[9px] text-slate-500">Lahir {mainHead?.birthYear || '1985'}</p>
                        </div>
                      </div>
                      <span className="text-emerald-700 font-bold text-xs">+</span>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-pink-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden">
                          {mainSpouse?.photo ? (
                            <img src={mainSpouse.photo} alt={mainSpouse.name} className="w-full h-full object-cover" />
                          ) : (
                            (mainSpouse?.name || 'SN').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{mainSpouse?.name || 'Istri'}</p>
                          <p className="text-[9px] text-slate-500">Lahir {mainSpouse?.birthYear || '1988'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-1">
                      <span className="text-[9px] font-bold text-slate-700 block mb-1">
                        Daftar Anak Terdaftar ({mainChildren.length} Orang):
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {mainChildren.map((ch, idx) => (
                          <div key={ch.id} className="bg-white p-1.5 rounded border border-emerald-100 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-800 truncate">
                              {ch.name} ({ch.birthYear})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions: Cetak Kertas Terpilih & Unduh */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  window.print?.();
                  showNotification(`Membuka dialog cetak format Kertas ${paperSize} (300 DPI Ultra Sharp)...`);
                }}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ukuran Kertas {paperSize} (PDF)</span>
              </button>
              <button
                onClick={() => {
                  showNotification(`Bagan Silsilah Kertas ${paperSize} berhasil diunduh!`);
                  setShowPdfModal(false);
                }}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Gambar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL ANGGOTA KELUARGA (INSPECTOR) */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3.5 shadow-2xl relative border border-emerald-100">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shadow-xs shrink-0 overflow-hidden ${selectedMember.gender === 'L' ? 'bg-blue-600' : 'bg-pink-600'}`}>
                {selectedMember.photo ? (
                  <img src={selectedMember.photo} alt={selectedMember.name} className="w-full h-full object-cover" />
                ) : (
                  selectedMember.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">
                  {selectedMember.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedMember.binBinti || '-'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                    {selectedMember.kinshipTitle || selectedMember.role}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${selectedMember.status === 'Almarhum' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {selectedMember.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Grid (Privacy First, No NIK) */}
            <div className="bg-[#f0fdf4] border border-emerald-100 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-emerald-100/70 pb-1.5">
                <span className="text-slate-500">Rentang Tahun:</span>
                <span className="font-bold font-mono text-slate-800">{getYearRangeDisplay(selectedMember)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-100/70 pb-1.5">
                <span className="text-slate-500">Asal Daerah:</span>
                <span className="font-bold text-slate-800">{selectedMember.origin || '-'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-emerald-100/70 pb-1.5">
                <span className="text-slate-500">Jalur Nasab:</span>
                <span className="font-bold text-emerald-800">
                  {selectedMember.trah === 'ayah' ? 'Trah Ayah (Kuningan)' : selectedMember.trah === 'ibu' ? 'Trah Ibu (Bogor)' : 'Keluarga Inti'}
                </span>
              </div>
              {selectedMember.notes && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 block">Catatan Silsilah:</span>
                  <p className="text-[11px] text-slate-700 italic mt-0.5">{selectedMember.notes}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {selectedMember.status === 'Almarhum' && (
                <button
                  onClick={() => {
                    showNotification(`Doa Al-Fatihah dikirimkan untuk ${selectedMember.name} 🤲`);
                    setSelectedMember(null);
                  }}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs"
                >
                  Kirim Doa Al-Fatihah 🤲
                </button>
              )}
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH ANGGOTA SILSILAH BARU */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <form
            onSubmit={handleAddMemberSubmit}
            className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative border border-emerald-100 text-slate-800 max-h-[92vh] overflow-y-auto no-scrollbar"
          >
            <button
              type="button"
              onClick={() => setShowAddMemberModal(false)}
              className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-700 text-white rounded-xl flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Tambah Anggota Silsilah</h3>
                <p className="text-[10px] text-emerald-700 font-bold">Privacy-First (Tanpa NIK)</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Muhammad Rizki"
                  className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Nama Ayah (Bin / Binti)
                  </label>
                  <input
                    type="text"
                    value={formBinBinti}
                    onChange={e => setFormBinBinti(e.target.value)}
                    placeholder="Nama ayah kandung"
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Panggilan / Gelar
                  </label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={e => setFormNickname(e.target.value)}
                    placeholder="Contoh: Kang Iki"
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Jalur Trah
                  </label>
                  <select
                    value={formTrah}
                    onChange={e => setFormTrah(e.target.value as any)}
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  >
                    <option value="inti">Keluarga Inti (Anak / Pasangan)</option>
                    <option value="ayah">Trah Ayah User</option>
                    <option value="ibu">Trah Ibu User</option>
                    {isSpouseConnected && (
                      <>
                        <option value="pasangan_ayah">Trah Ayah Pasangan (Besan Ayah)</option>
                        <option value="pasangan_ibu">Trah Ibu Pasangan (Besan Ibu)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Panggilan Kekerabatan
                  </label>
                  <select
                    value={formKinship}
                    onChange={e => {
                      setFormKinship(e.target.value);
                      if (e.target.value.includes('Aki')) setFormRelation('kakek');
                      else if (e.target.value.includes('Nini')) setFormRelation('nenek');
                      else if (e.target.value.includes('Uyut')) setFormRelation('buyut');
                      else if (e.target.value.includes('Anak')) setFormRelation('anak');
                      else if (e.target.value.includes('Mang') || e.target.value.includes('Bibi') || e.target.value.includes('Uwa')) setFormRelation('paman_bibi');
                    }}
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  >
                    <option value="Anak">Anak (Putra/Putri)</option>
                    <option value="Uwa">Uwa (Kakak Ortu)</option>
                    <option value="Mang">Mang / Paman (Adik Ortu Laki-laki)</option>
                    <option value="Bibi">Bibi (Adik Ortu Perempuan)</option>
                    <option value="Aki">Aki (Kakek)</option>
                    <option value="Nini">Nini (Nenek)</option>
                    <option value="Uyut">Uyut (Buyut / Moyang)</option>
                    <option value="Cucu">Cucu (Incu)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Gender
                  </label>
                  <select
                    value={formGender}
                    onChange={e => setFormGender(e.target.value as any)}
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Th. Lahir
                  </label>
                  <input
                    type="number"
                    value={formBirthYear}
                    onChange={e => setFormBirthYear(e.target.value)}
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  >
                    <option value="Hidup">Hidup</option>
                    <option value="Almarhum">Almarhum</option>
                  </select>
                </div>
              </div>

              {formStatus === 'Almarhum' && (
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Tahun Wafat (Almarhum)
                  </label>
                  <input
                    type="number"
                    value={formDeathYear}
                    onChange={e => setFormDeathYear(e.target.value)}
                    placeholder="Contoh: 2018"
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                  Asal Daerah / Kampung
                </label>
                <input
                  type="text"
                  value={formOrigin}
                  onChange={e => setFormOrigin(e.target.value)}
                  placeholder="Contoh: Cilimus, Kuningan"
                  className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                  Catatan Silsilah
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Keterangan tambahan atau nama pasangan"
                  className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition"
              >
                Simpan ke Silsilah
              </button>
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: BAGIKAN UNDANGAN KELUARGA BESAR PER-TRAH */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 space-y-3.5 shadow-2xl relative border border-emerald-100 text-slate-800 max-h-[92vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-9 h-9 bg-emerald-700 text-white rounded-xl flex items-center justify-center font-bold shadow-xs">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Undangan Silaturahmi Keluarga Besar</h3>
                <p className="text-[10px] text-emerald-700 font-bold">Privat • Terisolasi Mandiri per-Trah</p>
              </div>
            </div>

            {/* Trah Target Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-700 block">
                Pilih Jalur Trah yang Ingin Diundang:
              </label>
              <div className={`grid ${isSpouseConnected ? 'grid-cols-2' : 'grid-cols-2'} gap-1.5 text-xs font-bold`}>
                <button
                  type="button"
                  onClick={() => setInviteTrahTarget('ayah')}
                  className={`p-2 rounded-xl text-left border transition ${
                    inviteTrahTarget === 'ayah'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-400/40'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs font-bold">👨 Trah Ayah</span>
                  <span className="text-[10px] text-slate-500 font-normal truncate block">Trah Kuningan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInviteTrahTarget('ibu')}
                  className={`p-2 rounded-xl text-left border transition ${
                    inviteTrahTarget === 'ibu'
                      ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-400/40'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs font-bold">👩 Trah Ibu</span>
                  <span className="text-[10px] text-slate-500 font-normal truncate block">Trah Bogor</span>
                </button>
                {isSpouseConnected && (
                  <>
                    <button
                      type="button"
                      onClick={() => setInviteTrahTarget('pasangan_ayah')}
                      className={`p-2 rounded-xl text-left border transition ${
                        inviteTrahTarget === 'pasangan_ayah'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-400/40'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs font-bold">🧔 Ayah Pasangan</span>
                      <span className="text-[10px] text-slate-500 font-normal truncate block">{spouseInfo.trahAyahName || 'Sumedang'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteTrahTarget('pasangan_ibu')}
                      className={`p-2 rounded-xl text-left border transition ${
                        inviteTrahTarget === 'pasangan_ibu'
                          ? 'bg-rose-50 border-rose-600 text-rose-900 ring-2 ring-rose-400/40'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs font-bold">🧕 Ibu Pasangan</span>
                      <span className="text-[10px] text-slate-500 font-normal truncate block">{spouseInfo.trahIbuName || 'Bandung'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Token & Detail Undangan */}
            <div className={`p-3 rounded-2xl border space-y-2 ${
              inviteTrahTarget === 'ayah' ? 'bg-blue-50/70 border-blue-200' :
              inviteTrahTarget === 'ibu' ? 'bg-purple-50/70 border-purple-200' :
              inviteTrahTarget === 'pasangan_ayah' ? 'bg-emerald-50/70 border-emerald-200' :
              'bg-rose-50/70 border-rose-200'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">Kode Undangan Khusus:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-slate-900">
                  WARGAQU-{inviteTrahTarget.toUpperCase()}-8821
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tautan ini khusus untuk keluarga besar <strong>{getTrahName(inviteTrahTarget)}</strong>. Keluarga yang bergabung hanya akan melihat silsilah dan medsos trah ini.
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-white/80 p-2 rounded-xl border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Terisolasi total dari warga RT lingkungan &amp; trah keluarga lainnya.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  const baseCleanUrl = window.location.origin + window.location.pathname.replace(/\/+$/, '');
                  const directInviteUrl = `${baseCleanUrl}/#leluhurqu?trah=${inviteTrahTarget}&invite=WARGAQU-${inviteTrahTarget.toUpperCase()}-8821`;
                  const shareText = `Assalamu'alaikum wr. wb.\n\nMengajak keluarga besar *${getTrahName(inviteTrahTarget)}* untuk bergabung di silsilah keluarga & linimasa Medsos privat LeluhurQu.\n\nKode Undangan: WARGAQU-${inviteTrahTarget.toUpperCase()}-8821\nTautan Masuk Otomatis: ${directInviteUrl}\n\n*Catatan:* Cukup ketuk tautan di atas untuk langsung masuk seketika (Auto Link PWA / Web tanpa wajib install terlebih dahulu).`;
                  if (navigator.share) {
                    navigator.share({ title: `Undangan ${getTrahName(inviteTrahTarget)}`, text: shareText, url: directInviteUrl }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(shareText);
                    showNotification(`Teks dan tautan undangan untuk ${getTrahName(inviteTrahTarget)} berhasil disalin!`);
                  }
                  setShowShareModal(false);
                }}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs transition active:scale-98"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan Undangan ke WhatsApp</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const baseCleanUrl = window.location.origin + window.location.pathname.replace(/\/+$/, '');
                    const directInviteUrl = `${baseCleanUrl}/#leluhurqu?trah=${inviteTrahTarget}&invite=WARGAQU-${inviteTrahTarget.toUpperCase()}-8821`;
                    const shareText = `Assalamu'alaikum wr. wb. Undangan keluarga besar *${getTrahName(inviteTrahTarget)}* (LeluhurQu).\nKode: WARGAQU-${inviteTrahTarget.toUpperCase()}-8821\nAkses Langsung: ${directInviteUrl}`;
                    navigator.clipboard?.writeText(shareText);
                    showNotification('Teks dan tautan undangan disalin ke clipboard!');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Salin Pesan</span>
                </button>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ATUR KONEKSI AKUN PASANGAN & STATUS 4 TRAH */}
      {showSpouseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3.5 shadow-2xl relative border border-emerald-100 text-slate-800">
            <button
              onClick={() => setShowSpouseModal(false)}
              className="absolute top-3.5 right-3.5 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Koneksi Pasangan &amp; Jumlah Trah</h3>
                <p className="text-[10px] text-slate-500 font-medium">Auto-Connect 2 Trah vs 4 Trah Keluarga</p>
              </div>
            </div>

            {/* Toggle Auto-Connect Pasangan */}
            <div className="bg-[#f0fdf4] p-3 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Status Akun Pasangan</h4>
                  <p className="text-[10px] text-slate-500">
                    {isSpouseConnected ? 'Terhubung (4 Trah Aktif Otomatis)' : 'Belum Terhubung (2 Trah Aktif)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isSpouseConnected;
                    setIsSpouseConnected(next);
                    if (next) {
                      showNotification('Akun Pasangan terhubung! 4 Trah silsilah & medsos aktif otomatis.');
                    } else {
                      showNotification('Kembali ke mode 2 Trah (Trah Ayah & Ibu User).');
                    }
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-200 ${
                    isSpouseConnected ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                </button>
              </div>

              <div className="text-[10px] text-slate-600 bg-white/80 p-2 rounded-xl border border-emerald-100 space-y-1">
                <p>
                  <strong>Aturan Sistem:</strong>
                </p>
                <p>• <strong>Tanpa Pasangan:</strong> 2 Trah aktif terpisah (Trah Ayah &amp; Trah Ibu User).</p>
                <p>• <strong>Dengan Pasangan:</strong> Auto-connect menjadi <strong>4 Trah</strong> (Trah Ayah User, Trah Ibu User, Trah Ayah Pasangan, Trah Ibu Pasangan), masing-masing memiliki linimasa Medsos mandiri!</p>
              </div>
            </div>

            {/* Form Detail Pasangan jika aktif */}
            {isSpouseConnected && (
              <div className="space-y-2.5 text-xs animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                    Nama Pasangan (Suami/Istri)
                  </label>
                  <input
                    type="text"
                    value={spouseInfo.name}
                    onChange={e => setSpouseInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                      Nama Trah Ayah Pasangan
                    </label>
                    <input
                      type="text"
                      value={spouseInfo.trahAyahName}
                      onChange={e => setSpouseInfo(prev => ({ ...prev, trahAyahName: e.target.value }))}
                      placeholder="Contoh: Trah Sumedang"
                      className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">
                      Nama Trah Ibu Pasangan
                    </label>
                    <input
                      type="text"
                      value={spouseInfo.trahIbuName}
                      onChange={e => setSpouseInfo(prev => ({ ...prev, trahIbuName: e.target.value }))}
                      placeholder="Contoh: Trah Bandung"
                      className="w-full bg-[#f0fdf4] border border-emerald-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowSpouseModal(false);
                  showNotification('Pengaturan koneksi pasangan & trah tersimpan!');
                }}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition"
              >
                Simpan &amp; Terapkan
              </button>
              <button
                type="button"
                onClick={() => setShowSpouseModal(false)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QUICK ADD RELATIVE (+) */}
      {quickAddModal.open && quickAddModal.targetMember && (
        <QuickAddRelativeModalView
          target={quickAddModal.targetMember}
          relationType={quickAddModal.relationType}
          existingMembers={members}
          onClose={() => setQuickAddModal({ open: false, targetMember: null, relationType: 'anak' })}
          onSubmit={handleQuickAddRelativeSubmit}
          showNotification={showNotification}
        />
      )}

      {/* MODAL IN-PLACE EDIT ANGGOTA */}
      {editingMember && (
        <EditMemberModalView
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveEditMember}
          showNotification={showNotification}
        />
      )}

      {/* MODAL DOWNLOAD UPSCALE (A4 - A0) */}
      {showUpscaleModal && (
        <UpscaleExportModalView
          paperSize={upscaleExportSize}
          setPaperSize={setUpscaleExportSize}
          isExporting={isExporting}
          onClose={() => setShowUpscaleModal(false)}
          onDownloadSvg={handleDownloadSvgVector}
          onDownloadPng={handleDownloadPngUpscale}
          trahFilter={treeFilter}
          membersCount={displayedMembers.length}
          showNotification={showNotification}
        />
      )}

      {/* MODAL: KONFIRMASI BERSIHKAN / RESET MOCK DATA */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 space-y-3.5 shadow-2xl relative border border-rose-100 text-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Bersihkan Semua Mock Data?</h3>
                <p className="text-[10px] text-rose-600 font-bold">Reset Total Pohon Silsilah &amp; KK</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/60 p-3 rounded-xl border border-rose-200">
              Tindakan ini akan mengosongkan semua data silsilah keluarga, data kartu keluarga (KK), dan riwayat linimasa postingan. Silsilah akan menjadi bersih untuk diisi dari awal secara offline.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClearAllMockData}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Semua</span>
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL SMART MERGE & DETEKSI KONFLIK IMPORT */}
      {showImportModal && importPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative border border-emerald-100 text-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <GitMerge className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Penggabungan Silsilah Cerdas</h3>
                  <p className="text-[10px] text-emerald-700 font-bold">Smart Merge &amp; Anti-Konflik LeluhurQu</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info File & Status Deteksi */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>File Cadangan:</span>
                <span className="font-mono font-bold text-slate-800 truncate max-w-[180px]">{importPreview.fileName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                  <div className="text-xl font-black text-emerald-800">+{importPreview.newCount}</div>
                  <div className="text-[10px] text-emerald-700 font-bold">Anggota Kerabat Baru</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                  <div className="text-xl font-black text-blue-800">{importPreview.updateCount}</div>
                  <div className="text-[10px] text-blue-700 font-bold">Data Diperbarui</div>
                </div>
              </div>
            </div>

            {/* Deteksi Nama Leluhur yang Sama (Homonym) */}
            {importPreview.duplicateNames.length > 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Terdeteksi Nama yang Sama ({importPreview.duplicateNames.length}):</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Nama: <strong>{importPreview.duplicateNames.slice(0, 4).join(', ')}{importPreview.duplicateNames.length > 4 ? ` (+${importPreview.duplicateNames.length - 4} lainnya)` : ''}</strong>.
                </p>
                <p className="text-[10px] text-amber-700 leading-snug">
                  🛡️ <strong>Anti-Konflik:</strong> Di LeluhurQu setiap individu memakai <em>Unique ID (UUID/Timestamp)</em> sehingga sistem tidak akan menukar data. Anda dapat membedakan orang tua/anak/cucu bernama sama melalui <em>Bin/Binti</em>, <em>Tahun Lahir</em>, atau <em>Gelar Kekerabatan</em>.
                </p>
              </div>
            )}

            {/* Penjelasan Pilihan Tindakan */}
            <div className="space-y-2 text-xs">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Opsi 1: Gabungkan Cerdas (Smart Merge)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Menambahkan seluruh kerabat baru dari file tanpa menghapus kerabat yang sudah ada di HP Anda saat ini. Aman untuk pengeditan silsilah bersamaan.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1 text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>Opsi 2: Gantikan Seluruhnya (Replace Total)</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Menghapus silsilah yang ada di HP ini dan mengganti persis seperti isi file cadangan.
                </p>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={executeSmartMerge}
                className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition flex items-center justify-center gap-2"
              >
                <GitMerge className="w-4 h-4 text-[#5eead4]" />
                <span>Gabungkan Cerdas (Smart Merge - Disarankan)</span>
              </button>

              <button
                type="button"
                onClick={executeReplaceAll}
                className="w-full bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-slate-700 font-bold text-xs py-2.5 rounded-2xl transition flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gantikan Seluruhnya (Replace Total)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL CLOUD REALTIME SYNC (FIREBASE FIRESTORE) */}
      {showCloudModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative border border-emerald-100 text-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                  <Cloud className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Cloud Realtime Sync</h3>
                  <p className="text-[10px] text-emerald-700 font-bold">Sinkronisasi Otomatis Antar-Keluarga</p>
                </div>
              </div>
              <button
                onClick={() => setShowCloudModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Status: Terhubung &amp; Aktif</span>
                </span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  Firebase Firestore
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Setiap kali Anda atau kerabat Anda menambah/mengedit silsilah, perubahan akan langsung muncul otomatis di seluruh HP keluarga tanpa perlu kirim file ekspor-impor manual.
              </p>
            </div>

            {/* Ruang Cloud ID Saat Ini */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Kode Ruang Cloud Silsilah Anda:</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Tersimpan Otomatis</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={cloudTreeId}
                  className="flex-1 p-2.5 bg-slate-100 font-mono text-xs font-bold rounded-xl border border-slate-200 text-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(cloudTreeId);
                    showNotification('Kode Ruang Cloud disalin ke clipboard!');
                  }}
                  className="px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1 active:scale-95 transition"
                  title="Salin Kode Ruang Cloud"
                >
                  <Copy className="w-4 h-4" />
                  <span>Salin</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Bagikan kode ini atau kirimkan Tautan Undangan Trah agar kerabat Anda otomatis tersambung ke pohon silsilah yang sama.
              </p>
            </div>

            {/* Gabung ke Ruang Cloud Kerabat Lain */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              <label className="font-bold text-slate-700">
                Gabung ke Ruang Cloud Kerabat Lain:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Contoh: trah-kuningan-utama"
                  value={inputCloudId}
                  onChange={(e) => setInputCloudId(e.target.value)}
                  className="flex-1 p-2.5 bg-white text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!inputCloudId.trim()) return;
                    const clean = inputCloudId.trim();
                    setCloudTreeId(clean);
                    RealtimeSyncService.setFamilyTreeId(clean);
                    setInputCloudId('');
                    showNotification(`Berhasil berpindah ke Ruang Cloud: ${clean}! Menarik data terbaru...`);
                  }}
                  className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold active:scale-95 transition shrink-0"
                >
                  Hubungkan
                </button>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCloudSyncing(true);
                  RealtimeSyncService.pushFamilyTreeToCloud(
                    cloudTreeId,
                    'Silsilah Keluarga Besar',
                    currentUser?.name || 'Keluarga',
                    members,
                    posts,
                    currentUser?.name || 'Anda'
                  ).then(() => {
                    setIsCloudSyncing(false);
                    showNotification('Data silsilah lokal berhasil di-push ke Cloud!');
                  });
                }}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-98 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span>Paksa Sinkronisasi Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCloudModal(false)}
                className="w-full py-2 text-slate-500 hover:text-slate-700 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
