import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Store,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  Mic,
  MicOff,
  Sparkles,
  Receipt,
  FileText,
  CreditCard,
  Banknote,
  Clock,
  Send,
  X,
  Edit3,
  TrendingUp,
  Wallet,
  RotateCcw,
  CheckCircle2,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Headphones,
  ShieldCheck
} from 'lucide-react';
import {
  ModularProduct,
  ModularExpense,
  ModularTransaction,
  ModularCartItem,
  ModularProfile,
  UserAccount
} from '../../types';
import { AuthService } from '../../services/auth';

interface ModularQuViewProps {
  onBackToWarga: () => void;
  onOpenBaksoQu?: () => void;
  onOpenBantuan?: () => void;
  showNotification: (msg: string) => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
}

const DEFAULT_MODULAR_PROFILE: ModularProfile = {
  bizName: "UsahaQu POS Modular",
  bizType: "F&B / Kuliner",
  address: "Sentra Kuliner & UMKM RT 03 / RW 05",
  phone: "0812-3456-7890",
  footer: "Terima Kasih Atas Kunjungan Anda! Berkah Berlimpah."
};

const DEFAULT_MODULAR_PRODUCTS: ModularProduct[] = [];

export const ModularQuView: React.FC<ModularQuViewProps> = ({
  onBackToWarga,
  onOpenBaksoQu,
  onOpenBantuan,
  showNotification,
  currentUser,
  onOpenSecurityModal,
}) => {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'pos' | 'produk' | 'modal' | 'profil' | 'omset'>('pos');

  // Persistence States
  const [profile, setProfile] = useState<ModularProfile>(() => {
    try {
      const saved = localStorage.getItem('uq_profile');
      return saved ? JSON.parse(saved) : DEFAULT_MODULAR_PROFILE;
    } catch {
      return DEFAULT_MODULAR_PROFILE;
    }
  });

  const [products, setProducts] = useState<ModularProduct[]>(() => {
    try {
      const saved = localStorage.getItem('uq_products');
      if (saved) {
        const parsed: ModularProduct[] = JSON.parse(saved);
        // Bersihkan mock produk bawaan lama jika pernah tersimpan
        const clean = parsed.filter((p) => !['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].includes(p.id));
        if (clean.length !== parsed.length) {
          localStorage.setItem('uq_products', JSON.stringify(clean));
        }
        return clean;
      }
      return DEFAULT_MODULAR_PRODUCTS;
    } catch {
      return DEFAULT_MODULAR_PRODUCTS;
    }
  });

  const [expenses, setExpenses] = useState<ModularExpense[]>(() => {
    try {
      const saved = localStorage.getItem('uq_expenses');
      if (saved) {
        const parsed: ModularExpense[] = JSON.parse(saved);
        const clean = parsed.filter((e) => e.id !== 'e1');
        if (clean.length !== parsed.length) {
          localStorage.setItem('uq_expenses', JSON.stringify(clean));
        }
        return clean;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [transactions, setTransactions] = useState<ModularTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('uq_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cart & POS State
  const [cart, setCart] = useState<ModularCartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePayMethod, setActivePayMethod] = useState<'Tunai' | 'QRIS / Transfer' | 'Tempo / Utang'>('Tunai');
  const [posNote, setPosNote] = useState<string>('');
  const [payAmountInput, setPayAmountInput] = useState<string>('');

  // Receipt Preview & Modal States
  type ReceiptFormat = 'thermal' | 'nota' | 'kwitansi' | 'faktur';
  const [previewFormat, setPreviewFormat] = useState<ReceiptFormat>('thermal');
  const [receiptModalTx, setReceiptModalTx] = useState<ModularTransaction | null>(null);
  const [modalReceiptFormat, setModalReceiptFormat] = useState<ReceiptFormat>('thermal');

  // Product Add/Edit Modal
  const [isProdModalOpen, setIsProdModalOpen] = useState<boolean>(false);
  const [editingProd, setEditingProd] = useState<Partial<ModularProduct> | null>(null);

  // Manual Expense State
  const [expDesc, setExpDesc] = useState<string>('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expCategory, setExpCategory] = useState<string>('Bahan Baku');

  // Speech Recognition States
  const [isListening, setIsListening] = useState<boolean>(false);
  const [sttTarget, setSttTarget] = useState<'pos' | 'prod' | 'exp'>('pos');
  const [posVoiceText, setPosVoiceText] = useState<string>('');
  const [prodVoiceText, setProdVoiceText] = useState<string>('');
  const [expVoiceText, setExpVoiceText] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // References for latest state to handle Android / Browser hardware Back Button
  const activeTabRef = useRef(activeTab);
  const receiptModalTxRef = useRef(receiptModalTx);
  const isProdModalOpenRef = useRef(isProdModalOpen);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    receiptModalTxRef.current = receiptModalTx;
  }, [receiptModalTx]);

  useEffect(() => {
    isProdModalOpenRef.current = isProdModalOpen;
  }, [isProdModalOpen]);

  // Setiap kali pindah tab, masukkan ke history browser
  const switchTab = (tabName: 'pos' | 'produk' | 'modal' | 'profil' | 'omset', pushHistory = true) => {
    setActiveTab(tabName);
    if (pushHistory) {
      window.history.pushState({ tab: tabName }, '', '#' + tabName);
    }
  };

  const tutupStruk = () => {
    setReceiptModalTx(null);
  };

  const bukaStruk = (tx: ModularTransaction) => {
    setReceiptModalTx(tx);
    setModalReceiptFormat('thermal');
    window.history.pushState({ modal: 'struk' }, '', '#modal-struk');
  };

  const openProductModal = (prod: Partial<ModularProduct> | null) => {
    setEditingProd(prod);
    setIsProdModalOpen(true);
    window.history.pushState({ modal: 'produk' }, '', '#modal-produk');
  };

  const closeProductModal = () => {
    setIsProdModalOpen(false);
    setEditingProd(null);
  };

  // Tangani tombol Back HP / Browser
  useEffect(() => {
    // Saat aplikasi pertama kali dimuat, inisialisasi state awal
    window.history.replaceState({ tab: 'pos' }, '', '#pos');

    const handleBackButton = () => {
      // 1. Cek apakah ada modal atau struk yang sedang terbuka
      const modalStruk = document.getElementById('modalStruk');
      if (modalStruk && !modalStruk.classList.contains('hidden')) {
        // Jika struk terbuka, tutup struknya dulu (bukan keluar app)
        tutupStruk();
        return;
      }

      const modalProduk = document.getElementById('modalProduk');
      if (modalProduk && !modalProduk.classList.contains('hidden')) {
        closeProductModal();
        return;
      }

      if (receiptModalTxRef.current) {
        tutupStruk();
        return;
      }

      if (isProdModalOpenRef.current) {
        closeProductModal();
        return;
      }

      // 2. Jika sedang di tab selain kasir (misal: produk, modal, omset, profil),
      // kembalikan ke tab Kasir terlebih dahulu sebelum keluar.
      if (activeTabRef.current !== 'pos') {
        switchTab('pos', false);
        return;
      }

      // 3. Jika sudah di tab Kasir dan tidak ada modal,
      // kembali ke beranda WargaQu
      onBackToWarga();
    };

    const onPopState = () => {
      handleBackButton();
    };

    window.addEventListener('popstate', onPopState);

    // Listener tombol Back hardware Android via Capacitor
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
      window.removeEventListener('popstate', onPopState);
      if (capHandle?.remove) {
        capHandle.remove();
      }
    };
  }, [onBackToWarga]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('uq_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('uq_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('uq_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('uq_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (sttTarget === 'pos') {
            setPosVoiceText(transcript);
          } else if (sttTarget === 'prod') {
            setProdVoiceText(transcript);
          } else if (sttTarget === 'exp') {
            setExpVoiceText(transcript);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech Recognition error:', e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Could not initialize speech recognition:', err);
      }
    }
  }, [sttTarget]);

  // Toggle Voice Recognition
  const toggleSTT = (target: 'pos' | 'prod' | 'exp') => {
    setSttTarget(target);
    if (!recognitionRef.current) {
      showNotification('Web Speech API tidak didukung pada browser ini. Gunakan tombol demo input suara.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition start failed:', err);
        setIsListening(false);
      }
    }
  };

  // Process Voice POS Input
  const handleProcessVoicePOS = (customText?: string) => {
    const input = (customText || posVoiceText).toLowerCase().trim();
    if (!input) {
      showNotification('Sebutkan pesanan terlebih dahulu!');
      return;
    }

    let matchedCount = 0;
    const newCart = [...cart];

    products.forEach((p) => {
      const nameLower = p.name.toLowerCase();
      // Match full name or partial main keyword
      const mainWords = nameLower.split(' ').filter((w) => w.length > 2);
      const isMatched = input.includes(nameLower) || mainWords.some((w) => input.includes(w));

      if (isMatched) {
        let qty = 1;
        const words = input.split(' ');
        const idx = words.findIndex((w) => nameLower.includes(w));
        if (idx > 0 && !isNaN(parseInt(words[idx - 1]))) {
          qty = parseInt(words[idx - 1]);
        }

        const existing = newCart.find((item) => item.id === p.id);
        if (existing) {
          existing.qty += qty;
        } else {
          newCart.push({
            id: p.id,
            name: p.name,
            price: p.price,
            cost: p.cost,
            qty: qty
          });
        }
        matchedCount++;
      }
    });

    // Check for table note
    if (input.includes('meja')) {
      const parts = input.split('meja');
      if (parts[1]) {
        const tableNo = parts[1].trim().split(' ')[0];
        setPosNote(`Meja ${tableNo}`);
      }
    }

    if (matchedCount > 0) {
      setCart(newCart);
      showNotification(`Voice AI: ${matchedCount} produk masuk keranjang!`);
    } else {
      showNotification('Item tidak cocok dengan nama di etalase katalog.');
    }
  };

  // Process Voice Product Creation
  const handleProcessVoiceProduct = () => {
    const input = prodVoiceText.trim();
    if (!input) {
      showNotification('Ketik atau rekam suara produk terlebih dahulu!');
      return;
    }

    const nameMatch = input.match(/^(.*?)(?=modal|jual|harga|stok|$)/i);
    const costMatch = input.match(/modal\s*(\d+)/i);
    const priceMatch = input.match(/(?:jual|harga)\s*(\d+)/i);
    const stockMatch = input.match(/stok\s*(\d+)/i);

    const name = nameMatch && nameMatch[1].trim() ? nameMatch[1].trim() : input;
    const cost = costMatch ? parseInt(costMatch[1]) : 0;
    const price = priceMatch ? parseInt(priceMatch[1]) : 10000;
    const stock = stockMatch ? parseInt(stockMatch[1]) : 50;

    const newProd: ModularProduct = {
      id: 'p_' + Date.now(),
      name,
      category: 'Umum',
      cost,
      price,
      stock
    };

    setProducts((prev) => [newProd, ...prev]);
    setProdVoiceText('');
    showNotification(`Produk '${name}' dibuat via Voice AI!`);
  };

  // Process Voice Expense Creation
  const handleProcessVoiceExpense = () => {
    const input = expVoiceText.trim();
    if (!input) {
      showNotification('Ketik atau sebutkan pengeluaran terlebih dahulu!');
      return;
    }

    const numMatch = input.match(/\d+/);
    const amount = numMatch ? parseInt(numMatch[0]) : 0;
    const desc = input.replace(/\d+/g, '').replace(/rp|rupiah/gi, '').trim();

    if (amount <= 0) {
      showNotification('Nominal biaya tidak terdeteksi.');
      return;
    }

    const newExp: ModularExpense = {
      id: 'e_' + Date.now(),
      desc: desc || 'Pengeluaran Suara AI',
      amount,
      category: 'Operasional',
      date: new Date().toLocaleDateString('id-ID')
    };

    setExpenses((prev) => [newExp, ...prev]);
    setExpVoiceText('');
    showNotification(`Pengeluaran Rp ${amount.toLocaleString('id-ID')} dicatat!`);
  };

  // Cart Helpers
  const addToCart = (product: ModularProduct, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          cost: product.cost,
          qty
        }
      ];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            return { ...item, qty: item.qty + delta };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Barcode Scan Simulation
  const handleSimulateBarcode = () => {
    if (products.length === 0) return;
    const randomProd = products[Math.floor(Math.random() * products.length)];
    addToCart(randomProd, 1);
    showNotification(`[Barcode Scan] Berhasil: ${randomProd.name}`);
  };

  // Process Final Payment
  const handleFinalPayment = () => {
    if (cart.length === 0) {
      showNotification('Keranjang belanja masih kosong!');
      return;
    }

    const total = totalCartPrice;
    const totalCost = cart.reduce((sum, item) => sum + item.cost * item.qty, 0);
    const parsedPay = parseInt(payAmountInput);
    const payAmount = activePayMethod === 'Tunai' ? (parsedPay || total) : total;

    const newTx: ModularTransaction = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      date:
        new Date().toLocaleDateString('id-ID') +
        ' ' +
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      items: [...cart],
      total,
      totalCost,
      payAmount,
      change: Math.max(0, payAmount - total),
      payMethod: activePayMethod,
      note: posNote || 'Pelanggan Langsung'
    };

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const inCart = cart.find((c) => c.id === p.id);
        if (inCart && p.stock !== 999) {
          return { ...p, stock: Math.max(0, p.stock - inCart.qty) };
        }
        return p;
      })
    );

    // Save transaction
    setTransactions((prev) => [newTx, ...prev]);

    // Clear cart and form
    setCart([]);
    setPosNote('');
    setPayAmountInput('');

    // Open receipt modal
    bukaStruk(newTx);
    showNotification('Transaksi Berhasil! Struk siap dicetak.');
  };

  // Add Manual Expense
  const handleAddManualExpense = () => {
    const amount = parseInt(expAmount);
    if (!expDesc.trim() || isNaN(amount) || amount <= 0) {
      showNotification('Keterangan & Nominal harus diisi dengan benar!');
      return;
    }

    const newExp: ModularExpense = {
      id: 'e_' + Date.now(),
      desc: expDesc.trim(),
      amount,
      category: expCategory,
      date: new Date().toLocaleDateString('id-ID')
    };

    setExpenses((prev) => [newExp, ...prev]);
    setExpDesc('');
    setExpAmount('');
    showNotification('Pengeluaran berhasil dicatat!');
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = () => {
    if (!editingProd?.name?.trim()) {
      showNotification('Nama produk wajib diisi!');
      return;
    }

    const cost = Number(editingProd.cost) || 0;
    const price = Number(editingProd.price) || 0;
    const stock = Number(editingProd.stock) || 0;
    const category = editingProd.category?.trim() || 'Umum';

    if (editingProd.id) {
      // Edit
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProd.id
            ? { ...p, name: editingProd.name!, category, cost, price, stock }
            : p
        )
      );
      showNotification('Produk berhasil diperbarui!');
    } else {
      // Create
      const newP: ModularProduct = {
        id: 'p_' + Date.now(),
        name: editingProd.name!,
        category,
        cost,
        price,
        stock
      };
      setProducts((prev) => [newP, ...prev]);
      showNotification('Produk baru berhasil ditambahkan!');
    }

    closeProductModal();
  };

  // Financial Metrics
  const totalOmset = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalHPP = transactions.reduce((sum, t) => sum + (t.totalCost || 0), 0);
  const labaBersih = totalOmset - totalPengeluaran - totalHPP;

  // Render Receipt Document according to 4 standard formats
  const renderReceiptContent = (tx: ModularTransaction, format: ReceiptFormat) => {
    const line = "--------------------------------";
    const doubleLine = "================================";

    if (format === 'thermal') {
      return (
        <div className="text-zinc-950 font-mono-receipt text-xs leading-relaxed space-y-1 select-text">
          <div className="text-center font-extrabold uppercase text-sm tracking-tight">{profile.bizName}</div>
          <div className="text-center text-[10px] text-zinc-700">{profile.address}</div>
          <div className="text-center text-[10px] text-zinc-700">Telp/WA: {profile.phone}</div>
          <div className="text-center text-zinc-400 py-0.5">{line}</div>
          <div className="flex justify-between text-[11px]">
            <span>No: {tx.id}</span>
            <span>{tx.date}</span>
          </div>
          <div className="text-[11px] text-zinc-800">Ket: {tx.note}</div>
          <div className="text-center text-zinc-400 py-0.5">{line}</div>
          <div className="space-y-1">
            {tx.items.map((i, idx) => (
              <div key={idx}>
                <div className="font-bold text-[11px] text-zinc-900">{i.name}</div>
                <div className="flex justify-between text-[10px] pl-2 text-zinc-700">
                  <span>{i.qty} x Rp {i.price.toLocaleString('id-ID')}</span>
                  <span className="font-semibold">Rp {(i.qty * i.price).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center text-zinc-400 py-0.5">{line}</div>
          <div className="flex justify-between font-extrabold text-sm pt-0.5">
            <span>TOTAL:</span>
            <span>Rp {tx.total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-700">
            <span>BAYAR ({tx.payMethod}):</span>
            <span>Rp {tx.payAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-700 font-semibold">
            <span>KEMBALI:</span>
            <span>Rp {tx.change.toLocaleString('id-ID')}</span>
          </div>
          <div className="text-center text-zinc-400 py-0.5">{doubleLine}</div>
          <div className="text-center text-[10px] italic mt-2 text-zinc-600">{profile.footer}</div>
        </div>
      );
    }

    if (format === 'nota') {
      return (
        <div className="text-zinc-950 font-mono-receipt text-xs leading-relaxed space-y-2 select-text border border-zinc-300 p-3 rounded-lg">
          <div className="border-b border-zinc-300 pb-2 flex justify-between items-start">
            <div>
              <h4 className="font-extrabold text-sm uppercase">{profile.bizName}</h4>
              <p className="text-[10px] text-zinc-600">{profile.address}</p>
              <p className="text-[10px] text-zinc-600">WA: {profile.phone}</p>
            </div>
            <div className="text-right">
              <span className="bg-zinc-800 text-white text-[9px] font-bold px-2 py-0.5 rounded">NOTA KASIR</span>
              <p className="text-[10px] mt-1 text-zinc-600">{tx.id}</p>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-700">
            <span>Pelanggan/Catatan: <b>{tx.note}</b></span>
            <span>{tx.date}</span>
          </div>
          <table className="w-full text-left border-collapse text-[10px] my-2">
            <thead>
              <tr className="border-b border-zinc-400 text-zinc-800 font-bold">
                <th className="py-1">Item Produk</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Harga</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {tx.items.map((i, idx) => (
                <tr key={idx} className="border-b border-zinc-200">
                  <td className="py-1 font-medium">{i.name}</td>
                  <td className="text-center">{i.qty}</td>
                  <td className="text-right">Rp {i.price.toLocaleString('id-ID')}</td>
                  <td className="text-right font-semibold">Rp {(i.qty * i.price).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-zinc-400">
            <span>Grand Total:</span>
            <span className="text-emerald-700">Rp {tx.total.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>Metode Bayar: {tx.payMethod}</span>
            <span>Lunas</span>
          </div>
        </div>
      );
    }

    if (format === 'kwitansi') {
      return (
        <div className="text-zinc-950 font-mono-receipt text-xs leading-relaxed select-text border-2 border-zinc-800 p-3 rounded-lg bg-amber-50/30">
          <div className="text-center font-bold text-xs uppercase underline tracking-wider mb-2">
            KWITANSI TANDA PEMBAYARAN
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex">
              <span className="w-24 text-zinc-600">No. Kwitansi</span>
              <span>: <b>{tx.id}</b></span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-600">Telah Diterima Dari</span>
              <span>: <b>{tx.note}</b></span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-600">Uang Sejumlah</span>
              <span className="font-extrabold text-emerald-800">: Rp {tx.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex">
              <span className="w-24 text-zinc-600">Untuk Pembayaran</span>
              <span>: {tx.items.map((i) => `${i.name} (${i.qty}x)`).join(', ')}</span>
            </div>
          </div>
          <div className="flex justify-between items-end mt-4 pt-2 border-t border-zinc-300 text-[9px]">
            <div>
              <p>Metode: {tx.payMethod}</p>
              <p>Status: LUNAS</p>
            </div>
            <div className="text-center">
              <div>{profile.bizName}</div>
              <div className="h-7"></div>
              <div className="underline font-bold">Kasir / Pengelola</div>
            </div>
          </div>
        </div>
      );
    }

    if (format === 'faktur') {
      return (
        <div className="text-zinc-950 font-mono-receipt text-xs leading-relaxed select-text border-b-2 border-zinc-800 pb-2">
          <div className="flex justify-between items-start border-b border-zinc-300 pb-2 mb-2">
            <div>
              <h3 className="font-bold text-xs uppercase">{profile.bizName}</h3>
              <p className="text-[9px] text-zinc-600">{profile.address}</p>
              <p className="text-[9px] text-zinc-600">Kontak: {profile.phone}</p>
            </div>
            <div className="text-right">
              <div className="font-extrabold text-xs text-emerald-700">FAKTUR / INVOICE</div>
              <p className="text-[9px] text-zinc-600">#{tx.id}</p>
              <p className="text-[9px] text-zinc-600">{tx.date}</p>
            </div>
          </div>
          <div className="text-[10px] mb-2">
            <b>Ditujukan Kepada:</b> {tx.note}
          </div>
          <table className="w-full text-[9px] border-collapse mb-2">
            <thead>
              <tr className="bg-zinc-100 text-zinc-700 font-bold border-y border-zinc-300">
                <th className="p-1 text-left">Deskripsi Produk/Jasa</th>
                <th className="p-1 text-center">Qty</th>
                <th className="p-1 text-right">Harga</th>
                <th className="p-1 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {tx.items.map((i, idx) => (
                <tr key={idx} className="border-b border-zinc-200">
                  <td className="p-1">{i.name}</td>
                  <td className="p-1 text-center">{i.qty}</td>
                  <td className="p-1 text-right">Rp {i.price.toLocaleString('id-ID')}</td>
                  <td className="p-1 text-right font-semibold">Rp {(i.qty * i.price).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between text-[10px] font-extrabold border-t border-zinc-400 pt-1">
            <span>Total Tagihan:</span>
            <span>Rp {tx.total.toLocaleString('id-ID')}</span>
          </div>
          <div className="text-[9px] mt-2 italic text-zinc-500">*Dokumen resmi transaksi UsahaQu POS</div>
        </div>
      );
    }

    return null;
  };

  // WhatsApp Share helper
  const handleShareWhatsApp = (tx: ModularTransaction) => {
    let text = `*STRUK PEMBAYARAN - ${profile.bizName}*\n`;
    text += `No: ${tx.id}\nTanggal: ${tx.date}\nCatatan: ${tx.note}\n`;
    text += `------------------------------------\n`;
    tx.items.forEach((i) => {
      text += `${i.name} (${i.qty}x) = Rp ${(i.qty * i.price).toLocaleString('id-ID')}\n`;
    });
    text += `------------------------------------\n`;
    text += `*TOTAL: Rp ${tx.total.toLocaleString('id-ID')}*\n`;
    text += `Bayar via: ${tx.payMethod}\n\n`;
    text += `${profile.footer}`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Dummy sample transaction for Profil preview
  const sampleDummyTx: ModularTransaction = {
    id: 'TRX-SAMPLE',
    date: new Date().toLocaleDateString('id-ID') + ' 14:30',
    items: [
      { id: '1', name: 'Kopi Susu Gula Aren', qty: 2, price: 15000, cost: 7000 },
      { id: '2', name: 'Roti Bakar Keju Cokelat', qty: 1, price: 12000, cost: 6000 }
    ],
    total: 42000,
    totalCost: 20000,
    payAmount: 50000,
    change: 8000,
    payMethod: 'Tunai',
    note: 'Meja 05 / Bapak Budi'
  };

  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'Semua' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full h-full bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-hidden relative select-none font-sans">
      {/* ========================================== */}
      {/* TOP APP BAR - UsahaQu Dark & Emerald Theme */}
      {/* ========================================== */}
      <header className="bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-3.5 pt-10 sm:pt-11 pb-2.5 flex items-center justify-between shrink-0 z-30 shadow-md android-header-safe">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToWarga}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center active:scale-95 transition"
            title="Kembali ke Halaman Utama WargaQu"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-zinc-950 text-sm shadow-lg shadow-emerald-500/30">
            UQ
          </div>
          <div>
            <h1 className="font-extrabold text-sm leading-tight text-white flex items-center gap-1.5">
              {profile.bizName}
            </h1>
            <p className="text-[10px] text-emerald-400 font-semibold">{profile.bizType}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {currentUser && onOpenSecurityModal && (
            <button
              onClick={onOpenSecurityModal}
              className="text-[10px] bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded-xl flex items-center gap-1 font-mono active:scale-95 transition"
              title={`Akun: ${currentUser.name} • Perangkat Terikat: ${AuthService.getMaskedDeviceId(currentUser.boundDeviceId)}`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] hidden sm:inline">{AuthService.getMaskedDeviceId(currentUser.boundDeviceId)}</span>
            </button>
          )}

          {/* UsahaQu Switch: BaksoQu vs ModularQu */}
          <div className="bg-zinc-950/80 p-0.5 rounded-xl flex items-center border border-zinc-700 shadow-inner">
            {onOpenBaksoQu && (
              <button
                onClick={onOpenBaksoQu}
                className="text-[11px] text-zinc-300 hover:text-white hover:bg-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold transition active:scale-95"
                title="Beralih ke BaksoQu (POS Meja & Kasir Resto)"
              >
                <span>🍲 BaksoQu</span>
              </button>
            )}
            <button
              className="text-[11px] bg-emerald-500 text-zinc-950 font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs"
              title="Sedang aktif: ModularQu (POS Multi-Usaha & Voice AI)"
            >
              <span>🎙️ ModularQu</span>
            </button>
          </div>

          {/* Quick toggle to Smart Care CS */}
          {onOpenBantuan && (
            <button
              onClick={onOpenBantuan}
              className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 active:scale-95"
              title="Pusat Bantuan UsahaQu & Smart Care"
            >
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}

          {/* Quick badge switch to profile */}
          <button
            onClick={() => switchTab('profil')}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-xl flex items-center gap-1 border border-zinc-700 active:scale-95"
          >
            <Store className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold text-[11px]">{profile.bizType.split('/')[0]}</span>
          </button>
        </div>
      </header>

      {/* ========================================== */}
      {/* MAIN VIEW CONTAINER */}
      {/* ========================================== */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative p-3 sm:p-4 pb-36">
        {/* ========================================== */}
        {/* TAB 1: POS KASIR (ETALASE & DIRECT KERANJANG) */}
        {/* ========================================== */}
        {activeTab === 'pos' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              {/* LEFT: ETALASE KATALOG PRODUK */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari item / menu..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={handleSimulateBarcode}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 active:scale-95 shrink-0"
                    title="Simulasi scan barcode barang"
                  >
                    <Barcode className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-medium">Scan Barcode</span>
                  </button>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                        activeCategory === cat
                          ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredProducts.map((p) => {
                    const inCartItem = cart.find((c) => c.id === p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => addToCart(p, 1)}
                        className="bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-3 flex flex-col justify-between active:scale-95 transition-transform cursor-pointer relative overflow-hidden group shadow-sm"
                      >
                        {inCartItem && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-zinc-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                            {inCartItem.qty}
                          </div>
                        )}
                        <div>
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                            {p.category}
                          </span>
                          <h4 className="font-bold text-xs text-zinc-100 mt-1 line-clamp-2 leading-snug">
                            {p.name}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/80">
                          <span className="text-xs font-extrabold text-emerald-400">
                            Rp {p.price.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            Stok: {p.stock}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: KERANJANG BELANJA DIRECT & EDIT */}
              <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 space-y-3 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-bold text-xs text-zinc-100 uppercase tracking-wider">
                        Keranjang Pesanan
                      </h3>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                      {totalCartCount} Item
                    </span>
                  </div>

                  {/* Customer / Table Note Input */}
                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={posNote}
                      onChange={(e) => setPosNote(e.target.value)}
                      placeholder="Catatan: No. Meja / Nama Pembeli / Plat No"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Cart Items List */}
                  <div className="max-h-56 overflow-y-auto space-y-2 my-2.5 pr-1 no-scrollbar">
                    {cart.length === 0 ? (
                      <p className="text-center text-xs text-zinc-500 py-8 italic">
                        Keranjang belanja kosong. Klik produk di etalase atau gunakan Kasir Suara di bawah.
                      </p>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-zinc-950 p-2 rounded-xl text-xs border border-zinc-800/80"
                        >
                          <div className="flex-1 pr-2">
                            <p className="font-bold text-zinc-200 leading-tight">{item.name}</p>
                            <p className="text-[10px] text-zinc-400">
                              @ Rp {item.price.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateCartQty(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center active:scale-95"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-emerald-400 font-mono text-xs w-5 text-center">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateCartQty(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-rose-400 hover:text-rose-300 ml-1 p-1"
                              title="Hapus item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Checkout & Payment Section */}
                <div className="space-y-2.5 pt-2 border-t border-zinc-800">
                  {/* Payment Method Toggle */}
                  <div>
                    <label className="text-[10px] text-zinc-400 font-medium mb-1 block">
                      Metode Pembayaran
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setActivePayMethod('Tunai')}
                        className={`py-1.5 rounded-xl text-xs font-bold transition ${
                          activePayMethod === 'Tunai'
                            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                        }`}
                      >
                        Tunai
                      </button>
                      <button
                        onClick={() => setActivePayMethod('QRIS / Transfer')}
                        className={`py-1.5 rounded-xl text-xs font-medium transition ${
                          activePayMethod === 'QRIS / Transfer'
                            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                        }`}
                      >
                        QRIS/Bank
                      </button>
                      <button
                        onClick={() => setActivePayMethod('Tempo / Utang')}
                        className={`py-1.5 rounded-xl text-xs font-medium transition ${
                          activePayMethod === 'Tempo / Utang'
                            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                            : 'bg-zinc-950 border border-zinc-800 text-zinc-400'
                        }`}
                      >
                        Tempo
                      </button>
                    </div>
                  </div>

                  {/* Cash Input */}
                  {activePayMethod === 'Tunai' && (
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] text-zinc-400 shrink-0">Uang Tunai:</span>
                      <input
                        type="number"
                        value={payAmountInput}
                        onChange={(e) => setPayAmountInput(e.target.value)}
                        placeholder={totalCartPrice > 0 ? String(totalCartPrice) : '0'}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {/* Total & Execute Button */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-medium">Total Tagihan</p>
                      <p className="text-lg font-extrabold text-emerald-400">
                        Rp {totalCartPrice.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <button
                      onClick={handleFinalPayment}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold py-3 px-3 rounded-xl shadow-lg shadow-emerald-500/20 text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Bayar & Cetak Struk</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: PRODUK / JASA */}
        {/* ========================================== */}
        {activeTab === 'produk' && (
          <div className="space-y-4">
            {/* Voice Input Card for Product */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Voice Input Produk Baru
                  </span>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                  {isListening && sttTarget === 'prod' ? 'Mendengarkan...' : 'Mikrofon Siap'}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => toggleSTT('prod')}
                  className={`w-10 h-10 rounded-xl bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center text-lg shrink-0 ${
                    isListening && sttTarget === 'prod' ? 'pulse-mic' : ''
                  }`}
                  title="Tekan untuk bicara"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={prodVoiceText}
                  onChange={(e) => setProdVoiceText(e.target.value)}
                  placeholder="Contoh: 'Es Teh Manis modal 2000 jual 5000 stok 50'"
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500"
                />
                <button
                  onClick={handleProcessVoiceProduct}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-3 py-2 rounded-xl text-xs active:scale-95"
                >
                  Generate
                </button>
              </div>
              {/* Sample voice hints */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <button
                  onClick={() => setProdVoiceText('Kopi Susu Aren modal 6000 jual 14000 stok 50')}
                  className="text-[10px] bg-zinc-800 text-zinc-300 hover:text-white px-2 py-0.5 rounded-lg whitespace-nowrap"
                >
                  + Contoh Kopi
                </button>
                <button
                  onClick={() => setProdVoiceText('Ganti Oli Mesin modal 30000 jual 45000 stok 20')}
                  className="text-[10px] bg-zinc-800 text-zinc-300 hover:text-white px-2 py-0.5 rounded-lg whitespace-nowrap"
                >
                  + Contoh Bengkel
                </button>
              </div>
            </div>

            {/* Product Action Bar */}
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Katalog Produk & Jasa ({products.length})
              </h2>
              <button
                onClick={() => openProductModal({ name: '', category: 'Umum', cost: 0, price: 10000, stock: 50 })}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1 active:scale-95 shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Manual</span>
              </button>
            </div>

            {/* Product List View */}
            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-zinc-200">{p.name}</h4>
                      <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      HPP Modal: Rp {p.cost.toLocaleString('id-ID')} | Jual:{' '}
                      <span className="text-emerald-400 font-bold">
                        Rp {p.price.toLocaleString('id-ID')}
                      </span>{' '}
                      | Margin: <span className="text-cyan-400 font-semibold">Rp {(p.price - p.cost).toLocaleString('id-ID')}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-zinc-400">Stok: {p.stock}</span>
                    <button
                      onClick={() => openProductModal(p)}
                      className="text-zinc-400 hover:text-emerald-400 p-1.5 rounded-lg bg-zinc-800 active:scale-95"
                      title="Edit produk"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: MODAL / PENGELUARAN */}
        {/* ========================================== */}
        {activeTab === 'modal' && (
          <div className="space-y-4">
            {/* Voice Input Card for Expense */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Input Pengeluaran Suara AI
                  </span>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                  {isListening && sttTarget === 'exp' ? 'Mendengarkan...' : 'Mikrofon Siap'}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => toggleSTT('exp')}
                  className={`w-10 h-10 rounded-xl bg-emerald-500 text-zinc-950 font-bold flex items-center justify-center text-lg shrink-0 ${
                    isListening && sttTarget === 'exp' ? 'pulse-mic' : ''
                  }`}
                  title="Tekan untuk bicara pengeluaran"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={expVoiceText}
                  onChange={(e) => setExpVoiceText(e.target.value)}
                  placeholder="Contoh: 'Beli Gas Elpiji 3kg 22000'..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500"
                />
                <button
                  onClick={handleProcessVoiceExpense}
                  className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-3 py-2 rounded-xl text-xs active:scale-95"
                >
                  Simpan
                </button>
              </div>
              {/* Sample voice hints */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <button
                  onClick={() => setExpVoiceText('Beli Gas Elpiji 3kg 22000')}
                  className="text-[10px] bg-zinc-800 text-zinc-300 hover:text-white px-2 py-0.5 rounded-lg whitespace-nowrap"
                >
                  + Gas Elpiji 22000
                </button>
                <button
                  onClick={() => setExpVoiceText('Token Listrik Toko 50000')}
                  className="text-[10px] bg-zinc-800 text-zinc-300 hover:text-white px-2 py-0.5 rounded-lg whitespace-nowrap"
                >
                  + Listrik 50000
                </button>
                <button
                  onClick={() => setExpVoiceText('Beli Es Batu Kristal 15000')}
                  className="text-[10px] bg-zinc-800 text-zinc-300 hover:text-white px-2 py-0.5 rounded-lg whitespace-nowrap"
                >
                  + Es Batu 15000
                </button>
              </div>
            </div>

            {/* Manual Add Expense Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-md">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Catat Pengeluaran Manual
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Keterangan (misal: Beli Bahan / Token)"
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="Nominal (Rp)"
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-between items-center pt-1 gap-2">
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Bahan Baku">Bahan Baku / Stok</option>
                  <option value="Operasional">Operasional & Listrik</option>
                  <option value="Gaji & Perawatan">Gaji / Perawatan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <button
                  onClick={handleAddManualExpense}
                  className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs active:scale-95 shadow-md shadow-emerald-500/20"
                >
                  + Simpan Pengeluaran
                </button>
              </div>
            </div>

            {/* Expense History List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Riwayat Pengeluaran ({expenses.length})
              </h3>
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between text-xs shadow-sm"
                >
                  <div>
                    <p className="font-bold text-zinc-200">{e.desc}</p>
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                      {e.category} • {e.date}
                    </span>
                  </div>
                  <span className="font-extrabold text-rose-400">
                    - Rp {e.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: PROFIL & SETTING STRUK */}
        {/* ========================================== */}
        {activeTab === 'profil' && (
          <div className="space-y-4">
            {/* Profile Info Form */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-md">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                Identitas Usaha & Cetak Struk
              </h3>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Nama Toko / Usaha</label>
                  <input
                    type="text"
                    value={profile.bizName}
                    onChange={(e) => setProfile({ ...profile, bizName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Jenis Usaha</label>
                  <select
                    value={profile.bizType}
                    onChange={(e) => setProfile({ ...profile, bizType: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="F&B / Kuliner">F&B / Kedai / Resto</option>
                    <option value="Ritel / Toko Kelontong">Ritel / Toko Kelontong</option>
                    <option value="Bengkel / Otomotif">Bengkel / Servis Otomotif</option>
                    <option value="Jasa / Layanan">Jasa / Layanan Warga</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">No. WhatsApp / Telepon</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Catatan Kaki Struk (Footer)</label>
                  <input
                    type="text"
                    value={profile.footer}
                    onChange={(e) => setProfile({ ...profile, footer: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={() => showNotification('Profil Usaha & Format Struk berhasil disimpan!')}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition"
              >
                Simpan Perubahan Profil
              </button>
            </div>

            {/* Preview Format Struk (4 Formats) */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-md">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Pratinjau Format Dokumen Cetak
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['thermal', 'nota', 'kwitansi', 'faktur'] as ReceiptFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setPreviewFormat(fmt)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold capitalize transition ${
                      previewFormat === fmt
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {fmt === 'thermal' && '1. Struk Thermal'}
                    {fmt === 'nota' && '2. Nota Ringkas'}
                    {fmt === 'kwitansi' && '3. Kwitansi'}
                    {fmt === 'faktur' && '4. Faktur'}
                  </button>
                ))}
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex justify-center">
                <div className="bg-white p-4 rounded-xl shadow-2xl w-full max-w-sm">
                  {renderReceiptContent(sampleDummyTx, previewFormat)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: OMSET & LAPORAN */}
        {/* ========================================== */}
        {activeTab === 'omset' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center shadow-sm">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Total Omset</p>
                <p className="text-sm font-extrabold text-emerald-400 mt-1">
                  Rp {totalOmset.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center shadow-sm">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Pengeluaran</p>
                <p className="text-sm font-extrabold text-rose-400 mt-1">
                  Rp {totalPengeluaran.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-center shadow-sm">
                <p className="text-[10px] text-zinc-400 uppercase font-bold">Laba Bersih</p>
                <p className="text-sm font-extrabold text-cyan-400 mt-1">
                  Rp {labaBersih.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Riwayat Transaksi ({transactions.length})
                </h3>
                {transactions.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm('Reset semua riwayat transaksi dan pengeluaran?')) {
                        setTransactions([]);
                        setExpenses([]);
                        showNotification('Data riwayat berhasil direset.');
                      }
                    }}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Reset Data
                  </button>
                )}
              </div>

              {transactions.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-xs italic">
                  Belum ada transaksi terekam. Selesaikan pembayaran pertama di tab POS.
                </div>
              ) : (
                transactions.map((t) => (
                  <div
                    key={t.id}
                    className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between text-xs shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100">{t.id}</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                          {t.payMethod}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {t.items.length} item • {t.note} • {t.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-400 text-sm">
                        Rp {t.total.toLocaleString('id-ID')}
                      </span>
                      <button
                        onClick={() => bukaStruk(t)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-xl text-xs active:scale-95"
                        title="Lihat Struk"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* STICKY CARD KASIR SUARA FLEKSIBEL (BOTTOM OF POS TAB) */}
      {/* ========================================== */}
      {activeTab === 'pos' && (
        <div className="fixed bottom-14 left-0 right-0 p-2.5 bg-zinc-900/95 backdrop-blur-lg border-t border-emerald-500/30 z-30 shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                  Kasir Suara AI Fleksibel
                </span>
              </div>
              <span className="text-[10px] bg-zinc-950 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-800 font-mono">
                {isListening && sttTarget === 'pos' ? (
                  <span className="text-emerald-400 font-bold">Mendengarkan Suara...</span>
                ) : (
                  'Mikrofon Siap'
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Large Touch Mic Button */}
              <button
                onClick={() => toggleSTT('pos')}
                className={`w-11 h-11 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold flex items-center justify-center text-xl shadow-lg shadow-emerald-500/30 shrink-0 transition-transform active:scale-95 ${
                  isListening && sttTarget === 'pos' ? 'pulse-mic' : ''
                }`}
                title="Tekan untuk bicara pesanan"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Transcript / Live Text Display */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={posVoiceText}
                  onChange={(e) => setPosVoiceText(e.target.value)}
                  placeholder="Sebutkan: '2 Kopi Susu, 1 Roti Bakar meja 3'..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleProcessVoicePOS()}
                className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0 active:scale-95 shadow-md shadow-emerald-600/20"
              >
                <span>Generate</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Voice Demo Pills */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <button
                onClick={() => handleProcessVoicePOS('2 Kopi Susu Gula Aren meja 2')}
                className="text-[9px] bg-zinc-950 hover:bg-zinc-800 text-emerald-400/90 border border-emerald-500/20 px-2 py-0.5 rounded-lg whitespace-nowrap"
              >
                + Demo: 2 Kopi Susu (Meja 2)
              </button>
              <button
                onClick={() => handleProcessVoicePOS('1 Bakso Urat Spesial 1 Es Teh Manis meja 4')}
                className="text-[9px] bg-zinc-950 hover:bg-zinc-800 text-emerald-400/90 border border-emerald-500/20 px-2 py-0.5 rounded-lg whitespace-nowrap"
              >
                + Demo: Bakso & Es Teh (Meja 4)
              </button>
              <button
                onClick={() => handleProcessVoicePOS('1 Roti Bakar Keju')}
                className="text-[9px] bg-zinc-950 hover:bg-zinc-800 text-emerald-400/90 border border-emerald-500/20 px-2 py-0.5 rounded-lg whitespace-nowrap"
              >
                + Demo: 1 Roti Bakar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* BOTTOM NAVIGATION BAR */}
      {/* ========================================== */}
      <nav className="bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 fixed bottom-0 left-0 right-0 z-40 px-2 pt-1.5 pb-6 sm:pb-7 shadow-2xl android-navbar-safe">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          <button
            onClick={() => switchTab('pos')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'pos' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CreditCard className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">POS</span>
          </button>
          <button
            onClick={() => switchTab('produk')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'produk' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Produk</span>
          </button>
          <button
            onClick={() => switchTab('modal')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'modal' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Wallet className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Modal</span>
          </button>
          <button
            onClick={() => switchTab('profil')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'profil' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Store className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Profil</span>
          </button>
          <button
            onClick={() => switchTab('omset')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
              activeTab === 'omset' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Omset</span>
          </button>
        </div>
      </nav>

      {/* ========================================== */}
      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {/* ========================================== */}
      {isProdModalOpen && (
        <div id="modalProduk" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-100">
                {editingProd?.id ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                onClick={closeProductModal}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Nama Item</label>
                <input
                  type="text"
                  value={editingProd?.name || ''}
                  onChange={(e) => setEditingProd({ ...editingProd, name: e.target.value })}
                  placeholder="Nama menu atau jasa"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Kategori</label>
                <input
                  type="text"
                  value={editingProd?.category || ''}
                  onChange={(e) => setEditingProd({ ...editingProd, category: e.target.value })}
                  placeholder="Misal: Minuman / Makanan / Jasa / Bengkel"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 block mb-1">Harga Modal (HPP)</label>
                  <input
                    type="number"
                    value={editingProd?.cost || 0}
                    onChange={(e) =>
                      setEditingProd({ ...editingProd, cost: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Harga Jual</label>
                  <input
                    type="number"
                    value={editingProd?.price || 0}
                    onChange={(e) =>
                      setEditingProd({ ...editingProd, price: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Stok Awal</label>
                <input
                  type="number"
                  value={editingProd?.stock || 0}
                  onChange={(e) =>
                    setEditingProd({ ...editingProd, stock: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={closeProductModal}
                className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-xs active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 bg-emerald-500 text-zinc-950 font-bold py-2.5 rounded-xl text-xs active:scale-95 shadow-md shadow-emerald-500/20"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: STRUK TRANSAKSI SELESAI */}
      {/* ========================================== */}
      {receiptModalTx && (
        <div id="modalStruk" className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-4 space-y-3 max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-zinc-100">Struk Transaksi Selesai</h3>
              </div>
              <button
                onClick={tutupStruk}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format Quick Selector */}
            <div className="grid grid-cols-4 gap-1 shrink-0">
              {(['thermal', 'nota', 'kwitansi', 'faktur'] as ReceiptFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setModalReceiptFormat(fmt)}
                  className={`px-1.5 py-1 text-[10px] font-bold rounded-lg text-center capitalize transition ${
                    modalReceiptFormat === fmt
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Printable Receipt Box */}
            <div
              id="printable-receipt"
              className="flex-1 overflow-y-auto no-scrollbar bg-white text-black p-4 rounded-xl shadow-inner select-text"
            >
              {renderReceiptContent(receiptModalTx, modalReceiptFormat)}
            </div>

            {/* Actions: WA Share & Print & New Transaction */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 shrink-0">
              <button
                onClick={() => handleShareWhatsApp(receiptModalTx)}
                className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold py-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim WA</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold py-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1 border border-zinc-700 active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>
              <button
                onClick={tutupStruk}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-2.5 rounded-xl text-[11px] active:scale-95"
              >
                Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
