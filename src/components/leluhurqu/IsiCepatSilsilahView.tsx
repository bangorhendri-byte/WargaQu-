import React, { useState, useMemo } from 'react';
import {
  Plus,
  Sparkles,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Upload,
  Copy,
  Edit3,
  Trash2,
  ChevronRight,
  User,
  Users,
  GitFork,
  FileSpreadsheet,
  Eye,
  Printer,
  RotateCcw,
  Info,
  Check,
  AlertTriangle,
  ArrowRight,
  Layers,
  HelpCircle
} from 'lucide-react';
import { FamilyMember } from './LeluhurQuView';
import { UserAccount } from '../../types';
import { PratinjauSilsilahEngine } from './PratinjauSilsilahEngine';
import { DEMO_SANTA_MEMBERS } from './demoData';

export interface IsiCepatSilsilahViewProps {
  members: FamilyMember[];
  setMembers: React.Dispatch<React.SetStateAction<FamilyMember[]>>;
  showNotification: (msg: string) => void;
  currentUser?: UserAccount | null;
  externalViewMode?: 'editor' | 'preview_tree';
  onViewModeChange?: (mode: 'editor' | 'preview_tree') => void;
}

export const IsiCepatSilsilahView: React.FC<IsiCepatSilsilahViewProps> = ({
  members,
  setMembers,
  showNotification,
  currentUser,
  externalViewMode,
  onViewModeChange,
}) => {
  // Mode Tampilan: 'editor' (Tabel & Input Koma) vs 'preview_tree' (Bagan Pohon Visual & Kertas Cetak)
  const [internalViewMode, setInternalViewMode] = useState<'editor' | 'preview_tree'>('editor');
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setViewMode = (mode: 'editor' | 'preview_tree') => {
    setInternalViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  // Selected Person for Hierarchy Inspection & Adding/Editing Children
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');

  // Form Mode for Children Input: 'add' or 'edit'
  const [childrenInputText, setChildrenInputText] = useState<string>('');
  const [isEditingChildren, setIsEditingChildren] = useState<boolean>(false);

  // Modal / Form: Tambah Tokoh Baru / Leluhur Awal (Root atau Tokoh Bebas)
  const [showAddPersonModal, setShowAddPersonModal] = useState<boolean>(false);
  const [newPersonName, setNewPersonName] = useState<string>('');
  const [newPersonGender, setNewPersonGender] = useState<'L' | 'P'>('L');
  const [newPersonStatus, setNewPersonStatus] = useState<'Hidup' | 'Almarhum'>('Almarhum');
  const [newPersonParentId, setNewPersonParentId] = useState<string>('');
  const [newPersonInitialChildren, setNewPersonInitialChildren] = useState<string>('');
  const [newPersonTrah, setNewPersonTrah] = useState<FamilyMember['trah']>('ayah');

  // Excel-like Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterGeneration, setFilterGeneration] = useState<string>('all');
  const [filterParentId, setFilterParentId] = useState<string>('all');
  const [filterTrah, setFilterTrah] = useState<string>('all');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Quick helper: Parse koma, baris baru, nomor (1. 2.), atau titik koma
  const parseCommaNames = (text: string): string[] => {
    if (!text) return [];
    return text
      .split(/[,;\n]+/)
      .map((item) => {
        // Hapus penomoran seperti "1.", "2)", "-", "•" di awal nama
        return item.replace(/^\s*(\d+[\.\)]|\-|\•)\s*/, '').trim();
      })
      .filter((name) => name.length > 0);
  };

  // Helper: Dapatkan silsilah leluhur ke atas (Uyut, Abah, dst)
  const getAncestorTrail = (
    personId: string,
    allMembers: FamilyMember[] = members
  ): { uyut?: FamilyMember; abah?: FamilyMember; kakek?: FamilyMember; bapak?: FamilyMember; allAncestors: FamilyMember[] } => {
    const ancestors: FamilyMember[] = [];
    let current = allMembers.find((m) => m.id === personId);

    while (current && current.parentId) {
      const parent = allMembers.find((m) => m.id === current?.parentId);
      if (parent) {
        ancestors.unshift(parent); // oldest ancestor first
        current = parent;
      } else {
        break;
      }
    }

    const self = allMembers.find((m) => m.id === personId);
    let uyut: FamilyMember | undefined;
    let abah: FamilyMember | undefined;
    let bapak: FamilyMember | undefined;

    if (ancestors.length === 1) {
      // 1 ancestor: Ayah/Ibu
      bapak = ancestors[0];
    } else if (ancestors.length === 2) {
      // 2 ancestors: Abah (Kakek) -> Bapak (Ayah)
      abah = ancestors[0];
      bapak = ancestors[1];
    } else if (ancestors.length >= 3) {
      // 3 or more ancestors: Uyut (Buyut) -> Abah (Kakek) -> Bapak (Ayah)
      uyut = ancestors[ancestors.length - 3];
      abah = ancestors[ancestors.length - 2];
      bapak = ancestors[ancestors.length - 1];
    }

    return { uyut, abah, bapak, allAncestors: ancestors };
  };

  // Helper: Hitung kedalaman generasi (Generasi 1, 2, 3...)
  const getGenerationNumber = (personId: string, allMembers: FamilyMember[] = members): number => {
    let count = 1;
    let current = allMembers.find((m) => m.id === personId);
    while (current && current.parentId) {
      count++;
      current = allMembers.find((m) => m.id === current?.parentId);
    }
    return count;
  };

  // Helper: Dapatkan daftar anak
  const getChildrenOf = (personId: string, allMembers: FamilyMember[] = members): FamilyMember[] => {
    return allMembers
      .filter((m) => m.parentId === personId)
      .sort((a, b) => (a.birthOrder || 0) - (b.birthOrder || 0));
  };

  // Tokoh yang sedang dipilih
  const selectedPerson = useMemo(() => {
    if (!selectedPersonId) return null;
    return members.find((m) => m.id === selectedPersonId) || null;
  }, [selectedPersonId, members]);

  // Anak-anak dari tokoh yang sedang dipilih
  const selectedPersonChildren = useMemo(() => {
    if (!selectedPersonId) return [];
    return getChildrenOf(selectedPersonId, members);
  }, [selectedPersonId, members]);

  // Hierarki silsilah otomatis (Uyut, Abah, Bapak, Anak)
  const lineageTrail = useMemo(() => {
    if (!selectedPersonId) return null;
    const { uyut, abah, bapak, allAncestors } = getAncestorTrail(selectedPersonId, members);
    return {
      uyut,
      abah,
      bapak,
      self: selectedPerson,
      children: selectedPersonChildren,
      allAncestors,
      gen: getGenerationNumber(selectedPersonId, members),
    };
  }, [selectedPersonId, selectedPerson, selectedPersonChildren, members]);

  // Auto-fill input text saat memilih person atau beralih ke mode edit
  const handleSelectPerson = (person: FamilyMember) => {
    setSelectedPersonId(person.id);
    const children = getChildrenOf(person.id, members);
    const names = children.map((c) => c.name).join(', ');
    setChildrenInputText(names);
    setIsEditingChildren(false);
  };

  // Mulai mode edit anak-anak
  const handleStartEditChildren = () => {
    if (!selectedPerson) return;
    const children = getChildrenOf(selectedPerson.id, members);
    const names = children.map((c) => c.name).join(', ');
    setChildrenInputText(names);
    setIsEditingChildren(true);
  };

  // Simpan / Perbarui Anak dari Input Koma
  const handleSaveChildrenFromComma = () => {
    if (!selectedPerson) {
      showNotification('Pilih tokoh orang tua terlebih dahulu.');
      return;
    }

    const parsedNames = parseCommaNames(childrenInputText);
    if (parsedNames.length === 0) {
      showNotification('Ketik nama anak dipisahkan tanda koma (contoh: maman, Ian, Hendri)');
      return;
    }

    const currentChildren = getChildrenOf(selectedPerson.id, members);
    const targetGen = getGenerationNumber(selectedPerson.id, members) + 1;

    // Jika sedang edit, sinkronkan nama yang ada atau tambah anak baru
    const updatedMembersList = [...members];
    const newChildrenCreated: FamilyMember[] = [];

    parsedNames.forEach((name, idx) => {
      if (idx < currentChildren.length && isEditingChildren) {
        // Edit anak yang sudah ada
        const existingChild = currentChildren[idx];
        const memberIdx = updatedMembersList.findIndex((m) => m.id === existingChild.id);
        if (memberIdx !== -1) {
          updatedMembersList[memberIdx] = {
            ...updatedMembersList[memberIdx],
            name: name,
            birthOrder: idx + 1,
          };
        }
      } else {
        // Tambah anak baru
        const newChild: FamilyMember = {
          id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: name,
          parentId: selectedPerson.id,
          relation: 'anak',
          trah: selectedPerson.trah || 'ayah',
          role: `Anak ke-${idx + 1} dari ${selectedPerson.name}`,
          kinshipTitle: `Generasi ${targetGen}`,
          gender: 'L',
          birthYear: '',
          status: 'Hidup',
          birthOrder: idx + 1,
        };
        updatedMembersList.push(newChild);
        newChildrenCreated.push(newChild);
      }
    });

    // Jika dalam mode edit dan user sengaja menghapus sebagian anak di input koma
    if (isEditingChildren && parsedNames.length < currentChildren.length) {
      const removedChildren = currentChildren.slice(parsedNames.length);
      const removedIds = new Set(removedChildren.map((rc) => rc.id));
      const filtered = updatedMembersList.filter((m) => !removedIds.has(m.id));
      setMembers(filtered);
    } else {
      setMembers(updatedMembersList);
    }

    setIsEditingChildren(false);
    showNotification(
      `Alhamdulillah! ${parsedNames.length} anak untuk ${selectedPerson.name} berhasil disimpan (${parsedNames.join(', ')}).`
    );
  };

  // Simpan Tokoh Baru (Bisa Leluhur Puncak atau Tokoh Baru dengan Anak Langsung)
  const handleSaveNewPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) {
      showNotification('Mohon isi nama tokoh/orang tua.');
      return;
    }

    const parent = newPersonParentId ? members.find((m) => m.id === newPersonParentId) : undefined;
    const parentGen = parent ? getGenerationNumber(parent.id, members) : 0;
    const targetGen = parentGen + 1;

    const newPersonId = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newPerson: FamilyMember = {
      id: newPersonId,
      name: newPersonName.trim(),
      parentId: newPersonParentId || undefined,
      relation: newPersonParentId ? 'anak' : 'ayah',
      trah: newPersonTrah,
      role: newPersonParentId
        ? `Anak dari ${parent?.name || 'Leluhur'}`
        : `Leluhur Utama (Generasi ${targetGen})`,
      kinshipTitle: targetGen === 1 ? 'Leluhur Utama / Uyut' : `Generasi ${targetGen}`,
      gender: newPersonGender,
      birthYear: '',
      status: newPersonStatus,
    };

    const nextMembers = [...members, newPerson];

    // Jika user langsung mengisi anak-anak di form tokoh baru:
    const initialChildrenNames = parseCommaNames(newPersonInitialChildren);
    if (initialChildrenNames.length > 0) {
      initialChildrenNames.forEach((childName, idx) => {
        nextMembers.push({
          id: `mem-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
          name: childName,
          parentId: newPersonId,
          relation: 'anak',
          trah: newPersonTrah,
          role: `Anak ke-${idx + 1} dari ${newPerson.name}`,
          kinshipTitle: `Generasi ${targetGen + 1}`,
          gender: 'L',
          birthYear: '',
          status: 'Hidup',
          birthOrder: idx + 1,
        });
      });
    }

    setMembers(nextMembers);
    setShowAddPersonModal(false);
    setSelectedPersonId(newPersonId);
    setChildrenInputText(initialChildrenNames.join(', '));
    setNewPersonName('');
    setNewPersonInitialChildren('');
    setNewPersonParentId('');

    showNotification(
      `Tokoh "${newPerson.name}" ${initialChildrenNames.length > 0 ? `dengan ${initialChildrenNames.length} anak` : ''} berhasil ditambahkan!`
    );
  };

  // Muat Contoh Skenario Sesuai Request User (Santa -> madgani -> Samud -> maman, Ian, Hendri)
  const handleLoadUserScenarioDemo = () => {
    setMembers(DEMO_SANTA_MEMBERS);
    setSelectedPersonId('samud-3');
    setChildrenInputText('maman, Ian, Hendri');
    setIsEditingChildren(false);
    showNotification('Contoh silsilah (Santa → madgani → Samud → maman, Ian, Hendri) berhasil dimuat!');
  };

  // Hapus Anggota
  const handleDeleteMember = (id: string, name: string) => {
    const hasChildren = members.some((m) => m.parentId === id);
    const confirmMsg = hasChildren
      ? `Perhatian: "${name}" memiliki anak di bawahnya. Menghapus akan memutuskan garis keturunan. Lanjutkan?`
      : `Hapus "${name}" dari silsilah?`;

    if (window.confirm(confirmMsg)) {
      const next = members.filter((m) => m.id !== id);
      setMembers(next);
      if (selectedPersonId === id) {
        setSelectedPersonId('');
        setChildrenInputText('');
      }
      showNotification(`"${name}" berhasil dihapus.`);
    }
  };

  // Ekspor Excel (CSV dengan BOM UTF-8 agar format terbaca sempurna di Microsoft Excel & Google Sheets)
  const handleExportExcelCSV = () => {
    if (members.length === 0) {
      showNotification('Belum ada data silsilah untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Nama Anggota',
      'Generasi',
      'Orang Tua (Ayah/Ibu)',
      'Garis Leluhur (Breadcrumb)',
      'Daftar Anak',
      'Jumlah Anak',
      'Status',
      'Trah',
    ];

    const rows = filteredMembers.map((m, idx) => {
      const parent = members.find((p) => p.id === m.parentId);
      const trail = getAncestorTrail(m.id, members);
      const ancestorsNames = [...trail.allAncestors.map((a) => a.name), m.name].join(' > ');
      const children = getChildrenOf(m.id, members);
      const childrenNames = children.map((c) => c.name).join(', ');
      const gen = getGenerationNumber(m.id, members);

      return [
        idx + 1,
        `"${m.name.replace(/"/g, '""')}"`,
        `"Generasi ${gen}"`,
        `"${(parent?.name || '-').replace(/"/g, '""')}"`,
        `"${ancestorsNames.replace(/"/g, '""')}"`,
        `"${childrenNames.replace(/"/g, '""')}"`,
        children.length,
        `"${m.status || 'Hidup'}"`,
        `"${m.trah || 'ayah'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Silsilah_LeluhurQu_Excel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('File Excel (.csv) silsilah berhasil diunduh!');
  };

  // Salin Rangkuman Pohon Teks ke Clipboard
  const handleCopyTextTree = () => {
    if (members.length === 0) {
      showNotification('Belum ada data silsilah.');
      return;
    }

    let text = `*SILSILAH KELUARGA BESAR LELUHURQU*\n`;
    text += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`;
    text += `Total Anggota: ${members.length} Orang\n`;
    text += `-------------------------------------------\n\n`;

    // Root members
    const roots = members.filter((m) => !m.parentId);
    const buildNodeText = (m: FamilyMember, indent = ''): string => {
      let nodeStr = `${indent}• ${m.name} (${m.status === 'Almarhum' ? 'Alm' : 'Hidup'})\n`;
      const children = getChildrenOf(m.id, members);
      if (children.length > 0) {
        children.forEach((c) => {
          nodeStr += buildNodeText(c, indent + '   ');
        });
      }
      return nodeStr;
    };

    roots.forEach((root) => {
      text += buildNodeText(root);
    });

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
    showNotification('Rangkuman teks silsilah berhasil disalin ke clipboard!');
  };

  // Filtered Members untuk Excel Table
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const parent = members.find((p) => p.id === m.parentId);
        const children = getChildrenOf(m.id, members);
        const matchName = m.name.toLowerCase().includes(q);
        const matchParent = parent?.name.toLowerCase().includes(q);
        const matchChildren = children.some((c) => c.name.toLowerCase().includes(q));
        if (!matchName && !matchParent && !matchChildren) return false;
      }

      // Filter generation
      if (filterGeneration !== 'all') {
        const genNum = parseInt(filterGeneration, 10);
        if (getGenerationNumber(m.id, members) !== genNum) return false;
      }

      // Filter parent
      if (filterParentId !== 'all') {
        if (filterParentId === 'root') {
          if (m.parentId) return false;
        } else {
          if (m.parentId !== filterParentId) return false;
        }
      }

      // Filter trah
      if (filterTrah !== 'all' && m.trah !== filterTrah) {
        return false;
      }

      return true;
    });
  }, [members, searchQuery, filterGeneration, filterParentId, filterTrah]);

  // Daftar unik generasi yang ada
  const availableGenerations = useMemo(() => {
    const set = new Set<number>();
    members.forEach((m) => {
      set.add(getGenerationNumber(m.id, members));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [members]);

  // Daftar orang tua yang memiliki anak
  const parentsWithChildren = useMemo(() => {
    const parentIds = new Set(members.map((m) => m.parentId).filter(Boolean));
    return members.filter((m) => parentIds.has(m.id));
  }, [members]);

  // Tampilkan Pratinjau Pohon Silsilah Multi-Skin & PCB Print Engine jika viewMode aktif
  if (viewMode === 'preview_tree') {
    return (
      <PratinjauSilsilahEngine
        members={members}
        onClose={() => setViewMode('editor')}
        onSelectMember={(memberId) => {
          setSelectedPersonId(memberId);
          setViewMode('editor');
        }}
        trahName={currentUser?.name ? `Keluarga ${currentUser.name}` : 'Trah LeluhurQu'}
      />
    );
  }

  return (
    <div className="space-y-4 text-slate-800 animate-in fade-in duration-200">
      {/* MODE SELECTOR TABS: EDITOR VS PRATINJAU POHON */}
      <div className="bg-emerald-950/80 p-1.5 rounded-2xl flex items-center border border-emerald-500/30 gap-1.5 shadow-sm">
        <button
          onClick={() => setViewMode('editor')}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer bg-emerald-600 text-white shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-300" />
          <span>1. Input Koma &amp; Tabel Filter Excel</span>
        </button>

        <button
          onClick={() => setViewMode('preview_tree')}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer text-emerald-200 hover:text-white hover:bg-white/10"
        >
          <Printer className="w-4 h-4 text-[#5eead4]" />
          <span>2. Pratinjau Pohon Silsilah &amp; PCB Engine</span>
        </button>
      </div>

      {/* DUAL INTERACTIVE PANEL: 1. AUTO TAMPIL HIRARKI & INPUT KOMA  |  2. PILIH TOKOH CEPAT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PANEL KIRI: AUTO-TAMPIL HIRARKI LELUHUR & FORM INPUT/EDIT KOMA (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-black text-slate-900">
                Auto-Tampil Hirarki &amp; Isi Anak (Koma)
              </h4>
            </div>
            {selectedPerson && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Terpilih: {selectedPerson.name}
              </span>
            )}
          </div>

          {/* KOTAK AUTO-TAMPIL HIRARKI SEPERTI PERMINTAAN USER: UYUT -> ABAH -> BAPAK -> ANAK */}
          {lineageTrail ? (
            <div className="bg-gradient-to-br from-emerald-50/70 via-stone-50 to-amber-50/60 rounded-2xl p-4 border border-emerald-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Garis Nasab Terdeteksi (Auto-Tampil)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Generasi ke-{lineageTrail.gen}
                </span>
              </div>

              {/* RUNTUTAN TAMPIL: UYUT -> ABAH -> BAPAK -> ANAK */}
              <div className="space-y-2 text-xs">
                {/* 1. UYUT (Generasi Teratas / Buyut) */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[11px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded text-center">
                      Uyut
                    </span>
                    <span className="font-bold text-slate-800">
                      {lineageTrail.uyut ? lineageTrail.uyut.name : (
                        <span className="text-slate-400 italic">Leluhur Utama ({lineageTrail.allAncestors[0]?.name || selectedPerson?.name})</span>
                      )}
                    </span>
                  </div>
                  {lineageTrail.uyut && (
                    <button
                      onClick={() => handleSelectPerson(lineageTrail.uyut!)}
                      className="text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                    >
                      Pilih Uyut &rarr;
                    </button>
                  )}
                </div>

                {/* 2. ABAH (Kakek / Ayah dari Bapak) */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[11px] font-extrabold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded text-center">
                      Abah
                    </span>
                    <span className="font-bold text-slate-800">
                      {lineageTrail.abah ? lineageTrail.abah.name : (
                        <span className="text-slate-400 italic">
                          {lineageTrail.bapak ? lineageTrail.bapak.name : '-'}
                        </span>
                      )}
                    </span>
                  </div>
                  {lineageTrail.abah && (
                    <button
                      onClick={() => handleSelectPerson(lineageTrail.abah!)}
                      className="text-[10px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                    >
                      Pilih Abah &rarr;
                    </button>
                  )}
                </div>

                {/* 3. BAPAK / TOKOH TERPILIH */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-600 text-white shadow-xs border border-emerald-500">
                  <div className="flex items-center gap-2">
                    <span className="w-16 text-[11px] font-black text-slate-950 bg-amber-400 px-2 py-0.5 rounded text-center">
                      Bapak
                    </span>
                    <span className="font-black text-white text-sm">
                      {selectedPerson?.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-100 font-mono bg-emerald-800/80 px-2 py-0.5 rounded">
                    Sedang Dipilih
                  </span>
                </div>

                {/* 4. ANAK-ANAK */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Anak
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({selectedPersonChildren.length} anak tercatat)
                      </span>
                    </div>

                    {!isEditingChildren && (
                      <button
                        onClick={handleStartEditChildren}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Anak</span>
                      </button>
                    )}
                  </div>

                  {selectedPersonChildren.length > 0 ? (
                    <div className="pt-1">
                      {/* Format Koma Langsung */}
                      <div className="text-xs font-mono font-semibold text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span>{selectedPersonChildren.map((c) => c.name).join(', ')}</span>
                      </div>

                      {/* Daftar Nomor Rapi */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
                        {selectedPersonChildren.map((child, idx) => (
                          <button
                            key={child.id}
                            onClick={() => handleSelectPerson(child)}
                            className="text-left p-1.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200/60 text-[11px] transition flex items-center justify-between group cursor-pointer"
                            title={`Klik untuk memilih ${child.name} sebagai orang tua berikutnya`}
                          >
                            <span className="font-semibold text-slate-800 truncate">
                              {idx + 1}. {child.name}
                            </span>
                            <ChevronRight className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic pt-1">
                      Belum ada data anak. Masukkan di kolom bawah dengan tanda koma (contoh: maman, Ian, Hendri).
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <User className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                Pilih tokoh di sebelah kanan atau buat tokoh baru
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Setelah memilih tokoh (misal <strong className="text-emerald-700">Santa</strong> atau <strong className="text-emerald-700">Samud</strong>), garis leluhur (Uyut, Abah, Bapak, Anak) akan langsung auto-tampil di sini!
              </p>
            </div>
          )}

          {/* FORM INPUT / EDIT CEPAT ANAK PAKAI TANDA KOMA */}
          {selectedPerson && (
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span>{isEditingChildren ? '✏️ Edit Daftar Anak' : '➕ Tambah Anak'} untuk</span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {selectedPerson.name}
                  </span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Pisahkan tanda koma ( , )</span>
              </div>

              <div className="relative">
                <textarea
                  value={childrenInputText}
                  onChange={(e) => setChildrenInputText(e.target.value)}
                  placeholder="Contoh: maman, Ian, Hendri (atau madgani, Inoh, Enit)"
                  rows={2}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-inner"
                />
              </div>

              {/* Real-time Preview Tag Chips dari Nama-nama yang diketik */}
              {parseCommaNames(childrenInputText).length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Hasil deteksi:</span>
                  {parseCommaNames(childrenInputText).map((name, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs"
                    >
                      {i + 1}. {name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveChildrenFromComma}
                  className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#5eead4]" />
                  <span>
                    Simpan Anak ({parseCommaNames(childrenInputText).length} Nama)
                  </span>
                </button>

                {isEditingChildren && (
                  <button
                    onClick={() => {
                      setIsEditingChildren(false);
                      const current = getChildrenOf(selectedPerson.id, members);
                      setChildrenInputText(current.map((c) => c.name).join(', '));
                    }}
                    className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PANEL KANAN: PILIH TOKOH CEPAT & NAVIGASI CABANG SILSILAH (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-md space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-black text-slate-900">Pilih Tokoh / Orang Tua</h4>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                {members.length} Anggota Terdata
              </span>
            </div>

            {/* Quick Filter Box Tokoh */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama (misal: Santa, Samud)..."
                className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Daftar Tokoh Cepat (Bisa diklik untuk auto-tampil) */}
            <div className="max-h-[380px] overflow-y-auto no-scrollbar space-y-1.5 pr-1">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((m) => {
                  const isSelected = selectedPersonId === m.id;
                  const children = getChildrenOf(m.id, members);
                  const parent = members.find((p) => p.id === m.parentId);
                  const gen = getGenerationNumber(m.id, members);

                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectPerson(m)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-slate-50 hover:bg-emerald-50/60 text-slate-800 border-slate-200/70'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-black text-xs truncate ${
                              isSelected ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {m.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                              isSelected
                                ? 'bg-emerald-900 text-[#5eead4]'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            G{gen}
                          </span>
                        </div>
                        <p
                          className={`text-[10px] truncate mt-0.5 ${
                            isSelected ? 'text-emerald-100' : 'text-slate-400'
                          }`}
                        >
                          {parent ? `Anak dari ${parent.name}` : 'Leluhur Utama'} &bull;{' '}
                          {children.length > 0 ? `${children.length} anak` : 'Belum ada anak'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {children.length > 0 && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 font-black'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {children.length} Anak
                          </span>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 ${
                            isSelected ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Tidak ada tokoh yang cocok. Klik tombol di bawah untuk menambah tokoh baru.
                </div>
              )}
            </div>
          </div>

          {/* Tombol Tambah Tokoh di Bawah */}
          <button
            onClick={() => setShowAddPersonModal(true)}
            className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>(+) Tambah Tokoh / Leluhur Baru</span>
          </button>
        </div>
      </div>

      {/* SPREADSHEET TABLE: "MIRIP FILTER DI EXCEL TERSIMPAN DAN BISA DI EDIT" */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-100 shadow-md space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <div>
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>Tabel Silsilah (Mirip Excel Filter &amp; Tersimpan)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.2 rounded-full">
                  {filteredMembers.length} Baris
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Filter data per generasi atau orang tua layaknya spreadsheet Excel. Seluruh perubahan langsung tersimpan permanen.
              </p>
            </div>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcelCSV}
              className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition shadow-xs cursor-pointer"
              title="Unduh file spreadsheet Excel (.CSV) dengan UTF-8 BOM"
            >
              <Download className="w-3.5 h-3.5 text-[#5eead4]" />
              <span>Ekspor Excel (.CSV)</span>
            </button>

            <button
              onClick={handleCopyTextTree}
              className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 transition border border-slate-300 cursor-pointer"
              title="Salin pohon teks silsilah ke clipboard"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* TOOLBAR FILTER EXCEL DROPDOWNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          {/* 1. Filter Generasi */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Filter Generasi
            </label>
            <select
              value={filterGeneration}
              onChange={(e) => setFilterGeneration(e.target.value)}
              className="w-full p-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer text-xs"
            >
              <option value="all">Semua Generasi ({availableGenerations.length} Tingkat)</option>
              {availableGenerations.map((g) => (
                <option key={g} value={g.toString()}>
                  Generasi {g} {g === 1 ? '(Leluhur Utama)' : g === 2 ? '(Anak)' : g === 3 ? '(Cucu)' : '(Cicit)'}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Filter Orang Tua */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Filter Orang Tua
            </label>
            <select
              value={filterParentId}
              onChange={(e) => setFilterParentId(e.target.value)}
              className="w-full p-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer text-xs"
            >
              <option value="all">Semua Orang Tua</option>
              <option value="root">Leluhur Utama (Tanpa Orang Tua)</option>
              {parentsWithChildren.map((p) => (
                <option key={p.id} value={p.id}>
                  Anak-anak dari {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Filter Trah */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Filter Trah
            </label>
            <select
              value={filterTrah}
              onChange={(e) => setFilterTrah(e.target.value)}
              className="w-full p-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold cursor-pointer text-xs"
            >
              <option value="all">Semua Trah</option>
              <option value="ayah">Trah Ayah</option>
              <option value="ibu">Trah Ibu</option>
            </select>
          </div>

          {/* 4. Reset Filter */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterGeneration('all');
                setFilterParentId('all');
                setFilterTrah('all');
              }}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* TABEL DATA GRID ALA EXCEL */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-800 text-white font-extrabold border-b border-emerald-900">
                <th className="p-2.5 w-12 text-center">No</th>
                <th className="p-2.5 min-w-[140px]">Nama Anggota</th>
                <th className="p-2.5 w-20 text-center">Gen</th>
                <th className="p-2.5 min-w-[140px]">Orang Tua</th>
                <th className="p-2.5 min-w-[200px]">Garis Nasab (Uyut &rarr; Abah)</th>
                <th className="p-2.5 min-w-[200px]">Daftar Anak (Koma)</th>
                <th className="p-2.5 w-16 text-center">Jml</th>
                <th className="p-2.5 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member, idx) => {
                  const parent = members.find((p) => p.id === member.parentId);
                  const trail = getAncestorTrail(member.id, members);
                  const children = getChildrenOf(member.id, members);
                  const gen = getGenerationNumber(member.id, members);
                  const isSelected = selectedPersonId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-emerald-50/50 transition-colors ${
                        isSelected ? 'bg-emerald-50/90 font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                      }`}
                    >
                      <td className="p-2.5 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-black ${
                              isSelected ? 'text-emerald-800' : 'text-slate-900'
                            }`}
                          >
                            {member.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({member.gender === 'P' ? '♀' : '♂'})
                          </span>
                          {member.status === 'Almarhum' && (
                            <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded">
                              Alm
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-2.5 text-center">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          G{gen}
                        </span>
                      </td>

                      <td className="p-2.5">
                        {parent ? (
                          <button
                            onClick={() => handleSelectPerson(parent)}
                            className="text-emerald-700 hover:underline font-bold text-left cursor-pointer truncate max-w-[130px] block"
                            title={`Pilih ${parent.name}`}
                          >
                            {parent.name}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Leluhur Utama</span>
                        )}
                      </td>

                      <td className="p-2.5">
                        <div className="text-[11px] text-slate-600 font-mono truncate max-w-[220px]">
                          {trail.allAncestors.length > 0
                            ? [...trail.allAncestors.map((a) => a.name), member.name].join(' > ')
                            : member.name}
                        </div>
                      </td>

                      <td className="p-2.5">
                        {children.length > 0 ? (
                          <div className="text-[11px] font-mono text-slate-700 truncate max-w-[240px]" title={children.map((c) => c.name).join(', ')}>
                            {children.map((c) => c.name).join(', ')}
                          </div>
                        ) : (
                          <span className="text-slate-300 italic text-[10px]">-</span>
                        )}
                      </td>

                      <td className="p-2.5 text-center font-bold">
                        {children.length > 0 ? (
                          <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                            {children.length}
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSelectPerson(member)}
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition cursor-pointer"
                            title="Auto Tampil / Pilih Tokoh"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                            title="Hapus Tokoh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    Tidak ada data yang sesuai filter. Ubah kata kunci pencarian atau reset filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH TOKOH / LELUHUR BARU */}
      {showAddPersonModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-emerald-100 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Tambah Tokoh / Leluhur Baru
                </h3>
              </div>
              <button
                onClick={() => setShowAddPersonModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNewPerson} className="space-y-3.5 text-xs">
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">
                  Nama Tokoh / Orang Tua *
                </label>
                <input
                  type="text"
                  required
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Contoh: Santa atau madgani"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={newPersonGender}
                    onChange={(e) => setNewPersonGender(e.target.value as 'L' | 'P')}
                    className="w-full p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="L">Laki-laki (Ayah / Kakek)</option>
                    <option value="P">Perempuan (Ibu / Nenek)</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    Status
                  </label>
                  <select
                    value={newPersonStatus}
                    onChange={(e) => setNewPersonStatus(e.target.value as 'Hidup' | 'Almarhum')}
                    className="w-full p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Almarhum">Almarhum</option>
                    <option value="Hidup">Masih Hidup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">
                  Orang Tua / Nasab Atas (Opsional)
                </label>
                <select
                  value={newPersonParentId}
                  onChange={(e) => setNewPersonParentId(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Tanpa Orang Tua (Sebagai Leluhur Utama / Uyut) --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      Anak dari: {m.name} (Generasi {getGenerationNumber(m.id, members)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">
                  Langsung Masukkan Anak-anak (Pisah Koma)
                </label>
                <textarea
                  value={newPersonInitialChildren}
                  onChange={(e) => setNewPersonInitialChildren(e.target.value)}
                  placeholder="Contoh: madgani, Inoh, Enit"
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Anak-anak ini otomatis dibuat dan dihubungkan ke tokoh di atas.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPersonModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md transition active:scale-95 cursor-pointer"
                >
                  Simpan Tokoh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
