import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  GitFork,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  FileText,
  Smartphone,
  Eye,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { FamilyMember } from './LeluhurQuView';

export interface ParsedCommaRow {
  rawLine: string;
  lineNumber: number;
  a: string; // ID / Kode Batch Dot Notation (0, 0.1, 0.1.2) - INTERNAL
  b: string; // Nama Lengkap (Madgani)
  c: string; // Sapaan Universal (Bapak, Ibu, Aang, Mbah)
  d: string | null; // ID Orang Tua / Relasi Atas (0 atau null) - INTERNAL
  f: string; // Status Pasangan / Simpul Relasi (Ibu Madgani / -)
  s: string; // Generasi / Level Trah (L0, L1, L2) - INTERNAL
  g: string; // Status Hidup / Catatan (Ada, Wafat)
  isValid: boolean;
  errorMsg?: string;
}

interface TreeNode {
  dotId: string;
  name: string;
  sapaan: string;
  cleanName: string;
  parentDotId: string | null;
  spouse: string;
  level: string;
  status: 'Hidup' | 'Almarhum';
  children: TreeNode[];
  subtreeWidth: number;
  x: number;
  y: number;
  depth: number;
}

interface BatchSubChildInput {
  tempId: string;
  subNo: string;
  name: string;
  nickname?: string;
  gender: 'L' | 'P';
  status: 'Hidup' | 'Almarhum';
  birthYear?: string;
}

interface BatchChildInput {
  tempId: string;
  childIndex: number;
  name: string;
  nickname?: string;
  gender: 'L' | 'P';
  status: 'Hidup' | 'Almarhum';
  birthYear?: string;
  subChildren: BatchSubChildInput[];
  isSubOpen?: boolean;
}

interface BatchQuickAddModalProps {
  existingMembers: FamilyMember[];
  onClose: () => void;
  onSaveBatch: (newMembers: FamilyMember[]) => void;
  showNotification: (msg: string) => void;
}

export const DEFAULT_PROMPT_DATA = `0, Bapak Uyut Utama, Bapak, null, -, L0, Wafat
0.1, Madgani, Bapak, 0, Ibu Madgani, L1, Wafat
0.2, Bser Enit, Bapak, 0, Ibu Saripah, L1, Wafat
0.1.1, Mangani, Bapak, 0.1, Ibu Rohim, L2, Ada
0.1.2, Inoh, Bapak, 0.1, Ibu Santa, L2, Ada`;

// Helper untuk membersihkan dan memformat [Sapaan (c)] + [Nama (b)] tanpa pengulangan kata
export const formatCleanDisplayTitle = (sapaan: string, name: string): string => {
  const cleanName = (name || '').trim();
  const cleanSapaan = (sapaan || '').trim();
  if (!cleanSapaan) return cleanName;
  if (!cleanName) return cleanSapaan;

  // Jika nama lengkap sudah diawali dengan kata sapaan yang sama (case-insensitive), jangan diduplikasi
  if (cleanName.toLowerCase().startsWith(cleanSapaan.toLowerCase())) {
    return cleanName;
  }
  return `${cleanSapaan} ${cleanName}`;
};

export const BatchQuickAddModal: React.FC<BatchQuickAddModalProps> = ({
  existingMembers,
  onClose,
  onSaveBatch,
  showNotification
}) => {
  // Tab Mode: 'comma_text' (Default / Sesuai Prompt) vs 'interactive_wizard'
  const [activeTab, setActiveTab] = useState<'comma_text' | 'interactive_wizard'>('comma_text');

  // Trah Tujuan
  const [targetTrah, setTargetTrah] = useState<FamilyMember['trah']>('ayah');

  // Input Data Koma (Separator Koma a, b, c, d, f, s, g)
  const [commaInputText, setCommaInputText] = useState<string>(DEFAULT_PROMPT_DATA);

  // Filter preview table
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'errors'>('all');

  // ================= STATE UNTUK MODE WIZARD INTERAKTIF =================
  const [rootMode, setRootMode] = useState<'create_new' | 'select_existing'>('create_new');
  const [selectedRootId, setSelectedRootId] = useState<string>(existingMembers[0]?.id || '');
  const [rootName, setRootName] = useState('Bapak Uyut Utama');
  const [rootTitle, setRootTitle] = useState('Bapak');
  const [rootGender, setRootGender] = useState<'L' | 'P'>('L');
  const [rootStatus, setRootStatus] = useState<'Hidup' | 'Almarhum'>('Almarhum');
  const [rootBirthYear, setRootBirthYear] = useState('1910');

  const [wizardChildren, setWizardChildren] = useState<BatchChildInput[]>([
    {
      tempId: 'wc_1',
      childIndex: 1,
      name: 'Madgani',
      nickname: '',
      gender: 'L',
      status: 'Almarhum',
      birthYear: '1940',
      isSubOpen: true,
      subChildren: [
        {
          tempId: 'wsc_1_1',
          subNo: '1.1',
          name: 'Mangani',
          gender: 'L',
          status: 'Hidup',
          birthYear: '1970'
        },
        {
          tempId: 'wsc_1_2',
          subNo: '1.2',
          name: 'Inoh',
          gender: 'L',
          status: 'Hidup',
          birthYear: '1974'
        }
      ]
    },
    {
      tempId: 'wc_2',
      childIndex: 2,
      name: 'Bser Enit',
      nickname: '',
      gender: 'L',
      status: 'Almarhum',
      birthYear: '1945',
      isSubOpen: false,
      subChildren: []
    }
  ]);

  // ================= PARSER BARIS KOMA (a, b, c, d, f, s, g) =================
  const parsedRows: ParsedCommaRow[] = useMemo(() => {
    const lines = commaInputText.split('\n');
    const result: ParsedCommaRow[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
        return; // Lewati baris kosong atau komentar
      }

      // Split berdasar koma
      const parts = trimmed.split(',').map(p => p.trim());
      const rowNum = index + 1;

      if (parts.length < 7) {
        result.push({
          rawLine: line,
          lineNumber: rowNum,
          a: parts[0] || '',
          b: parts[1] || '',
          c: parts[2] || '',
          d: parts[3] || null,
          f: parts[4] || '',
          s: parts[5] || '',
          g: parts[6] || '',
          isValid: false,
          errorMsg: `Kurang kolom: Ditemukan ${parts.length} dari 7 variabel yang dibutuhkan (a, b, c, d, f, s, g)`
        });
        return;
      }

      const [rawA, rawB, rawC, rawD, rawF, rawS, rawG] = parts;

      // Normalisasi d (null / - / 0 / empty)
      const cleanD =
        !rawD || rawD.toLowerCase() === 'null' || rawD === '-' || rawD === 'none'
          ? null
          : rawD;

      // Normalisasi f (pasangan)
      const cleanF = rawF === '-' || rawF.toLowerCase() === 'null' ? '' : rawF;

      // Cek validitas minimal: a (kode dot) dan b (nama) harus ada
      if (!rawA || !rawB) {
        result.push({
          rawLine: line,
          lineNumber: rowNum,
          a: rawA,
          b: rawB,
          c: rawC,
          d: cleanD,
          f: cleanF,
          s: rawS,
          g: rawG,
          isValid: false,
          errorMsg: 'ID Dot (a) dan Nama Lengkap (b) tidak boleh kosong'
        });
        return;
      }

      result.push({
        rawLine: line,
        lineNumber: rowNum,
        a: rawA,
        b: rawB,
        c: rawC,
        d: cleanD,
        f: cleanF,
        s: rawS,
        g: rawG,
        isValid: true
      });
    });

    return result;
  }, [commaInputText]);

  const validRows = useMemo(() => parsedRows.filter(r => r.isValid), [parsedRows]);
  const errorRows = useMemo(() => parsedRows.filter(r => !r.isValid), [parsedRows]);

  // Deteksi gender otomatis dari Sapaan Universal (c)
  const inferGender = (sapaan: string): 'L' | 'P' => {
    const s = (sapaan || '').toLowerCase();
    if (
      s.includes('bapak') ||
      s.includes('aang') ||
      s.includes('aki') ||
      s.includes('mbah kakung') ||
      s.includes('paman') ||
      s.includes('om') ||
      s.includes('kakek')
    ) {
      return 'L';
    }
    if (
      s.includes('ibu') ||
      s.includes('emak') ||
      s.includes('nini') ||
      s.includes('mbah putri') ||
      s.includes('bibi') ||
      s.includes('tante') ||
      s.includes('nenek') ||
      s.includes('teteh')
    ) {
      return 'P';
    }
    return 'L';
  };

  // Deteksi status hidup otomatis dari Status Hidup / Catatan (g)
  const inferStatus = (statusStr: string): 'Hidup' | 'Almarhum' => {
    const st = (statusStr || '').toLowerCase();
    if (
      st.includes('wafat') ||
      st.includes('almarhum') ||
      st.includes('meninggal') ||
      st.includes('rip')
    ) {
      return 'Almarhum';
    }
    return 'Hidup';
  };

  // ================= ALGORITMA POSISI OTOMATIS ANTI-SILANG =================
  // Menggunakan partisi hierarki bebas benturan (Buchheim-Walker/Disjoint Subtrees):
  // 1. Setiap anak dialokasikan rentang horizontal [left, left + subtreeWidth] yang terisolasi total.
  // 2. Garis vertikal-siku konektor tidak pernah memotong garis cabang keluarga saudara manapun.
  const buildAntiCrossingTreeLayout = (rows: ParsedCommaRow[]): FamilyMember[] => {
    if (rows.length === 0) return [];

    const CARD_WIDTH = 270;
    const CARD_HEIGHT = 185;
    const GAP_X = 50;
    const GAP_Y = 70;
    const START_Y = 120;
    const CANVAS_CENTER_X = 1800;

    // Buat map node pohon
    const nodeMap = new Map<string, TreeNode>();

    rows.forEach(r => {
      const isAlmarhum = inferStatus(r.g) === 'Almarhum';
      const cleanName = formatCleanDisplayTitle(r.c, r.b);

      const node: TreeNode = {
        dotId: r.a,
        name: r.b,
        sapaan: r.c,
        cleanName,
        parentDotId: r.d,
        spouse: r.f,
        level: r.s,
        status: isAlmarhum ? 'Almarhum' : 'Hidup',
        children: [],
        subtreeWidth: CARD_WIDTH,
        x: 0,
        y: 0,
        depth: 0
      };
      nodeMap.set(r.a, node);
    });

    // Hubungkan relasi orang tua -> anak
    const roots: TreeNode[] = [];
    nodeMap.forEach(node => {
      if (node.parentDotId && nodeMap.has(node.parentDotId) && node.parentDotId !== node.dotId) {
        const parent = nodeMap.get(node.parentDotId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Urutkan anak-anak berdasarkan dot notation secara alami (e.g. 0.1 sebelum 0.2, 0.1.1 sebelum 0.1.2)
    const sortChildrenRecursively = (n: TreeNode) => {
      n.children.sort((childA, childB) => {
        return childA.dotId.localeCompare(childB.dotId, undefined, { numeric: true, sensitivity: 'base' });
      });
      n.children.forEach(sortChildrenRecursively);
    };
    roots.forEach(sortChildrenRecursively);

    // Langkah 1: Bottom-Up Pass - Hitung lebar subtree masing-masing simpul
    const computeSubtreeWidth = (n: TreeNode, currentDepth: number): number => {
      n.depth = currentDepth;
      if (n.children.length === 0) {
        n.subtreeWidth = CARD_WIDTH;
        return n.subtreeWidth;
      }

      let totalChildW = 0;
      n.children.forEach(child => {
        totalChildW += computeSubtreeWidth(child, currentDepth + 1);
      });
      totalChildW += (n.children.length - 1) * GAP_X;

      n.subtreeWidth = Math.max(CARD_WIDTH, totalChildW);
      return n.subtreeWidth;
    };

    roots.forEach(r => computeSubtreeWidth(r, 0));

    // Langkah 2: Top-Down Pass - Berikan posisi X dan Y bebas tumpang tindih & bebas garis silang
    const assignPositions = (n: TreeNode, leftBound: number, startYPos: number) => {
      n.y = startYPos + n.depth * (CARD_HEIGHT + GAP_Y);

      if (n.children.length === 0) {
        n.x = Math.round(leftBound + (n.subtreeWidth - CARD_WIDTH) / 2);
        return;
      }

      // Rentang total anak-anak
      let childrenTotalWidth = 0;
      n.children.forEach(c => {
        childrenTotalWidth += c.subtreeWidth;
      });
      childrenTotalWidth += (n.children.length - 1) * GAP_X;

      // Pusatkan anak-anak relatif terhadap ruang alokasi induk
      let currentChildLeft = leftBound + (n.subtreeWidth - childrenTotalWidth) / 2;

      n.children.forEach(child => {
        assignPositions(child, currentChildLeft, startYPos);
        currentChildLeft += child.subtreeWidth + GAP_X;
      });

      // Posisikan induk tepat di tengah-tengah rentang anak pertama dan anak terakhirnya
      const firstChild = n.children[0];
      const lastChild = n.children[n.children.length - 1];
      n.x = Math.round((firstChild.x + lastChild.x) / 2);
    };

    // Pusatkan semua akar di kanvas
    let totalForestWidth = 0;
    roots.forEach(r => {
      totalForestWidth += r.subtreeWidth;
    });
    totalForestWidth += Math.max(0, roots.length - 1) * (GAP_X * 2);

    let forestLeft = Math.max(80, CANVAS_CENTER_X - Math.round(totalForestWidth / 2));
    roots.forEach(r => {
      assignPositions(r, forestLeft, START_Y);
      forestLeft += r.subtreeWidth + GAP_X * 2;
    });

    // Langkah 3: Konversi TreeNode ke FamilyMember[] yang siap dipakai di aplikasi
    // Memetakan ID string unik namun mempertahankan relasi parentId
    const dotToGeneratedId = new Map<string, string>();
    const timestamp = Date.now();

    nodeMap.forEach(n => {
      const generatedId = `m_${n.dotId.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
      dotToGeneratedId.set(n.dotId, generatedId);
    });

    const finalMembers: FamilyMember[] = [];

    nodeMap.forEach(n => {
      const generatedId = dotToGeneratedId.get(n.dotId)!;
      const parentGenId = n.parentDotId ? dotToGeneratedId.get(n.parentDotId) : undefined;
      const gender = inferGender(n.sapaan);

      // Tentukan peran silsilah ramah manusia
      let relationType: FamilyMember['relation'] = 'anak';
      if (!n.parentDotId) {
        relationType = 'buyut';
      } else if (n.depth === 1) {
        relationType = 'anak';
      } else if (n.depth >= 2) {
        relationType = 'cucu';
      }

      const roleDisplay = !n.parentDotId
        ? 'Leluhur Utama'
        : n.depth === 1
        ? `Anak (${n.sapaan || 'Keturunan'})`
        : `Cucu (${n.sapaan || 'Keturunan'})`;

      const newMember: FamilyMember = {
        id: generatedId,
        parentId: parentGenId,
        // Nama bersih: di layar HP nanti akan ditampilkan [Sapaan (c)] + [Nama (b)]
        name: n.name,
        kinshipTitle: n.sapaan,
        role: roleDisplay,
        relation: relationType,
        trah: targetTrah,
        gender,
        birthYear: n.status === 'Almarhum' ? '1940' : '1975',
        status: n.status,
        canvasX: n.x,
        canvasY: n.y,
        // PARAMETER INTERNAL: Disimpan rapi untuk layout & relasi, namun 100% disembunyikan dari kartu HP
        batchDotId: n.dotId, // (a)
        batchParentDotId: n.parentDotId || undefined, // (d)
        batchLevel: n.level, // (s)
        spouseRelation: n.spouse || undefined // (f)
      };

      finalMembers.push(newMember);
    });

    return finalMembers;
  };

  // Simpan Batch Koma ke Aplikasi Silsilah
  const handleProcessAndSaveCommaBatch = () => {
    if (validRows.length === 0) {
      showNotification('Tidak ada baris data valid untuk diproses. Cek format koma.');
      return;
    }

    const convertedMembers = buildAntiCrossingTreeLayout(validRows);

    if (convertedMembers.length === 0) {
      showNotification('Gagal mengonversi struktur pohon silsilah.');
      return;
    }

    onSaveBatch(convertedMembers);
    showNotification(
      `Sukses! ${convertedMembers.length} anggota silsilah berformat koma berhasil diproses dan disusun dengan tata letak anti-silang di kanvas!`
    );
    onClose();
  };

  // Helper cepat: Tambah Baris Contoh Baru
  const handleAppendSampleRow = (templateType: 'child' | 'grandchild' | 'great_grandchild') => {
    setCommaInputText(prev => {
      const current = prev.trim();
      let nextLine = '';
      if (templateType === 'child') {
        const count = validRows.filter(r => r.d === '0').length + 1;
        nextLine = `0.${count}, Anak Baru ke-${count}, Bapak, 0, -, L1, Ada`;
      } else if (templateType === 'grandchild') {
        const count = validRows.filter(r => r.d === '0.1').length + 1;
        nextLine = `0.1.${count}, Cucu Baru ke-${count}, Bapak, 0.1, -, L2, Ada`;
      } else {
        nextLine = `0.1.1.1, Cicit Generasi 3, Ibu, 0.1.1, -, L3, Ada`;
      }
      return current ? `${current}\n${nextLine}` : nextLine;
    });
  };

  // Reset ke Prompt User Default
  const handleResetToUserPrompt = () => {
    setCommaInputText(DEFAULT_PROMPT_DATA);
    showNotification('Data dikembalikan ke format prompt pengguna');
  };

  // ================= HANDLERS MODE WIZARD =================
  const handleSaveWizardBatch = () => {
    let rootMember: FamilyMember;
    const newMembers: FamilyMember[] = [];
    const timestamp = Date.now();

    if (rootMode === 'create_new') {
      if (!rootName.trim()) {
        showNotification('Nama tokoh induk tidak boleh kosong');
        return;
      }
      const rootId = `wizard_root_${timestamp}`;
      rootMember = {
        id: rootId,
        name: rootName.trim(),
        kinshipTitle: rootTitle.trim() || 'Bapak',
        role: 'Leluhur Utama',
        relation: 'buyut',
        trah: targetTrah,
        gender: rootGender,
        birthYear: rootBirthYear || '1920',
        status: rootStatus,
        canvasX: 1800,
        canvasY: 120,
        batchDotId: '0',
        batchLevel: 'L0'
      };
      newMembers.push(rootMember);
    } else {
      const found = existingMembers.find(m => m.id === selectedRootId);
      if (!found) {
        showNotification('Pilih tokoh induk terlebih dahulu');
        return;
      }
      rootMember = found;
    }

    const validChildren = wizardChildren.filter(c => c.name.trim());
    if (validChildren.length === 0 && rootMode !== 'create_new') {
      showNotification('Tambahkan minimal 1 anak');
      return;
    }

    const CARD_WIDTH = 270;
    const GAP_X = 50;
    const totalChildW = validChildren.length * CARD_WIDTH + Math.max(0, validChildren.length - 1) * GAP_X;
    const childStartX = (rootMember.canvasX || 1800) + Math.round(CARD_WIDTH / 2) - Math.round(totalChildW / 2);

    validChildren.forEach((child, cIdx) => {
      const childId = `wizard_c_${timestamp}_${cIdx + 1}`;
      const childX = childStartX + cIdx * (CARD_WIDTH + GAP_X);
      const childY = (rootMember.canvasY || 120) + 185 + 70;

      const childMember: FamilyMember = {
        id: childId,
        parentId: rootMember.id,
        name: child.name.trim(),
        kinshipTitle: child.gender === 'L' ? 'Bapak' : 'Ibu',
        role: `Anak ke-${child.childIndex}`,
        relation: 'anak',
        trah: targetTrah,
        gender: child.gender,
        birthYear: child.birthYear || '1950',
        status: child.status,
        canvasX: childX,
        canvasY: childY,
        batchDotId: `0.${child.childIndex}`,
        batchParentDotId: '0',
        batchLevel: 'L1'
      };
      newMembers.push(childMember);

      // Sub-children (cucu)
      const validSubs = child.subChildren.filter(s => s.name.trim());
      validSubs.forEach((sub, sIdx) => {
        const subId = `wizard_sc_${timestamp}_${cIdx + 1}_${sIdx + 1}`;
        const subX = childX + (sIdx - (validSubs.length - 1) / 2) * (CARD_WIDTH + 30);
        const subY = childY + 185 + 70;

        const subMember: FamilyMember = {
          id: subId,
          parentId: childId,
          name: sub.name.trim(),
          kinshipTitle: sub.gender === 'L' ? 'Bapak' : 'Ibu',
          role: `Cucu (${sub.subNo})`,
          relation: 'cucu',
          trah: targetTrah,
          gender: sub.gender,
          birthYear: sub.birthYear || '1980',
          status: sub.status,
          canvasX: subX,
          canvasY: subY,
          batchDotId: `0.${child.childIndex}.${sIdx + 1}`,
          batchParentDotId: `0.${child.childIndex}`,
          batchLevel: 'L2'
        };
        newMembers.push(subMember);
      });
    });

    onSaveBatch(newMembers);
    showNotification(`Sukses! ${newMembers.length} anggota keluarga berhasil ditambahkan.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-5 shadow-2xl relative border-2 border-emerald-300 text-slate-800 max-h-[94vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-start justify-between pb-3 border-b border-emerald-100 shrink-0 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 shrink-0">
              <Sparkles className="w-5 h-5 text-[#5eead4]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Batch Isi Cepat Silsilah
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-black uppercase tracking-wide">
                  Separator Koma (a, b, c, d, f, s, g)
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
                Konversi data koma &rarr; posisi otomatis anti-silang pohon kanvas &rarr; nama bersih di layar HP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Trah Chooser */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-2.5 border-b border-slate-100 shrink-0">
          {/* Main Tab Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('comma_text')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'comma_text'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Prompt Separator Koma</span>
              <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                Utama
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('interactive_wizard')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'interactive_wizard'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Form Wizard Interaktif</span>
            </button>
          </div>

          {/* Trah Target Selection */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Trah:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTargetTrah('ayah')}
                className={`px-2 py-1 rounded-md transition ${
                  targetTrah === 'ayah' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                Ayah
              </button>
              <button
                type="button"
                onClick={() => setTargetTrah('ibu')}
                className={`px-2 py-1 rounded-md transition ${
                  targetTrah === 'ibu' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-purple-700'
                }`}
              >
                Ibu
              </button>
              <button
                type="button"
                onClick={() => setTargetTrah('inti')}
                className={`px-2 py-1 rounded-md transition ${
                  targetTrah === 'inti' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Inti
              </button>
            </div>
          </div>
        </div>

        {/* ================= BODY CONTENT ================= */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-4">
          {activeTab === 'comma_text' ? (
            /* ================= TAB 1: PROMPT BATCH KOMA (a, b, c, d, f, s, g) ================= */
            <div className="space-y-4">
              {/* Box Keterangan Urutan 7 Variabel */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                    Kamus Urutan 7 Variabel (Separator Koma)
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">Format: a, b, c, d, f, s, g</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                  <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="font-mono font-black text-emerald-800 block">a = ID Dot</span>
                    <span className="text-slate-500">Contoh: 0, 0.1, 0.1.2</span>
                    <span className="text-[9px] text-amber-700 font-bold block mt-0.5">🔒 Internal HP</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="font-mono font-black text-blue-800 block">b = Nama Lengkap</span>
                    <span className="text-slate-500">Contoh: Madgani, Inoh</span>
                    <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">📱 Tampil HP</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="font-mono font-black text-purple-800 block">c = Sapaan</span>
                    <span className="text-slate-500">Contoh: Bapak, Ibu, Mbah</span>
                    <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">📱 Tampil HP</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="font-mono font-black text-emerald-800 block">d = ID Ortu</span>
                    <span className="text-slate-500">Contoh: 0 atau null</span>
                    <span className="text-[9px] text-amber-700 font-bold block mt-0.5">🔒 Internal HP</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="font-mono font-black text-rose-800 block">f = Pasangan</span>
                    <span className="text-slate-500">Contoh: Ibu Madgani / -</span>
                    <span className="text-[9px] text-rose-600 font-bold block mt-0.5">💍 Simpul Relasi</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="font-mono font-black text-indigo-800 block">s = Level Trah</span>
                    <span className="text-slate-500">Contoh: L0, L1, L2</span>
                    <span className="text-[9px] text-amber-700 font-bold block mt-0.5">🔒 Internal HP</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs col-span-2 sm:col-span-2">
                    <span className="font-mono font-black text-emerald-800 block">g = Status Hidup / Catatan</span>
                    <span className="text-slate-500">Contoh: Ada, Wafat, Almarhum</span>
                    <span className="text-[9px] text-slate-700 font-bold block mt-0.5">🌿 Indikator Status</span>
                  </div>
                </div>

                {/* Banner Aturan Layar HP */}
                <div className="bg-emerald-900 text-emerald-100 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#5eead4] shrink-0" />
                    <p className="text-[11px] leading-relaxed">
                      <strong className="text-white">Aturan Pemrosesan UI:</strong> Parameter internal{' '}
                      <code className="text-[#5eead4] bg-emerald-950 px-1 py-0.2 rounded font-mono font-bold">(a, d, s)</code>{' '}
                      disembunyikan total di layar HP. Kartu hanya menampilkan{' '}
                      <strong className="text-amber-300 font-bold">[Sapaan (c)] + [Nama (b)]</strong> secara bersih.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-[10px] bg-emerald-800 px-2 py-1 rounded-lg text-emerald-200 shrink-0">
                    <Smartphone className="w-3.5 h-3.5 text-[#5eead4]" />
                    <span>Layar HP Bersih</span>
                  </div>
                </div>
              </div>

              {/* Textarea Input Editor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span>Input Baris Data Silsilah (Separator Koma):</span>
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {validRows.length} baris siap diproses
                    </span>
                  </label>

                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={handleResetToUserPrompt}
                      className="px-2 py-1 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition flex items-center gap-1 font-bold"
                      title="Kembalikan ke data prompt default"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Contoh Prompt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommaInputText('')}
                      className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 font-bold"
                      title="Kosongkan Textarea"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Kosongkan</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={commaInputText}
                  onChange={e => setCommaInputText(e.target.value)}
                  rows={6}
                  placeholder={`0, Bapak Uyut Utama, Bapak, null, -, L0, Wafat\n0.1, Madgani, Bapak, 0, Ibu Madgani, L1, Wafat\n0.2, Bser Enit, Bapak, 0, Ibu Saripah, L1, Wafat\n0.1.1, Mangani, Bapak, 0.1, Ibu Rohim, L2, Ada\n0.1.2, Inoh, Bapak, 0.1, Ibu Santa, L2, Ada`}
                  className="w-full p-3 font-mono text-xs sm:text-[13px] bg-slate-900 text-emerald-300 border-2 border-slate-700 focus:border-emerald-500 rounded-2xl outline-hidden leading-relaxed resize-y shadow-inner transition select-text"
                />

                {/* Quick Append Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400">Tambah Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleAppendSampleRow('child')}
                    className="px-2 py-1 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Anak Baru (0.x)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendSampleRow('grandchild')}
                    className="px-2 py-1 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Cucu (0.1.x)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAppendSampleRow('great_grandchild')}
                    className="px-2 py-1 text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg border border-purple-200 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Cicit (0.1.1.x)</span>
                  </button>
                </div>
              </div>

              {/* Parsing Warnings / Errors if any */}
              {errorRows.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 space-y-1 text-xs text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Perhatian: Ada {errorRows.length} baris dengan format tidak lengkap</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700 pl-1">
                    {errorRows.slice(0, 3).map((err, i) => (
                      <li key={i}>
                        Baris {err.lineNumber}: {err.errorMsg} &rarr; <code className="font-mono text-[10px]">{err.rawLine}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* LIVE PREVIEW TABLE: TAMPILAN BERSIH LAYAR HP VS PARAMETER INTERNAL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Pratinjau Konversi &amp; Tampilan Bersih Layar HP
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('all')}
                      className={`px-2 py-0.5 rounded-md transition ${
                        previewFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Semua ({parsedRows.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('valid')}
                      className={`px-2 py-0.5 rounded-md transition ${
                        previewFilter === 'valid' ? 'bg-emerald-700 text-white' : 'text-slate-500 hover:text-emerald-700'
                      }`}
                    >
                      Valid ({validRows.length})
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                  <div className="overflow-x-auto max-h-56 no-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-black tracking-wider border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">
                            <span className="flex items-center gap-1">
                              <span>Tampilan Bersih Layar HP</span>
                              <span className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded text-[8px] font-black">
                                [c] + [b]
                              </span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3">Pasangan [f]</th>
                          <th className="py-2.5 px-3">Status [g]</th>
                          <th className="py-2.5 px-3 text-slate-400">
                            <span className="flex items-center gap-1">
                              <span>Parameter Internal</span>
                              <span className="bg-amber-100 text-amber-800 px-1 py-0.2 rounded text-[8px] font-black">
                                Hidden (a, d, s)
                              </span>
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {parsedRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                              Belum ada data silsilah. Masukkan baris data di textarea atas.
                            </td>
                          </tr>
                        ) : (
                          parsedRows
                            .filter(r => (previewFilter === 'valid' ? r.isValid : previewFilter === 'errors' ? !r.isValid : true))
                            .map((row, idx) => {
                              const cleanTitle = formatCleanDisplayTitle(row.c, row.b);
                              const isAlmarhum = inferStatus(row.g) === 'Almarhum';
                              const gender = inferGender(row.c);

                              return (
                                <tr
                                  key={idx}
                                  className={`hover:bg-emerald-50/50 transition ${
                                    !row.isValid ? 'bg-rose-50/40 text-rose-900' : ''
                                  }`}
                                >
                                  {/* Nomor */}
                                  <td className="py-2.5 px-3 text-[11px] font-mono text-slate-400">
                                    {row.lineNumber}
                                  </td>

                                  {/* Tampilan Bersih Layar HP: [Sapaan (c)] + [Nama (b)] */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-6 h-6 rounded-full text-white text-[9px] font-black flex items-center justify-center shrink-0 ${
                                          gender === 'L' ? 'bg-blue-600' : 'bg-pink-600'
                                        }`}
                                      >
                                        {gender}
                                      </div>
                                      <div>
                                        <p className="font-extrabold text-slate-900 text-xs">
                                          {cleanTitle}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                          Sapaan: <span className="font-semibold text-slate-600">{row.c || '-'}</span> • Nama: <span className="font-semibold text-slate-600">{row.b}</span>
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Pasangan [f] */}
                                  <td className="py-2.5 px-3 text-[11px]">
                                    {row.f && row.f !== '-' ? (
                                      <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded-lg border border-rose-200">
                                        💍 {row.f}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">-</span>
                                    )}
                                  </td>

                                  {/* Status [g] */}
                                  <td className="py-2.5 px-3 text-[11px]">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                        isAlmarhum
                                          ? 'bg-slate-200 text-slate-700'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isAlmarhum ? 'bg-slate-500' : 'bg-emerald-500'
                                        }`}
                                      />
                                      {row.g || (isAlmarhum ? 'Wafat' : 'Ada')}
                                    </span>
                                  </td>

                                  {/* Parameter Internal (a, d, s) - Disembunyikan di Layar HP */}
                                  <td className="py-2.5 px-3 text-[10px] font-mono text-slate-500">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200" title="a = ID Dot Notation">
                                        a: {row.a}
                                      </span>
                                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200" title="d = ID Ortu / Relasi Atas">
                                        d: {row.d ?? 'null'}
                                      </span>
                                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200" title="s = Level Trah">
                                        s: {row.s || '-'}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Algoritma Anti-Silang Visual Note */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
                <GitFork className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-blue-950">
                    Logika Posisi Otomatis Anti-Silang (Tree Disjoint Partitioning):
                  </p>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Setiap simpul orang tua dan keturunannya dialokasikan rentang kanvas horizontal terisolasi. Posisi simpul anak dihitung secara matematis tepat di bawah rentang induknya sehingga garis silsilah siku 90° tidak pernah bersilangan atau tumpang tindih.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ================= TAB 2: FORM WIZARD INTERAKTIF ================= */
            <div className="space-y-4">
              {/* STEP 1: PILIH / BUAT TOKOH UTAMA (ROOT) */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      Tokoh Induk / Leluhur (Uyut / Kakek)
                    </span>
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex items-center bg-white rounded-xl p-0.5 border border-emerald-200 text-xs font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setRootMode('create_new')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        rootMode === 'create_new'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      Buat Tokoh Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setRootMode('select_existing')}
                      disabled={existingMembers.length === 0}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        rootMode === 'select_existing'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-800 disabled:opacity-40'
                      }`}
                    >
                      Pilih Dari Yang Ada
                    </button>
                  </div>
                </div>

                {rootMode === 'create_new' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Nama Lengkap Tokoh</label>
                      <input
                        type="text"
                        value={rootName}
                        onChange={e => setRootName(e.target.value)}
                        placeholder="Contoh: Bapak Uyut Utama"
                        className="w-full p-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold focus:border-emerald-500 outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">Sapaan Universal</label>
                      <input
                        type="text"
                        value={rootTitle}
                        onChange={e => setRootTitle(e.target.value)}
                        placeholder="Contoh: Bapak / Uyut"
                        className="w-full p-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold focus:border-emerald-500 outline-hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Pilih Anggota Induk:</label>
                    <select
                      value={selectedRootId}
                      onChange={e => setSelectedRootId(e.target.value)}
                      className="w-full p-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold focus:border-emerald-500 outline-hidden"
                    >
                      {existingMembers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.kinshipTitle ? `${m.kinshipTitle} ` : ''}{m.name} ({m.role || m.relation})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* STEP 2: DAFTAR ANAK (1, 2, 3...) & CUCU (2.1, 2.2...) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Daftar Anak &amp; Cucu Bertingkat
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextNo = wizardChildren.length + 1;
                      setWizardChildren(prev => [
                        ...prev,
                        {
                          tempId: `wc_${Date.now()}_${nextNo}`,
                          childIndex: nextNo,
                          name: `Anak ke-${nextNo}`,
                          gender: nextNo % 2 === 1 ? 'L' : 'P',
                          status: 'Hidup',
                          birthYear: '',
                          subChildren: [],
                          isSubOpen: false
                        }
                      ]);
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Anak</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {wizardChildren.map((c, cIdx) => (
                    <div
                      key={c.tempId}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black bg-emerald-800 text-white px-2 py-0.5 rounded-lg">
                            Anak #{c.childIndex}
                          </span>
                          <input
                            type="text"
                            value={c.name}
                            onChange={e => {
                              const val = e.target.value;
                              setWizardChildren(prev => {
                                const next = [...prev];
                                next[cIdx].name = val;
                                return next;
                              });
                            }}
                            className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:border-emerald-500 outline-hidden w-44"
                            placeholder="Nama Anak"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setWizardChildren(prev => {
                                const next = [...prev];
                                const subNo = `${c.childIndex}.${next[cIdx].subChildren.length + 1}`;
                                next[cIdx].subChildren.push({
                                  tempId: `wsc_${Date.now()}_${subNo}`,
                                  subNo,
                                  name: `Cucu (${subNo})`,
                                  gender: 'L',
                                  status: 'Hidup'
                                });
                                next[cIdx].isSubOpen = true;
                                return next;
                              });
                            }}
                            className="px-2 py-1 text-[11px] font-bold bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                          >
                            + Cucu ({c.childIndex}.x)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setWizardChildren(prev => prev.filter((_, i) => i !== cIdx));
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sub-children list */}
                      {c.subChildren.length > 0 && (
                        <div className="pl-4 border-l-2 border-emerald-300 space-y-1.5 pt-1">
                          {c.subChildren.map((s, sIdx) => (
                            <div key={s.tempId} className="flex items-center gap-2 text-xs">
                              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                                {s.subNo}
                              </span>
                              <input
                                type="text"
                                value={s.name}
                                onChange={e => {
                                  const val = e.target.value;
                                  setWizardChildren(prev => {
                                    const next = [...prev];
                                    next[cIdx].subChildren[sIdx].name = val;
                                    return next;
                                  });
                                }}
                                className="p-1 bg-white border border-slate-300 rounded text-xs font-semibold w-40"
                                placeholder="Nama Cucu"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setWizardChildren(prev => {
                                    const next = [...prev];
                                    next[cIdx].subChildren = next[cIdx].subChildren.filter((_, si) => si !== sIdx);
                                    return next;
                                  });
                                }}
                                className="p-1 text-slate-300 hover:text-rose-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= FOOTER ACTIONS ================= */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {activeTab === 'comma_text'
                ? `${validRows.length} baris koma valid akan diproses ke kanvas silsilah`
                : `${wizardChildren.length} anak siap disimpan`}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={
                activeTab === 'comma_text'
                  ? handleProcessAndSaveCommaBatch
                  : handleSaveWizardBatch
              }
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-[#5eead4]" />
              <span>Proses &amp; Simpan ke Silsilah</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
