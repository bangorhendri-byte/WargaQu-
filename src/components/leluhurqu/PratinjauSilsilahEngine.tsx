import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import {
  Printer,
  Minus,
  Plus,
  Maximize,
  Microchip,
  Layers,
  CircleDot,
  FileText,
  BadgeCheck,
  Share2,
  ChevronRight,
  Eye,
  Check,
  RefreshCw,
  User,
  Users,
  Sparkles,
  ArrowLeft,
  X
} from 'lucide-react';
import { FamilyMember } from './LeluhurQuView';

export interface TreeNodeData {
  id: string;
  name: string;
  title: string;
  photo?: string;
  gender: 'L' | 'P';
  spouse?: string;
  children?: TreeNodeData[];
}

interface PratinjauSilsilahEngineProps {
  members: FamilyMember[];
  onClose?: () => void;
  onSelectMember?: (memberId: string) => void;
  trahName?: string;
}

export const PratinjauSilsilahEngine: React.FC<PratinjauSilsilahEngineProps> = ({
  members,
  onClose,
  onSelectMember,
  trahName = 'Trah LeluhurQu',
}) => {
  // Application State sesuai template user
  const [currentSkin, setCurrentSkin] = useState<'pcb' | 'compact' | 'stack' | 'radial'>('pcb');
  const [currentZoom, setCurrentZoom] = useState<number>(1.0);
  const [paperSize, setPaperSize] = useState<string>('a4-landscape');
  const [showPhotos, setShowPhotos] = useState<boolean>(true);
  const [activeRootId, setActiveRootId] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const paperSheetRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Cari semua kandidat root (tanpa parentId)
  const rootMembers = useMemo(() => {
    if (members.length === 0) return [];
    const idSet = new Set(members.map((m) => m.id));
    const roots = members.filter((m) => !m.parentId || !idSet.has(m.parentId));
    return roots.length > 0 ? roots : [members[0]];
  }, [members]);

  // Set default active root
  useEffect(() => {
    if (rootMembers.length > 0 && !activeRootId) {
      setActiveRootId(rootMembers[0].id);
    }
  }, [rootMembers, activeRootId]);

  // Bangun struktur pohon hirarki dari data anggota
  const familyTree = useMemo<TreeNodeData>(() => {
    if (members.length === 0) {
      return {
        id: 'root-demo',
        name: 'Santa (Demo)',
        title: 'Leluhur Utama (Generasi 1)',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        gender: 'L',
        spouse: 'Ibu Mary',
        children: [
          {
            id: 'c1',
            name: 'madgani (G2)',
            title: 'Anak Ke-1',
            gender: 'L',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            spouse: 'Ibu Dasri',
            children: [
              { id: 'c1_1', name: 'dasri', title: 'Cucu 1', gender: 'L' },
              {
                id: 'c1_2',
                name: 'Samud',
                title: 'Cucu 2',
                gender: 'L',
                children: [
                  { id: 'c1_2_1', name: 'maman', title: 'Cicit 1', gender: 'L' },
                  { id: 'c1_2_2', name: 'Ian', title: 'Cicit 2', gender: 'L' },
                  { id: 'c1_2_3', name: 'Hendri', title: 'Cicit 3', gender: 'L' },
                ],
              },
              { id: 'c1_3', name: 'Ebah', title: 'Cucu 3', gender: 'P' },
            ],
          },
          {
            id: 'c2',
            name: 'Inoh (G2)',
            title: 'Anak Ke-2',
            gender: 'L',
            children: [],
          },
          {
            id: 'c3',
            name: 'Enit (G2)',
            title: 'Anak Ke-3',
            gender: 'P',
            children: [],
          },
        ],
      };
    }

    const selectedRoot =
      rootMembers.find((r) => r.id === activeRootId) || rootMembers[0] || members[0];

    const buildSubTree = (member: FamilyMember, depth: number): TreeNodeData => {
      const rawChildren = members.filter((m) => m.parentId === member.id);
      const sortedChildren = rawChildren.sort((a, b) => (a.birthOrder || 0) - (b.birthOrder || 0));

      let displayTitle =
        member.kinshipTitle || (depth === 1 ? 'Leluhur Utama (G1)' : `Generasi ${depth}`);
      if (member.role) displayTitle = member.role;

      return {
        id: member.id,
        name: member.name,
        title: displayTitle,
        photo: member.photo,
        gender: member.gender,
        spouse:
          member.spouses && member.spouses.length > 0
            ? member.spouses.map((s) => s.name).join(' & ')
            : undefined,
        children: sortedChildren.map((c) => buildSubTree(c, depth + 1)),
      };
    };

    return buildSubTree(selectedRoot, 1);
  }, [members, rootMembers, activeRootId]);

  // Gambar rute orthogonal 90-derajat untuk PCB Skin
  const drawPCBRoutes = () => {
    if (currentSkin !== 'pcb') return;
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    svg.innerHTML = '';
    const containerRect = container.getBoundingClientRect();

    const getCenterPin = (elId: string, position: 'top' | 'bottom' = 'bottom') => {
      const el = document.getElementById(elId);
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - containerRect.left;
      let y = rect.top + rect.height / 2 - containerRect.top;
      if (position === 'top') y = rect.top - containerRect.top;
      if (position === 'bottom') y = rect.bottom - containerRect.top;
      return { x, y };
    };

    const createOrthogonalPath = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
      const midY = p1.y + (p2.y - p1.y) / 2;
      return `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
    };

    // Rekursif menggambar jalur PCB untuk semua simpul
    const renderBranchRoutes = (parent: TreeNodeData) => {
      if (!parent.children || parent.children.length === 0) return;
      const parentPin = getCenterPin(`node-${parent.id}`, 'bottom');

      parent.children.forEach((child) => {
        const childPin = getCenterPin(`node-${child.id}`, 'top');
        if (childPin.x === 0 && childPin.y === 0) return;

        const pathStr = createOrthogonalPath(parentPin, childPin);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathStr);
        path.setAttribute('stroke', '#10B981');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(path);

        // Rekursif ke anak berikutnya
        renderBranchRoutes(child);
      });
    };

    renderBranchRoutes(familyTree);
  };

  // Trigger draw routes saat skin PCB aktif atau jendela di-resize
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      drawPCBRoutes();
    }, 80);
    return () => clearTimeout(timer);
  }, [familyTree, currentSkin, currentZoom, paperSize, showPhotos]);

  useEffect(() => {
    const handleResize = () => {
      drawPCBRoutes();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentSkin]);

  // Zoom Logic
  const changeZoom = (delta: number) => {
    setCurrentZoom((prev) => Math.max(0.2, Math.min(2.0, parseFloat((prev + delta).toFixed(2)))));
  };

  const autoFitToPaper = () => {
    if (!paperSheetRef.current) return;
    const availableWidth = window.innerWidth > 768 ? window.innerWidth - 120 : window.innerWidth - 32;
    const paperWidth = paperSheetRef.current.offsetWidth || 1000;
    if (paperWidth > 0) {
      const fitRatio = Math.max(0.25, Math.min(1.2, availableWidth / paperWidth));
      setCurrentZoom(parseFloat(fitRatio.toFixed(2)));
    }
  };

  // Cetak Silsilah
  const triggerPrint = () => {
    const originalZoom = currentZoom;
    setCurrentZoom(1.0);
    setTimeout(() => {
      window.print();
      setCurrentZoom(originalZoom);
    }, 250);
  };

  // Helper title skin
  const skinTitles: Record<string, string> = {
    pcb: 'Mode PCB Auto-Router (90° Routing)',
    compact: 'Mode Compact Badge (Hemat Ruang)',
    stack: 'Mode Vertical Stack Grid',
    radial: 'Mode Radial Wheel',
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 select-none animate-in fade-in duration-200">
      {/* 1. TOP TOOLBAR BAR (NO PRINT) */}
      <header className="no-print bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-3.5 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Branding & Back */}
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
                title="Tutup Pratinjau"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Microchip className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base text-white leading-tight flex items-center gap-2">
                <span>Pratinjau Silsilah Trah</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono border border-emerald-500/30 font-bold">
                  v2.5 Multi-Skin &amp; PCB
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">
                Pohon Silsilah Otomatis &amp; Siap Cetak Kertas (A4, A3, F4, Spanduk)
              </p>
            </div>
          </div>

          {/* Scale & Print Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scale indicator & Fit Page */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-1 flex items-center gap-1.5 shadow-inner">
              <button
                onClick={() => changeZoom(-0.05)}
                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-xs text-slate-200 transition cursor-pointer"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono w-12 text-center text-emerald-400 font-extrabold">
                {Math.round(currentZoom * 100)}%
              </span>
              <button
                onClick={() => changeZoom(0.05)}
                className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-xs text-slate-200 transition cursor-pointer"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={autoFitToPaper}
                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
              >
                <Maximize className="w-3 h-3 text-[#5eead4]" />
                <span className="text-[11px]">Pas Kertas</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={triggerPrint}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-emerald-900/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Silsilah</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB-TOOLBAR: SKIN SELECTOR & UKURAN KERTAS (NO PRINT) */}
      <div className="no-print bg-slate-900/90 border-b border-slate-800 backdrop-blur px-3.5 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Skin Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
            <button
              onClick={() => setCurrentSkin('pcb')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-xs cursor-pointer ${
                currentSkin === 'pcb'
                  ? 'text-emerald-400 bg-slate-800 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Microchip className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. PCB Auto-Router</span>
            </button>

            <button
              onClick={() => setCurrentSkin('compact')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-xs cursor-pointer ${
                currentSkin === 'compact'
                  ? 'text-emerald-400 bg-slate-800 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Compact Badge</span>
            </button>

            <button
              onClick={() => setCurrentSkin('stack')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-xs cursor-pointer ${
                currentSkin === 'stack'
                  ? 'text-emerald-400 bg-slate-800 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>3. Vertical Stack</span>
            </button>

            <button
              onClick={() => setCurrentSkin('radial')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition text-xs cursor-pointer ${
                currentSkin === 'radial'
                  ? 'text-emerald-400 bg-slate-800 border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-purple-400" />
              <span>4. Radial Wheel</span>
            </button>
          </div>

          {/* Paper Size & Display Options */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Cabang Leluhur Utama Selector jika ada > 1 */}
            {rootMembers.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] font-medium">Leluhur:</span>
                <select
                  value={activeRootId}
                  onChange={(e) => setActiveRootId(e.target.value)}
                  className="bg-slate-800 text-emerald-300 font-bold text-xs rounded px-2 py-0.5 border border-slate-700 outline-none cursor-pointer"
                >
                  {rootMembers.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Paper Size Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400 text-[11px] font-medium">Kertas:</span>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value)}
                className="bg-slate-800 text-emerald-300 font-mono text-xs rounded px-2 py-0.5 border border-slate-700 outline-none cursor-pointer font-bold"
              >
                <optgroup label="Standar ISO">
                  <option value="a4-landscape">A4 Landscape (297 x 210 mm)</option>
                  <option value="a4-portrait">A4 Portrait (210 x 297 mm)</option>
                  <option value="a3-landscape">A3 Landscape (420 x 297 mm)</option>
                  <option value="a3-portrait">A3 Portrait (297 x 420 mm)</option>
                </optgroup>
                <optgroup label="Lainnya">
                  <option value="f4-landscape">F4 / Folio (330 x 215 mm)</option>
                  <option value="banner">Spanduk / Banner (450 x 250 mm)</option>
                </optgroup>
              </select>
            </div>

            {/* Toggle Foto */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                id="chkShowPhotos"
                checked={showPhotos}
                onChange={(e) => setShowPhotos(e.target.checked)}
                className="accent-emerald-500 rounded cursor-pointer w-3.5 h-3.5"
              />
              <label
                htmlFor="chkShowPhotos"
                className="text-slate-300 text-[11px] font-semibold cursor-pointer select-none"
              >
                Foto Avatar
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN PREVIEW CANVAS AREA */}
      <main className="flex-1 bg-slate-950 p-4 md:p-8 overflow-auto flex items-start justify-center print-area-wrapper min-h-[600px]">
        {/* Interactive Paper Container */}
        <div
          ref={paperSheetRef}
          style={{ transform: `scale(${currentZoom})`, transformOrigin: 'top center' }}
          className={`paper-sheet rounded-2xl border border-slate-700 transition-transform duration-200 overflow-hidden relative shadow-2xl bg-white text-slate-800 ${
            paperSize === 'a4-landscape'
              ? 'w-[1000px] min-h-[700px]'
              : paperSize === 'a4-portrait'
              ? 'w-[750px] min-h-[1050px]'
              : paperSize === 'a3-landscape'
              ? 'w-[1300px] min-h-[920px]'
              : paperSize === 'a3-portrait'
              ? 'w-[920px] min-h-[1300px]'
              : paperSize === 'f4-landscape'
              ? 'w-[1050px] min-h-[720px]'
              : 'w-[1250px] min-h-[750px]'
          }`}
        >
          {/* Header Paper Cetak */}
          <div className="p-6 pb-3 border-b border-slate-200 flex justify-between items-start bg-slate-50/80">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>SILSILAH TRAH {trahName.toUpperCase()}</span>
                <span className="text-[11px] bg-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded-full uppercase font-bold">
                  {skinTitles[currentSkin]}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Dokumen Resmi Registri Keluarga &bull; Generasi I s.d. Generasi Terdaftar ({members.length} Anggota Registered)
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-400 font-mono">
              <p>Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p>Format: {paperSize.toUpperCase()} Auto-Fit</p>
            </div>
          </div>

          {/* Content Area Silsilah */}
          <div
            ref={containerRef}
            className={`p-6 md:p-8 relative min-h-[550px] flex items-center justify-center ${
              currentSkin === 'pcb'
                ? 'bg-[#081410] text-white'
                : 'bg-white text-slate-800'
            }`}
          >
            {/* SVG Layer for 90-degree Orthogonal PCB Traces */}
            {currentSkin === 'pcb' && (
              <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />
            )}

            {/* Dynamic Skin Renderers */}
            <div className="w-full relative z-20 flex justify-center">
              {currentSkin === 'pcb' && (
                <div className="flex flex-col items-center gap-12 font-mono w-full">
                  {/* Root Node (IC Core) */}
                  <div
                    id={`node-${familyTree.id}`}
                    onClick={() => onSelectMember && onSelectMember(familyTree.id)}
                    className="pcb-node bg-slate-900 border-2 border-emerald-500 rounded-xl p-3.5 shadow-lg shadow-emerald-500/20 text-center relative z-20 min-w-[210px] cursor-pointer hover:scale-105 transition"
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      IC-ROOT (G1)
                    </div>
                    {showPhotos && (
                      <img
                        src={
                          familyTree.photo ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(familyTree.name)}&background=059669&color=fff&size=96`
                        }
                        alt={familyTree.name}
                        className="w-12 h-12 rounded-full border-2 border-emerald-400 mx-auto my-1 object-cover shadow-xs"
                      />
                    )}
                    <h3 className="font-extrabold text-sm text-emerald-300 tracking-tight">
                      {familyTree.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {familyTree.spouse ? `& ${familyTree.spouse}` : familyTree.title}
                    </p>
                  </div>

                  {/* Level 2 Children (Sub Chips) */}
                  {familyTree.children && familyTree.children.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-10 relative z-20 w-full">
                      {familyTree.children.map((child, idx) => (
                        <div key={child.id} className="flex flex-col items-center gap-8">
                          <div
                            id={`node-${child.id}`}
                            onClick={() => onSelectMember && onSelectMember(child.id)}
                            className="pcb-node bg-slate-900 border border-slate-700 hover:border-emerald-400 rounded-xl p-3 text-center min-w-[170px] shadow-md relative cursor-pointer hover:scale-105 transition"
                          >
                            <span className="absolute -top-2 left-3 bg-slate-800 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 border border-slate-700 rounded">
                              PIN-{idx + 1}
                            </span>
                            {showPhotos && (
                              <img
                                src={
                                  child.photo ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(child.name)}&background=047857&color=fff&size=80`
                                }
                                alt={child.name}
                                className="w-10 h-10 rounded-full border border-slate-600 mx-auto mb-1 object-cover"
                              />
                            )}
                            <h4 className="font-bold text-xs text-slate-200">{child.name}</h4>
                            <p className="text-[9px] text-slate-400 mt-0.5">{child.title}</p>
                          </div>

                          {/* Level 3 Children (Micro Pads) */}
                          {child.children && child.children.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-2.5">
                              {child.children.map((grandChild) => (
                                <div key={grandChild.id} className="flex flex-col items-center gap-4">
                                  <div
                                    id={`node-${grandChild.id}`}
                                    onClick={() => onSelectMember && onSelectMember(grandChild.id)}
                                    className="pcb-node bg-slate-950 border border-emerald-900/80 rounded-lg p-2 text-center min-w-[110px] text-[10px] hover:border-emerald-500 transition cursor-pointer"
                                  >
                                    {showPhotos && (
                                      <img
                                        src={
                                          grandChild.photo ||
                                          `https://ui-avatars.com/api/?name=${encodeURIComponent(grandChild.name)}&background=065f46&color=fff&size=64`
                                        }
                                        alt={grandChild.name}
                                        className="w-7 h-7 rounded-full mx-auto mb-1 object-cover border border-emerald-600/50"
                                      />
                                    )}
                                    <div className="font-bold text-slate-300 truncate">{grandChild.name}</div>
                                    <div className="text-[8px] text-emerald-400 font-mono">{grandChild.title}</div>
                                  </div>

                                  {/* Level 4 Children (Cicit Pads) */}
                                  {grandChild.children && grandChild.children.length > 0 && (
                                    <div className="flex flex-wrap justify-center gap-1.5">
                                      {grandChild.children.map((greatGrandChild) => (
                                        <div
                                          key={greatGrandChild.id}
                                          id={`node-${greatGrandChild.id}`}
                                          onClick={() => onSelectMember && onSelectMember(greatGrandChild.id)}
                                          className="bg-slate-900/90 border border-emerald-800/50 rounded p-1.5 text-center min-w-[85px] text-[9px] hover:border-amber-400 transition cursor-pointer"
                                        >
                                          <div className="font-semibold text-emerald-200 truncate">{greatGrandChild.name}</div>
                                          <div className="text-[7px] text-slate-400 font-mono">{greatGrandChild.title}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SKIN 2: COMPACT BADGE */}
              {currentSkin === 'compact' && (
                <div className="flex flex-col items-center gap-6 w-full">
                  {/* Root Compact */}
                  <div className="bg-slate-900 text-white border-2 border-emerald-500 rounded-full px-5 py-2 flex items-center gap-3 shadow-lg">
                    {showPhotos && (
                      <img
                        src={
                          familyTree.photo ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(familyTree.name)}&background=059669&color=fff&size=80`
                        }
                        alt={familyTree.name}
                        className="w-9 h-9 rounded-full object-cover border border-emerald-400"
                      />
                    )}
                    <div>
                      <span className="font-black text-white text-xs">{familyTree.name}</span>
                      <span className="text-[10px] text-emerald-300 block font-mono">{familyTree.title}</span>
                    </div>
                  </div>

                  <div className="w-0.5 h-6 bg-slate-300"></div>

                  {/* Branch Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    {familyTree.children &&
                      familyTree.children.map((child) => (
                        <div
                          key={child.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center hover:border-emerald-400 transition"
                        >
                          {showPhotos && (
                            <img
                              src={
                                child.photo ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(child.name)}&background=047857&color=fff&size=80`
                              }
                              alt={child.name}
                              className="w-10 h-10 rounded-full mb-1 object-cover border border-slate-300"
                            />
                          )}
                          <h4 className="font-bold text-xs text-slate-800">{child.name}</h4>
                          <p className="text-[10px] text-slate-500 mb-2">{child.title}</p>

                          <div className="w-full border-t border-slate-100 pt-2 flex flex-col gap-1.5">
                            {child.children &&
                              child.children.map((gc) => (
                                <div
                                  key={gc.id}
                                  className="bg-slate-50 rounded-xl px-2.5 py-1.5 text-left flex items-center justify-between text-[11px] border border-slate-100"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800">{gc.name}</span>
                                    {gc.children && gc.children.length > 0 && (
                                      <p className="text-[9px] text-emerald-700 font-mono mt-0.5">
                                        Anak: {gc.children.map((c) => c.name).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono">{gc.title}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* SKIN 3: VERTICAL STACK GRID */}
              {currentSkin === 'stack' && (
                <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto">
                  {/* Level 1 */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl border-l-4 border-emerald-500 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      {showPhotos && (
                        <img
                          src={
                            familyTree.photo ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(familyTree.name)}&background=059669&color=fff&size=80`
                          }
                          alt={familyTree.name}
                          className="w-10 h-10 rounded-full object-cover border border-emerald-400"
                        />
                      )}
                      <div>
                        <div className="font-black text-sm text-white">{familyTree.name}</div>
                        <div className="text-xs text-emerald-300">{familyTree.title}</div>
                      </div>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold border border-emerald-500/30">
                      Generasi I (Uyut)
                    </span>
                  </div>

                  {/* Level 2 & 3 Vertical Stacks */}
                  {familyTree.children &&
                    familyTree.children.map((child) => (
                      <div
                        key={child.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm ml-4 sm:ml-8 relative"
                      >
                        <div className="absolute -left-4 sm:-left-8 top-6 w-4 sm:w-8 h-0.5 bg-slate-300"></div>

                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2.5">
                            {showPhotos && (
                              <img
                                src={
                                  child.photo ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(child.name)}&background=047857&color=fff&size=80`
                                }
                                alt={child.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-300"
                              />
                            )}
                            <h4 className="font-black text-xs text-slate-800">
                              {child.name}{' '}
                              <span className="font-normal text-slate-500">({child.title})</span>
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">Sub-Trah G2</span>
                        </div>

                        {/* Grandchildren Stacks */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {child.children &&
                            child.children.map((gc) => (
                              <div
                                key={gc.id}
                                className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col gap-1"
                              >
                                <div className="flex items-center gap-2">
                                  {showPhotos && (
                                    <img
                                      src={
                                        gc.photo ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(gc.name)}&background=065f46&color=fff&size=64`
                                      }
                                      alt={gc.name}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  )}
                                  <div className="truncate">
                                    <div className="font-bold text-xs text-slate-800 truncate">{gc.name}</div>
                                    <div className="text-[9px] text-slate-400 font-mono">{gc.title}</div>
                                  </div>
                                </div>
                                {gc.children && gc.children.length > 0 && (
                                  <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-emerald-800 font-mono font-medium">
                                    Anak: {gc.children.map((c) => c.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* SKIN 4: RADIAL WHEEL */}
              {currentSkin === 'radial' && (
                <div className="relative w-[480px] h-[480px] mx-auto flex items-center justify-center">
                  {/* Center Hub */}
                  <div className="absolute z-30 bg-emerald-700 text-white rounded-full w-28 h-28 flex flex-col items-center justify-center text-center p-2 shadow-2xl border-4 border-white">
                    {showPhotos && (
                      <img
                        src={
                          familyTree.photo ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(familyTree.name)}&background=059669&color=fff&size=80`
                        }
                        alt={familyTree.name}
                        className="w-9 h-9 rounded-full border-2 border-white mb-0.5 object-cover"
                      />
                    )}
                    <span className="font-black text-[11px] leading-tight text-white">{familyTree.name}</span>
                    <span className="text-[8px] text-emerald-200 font-mono mt-0.5">IC-ROOT</span>
                  </div>

                  {/* Outer Ring 1 (Children) */}
                  <div className="absolute w-[280px] h-[280px] rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                    {familyTree.children &&
                      familyTree.children.map((child, idx) => {
                        const count = familyTree.children?.length || 1;
                        const angle = (idx / count) * 360;
                        const rad = (angle * Math.PI) / 180;
                        const x = Math.cos(rad) * 140;
                        const y = Math.sin(rad) * 140;

                        return (
                          <div
                            key={child.id}
                            style={{ transform: `translate(${x}px, ${y}px)` }}
                            className="absolute z-20 bg-white border border-slate-300 rounded-full px-3 py-1 text-center shadow-md flex items-center gap-1.5"
                          >
                            {showPhotos && (
                              <img
                                src={
                                  child.photo ||
                                  `https://ui-avatars.com/api/?name=${encodeURIComponent(child.name)}&background=047857&color=fff&size=64`
                                }
                                alt={child.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            )}
                            <span className="text-[10px] font-bold text-slate-800">{child.name}</span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Outer Ring 2 (Grandchildren Decorative Orbit) */}
                  <div className="absolute w-[440px] h-[440px] rounded-full border border-slate-200"></div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Paper Cetak */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/90 flex justify-between items-center text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Silsilah Trah {trahName} &copy; 2026 &bull; Multi-Skin &amp; PCB Auto-Fit Engine</span>
            </span>
            <span className="font-mono">Halaman 1 dari 1 (Pas Kertas)</span>
          </div>
        </div>
      </main>

      {/* 4. FOOTER PANEL INFORMASI (NO PRINT) */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 px-4 py-2.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <BadgeCheck className="w-3.5 h-3.5" /> Status Sistem: Optimal
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Microchip className="w-3.5 h-3.5 text-amber-400" /> 4-Directional Pin Avoidance
            </span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Petunjuk: Gunakan tombol <b className="text-emerald-400">Pas Kertas</b> jika silsilah melebar keluar dari batas cetak.
          </div>
        </div>
      </footer>
    </div>
  );
};
