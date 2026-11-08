import React, { useState, useEffect, useRef } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { WargaDashboard } from './components/warga/WargaDashboard';
import { EmptyModuleView } from './components/warga/EmptyModuleView';
import { UsahaQuView } from './components/usahaqu/UsahaQuView';
import { RtQuView } from './components/rtqu/RtQuView';
import { SiagaQuView } from './components/siagaqu/SiagaQuView';
import { ChatQuView } from './components/chatqu/ChatQuView';
import { MuamalahQuView } from './components/muamalahqu/MuamalahQuView';
import { AreaQuView } from './components/areaqu/AreaQuView';
import { ModularQuView } from './components/modularqu/ModularQuView';
import { BantuanView } from './components/bantuan/BantuanView';
import { LeluhurQuView } from './components/leluhurqu/LeluhurQuView';
import { SettingView } from './components/setting/SettingView';
import { UpdateCenterModal } from './components/update/UpdateCenterModal';

import {
  TableItem,
  MenuItem,
  Order,
  Ingredient,
  RestaurantProfile,
  PrinterConfig,
  UserAccount
} from './types';
import { StorageService } from './services/storage';
import { AuthService } from './services/auth';
import { UpdateService } from './services/update';
import { LoginModal } from './components/auth/LoginModal';
import { SecuritySettingsModal } from './components/auth/SecuritySettingsModal';

type AppScreen = 'warga' | 'leluhurqu' | 'rtqu' | 'siagaqu' | 'chatqu' | 'muamalahqu' | 'areaqu' | 'usahaqu' | 'modularqu' | 'bantuan' | 'setting' | 'empty_module';

export default function App() {
  // Auth & Single Device Binding State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return AuthService.getCurrentSession().user;
  });
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);

  // Screen Navigation State dengan dukungan Auto-Link Deep Navigation
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash.toLowerCase();
      if (h.includes('orbitqu') || h.includes('leluhurqu') || h.includes('silsilah')) return 'leluhurqu';
      if (h.includes('usahaqu') || h.includes('pos') || h.includes('kasir')) return 'usahaqu';
      if (h.includes('modularqu')) return 'modularqu';
      if (h.includes('rtqu')) return 'rtqu';
      if (h.includes('siagaqu') || h.includes('sos')) return 'siagaqu';
      if (h.includes('chatqu')) return 'chatqu';
      if (h.includes('muamalahqu')) return 'muamalahqu';
      if (h.includes('areaqu')) return 'areaqu';
      if (h.includes('bantuan')) return 'bantuan';
      if (h.includes('setting')) return 'setting';
    }
    return 'warga';
  });
  const [selectedEmptyModule, setSelectedEmptyModule] = useState<string>('areaqu');

  // Core POS Data States (Persisted for UsahaQu / Bakso Qu)
  const [tables, setTables] = useState<TableItem[]>([]);
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Record<string, Order>>({});
  const [profile, setProfile] = useState<RestaurantProfile>(StorageService.getProfile());
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(StorageService.getPrinterConfig());

  // Global Toast Notification State
  const [notification, setNotification] = useState<string | null>(null);

  // Initial Data Load
  useEffect(() => {
    setTables(StorageService.getTables());
    setMenuList(StorageService.getMenu());
    setIngredients(StorageService.getIngredients());
    setHistory(StorageService.getHistory());
    setActiveOrders(StorageService.getActiveOrders());
    setProfile(StorageService.getProfile());
    setPrinterConfig(StorageService.getPrinterConfig());

    // Cek apakah baru saja terjadi pembaruan aplikasi
    const verCheck = UpdateService.checkNewVersionOnStartup();
    if (verCheck.isNew) {
      showNotification(`Aplikasi telah diperbarui ke v${verCheck.currentVersion}! Seluruh data Anda aman.`);
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const currentScreenRef = useRef(currentScreen);
  const lastBackPressRef = useRef(0);

  useEffect(() => {
    currentScreenRef.current = currentScreen;
  }, [currentScreen]);

  // Tangani tombol Back HP / Browser di tingkat aplikasi
  useEffect(() => {
    const initialHash = window.location.hash;
    if (initialHash && initialHash !== '#warga') {
      window.history.replaceState({ screen: currentScreen }, '', initialHash);
      if (initialHash.includes('invite=')) {
        const match = initialHash.match(/invite=([a-zA-Z0-9\-_]+)/);
        if (match && match[1]) {
          showNotification(`Tautan Undangan Aktif: ${match[1]}`);
        }
      }
    } else {
      window.history.replaceState({ screen: 'warga' }, '', '#warga');
    }


    const handleGlobalBack = () => {
      // Jika sedang berada di sub-screen selain warga, kembalikan ke beranda warga
      if (currentScreenRef.current !== 'warga') {
        setCurrentScreen('warga');
        window.history.pushState({ screen: 'warga' }, '', '#warga');
        return;
      }

      // Jika di layar utama (warga), cegah langsung keluar aplikasi secara tidak sengaja
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        showNotification('Sampai jumpa!');
      } else {
        lastBackPressRef.current = now;
        showNotification('Tekan sekali lagi untuk keluar aplikasi');
        // Push state kembali agar tombol back berikutnya tetap tertangkap
        window.history.pushState({ screen: 'warga' }, '', '#warga');
      }
    };

    const onPopState = () => {
      handleGlobalBack();
    };

    window.addEventListener('popstate', onPopState);

    let capListener: any = null;
    import('@capacitor/app')
      .then(({ App: CapApp }) => {
        CapApp.addListener('backButton', () => {
          handleGlobalBack();
        })
          .then((l) => {
            capListener = l;
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('popstate', onPopState);
      if (capListener?.remove) {
        capListener.remove();
      }
    };
  }, []);

  const handleOpenLeluhurQu = () => {
    setCurrentScreen('leluhurqu');
    window.history.pushState({ screen: 'leluhurqu' }, '', '#leluhurqu');
    showNotification('Membuka LeluhurQu: Silsilah & Medsos Keluarga');
  };

  const handleOpenRtQu = () => {
    setCurrentScreen('rtqu');
    window.history.pushState({ screen: 'rtqu' }, '', '#rtqu');
  };

  const handleOpenSiagaQu = () => {
    setCurrentScreen('siagaqu');
    window.history.pushState({ screen: 'siagaqu' }, '', '#siagaqu');
  };

  const handleOpenUsahaQu = () => {
    setCurrentScreen('usahaqu');
    window.history.pushState({ screen: 'usahaqu' }, '', '#usahaqu');
    showNotification('Membuka UsahaQu: POS Kasir & Restoran Bakso Qu');
  };

  const handleOpenModularQu = () => {
    setCurrentScreen('modularqu');
    window.history.pushState({ screen: 'modularqu' }, '', '#modularqu');
    showNotification('Membuka UsahaQu: POS ModularQu Voice AI');
  };

  const handleOpenBantuan = () => {
    setCurrentScreen('bantuan');
    window.history.pushState({ screen: 'bantuan' }, '', '#bantuan');
    showNotification('Membuka UsahaQu Smart Care & Pusat Bantuan');
  };

  const handleOpenChatQu = () => {
    setCurrentScreen('chatqu');
    window.history.pushState({ screen: 'chatqu' }, '', '#chatqu');
  };

  const handleOpenMuamalahQu = () => {
    setCurrentScreen('muamalahqu');
    window.history.pushState({ screen: 'muamalahqu' }, '', '#muamalahqu');
  };

  const handleOpenAreaQu = () => {
    setCurrentScreen('areaqu');
    window.history.pushState({ screen: 'areaqu' }, '', '#areaqu');
  };

  const handleOpenSetting = () => {
    setCurrentScreen('setting');
    window.history.pushState({ screen: 'setting' }, '', '#setting');
    showNotification('Membuka Pengaturan & Pembaruan Sistem');
  };

  const handleOpenEmptyModule = (moduleId: string) => {
    if (moduleId === 'leluhurqu') {
      handleOpenLeluhurQu();
      return;
    }
    if (moduleId === 'chatqu') {
      handleOpenChatQu();
      return;
    }
    if (moduleId === 'muamalahqu') {
      handleOpenMuamalahQu();
      return;
    }
    if (moduleId === 'areaqu') {
      handleOpenAreaQu();
      return;
    }
    if (moduleId === 'setting') {
      handleOpenSetting();
      return;
    }
    setSelectedEmptyModule(moduleId);
    setCurrentScreen('empty_module');
    window.history.pushState({ screen: 'empty_module', moduleId }, '', '#' + moduleId);
  };

  const handleBackToWarga = () => {
    setCurrentScreen('warga');
    window.history.pushState({ screen: 'warga' }, '', '#warga');
  };

  const activeOrderCount = Object.keys(activeOrders).length;

  return (
    <AndroidFrame>
      {/* Pop-up Notification Toast across views */}
      {notification && (
        <div className="absolute top-12 left-4 right-4 z-50 bg-emerald-950/95 text-[#5eead4] px-4 py-2 rounded-2xl shadow-xl border border-emerald-500/40 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
          <span>{notification}</span>
        </div>
      )}

      {/* Screen 1: WargaQu Mobile App Dashboard */}
      {currentScreen === 'warga' && (
        <WargaDashboard
          onOpenLeluhurQu={handleOpenLeluhurQu}
          onOpenRtQu={handleOpenRtQu}
          onOpenSiagaQu={handleOpenSiagaQu}
          onOpenUsahaQu={handleOpenUsahaQu}
          onOpenModularQu={handleOpenModularQu}
          onOpenBantuan={handleOpenBantuan}
          onOpenChatQu={handleOpenChatQu}
          onOpenMuamalahQu={handleOpenMuamalahQu}
          onOpenAreaQu={handleOpenAreaQu}
          onOpenSetting={handleOpenSetting}
          onOpenEmptyModule={handleOpenEmptyModule}
          activeOrderCount={activeOrderCount}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
          onOpenLoginModal={() => setShowLoginModal(true)}
          onOpenUpdateModal={() => setShowUpdateModal(true)}
        />
      )}

      {/* Screen LeluhurQu (Silsilah & Medsos 2 Jalur Keluarga) */}
      {currentScreen === 'leluhurqu' && (
        <LeluhurQuView
          onBackToWarga={handleBackToWarga}
          showNotification={showNotification}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
        />
      )}

      {/* Screen 2: Modul RtQu (Pengurusan RT 03 / RW 05) */}
      {currentScreen === 'rtqu' && (
        <RtQuView
          onBackToMain={handleBackToWarga}
          onOpenUsahaQu={handleOpenUsahaQu}
          showNotification={showNotification}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
        />
      )}

      {/* Screen 3: Modul SiagaQu (Panic Button & Radar Darurat) */}
      {currentScreen === 'siagaqu' && (
        <SiagaQuView
          onBackToMain={handleBackToWarga}
          showNotification={showNotification}
          onOpenChatQu={handleOpenChatQu}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
        />
      )}

      {/* Screen 4: Modul ChatQu (WhatsApp-style citizen coordination) */}
      {currentScreen === 'chatqu' && (
        <ChatQuView
          onBackToMain={handleBackToWarga}
          showNotification={showNotification}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
        />
      )}

      {/* Screen 5: Modul MuamalahQu (Marketplace Warga Shopee-style) */}
      {currentScreen === 'muamalahqu' && (
        <MuamalahQuView
          onBackToMain={handleBackToWarga}
          menuList={menuList}
          setMenuList={setMenuList}
          showNotification={showNotification}
          onOpenChatQu={handleOpenChatQu}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
        />
      )}

      {/* Screen 6: Modul AreaQu (Peta OSM & Radar Kawasan Grab Driver-style) */}
      {currentScreen === 'areaqu' && (
        <AreaQuView
          onBackToMain={handleBackToWarga}
          onOpenSiagaQu={handleOpenSiagaQu}
          onOpenChatQu={handleOpenChatQu}
          onOpenUsahaQu={handleOpenUsahaQu}
          menuList={menuList}
          showNotification={showNotification}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
        />
      )}

      {/* Screen 7: UsahaQu (Bakso Qu 1.0 POS Kasir & Restoran) */}
      {currentScreen === 'usahaqu' && (
        <UsahaQuView
          onBackToWarga={handleBackToWarga}
          onOpenModularQu={handleOpenModularQu}
          onOpenBantuan={handleOpenBantuan}
          tables={tables}
          setTables={setTables}
          menuList={menuList}
          setMenuList={setMenuList}
          ingredients={ingredients}
          setIngredients={setIngredients}
          history={history}
          setHistory={setHistory}
          activeOrders={activeOrders}
          setActiveOrders={setActiveOrders}
          profile={profile}
          setProfile={setProfile}
          printerConfig={printerConfig}
          setPrinterConfig={setPrinterConfig}
          showNotification={showNotification}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
        />
      )}

      {/* Screen 8: UsahaQu POS ModularQu (Multi-Usaha Voice AI POS) */}
      {currentScreen === 'modularqu' && (
        <ModularQuView
          onBackToWarga={handleBackToWarga}
          onOpenBaksoQu={handleOpenUsahaQu}
          onOpenBantuan={handleOpenBantuan}
          showNotification={showNotification}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
        />
      )}

      {/* Screen 9: UsahaQu Smart Care & Pusat Bantuan */}
      {currentScreen === 'bantuan' && (
        <BantuanView
          onBackToWarga={handleBackToWarga}
          showNotification={showNotification}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
          onOpenLoginModal={() => setShowLoginModal(true)}
        />
      )}

      {/* Screen 10: Pengaturan & Pembaruan Sistem (SettingView) */}
      {currentScreen === 'setting' && (
        <SettingView
          profile={profile}
          onSaveProfile={(p) => {
            setProfile(p);
            StorageService.saveProfile(p);
            showNotification('Profil toko berhasil disimpan!');
          }}
          printerConfig={printerConfig}
          onSavePrinterConfig={(c) => {
            setPrinterConfig(c);
            StorageService.savePrinterConfig(c);
            showNotification('Konfigurasi printer berhasil disimpan!');
          }}
          menuList={menuList}
          onSaveMenu={(m) => {
            setMenuList(m);
            StorageService.saveMenu(m);
            showNotification('Daftar menu berhasil diperbarui!');
          }}
          onBackToWarga={handleBackToWarga}
          onOpenUpdateModal={() => setShowUpdateModal(true)}
        />
      )}

      {/* Screen 11: Sub-Modul Warga (QRIS WargaPay, Aktivitas, Untukmu, Akun) */}
      {currentScreen === 'empty_module' && (
        <EmptyModuleView
          moduleId={selectedEmptyModule}
          onBack={handleBackToWarga}
          onOpenUsahaQu={handleOpenUsahaQu}
          currentUser={currentUser}
          onOpenSecurityModal={() => setShowSecurityModal(true)}
          onOpenLoginModal={() => setShowLoginModal(true)}
          onOpenUpdateModal={() => setShowUpdateModal(true)}
          showNotification={showNotification}
        />
      )}

      {/* Modal 1: Login Akun, Aktivasi & Solusi HP Hilang */}
      <LoginModal
        isOpen={showLoginModal}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowLoginModal(false);
          showNotification(`Login berhasil! Selamat datang, ${user.name}`);
        }}
        onClose={() => setShowLoginModal(false)}
        showNotification={showNotification}
      />

      {/* Modal 2: Pengaturan Keamanan & Device Binding */}
      {currentUser && (
        <SecuritySettingsModal
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
          currentUser={currentUser}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            if (!updatedUser) {
              setShowSecurityModal(false);
              setShowLoginModal(true);
            }
          }}
          showNotification={showNotification}
          onTriggerLostPhoneWizard={() => {
            setShowSecurityModal(false);
            setShowLoginModal(true);
          }}
        />
      )}

      {/* Modal 3: Pusat Pembaruan Sistem (Auto-Update & Zero Data Loss) */}
      <UpdateCenterModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        showToast={showNotification}
      />
    </AndroidFrame>
  );
}
