import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Menu,
  ShoppingBag,
  Printer,
  Sparkles,
  Store,
  ChevronRight,
  Headphones,
  ShieldCheck,
  Receipt,
  QrCode,
  Home,
  UtensilsCrossed,
  Mic,
  CheckCircle2,
  TrendingUp,
  Package,
  Layers,
  Zap,
  Clock
} from 'lucide-react';

import { HeaderBar } from '../HeaderBar';
import { NavigationDrawer } from '../NavigationDrawer';
import { BottomNavBar } from '../BottomNavBar';
import { TableGrid } from '../kasir/TableGrid';
import { OrderBottomSheet } from '../kasir/OrderBottomSheet';
import { TableActionModal } from '../kasir/TableActionModal';
import { CheckoutModal } from '../kasir/CheckoutModal';
import { ReceiptModal } from '../kasir/ReceiptModal';
import { BahanView } from '../bahan/BahanView';
import { OmsetDashboard } from '../omset/OmsetDashboard';
import { LaporanView } from '../laporan/LaporanView';
import { SettingView } from '../setting/SettingView';
import { BluetoothModal } from '../BluetoothModal';
import { OwnerQrisModal } from '../monetization/OwnerQrisModal';
import { MonetizationService } from '../../services/monetization';

import {
  TableItem,
  MenuItem,
  Order,
  OrderItem,
  OrderType,
  Ingredient,
  RestaurantProfile,
  PrinterConfig,
  UserAccount
} from '../../types';
import { StorageService } from '../../services/storage';
import { PrinterService } from '../../services/printer';
import { AuthService } from '../../services/auth';

interface UsahaQuViewProps {
  onBackToWarga: () => void;
  onOpenModularQu?: () => void;
  onOpenBantuan?: () => void;
  tables: TableItem[];
  setTables: React.Dispatch<React.SetStateAction<TableItem[]>>;
  menuList: MenuItem[];
  setMenuList: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  history: Order[];
  setHistory: React.Dispatch<React.SetStateAction<Order[]>>;
  activeOrders: Record<string, Order>;
  setActiveOrders: React.Dispatch<React.SetStateAction<Record<string, Order>>>;
  profile: RestaurantProfile;
  setProfile: React.Dispatch<React.SetStateAction<RestaurantProfile>>;
  printerConfig: PrinterConfig;
  setPrinterConfig: React.Dispatch<React.SetStateAction<PrinterConfig>>;
  showNotification: (msg: string) => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
  onOpenMasterAdmin?: () => void;
}

export const UsahaQuView: React.FC<UsahaQuViewProps> = ({
  onBackToWarga,
  onOpenModularQu,
  onOpenBantuan,
  tables,
  setTables,
  menuList,
  setMenuList,
  ingredients,
  setIngredients,
  history,
  setHistory,
  activeOrders,
  setActiveOrders,
  profile,
  setProfile,
  printerConfig,
  setPrinterConfig,
  showNotification,
  currentUser,
  onOpenSecurityModal,
  onOpenMasterAdmin,
}) => {
  // Mode switcher between Hub (Halaman Utama) and BaksoQu POS
  const [usahaquViewMode, setUsahaquViewMode] = useState<'hub' | 'baksoqu'>('hub');
  const usahaquViewModeRef = useRef(usahaquViewMode);
  useEffect(() => { usahaquViewModeRef.current = usahaquViewMode; }, [usahaquViewMode]);

  // Navigation State inside POS
  const [activeTab, setActiveTab] = useState<string>('kasir');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState<boolean>(false);
  const [showOwnerQrisModal, setShowOwnerQrisModal] = useState<boolean>(false);
  const [qrisModalReason, setQrisModalReason] = useState<'threshold' | 'closing' | 'manual'>('closing');

  // Interactive Flow States
  const [selectedTableForAction, setSelectedTableForAction] = useState<TableItem | null>(null);
  const [orderSheetState, setOrderSheetState] = useState<{
    isOpen: boolean;
    orderType: OrderType;
    tableId?: string;
    tableName?: string;
    existingOrder?: Order | null;
  }>({
    isOpen: false,
    orderType: 'meja',
  });

  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [receiptModalState, setReceiptModalState] = useState<{
    isOpen: boolean;
    order: Order | null;
    isKitchenSlip?: boolean;
  }>({
    isOpen: false,
    order: null,
    isKitchenSlip: false,
  });

  // Reference hooks for Android / Browser Back Button
  const activeTabRef = useRef(activeTab);
  const isDrawerOpenRef = useRef(isDrawerOpen);
  const isBluetoothModalOpenRef = useRef(isBluetoothModalOpen);
  const selectedTableRef = useRef(selectedTableForAction);
  const orderSheetRef = useRef(orderSheetState);
  const checkoutOrderRef = useRef(checkoutOrder);
  const receiptModalRef = useRef(receiptModalState);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { isDrawerOpenRef.current = isDrawerOpen; }, [isDrawerOpen]);
  useEffect(() => { isBluetoothModalOpenRef.current = isBluetoothModalOpen; }, [isBluetoothModalOpen]);
  useEffect(() => { selectedTableRef.current = selectedTableForAction; }, [selectedTableForAction]);
  useEffect(() => { orderSheetRef.current = orderSheetState; }, [orderSheetState]);
  useEffect(() => { checkoutOrderRef.current = checkoutOrder; }, [checkoutOrder]);
  useEffect(() => { receiptModalRef.current = receiptModalState; }, [receiptModalState]);

  // Tangani tombol Back HP / Browser di UsahaQu
  useEffect(() => {
    window.history.replaceState({ screen: 'usahaqu', tab: 'kasir' }, '', '#usahaqu-kasir');

    const handleBackButton = () => {
      // 1. Tutup modal yang sedang terbuka terlebih dahulu
      if (receiptModalRef.current.isOpen) {
        setReceiptModalState({ isOpen: false, order: null });
        return;
      }
      if (checkoutOrderRef.current) {
        setCheckoutOrder(null);
        return;
      }
      if (orderSheetRef.current.isOpen) {
        setOrderSheetState({ isOpen: false, orderType: 'meja' });
        return;
      }
      if (selectedTableRef.current) {
        setSelectedTableForAction(null);
        return;
      }
      if (isBluetoothModalOpenRef.current) {
        setIsBluetoothModalOpen(false);
        return;
      }
      if (isDrawerOpenRef.current) {
        setIsDrawerOpen(false);
        return;
      }

      // 2. Jika di tab selain kasir, kembalikan ke tab kasir
      if (activeTabRef.current !== 'kasir') {
        setActiveTab('kasir');
        return;
      }

      // 3. Jika sedang di mode BaksoQu, kembalikan ke Halaman Utama Hub UsahaQu
      if (usahaquViewModeRef.current === 'baksoqu') {
        setUsahaquViewMode('hub');
        return;
      }

      // 4. Jika sudah di hub UsahaQu dan tanpa modal, kembali ke beranda WargaQu
      onBackToWarga();
    };

    const onPop = () => {
      handleBackButton();
    };

    window.addEventListener('popstate', onPop);

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
      window.removeEventListener('popstate', onPop);
      if (capHandle?.remove) {
        capHandle.remove();
      }
    };
  }, [onBackToWarga]);

  // Table Management
  const handleAddTable = () => {
    const nextNumber = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
    const newTable: TableItem = {
      id: `tbl-${Date.now()}`,
      name: `Meja ${nextNumber}`,
      number: nextNumber,
      status: 'kosong',
      positionIndex: tables.length,
    };
    const updated = [...tables, newTable];
    setTables(updated);
    StorageService.saveTables(updated);
    showNotification(`Meja ${nextNumber} berhasil ditambahkan ke denah.`);
  };

  const handleReorderTables = (newTables: TableItem[]) => {
    setTables(newTables);
    StorageService.saveTables(newTables);
  };

  const handleDeleteTable = (tableId: string) => {
    const updated = tables.filter((t) => t.id !== tableId);
    setTables(updated);
    StorageService.saveTables(updated);
    showNotification('Meja dihapus dari denah.');
  };

  const handleSelectTable = (table: TableItem) => {
    if (table.status === 'kosong') {
      setOrderSheetState({
        isOpen: true,
        orderType: 'meja',
        tableId: table.id,
        tableName: table.name,
        existingOrder: null,
      });
    } else {
      setSelectedTableForAction(table);
    }
  };

  const handleOpenBungkus = () => {
    setOrderSheetState({
      isOpen: true,
      orderType: 'bungkus',
      existingOrder: null,
    });
  };

  const handleSaveAndPrintOrder = async (
    items: OrderItem[],
    type: OrderType,
    tableId?: string,
    tableName?: string,
    customerName?: string,
    printOption?: 'bluetooth' | 'pdf' | 'none'
  ) => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const date = new Date();
    const dateKey = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

    let orderToSave: Order;

    if (orderSheetState.existingOrder) {
      orderToSave = {
        ...orderSheetState.existingOrder,
        items,
        subtotal,
        total: subtotal,
        customerName: customerName || orderSheetState.existingOrder.customerName,
      };
    } else {
      const newReceiptNumber = `BQ-${dateKey}-${String(Math.floor(100 + Math.random() * 900))}`;
      orderToSave = {
        id: `ord-${Date.now()}`,
        receiptNumber: newReceiptNumber,
        type,
        tableId,
        tableName,
        customerName: customerName || (type === 'meja' ? tableName || 'Meja' : 'Bungkus'),
        items,
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        status: 'saved',
        createdAt: date.toISOString(),
      };
    }

    if (type === 'bungkus') {
      setOrderSheetState({ isOpen: false, orderType: 'bungkus' });
      setCheckoutOrder(orderToSave);
      showNotification('Pesanan bungkus tersimpan. Lanjutkan pembayaran.');
      return;
    }

    const updatedActiveOrders = { ...activeOrders, [orderToSave.id]: orderToSave };
    setActiveOrders(updatedActiveOrders);
    StorageService.saveActiveOrders(updatedActiveOrders);

    if (tableId) {
      const updatedTables = tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: 'terisi' as const,
              orderId: orderToSave.id,
              totalAmount: orderToSave.total,
              itemsCount: orderToSave.items.reduce((s, i) => s + i.quantity, 0),
              openedAt: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            }
          : t
      );
      setTables(updatedTables);
      StorageService.saveTables(updatedTables);
    }

    setOrderSheetState({ isOpen: false, orderType: 'meja' });

    if (printOption === 'bluetooth') {
      await PrinterService.printOrder(orderToSave, profile, printerConfig, true);
      setReceiptModalState({
        isOpen: true,
        order: orderToSave,
        isKitchenSlip: true,
      });
      showNotification(`Pesanan ${tableName} tersimpan & Struk Dapur dicetak.`);
    } else {
      showNotification(`Pesanan ${tableName} berhasil disimpan.`);
    }
  };

  const handleProceedToPay = (table: TableItem) => {
    if (!table.orderId || !activeOrders[table.orderId]) {
      alert('Data pesanan meja tidak ditemukan.');
      return;
    }
    const currentOrder = activeOrders[table.orderId];
    setCheckoutOrder(currentOrder);
  };

  const handleCompletePayment = async (
    completedOrder: Order,
    printOption: 'bluetooth' | 'pdf' | 'both' | 'none'
  ) => {
    StorageService.addTransaction(completedOrder);
    setHistory([completedOrder, ...history]);

    // Catat fee platform secara silent di background & cek ambang batas Rp 10.000
    try {
      const feeRes = MonetizationService.recordTransaction(
        completedOrder.id,
        completedOrder.total,
        'pos'
      );
      if (feeRes.triggerPopup) {
        setQrisModalReason('threshold');
        setShowOwnerQrisModal(true);
      }
    } catch {}

    const copyActive = { ...activeOrders };
    delete copyActive[completedOrder.id];
    setActiveOrders(copyActive);
    StorageService.saveActiveOrders(copyActive);

    if (completedOrder.tableId) {
      const updatedTables = tables.map((t) =>
        t.id === completedOrder.tableId
          ? {
              ...t,
              status: 'kosong' as const,
              orderId: undefined,
              totalAmount: undefined,
              itemsCount: undefined,
              openedAt: undefined,
            }
          : t
      );
      setTables(updatedTables);
      StorageService.saveTables(updatedTables);
    }

    setCheckoutOrder(null);

    if (printOption === 'bluetooth' || printOption === 'both') {
      await PrinterService.printOrder(completedOrder, profile, printerConfig, false);
      setReceiptModalState({
        isOpen: true,
        order: completedOrder,
        isKitchenSlip: false,
      });
      showNotification('Pembayaran LUNAS! Struk nota dicetak ke printer.');
    } else if (printOption === 'pdf') {
      setReceiptModalState({
        isOpen: true,
        order: completedOrder,
        isKitchenSlip: false,
      });
      showNotification('Pembayaran LUNAS! Pratinjau struk PDF siap disimpan.');
    } else {
      showNotification('Pembayaran LUNAS! Transaksi tersimpan rapi.');
    }
  };

  const handleClearTable = (table: TableItem) => {
    if (table.orderId) {
      const copy = { ...activeOrders };
      delete copy[table.orderId];
      setActiveOrders(copy);
      StorageService.saveActiveOrders(copy);
    }
    const updated = tables.map((t) =>
      t.id === table.id
        ? {
            ...t,
            status: 'kosong' as const,
            orderId: undefined,
            totalAmount: undefined,
            itemsCount: undefined,
            openedAt: undefined,
          }
        : t
    );
    setTables(updated);
    StorageService.saveTables(updated);
    showNotification(`${table.name} berhasil dikosongkan.`);
  };

  const occupiedTablesCount = tables.filter((t) => t.status !== 'kosong').length;

  const getPageTitle = () => {
    switch (activeTab) {
      case 'kasir':
        return { title: 'Bakso Qu 1.0', subtitle: 'Kasir & Denah Meja' };
      case 'bahan':
        return { title: 'Modal & Bahan', subtitle: 'Manajemen Stok Gudang' };
      case 'omset':
        return { title: 'Omset & Pendapatan', subtitle: 'Ringkasan Keuangan' };
      case 'laporan':
        return { title: 'Laporan Transaksi', subtitle: 'Riwayat Penjualan & Ekspor' };
      case 'setting':
        return { title: 'Pengaturan Usaha', subtitle: 'Profil Usaha & Bluetooth' };
      default:
        return { title: 'Bakso Qu 1.0', subtitle: 'POS Restoran' };
    }
  };

  // Summary stats for UsahaQu Hub
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = history.filter((o) => o.createdAt && o.createdAt.startsWith(todayStr));
  const todayOmset = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const todayTxCount = todayOrders.length;

  // Halaman Utama UsahaQu: Hub Switcher antara BaksoQu dan ModularQu
  if (usahaquViewMode === 'hub') {
    return (
      <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white select-none">
        {/* Top Header Hub */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-900 text-white px-3.5 pt-10 sm:pt-11 pb-3 flex items-center justify-between shrink-0 shadow-md border-b border-emerald-600/40 android-header-safe">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToWarga}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center text-emerald-100 hover:text-white cursor-pointer"
              title="Kembali ke Beranda WargaQu"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-300" />
                <h1 className="text-sm font-black tracking-tight text-white">UsahaQu Portal</h1>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-xs">
                  Hub Bisnis
                </span>
              </div>
              <p className="text-[10px] text-emerald-100/90 font-medium leading-none mt-0.5">
                Pilih Sistem Kasir & Operasional Warga
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenBantuan && (
              <button
                onClick={onOpenBantuan}
                className="w-7 h-7 rounded-lg bg-emerald-950/80 hover:bg-emerald-950 text-[#5eead4] border border-[#5eead4]/40 flex items-center justify-center font-bold shadow-xs active:scale-95 cursor-pointer"
                title="Pusat Bantuan UsahaQu & Smart Care"
              >
                <Headphones className="w-3.5 h-3.5 text-[#5eead4]" />
              </button>
            )}

            <button
              onClick={() => {
                setQrisModalReason('closing');
                setShowOwnerQrisModal(true);
              }}
              className="text-[10px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-xs active:scale-95 transition cursor-pointer"
              title="Closing Kasir & Setor Fee Platform ke QRIS Owner"
            >
              <QrCode className="w-3 h-3" />
              <span>Closing</span>
            </button>

            {currentUser && onOpenSecurityModal && (
              <button
                onClick={onOpenSecurityModal}
                className="text-[10px] bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 px-2 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition cursor-pointer"
                title={`Akun: ${currentUser.name} • Device: ${AuthService.getMaskedDeviceId(currentUser.boundDeviceId)}`}
              >
                <ShieldCheck className="w-3 h-3 text-[#5eead4]" />
                <span className="font-mono text-[9px] font-semibold">{AuthService.getMaskedDeviceId(currentUser.boundDeviceId)}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Hub Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-xl mx-auto w-full">
          {/* Welcome Intro Banner */}
          <div className="bg-stone-850/90 rounded-2xl p-4 border border-stone-700/60 shadow-lg relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full inline-block mb-1">
                  Pusat Operasional Kasir
                </span>
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  Pilih Sistem POS Usaha Anda
                </h2>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  UsahaQu menyediakan 2 sistem kasir terintegrasi. Anda dapat berganti sistem kapan saja sesuai jenis pesanan dan kebutuhan usaha:
                </p>
              </div>
            </div>
          </div>

          {/* Dual Choice Grid: BaksoQu vs ModularQu */}
          <div className="grid grid-cols-1 gap-4">
            {/* CARD 1: BAKSOQU */}
            <div className="group relative bg-gradient-to-br from-stone-850 via-stone-850 to-emerald-950/40 rounded-3xl p-5 border-2 border-emerald-500/40 hover:border-emerald-400 shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-500 flex items-center justify-center text-xl shadow-md ring-2 ring-emerald-400/30">
                    🍲
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-white">BaksoQu 1.0</h3>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Resto & Dine-In
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-300/90 font-medium">
                      POS Denah Meja & Kasir Kuliner
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  {occupiedTablesCount > 0 ? `🔴 ${occupiedTablesCount} Meja Aktif` : '🟢 12 Meja Siap'}
                </span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed mb-3.5">
                Ideal untuk rumah makan, kedai bakso, cafe, dan resto. Dilengkapi denah 12 meja interaktif, resep & stok bahan baku, slip dapur otomatis, serta struk thermal bluetooth.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] text-stone-300">
                <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-xl border border-stone-800">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">12 Denah Meja Dine-In</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-xl border border-stone-800">
                  <Receipt className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Slip Dapur & Kasir</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-xl border border-stone-800">
                  <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Stok Bahan & Resep</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-xl border border-stone-800">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Laporan Omset Lengkap</span>
                </div>
              </div>

              <button
                onClick={() => setUsahaquViewMode('baksoqu')}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] transition-all rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer"
              >
                <span>Buka Kasir BaksoQu</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* CARD 2: MODULARQU */}
            <div className="group relative bg-gradient-to-br from-stone-850 via-stone-850 to-indigo-950/40 rounded-3xl p-5 border-2 border-indigo-500/40 hover:border-indigo-400 shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl shadow-md ring-2 ring-indigo-400/30">
                    🎙️
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-black text-white">ModularQu POS</h3>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Voice AI Cepat
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-300/90 font-medium">
                      Multi-Usaha & Pesanan Suara AI
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  ⚡ Suara Pintar
                </span>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed mb-3.5">
                Input transaksi secepat kilat dengan suara (&quot;Bakso 2 es teh 1&quot;). Cocok untuk laundry, cafe, barbershop, toko kelontong, konter pulsa, servis, dan aneka UMKM warga.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] text-stone-300">
                <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-xl border border-stone-800">
                  <Mic className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Voice AI Super Cepat</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-xl border border-stone-800">
                  <Layers className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="truncate">Multi-Kategori UMKM</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-xl border border-stone-800">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">Keranjang & Scan Barcode</span>
                </div>
                <div className="flex items-center gap-1.5 bg-stone-900/60 p-2 rounded-xl border border-stone-800">
                  <Printer className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="truncate">Struk 58/80mm & QRIS</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onOpenModularQu) {
                    onOpenModularQu();
                  } else {
                    showNotification('ModularQu siap dibuka.');
                  }
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] transition-all rounded-2xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60 cursor-pointer"
              >
                <span>Buka POS ModularQu</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quick Metrics of Today */}
          <div className="bg-stone-850/80 rounded-2xl p-4 border border-stone-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ringkasan Usaha Hari Ini</span>
              </h4>
              <span className="text-[10px] text-stone-400 font-mono">
                {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <p className="text-[10px] text-stone-400">Omset Hari Ini</p>
                <p className="text-xs font-black text-emerald-400 mt-0.5 truncate">
                  Rp {todayOmset.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <p className="text-[10px] text-stone-400">Transaksi</p>
                <p className="text-xs font-black text-amber-400 mt-0.5">
                  {todayTxCount} Transaksi
                </p>
              </div>
              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <p className="text-[10px] text-stone-400">Meja Terisi</p>
                <p className="text-xs font-black text-sky-400 mt-0.5">
                  {occupiedTablesCount} / {tables.length}
                </p>
              </div>
              <div className="bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                <p className="text-[10px] text-stone-400">Total Menu</p>
                <p className="text-xs font-black text-purple-400 mt-0.5">
                  {menuList.length} Item
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                setQrisModalReason('closing');
                setShowOwnerQrisModal(true);
              }}
              className="flex-1 py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Closing Kasir & Setor Fee</span>
            </button>

            {onOpenBantuan && (
              <button
                onClick={onOpenBantuan}
                className="flex-1 py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5 text-[#5eead4]" />
                <span>Pusat Bantuan UsahaQu</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal for Closing Settlement on Hub */}
        <OwnerQrisModal
          isOpen={showOwnerQrisModal}
          onClose={() => setShowOwnerQrisModal(false)}
          reason={qrisModalReason}
          merchantName="UsahaQu - Portal Bisnis & Kasir"
          onSettledSuccess={() => showNotification('Setoran closing kasir berhasil dikonfirmasi!')}
        />
      </div>
    );
  }

  const pageInfo = getPageTitle();

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-stone-100">
      {/* Top Banner: Breadcrumb / Switcher back to WargaQu & Hub */}
      <div className="bg-gradient-to-r from-[#047857] via-[#059669] to-[#047857] text-white px-3.5 pt-10 sm:pt-11 pb-2.5 flex items-center justify-between shrink-0 shadow-sm border-b border-emerald-800 android-header-safe">
        <button
          onClick={() => setUsahaquViewMode('hub')}
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition flex items-center justify-center text-emerald-100 hover:text-white cursor-pointer"
          title="Kembali ke Hub UsahaQu"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {/* UsahaQu Switch: Hub vs BaksoQu vs ModularQu */}
          <div className="bg-emerald-950/80 p-0.5 rounded-xl flex items-center border border-emerald-400/40 shadow-inner">
            <button
              onClick={() => setUsahaquViewMode('hub')}
              className="text-[11px] text-emerald-200 hover:text-white hover:bg-white/10 px-2 py-1 rounded-lg flex items-center gap-1 font-bold transition active:scale-95 cursor-pointer"
              title="Kembali ke Halaman Utama UsahaQu (Pilih Mode)"
            >
              <span>🏠 Hub</span>
            </button>
            <button
              className="text-[11px] bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs"
              title="Sedang aktif: BaksoQu (POS Meja & Restoran)"
            >
              <span>🍲 BaksoQu</span>
            </button>
            {onOpenModularQu && (
              <button
                onClick={onOpenModularQu}
                className="text-[11px] text-emerald-200 hover:text-white hover:bg-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition active:scale-95 cursor-pointer"
                title="Beralih ke ModularQu (POS Multi-Usaha & Voice AI)"
              >
                <span>🎙️ ModularQu</span>
              </button>
            )}
          </div>

          {onOpenBantuan && (
            <button
              onClick={onOpenBantuan}
              className="w-7 h-7 rounded-lg bg-emerald-950/80 hover:bg-emerald-950 text-[#5eead4] border border-[#5eead4]/40 flex items-center justify-center font-bold shadow-xs active:scale-95"
              title="Pusat Bantuan UsahaQu & Smart Care"
            >
              <Headphones className="w-3.5 h-3.5 text-[#5eead4]" />
            </button>
          )}

          <button
            onClick={() => {
              setQrisModalReason('closing');
              setShowOwnerQrisModal(true);
            }}
            className="text-[10px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-xs active:scale-95 transition"
            title="Closing Kasir & Setor Fee Platform ke QRIS Owner"
          >
            <QrCode className="w-3 h-3" />
            <span>Closing</span>
          </button>

          {currentUser && onOpenSecurityModal && (
            <button
              onClick={onOpenSecurityModal}
              className="text-[10px] bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 px-2 py-1 rounded-lg flex items-center gap-1 active:scale-95 transition"
              title={`Akun: ${currentUser.name} • Device: ${AuthService.getMaskedDeviceId(currentUser.boundDeviceId)} (Klik untuk Keamanan Akun & HP)`}
            >
              <ShieldCheck className="w-3 h-3 text-[#5eead4]" />
              <span className="font-mono text-[9px] font-semibold">{AuthService.getMaskedDeviceId(currentUser.boundDeviceId)}</span>
            </button>
          )}
        </div>
      </div>

      {/* POS Header Bar */}
      <HeaderBar
        title={pageInfo.title}
        subtitle={pageInfo.subtitle}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onTakeawayClick={handleOpenBungkus}
        printerConfig={printerConfig}
        onOpenPrinterModal={() => setIsBluetoothModalOpen(true)}
        showTakeawayBtn={activeTab === 'kasir'}
      />

      {/* Main Content Area Based on Active Tab */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-stone-100">
        {activeTab === 'kasir' && (
          <TableGrid
            tables={tables}
            activeOrders={activeOrders}
            onSelectTable={handleSelectTable}
            onAddTable={handleAddTable}
            onReorderTables={handleReorderTables}
            onDeleteTable={handleDeleteTable}
          />
        )}

        {activeTab === 'bahan' && (
          <BahanView
            ingredients={ingredients}
            onSaveIngredients={(newItems) => {
              setIngredients(newItems);
              StorageService.saveIngredients(newItems);
              showNotification('Data bahan baku diperbarui.');
            }}
          />
        )}

        {activeTab === 'omset' && <OmsetDashboard history={history} />}

        {activeTab === 'laporan' && (
          <LaporanView
            history={history}
            profile={profile}
            onOpenReceipt={(ord) =>
              setReceiptModalState({ isOpen: true, order: ord, isKitchenSlip: false })
            }
          />
        )}

        {activeTab === 'setting' && (
          <SettingView
            profile={profile}
            onSaveProfile={(newProf) => {
              setProfile(newProf);
              StorageService.saveProfile(newProf);
            }}
            printerConfig={printerConfig}
            onSavePrinterConfig={(newCfg) => {
              setPrinterConfig(newCfg);
              StorageService.savePrinterConfig(newCfg);
            }}
            menuList={menuList}
            onSaveMenu={(newMenu) => {
              setMenuList(newMenu);
              StorageService.saveMenu(newMenu);
              showNotification('Daftar menu berhasil diperbarui.');
            }}
            onOpenMasterAdmin={onOpenMasterAdmin}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar inside POS */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        occupiedCount={occupiedTablesCount}
      />

      {/* Navigation Drawer (Sidebar) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        profile={profile}
        printerConfig={printerConfig}
        occupiedTablesCount={occupiedTablesCount}
        onBackToHub={() => setUsahaquViewMode('hub')}
      />

      {/* Quick Bluetooth Status Modal */}
      <BluetoothModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        printerConfig={printerConfig}
        onSavePrinterConfig={(cfg) => {
          setPrinterConfig(cfg);
          StorageService.savePrinterConfig(cfg);
        }}
        profile={profile}
      />

      {/* Order Bottom Sheet */}
      <OrderBottomSheet
        isOpen={orderSheetState.isOpen}
        onClose={() => setOrderSheetState({ isOpen: false, orderType: 'meja' })}
        orderType={orderSheetState.orderType}
        tableName={orderSheetState.tableName}
        tableId={orderSheetState.tableId}
        existingOrder={orderSheetState.existingOrder}
        menuList={menuList}
        onSaveAndPrint={handleSaveAndPrintOrder}
      />

      {/* Table Action Sheet */}
      <TableActionModal
        isOpen={selectedTableForAction !== null}
        onClose={() => setSelectedTableForAction(null)}
        table={selectedTableForAction}
        activeOrder={
          selectedTableForAction?.orderId
            ? activeOrders[selectedTableForAction.orderId] || null
            : null
        }
        onPay={() => {
          if (selectedTableForAction) handleProceedToPay(selectedTableForAction);
        }}
        onAddMoreMenu={() => {
          if (selectedTableForAction) {
            const existing = selectedTableForAction.orderId
              ? activeOrders[selectedTableForAction.orderId]
              : null;
            setOrderSheetState({
              isOpen: true,
              orderType: 'meja',
              tableId: selectedTableForAction.id,
              tableName: selectedTableForAction.name,
              existingOrder: existing,
            });
          }
        }}
        onViewReceipt={() => {
          if (selectedTableForAction?.orderId && activeOrders[selectedTableForAction.orderId]) {
            setReceiptModalState({
              isOpen: true,
              order: activeOrders[selectedTableForAction.orderId],
              isKitchenSlip: true,
            });
          }
        }}
        onClearTable={() => {
          if (selectedTableForAction) handleClearTable(selectedTableForAction);
        }}
      />

      {/* Checkout Screen Sheet */}
      <CheckoutModal
        isOpen={checkoutOrder !== null}
        onClose={() => setCheckoutOrder(null)}
        order={checkoutOrder}
        printerConfig={printerConfig}
        onCompletePayment={handleCompletePayment}
      />

      {/* Thermal Receipt Preview Modal */}
      <ReceiptModal
        isOpen={receiptModalState.isOpen}
        onClose={() => setReceiptModalState({ isOpen: false, order: null })}
        order={receiptModalState.order}
        profile={profile}
        printerConfig={printerConfig}
        isKitchenSlip={receiptModalState.isKitchenSlip}
      />

      {/* Owner QRIS Interactive Modal for Fee Settlement */}
      <OwnerQrisModal
        isOpen={showOwnerQrisModal}
        onClose={() => setShowOwnerQrisModal(false)}
        reason={qrisModalReason}
        merchantName="UsahaQu - Restoran Bakso Qu"
        onSettledSuccess={() => showNotification('Setoran closing kasir berhasil dikonfirmasi!')}
      />
    </div>
  );
};
