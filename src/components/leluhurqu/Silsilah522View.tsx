import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Printer,
  ExternalLink,
  Users,
  Camera,
  X,
  User,
  Check,
  ChevronRight,
  Menu,
  Sparkles,
  Download,
  Calendar,
  Share2
} from 'lucide-react';

export interface Silsilah522Member {
  id: string;
  trah: string;
  parentId: string | null;
  nama: string;
  lahir: string;
  wafat: string;
  foto: string;
}

export interface Silsilah522DB {
  trahList: string[];
  activeTrah: string;
  members: Silsilah522Member[];
}

interface Silsilah522ViewProps {
  showNotification?: (msg: string) => void;
  onOpenGridCanvas?: () => void;
  onSyncMembers?: (members: Silsilah522Member[]) => void;
}

const DEFAULT_DB: Silsilah522DB = {
  trahList: ['TRAH AYAH', 'TRAH IBU'],
  activeTrah: 'TRAH AYAH',
  members: [
    { id: '1', trah: 'TRAH AYAH', parentId: null, nama: 'UYUT A', lahir: '1905', wafat: '1982', foto: '' },
    { id: '2', trah: 'TRAH AYAH', parentId: '1', nama: 'KAKEK A', lahir: '1938', wafat: '2010', foto: '' },
    { id: '3', trah: 'TRAH AYAH', parentId: '2', nama: 'AYAH', lahir: '1968', wafat: '', foto: '' },
    { id: '4', trah: 'TRAH IBU', parentId: null, nama: 'UYUT B', lahir: '1910', wafat: '1988', foto: '' },
    { id: '5', trah: 'TRAH IBU', parentId: '4', nama: 'NENEK B', lahir: '1942', wafat: '2019', foto: '' },
    { id: '6', trah: 'TRAH IBU', parentId: '5', nama: 'IBU', lahir: '1971', wafat: '', foto: '' },
  ],
};

export const Silsilah522View: React.FC<Silsilah522ViewProps> = ({
  showNotification = () => {},
  onOpenGridCanvas,
  onSyncMembers,
}) => {
  // DB State initialized from localStorage ('silsilah_db')
  const [db, setDb] = useState<Silsilah522DB>(() => {
    try {
      const saved = localStorage.getItem('silsilah_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.trahList) && Array.isArray(parsed.members)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gagal memuat silsilah_db dari localStorage, gunakan default', e);
    }
    return DEFAULT_DB;
  });

  // Mobile sidebar drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Modals
  const [modalFormOpen, setModalFormOpen] = useState<boolean>(false);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Form Fields
  const [inputNama, setInputNama] = useState<string>('');
  const [inputLahir, setInputLahir] = useState<string>('');
  const [inputWafat, setInputWafat] = useState<string>('');
  const [inputFoto, setInputFoto] = useState<string>('');

  // Preview Modal
  const [previewMember, setPreviewMember] = useState<Silsilah522Member | null>(null);

  // Add Trah Modal
  const [modalAddTrahOpen, setModalAddTrahOpen] = useState<boolean>(false);
  const [newTrahName, setNewTrahName] = useState<string>('');

  // File input ref for camera/gallery upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Save to localStorage whenever db changes
  const saveDb = (newDb: Silsilah522DB) => {
    setDb(newDb);
    try {
      localStorage.setItem('silsilah_db', JSON.stringify(newDb));
      if (onSyncMembers) {
        onSyncMembers(newDb.members);
      }
    } catch (e) {
      console.error('Gagal menyimpan silsilah_db ke localStorage', e);
    }
  };

  // Sync to parent on mount
  useEffect(() => {
    if (onSyncMembers) {
      onSyncMembers(db.members);
    }
  }, []);

  // Filter members by active Trah
  const currentMembers = db.members.filter((m) => m.trah === db.activeTrah);
  const rootMembers = currentMembers.filter((m) => m.parentId === null);

  // Open Form for Adding or Editing
  const handleOpenForm = (parentId: string | null = null, editId: string | null = null) => {
    setTargetParentId(parentId);
    setEditingMemberId(editId);

    if (editId) {
      const existing = db.members.find((m) => m.id === editId);
      if (existing) {
        setInputNama(existing.nama || '');
        setInputLahir(existing.lahir || '');
        setInputWafat(existing.wafat || '');
        setInputFoto(existing.foto || '');
      }
    } else {
      setInputNama('');
      setInputLahir('');
      setInputWafat('');
      setInputFoto('');
    }
    setModalFormOpen(true);
  };

  // Handle Photo File Upload (Convert to Base64)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Ukuran foto terlalu besar (maksimal 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      setInputFoto(base64);
      showNotification('Foto berhasil dimuat!');
    };
    reader.readAsDataURL(file);
  };

  // Save Member (Add or Edit)
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNama = inputNama.trim();
    if (!cleanNama) {
      showNotification('Nama harus diisi!');
      return;
    }

    if (editingMemberId) {
      // Edit mode
      const updatedMembers = db.members.map((m) => {
        if (m.id === editingMemberId) {
          return {
            ...m,
            nama: cleanNama,
            lahir: inputLahir.trim(),
            wafat: inputWafat.trim(),
            foto: inputFoto.trim(),
          };
        }
        return m;
      });

      const updatedDb: Silsilah522DB = {
        ...db,
        members: updatedMembers,
      };
      saveDb(updatedDb);
      showNotification(`Data ${cleanNama} berhasil diperbarui.`);
    } else {
      // Add mode
      const newMember: Silsilah522Member = {
        id: Date.now().toString(),
        trah: db.activeTrah,
        parentId: targetParentId,
        nama: cleanNama,
        lahir: inputLahir.trim(),
        wafat: inputWafat.trim(),
        foto: inputFoto.trim(),
      };

      const updatedDb: Silsilah522DB = {
        ...db,
        members: [...db.members, newMember],
      };
      saveDb(updatedDb);
      showNotification(`${targetParentId === null ? 'Leluhur Utama' : 'Anak'} ${cleanNama} berhasil ditambahkan!`);
    }

    setModalFormOpen(false);
  };

  // Delete Member and recursive descendants
  const handleDeleteMember = (id: string) => {
    const memberToDelete = db.members.find((m) => m.id === id);
    const memberName = memberToDelete ? memberToDelete.nama : 'anggota ini';

    if (window.confirm(`Hapus ${memberName} beserta seluruh cabang keturunannya?`)) {
      const idsToDelete: string[] = [id];
      const findChildren = (pid: string) => {
        db.members
          .filter((m) => m.parentId === pid)
          .forEach((c) => {
            idsToDelete.push(c.id);
            findChildren(c.id);
          });
      };
      findChildren(id);

      const filtered = db.members.filter((m) => !idsToDelete.includes(m.id));
      const updatedDb: Silsilah522DB = {
        ...db,
        members: filtered,
      };
      saveDb(updatedDb);
      if (previewMember && idsToDelete.includes(previewMember.id)) {
        setPreviewMember(null);
      }
      showNotification(`${memberName} dan cabang keturunannya berhasil dihapus.`);
    }
  };

  // Add Trah
  const handleAddTrahSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTrah = newTrahName.trim().toUpperCase();
    if (!cleanTrah) {
      showNotification('Nama Trah tidak boleh kosong');
      return;
    }

    if (db.trahList.includes(cleanTrah)) {
      showNotification('Nama Trah sudah ada dalam daftar');
      setDb({ ...db, activeTrah: cleanTrah });
      setModalAddTrahOpen(false);
      return;
    }

    const updatedDb: Silsilah522DB = {
      ...db,
      trahList: [...db.trahList, cleanTrah],
      activeTrah: cleanTrah,
    };
    saveDb(updatedDb);
    setNewTrahName('');
    setModalAddTrahOpen(false);
    showNotification(`Trah "${cleanTrah}" berhasil dibuat dan diaktifkan!`);
  };

  // Helper: recursive child nodes renderer
  const renderTreeNode = (member: Silsilah522Member, isRoot: boolean = false) => {
    const children = currentMembers.filter((m) => m.parentId === member.id);
    const tahunText =
      member.lahir || member.wafat
        ? `(${member.lahir || '?'} - ${member.wafat || 'Sekarang'})`
        : '';

    return (
      <div
        key={member.id}
        className={`relative ${
          isRoot
            ? 'mt-3 border-l-0 pl-0'
            : 'ml-4 sm:ml-6 mt-3 pl-3 sm:pl-4 border-l-2 border-dashed border-slate-700'
        }`}
      >
        {/* Connector indicator for non-root */}
        {!isRoot && (
          <span className="absolute -left-0.5 top-3.5 text-[#00e676] font-mono font-bold text-xs select-none">
            +---&gt;{' '}
          </span>
        )}

        {/* Card Component */}
        <div
          onClick={() => setPreviewMember(member)}
          className={`inline-flex items-center gap-2.5 sm:gap-3 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] hover:border-[#00e676] p-2 sm:px-3 sm:py-2.5 rounded-xl shadow-lg transition cursor-pointer select-none group max-w-full ${
            !isRoot ? 'ml-6 sm:ml-8' : ''
          }`}
        >
          {/* Circular Photo */}
          <div className="w-10 h-10 rounded-full bg-[#2a2a2a] border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 text-[10px] text-slate-400 font-bold group-hover:border-[#00e676] transition">
            {member.foto ? (
              <img src={member.foto} alt={member.nama} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#00e676] text-[10px] font-mono">FOTO</span>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col min-w-0 pr-1">
            <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[140px] sm:max-w-[200px]">
              {member.nama}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
              {tahunText || 'Masa hidup -'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenForm(member.id, null);
              }}
              className="bg-[#2a2a2a] hover:bg-[#00e676] hover:text-black text-[#00e676] border border-[#444] rounded-md px-2 py-1 text-[10px] sm:text-xs font-bold transition active:scale-95 flex items-center gap-0.5"
              title="Tambah Anak"
            >
              <Plus className="w-3 h-3" />
              <span>Anak</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenForm(member.parentId, member.id);
              }}
              className="bg-[#2a2a2a] hover:bg-slate-700 text-slate-300 border border-[#444] rounded-md p-1 text-[10px] sm:text-xs transition active:scale-95"
              title="Edit Data"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteMember(member.id);
              }}
              className="bg-[#2a2a2a] hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-900/50 rounded-md p-1 text-[10px] sm:text-xs transition active:scale-95"
              title="Hapus Anggota & Keturunan"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Children Subtrees */}
        {children.length > 0 && (
          <div className="flex flex-col">
            {children.map((child) => renderTreeNode(child, false))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full min-h-[550px] bg-[#121212] text-[#e0e0e0] flex flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-800 shadow-2xl relative">
      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION: DAFTAR TRAH & CETAK */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`w-full md:w-60 bg-[#181818] border-b md:border-b-0 md:border-r border-[#333] p-3.5 flex flex-col gap-2.5 shrink-0 z-20 ${
          isSidebarOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00e676] animate-pulse"></div>
            <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider font-mono">
              Daftar Trah
            </h3>
          </div>
          <span className="text-[10px] bg-slate-800 text-[#00e676] px-1.5 py-0.5 rounded font-mono font-bold">
            v5.2.2
          </span>
        </div>

        {/* Trah Buttons List */}
        <div className="flex flex-col gap-1.5 max-h-48 md:max-h-[50vh] overflow-y-auto no-scrollbar">
          {db.trahList.map((trah) => {
            const isActive = trah === db.activeTrah;
            const count = db.members.filter((m) => m.trah === trah).length;
            return (
              <button
                key={trah}
                onClick={() => {
                  saveDb({ ...db, activeTrah: trah });
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-between border ${
                  isActive
                    ? 'bg-[#00e676] text-black border-[#00e676] shadow-md'
                    : 'bg-[#252525] text-white hover:bg-slate-800 border-[#333]'
                }`}
              >
                <span className="truncate pr-1">{trah}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black/20 text-black' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Button Tambah Trah */}
        <button
          onClick={() => setModalAddTrahOpen(true)}
          className="w-full bg-transparent text-[#00e676] hover:bg-[#00e676]/10 border border-dashed border-[#00e676] p-2 rounded-lg text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 mt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ TAMBAH TRAH</span>
        </button>

        {/* Action Bottom Sidebar Buttons */}
        <div className="mt-auto pt-2 flex flex-col gap-2 border-t border-slate-800">
          <button
            onClick={() => window.print()}
            className="w-full bg-[#2979ff] hover:bg-[#2962ff] text-white p-2.5 rounded-lg text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 shadow"
            title="Pratinjau & Cetak Silsilah 5.2.2"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ PRATINJAU CETAK</span>
          </button>

          <a
            href="/silsilah-5.2.2.html"
            target="_blank"
            rel="noreferrer"
            className="w-full bg-slate-900 hover:bg-black text-slate-300 hover:text-white border border-slate-700 p-2 rounded-lg text-[11px] font-semibold transition text-center flex items-center justify-center gap-1.5"
            title="Buka File HTML Standalone Mandiri di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#00e676]" />
            <span>Buka Standalone HTML</span>
          </a>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTAINER: POHON SILSILAH 5.2.2 */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 p-3.5 sm:p-5 overflow-y-auto no-scrollbar flex flex-col gap-3.5">
        {/* Header Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#333]">
          <div className="flex items-center gap-2">
            {/* Mobile toggle sidebar */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="md:hidden p-1.5 bg-[#252525] border border-slate-700 text-[#00e676] rounded-lg active:scale-95"
              title="Buka Menu Trah"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#00e676] flex items-center gap-2">
                <span>{db.activeTrah}</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">
                  ({currentMembers.length} anggota)
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Sistem Pohon Keturunan Silsilah 5.2.2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenForm(null, null)}
              className="bg-[#2a2a2a] hover:bg-[#00e676] hover:text-black text-[#00e676] border border-[#00e676]/40 text-xs font-bold px-3 py-2 rounded-lg transition active:scale-95 flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Uyut / Leluhur Utama</span>
            </button>

            {onOpenGridCanvas && (
              <button
                onClick={onOpenGridCanvas}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-2.5 py-2 rounded-lg transition active:scale-95 hidden sm:flex items-center gap-1"
                title="Buka Grid Canvas Spatial View"
              >
                <span>Grid Canvas</span>
              </button>
            )}
          </div>
        </div>

        {/* Tree Container */}
        <div className="font-mono text-xs flex-1">
          {rootMembers.length === 0 ? (
            <div className="p-8 text-center bg-[#181818] rounded-2xl border border-dashed border-[#333] my-6">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 italic text-sm mb-3">
                Belum ada data Uyut / Leluhur Utama di {db.activeTrah}.
              </p>
              <button
                onClick={() => handleOpenForm(null, null)}
                className="bg-[#00e676] text-black font-bold px-4 py-2 rounded-lg text-xs transition active:scale-95 shadow"
              >
                + Tambah Uyut / Leluhur Utama Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rootMembers.map((root) => renderTreeNode(root, true))}
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: FORM TAMBAH / EDIT ANGGOTA */}
      {/* ------------------------------------------------------------- */}
      {modalFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#1e1e1e] border border-[#333] text-white rounded-2xl p-4 sm:p-5 w-full max-w-sm space-y-3 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-[#00e676]">
                {editingMemberId
                  ? 'Edit Data Anggota'
                  : targetParentId === null
                  ? 'Tambah Uyut / Leluhur Utama'
                  : 'Tambah Anak'}
              </h4>
              <button
                onClick={() => setModalFormOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nama Lengkap / Panggilan <span className="text-[#00e676]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Raden Surya / Kyai Hasan"
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333] focus:border-[#00e676] rounded-lg p-2.5 text-white outline-hidden font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tahun Lahir</label>
                  <input
                    type="text"
                    placeholder="Contoh: 1945"
                    value={inputLahir}
                    onChange={(e) => setInputLahir(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] focus:border-[#00e676] rounded-lg p-2 text-white outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tahun Wafat</label>
                  <input
                    type="text"
                    placeholder="Kosongkan jika hidup"
                    value={inputWafat}
                    onChange={(e) => setInputWafat(e.target.value)}
                    className="w-full bg-[#121212] border border-[#333] focus:border-[#00e676] rounded-lg p-2 text-white outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Foto Profil</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="URL Foto atau Upload..."
                    value={inputFoto}
                    onChange={(e) => setInputFoto(e.target.value)}
                    className="flex-1 bg-[#121212] border border-[#333] focus:border-[#00e676] rounded-lg p-2 text-white outline-hidden text-[11px]"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#2a2a2a] hover:bg-slate-700 text-[#00e676] p-2 rounded-lg border border-[#333] active:scale-95 transition"
                    title="Upload Foto dari Galeri / Kamera"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                {inputFoto && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={inputFoto}
                      alt="Preview"
                      className="w-9 h-9 rounded-full object-cover border border-[#00e676]"
                    />
                    <button
                      type="button"
                      onClick={() => setInputFoto('')}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Hapus Foto
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 mt-3">
                <button
                  type="button"
                  onClick={() => setModalFormOpen(false)}
                  className="bg-[#2a2a2a] hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-lg font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#00e676] hover:bg-[#00c853] text-black font-extrabold px-4 py-2 rounded-lg shadow active:scale-95 transition"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: PRATINJAU ANGGOTA */}
      {/* ------------------------------------------------------------- */}
      {previewMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#1e1e1e] border border-[#333] text-white rounded-2xl p-5 w-full max-w-sm text-center space-y-3 shadow-2xl relative">
            <h4 className="text-sm font-bold text-[#00e676]">Pratinjau Anggota</h4>

            {/* Photo Avatar */}
            <div className="w-20 h-20 mx-auto rounded-full bg-[#333] border-2 border-[#00e676] overflow-hidden flex items-center justify-center shadow-md">
              {previewMember.foto ? (
                <img
                  src={previewMember.foto}
                  alt={previewMember.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[#00e676] text-xs font-bold font-mono">FOTO</span>
              )}
            </div>

            <div>
              <h3 className="font-bold text-base text-white">{previewMember.nama}</h3>
              <p className="text-slate-400 text-xs font-mono mt-0.5">
                {previewMember.lahir || previewMember.wafat
                  ? `Masa Hidup: ${previewMember.lahir || '?'} - ${previewMember.wafat || 'Sekarang'}`
                  : 'Masa Hidup: -'}
              </p>
              <span className="text-[10px] bg-slate-800 text-[#00e676] px-2 py-0.5 rounded-full inline-block mt-1 font-mono">
                {previewMember.trah}
              </span>
            </div>

            {/* List of Children */}
            <div className="border-t border-[#333] pt-2.5 text-left text-xs text-slate-300">
              <strong className="text-slate-200 block mb-1 text-[11px] uppercase tracking-wider font-mono">
                Daftar Anak:
              </strong>
              <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1">
                {(() => {
                  const children = currentMembers.filter((m) => m.parentId === previewMember.id);
                  if (children.length === 0) {
                    return <span className="text-slate-500 italic">Belum ada data anak.</span>;
                  }
                  return children.map((c, idx) => (
                    <div
                      key={c.id}
                      className="bg-slate-900/60 p-1.5 rounded-md flex items-center justify-between"
                    >
                      <span>
                        {idx + 1}. {c.nama}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.lahir ? `Thn ${c.lahir}` : ''}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-center gap-2 pt-2 border-t border-[#333]">
              <button
                onClick={() => {
                  const target = previewMember;
                  setPreviewMember(null);
                  handleOpenForm(target.id, null);
                }}
                className="bg-[#2a2a2a] hover:bg-[#00e676] hover:text-black text-[#00e676] border border-[#444] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Anak</span>
              </button>
              <button
                onClick={() => {
                  const target = previewMember;
                  setPreviewMember(null);
                  handleOpenForm(target.parentId, target.id);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setPreviewMember(null)}
                className="bg-[#2a2a2a] hover:bg-slate-800 text-slate-300 px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: TAMBAH TRAH BARU */}
      {/* ------------------------------------------------------------- */}
      {modalAddTrahOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#1e1e1e] border border-[#333] text-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-[#00e676]">Tambah Trah Baru</h4>
              <button
                onClick={() => setModalAddTrahOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTrahSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Nama Trah / Jalur Keturunan
                </label>
                <input
                  type="text"
                  placeholder="Misal: TRAH KAKEK B atau TRAH BANI HASAN"
                  value={newTrahName}
                  onChange={(e) => setNewTrahName(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333] focus:border-[#00e676] rounded-lg p-2.5 text-white outline-hidden font-bold uppercase"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAddTrahOpen(false)}
                  className="bg-[#2a2a2a] hover:bg-slate-800 text-slate-300 px-3 py-2 rounded-lg font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#00e676] hover:bg-[#00c853] text-black font-extrabold px-4 py-2 rounded-lg shadow active:scale-95 transition"
                >
                  Buat Trah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
