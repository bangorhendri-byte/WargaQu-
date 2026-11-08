import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Settings,
  MessageCircle,
  Camera,
  Plus,
  Star,
  MapPin,
  Trash2,
  Check,
  ChevronRight,
  Upload,
  Sparkles,
  Percent,
  Clock,
  ShieldCheck,
  Truck,
  CheckCircle,
  X,
  FileImage,
  Store,
  Phone,
  CreditCard,
  QrCode
} from 'lucide-react';
import { MenuItem, UserAccount } from '../../types';
import { StorageService } from '../../services/storage';
import { AuthService } from '../../services/auth';

interface MuamalahQuViewProps {
  onBackToMain: () => void;
  menuList: MenuItem[];
  setMenuList: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  showNotification: (msg: string) => void;
  onOpenChatQu?: () => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
}

export interface MarketplaceProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  imageUrl: string;
  sellerName: string;
  sellerBlock: string;
  rating: number;
  soldCount: number;
  stock: number;
  isFromUsahaQu?: boolean;
  badge?: string;
}

export interface CartItem {
  product: MarketplaceProduct;
  quantity: number;
  notes?: string;
  selected: boolean;
}

export interface StoreSettings {
  storeName: string;
  ownerName: string;
  phone: string;
  blockAddress: string;
  isOpen: boolean;
  enableCod: boolean;
  enablePickup: boolean;
  enableSecurityDrop: boolean;
  qrisNumber: string;
}

export const MuamalahQuView: React.FC<MuamalahQuViewProps> = ({
  onBackToMain,
  menuList,
  setMenuList,
  showNotification,
  onOpenChatQu,
  currentUser = null,
  onOpenSecurityModal,
}) => {
  // Navigation & Modal Views
  const [activeTab, setActiveTab] = useState<'market' | 'cart' | 'settings'>('market');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState<boolean>(false);

  // Cart State (stored locally)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('wargaqu_cart_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Store Settings State
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('wargaqu_store_settings_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      storeName: 'UsahaQu & Dapur Warga',
      ownerName: 'Warga RT 03',
      phone: '0812-3456-7890',
      blockAddress: 'Blok A No. 12',
      isOpen: true,
      enableCod: true,
      enablePickup: true,
      enableSecurityDrop: true,
      qrisNumber: '936009988221003'
    };
  });

  // Photo Compression State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [originalSizeKB, setOriginalSizeKB] = useState<number>(0);
  const [compressedSizeKB, setCompressedSizeKB] = useState<number>(0);

  // Form for New Product
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdCategory, setNewProdCategory] = useState<string>('kuliner');
  const [newProdPrice, setNewProdPrice] = useState<string>('');
  const [newProdStock, setNewProdStock] = useState<string>('15');
  const [newProdDesc, setNewProdDesc] = useState<string>('');
  const [newProdSeller, setNewProdSeller] = useState<string>('Dapur RT 03');
  const [newProdBlock, setNewProdBlock] = useState<string>('Blok B No. 04');

  // Checkout Options
  const [deliveryOption, setDeliveryOption] = useState<'cod' | 'pickup' | 'pos_ronda'>('cod');
  const [paymentOption, setPaymentOption] = useState<'wargapay' | 'cash' | 'qris'>('wargapay');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Flash sale countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 2,
    minutes: 45,
    seconds: 18
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 3, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wargaqu_cart_v1', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Save settings to localStorage
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('wargaqu_store_settings_v1', JSON.stringify(settings));
      showNotification('Pengaturan Toko MuamalahQu berhasil disimpan');
      setActiveTab('market');
    } catch {
      showNotification('Gagal menyimpan pengaturan');
    }
  };

  // Convert UsahaQu menuList into Marketplace Products + Add community products
  const products: MarketplaceProduct[] = useMemo(() => {
    // 1. Products from UsahaQu
    const usahaQuProducts: MarketplaceProduct[] = menuList.map((m, idx) => ({
      id: `usahaqu-${m.id}`,
      name: m.name,
      category: 'kuliner',
      price: m.price,
      originalPrice: Math.round(m.price * 1.15),
      description: m.description,
      imageUrl: m.imageUrl,
      sellerName: 'Bakso Qu 1.0 (UsahaQu)',
      sellerBlock: 'Blok A No. 12',
      rating: 4.9,
      soldCount: 35 + idx * 12,
      stock: 20,
      isFromUsahaQu: true,
      badge: idx === 0 ? 'Star Seller' : 'Terlaris'
    }));

    // 2. Extra Community Citizen Products
    const communityProducts: MarketplaceProduct[] = [
      {
        id: 'comm-1',
        name: 'Sambal Cumi Asin Juara Bu RT',
        category: 'kuliner',
        price: 28000,
        originalPrice: 35000,
        description: 'Sambal cumi pedas gurih tanpa pengawet kemasan toples 150gr, tahan 1 bulan.',
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80',
        sellerName: 'Dapur Bu RT Ahmad',
        sellerBlock: 'Blok A No. 01',
        rating: 5.0,
        soldCount: 88,
        stock: 12,
        badge: 'Favorit RT'
      },
      {
        id: 'comm-2',
        name: 'Keripik Tempe Renyah Pak Hendra',
        category: 'kuliner',
        price: 15000,
        originalPrice: 18000,
        description: 'Keripik tempe kedelai lokal renyah dengan daun jeruk harum. Isi 250gr.',
        imageUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=500&q=80',
        sellerName: 'Pak Hendra (Sekretaris RT)',
        sellerBlock: 'Blok B No. 04',
        rating: 4.8,
        soldCount: 42,
        stock: 25,
        badge: 'Diskon 17%'
      },
      {
        id: 'comm-3',
        name: 'Sayur Bayam & Kangkung Hidroponik',
        category: 'sembako',
        price: 7000,
        originalPrice: 9000,
        description: 'Panen pagi hari segar tanpa pestisida dari kebun hidroponik lorong RT 03.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80',
        sellerName: 'KWT Melati RT 03',
        sellerBlock: 'Taman Blok C',
        rating: 4.9,
        soldCount: 110,
        stock: 18,
        badge: 'Organik'
      },
      {
        id: 'comm-4',
        name: 'Madu Randu Asli Hutan Jawa 350ml',
        category: 'sembako',
        price: 65000,
        originalPrice: 80000,
        description: 'Madu murni alami tanpa campuran, baik untuk imunitas keluarga.',
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=500&q=80',
        sellerName: 'Pak Danu Herbal',
        sellerBlock: 'Blok D No. 08',
        rating: 5.0,
        soldCount: 29,
        stock: 8,
        badge: '100% Asli'
      },
      {
        id: 'comm-5',
        name: 'Jasa Servis AC & Cuci Rumah',
        category: 'jasa',
        price: 60000,
        originalPrice: 75000,
        description: 'Cuci AC 0.5 - 2 PK bersih bergaransi oleh teknisi warga RT 03 berpengalaman.',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=500&q=80',
        sellerName: 'Mas Joko AC',
        sellerBlock: 'Blok C No. 02',
        rating: 4.9,
        soldCount: 65,
        stock: 99,
        badge: 'Garansi'
      }
    ];

    return [...usahaQuProducts, ...communityProducts];
  }, [menuList]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'usahaqu'
          ? p.isFromUsahaQu
          : p.category === selectedCategory;

      const matchSearch = searchQuery.trim()
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Total items in cart
  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart Calculations
  const selectedCartItems = useMemo(() => cart.filter(i => i.selected), [cart]);
  const cartSubtotal = useMemo(() => {
    return selectedCartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }, [selectedCartItems]);

  const deliveryFee = 0; // Bebas Ongkir Antar Blok RT 03
  const finalTotal = cartSubtotal + deliveryFee;

  // Add to cart handler
  const handleAddToCart = (product: MarketplaceProduct, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1, selected: true } : item
        );
      }
      return [...prev, { product, quantity: 1, selected: true }];
    });
    showNotification(`"${product.name}" masuk ke keranjang`);
  };

  // Cart controls
  const handleUpdateQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleToggleSelect = (productId: string) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleToggleSelectAll = () => {
    const allSelected = cart.every(i => i.selected);
    setCart(prev => prev.map(i => ({ ...i, selected: !allSelected })));
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
    showNotification('Item dihapus dari keranjang');
  };

  // =========================================================================
  // CLIENT-SIDE PHOTO COMPRESSION LOGIC (HTML Canvas)
  // =========================================================================
  const processImageFile = (file: File) => {
    setOriginalSizeKB(Math.round(file.size / 1024));
    setIsCompressing(true);

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions (max 800px width/height for fast loading & light memory)
        let width = img.width;
        let height = img.height;
        const maxDimension = 800;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.65 quality (ultra light, < 100KB)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          setCompressedImage(dataUrl);

          // Calculate compressed size in KB
          const stringLength = dataUrl.length - 'data:image/jpeg;base64,'.length;
          const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383;
          setCompressedSizeKB(Math.round(sizeInBytes / 1024));
          setIsCompressing(false);
          showNotification('Foto berhasil dikompresi otomatis!');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Save new product and publish to UsahaQu & MuamalahQu
  const handlePublishNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) {
      showNotification('Mohon lengkapi nama dan harga produk');
      return;
    }

    const priceNum = parseInt(newProdPrice.replace(/\D/g, ''), 10) || 0;
    const finalImage =
      compressedImage ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80';

    // Create item for UsahaQu
    const newMenuItem: MenuItem = {
      id: `menu-custom-${Date.now()}`,
      name: newProdName.trim(),
      category: 'pelengkap',
      price: priceNum,
      description: newProdDesc.trim() || `Produk UMKM warga RT 03 (${newProdBlock}).`,
      imageUrl: finalImage,
      isAvailable: true
    };

    // Update global state & storage
    const updatedMenu = [newMenuItem, ...menuList];
    setMenuList(updatedMenu);
    StorageService.saveMenu(updatedMenu);

    showNotification(`"${newProdName}" berhasil diterbitkan ke UsahaQu & MuamalahQu!`);
    setShowAddProductModal(false);

    // Reset Form
    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    setCompressedImage(null);
    setOriginalSizeKB(0);
    setCompressedSizeKB(0);
  };

  // Checkout order
  const handleCheckout = () => {
    if (selectedCartItems.length === 0) {
      showNotification('Pilih setidaknya 1 item untuk checkout');
      return;
    }

    setShowOrderSuccessModal(true);
    // Remove checked out items from cart
    setCart(prev => prev.filter(i => !i.selected));
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-[#f4f4f4] font-sans select-none text-slate-800">
      
      {/* ========================================================================= */}
      {/* 1. SHOPEE-STYLE TOP APP BAR & HEADER */}
      {/* ========================================================================= */}
      <header className="bg-gradient-to-r from-[#ee4d2d] via-[#f94e2f] to-[#ff5722] text-white px-3 pt-10 sm:pt-11 pb-2.5 flex flex-col gap-2 shadow-md z-30 shrink-0 android-header-safe">
        <div className="flex items-center gap-2">
          {/* Back to WargaQu Dashboard */}
          <button
            onClick={onBackToMain}
            className="p-1 rounded-full hover:bg-black/10 active:scale-95 transition"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {/* Shopee-style Search Box */}
          <div className="flex-1 bg-white rounded-lg flex items-center px-2.5 py-1.5 shadow-inner">
            <Search className="w-4 h-4 text-[#ee4d2d] mr-1.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari di MuamalahQu RT 03..."
              className="bg-transparent flex-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="text-[#ee4d2d] hover:opacity-80 transition"
                title="Foto Langsung"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Cart Icon with Counter Badge */}
          <button
            onClick={() => setActiveTab('cart')}
            className="relative p-1.5 hover:bg-black/10 rounded-full active:scale-95 transition"
            title="Keranjang Belanja"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {totalCartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-yellow-300 text-[#ee4d2d] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Chat Link (ChatQu) */}
          <button
            onClick={() => {
              if (onOpenChatQu) onOpenChatQu();
              else showNotification('Membuka Chat Warga...');
            }}
            className="p-1.5 hover:bg-black/10 rounded-full active:scale-95 transition"
            title="Chat Penjual / ChatQu"
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </button>

          {/* Store Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-1.5 rounded-full transition ${
              activeTab === 'settings' ? 'bg-white/20' : 'hover:bg-black/10'
            }`}
            title="Pengaturan Toko"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Location & Quick Citizen Benefit Bar */}
        <div className="flex justify-between items-center text-[10px] text-orange-100 font-medium px-1">
          <div className="flex items-center gap-1 truncate max-w-[220px]">
            <MapPin className="w-3 h-3 text-yellow-300 shrink-0" />
            <span>Kirim ke: <b>Blok A No. 12 (RT 03 / RW 05)</b></span>
          </div>
          <div className="flex items-center gap-1 font-bold text-yellow-200">
            <Truck className="w-3 h-3" />
            <span>Bebas Ongkir Sekampung</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT: MARKETPLACE VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'market' && (
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-6 bg-[#f4f4f4] space-y-2.5">
          
          {/* A. FLASH SALE SHOPEE BANNER */}
          <div className="bg-white p-3 shadow-xs border-b border-orange-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="bg-[#ee4d2d] text-white font-black text-xs px-2 py-0.5 rounded italic tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                  FLASH SALE
                </span>
                <span className="text-[11px] font-bold text-slate-700">Warga RT 03</span>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-white">
                <span className="bg-slate-900 px-1 py-0.2 rounded text-[10px]">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-slate-800 font-bold">:</span>
                <span className="bg-slate-900 px-1 py-0.2 rounded text-[10px]">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-slate-800 font-bold">:</span>
                <span className="bg-[#ee4d2d] px-1 py-0.2 rounded text-[10px]">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Banner Promotional Graphic */}
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 rounded-xl p-3 text-white flex items-center justify-between shadow-xs">
              <div className="space-y-1">
                <div className="inline-block bg-white/20 backdrop-blur-xs text-yellow-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Katalog Terhubung Langsung ke UsahaQu
                </div>
                <h3 className="text-sm font-extrabold leading-tight">
                  Makan Enak & Belanja Hemat Sesama Tetangga
                </h3>
                <p className="text-[10px] text-orange-100">
                  COD Bayar Pas Ketemu di Portal / Rumah Penjual
                </p>
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="bg-white text-[#ee4d2d] hover:bg-yellow-100 active:scale-95 text-xs font-black px-3 py-2 rounded-lg shadow transition shrink-0 flex flex-col items-center leading-tight"
              >
                <Plus className="w-4 h-4 mb-0.5" />
                <span>+ Jual Produk</span>
              </button>
            </div>
          </div>

          {/* B. CATEGORY FILTER PILLS (SHOPEE STYLE) */}
          <div className="bg-white py-2 px-3 shadow-xs border-y border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'Semua Produk' },
              { id: 'usahaqu', label: '🍜 UsahaQu (Bakso Qu)' },
              { id: 'kuliner', label: '🍛 Kuliner Warga' },
              { id: 'sembako', label: '🌾 Sembako & Sayur' },
              { id: 'jasa', label: '🛠️ Jasa & Servis' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-[#ee4d2d] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* C. PRODUCT CATALOG GRID (2 COLUMNS - SHOPEE STYLE) */}
          <div className="px-2.5">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-xs font-bold text-slate-700">
                Katalog Produk ({filteredProducts.length})
              </span>
              <button
                onClick={() => setShowAddProductModal(true)}
                className="text-[11px] font-bold text-[#ee4d2d] flex items-center gap-1 hover:underline"
              >
                <Camera className="w-3.5 h-3.5" />
                Foto & Jual
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition group"
                >
                  {/* Product Image Container */}
                  <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Badge Shopee Style */}
                    {product.badge && (
                      <span className="absolute top-1 left-1 bg-[#ee4d2d] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-xs shadow-xs">
                        {product.badge}
                      </span>
                    )}

                    {product.isFromUsahaQu && (
                      <span className="absolute bottom-1 left-1 bg-emerald-700 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                        UsahaQu POS
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug mb-1">
                        {product.name}
                      </h4>

                      {/* Price Section */}
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-[10px] font-bold text-[#ee4d2d]">Rp</span>
                        <span className="text-sm font-black text-[#ee4d2d] font-mono">
                          {product.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {/* Original Price / Strikethrough */}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-[10px] text-slate-400 line-through">
                          Rp {product.originalPrice.toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>

                    {/* Seller & Rating Footer */}
                    <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 mr-0.5" />
                          {product.rating}
                        </span>
                        <span>Terjual {product.soldCount}</span>
                      </div>

                      <div className="text-[9px] text-slate-400 truncate flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">{product.sellerBlock}</span>
                      </div>

                      {/* Add To Cart Button */}
                      <button
                        onClick={e => handleAddToCart(product, e)}
                        className="w-full mt-1.5 bg-[#ee4d2d] hover:bg-[#d63f21] active:scale-95 text-white py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>+ Keranjang</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-xs mt-4">
                Tidak ada produk di kategori ini.
              </div>
            )}
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 3. BODY CONTENT: KERANJANG BELANJA (SHOPEE STYLE) */}
      {/* ========================================================================= */}
      {activeTab === 'cart' && (
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-[#f4f4f4] flex flex-col justify-between">
          <div className="p-3 space-y-3">
            {/* Header Keranjang */}
            <div className="bg-white rounded-xl p-3 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cart.length > 0 && cart.every(i => i.selected)}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 text-[#ee4d2d] rounded accent-[#ee4d2d]"
                />
                <span className="text-xs font-bold text-slate-800">
                  Pilih Semua ({cart.length} item)
                </span>
              </div>
              <button
                onClick={() => setActiveTab('market')}
                className="text-xs font-bold text-[#ee4d2d] hover:underline"
              >
                + Tambah Belanja
              </button>
            </div>

            {/* List of Cart Items */}
            {cart.length > 0 ? (
              <div className="space-y-2">
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className="bg-white rounded-xl p-3 shadow-xs border border-slate-100 flex items-center gap-2.5"
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => handleToggleSelect(item.product.id)}
                      className="w-4 h-4 text-[#ee4d2d] rounded accent-[#ee4d2d]"
                    />

                    {/* Thumbnail */}
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {item.product.sellerName} ({item.product.sellerBlock})
                      </p>
                      <div className="text-xs font-extrabold text-[#ee4d2d] font-mono mt-0.5">
                        Rp {item.product.price.toLocaleString('id-ID')}
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                          <button
                            onClick={() => handleUpdateQty(item.product.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.product.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center space-y-3 shadow-xs">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">Keranjang Warga Masih Kosong</h3>
                <p className="text-xs text-slate-400">
                  Yuk belanja makanan atau kebutuhan warga lainnya di MuamalahQu!
                </p>
                <button
                  onClick={() => setActiveTab('market')}
                  className="px-4 py-2 bg-[#ee4d2d] text-white rounded-xl text-xs font-bold shadow hover:bg-[#d63f21] transition"
                >
                  Belanja Sekarang
                </button>
              </div>
            )}

            {/* OPSI PENGIRIMAN & PEMBAYARAN WARGA */}
            {cart.length > 0 && (
              <div className="bg-white rounded-xl p-3 shadow-xs space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#ee4d2d]" />
                    Pilih Metode Pengiriman Warga:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDeliveryOption('cod')}
                      className={`p-2 rounded-lg border text-center font-semibold transition ${
                        deliveryOption === 'cod'
                          ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      COD Antar Rumah
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryOption('pickup')}
                      className={`p-2 rounded-lg border text-center font-semibold transition ${
                        deliveryOption === 'pickup'
                          ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Ambil Sendiri
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryOption('pos_ronda')}
                      className={`p-2 rounded-lg border text-center font-semibold transition ${
                        deliveryOption === 'pos_ronda'
                          ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Titip Pos Ronda
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#ee4d2d]" />
                    Pilih Metode Pembayaran:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPaymentOption('wargapay')}
                      className={`p-2 rounded-lg border text-center font-semibold transition ${
                        paymentOption === 'wargapay'
                          ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      WargaPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('cash')}
                      className={`p-2 rounded-lg border text-center font-semibold transition ${
                        paymentOption === 'cash'
                          ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Tunai / COD
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOption('qris')}
                      className={`p-2 rounded-lg border text-center font-semibold transition ${
                        paymentOption === 'qris'
                          ? 'border-[#ee4d2d] bg-orange-50 text-[#ee4d2d]'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      QRIS RT
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Catatan pesanan (contoh: Kuah dipisah, pedas sedang)..."
                    className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* CHECKOUT FLOATING FOOTER */}
          {cart.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 shadow-lg flex items-center justify-between z-20">
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">Total Pembayaran:</span>
                <div className="text-base font-black text-[#ee4d2d] font-mono">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </div>
                <span className="text-[9px] text-emerald-600 font-bold">
                  Bebas Ongkir ({selectedCartItems.length} item)
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={selectedCartItems.length === 0}
                className="bg-[#ee4d2d] hover:bg-[#d63f21] disabled:bg-slate-300 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition"
              >
                Checkout Sekarang
              </button>
            </div>
          )}
        </main>
      )}

      {/* ========================================================================= */}
      {/* 4. BODY CONTENT: PENGATURAN TOKO (SETTING TOKO WARGA) */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 pb-6 bg-[#f4f4f4] space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#ee4d2d] flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{settings.storeName}</h3>
                <p className="text-xs text-slate-400">{settings.ownerName} • {settings.blockAddress}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('market')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Tutup
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-white rounded-xl p-4 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Profil Toko & Kontak
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Toko Warga:</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Pemilik:</label>
                <input
                  type="text"
                  value={settings.ownerName}
                  onChange={e => setSettings({ ...settings, ownerName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nomor WhatsApp Toko:</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Lokasi Rumah / Blok:</label>
                <input
                  type="text"
                  value={settings.blockAddress}
                  onChange={e => setSettings({ ...settings, blockAddress: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Status Toko & Opsi Pengantaran
              </h4>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-700 font-medium">Status Toko Buka (Terima Pesanan):</span>
                <input
                  type="checkbox"
                  checked={settings.isOpen}
                  onChange={e => setSettings({ ...settings, isOpen: e.target.checked })}
                  className="w-4 h-4 accent-[#ee4d2d]"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-700 font-medium">Bebas Ongkir COD Antar Rumah RT:</span>
                <input
                  type="checkbox"
                  checked={settings.enableCod}
                  onChange={e => setSettings({ ...settings, enableCod: e.target.checked })}
                  className="w-4 h-4 accent-[#ee4d2d]"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-700 font-medium">Terima Ambil di Rumah Penjual:</span>
                <input
                  type="checkbox"
                  checked={settings.enablePickup}
                  onChange={e => setSettings({ ...settings, enablePickup: e.target.checked })}
                  className="w-4 h-4 accent-[#ee4d2d]"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-slate-700 font-medium">Bisa Titip Pesanan di Pos Ronda:</span>
                <input
                  type="checkbox"
                  checked={settings.enableSecurityDrop}
                  onChange={e => setSettings({ ...settings, enableSecurityDrop: e.target.checked })}
                  className="w-4 h-4 accent-[#ee4d2d]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                ID / Rekening QRIS Pembayaran Toko:
              </label>
              <input
                type="text"
                value={settings.qrisNumber}
                onChange={e => setSettings({ ...settings, qrisNumber: e.target.value })}
                className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#ee4d2d] hover:bg-[#d63f21] text-white font-bold py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
            >
              Simpan Pengaturan Toko
            </button>
          </form>
        </main>
      )}

      {/* ========================================================================= */}
      {/* 5. BOTTOM NAVIGATION BAR (SHOPEE STYLE) */}
      {/* ========================================================================= */}
      <nav className="bg-white border-t border-slate-200 px-4 pt-2 pb-6 sm:pb-7 flex justify-around items-center z-30 shrink-0 shadow-xl android-navbar-safe">
        <button
          onClick={() => setActiveTab('market')}
          className={`flex flex-col items-center gap-0.5 text-xs font-bold transition ${
            activeTab === 'market' ? 'text-[#ee4d2d]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Store className="w-5 h-5" />
          <span className="text-[10px]">Belanja</span>
        </button>

        <button
          onClick={() => setShowAddProductModal(true)}
          className="flex flex-col items-center gap-0.5 text-xs font-bold text-slate-400 hover:text-[#ee4d2d] transition"
        >
          <Camera className="w-5 h-5 text-[#ee4d2d]" />
          <span className="text-[10px] text-[#ee4d2d]">+ Jual Cepat</span>
        </button>

        <button
          onClick={() => setActiveTab('cart')}
          className={`relative flex flex-col items-center gap-0.5 text-xs font-bold transition ${
            activeTab === 'cart' ? 'text-[#ee4d2d]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {totalCartCount > 0 && (
            <span className="absolute -top-1 right-2 bg-[#ee4d2d] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {totalCartCount}
            </span>
          )}
          <span className="text-[10px]">Keranjang</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-0.5 text-xs font-bold transition ${
            activeTab === 'settings' ? 'text-[#ee4d2d]' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Toko Saya</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 6. MODAL: TAMBAH PRODUK + FOTO LANGSUNG KOMPRES */}
      {/* ========================================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar p-4 space-y-3 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-100 text-[#ee4d2d] rounded-lg">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Jual Produk Baru</h3>
                  <p className="text-[10px] text-slate-400">Foto Langsung & Kompres Otomatis</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden File & Camera Inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image Preview & Compression Stats */}
            <div className="space-y-2">
              {compressedImage ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-orange-200 bg-slate-50">
                  <img
                    src={compressedImage}
                    alt="Preview Terkompresi"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-xs text-white p-2 rounded-lg text-[10px] flex justify-between items-center">
                    <div>
                      <span className="text-slate-300 block">Ukuran Asli: {originalSizeKB} KB</span>
                      <span className="text-green-300 font-bold">
                        Terkompresi: {compressedSizeKB} KB
                      </span>
                    </div>
                    <span className="bg-green-500 text-slate-900 font-black px-1.5 py-0.5 rounded text-[9px]">
                      Hemat {Math.max(0, Math.round(((originalSizeKB - compressedSizeKB) / (originalSizeKB || 1)) * 100))}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-orange-200 bg-orange-50/50 rounded-xl p-4 text-center space-y-2">
                  <div className="w-10 h-10 bg-white text-[#ee4d2d] rounded-full mx-auto flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">Ambil Foto atau Unggah</h4>
                    <p className="text-[10px] text-slate-400">
                      Foto otomatis dikompres agar hemat kuota & ringan dibuka warga
                    </p>
                  </div>
                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#ee4d2d] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-[#d63f21]"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Kamera Langsung
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50"
                    >
                      Galeri Foto
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Product Details Form */}
            <form onSubmit={handlePublishNewProduct} className="space-y-2.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Produk / Makanan:</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  placeholder="Contoh: Sambal Roa Khas Manado / Kue Lapis"
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kategori:</label>
                  <select
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d] bg-white"
                  >
                    <option value="kuliner">Kuliner & Makanan</option>
                    <option value="sembako">Sembako & Dapur</option>
                    <option value="jasa">Jasa & Keahlian</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Harga (Rp):</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    placeholder="25000"
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nama Penjual:</label>
                  <input
                    type="text"
                    value={newProdSeller}
                    onChange={e => setNewProdSeller(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lokasi Rumah:</label>
                  <input
                    type="text"
                    value={newProdBlock}
                    onChange={e => setNewProdBlock(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Deskripsi Singkat:</label>
                <textarea
                  value={newProdDesc}
                  onChange={e => setNewProdDesc(e.target.value)}
                  placeholder="Keterangan porsi, bahan, atau garansi..."
                  rows={2}
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#ee4d2d]"
                />
              </div>

              <button
                type="submit"
                disabled={isCompressing}
                className="w-full bg-[#ee4d2d] hover:bg-[#d63f21] disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
              >
                {isCompressing ? 'Mengompres Foto...' : 'Terbitkan ke MuamalahQu & UsahaQu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: ORDER SUCCESS / STRUK PESANAN WARGA */}
      {/* ========================================================================= */}
      {showOrderSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xs p-5 text-center space-y-3 shadow-2xl animate-in zoom-in duration-200">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-800">Pesanan Diterima!</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nomor Pesanan: <span className="font-mono font-bold text-slate-700">#MQ-{Date.now().toString().slice(-6)}</span>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-left text-xs space-y-1.5 border border-slate-100 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Pengiriman:</span>
                <span className="font-bold text-slate-700 uppercase">{deliveryOption}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pembayaran:</span>
                <span className="font-bold text-slate-700 uppercase">{paymentOption}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-500 font-bold">Total:</span>
                <span className="font-bold text-[#ee4d2d]">Rp {finalTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Penjual tetangga telah menerima notifikasi dan akan segera mengantarkan pesanan Anda.
            </p>

            <button
              onClick={() => {
                setShowOrderSuccessModal(false);
                setActiveTab('market');
                showNotification('Pesanan berhasil dibuat!');
              }}
              className="w-full bg-[#ee4d2d] text-white font-bold py-2 rounded-xl text-xs shadow hover:bg-[#d63f21] transition"
            >
              Kembali Belanja
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
