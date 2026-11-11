import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Grid,
  Plus,
  Trash2,
  Edit2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Download,
  Sparkles,
  X,
  Layers,
  Circle,
  Square,
  Hexagon,
  GitBranch,
  Split,
  Upload,
  RefreshCw,
  Info,
  HelpCircle,
  Sliders,
  ExternalLink,
  Camera,
  MapPin,
  Calendar,
  Award,
  Crown,
  Star,
  CheckCircle2,
  UserCheck,
  UserPlus,
  Compass,
  ArrowUpCircle,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  LayoutGrid,
  Minus,
  Maximize2,
  FileImage
} from 'lucide-react';
import { FamilyMember } from './LeluhurQuView';

export type NodeShape = 'card' | 'circle' | 'hexagon';
export type ConnectorType = 'orthogonal' | 'bezier' | 'linear';
export type PaperSize = 'autofit' | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'F4';
export type PaperOrientation = 'portrait' | 'landscape';
export type DisplaySkin = 'simple' | 'pill' | 'detailed';

export interface GridSpouse {
  id?: string;
  name: string;
  order?: number; // 1, 2, 3, 4
  note?: string; // status / thn nikah / kota asal
}

export interface GridNode {
  id: string;
  name: string;
  dotNotation: string;
  gender: 'L' | 'P';
  row: number; // 0-based generation/row level
  col: number; // 0-based column index in grid
  parentId?: string | null;
  // Field spesifik sesuai permintaan:
  photo?: string; // Base64 data URL atau URL foto profil
  birthDeath?: string; // Tahun lahir - wafat: e.g. "1918 - 1989" atau "1975 - Sekarang"
  domicile?: string; // Alamat Kota / Domisili: e.g. "Kuningan, Jawa Barat", "Bandung", "Jakarta"
  honorific?: string; // Gelar Bapak/Ibu: e.g. "Bapak", "Ibu", "Bpk. H.", "Ibu Hj.", "Raden", "Eyang"
  title?: string; // Peran tambahan / kinship
  spouseName?: string;
  spouses?: GridSpouse[]; // Multi-Istri (Poligini): Istri 1, Istri 2, dst.
  spouseOrder?: number; // Istri ke-berapa jika node adalah istri
  motherName?: string; // Nama ibu kandung jika anak dari suami beristri banyak
  color?: string; // emerald, blue, purple, amber, rose
  notes?: string;
  claimedBy?: string; // Nama / email akun yang mengklaim
  birthOrder?: number; // Nomor urut kelahiran (anak ke-1, 2, 3...)
}

interface GridCanvasEngineProps {
  members?: FamilyMember[];
  onBack: () => void;
  showNotification: (msg: string) => void;
}

// Standard Paper dimensions at 96 DPI in pixels
const PAPER_DIMENSIONS: Record<Exclude<PaperSize, 'autofit'>, { width: number; height: number; mmW: number; mmH: number }> = {
  A0: { width: 3179, height: 4494, mmW: 841, mmH: 1189 },
  A1: { width: 2245, height: 3179, mmW: 594, mmH: 841 },
  A2: { width: 1587, height: 2245, mmW: 420, mmH: 594 },
  A3: { width: 1122, height: 1587, mmW: 297, mmH: 420 },
  A4: { width: 794, height: 1123, mmW: 210, mmH: 297 },
  F4: { width: 813, height: 1247, mmW: 215, mmH: 330 },
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; header: string; ring: string }> = {
  emerald: {
    bg: '#ecfdf5',
    border: '#059669',
    text: '#065f46',
    header: '#059669',
    ring: '#10b981',
  },
  blue: {
    bg: '#eff6ff',
    border: '#2563eb',
    text: '#1e40af',
    header: '#2563eb',
    ring: '#3b82f6',
  },
  purple: {
    bg: '#faf5ff',
    border: '#9333ea',
    text: '#6b21a8',
    header: '#9333ea',
    ring: '#a855f7',
  },
  amber: {
    bg: '#fffbeb',
    border: '#d97706',
    text: '#92400e',
    header: '#d97706',
    ring: '#f59e0b',
  },
  rose: {
    bg: '#fff1f2',
    border: '#e11d48',
    text: '#9f1239',
    header: '#e11d48',
    ring: '#f43f5e',
  },
};

// Base design specifications for unscaled cards and grid corridors
const BASE_CARD_SPECS: Record<DisplaySkin, { cardW: number; cardH: number; cellW: number; cellH: number }> = {
  detailed: { cardW: 196, cardH: 118, cellW: 220, cellH: 152 },
  simple: { cardW: 186, cardH: 54, cellW: 204, cellH: 86 },
  pill: { cardW: 186, cardH: 38, cellW: 200, cellH: 74 },
};

const DEFAULT_GRID_START_X = 80;
const DEFAULT_GRID_START_Y = 110;

export const GridCanvasEngine: React.FC<GridCanvasEngineProps> = ({
  members = [],
  onBack,
  showNotification,
}) => {
  // Settings
  const [nodeShape, setNodeShape] = useState<NodeShape>('card');
  const [displaySkin, setDisplaySkin] = useState<DisplaySkin>(() => {
    try {
      return (localStorage.getItem('leluhurqu_grid_display_skin') as DisplaySkin) || 'simple';
    } catch {
      return 'simple';
    }
  });
  const [connectorType, setConnectorType] = useState<ConnectorType>('orthogonal');
  const [paperSize, setPaperSize] = useState<PaperSize>('autofit');
  const [orientation, setOrientation] = useState<PaperOrientation>('landscape');
  const [showGridGuide, setShowGridGuide] = useState<boolean>(true);
  const [highlightClaimedLineage, setHighlightClaimedLineage] = useState<boolean>(true);

  // Dynamic Card Scale, Spacing & Paper Auto-Fit States
  const [cardScale, setCardScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('leluhurqu_grid_card_scale');
      return saved ? Math.max(0.35, Math.min(2.5, parseFloat(saved))) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [gridStartX, setGridStartX] = useState<number>(DEFAULT_GRID_START_X);
  const [gridStartY, setGridStartY] = useState<number>(DEFAULT_GRID_START_Y);
  const [horizontalSpread, setHorizontalSpread] = useState<number>(1.0);
  const [verticalSpread, setVerticalSpread] = useState<number>(1.0);
  const [balanceMargins, setBalanceMargins] = useState<boolean>(true);
  const [stretchGaps, setStretchGaps] = useState<boolean>(false);
  const [autoMaximizeEnabled, setAutoMaximizeEnabled] = useState<boolean>(true);

  // Claim Akun User State
  const [claimedNodeId, setClaimedNodeId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('leluhurqu_grid_claimed_node_id') || 'node-4';
    } catch {
      return null;
    }
  });

  const [claimedUserName, setClaimedUserName] = useState<string>(() => {
    try {
      return localStorage.getItem('leluhurqu_grid_claimed_user_name') || 'Hendri (Akun Saya)';
    } catch {
      return 'Hendri (Akun Saya)';
    }
  });

  // Nodes Data State
  const [nodes, setNodes] = useState<GridNode[]>(() => {
    try {
      const saved = localStorage.getItem('leluhurqu_grid_engine_nodes_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }

    // Default Starter Seed Family Tree with Photo, Domicile, Honorific
    return [
      {
        id: 'node-1',
        name: 'Raden H. Kartasasmita',
        honorific: 'Bapak H.',
        dotNotation: '1',
        title: 'Leluhur Utama',
        birthDeath: '1918 - 1989',
        domicile: 'Kuningan, Jawa Barat',
        gender: 'L',
        row: 0,
        col: 2,
        parentId: null,
        spouseName: 'Hj. Siti Rohimah & Hj. Endang Maryam',
        spouses: [
          { id: 'sp-1', name: 'Hj. Siti Rohimah', order: 1, note: 'Istri Ke-1 (Kuningan)' },
          { id: 'sp-2', name: 'Hj. Endang Maryam', order: 2, note: 'Istri Ke-2 (Cirebon)' },
        ],
        color: 'emerald',
      },
      {
        id: 'node-2',
        name: 'Drs. H. Ahmad Subarkah',
        honorific: 'Bapak H.',
        dotNotation: '1.1',
        title: 'Anak Pertama',
        birthDeath: '1945 - 2015',
        domicile: 'Bandung, Jawa Barat',
        gender: 'L',
        row: 1,
        col: 1,
        parentId: 'node-1',
        motherName: 'Hj. Siti Rohimah (Istri Ke-1)',
        spouseName: 'Hj. Aminah Zahra',
        color: 'blue',
      },
      {
        id: 'node-3',
        name: 'Hj. Dewi Komalasari',
        honorific: 'Ibu Hj.',
        dotNotation: '1.2',
        title: 'Anak Kedua',
        birthDeath: '1949 - Sekarang',
        domicile: 'Cirebon, Jawa Barat',
        gender: 'P',
        row: 1,
        col: 3,
        parentId: 'node-1',
        motherName: 'Hj. Endang Maryam (Istri Ke-2)',
        spouseName: 'Ir. H. Dedi Sudrajat',
        color: 'purple',
      },
      {
        id: 'node-4',
        name: 'Budi Santoso, S.T.',
        honorific: 'Bapak',
        dotNotation: '1.1.1',
        title: 'Cucu',
        birthDeath: '1975 - Sekarang',
        domicile: 'Jakarta Selatan',
        gender: 'L',
        row: 2,
        col: 0,
        parentId: 'node-2',
        color: 'amber',
        claimedBy: 'Hendri (Akun Saya)',
      },
      {
        id: 'node-5',
        name: 'dr. Siti Fauziyah, Sp.A',
        honorific: 'Ibu',
        dotNotation: '1.1.2',
        title: 'Cucu',
        birthDeath: '1978 - Sekarang',
        domicile: 'Bogor, Jawa Barat',
        gender: 'P',
        row: 2,
        col: 1,
        parentId: 'node-2',
        color: 'rose',
      },
      {
        id: 'node-6',
        name: 'Muhammad Farhan',
        honorific: 'Bapak',
        dotNotation: '1.2.1',
        title: 'Cucu',
        birthDeath: '1982 - Sekarang',
        domicile: 'Kuningan, Jawa Barat',
        gender: 'L',
        row: 2,
        col: 3,
        parentId: 'node-3',
        color: 'blue',
      },
    ];
  });

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('leluhurqu_grid_engine_nodes_v2', JSON.stringify(nodes));
    } catch (e) {
      console.error(e);
    }
  }, [nodes]);

  useEffect(() => {
    try {
      if (claimedNodeId) {
        localStorage.setItem('leluhurqu_grid_claimed_node_id', claimedNodeId);
      } else {
        localStorage.removeItem('leluhurqu_grid_claimed_node_id');
      }
      localStorage.setItem('leluhurqu_grid_claimed_user_name', claimedUserName);
    } catch (e) {
      console.error(e);
    }
  }, [claimedNodeId, claimedUserName]);

  useEffect(() => {
    try {
      localStorage.setItem('leluhurqu_grid_display_skin', displaySkin);
    } catch (e) {
      console.error(e);
    }
  }, [displaySkin]);

  useEffect(() => {
    try {
      localStorage.setItem('leluhurqu_grid_card_scale', String(cardScale));
    } catch (e) {
      console.error(e);
    }
  }, [cardScale]);

  // Selected Node for Inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Zoom & Pan Canvas State
  const [zoom, setZoom] = useState<number>(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging Node to Grid state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverGridCell, setHoverGridCell] = useState<{ row: number; col: number } | null>(null);

  // Modal / Drawer States
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showAddSingleModal, setShowAddSingleModal] = useState<boolean>(false);
  const [showAyahUyutModal, setShowAyahUyutModal] = useState<boolean>(false);
  const [showClaimModal, setShowClaimModal] = useState<boolean>(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Batch Input Form (Dukungan Entry Awal Default / Bebas)
  const [batchParentId, setBatchParentId] = useState<string>(''); // '' = Bebas / Root Baru
  const [batchStartRow, setBatchStartRow] = useState<number>(0);
  const [batchStartPrefix, setBatchStartPrefix] = useState<string>('1');
  const [batchDefaultHonorific, setBatchDefaultHonorific] = useState<string>('Bapak');
  const [batchDefaultDomicile, setBatchDefaultDomicile] = useState<string>('Kuningan, Jawa Barat');
  const [batchNames, setBatchNames] = useState<string>(
    'Rian Pratama, Anisa Rahma, Hendra Gunawan, Putri Melati'
  );
  const [batchMode, setBatchMode] = useState<'comma' | 'outline'>('comma');
  const [batchOutlineText, setBatchOutlineText] = useState<string>(
    `1. Raden Arya [Bapak H.] (1900 - 1970) | Kuningan
  1.1 Tirto Sasmita [Bapak] (1930 - 2005) | Bandung
    1.1.1 Agus Tirto [Bapak] (1960 - Skrg) | Jakarta
    1.1.2 Budi Tirto [Bapak] (1965 - Skrg) | Bogor
  1.2 Kartini Putri [Ibu Hj.] (1935 - 2012) | Cirebon
    1.2.1 Cantika Dewi [Ibu] (1970 - Skrg) | Bandung`
  );

  // Single Add / Edit Form
  const [nodeFormData, setNodeFormData] = useState<Partial<GridNode>>({
    name: '',
    honorific: 'Bapak',
    birthDeath: '',
    domicile: '',
    photo: '',
    gender: 'L',
    parentId: null,
    spouseName: '',
    color: 'emerald',
    notes: '',
  });

  // Ayah Uyut Ditemukan Form
  const [ayahUyutForm, setAyahUyutForm] = useState<{
    name: string;
    honorific: string;
    birthDeath: string;
    domicile: string;
    photo: string;
    gender: 'L' | 'P';
    childrenIds: string[];
    color: string;
  }>({
    name: 'Kyai Raden H. Masduki',
    honorific: 'Bapak H.',
    birthDeath: '1885 - 1952',
    domicile: 'Kuningan, Jawa Barat',
    photo: '',
    gender: 'L',
    childrenIds: ['node-1'],
    color: 'emerald',
  });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const ayahUyutPhotoRef = useRef<HTMLInputElement | null>(null);

  // Helper to get Node by ID
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Spatial Grid Boundary Calculation
  const maxRow = useMemo(() => {
    if (nodes.length === 0) return 4;
    return Math.max(...nodes.map((n) => n.row), 3);
  }, [nodes]);

  const maxCol = useMemo(() => {
    if (nodes.length === 0) return 5;
    return Math.max(...nodes.map((n) => n.col), 4);
  }, [nodes]);

  // Lineage path calculation for Claimed Account
  const claimedLineagePathIds = useMemo(() => {
    if (!claimedNodeId) return new Set<string>();
    const path = new Set<string>();
    let current = nodes.find((n) => n.id === claimedNodeId);
    while (current) {
      path.add(current.id);
      if (current.parentId) {
        current = nodes.find((n) => n.id === current?.parentId);
      } else {
        break;
      }
    }
    return path;
  }, [nodes, claimedNodeId]);

  // Dynamic Card Base Dimensions & Scaling
  const baseDimensions = useMemo(() => {
    if (nodeShape === 'circle') {
      const r = displaySkin === 'simple' ? 44 : 56;
      return { cardW: r * 2, cardH: r * 2, cellW: r * 2 + 48, cellH: r * 2 + 42 };
    }
    if (nodeShape === 'hexagon') {
      const r = displaySkin === 'simple' ? 48 : 60;
      return { cardW: r * 2, cardH: r * 2, cellW: r * 2 + 48, cellH: r * 2 + 42 };
    }
    return BASE_CARD_SPECS[displaySkin] || BASE_CARD_SPECS.detailed;
  }, [displaySkin, nodeShape]);

  const dynamicCellWidth = Math.round(baseDimensions.cellW * cardScale * horizontalSpread);
  const dynamicCellHeight = Math.round(baseDimensions.cellH * cardScale * verticalSpread);

  // Node pixel position from Grid Coordinate (Row, Col)
  const getNodePosition = (row: number, col: number) => {
    return {
      x: gridStartX + col * dynamicCellWidth,
      y: gridStartY + row * dynamicCellHeight,
    };
  };

  // Convert pixel coord to closest Grid (Row, Col)
  const pixelToGrid = (px: number, py: number) => {
    const col = Math.max(0, Math.round((px - gridStartX) / dynamicCellWidth));
    const row = Math.max(0, Math.round((py - gridStartY) / dynamicCellHeight));
    return { row, col };
  };

  // Check if cell is occupied (zero collision)
  const isCellOccupied = (row: number, col: number, excludeId?: string | null) => {
    return nodes.some((n) => n.row === row && n.col === col && n.id !== excludeId);
  };

  // Find next vacant column in row
  const findNextVacantCol = (row: number, startCol = 0, excludeId?: string | null) => {
    let col = startCol;
    while (isCellOccupied(row, col, excludeId)) {
      col++;
    }
    return col;
  };

  // Re-calculate Dot-Notation automatically
  const recomputeDotNotation = (currentNodes: GridNode[]): GridNode[] => {
    const roots = currentNodes.filter((n) => !n.parentId).sort((a, b) => a.col - b.col);
    const updated = [...currentNodes];

    const assignNotation = (nodeId: string, notation: string) => {
      const idx = updated.findIndex((n) => n.id === nodeId);
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], dotNotation: notation };
      }
      const children = updated.filter((n) => n.parentId === nodeId).sort((a, b) => a.col - b.col);
      children.forEach((child, i) => {
        assignNotation(child.id, `${notation}.${i + 1}`);
      });
    };

    roots.forEach((root, idx) => {
      assignNotation(root.id, `${idx + 1}`);
    });

    return updated;
  };

  // Helper ekstrak tahun dari string birthDeath (misal "1945 - 2015" -> 1945)
  const extractBirthYear = (str?: string): number => {
    if (!str) return 9999;
    const match = str.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : 9999;
  };

  // Urutkan anak-anak dari node tertentu berdasarkan tahun lahir
  const handleSortChildrenByBirthYear = (parentNodeId: string) => {
    const children = nodes.filter((n) => n.parentId === parentNodeId);
    if (children.length <= 1) {
      showNotification('Jumlah anak kurang dari 2, tidak perlu diurutkan.');
      return;
    }

    const sorted = [...children].sort((a, b) => {
      const yA = extractBirthYear(a.birthDeath);
      const yB = extractBirthYear(b.birthDeath);
      if (yA !== yB) return yA - yB;
      return a.col - b.col;
    });

    const minCol = Math.min(...children.map((c) => c.col));
    const updated = nodes.map((n) => {
      const idx = sorted.findIndex((s) => s.id === n.id);
      if (idx !== -1) {
        return {
          ...n,
          col: minCol + idx,
        };
      }
      return n;
    });

    const renumbered = recomputeDotNotation(updated);
    setNodes(renumbered);
    showNotification(`Urutan ${children.length} anak berhasil dirapikan per tahun lahir!`);
  };

  // Tukar Urutan Saudara (Geser Lebih Tua / Lebih Muda)
  const handleSwapSiblingOrder = (nodeId: string, direction: 'prev' | 'next') => {
    const current = nodes.find((n) => n.id === nodeId);
    if (!current || !current.parentId) {
      showNotification('Hanya anggota yang memiliki orang tua / saudara yang dapat ditukar urutannya.');
      return;
    }

    const siblings = nodes
      .filter((n) => n.parentId === current.parentId)
      .sort((a, b) => a.col - b.col);

    const curIndex = siblings.findIndex((s) => s.id === nodeId);
    if (curIndex === -1) return;

    const targetIndex = direction === 'prev' ? curIndex - 1 : curIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) {
      showNotification(direction === 'prev' ? 'Sudah berada di urutan paling kiri (tertua)!' : 'Sudah berada di urutan paling kanan (termuda)!');
      return;
    }

    const neighbor = siblings[targetIndex];
    const tempCol = current.col;
    const neighborCol = neighbor.col;

    const updated = nodes.map((n) => {
      if (n.id === current.id) return { ...n, col: neighborCol };
      if (n.id === neighbor.id) return { ...n, col: tempCol };
      return n;
    });

    const renumbered = recomputeDotNotation(updated);
    setNodes(renumbered);
    showNotification(`Urutan ${current.name} berhasil ditukar dengan ${neighbor.name}!`);
  };

  // Koreksi & Urutkan Seluruh Pohon Silsilah Otomatis Sesuai Tahun Lahir
  const handleSortAllTreeByBirthYear = () => {
    if (nodes.length === 0) return;

    const parentIds = Array.from(new Set(nodes.filter((n) => n.parentId).map((n) => n.parentId!)));
    if (parentIds.length === 0) {
      showNotification('Belum ada data relasi orang tua dalam silsilah.');
      return;
    }

    let updated = [...nodes];

    parentIds.forEach((pId) => {
      const children = updated.filter((n) => n.parentId === pId);
      if (children.length > 1) {
        const sorted = [...children].sort((a, b) => {
          const yA = extractBirthYear(a.birthDeath);
          const yB = extractBirthYear(b.birthDeath);
          if (yA !== yB) return yA - yB;
          return a.col - b.col;
        });

        const minCol = Math.min(...children.map((c) => c.col));
        sorted.forEach((ch, idx) => {
          const mIdx = updated.findIndex((u) => u.id === ch.id);
          if (mIdx !== -1) {
            updated[mIdx] = {
              ...updated[mIdx],
              col: minCol + idx,
            };
          }
        });
      }
    });

    const renumbered = recomputeDotNotation(updated);
    setNodes(renumbered);
    showNotification('Seluruh urutan silsilah (Kakek, Ayah, Anak, Cucu) berhasil dirapikan per tahun lahir!');
  };

  // Dynamic Tree Spacing & Auto Centering (Rapikan Otomatis)
  const handleAutoLayoutTree = () => {
    if (nodes.length === 0) return;

    // 1. Identify root nodes
    const rootNodes = nodes.filter((n) => !n.parentId || !nodes.some((p) => p.id === n.parentId));
    rootNodes.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    const getChildren = (nodeId: string) => {
      return nodes
        .filter((n) => n.parentId === nodeId)
        .sort((a, b) => {
          if (a.birthOrder !== undefined && b.birthOrder !== undefined) {
            return a.birthOrder - b.birthOrder;
          }
          const yA = extractBirthYear(a.birthDeath);
          const yB = extractBirthYear(b.birthDeath);
          if (yA !== 9999 && yB !== 9999 && yA !== yB) return yA - yB;
          return a.col - b.col;
        });
    };

    // 2. Subtree width calculation
    const subtreeWidths = new Map<string, number>();
    const computeSubtreeWidth = (nodeId: string): number => {
      const children = getChildren(nodeId);
      if (children.length === 0) {
        subtreeWidths.set(nodeId, 1);
        return 1;
      }
      let sumW = 0;
      children.forEach((c) => {
        sumW += computeSubtreeWidth(c.id);
      });
      const node = nodes.find((n) => n.id === nodeId);
      const minW = node && node.spouses && node.spouses.length > 1 ? 2 : 1;
      const finalW = Math.max(sumW, minW);
      subtreeWidths.set(nodeId, finalW);
      return finalW;
    };
    rootNodes.forEach((r) => computeSubtreeWidth(r.id));

    // 3. Coordinate Assignment with Auto Centering & Zero Collision
    const assignedPos = new Map<string, { row: number; col: number }>();
    const occupied = new Set<string>();

    const isCellTaken = (r: number, c: number) => occupied.has(`${r},${c}`);
    const takeCell = (r: number, c: number) => occupied.add(`${r},${c}`);

    let currentRootStartCol = 1;

    const layoutSubtree = (nodeId: string, currentRow: number, startCol: number): number => {
      const children = getChildren(nodeId);

      if (children.length === 0) {
        let col = startCol;
        while (isCellTaken(currentRow, col)) {
          col++;
        }
        assignedPos.set(nodeId, { row: currentRow, col });
        takeCell(currentRow, col);
        return col + 1;
      }

      // Layout all children subtrees side-by-side
      let childCursorCol = startCol;
      const placedChildCols: number[] = [];

      children.forEach((child) => {
        const nextStart = layoutSubtree(child.id, currentRow + 1, childCursorCol);
        const childPos = assignedPos.get(child.id);
        if (childPos) placedChildCols.push(childPos.col);
        childCursorCol = Math.max(nextStart, childPos ? childPos.col + 1 : childCursorCol);
      });

      // Auto Centering: Center parent directly above the midpoint of its children
      const minC = Math.min(...placedChildCols);
      const maxC = Math.max(...placedChildCols);
      let centerCol = Math.round((minC + maxC) / 2);

      while (isCellTaken(currentRow, centerCol)) {
        centerCol++;
      }

      assignedPos.set(nodeId, { row: currentRow, col: centerCol });
      takeCell(currentRow, centerCol);

      return Math.max(childCursorCol, centerCol + 1);
    };

    rootNodes.forEach((root) => {
      currentRootStartCol = layoutSubtree(root.id, 0, currentRootStartCol) + 1;
    });

    // Apply new positions
    const updated = nodes.map((n) => {
      const p = assignedPos.get(n.id);
      if (p) {
        return { ...n, row: p.row, col: p.col };
      }
      return n;
    });

    const renumbered = recomputeDotNotation(updated);
    setNodes(renumbered);
    showNotification('✨ Seluruh bagan silsilah berhasil dirapikan otomatis & seimbang (Auto-Centering)!');
  };

  // Photo Compress Helper for Lightweight Base64 Offline Storage
  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (base64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 240;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          onComplete(compressed);
          showNotification('Foto profil berhasil diunggah & dikompres');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // =========================================================================
  // SOLUSI AYAH UYUT BARU DITEMUKAN (PREPEND TOP ANCESTOR & PUSH GENERATIONS)
  // =========================================================================
  const handleInsertAyahUyut = () => {
    if (!ayahUyutForm.name.trim()) {
      showNotification('Nama Ayah Uyut wajib diisi');
      return;
    }

    // 1. Shift all existing nodes down by +1 row (Generasi diturunkan 1 tingkat)
    const shiftedNodes = nodes.map((n) => ({
      ...n,
      row: n.row + 1,
    }));

    // 2. Tentukan posisi kolom Ayah Uyut (di atas anak-anaknya atau kolom tengah)
    let targetCol = 2;
    if (ayahUyutForm.childrenIds.length > 0) {
      const childNodes = shiftedNodes.filter((n) => ayahUyutForm.childrenIds.includes(n.id));
      if (childNodes.length > 0) {
        const avgCol = Math.round(
          childNodes.reduce((acc, c) => acc + c.col, 0) / childNodes.length
        );
        targetCol = avgCol;
      }
    }

    const ayahUyutId = `node-uyut-${Date.now()}`;
    const newAyahUyutNode: GridNode = {
      id: ayahUyutId,
      name: ayahUyutForm.name,
      honorific: ayahUyutForm.honorific || 'Bapak H.',
      dotNotation: '1',
      title: 'Ayah Uyut (Leluhur Puncak)',
      birthDeath: ayahUyutForm.birthDeath || '',
      domicile: ayahUyutForm.domicile || '',
      photo: ayahUyutForm.photo || '',
      gender: ayahUyutForm.gender || 'L',
      row: 0,
      col: targetCol,
      parentId: null,
      color: ayahUyutForm.color || 'emerald',
    };

    // 3. Sambungkan anak-anak yang dipilih ke Ayah Uyut ini
    const updatedWithChildren = shiftedNodes.map((n) => {
      if (ayahUyutForm.childrenIds.includes(n.id)) {
        return {
          ...n,
          parentId: ayahUyutId,
        };
      }
      return n;
    });

    // 4. Gabungkan dan hitung ulang seluruh rantai dot-notation
    const allUpdated = recomputeDotNotation([newAyahUyutNode, ...updatedWithChildren]);
    setNodes(allUpdated);
    setShowAyahUyutModal(false);
    showNotification(
      `✨ Solusi Berhasil: Ayah Uyut ${newAyahUyutNode.name} disisipkan di Puncak! Seluruh generasi diturunkan & nomor diperbarui.`
    );
  };

  // =========================================================================
  // FAST BATCH INPUT (ENTRY AWAL DEFAULT / BEBAS)
  // =========================================================================
  const handleAddBatch = () => {
    if (batchMode === 'comma') {
      const namesList = batchNames
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (namesList.length === 0) {
        showNotification('Masukkan minimal 1 nama');
        return;
      }

      const parent = nodes.find((n) => n.id === batchParentId);
      // Jika batchParentId kosong -> Entry Awal Bebas / Root Baru
      const targetRow = parent ? parent.row + 1 : batchStartRow;

      let currentNodes = [...nodes];
      let startCol = parent ? parent.col : 0;

      const colors: Array<'emerald' | 'blue' | 'purple' | 'amber' | 'rose'> = [
        'emerald',
        'blue',
        'purple',
        'amber',
        'rose',
      ];

      namesList.forEach((rawName, i) => {
        // Cek jika ada honorific di awal nama (misal: "Bpk. Hendra" atau "Ibu Siti")
        let honorific = batchDefaultHonorific;
        let cleanName = rawName;
        if (/^(Bapak|Bpk|Pak)\b/i.test(rawName)) {
          honorific = 'Bapak';
          cleanName = rawName.replace(/^(Bapak|Bpk|Pak)\.?\s*/i, '');
        } else if (/^(Ibu|Bu|Hj)\b/i.test(rawName)) {
          honorific = 'Ibu';
          cleanName = rawName.replace(/^(Ibu|Bu)\.?\s*/i, '');
        }

        // Cari cell kosong (Zero Collision Guarantee)
        let col = startCol + i;
        while (currentNodes.some((n) => n.row === targetRow && n.col === col)) {
          col++;
        }

        const assignedColor = colors[(currentNodes.length + i) % colors.length];

        const newNode: GridNode = {
          id: `node-${Date.now()}-${i}`,
          name: cleanName,
          honorific,
          dotNotation: '...',
          birthDeath: 'Tahun Lahir - Wafat',
          domicile: batchDefaultDomicile,
          gender: honorific.includes('Ibu') ? 'P' : 'L',
          row: targetRow,
          col,
          parentId: parent ? parent.id : null,
          color: assignedColor,
        };
        currentNodes.push(newNode);
      });

      const renumbered = recomputeDotNotation(currentNodes);
      setNodes(renumbered);
      setShowBatchModal(false);
      showNotification(`Berhasil menambahkan ${namesList.length} anggota secara massal`);
    } else {
      // Outline Parse
      parseAndApplyOutline(batchOutlineText);
    }
  };

  // Parse Indented / Outline text
  const parseAndApplyOutline = (text: string) => {
    try {
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const parsedNodes: GridNode[] = [];
      const stack: { id: string; depth: number; row: number }[] = [];

      lines.forEach((line, idx) => {
        const matchSpaces = line.match(/^(\s*)/);
        const spaces = matchSpaces ? matchSpaces[1].length : 0;
        const depth = Math.floor(spaces / 2);

        // Ekstraksi teks: 1.1 Nama [Gelar] (1920 - 1990) | Kota
        let lineContent = line.trim().replace(/^[\d.]+\s*/, '');
        let honorific = 'Bapak';
        let birthDeath = '';
        let domicile = 'Kuningan, Jawa Barat';

        // Match [Gelar]
        const honorificMatch = lineContent.match(/\[(.*?)\]/);
        if (honorificMatch) {
          honorific = honorificMatch[1];
          lineContent = lineContent.replace(/\[(.*?)\]/, '');
        }

        // Match (Tahun)
        const yearMatch = lineContent.match(/\((.*?)\)/);
        if (yearMatch) {
          birthDeath = yearMatch[1];
          lineContent = lineContent.replace(/\((.*?)\)/, '');
        }

        // Match | Kota
        if (lineContent.includes('|')) {
          const parts = lineContent.split('|');
          lineContent = parts[0];
          domicile = parts[1].trim();
        }

        const rawName = lineContent.trim() || `Anggota ${idx + 1}`;
        const row = depth;

        let col = 0;
        while (parsedNodes.some((n) => n.row === row && n.col === col)) {
          col++;
        }

        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
          stack.pop();
        }
        const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;

        const colors: Array<'emerald' | 'blue' | 'purple' | 'amber' | 'rose'> = [
          'emerald',
          'blue',
          'purple',
          'amber',
          'rose',
        ];
        const assignedColor = colors[depth % colors.length];

        const nodeId = `outline-${Date.now()}-${idx}`;
        const node: GridNode = {
          id: nodeId,
          name: rawName,
          honorific,
          dotNotation: '...',
          birthDeath: birthDeath || 'Tahun Lahir - Wafat',
          domicile: domicile || 'Kota Domisili',
          gender: honorific.toLowerCase().includes('ibu') ? 'P' : 'L',
          row,
          col,
          parentId,
          color: assignedColor,
        };

        parsedNodes.push(node);
        stack.push({ id: nodeId, depth, row });
      });

      if (parsedNodes.length > 0) {
        const renumbered = recomputeDotNotation(parsedNodes);
        setNodes(renumbered);
        setShowBatchModal(false);
        showNotification(`Berhasil menyusun pohon dari teks (${parsedNodes.length} anggota)`);
      }
    } catch {
      showNotification('Format outline tidak valid, cek spasi/indentasi');
    }
  };

  // =========================================================================
  // CLAIM SILSILAH BY AKUN
  // =========================================================================
  const handleClaimNode = (nodeId: string) => {
    setClaimedNodeId(nodeId);
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        claimedBy: n.id === nodeId ? claimedUserName : undefined,
      }))
    );
    setShowClaimModal(false);
    const target = nodes.find((n) => n.id === nodeId);
    showNotification(
      `⭐ Selamat! Anda berhasil mengklaim posisi silsilah: ${target?.name} (Nomor: ${target?.dotNotation})`
    );
  };

  const handleUnclaimNode = () => {
    setClaimedNodeId(null);
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        claimedBy: undefined,
      }))
    );
    setShowClaimModal(false);
    showNotification('Klaim posisi akun dilepaskan');
  };

  // Drag & Drop Mouse & Touch Handlers with Zero-Collision
  const handleNodeMouseDown = (e: React.MouseEvent, node: GridNode) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);

    const pos = getNodePosition(node.row, node.col);
    const svgPoint = getSvgCoordinates(e.clientX, e.clientY);
    setDragOffset({
      x: svgPoint.x - pos.x,
      y: svgPoint.y - pos.y,
    });
    setDragCurrentPos({ x: pos.x, y: pos.y });
    setHoverGridCell({ row: node.row, col: node.col });
  };

  const handleNodeTouchStart = (e: React.TouchEvent, node: GridNode) => {
    e.stopPropagation();
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setSelectedNodeId(node.id);
    setDraggingNodeId(node.id);

    const pos = getNodePosition(node.row, node.col);
    const svgPoint = getSvgCoordinates(touch.clientX, touch.clientY);
    setDragOffset({
      x: svgPoint.x - pos.x,
      y: svgPoint.y - pos.y,
    });
    setDragCurrentPos({ x: pos.x, y: pos.y });
    setHoverGridCell({ row: node.row, col: node.col });
  };

  const getSvgCoordinates = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingNodeId) {
        const pt = getSvgCoordinates(e.clientX, e.clientY);
        const newX = pt.x - dragOffset.x;
        const newY = pt.y - dragOffset.y;
        setDragCurrentPos({ x: newX, y: newY });
        const cell = pixelToGrid(newX + dynamicCellWidth / 2, newY + dynamicCellHeight / 2);
        setHoverGridCell(cell);
      } else if (isPanning) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (draggingNodeId && e.touches.length === 1) {
        const touch = e.touches[0];
        const pt = getSvgCoordinates(touch.clientX, touch.clientY);
        const newX = pt.x - dragOffset.x;
        const newY = pt.y - dragOffset.y;
        setDragCurrentPos({ x: newX, y: newY });
        const cell = pixelToGrid(newX + dynamicCellWidth / 2, newY + dynamicCellHeight / 2);
        setHoverGridCell(cell);
      } else if (isPanning && e.touches.length === 1) {
        const touch = e.touches[0];
        setPan({
          x: touch.clientX - panStartRef.current.x,
          y: touch.clientY - panStartRef.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      if (draggingNodeId && hoverGridCell) {
        finishNodeDrag(draggingNodeId, hoverGridCell.row, hoverGridCell.col);
      }
      setDraggingNodeId(null);
      setIsPanning(false);
      setHoverGridCell(null);
    };

    const handleTouchEnd = () => {
      if (draggingNodeId && hoverGridCell) {
        finishNodeDrag(draggingNodeId, hoverGridCell.row, hoverGridCell.col);
      }
      setDraggingNodeId(null);
      setIsPanning(false);
      setHoverGridCell(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [draggingNodeId, hoverGridCell, isPanning, dragOffset, pan, zoom]);

  // Finish dragging with Zero Collision Guarantee
  const finishNodeDrag = (nodeId: string, targetRow: number, targetCol: number) => {
    const currentNode = nodes.find((n) => n.id === nodeId);
    if (!currentNode) return;

    const occupant = nodes.find(
      (n) => n.id !== nodeId && n.row === targetRow && n.col === targetCol
    );

    let nextNodes = [...nodes];
    if (occupant) {
      nextNodes = nextNodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, row: targetRow, col: targetCol };
        }
        if (n.id === occupant.id) {
          return { ...n, row: currentNode.row, col: currentNode.col };
        }
        return n;
      });
      showNotification(`Posisi ditukar dengan ${occupant.name} (Bebas Tumpang Tindih)`);
    } else {
      nextNodes = nextNodes.map((n) =>
        n.id === nodeId ? { ...n, row: targetRow, col: targetCol } : n
      );
      showNotification(`Node dipindahkan ke Baris ${targetRow + 1}, Kolom ${targetCol + 1}`);
    }

    const renumbered = recomputeDotNotation(nextNodes);
    setNodes(renumbered);
  };

  // Add / Edit Single Node
  const handleSaveSingleNode = () => {
    if (!nodeFormData.name || nodeFormData.name.trim() === '') {
      showNotification('Nama anggota wajib diisi');
      return;
    }

    if (selectedNodeId) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selectedNodeId
            ? {
                ...n,
                ...nodeFormData,
                name: nodeFormData.name!,
              }
            : n
        )
      );
      showNotification('Data anggota diperbarui');
    } else {
      const parent = nodes.find((n) => n.id === nodeFormData.parentId);
      const targetRow = parent ? parent.row + 1 : 0;
      const targetCol = findNextVacantCol(targetRow, parent ? parent.col : 0);

      const newNode: GridNode = {
        id: `node-${Date.now()}`,
        name: nodeFormData.name,
        honorific: nodeFormData.honorific || (nodeFormData.gender === 'P' ? 'Ibu' : 'Bapak'),
        dotNotation: '...',
        birthDeath: nodeFormData.birthDeath || 'Tahun Lahir - Wafat',
        domicile: nodeFormData.domicile || 'Kota Domisili',
        photo: nodeFormData.photo || '',
        gender: nodeFormData.gender || 'L',
        row: targetRow,
        col: targetCol,
        parentId: nodeFormData.parentId || null,
        spouseName: nodeFormData.spouseName || '',
        spouses: nodeFormData.spouses || undefined,
        spouseOrder: nodeFormData.spouseOrder || undefined,
        motherName: nodeFormData.motherName || undefined,
        color: nodeFormData.color || 'emerald',
        notes: nodeFormData.notes || '',
      };

      const renumbered = recomputeDotNotation([...nodes, newNode]);
      setNodes(renumbered);
      showNotification(`Anggota ${newNode.name} ditambahkan`);
    }

    setShowAddSingleModal(false);
    setSelectedNodeId(null);
  };

  const handleDeleteNode = (id: string) => {
    const target = nodes.find((n) => n.id === id);
    if (!target) return;

    const updated = nodes
      .filter((n) => n.id !== id)
      .map((n) => (n.parentId === id ? { ...n, parentId: target.parentId } : n));

    const renumbered = recomputeDotNotation(updated);
    setNodes(renumbered);
    if (claimedNodeId === id) {
      setClaimedNodeId(null);
    }
    setSelectedNodeId(null);
    showNotification(`Node ${target.name} dihapus`);
  };

  const handleAutoFit = () => {
    setZoom(0.9);
    setPan({ x: 40, y: 40 });
    showNotification('Tampilan disesuaikan otomatis (Fit View)');
  };

  const handleCardScaleStep = (delta: number | 'up' | 'down') => {
    const numDelta = typeof delta === 'number' ? delta : delta === 'up' ? 0.1 : -0.1;
    setCardScale((prev) => {
      const next = Math.max(0.35, Math.min(2.5, Math.round((prev + numDelta) * 100) / 100));
      showNotification(`Ukuran Kartu: ${Math.round(next * 100)}% (${numDelta > 0 ? 'Membesar' : 'Mengecil'})`);
      return next;
    });
  };

  // =========================================================================
  // AUTO MAKIMALKAN KE UKURAN KERTAS (SEMUA NAMA MASUK & RUANG KOSONG TERPAKAI)
  // =========================================================================
  const handleAutoMaximizeToPaper = (
    targetPaper?: PaperSize,
    targetOrientation?: PaperOrientation,
    targetSpread?: boolean
  ) => {
    const chosenPaper = targetPaper !== undefined ? targetPaper : paperSize;
    let chosenOrientation = targetOrientation !== undefined ? targetOrientation : orientation;
    const shouldSpread = targetSpread !== undefined ? targetSpread : stretchGaps;

    if (nodes.length === 0) {
      showNotification('Belum ada data anggota untuk disesuaikan ke kertas.');
      return;
    }

    // 1. Hitung Bounding Box seluruh anggota di grid silsilah
    const minC = Math.min(...nodes.map((n) => n.col));
    const maxC = Math.max(...nodes.map((n) => n.col));
    const colSpan = Math.max(1, maxC - minC + 1);

    const minR = Math.min(...nodes.map((n) => n.row));
    const maxR = Math.max(...nodes.map((n) => n.row));
    const rowSpan = Math.max(1, maxR - minR + 1);

    // 2. Mode Autofit Kanvas Bebas
    if (chosenPaper === 'autofit') {
      setCardScale(1.0);
      setHorizontalSpread(1.0);
      setVerticalSpread(1.0);
      setGridStartX(DEFAULT_GRID_START_X);
      setGridStartY(DEFAULT_GRID_START_Y);
      setPan({ x: 30, y: 30 });
      setZoom(0.95);
      showNotification('Bagan disetel ke mode kanvas bebas (Auto-Fit Bebas)');
      return;
    }

    // 3. Ambil dimensi lembar kertas target (dalam pixel 96 DPI)
    const std = PAPER_DIMENSIONS[chosenPaper as Exclude<PaperSize, 'autofit'>];
    let paperW = chosenOrientation === 'landscape' ? std.height : std.width;
    let paperH = chosenOrientation === 'landscape' ? std.width : std.height;

    // 4. Margin Kertas (KOP Silsilah atas, margin samping dan bawah)
    const topKopMargin = 96;
    const bottomMargin = 40;
    const sideMargin = 40;

    const availableW = Math.max(200, paperW - sideMargin * 2);
    const availableH = Math.max(200, paperH - topKopMargin - bottomMargin);

    // 5. Ukuran dasar cell (tanpa skala)
    const baseW = baseDimensions.cellW;
    const baseH = baseDimensions.cellH;

    // 6. Hitung Skala Maksimum agar SEMUA NAMA MASUK tanpa terpotong
    const maxScaleX = availableW / (colSpan * baseW);
    const maxScaleY = availableH / (rowSpan * baseH);

    // Gunakan nilai pembatas dengan faktor pengaman 0.95 (zero-bleed)
    let optimalScale = Math.min(maxScaleX, maxScaleY) * 0.95;

    // Batasi dalam rentang wajar (0.35x untuk silsilah sangat besar hingga 2.2x untuk silsilah kecil di A0/A1)
    optimalScale = Math.max(0.35, Math.min(2.2, optimalScale));
    optimalScale = Math.round(optimalScale * 100) / 100;

    setCardScale(optimalScale);

    // 7. Manfaatkan ruang sisa: Regangkan spasi jika asimetris (opsional)
    let hSpread = 1.0;
    let vSpread = 1.0;
    if (shouldSpread) {
      if (maxScaleX > maxScaleY * 1.15) {
        hSpread = Math.min(1.4, Math.round((maxScaleX / optimalScale) * 88) / 100);
      } else if (maxScaleY > maxScaleX * 1.15) {
        vSpread = Math.min(1.35, Math.round((maxScaleY / optimalScale) * 88) / 100);
      }
    }
    setHorizontalSpread(hSpread);
    setVerticalSpread(vSpread);

    // 8. Hitung total lebar dan tinggi pohon keluarga terpasang
    const finalCellW = Math.round(baseW * optimalScale * hSpread);
    const finalCellH = Math.round(baseH * optimalScale * vSpread);
    const totalTreeW = colSpan * finalCellW;
    const totalTreeH = rowSpan * finalCellH;

    // 9. Memanfaatkan ruang kosong atas / bawah / samping kanan kiri:
    // Pusatkan seluruh pohon silsilah di tengah kertas
    const emptySpaceX = paperW - totalTreeW;
    const emptySpaceY = (paperH - topKopMargin - bottomMargin) - totalTreeH;

    const newStartX = Math.max(sideMargin, Math.round(emptySpaceX / 2 - minC * finalCellW));
    const newStartY = Math.max(topKopMargin, Math.round(topKopMargin + emptySpaceY / 2 - minR * finalCellH));

    setGridStartX(newStartX);
    setGridStartY(newStartY);

    // 10. Sesuaikan pan & zoom tampilan layar monitor/layar HP agar lembar kertas terlihat utuh
    const containerW = svgRef.current ? svgRef.current.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
    const containerH = svgRef.current ? svgRef.current.clientHeight : (typeof window !== 'undefined' ? window.innerHeight - 140 : 800);

    const fitZoom = Math.min(containerW / paperW, containerH / paperH) * 0.92;
    const fitPanX = Math.round((containerW - paperW * fitZoom) / 2);
    const fitPanY = Math.round((containerH - paperH * fitZoom) / 2);

    setZoom(Math.max(0.12, Math.round(fitZoom * 100) / 100));
    setPan({ x: fitPanX, y: fitPanY });

    showNotification(
      `✨ Pas Kertas ${chosenPaper} (${chosenOrientation.toUpperCase()}): Skala Kartu ${Math.round(optimalScale * 100)}%, Semua Nama Masuk & Terpusat!`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgRef.current);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LeluhurQu-GridCanvas-${paperSize}-${orientation}-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Bagan SVG Vektor berhasil diunduh');
  };

  const handleDownloadPNG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobURL = URLObj.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const targetW = paperSize === 'autofit' ? paperBounds.width : paperBounds.width;
      const targetH = paperSize === 'autofit' ? paperBounds.height : paperBounds.height;
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0b1120';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(image, 0, 0, targetW, targetH);
        const pngURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngURL;
        link.download = `LeluhurQu-Bagan-${paperSize}-${orientation}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification(`Foto Bagan HD (${paperSize}) berhasil diunduh!`);
      }
      URLObj.revokeObjectURL(blobURL);
    };
    image.onerror = () => {
      URLObj.revokeObjectURL(blobURL);
      showNotification('Gagal membuat gambar PNG, silakan gunakan unduh SVG atau Cetak PDF.');
    };
    image.src = blobURL;
  };

  // Generate Connector Path
  const renderConnector = (parent: GridNode, child: GridNode) => {
    // Dynamic Real-time coordinates during drag
    const pPos =
      parent.id === draggingNodeId && dragCurrentPos
        ? dragCurrentPos
        : getNodePosition(parent.row, parent.col);
    const cPos =
      child.id === draggingNodeId && dragCurrentPos
        ? dragCurrentPos
        : getNodePosition(child.row, child.col);

    const pCenterX = pPos.x + dynamicCellWidth / 2;
    const cCenterX = cPos.x + dynamicCellWidth / 2;

    // Hitung posisi jangkar garis presisi mengikuti batas tepi kartu yang membesar/mengecil
    let pBottomOffset = (baseDimensions.cardH / 2) * cardScale;
    let cTopOffset = (baseDimensions.cardH / 2) * cardScale;

    if (nodeShape === 'circle') {
      const r = (displaySkin === 'simple' ? 44 : 56) * cardScale;
      pBottomOffset = r;
      cTopOffset = r;
    } else if (nodeShape === 'hexagon') {
      const r = (displaySkin === 'simple' ? 48 : 60) * cardScale;
      pBottomOffset = r;
      cTopOffset = r;
    }

    const pBottomY = pPos.y + dynamicCellHeight / 2 + pBottomOffset;
    const cTopY = cPos.y + dynamicCellHeight / 2 - cTopOffset;

    const isClaimedPath =
      highlightClaimedLineage &&
      claimedLineagePathIds.has(parent.id) &&
      claimedLineagePathIds.has(child.id);

    const strokeColor = isClaimedPath ? '#f59e0b' : '#334155';
    const strokeWidth = isClaimedPath
      ? String(Math.max(2.2, 3.5 * Math.min(1.4, cardScale)))
      : String(Math.max(1.5, 2 * Math.min(1.4, cardScale)));

    if (connectorType === 'linear') {
      return (
        <g key={`conn-${parent.id}-${child.id}`} className="transition-all duration-150">
          <line
            x1={pCenterX}
            y1={pBottomY}
            x2={cCenterX}
            y2={cTopY}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <circle cx={cCenterX} cy={cTopY} r={isClaimedPath ? String(Math.max(3, 5 * cardScale)) : String(Math.max(2, 3.5 * cardScale))} fill={strokeColor} />
        </g>
      );
    }

    if (connectorType === 'bezier') {
      const midY = (pBottomY + cTopY) / 2;
      const pathD = `M ${pCenterX} ${pBottomY} C ${pCenterX} ${midY}, ${cCenterX} ${midY}, ${cCenterX} ${cTopY}`;

      return (
        <g key={`conn-${parent.id}-${child.id}`} className="transition-all duration-150">
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <circle cx={cCenterX} cy={cTopY} r={isClaimedPath ? String(Math.max(3, 5 * cardScale)) : String(Math.max(2, 3.5 * cardScale))} fill={strokeColor} />
        </g>
      );
    }

    // Default Orthogonal (COLLISION-FREE CORRIDOR ROUTING)
    let pathD = '';
    if (child.row === parent.row + 1) {
      // Standard consecutive generation: Corridor between rows is 100% collision-free
      const midY = (pBottomY + cTopY) / 2;
      pathD = `M ${pCenterX} ${pBottomY} L ${pCenterX} ${midY} L ${cCenterX} ${midY} L ${cCenterX} ${cTopY}`;
    } else if (child.row > parent.row + 1) {
      // Non-adjacent / skipped generation: Route along safe inter-row corridor and vertical gutters
      const gapExitY = pPos.y + dynamicCellHeight - Math.max(3, 6 * cardScale);
      const gapEnterY = cPos.y + Math.max(3, 6 * cardScale);
      const hasIntervening = nodes.some(
        (n) =>
          n.id !== parent.id &&
          n.id !== child.id &&
          n.col === child.col &&
          n.row > parent.row &&
          n.row < child.row
      );

      if (!hasIntervening) {
        pathD = `M ${pCenterX} ${pBottomY} L ${pCenterX} ${gapExitY} L ${cCenterX} ${gapExitY} L ${cCenterX} ${cTopY}`;
      } else {
        const gutterCol = Math.max(parent.col, child.col) + 1;
        const gutterX = gridStartX + gutterCol * dynamicCellWidth - Math.max(6, 12 * cardScale);
        pathD = `M ${pCenterX} ${pBottomY} L ${pCenterX} ${gapExitY} L ${gutterX} ${gapExitY} L ${gutterX} ${gapEnterY} L ${cCenterX} ${gapEnterY} L ${cCenterX} ${cTopY}`;
      }
    } else {
      // Same row or higher row: loop around card boundary cleanly
      const sideX = Math.max(pCenterX, cCenterX) + dynamicCellWidth / 2 + Math.max(6, 12 * cardScale);
      pathD = `M ${pCenterX} ${pBottomY} L ${pCenterX} ${pBottomY + 16 * cardScale} L ${sideX} ${pBottomY + 16 * cardScale} L ${sideX} ${cTopY - 16 * cardScale} L ${cCenterX} ${cTopY - 16 * cardScale} L ${cCenterX} ${cTopY}`;
    }

    return (
      <g key={`conn-${parent.id}-${child.id}`} className="transition-all duration-150">
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={cCenterX} cy={cTopY} r={isClaimedPath ? String(Math.max(3, 5 * cardScale)) : String(Math.max(2, 3.5 * cardScale))} fill={strokeColor} />
      </g>
    );
  };

  // =========================================================================
  // RENDER NODE: HANYA TAMPIL FOTO + NAMA + TAHUN + DOMISILI + GELAR BAPAK/IBU
  // =========================================================================
  // =========================================================================
  // RENDER NODE: HANYA TAMPIL FOTO + NAMA + TAHUN + DOMISILI + GELAR BAPAK/IBU
  // (SCALABLE: membesar/mengecil mengikuti cardScale dan diposisikan di tengah cell)
  // =========================================================================
  const renderNodeShape = (node: GridNode, isDragging: boolean) => {
    const isSelected = selectedNodeId === node.id;
    const isClaimed = claimedNodeId === node.id;
    const colorScheme = COLOR_MAP[node.color || 'emerald'] || COLOR_MAP.emerald;

    const honorificDisplay = node.honorific || (node.gender === 'P' ? 'Ibu' : 'Bapak');
    const isFemale = node.gender === 'P';

    // -----------------------------------------------------------------------
    // SKIN 1: SIMPLE (HANYA MUNCUL NAMA SAJA TANPA ATRIBUT LAIN)
    // -----------------------------------------------------------------------
    if (displaySkin === 'simple') {
      if (nodeShape === 'circle') {
        const r = 42;
        const cx = 0;
        const cy = 0;
        return (
          <g
            className="cursor-pointer select-none"
            transform={`translate(${dynamicCellWidth / 2}, ${dynamicCellHeight / 2}) scale(${cardScale})`}
          >
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="#ffffff"
              stroke={isClaimed ? '#f59e0b' : isSelected ? '#047857' : colorScheme.border}
              strokeWidth={isClaimed ? '3' : isSelected ? '2.5' : '1.8'}
              className="filter drop-shadow-sm hover:drop-shadow-md transition"
            />
            {/* Dot-Notation chip */}
            <rect
              x={cx - 20}
              y={cy - r - 8}
              width="40"
              height="16"
              rx="8"
              fill={isClaimed ? '#d97706' : colorScheme.header}
            />
            <text
              x={cx}
              y={cy - r + 3.5}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {node.dotNotation}
            </text>
            {/* HANYA MUNCUL NAMA SAJA */}
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fill="#0f172a"
              fontSize="11.5"
              fontWeight="bold"
            >
              {node.name.length > 17 ? `${node.name.slice(0, 15)}..` : node.name}
            </text>
            {isClaimed && (
              <text x={cx} y={cy + 19} textAnchor="middle" fill="#f59e0b" fontSize="8.5" fontWeight="bold">
                ★ Akun Saya
              </text>
            )}
          </g>
        );
      }

      if (nodeShape === 'hexagon') {
        const cx = 0;
        const cy = 0;
        const r = 48;
        const points = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return (
          <g
            className="cursor-pointer select-none"
            transform={`translate(${dynamicCellWidth / 2}, ${dynamicCellHeight / 2}) scale(${cardScale})`}
          >
            <polygon
              points={points.join(' ')}
              fill="#ffffff"
              stroke={isClaimed ? '#f59e0b' : isSelected ? '#047857' : colorScheme.border}
              strokeWidth={isClaimed ? '3' : isSelected ? '2.5' : '1.8'}
              className="filter drop-shadow-sm hover:drop-shadow-md transition"
            />
            <rect
              x={cx - 20}
              y={cy - r + 4}
              width="40"
              height="15"
              rx="7.5"
              fill={isClaimed ? '#d97706' : colorScheme.header}
            />
            <text
              x={cx}
              y={cy - r + 15}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {node.dotNotation}
            </text>
            {/* HANYA MUNCUL NAMA SAJA */}
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              fill="#0f172a"
              fontSize="11.5"
              fontWeight="bold"
            >
              {node.name.length > 17 ? `${node.name.slice(0, 15)}..` : node.name}
            </text>
            {isClaimed && (
              <text x={cx} y={cy + 20} textAnchor="middle" fill="#f59e0b" fontSize="8.5" fontWeight="bold">
                ★ Akun Saya
              </text>
            )}
          </g>
        );
      }

      // Default Kotak Card: Skin Simple (Hanya Nama Saja)
      const cardW = 186;
      const cardH = 54;
      const cardX = -cardW / 2;
      const cardY = -cardH / 2;

      return (
        <g
          className="cursor-pointer select-none"
          transform={`translate(${dynamicCellWidth / 2}, ${dynamicCellHeight / 2}) scale(${cardScale})`}
        >
          <rect
            x={cardX}
            y={cardY}
            width={cardW}
            height={cardH}
            rx="10"
            fill="#ffffff"
            stroke={isClaimed ? '#f59e0b' : isSelected ? '#047857' : colorScheme.border}
            strokeWidth={isClaimed ? '2.5' : isSelected ? '2' : '1.5'}
            className="filter drop-shadow-sm hover:drop-shadow-md transition"
          />
          {/* Left colored vertical accent strip */}
          <path
            d={`M ${cardX} ${cardY + 10} A 10 10 0 0 1 ${cardX + 10} ${cardY} L ${cardX + 10} ${cardY + cardH} L ${cardX} ${cardY + cardH - 10} Z`}
            fill={isClaimed ? '#f59e0b' : colorScheme.header}
          />
          {/* Dot Notation chip */}
          <rect
            x={cardX + 14}
            y={cardY + 6}
            width="38"
            height="14"
            rx="7"
            fill={isClaimed ? '#fef3c7' : colorScheme.bg}
          />
          <text
            x={cardX + 33}
            y={cardY + 16.5}
            textAnchor="middle"
            fill={isClaimed ? '#b45309' : colorScheme.text}
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {node.dotNotation}
          </text>
          {isClaimed && (
            <text
              x={cardX + cardW - 14}
              y={cardY + 16}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="11"
            >
              ★
            </text>
          )}
          {/* HANYA MUNCUL NAMA SAJA (Tegas, bold, di tengah) */}
          <text
            x={cardX + cardW / 2}
            y={cardY + 36}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="12.5"
            fontWeight="bold"
          >
            {node.name.length > 20 ? `${node.name.slice(0, 18)}..` : node.name}
          </text>
        </g>
      );
    }

    // -----------------------------------------------------------------------
    // SKIN 2: KAPSUL (PILL COMPACT)
    // -----------------------------------------------------------------------
    if (displaySkin === 'pill') {
      const pillW = 186;
      const pillH = 38;
      const pillX = -pillW / 2;
      const pillY = -pillH / 2;

      return (
        <g
          className="cursor-pointer select-none"
          transform={`translate(${dynamicCellWidth / 2}, ${dynamicCellHeight / 2}) scale(${cardScale})`}
        >
          <rect
            x={pillX}
            y={pillY}
            width={pillW}
            height={pillH}
            rx="19"
            fill="#ffffff"
            stroke={isClaimed ? '#f59e0b' : isSelected ? '#047857' : colorScheme.border}
            strokeWidth={isClaimed ? '2.5' : isSelected ? '2' : '1.5'}
            className="filter drop-shadow-sm hover:drop-shadow-md transition"
          />
          <rect
            x={pillX + 5}
            y={pillY + 5}
            width="36"
            height="28"
            rx="14"
            fill={isClaimed ? '#f59e0b' : colorScheme.header}
          />
          <text
            x={pillX + 23}
            y={pillY + 22}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {node.dotNotation}
          </text>
          {/* Hanya Nama */}
          <text
            x={pillX + 48}
            y={pillY + 23}
            fill="#0f172a"
            fontSize="11"
            fontWeight="bold"
          >
            {node.name.length > 17 ? `${node.name.slice(0, 15)}..` : node.name}
          </text>
          {isClaimed && (
            <text x={pillX + pillW - 14} y={pillY + 23} textAnchor="middle" fill="#f59e0b" fontSize="11">
              ★
            </text>
          )}
        </g>
      );
    }

    // -----------------------------------------------------------------------
    // SKIN 3: DETAILED (LENGKAP 5 ATRIBUT)
    // -----------------------------------------------------------------------
    if (nodeShape === 'circle') {
      // 1. LINGKARAN (ORBIT STYLE)
      const radius = 54;
      const cx = 0;
      const cy = 0;

      return (
        <g
          className="cursor-pointer select-none"
          transform={`translate(${dynamicCellWidth / 2}, ${dynamicCellHeight / 2}) scale(${cardScale})`}
        >
          {/* Outer Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 8}
            fill="none"
            stroke={isClaimed ? '#f59e0b' : colorScheme.ring}
            strokeWidth={isClaimed ? '2.5' : '1.5'}
            strokeDasharray={isClaimed ? 'none' : '4 3'}
            className={isClaimed ? 'animate-pulse' : ''}
          />

          {/* Main Circle Body */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="#ffffff"
            stroke={isClaimed ? '#f59e0b' : isSelected ? '#047857' : colorScheme.border}
            strokeWidth={isClaimed || isSelected ? '3' : '2'}
            className="filter drop-shadow-md"
          />

          {/* Top Pill: Dot-Notation + Gelar */}
          <rect
            x={cx - 48}
            y={cy - radius - 10}
            width="96"
            height="18"
            rx="9"
            fill={isClaimed ? '#d97706' : colorScheme.header}
          />
          <text
            x={cx}
            y={cy - radius + 3}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {node.dotNotation} • {honorificDisplay}
          </text>

          {/* Foto Avatar Thumbnail */}
          {node.photo ? (
            <clipPath id={`clip-circle-${node.id}`}>
              <circle cx={cx} cy={cy - 12} r="18" />
            </clipPath>
          ) : null}

          {node.photo ? (
            <image
              href={node.photo}
              x={cx - 18}
              y={cy - 30}
              width="36"
              height="36"
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#clip-circle-${node.id})`}
            />
          ) : (
            <circle
              cx={cx}
              cy={cy - 12}
              r="18"
              fill={isFemale ? '#fdf2f8' : '#eff6ff'}
              stroke={isFemale ? '#f43f5e' : '#3b82f6'}
              strokeWidth="1.5"
            />
          )}

          {!node.photo && (
            <text
              x={cx}
              y={cy - 7}
              textAnchor="middle"
              fill={isFemale ? '#e11d48' : '#1d4ed8'}
              fontSize="12"
              fontWeight="bold"
            >
              {node.name.charAt(0)}
            </text>
          )}

          {/* Nama Lengkap */}
          <text
            x={cx}
            y={cy + 15}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="10"
            fontWeight="bold"
          >
            {node.name.length > 17 ? `${node.name.slice(0, 15)}..` : node.name}
          </text>

          {/* Tahun Lahir - Wafat */}
          <text
            x={cx}
            y={cy + 27}
            textAnchor="middle"
            fill="#64748b"
            fontSize="8"
            fontWeight="medium"
          >
            {node.birthDeath || 'Tahun Lahir'}
          </text>

          {/* Alamat Kota / Domisili */}
          <text
            x={cx}
            y={cy + 38}
            textAnchor="middle"
            fill="#059669"
            fontSize="7.5"
            fontWeight="semibold"
          >
            📍 {node.domicile ? (node.domicile.length > 18 ? `${node.domicile.slice(0, 16)}..` : node.domicile) : 'Domisili'}
          </text>

          {/* Claimed Account Star Indicator */}
          {isClaimed && (
            <g transform={`translate(${cx + radius - 14}, ${cy - radius + 8})`}>
              <circle cx="6" cy="6" r="9" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <text x="6" y="9.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                ★
              </text>
            </g>
          )}
        </g>
      );
    }

    if (nodeShape === 'hexagon') {
      // 2. SEGI ENAM (HEXAGON / MOLECULE STYLE)
      const cx = 0;
      const cy = 0;
      const r = 58;
      const points = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }

      return (
        <g
          className="cursor-pointer select-none"
          transform={`translate(${dynamicCellWidth / 2}, ${dynamicCellHeight / 2}) scale(${cardScale})`}
        >
          <polygon
            points={points.join(' ')}
            fill="#ffffff"
            stroke={isClaimed ? '#f59e0b' : isSelected ? '#047857' : colorScheme.border}
            strokeWidth={isClaimed || isSelected ? '3' : '2'}
            className="filter drop-shadow-md"
          />

          {/* Top Banner Header: Dot Notation + Gelar */}
          <rect
            x={cx - 45}
            y={cy - r + 4}
            width="90"
            height="17"
            rx="8.5"
            fill={isClaimed ? '#d97706' : colorScheme.header}
          />
          <text
            x={cx}
            y={cy - r + 16}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {node.dotNotation} • {honorificDisplay}
          </text>

          {/* Foto Avatar Thumbnail */}
          {node.photo ? (
            <clipPath id={`clip-hex-${node.id}`}>
              <circle cx={cx} cy={cy - 12} r="16" />
            </clipPath>
          ) : null}

          {node.photo ? (
            <image
              href={node.photo}
              x={cx - 16}
              y={cy - 28}
              width="32"
              height="32"
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#clip-hex-${node.id})`}
            />
          ) : (
            <circle
              cx={cx}
              cy={cy - 12}
              r="16"
              fill={isFemale ? '#fdf2f8' : '#eff6ff'}
              stroke={isFemale ? '#f43f5e' : '#3b82f6'}
              strokeWidth="1.5"
            />
          )}

          {!node.photo && (
            <text
              x={cx}
              y={cy - 7}
              textAnchor="middle"
              fill={isFemale ? '#e11d48' : '#1d4ed8'}
              fontSize="11"
              fontWeight="bold"
            >
              {node.name.charAt(0)}
            </text>
          )}

          {/* Nama Lengkap */}
          <text
            x={cx}
            y={cy + 13}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="10"
            fontWeight="bold"
          >
            {node.name.length > 17 ? `${node.name.slice(0, 15)}..` : node.name}
          </text>

          {/* Tahun Lahir - Wafat */}
          <text
            x={cx}
            y={cy + 25}
            textAnchor="middle"
            fill="#64748b"
            fontSize="8"
          >
            {node.birthDeath || 'Tahun Lahir'}
          </text>

          {/* Alamat Kota / Domisili */}
          <text
            x={cx}
            y={cy + 36}
            textAnchor="middle"
            fill="#059669"
            fontSize="7.5"
            fontWeight="semibold"
          >
            📍 {node.domicile ? (node.domicile.length > 18 ? `${node.domicile.slice(0, 16)}..` : node.domicile) : 'Domisili'}
          </text>
        </g>
      );
    }

    // 3. DEFAULT: KOTAK ROUNDED (CARD STYLE) - PRESISI 5 ELEMEN
    const cardWidth = 196;
    const cardHeight = 118;
    const cardX = -cardWidth / 2;
    const cardY = -cardHeight / 2;

    return (
      <g
        className="cursor-pointer select-none"
        transform={`translate(${dynamicCellWidth / 2}, ${dynamicCellHeight / 2}) scale(${cardScale})`}
      >
        {/* Main Card Box */}
        <rect
          x={cardX}
          y={cardY}
          width={cardWidth}
          height={cardHeight}
          rx="12"
          fill="#ffffff"
          stroke={isClaimed ? '#f59e0b' : isSelected ? '#047857' : colorScheme.border}
          strokeWidth={isClaimed ? '3' : isSelected ? '2.5' : '1.5'}
          className="filter drop-shadow-md"
        />

        {/* Header Ribbon */}
        <path
          d={`M ${cardX} ${cardY + 12} A 12 12 0 0 1 ${cardX + 12} ${cardY} L ${cardX + cardWidth - 12} ${cardY} A 12 12 0 0 1 ${cardX + cardWidth} ${cardY + 12} L ${cardX + cardWidth} ${cardY + 26} L ${cardX} ${cardY + 26} Z`}
          fill={isClaimed ? '#d97706' : colorScheme.header}
        />

        {/* Dot-Notation & Gelar Bapak/Ibu di Header */}
        <text
          x={cardX + 8}
          y={cardY + 17}
          fill="#ffffff"
          fontSize="10"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {node.dotNotation}
        </text>

        <rect
          x={cardX + cardWidth - 68}
          y={cardY + 4}
          width="60"
          height="18"
          rx="9"
          fill="#ffffff"
          fillOpacity="0.25"
        />
        <text
          x={cardX + cardWidth - 38}
          y={cardY + 16}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="9"
          fontWeight="bold"
        >
          {honorificDisplay}
        </text>

        {/* 1. FOTO PROFIL (AVATAR ATAU BASE64 FOTO) */}
        {node.photo ? (
          <clipPath id={`clip-card-${node.id}`}>
            <rect x={cardX + 8} y={cardY + 34} width="46" height="46" rx="8" />
          </clipPath>
        ) : null}

        {node.photo ? (
          <image
            href={node.photo}
            x={cardX + 8}
            y={cardY + 34}
            width="46"
            height="46"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#clip-card-${node.id})`}
          />
        ) : (
          <rect
            x={cardX + 8}
            y={cardY + 34}
            width="46"
            height="46"
            rx="8"
            fill={isFemale ? '#fff1f2' : '#eff6ff'}
            stroke={isFemale ? '#f43f5e' : '#3b82f6'}
            strokeWidth="1.2"
          />
        )}

        {!node.photo && (
          <text
            x={cardX + 31}
            y={cardY + 63}
            textAnchor="middle"
            fill={isFemale ? '#e11d48' : '#1d4ed8'}
            fontSize="18"
            fontWeight="bold"
          >
            {node.name.charAt(0)}
          </text>
        )}

        {/* 2. NAMA LENGKAP */}
        <text
          x={cardX + 60}
          y={cardY + 48}
          fill="#0f172a"
          fontSize="11"
          fontWeight="bold"
        >
          {node.name.length > 18 ? `${node.name.slice(0, 16)}..` : node.name}
        </text>

        {/* 3. TAHUN LAHIR - WAFAT */}
        <text
          x={cardX + 60}
          y={cardY + 63}
          fill="#475569"
          fontSize="9"
          fontWeight="medium"
        >
          📅 {node.birthDeath || 'Tahun Lahir - Wafat'}
        </text>

        {/* 4. ALAMAT KOTA / DOMISILI */}
        <text
          x={cardX + 60}
          y={cardY + 77}
          fill="#047857"
          fontSize="8.5"
          fontWeight="semibold"
        >
          📍 {node.domicile ? (node.domicile.length > 18 ? `${node.domicile.slice(0, 16)}..` : node.domicile) : 'Kota Domisili'}
        </text>

        {/* 4b. MULTI-ISTRI / IBU KANDUNG TAG */}
        {node.gender === 'L' && node.spouses && node.spouses.length > 1 ? (
          <text
            x={cardX + 60}
            y={cardY + 89}
            fill="#e11d48"
            fontSize="8"
            fontWeight="bold"
          >
            💍 Multi-Istri ({node.spouses.length})
          </text>
        ) : node.motherName ? (
          <text
            x={cardX + 60}
            y={cardY + 89}
            fill="#7c3aed"
            fontSize="8"
            fontWeight="bold"
          >
            🌸 Ibu: {node.motherName.length > 16 ? `${node.motherName.slice(0, 14)}..` : node.motherName}
          </text>
        ) : node.gender === 'P' && node.spouseOrder ? (
          <text
            x={cardX + 60}
            y={cardY + 89}
            fill="#e11d48"
            fontSize="8"
            fontWeight="bold"
          >
            💍 Istri Ke-{node.spouseOrder}
          </text>
        ) : null}

        {/* 5. CLAIM BADGE ATAU GRID POS */}
        {isClaimed ? (
          <g transform={`translate(${cardX + 8}, ${cardY + cardHeight - 24})`}>
            <rect width="180" height="18" rx="6" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
            <text x="90" y="12" textAnchor="middle" fill="#b45309" fontSize="8.5" fontWeight="bold">
              ⭐ AKUN SAYA: {claimedUserName}
            </text>
          </g>
        ) : (
          <g transform={`translate(${cardX + 8}, ${cardY + cardHeight - 16})`}>
            <text fill="#94a3b8" fontSize="8" fontWeight="medium">
              {node.spouses && node.spouses.length > 1 ? `💍 ${node.spouses.length} Istri • ` : ''}Koordinat: R{node.row + 1}:C{node.col + 1}
            </text>
          </g>
        )}
      </g>
    );
  };

  // Canvas bounds based on paper selection
  const paperBounds = useMemo(() => {
    if (paperSize === 'autofit') {
      const w = Math.max((maxCol + 2) * dynamicCellWidth + gridStartX * 2, 1700);
      const h = Math.max((maxRow + 2) * dynamicCellHeight + gridStartY * 2, 1100);
      return { width: w, height: h };
    }
    const standard = PAPER_DIMENSIONS[paperSize as Exclude<PaperSize, 'autofit'>];
    if (orientation === 'landscape') {
      return { width: standard.height, height: standard.width };
    }
    return { width: standard.width, height: standard.height };
  }, [paperSize, orientation, maxCol, maxRow, dynamicCellWidth, dynamicCellHeight, gridStartX, gridStartY]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden relative">
      {/* ----------------------------------------------------------------- */}
      {/* TOP HEADER & TOOLBAR */}
      {/* ----------------------------------------------------------------- */}
      <header className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Kembali ke LeluhurQu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                LeluhurQu
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Grid Canvas Engine
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Zero Collision • 5 Atribut Presisi • Klaim Urutan Silsilah Akun
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* TOMBOL SOLUSI AYAH UYUT BARU DITEMUKAN */}
          <button
            onClick={() => {
              // Pre-select current top generation roots as children
              const rootIds = nodes.filter((n) => !n.parentId).map((n) => n.id);
              setAyahUyutForm((prev) => ({
                ...prev,
                childrenIds: rootIds,
              }));
              setShowAyahUyutModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-lg text-xs font-bold shadow-md transition active:scale-95 animate-pulse"
            title="Solusi Ayah Uyut / Leluhur Puncak Baru Ditemukan"
          >
            <Crown className="w-4 h-4 text-amber-200" />
            <span className="hidden xs:inline">Ayah Uyut Ditemukan</span>
          </button>

          {/* Batch Input Fast Button */}
          <button
            onClick={() => {
              setBatchParentId('');
              setShowBatchModal(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition active:scale-95"
            title="Input Massal (Bebas / Default)"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Input Masal</span>
          </button>

          {/* Claim Akun Button */}
          <button
            onClick={() => setShowClaimModal(true)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 border ${
              claimedNodeId
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Klaim Urutan Silsilah Saya by Akun"
          >
            <Star className={`w-4 h-4 ${claimedNodeId ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span className="hidden md:inline">
              {claimedNodeId ? 'Akun Diklaim' : 'Klaim Akun'}
            </span>
          </button>

          {/* Print / PDF Button */}
          <button
            onClick={handlePrint}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1"
            title="Cetak Presisi / Ekspor PDF A0-A4"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden lg:inline">Cetak / PDF</span>
          </button>

          {/* Left Sidebar Toggle */}
          <button
            onClick={() => setShowLeftSidebar((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition ${
              showLeftSidebar
                ? 'bg-emerald-600 border-emerald-500 text-white ring-2 ring-emerald-400/40'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Opsi & Fitur Kanvas (Sidebar Kiri)"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Help Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            title="Petunjuk Penggunaan"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      
      {/* ----------------------------------------------------------------- */}
      {/* CLAIMED ACCOUNT BANNER (IF ACTIVE) */}
      {/* ----------------------------------------------------------------- */}
      {claimedNodeId && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-amber-200 z-10">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>
              <strong>Urutan Silsilah Anda:</strong>{' '}
              {nodes.find((n) => n.id === claimedNodeId)?.honorific}{' '}
              {nodes.find((n) => n.id === claimedNodeId)?.name} (No:{' '}
              <span className="font-mono font-bold text-amber-300">
                {nodes.find((n) => n.id === claimedNodeId)?.dotNotation}
              </span>
              ) • Generasi ke-{(nodes.find((n) => n.id === claimedNodeId)?.row ?? 0) + 1}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHighlightClaimedLineage((prev) => !prev)}
              className="text-[11px] underline hover:text-amber-100"
            >
              {highlightClaimedLineage ? 'Matikan Sorot Jalur' : 'Sorot Jalur Silsilah Saya'}
            </button>
            <button
              onClick={() => setShowClaimModal(true)}
              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold"
            >
              Kelola Klaim
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MAIN INTERACTIVE SVG CANVAS AREA */}
      {/* ----------------------------------------------------------------- */}
      <div
        id="leluhurqu-print-container"
        className="flex-1 relative overflow-hidden bg-radial from-slate-900 via-slate-950 to-black cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => {
          if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg') {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
          }
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 1 && !draggingNodeId) {
            setIsPanning(true);
            const touch = e.touches[0];
            panStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
          }
        }}
        onWheel={(e) => {
          e.preventDefault();
          const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
          setZoom((z) => Math.min(2.5, Math.max(0.25, z * zoomFactor)));
        }}
      >
        {/* FLOATING TOGGLE BUTTON UNTUK HIDDEN SIDEBAR KIRI */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
          <button
            onClick={() => setShowLeftSidebar((prev) => !prev)}
            className={`px-3 py-2 rounded-xl backdrop-blur-md font-bold text-xs flex items-center gap-2 shadow-2xl active:scale-95 transition border ${
              showLeftSidebar
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/40 ring-2 ring-emerald-400/30'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
            title="Buka / Sembunyikan Opsi & Fitur Kanvas (Sidebar Kiri)"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Opsi Kanvas</span>
            <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showLeftSidebar ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* FLOATING COMPACT ZOOM CONTROLS (TOP RIGHT) */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-xl shadow-xl">
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition"
            title="Perkecil Kanvas"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-10 text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition"
            title="Perbesar Kanvas"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleAutoFit}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition"
            title="Reset Posisi (Auto-Fit)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <svg
          ref={svgRef}
          id="leluhurqu-svg-canvas"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS */}
          <defs>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.35" floodColor="#000000" />
            </filter>
            {/* Dynamic Infinite Coordinate Grid Matrix (40px cells) */}
            <pattern id="react-matrix-subgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.75" fill="#334155" opacity="0.4" />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.3" />
            </pattern>
          </defs>

          {/* MAIN TRANSFORM GROUP (PAN & ZOOM) */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Infinite Coordinate Grid Matrix Background */}
            <rect
              x="-4000"
              y="-4000"
              width="16000"
              height="16000"
              fill="url(#react-matrix-subgrid)"
              pointerEvents="none"
            />

            {/* Paper Outline for Print Preview */}
            {paperSize !== 'autofit' && (
              <g id="paper-boundary-group">
                <rect
                  x="0"
                  y="0"
                  width={paperBounds.width}
                  height={paperBounds.height}
                  fill="#ffffff"
                  fillOpacity="0.03"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
                <text
                  x="14"
                  y="24"
                  fill="#38bdf8"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  LEMBAR CETAK {paperSize} ({orientation.toUpperCase()}) •{' '}
                  {PAPER_DIMENSIONS[paperSize as Exclude<PaperSize, 'autofit'>].mmW} ×{' '}
                  {PAPER_DIMENSIONS[paperSize as Exclude<PaperSize, 'autofit'>].mmH} mm • Skala Kartu: {Math.round(cardScale * 100)}%
                </text>
              </g>
            )}

            {/* Spatial Grid Coordinates Guide (Auto-Expanding Infinite Matrix) */}
            {showGridGuide && (
              <g id="spatial-grid-guides" opacity="0.85">
                {Array.from({ length: Math.max(maxRow + 4, 8) }).map((_, r) => {
                  const y = gridStartY + r * dynamicCellHeight + dynamicCellHeight / 2;
                  const totalCols = Math.max(maxCol + 6, 12);
                  return (
                    <g key={`gen-guide-${r}`}>
                      <text
                        x={gridStartX - 16}
                        y={y + 4}
                        textAnchor="end"
                        fill="#64748b"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        GEN {r + 1}
                      </text>
                      <line
                        x1={gridStartX - 10}
                        y1={gridStartY + r * dynamicCellHeight}
                        x2={gridStartX + (totalCols + 1) * dynamicCellWidth}
                        y2={gridStartY + r * dynamicCellHeight}
                        stroke="#1e293b"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                    </g>
                  );
                })}

                {Array.from({ length: Math.max(maxCol + 6, 12) }).map((_, c) => {
                  const x = gridStartX + c * dynamicCellWidth;
                  return (
                    <text
                      key={`col-guide-${c}`}
                      x={x + dynamicCellWidth / 2}
                      y={gridStartY - 14}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      KOL {c + 1}
                    </text>
                  );
                })}
              </g>
            )}

            {/* Drag & Snap Hover Highlight Target Cell */}
            {hoverGridCell && draggingNodeId && (
              <g id="snap-preview-target">
                <rect
                  x={gridStartX + hoverGridCell.col * dynamicCellWidth + 8}
                  y={gridStartY + hoverGridCell.row * dynamicCellHeight + 8}
                  width={dynamicCellWidth - 16}
                  height={dynamicCellHeight - 16}
                  rx="14"
                  fill="#10b981"
                  fillOpacity="0.18"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  className="animate-pulse"
                />
                <text
                  x={gridStartX + hoverGridCell.col * dynamicCellWidth + dynamicCellWidth / 2}
                  y={gridStartY + hoverGridCell.row * dynamicCellHeight + dynamicCellHeight / 2 + 4}
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Snap: R{hoverGridCell.row + 1}:C{hoverGridCell.col + 1}
                </text>
              </g>
            )}

            {/* 1. CONNECTOR LINES LAYER */}
            <g id="connectors-layer">
              {nodes.map((node) => {
                if (!node.parentId) return null;
                const parent = nodes.find((n) => n.id === node.parentId);
                if (!parent) return null;
                return renderConnector(parent, node);
              })}
            </g>

            {/* 2. NODES LAYER */}
            <g id="nodes-layer">
              {nodes.map((node) => {
                const isDragging = draggingNodeId === node.id;
                const pos = isDragging
                  ? dragCurrentPos
                  : getNodePosition(node.row, node.col);

                return (
                  <g
                    key={node.id}
                    id={`node-${node.id}`}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                    onTouchStart={(e) => handleNodeTouchStart(e, node)}
                    opacity={isDragging ? 0.85 : 1}
                    className="cursor-move transition-transform duration-75"
                  >
                    {renderNodeShape(node, isDragging)}
                  </g>
                );
              })}
            </g>

            {/* Canvas Header (for Print Output) */}
            <g id="canvas-print-kop" transform="translate(80, 40)">
              <text
                x="0"
                y="0"
                fill="#f8fafc"
                fontSize="18"
                fontWeight="800"
                letterSpacing="1"
              >
                BAGAN SILSILAH KELUARGA BESAR
              </text>
              <text x="0" y="22" fill="#94a3b8" fontSize="11">
                LeluhurQu Grid Canvas Engine • Zero Collision Matrix • Total: {nodes.length} Anggota
              </text>
            </g>
          </g>
        </svg>

        {/* Floating Quick Stats */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs flex items-center gap-3 shadow-lg z-10 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-200">{nodes.length} Anggota</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono">
            {maxRow + 1} Generasi • {maxCol + 1} Kolom
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-medium">Zero Collision</span>
        </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={() => {
              setBatchParentId('');
              setShowBatchModal(true);
            }}
            className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl flex items-center justify-center transition active:scale-95"
            title="Input Massal"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* HIDDEN LEFT SIDEBAR: SEMUA OPSI, FITUR, DAN SUB-MENU LELUHURQU */}
      {/* ----------------------------------------------------------------- */}
      {showLeftSidebar && (
        <aside className="absolute top-12 left-0 bottom-0 w-80 sm:w-96 bg-slate-900/98 backdrop-blur-xl border-r border-slate-800 p-4 overflow-y-auto z-40 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-left duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Opsi &amp; Fitur Kanvas</h3>
                <p className="text-[11px] text-slate-400">Pengaturan silsilah, tata letak &amp; cetak</p>
              </div>
            </div>
            <button
              onClick={() => setShowLeftSidebar(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Tutup Sidebar Kiri"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: Tata Letak & Urutan */}
          <div className="space-y-2.5 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs uppercase">
              <LayoutGrid className="w-4 h-4 text-emerald-400" />
              <span>Tata Letak &amp; Urutan</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Otomatis susun posisi simpul pohon atau koreksi urutan silsilah berdasarkan tahun lahir.
            </p>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => {
                  handleAutoLayoutTree();
                  showNotification('Pohon dirapikan otomatis bebas bentrok.');
                }}
                className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm active:scale-95 transition border border-emerald-500/40"
                title="Rapikan Otomatis: Susun ulang posisi node dengan kalkulasi lebar sub-tree & auto-centering bebas bentrok"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-200" />
                <span>Rapikan Otomatis (Auto-Layout)</span>
              </button>

              <button
                onClick={handleSortAllTreeByBirthYear}
                className="w-full py-2 px-3 bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition active:scale-95 border border-amber-500/40"
                title="Solusi Salah Urutan: Urutkan otomatis seluruh generasi berdasarkan Tahun Lahir (Tua ke Muda)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-200" />
                <span>⚡ Urut Thn Lahir (Tua ke Muda)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Bentuk Simpul & Garis Penghubung */}
          <div className="space-y-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs uppercase">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <span>Garis &amp; Bentuk Simpul</span>
            </div>

            {/* Garis Konektor */}
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1.5">Model Garis Konektor:</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => {
                    setConnectorType('orthogonal');
                    showNotification('Garis Siku Paralel Aktif');
                  }}
                  className={`py-1 rounded text-xs font-medium transition text-center ${
                    connectorType === 'orthogonal'
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Siku
                </button>
                <button
                  onClick={() => {
                    setConnectorType('bezier');
                    showNotification('Garis Lengkung Bezier Aktif');
                  }}
                  className={`py-1 rounded text-xs font-medium transition text-center ${
                    connectorType === 'bezier'
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bezier
                </button>
                <button
                  onClick={() => {
                    setConnectorType('linear');
                    showNotification('Garis Seri Lurus Aktif');
                  }}
                  className={`py-1 rounded text-xs font-medium transition text-center ${
                    connectorType === 'linear'
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lurus
                </button>
              </div>
            </div>

            {/* Bentuk Node */}
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1.5">Bentuk Simpul (Node):</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setNodeShape('card')}
                  className={`py-1 px-2 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${
                    nodeShape === 'card'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Square className="w-3 h-3" />
                  <span>Kotak</span>
                </button>
                <button
                  onClick={() => setNodeShape('circle')}
                  className={`py-1 px-2 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${
                    nodeShape === 'circle'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Circle className="w-3 h-3" />
                  <span>Bulat</span>
                </button>
                <button
                  onClick={() => setNodeShape('hexagon')}
                  className={`py-1 px-2 rounded text-xs font-medium transition flex items-center justify-center gap-1 ${
                    nodeShape === 'hexagon'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hexagon className="w-3 h-3" />
                  <span>Hexa</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Multi-Skin Tampilan */}
          <div className="space-y-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Multi Skin Tampilan Bagan</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pilih mode tampilan node sesuai kebutuhan pohon silsilah Anda.
            </p>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setDisplaySkin('simple');
                  showNotification('Skin Simple aktif: Hanya muncul Nama Saja');
                }}
                className={`w-full p-2 rounded-lg border text-left transition flex items-center justify-between ${
                  displaySkin === 'simple'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-200 font-bold'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs">✨ Simple (Hanya Nama Saja)</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Paling bersih &amp; ringkas, tanpa foto/gelar/tahun.
                  </div>
                </div>
                {displaySkin === 'simple' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>
              <button
                onClick={() => {
                  setDisplaySkin('pill');
                  showNotification('Skin Kapsul aktif: Format horizontal ramping');
                }}
                className={`w-full p-2 rounded-lg border text-left transition flex items-center justify-between ${
                  displaySkin === 'pill'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs">💊 Kapsul (Pill Ramping)</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Nama format kapsul horizontal minimalis.
                  </div>
                </div>
                {displaySkin === 'pill' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={() => {
                  setDisplaySkin('detailed');
                  showNotification('Skin Lengkap aktif: 5 Atribut Presisi');
                }}
                className={`w-full p-2 rounded-lg border text-left transition flex items-center justify-between ${
                  displaySkin === 'detailed'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 font-bold'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs">📇 Lengkap (5 Atribut Presisi)</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    Foto, Nama, Tahun, Domisili, &amp; Gelar Bapak/Ibu.
                  </div>
                </div>
                {displaySkin === 'detailed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Section 4: Ukuran Kertas & Auto-Max */}
          <div className="space-y-3 p-3 bg-gradient-to-br from-slate-900 to-cyan-950/40 rounded-xl border border-cyan-500/40">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs uppercase">
              <Maximize2 className="w-4 h-4 text-cyan-400" />
              <span>Ukuran Kertas &amp; Auto-Max</span>
            </div>
            <p className="text-[11px] text-cyan-100/80 leading-relaxed">
              Otomatis maksimalkan tampilan, seimbangkan ruang kosong (atas, bawah, samping kiri-kanan), dan pastikan seluruh nama masuk tanpa terpotong.
            </p>

            {/* Pilihan Kertas & Orientasi */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Ukuran Kertas:</label>
                <select
                  value={paperSize}
                  onChange={(e) => {
                    const newSize = e.target.value as PaperSize;
                    setPaperSize(newSize);
                    if (newSize !== 'autofit') {
                      handleAutoMaximizeToPaper(newSize, orientation);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:border-cyan-500 font-medium"
                >
                  <option value="autofit">Auto-Fit Bebas</option>
                  <option value="A0">A0 (Poster Raksasa)</option>
                  <option value="A1">A1 (Poster Besar)</option>
                  <option value="A2">A2 (Sedang)</option>
                  <option value="A3">A3 (Tabloid)</option>
                  <option value="A4">A4 (Standar)</option>
                  <option value="F4">F4 (Folio 215×330 mm)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-medium block mb-1">Orientasi Kertas:</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOrientation('landscape');
                      handleAutoMaximizeToPaper(paperSize, 'landscape');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                      orientation === 'landscape'
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    ↔ L
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrientation('portrait');
                      handleAutoMaximizeToPaper(paperSize, 'portrait');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                      orientation === 'portrait'
                        ? 'bg-cyan-600 border-cyan-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    ↕ P
                  </button>
                </div>
              </div>
            </div>

            {/* Slider Skala Kartu */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Ukuran Kartu:</span>
                <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  {Math.round(cardScale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCardScaleStep('down')}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm border border-slate-700 active:scale-95"
                  title="Kecilkan Kartu"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.35"
                  max="2.2"
                  step="0.05"
                  value={cardScale}
                  onChange={(e) => setCardScale(parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => handleCardScaleStep('up')}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm border border-slate-700 active:scale-95"
                  title="Besarkan Kartu"
                >
                  +
                </button>
              </div>
            </div>

            {/* Opsi Pemanfaatan Ruang Kosong */}
            <div className="space-y-2 pt-1 border-t border-cyan-900/50">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={balanceMargins}
                  onChange={(e) => {
                    setBalanceMargins(e.target.checked);
                    showNotification(e.target.checked ? 'Margin seimbang (Auto-Center) aktif' : 'Margin manual');
                  }}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
                <span>Seimbangkan margin atas, bawah, kiri &amp; kanan</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={stretchGaps}
                  onChange={(e) => {
                    setStretchGaps(e.target.checked);
                    showNotification(e.target.checked ? 'Peregangan ruang kosong aktif' : 'Jarak standar aktif');
                  }}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                />
                <span>Regangkan jarak antar kartu jika kertas longgar</span>
              </label>
            </div>

            {/* Tombol Eksekusi Auto-Max Pas Kertas */}
            <button
              type="button"
              onClick={() => handleAutoMaximizeToPaper(paperSize === 'autofit' ? 'A4' : paperSize, orientation)}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 border border-cyan-400/40"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-200" />
              <span>⚡ Pas Kertas ({paperSize})</span>
            </button>
          </div>

          {/* Section 5: Fitur Khusus Silsilah Puncak & Akun */}
          <div className="space-y-2 p-3 bg-amber-950/30 rounded-xl border border-amber-600/40">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Solusi Ayah Uyut Puncak</span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Jika leluhur puncak yang lebih tua ditemukan di atas generasi saat ini, sisipkan langsung di sini tanpa merusak posisi anak-cucunya.
            </p>
            <button
              onClick={() => {
                const rootIds = nodes.filter((n) => !n.parentId).map((n) => n.id);
                setAyahUyutForm((prev) => ({
                  ...prev,
                  childrenIds: rootIds,
                }));
                setShowAyahUyutModal(true);
                setShowLeftSidebar(false);
              }}
              className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Sisipkan Ayah Uyut di Puncak</span>
            </button>
          </div>

          {/* Section 6: Klaim Akun & Input Massal */}
          <div className="space-y-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs uppercase">
              <Star className="w-4 h-4 text-amber-400" />
              <span>Klaim Akun &amp; Input Masal</span>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowClaimModal(true);
                  setShowLeftSidebar(false);
                }}
                className="w-full py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{claimedNodeId ? 'Kelola / Ganti Klaim Akun' : 'Klaim Posisi Akun Saya'}</span>
              </button>
              <button
                onClick={() => {
                  setBatchParentId('');
                  setShowBatchModal(true);
                  setShowLeftSidebar(false);
                }}
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Input Massal (Bebas / Default)</span>
              </button>
            </div>
          </div>

          {/* Section 7: Cetak Presisi & Ekspor */}
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Cetak Presisi &amp; Ekspor Gambar
            </label>
            <button
              onClick={handlePrint}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Ekspor PDF A0 - A4 / F4</span>
            </button>
            <button
              onClick={handleDownloadPNG}
              className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow transition"
              title="Unduh gambar PNG jernih siap cetak atau share WA"
            >
              <FileImage className="w-4 h-4" />
              <span>Unduh Gambar PNG Resolusi Tinggi</span>
            </button>
            <button
              onClick={handleDownloadSVG}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File SVG Vektor</span>
            </button>
            <a
              href="/leluhurqu-grid-canvas.html"
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 bg-slate-950 hover:bg-black border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buka PWA Single-File Mandiri</span>
            </a>
          </div>

          {/* Section 8: Hitung Ulang Penomoran */}
          <div className="space-y-2 border-t border-slate-800 pt-3 mt-auto">
            <button
              onClick={() => {
                const renumbered = recomputeDotNotation(nodes);
                setNodes(renumbered);
                showNotification('Penomoran hierarkis dot-notation dihitung ulang');
              }}
              className="w-full py-2 px-3 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-600/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Hitung Ulang Penomoran Dot-Notation</span>
            </button>
          </div>
        </aside>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* INSPECTOR PANEL / MODAL UNTUK NODE TERPILIH */}
      {/* ----------------------------------------------------------------- */}
      {selectedNode && !draggingNodeId && (
        <div className="absolute top-28 left-4 max-w-xs sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl z-30 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-extrabold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                {selectedNode.dotNotation}
              </span>
              <h4 className="font-bold text-white text-sm truncate max-w-[140px]">
                {selectedNode.honorific} {selectedNode.name}
              </h4>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Foto preview */}
          {selectedNode.photo && (
            <div className="mb-2.5 flex justify-center">
              <img
                src={selectedNode.photo}
                alt={selectedNode.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow"
              />
            </div>
          )}

          <div className="space-y-1.5 text-xs text-slate-300 mb-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Gelar:</span>
              <span className="font-semibold text-emerald-400">{selectedNode.honorific || 'Bapak/Ibu'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tahun:</span>
              <span className="font-medium text-slate-200">{selectedNode.birthDeath || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Domisili:</span>
              <span className="font-medium text-slate-200">{selectedNode.domicile || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Posisi:</span>
              <span className="font-mono text-slate-400">
                Gen {selectedNode.row + 1}, Kol {selectedNode.col + 1}
              </span>
            </div>
            {selectedNode.claimedBy && (
              <div className="p-1.5 bg-amber-950/40 rounded-lg border border-amber-500/30 text-amber-300 text-[11px] font-bold text-center">
                ⭐ Diklaim oleh: {selectedNode.claimedBy}
              </div>
            )}

            {/* Tampilan Multi-Istri jika Suami beristri lebih dari 1 */}
            {selectedNode.spouses && selectedNode.spouses.length > 0 && (
              <div className="bg-rose-950/40 p-2 rounded-xl border border-rose-800/40 space-y-1">
                <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                  <span>💍 Daftar Istri ({selectedNode.spouses.length}):</span>
                </div>
                {selectedNode.spouses.map((sp, i) => (
                  <div key={i} className="text-[10px] text-rose-200 bg-slate-950/60 px-2 py-0.5 rounded border border-rose-900/30 flex justify-between">
                    <span>[{sp.order || i + 1}] {sp.name}</span>
                    {sp.note && <span className="text-slate-400">({sp.note})</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Tampilan Ibu Kandung jika anak dari suami beristri banyak */}
            {selectedNode.motherName && (
              <div className="bg-purple-950/40 p-1.5 rounded-lg border border-purple-800/40 text-[11px] text-purple-300">
                🌸 Ibu Kandung: <span className="font-bold text-white">{selectedNode.motherName}</span>
              </div>
            )}

            {/* Solusi Salah Urutan Anak / Saudara / Ayah / Kakek */}
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Koreksi Urutan Silsilah</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  No: {selectedNode.dotNotation}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Tukar urutan saudara sekandung ke kiri (lebih tua) / ke kanan (lebih muda).
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSwapSiblingOrder(selectedNode.id, 'prev')}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-700 transition active:scale-95"
                  title="Tukar urutan ke kiri (Lebih tua / nomor urut lebih kecil)"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-amber-400" />
                  <span>◀ Lebih Tua</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwapSiblingOrder(selectedNode.id, 'next')}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-700 transition active:scale-95"
                  title="Tukar urutan ke kanan (Lebih muda / nomor urut lebih besar)"
                >
                  <span>Lebih Muda ▶</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              {/* Jika node ini memiliki anak, beri tombol urutkan seluruh anak berdasarkan tahun lahir */}
              {nodes.some((n) => n.parentId === selectedNode.id) && (
                <button
                  type="button"
                  onClick={() => handleSortChildrenByBirthYear(selectedNode.id)}
                  className="w-full py-1.5 px-2 bg-amber-950/60 hover:bg-amber-900 border border-amber-600/50 text-amber-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                  title="Urutkan seluruh anak dari anggota ini otomatis berdasarkan tahun lahir"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ Urutkan Anak per Thn Lahir</span>
                </button>
              )}
            </div>
          </div>

          {/* Action buttons on selected node */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            {claimedNodeId !== selectedNode.id ? (
              <button
                onClick={() => handleClaimNode(selectedNode.id)}
                className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
              >
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Klaim Posisi Ini sebagai Akun Saya</span>
              </button>
            ) : (
              <button
                onClick={handleUnclaimNode}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Lepaskan Klaim Akun</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setNodeFormData({
                    name: selectedNode.name,
                    honorific: selectedNode.honorific || 'Bapak',
                    birthDeath: selectedNode.birthDeath,
                    domicile: selectedNode.domicile,
                    photo: selectedNode.photo,
                    gender: selectedNode.gender,
                    parentId: selectedNode.parentId,
                    spouseName: selectedNode.spouseName,
                    spouses: selectedNode.spouses || [],
                    spouseOrder: selectedNode.spouseOrder,
                    motherName: selectedNode.motherName,
                    color: selectedNode.color,
                    notes: selectedNode.notes,
                  });
                  setShowAddSingleModal(true);
                }}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>
              <button
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="py-1.5 px-2 bg-red-950/60 hover:bg-red-900 border border-red-700/60 text-red-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: SOLUSI AYAH UYUT BARU DITEMUKAN */}
      {/* ----------------------------------------------------------------- */}
      {showAyahUyutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Solusi: Ayah Uyut Baru Ditemukan
                  </h3>
                  <p className="text-xs text-amber-300/80">
                    Sisipkan leluhur puncak di baris paling atas tanpa merusak posisi turunan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAyahUyutModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
              <strong>Cara Kerja Solusi:</strong> Sistem akan menempatkan Ayah Uyut di baris paling atas (Generasi 1), menggeser seluruh baris generasi yang ada turun +1 tingkat secara otomatis (*zero collision*), dan menghubungkan anak-cucu yang dipilih ke Ayah Uyut ini dengan penomoran dot-notation yang baru.
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Gelar Bapak/Ibu</label>
                  <select
                    value={ayahUyutForm.honorific}
                    onChange={(e) =>
                      setAyahUyutForm({ ...ayahUyutForm, honorific: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Bapak H.">Bapak H.</option>
                    <option value="Bapak">Bapak</option>
                    <option value="Ibu Hj.">Ibu Hj.</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Eyang Bapak">Eyang Bapak</option>
                    <option value="Eyang Ibu">Eyang Ibu</option>
                    <option value="Kyai">Kyai</option>
                    <option value="Raden">Raden</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-slate-300 block mb-1">Nama Lengkap Ayah Uyut *</label>
                  <input
                    type="text"
                    value={ayahUyutForm.name}
                    onChange={(e) => setAyahUyutForm({ ...ayahUyutForm, name: e.target.value })}
                    placeholder="Contoh: Kyai Raden H. Masduki"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tahun Lahir - Wafat</label>
                  <input
                    type="text"
                    value={ayahUyutForm.birthDeath}
                    onChange={(e) =>
                      setAyahUyutForm({ ...ayahUyutForm, birthDeath: e.target.value })
                    }
                    placeholder="1885 - 1952"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Alamat Kota / Domisili</label>
                  <input
                    type="text"
                    value={ayahUyutForm.domicile}
                    onChange={(e) =>
                      setAyahUyutForm({ ...ayahUyutForm, domicile: e.target.value })
                    }
                    placeholder="Kuningan, Jawa Barat"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Upload Foto Ayah Uyut */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Foto Ayah Uyut (Opsional)</label>
                <div className="flex items-center gap-3">
                  {ayahUyutForm.photo ? (
                    <img
                      src={ayahUyutForm.photo}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-amber-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <input
                    type="file"
                    ref={ayahUyutPhotoRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handlePhotoUpload(e, (base64) =>
                        setAyahUyutForm({ ...ayahUyutForm, photo: base64 })
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => ayahUyutPhotoRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700"
                  >
                    Unggah Foto Profil
                  </button>
                  {ayahUyutForm.photo && (
                    <button
                      type="button"
                      onClick={() => setAyahUyutForm({ ...ayahUyutForm, photo: '' })}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* Pilih Siapa Anak dari Ayah Uyut Ini */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Pilih Siapa Anak Kandung dari Ayah Uyut ini:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {nodes
                    .filter((n) => !n.parentId || n.row === 0)
                    .map((rootNode) => (
                      <label
                        key={rootNode.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={ayahUyutForm.childrenIds.includes(rootNode.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAyahUyutForm({
                                ...ayahUyutForm,
                                childrenIds: [...ayahUyutForm.childrenIds, rootNode.id],
                              });
                            } else {
                              setAyahUyutForm({
                                ...ayahUyutForm,
                                childrenIds: ayahUyutForm.childrenIds.filter(
                                  (id) => id !== rootNode.id
                                ),
                              });
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="font-semibold text-slate-200">
                          {rootNode.dotNotation} - {rootNode.honorific} {rootNode.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          (Saat ini Gen {rootNode.row + 1})
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAyahUyutModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs transition"
              >
                Batal
              </button>
              <button
                onClick={handleInsertAyahUyut}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs transition shadow-lg active:scale-95"
              >
                Terapkan Solusi di Puncak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: INPUT MASAL - ENTRY AWAL DEFAULT / BEBAS */}
      {/* ----------------------------------------------------------------- */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Input Massal (Fast Batch)</h3>
                  <p className="text-xs text-slate-400">
                    Dukungan entry awal bebas / tanpa induk, maupun di bawah cabang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Batch Mode Switch */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setBatchMode('comma')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  batchMode === 'comma' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Pisah Koma (Cepat)
              </button>
              <button
                onClick={() => setBatchMode('outline')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  batchMode === 'outline' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Pohon Teks Indentasi (Lengkap)
              </button>
            </div>

            {batchMode === 'comma' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Posisi Masukan / Induk Cabang:
                  </label>
                  <select
                    value={batchParentId}
                    onChange={(e) => setBatchParentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">
                      ⭐ [Entry Awal Bebas] Generasi Paling Atas / Root Mandiri
                    </option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        Anak dari: {n.dotNotation} - {n.honorific} {n.name} (Gen {n.row + 1})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Gelar Default
                    </label>
                    <select
                      value={batchDefaultHonorific}
                      onChange={(e) => setBatchDefaultHonorific(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200"
                    >
                      <option value="Bapak">Bapak</option>
                      <option value="Ibu">Ibu</option>
                      <option value="Bapak H.">Bapak H.</option>
                      <option value="Ibu Hj.">Ibu Hj.</option>
                      <option value="Raden">Raden</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Kota / Domisili Default
                    </label>
                    <input
                      type="text"
                      value={batchDefaultDomicile}
                      onChange={(e) => setBatchDefaultDomicile(e.target.value)}
                      placeholder="Kuningan, Jawa Barat"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Daftar Nama Anggota (Dipisah Tanda Koma):
                  </label>
                  <textarea
                    rows={4}
                    value={batchNames}
                    onChange={(e) => setBatchNames(e.target.value)}
                    placeholder="Contoh: Rian Pratama, Anisa Rahma, Hendra Gunawan, Putri Melati"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    * Sistem otomatis memberi nomor rantai seperti 1.1, 1.2, 1.3 dan menempatkan pada kolom kosong tanpa tumpang tindih (*Zero Collision*).
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-300 block">
                  Tempel Pohon Keluarga (Format: Nama [Gelar] (Tahun) | Kota):
                </label>
                <textarea
                  rows={6}
                  value={batchOutlineText}
                  onChange={(e) => setBatchOutlineText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleAddBatch}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95"
              >
                Tambahkan Massal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: KLAIM URUTAN SILSILAH BY AKUN */}
      {/* ----------------------------------------------------------------- */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Klaim Urutan Silsilah</h3>
                  <p className="text-xs text-slate-400">Hubungkan posisi Anda di bagan keluarga</p>
                </div>
              </div>
              <button
                onClick={() => setShowClaimModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Nama Akun / Pengguna Anda:
                </label>
                <input
                  type="text"
                  value={claimedUserName}
                  onChange={(e) => setClaimedUserName(e.target.value)}
                  placeholder="Contoh: Hendri (Akun Saya)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Pilih Node Silsilah yang Merupakan Posisi Anda:
                </label>
                <select
                  value={claimedNodeId || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleClaimNode(e.target.value);
                    } else {
                      handleUnclaimNode();
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Belum Diklaim / Pilih Anggota --</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.dotNotation} - {n.honorific} {n.name} (Gen {n.row + 1})
                    </option>
                  ))}
                </select>
              </div>

              {claimedNodeId && (
                <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-500/30 text-amber-200 space-y-1">
                  <div className="font-bold text-amber-300">Status Klaim Terpasang:</div>
                  <div>
                    Akun Anda terhubung dengan:{' '}
                    <strong>
                      {nodes.find((n) => n.id === claimedNodeId)?.honorific}{' '}
                      {nodes.find((n) => n.id === claimedNodeId)?.name}
                    </strong>{' '}
                    (Nomor Dot-Notation:{' '}
                    <span className="font-mono">
                      {nodes.find((n) => n.id === claimedNodeId)?.dotNotation}
                    </span>
                    )
                  </div>
                  <div className="text-[11px] text-amber-400/80">
                    * Garis konektor dari leluhur puncak menuju posisi Anda akan disorot warna emas secara otomatis.
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              {claimedNodeId && (
                <button
                  onClick={handleUnclaimNode}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Lepas Klaim
                </button>
              )}
              <button
                onClick={() => setShowClaimModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: TAMBAH / EDIT SINGLE NODE (5 ELEMEN PRESISI) */}
      {/* ----------------------------------------------------------------- */}
      {showAddSingleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {selectedNodeId ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
              </h3>
              <button
                onClick={() => setShowAddSingleModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Gelar Bapak/Ibu</label>
                  <select
                    value={nodeFormData.honorific || 'Bapak'}
                    onChange={(e) =>
                      setNodeFormData({
                        ...nodeFormData,
                        honorific: e.target.value,
                        gender: e.target.value.toLowerCase().includes('ibu') ? 'P' : 'L',
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200"
                  >
                    <option value="Bapak">Bapak</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Bapak H.">Bapak H.</option>
                    <option value="Ibu Hj.">Ibu Hj.</option>
                    <option value="Eyang Bapak">Eyang Bapak</option>
                    <option value="Eyang Ibu">Eyang Ibu</option>
                    <option value="Raden">Raden</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="font-semibold text-slate-300 block mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={nodeFormData.name || ''}
                    onChange={(e) => setNodeFormData({ ...nodeFormData, name: e.target.value })}
                    placeholder="Contoh: Raden Mas Danang"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Tahun Lahir - Wafat</label>
                  <input
                    type="text"
                    value={nodeFormData.birthDeath || ''}
                    onChange={(e) =>
                      setNodeFormData({ ...nodeFormData, birthDeath: e.target.value })
                    }
                    placeholder="1955 - 2021 / 1980"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Alamat Kota / Domisili</label>
                  <input
                    type="text"
                    value={nodeFormData.domicile || ''}
                    onChange={(e) =>
                      setNodeFormData({ ...nodeFormData, domicile: e.target.value })
                    }
                    placeholder="Kuningan, Jawa Barat"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              {/* Upload Foto */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Foto Profil Anggota</label>
                <div className="flex items-center gap-3">
                  {nodeFormData.photo ? (
                    <img
                      src={nodeFormData.photo}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handlePhotoUpload(e, (base64) =>
                        setNodeFormData({ ...nodeFormData, photo: base64 })
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700"
                  >
                    Unggah Foto
                  </button>
                  {nodeFormData.photo && (
                    <button
                      type="button"
                      onClick={() => setNodeFormData({ ...nodeFormData, photo: '' })}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* Pengaturan Istri (Multi-Istri / Poligini) untuk Laki-laki */}
              {nodeFormData.gender === 'L' && (
                <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-rose-300 block">
                      💍 Daftar Istri / Pasangan (Poligini):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const currentSpouses = nodeFormData.spouses ? [...nodeFormData.spouses] : [];
                        currentSpouses.push({
                          id: `sp-${Date.now()}`,
                          name: '',
                          order: currentSpouses.length + 1,
                          note: '',
                        });
                        setNodeFormData({ ...nodeFormData, spouses: currentSpouses });
                      }}
                      className="px-2 py-0.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded text-[11px] font-bold"
                    >
                      + Tambah Istri
                    </button>
                  </div>
                  {!nodeFormData.spouses || nodeFormData.spouses.length === 0 ? (
                    <div>
                      <input
                        type="text"
                        value={nodeFormData.spouseName || ''}
                        onChange={(e) => setNodeFormData({ ...nodeFormData, spouseName: e.target.value })}
                        placeholder="Nama Istri (Contoh: Hj. Siti Rohimah)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Klik "+ Tambah Istri" jika memiliki lebih dari 1 istri (Istri 1, 2, 3, dst.)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {nodeFormData.spouses.map((sp, idx) => (
                        <div key={idx} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-rose-300">Istri Ke-{sp.order || idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = nodeFormData.spouses!.filter((_, i) => i !== idx);
                                setNodeFormData({ ...nodeFormData, spouses: updated });
                              }}
                              className="text-red-400 hover:text-red-300 text-[10px]"
                            >
                              Hapus
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={sp.name}
                              onChange={(e) => {
                                const updated = [...nodeFormData.spouses!];
                                updated[idx].name = e.target.value;
                                setNodeFormData({ ...nodeFormData, spouses: updated });
                              }}
                              placeholder="Nama Istri"
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100"
                            />
                            <input
                              type="text"
                              value={sp.note || ''}
                              onChange={(e) => {
                                const updated = [...nodeFormData.spouses!];
                                updated[idx].note = e.target.value;
                                setNodeFormData({ ...nodeFormData, spouses: updated });
                              }}
                              placeholder="Status/Keterangan"
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!selectedNodeId && (
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Orang Tua / Garis Induk:
                  </label>
                  <select
                    value={nodeFormData.parentId || ''}
                    onChange={(e) =>
                      setNodeFormData({
                        ...nodeFormData,
                        parentId: e.target.value === '' ? null : e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="">-- Entry Awal Bebas (Generasi 1) --</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.dotNotation} - {n.honorific} {n.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Jika orang tua yang dipilih memiliki banyak istri, pilih Ibu Kandung */}
              {(() => {
                const parentNode = nodes.find((n) => n.id === nodeFormData.parentId);
                if (parentNode && parentNode.spouses && parentNode.spouses.length > 0) {
                  return (
                    <div className="bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/40 space-y-1">
                      <label className="font-semibold text-purple-300 block text-xs">
                        🌸 Pilih Ibu Kandung (Istri ke-berapa):
                      </label>
                      <select
                        value={nodeFormData.motherName || ''}
                        onChange={(e) =>
                          setNodeFormData({ ...nodeFormData, motherName: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-purple-800/50 rounded-xl px-3 py-2 text-slate-200 text-xs"
                      >
                        <option value="">-- Pilih Ibu Kandung --</option>
                        {parentNode.spouses.map((s, idx) => (
                          <option
                            key={idx}
                            value={`Istri Ke-${s.order || idx + 1} (${s.name})`}
                          >
                            Istri Ke-{s.order || idx + 1}: {s.name} {s.note ? `[${s.note}]` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-purple-400">
                        Membedakan silsilah saudara seayah beda ibu secara akurat.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddSingleModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleSaveSingleNode}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95"
              >
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* MODAL: PETUNJUK PENGGUNAAN */}
      {/* ----------------------------------------------------------------- */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Petunjuk Fitur Terbaru</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-amber-500/40">
                <span className="font-bold text-amber-400 block mb-0.5">
                  1. Solusi Ayah Uyut Ditemukan
                </span>
                Tekan tombol emas &ldquo;Ayah Uyut Ditemukan&rdquo; di header atas. Seluruh generasi yang ada otomatis diturunkan 1 tingkat ke bawah secara rapi (*zero collision*), dan Ayah Uyut menempati puncak generasi 1.
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400 block mb-0.5">
                  2. 5 Atribut Presisi
                </span>
                Setiap node hanya menampilkan Foto, Nama, Tahun Lahir - Wafat, Alamat Kota/Domisili, dan Gelar Bapak/Ibu.
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="font-bold text-indigo-400 block mb-0.5">
                  3. Klaim Urutan Silsilah by Akun
                </span>
                Klaim posisi Anda di bagan silsilah untuk menandai akun pengguna dan menyorot alur nasab emas langsung dari leluhur puncak.
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GridCanvasEngine;
