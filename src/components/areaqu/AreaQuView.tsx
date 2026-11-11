import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Siren,
  MessageCircle,
  ShoppingBag,
  Phone,
  Navigation,
  Compass,
  Layers,
  MapPin,
  Star,
  Clock,
  Car,
  Wrench,
  Utensils,
  Store,
  Bike,
  Truck,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  X,
  Plus,
  Minus,
  CheckCircle,
  Radio,
  ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MenuItem, UserAccount } from '../../types';

interface AreaQuViewProps {
  onBackToMain: () => void;
  onOpenSiagaQu: () => void;
  onOpenChatQu: () => void;
  onOpenUsahaQu: () => void;
  menuList: MenuItem[];
  showNotification: (msg: string) => void;
  currentUser?: UserAccount | null;
  onOpenSecurityModal?: () => void;
}

export type POICategory =
  | 'warung'
  | 'bengkel'
  | 'pkl'
  | 'keliling'
  | 'transportasi'
  | 'jasa';

export interface POIItem {
  id: string;
  name: string;
  category: POICategory;
  categoryLabel: string;
  lat: number;
  lng: number;
  distanceMeter: number;
  etaMinutes: number;
  rating: number;
  address: string;
  phone: string;
  status: 'buka' | 'keliling' | 'tutup';
  description: string;
  hasUsahaQuCatalog?: boolean;
  avatarIcon: string;
  vehicleType?: string;
  priceStart?: number;
}

// Haversine formula to calculate distance between two coordinates in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Fallback anchor coordinates (RT 03 / RW 05) when device GPS is disabled
const DEFAULT_COORDS: [number, number] = [-7.7928, 110.3658];

export const AreaQuView: React.FC<AreaQuViewProps> = ({
  onBackToMain,
  onOpenSiagaQu,
  onOpenChatQu,
  onOpenUsahaQu,
  menuList,
  showNotification,
  currentUser = null,
  onOpenSecurityModal,
}) => {
  // Map Container & Instance Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radarCircleRef = useRef<L.Circle | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Dynamic Real Device GPS States
  const [userCoords, setUserCoords] = useState<[number, number]>(() => {
    try {
      const saved = localStorage.getItem('areaqu_last_coords');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COORDS;
  });
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Grab Driver-style states
  const [isDriverOnline, setIsDriverOnline] = useState<boolean>(true);
  const [selectedRadius, setSelectedRadius] = useState<number>(500); // meters (500m - 100km)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPOI, setSelectedPOI] = useState<POIItem | null>(null);
  const [showKatalogModal, setShowKatalogModal] = useState<boolean>(false);
  const [showRadiusModal, setShowRadiusModal] = useState<boolean>(false);

  // Request & Lock Real High-Accuracy Device GPS
  const requestUserGPS = (notify = true) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (notify) showNotification('Perangkat Anda tidak mendukung fitur GPS Geolocation.');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const newCoords: [number, number] = [latitude, longitude];
        setUserCoords(newCoords);
        setIsGpsActive(true);
        setIsLocatingGps(false);
        setGpsAccuracy(Math.round(accuracy));
        try {
          localStorage.setItem('areaqu_last_coords', JSON.stringify(newCoords));
        } catch {}

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newCoords);
        }
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng(newCoords);
          userMarkerRef.current.bindTooltip(
            `📍 Posisi GPS Akurat (±${Math.round(accuracy)}m)`,
            { permanent: false, direction: 'top' }
          );
        }
        if (radarCircleRef.current) {
          radarCircleRef.current.setLatLng(newCoords);
        }
        if (notify) {
          showNotification(
            `📍 GPS Terkunci! Lokasi Anda: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Akurasi: ±${Math.round(accuracy)}m)`
          );
        }
      },
      (err) => {
        setIsLocatingGps(false);
        console.warn('GPS Error in AreaQu:', err.message);
        if (notify) {
          showNotification('Izin GPS belum aktif. Pastikan lokasi HP Anda diizinkan browser.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 3000 }
    );
  };

  // Watch GPS on mount so moving / walking live updates the location
  useEffect(() => {
    requestUserGPS(false);
    let watchId: number | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const newCoords: [number, number] = [latitude, longitude];
          setUserCoords(newCoords);
          setIsGpsActive(true);
          setGpsAccuracy(Math.round(accuracy));
          try {
            localStorage.setItem('areaqu_last_coords', JSON.stringify(newCoords));
          } catch {}
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng(newCoords);
          }
          if (radarCircleRef.current) {
            radarCircleRef.current.setLatLng(newCoords);
          }
        },
        undefined,
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }
    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Available Radii options: 500m - 100km
  const RADIUS_OPTIONS = [
    { value: 500, label: '500 m (Lingkup RT)' },
    { value: 1000, label: '1 km (Lingkup RW)' },
    { value: 5000, label: '5 km (Kecamatan)' },
    { value: 10000, label: '10 km (Kota)' },
    { value: 25000, label: '25 km (Kawasan)' },
    { value: 50000, label: '50 km (Antar Kota)' },
    { value: 100000, label: '100 km (Maksimal)' }
  ];

  // POI Dataset dynamically anchored around userCoords with precise distance calculation
  const POI_LIST: POIItem[] = useMemo(() => {
    const [uLat, uLng] = userCoords;
    const baseItems: Array<Omit<POIItem, 'distanceMeter' | 'etaMinutes'>> = [
      // 1. UsahaQu / Bakso Qu (Main anchor food)
      {
        id: 'poi-baksoqu',
        name: 'Bakso Qu 1.0 (Pusat & Gerobak Keliling)',
        category: 'keliling',
        categoryLabel: 'Pedagang Keliling',
        lat: uLat + 0.0003,
        lng: uLng + 0.0004,
        rating: 5.0,
        address: 'Blok A Depan Balai Warga / Keliling Kawasan',
        phone: '0812-3456-7890',
        status: 'keliling',
        description: 'Bakso urat jumbo daging sapi asli, mie ayam bakso, pangsit kriuk, es teh manis.',
        hasUsahaQuCatalog: true,
        avatarIcon: '🍜',
        vehicleType: 'Gerobak Dorong Keliling',
        priceStart: 15000
      },
      // 2. Warung & Toko
      {
        id: 'poi-warung-1',
        name: 'Warung Madura Berkah 24 Jam',
        category: 'warung',
        categoryLabel: 'Warung & Toko',
        lat: uLat + 0.0009,
        lng: uLng - 0.0007,
        rating: 4.8,
        address: 'Jl. Utama Warga Blok B No. 01',
        phone: '0813-1122-3344',
        status: 'buka',
        description: 'Toko sembako, bensin eceran, token listrik, rokok, dan galon isi ulang antar pintu.',
        avatarIcon: '🏪',
        priceStart: 5000
      },
      {
        id: 'poi-warung-2',
        name: 'Toko Kelontong Bu Hj. Aminah',
        category: 'warung',
        categoryLabel: 'Warung & Toko',
        lat: uLat - 0.0011,
        lng: uLng - 0.0012,
        rating: 4.9,
        address: 'Jl. Melati Blok C No. 08',
        phone: '0821-3344-5566',
        status: 'buka',
        description: 'Sayur segar tiap pagi, bumbu dapur, telur ayam kampung, tahu tempe, ikan segar.',
        avatarIcon: '🥬',
        priceStart: 3000
      },
      // 3. Bengkel Motor
      {
        id: 'poi-bengkel-1',
        name: 'Bengkel Motor & Tambal Ban Mas Bro',
        category: 'bengkel',
        categoryLabel: 'Bengkel',
        lat: uLat - 0.0008,
        lng: uLng + 0.0011,
        rating: 4.9,
        address: 'Simpang Gerbang Selatan RT',
        phone: '0857-9988-1122',
        status: 'buka',
        description: 'Servis injeksi, ganti oli Pertamina/Yamalube, tambal ban tubeless cepat, setel rantai.',
        avatarIcon: '🔧'
      },
      {
        id: 'poi-bengkel-2',
        name: 'Servis Dinamo & Las Listrik Pak Eko',
        category: 'bengkel',
        categoryLabel: 'Bengkel',
        lat: uLat + 0.0014,
        lng: uLng + 0.0009,
        rating: 4.7,
        address: 'Jl. Kenanga Timur No. 15',
        phone: '0818-4455-6677',
        status: 'buka',
        description: 'Gulung dinamo pompa air, perbaikan mesin cuci, pagar tralis, las kanopi besi.',
        avatarIcon: '⚙️'
      },
      // 4. PKL (Pedagang Kaki Lima)
      {
        id: 'poi-pkl-1',
        name: 'Gorengan & Tahu Jeletot Pedas Mang Asep',
        category: 'pkl',
        categoryLabel: 'PKL',
        lat: uLat + 0.0005,
        lng: uLng + 0.0009,
        rating: 4.7,
        address: 'Depan Lapangan Voli Warga',
        phone: '0878-1122-3344',
        status: 'buka',
        description: 'Bala-bala renyah, gehu pedas, pisang goreng madu, tempe mendoan hangat sambal kecap.',
        avatarIcon: '🍗',
        priceStart: 1000
      },
      {
        id: 'poi-pkl-2',
        name: 'Martabak Manis & Telur Bang Ali',
        category: 'pkl',
        categoryLabel: 'PKL',
        lat: uLat - 0.0006,
        lng: uLng + 0.0014,
        rating: 4.8,
        address: 'Pojok Pujasera RW 05',
        phone: '0896-5544-3322',
        status: 'buka',
        description: 'Martabak manis red velvet keju cokelat wijen, martabak telur daging sapi bumbu kari.',
        avatarIcon: '🥞',
        priceStart: 18000
      },
      // 5. Pedagang Keliling
      {
        id: 'poi-keliling-1',
        name: 'Sayur Mayur Segar Keliling Kang Rudi',
        category: 'keliling',
        categoryLabel: 'Pedagang Keliling',
        lat: uLat + 0.0008,
        lng: uLng + 0.0006,
        rating: 5.0,
        address: 'Rute Keliling Blok A, B, C (06.00 - 11.00)',
        phone: '0851-2233-4455',
        status: 'keliling',
        description: 'Sayuran petik langsung, ayam potong bersih, tempe daun, bumbu racik, tahu sutra.',
        avatarIcon: '🛒',
        vehicleType: 'Motor Roda Tiga Viar Box'
      },
      // 6. Transportasi (Ojek / Kurir Warga)
      {
        id: 'poi-transport-1',
        name: 'Ojek Pangkalan & Kurir Warga Pak Anto',
        category: 'transportasi',
        categoryLabel: 'Transportasi',
        lat: uLat - 0.0004,
        lng: uLng - 0.0008,
        rating: 5.0,
        address: 'Pos Ronda Utama RT 03',
        phone: '0852-7788-9900',
        status: 'buka',
        description: 'Antar jemput sekolah, stasiun, pasar & kurir kilat antar dokumen/makanan.',
        avatarIcon: '🛵',
        vehicleType: 'Honda Vario 125'
      },
      // 7. Jasa Panggilan (AC, Pijat, Servis)
      {
        id: 'poi-jasa-1',
        name: 'Servis AC & Cuci Rumah Mas Joko',
        category: 'jasa',
        categoryLabel: 'Jasa Panggilan',
        lat: uLat - 0.0012,
        lng: uLng - 0.0011,
        rating: 4.9,
        address: 'Rumah Blok C No. 02',
        phone: '0822-4455-6677',
        status: 'buka',
        description: 'Cuci AC cepat bersih, tambah freon R32/R410, perbaikan bocor bergaransi 30 hari.',
        avatarIcon: '❄️'
      },
      {
        id: 'poi-jasa-2',
        name: 'Pijat Urut Tuna Netra & Refleksi Pak Hadi',
        category: 'jasa',
        categoryLabel: 'Jasa Panggilan',
        lat: uLat + 0.0012,
        lng: uLng + 0.0013,
        rating: 5.0,
        address: 'Rumah Blok A No. 19',
        phone: '0813-8899-1122',
        status: 'buka',
        description: 'Ahli pijat urut tradisional pegal linu, saraf kejepit, terkilir, siap dipanggil ke rumah.',
        avatarIcon: '💆'
      }
    ];

    return baseItems.map(item => {
      const dist = calculateDistance(uLat, uLng, item.lat, item.lng);
      const eta = Math.max(1, Math.round(dist / 80));
      return {
        ...item,
        distanceMeter: dist,
        etaMinutes: eta
      };
    });
  }, [userCoords]);
  // Filter POIs based on Category & Search
  const filteredPOIs = useMemo(() => {
    return POI_LIST.filter(item => {
      const matchCategory =
        selectedCategory === 'all' ? true : item.category === selectedCategory;
      const matchSearch = searchQuery.trim()
        ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.address.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchRadius = item.distanceMeter <= selectedRadius;
      return matchCategory && matchSearch && matchRadius;
    });
  }, [POI_LIST, selectedCategory, searchQuery, selectedRadius]);

  // Initialize Leaflet OpenStreetMap
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Ensure any stale leaflet instances on this DOM element are cleared
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    let map: L.Map | null = null;
    try {
      // Create map centered on user
      map = L.map(container, {
        center: userCoords,
        zoom: 17,
        zoomControl: false,
        attributionControl: false
      });

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map);

      // User Location Marker (Grab Driver pulsing beacon)
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(5, 150, 105, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background-color: #047857; border: 3px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: #5eead4;"></div>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const userMarker = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip(
          isGpsActive ? `📍 Lokasi GPS Anda (±${gpsAccuracy ?? 5}m)` : 'Lokasi Anda (RT 03 / RW 05)',
          { permanent: false, direction: 'top' }
        );
      userMarkerRef.current = userMarker;

      // Layer group for POI markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      mapInstanceRef.current = map;

      // Invalidate size to guarantee tiles render properly inside flex container
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    } catch (err) {
      console.error('Error initializing Leaflet in AreaQu:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      if (container && (container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
      }
    };
  }, []);

  // Update Radar Circle when radius changes or userCoords update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (radarCircleRef.current) {
      map.removeLayer(radarCircleRef.current);
    }

    // Draw active radar coverage circle
    const circle = L.circle(userCoords, {
      radius: selectedRadius,
      color: '#059669',
      weight: 1.5,
      fillColor: '#10b981',
      fillOpacity: 0.12,
      dashArray: '4, 6'
    }).addTo(map);

    radarCircleRef.current = circle;

    // Adjust zoom smoothly according to radius
    if (selectedRadius <= 500) {
      map.setZoom(17);
    } else if (selectedRadius <= 1000) {
      map.setZoom(16);
    } else if (selectedRadius <= 5000) {
      map.setZoom(14);
    } else if (selectedRadius <= 10000) {
      map.setZoom(13);
    } else if (selectedRadius <= 25000) {
      map.setZoom(11);
    } else if (selectedRadius <= 50000) {
      map.setZoom(10);
    } else {
      map.setZoom(8);
    }
  }, [selectedRadius]);

  // Update POI Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    filteredPOIs.forEach(poi => {
      // Category specific color
      let badgeBg = '#059669'; // default emerald
      if (poi.category === 'keliling') badgeBg = '#7c3aed'; // violet
      else if (poi.category === 'warung') badgeBg = '#d97706'; // amber
      else if (poi.category === 'bengkel') badgeBg = '#0284c7'; // sky blue
      else if (poi.category === 'pkl') badgeBg = '#ea580c'; // orange
      else if (poi.category === 'transportasi') badgeBg = '#059669'; // grab green
      else if (poi.category === 'jasa') badgeBg = '#0d9488'; // teal

      const isSelected = selectedPOI?.id === poi.id;

      const markerHtml = `
        <div style="position: relative; cursor: pointer; transition: transform 0.2s;" class="${isSelected ? 'scale-125' : ''}">
          <div style="
            background: ${badgeBg};
            color: white;
            border-radius: 9999px;
            padding: 4px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          ">
            ${poi.avatarIcon}
          </div>
          ${
            poi.status === 'keliling'
              ? `<span style="position: absolute; -top: 2px; -right: 2px; width: 10px; height: 10px; background: #22c55e; border: 2px solid white; border-radius: 9999px;"></span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'poi-custom-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedPOI(poi);

        // Draw route line to this POI
        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
        }
        const polyline = L.polyline([userCoords, [poi.lat, poi.lng]], {
          color: '#059669',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(map);
        routePolylineRef.current = polyline;

        map.panTo([poi.lat, poi.lng]);
      });

      markersLayer.addLayer(marker);
    });
  }, [filteredPOIs, selectedPOI, userCoords]);

  // Recenter / GPS lock handler
  const handleRecenter = () => {
    requestUserGPS(true);
  };

  // Zoom in / out controls
  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-slate-900 font-sans select-none text-slate-800">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (GRAB DRIVER STYLE with SiagaQu SOS shortcut) */}
      {/* ========================================================================= */}
      <header className="absolute top-0 left-0 right-0 z-30 p-2.5 pt-10 sm:pt-11 flex flex-col gap-2 pointer-events-none android-header-safe">
        
        {/* Main Status Bar */}
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          
          {/* Back Button */}
          <button
            onClick={onBackToMain}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-700 active:scale-95 transition"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-800" />
          </button>

          {/* Grab Driver Status Pill */}
          <div
            onClick={() => {
              setIsDriverOnline(!isDriverOnline);
              showNotification(
                !isDriverOnline ? 'Radar Warga Aktif: Menerima Panggilan' : 'Radar Dinonaktifkan'
              );
            }}
            className={`flex-1 flex items-center justify-between px-3.5 py-2 rounded-full backdrop-blur-md shadow-lg border transition cursor-pointer active:scale-98 ${
              isDriverOnline
                ? 'bg-[#001f15]/90 border-emerald-500/50 text-white'
                : 'bg-slate-800/90 border-slate-600 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isDriverOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                }`}
              ></span>
              <span className="text-xs font-black tracking-wide">
                {isDriverOnline ? 'AREA AKTIF' : 'RADAR OFF'}
              </span>
            </div>

            <button
              onClick={() => requestUserGPS(true)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border active:scale-95 transition ${
                isGpsActive
                  ? 'bg-emerald-500/20 text-[#5eead4] border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
              }`}
              title="Ketuk untuk membaca & mengunci GPS perangkat Anda"
            >
              <Navigation className={`w-3 h-3 ${isLocatingGps ? 'animate-spin' : ''}`} />
              <span>{isGpsActive ? `GPS Aktif (±${gpsAccuracy ?? 5}m)` : isLocatingGps ? 'Mencari GPS...' : 'Kunci GPS'}</span>
            </button>
          </div>

          {/* SIAGAQU ICON IN HEADER (CRITICAL REQUIREMENT) */}
          <button
            onClick={onOpenSiagaQu}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-lg shadow-red-600/40 border-2 border-white flex items-center justify-center relative active:scale-95 transition group"
            title="Buka SiagaQu (Tombol Darurat SOS)"
          >
            <Siren className="w-5 h-5 animate-pulse text-white" />
            <span className="absolute -top-1 -right-1 bg-red-800 text-white text-[8px] font-black px-1 rounded-full border border-white">
              SOS
            </span>
          </button>
        </div>

        {/* Location Search Bar + Radius Trigger */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex-1 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/80 flex items-center px-3 py-2">
            <Search className="w-4 h-4 text-emerald-700 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari pedagang, bengkel, ojol..."
              className="bg-transparent flex-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* RADIUS PICKER BUTTON (500m - 100km) */}
          <button
            onClick={() => setShowRadiusModal(true)}
            className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-emerald-300 text-emerald-800 text-xs font-black flex items-center gap-1 active:scale-95 transition"
            title="Atur Radius Radar (500m - 100km)"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-600" />
            <span>{selectedRadius >= 1000 ? `${selectedRadius / 1000} km` : `${selectedRadius} m`}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* CATEGORY FILTER CHIPS (HORIZONTAL SCROLL) */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-0.5">
          {[
            { id: 'all', label: 'Semua', icon: '📍' },
            { id: 'warung', label: 'Warung/Toko', icon: '🏪' },
            { id: 'bengkel', label: 'Bengkel', icon: '🔧' },
            { id: 'pkl', label: 'PKL', icon: '🍗' },
            { id: 'keliling', label: 'Pedagang Keliling', icon: '🍜' },
            { id: 'transportasi', label: 'Transportasi', icon: '🛵' },
            { id: 'jasa', label: 'Jasa Panggilan', icon: '❄️' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap backdrop-blur-md shadow-md border transition flex items-center gap-1 active:scale-95 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white border-emerald-600 shadow-emerald-700/30'
                  : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. OPENSTREETMAP (LEAFLET INTERACTIVE MAP CANVAS) */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full relative z-10 min-h-0">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* MAP FLOATING CONTROLS (RIGHT SIDE - GRAB DRIVER STYLE) */}
        <div className="absolute right-3 top-36 z-20 flex flex-col gap-2">
          
          {/* Dedicated GPS Lock Button */}
          <button
            onClick={handleRecenter}
            className={`w-11 h-11 rounded-full shadow-xl border flex items-center justify-center active:scale-95 transition ${
              isLocatingGps
                ? 'bg-amber-50 border-amber-400 text-amber-700'
                : isGpsActive
                ? 'bg-white border-emerald-500 text-emerald-700 ring-2 ring-emerald-400/40'
                : 'bg-white border-slate-300 text-slate-700'
            }`}
            title="Kunci & Pusatkan ke Lokasi GPS Asli Anda"
          >
            <Compass className={`w-5 h-5 ${isLocatingGps ? 'animate-spin text-amber-600' : isGpsActive ? 'text-emerald-600' : 'text-slate-600'}`} />
          </button>

          {/* Zoom In */}
          <button
            onClick={() => handleZoom(1)}
            className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition"
            title="Perbesar Peta"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => handleZoom(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition"
            title="Perkecil Peta"
          >
            <Minus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GRAB DRIVER-STYLE BOTTOM SHEET / SELECTED POI DETAILS */}
      {/* ========================================================================= */}
      {selectedPOI ? (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-4 pb-7 sm:pb-8 space-y-3 animate-in slide-in-from-bottom duration-200 android-navbar-safe">
          
          {/* Drag Handle & Close */}
          <div className="flex justify-between items-center pb-1">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mr-2"></div>
            <button
              onClick={() => {
                setSelectedPOI(null);
                if (routePolylineRef.current && mapInstanceRef.current) {
                  mapInstanceRef.current.removeLayer(routePolylineRef.current);
                }
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* POI Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shadow-xs shrink-0">
                {selectedPOI.avatarIcon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {selectedPOI.categoryLabel}
                  </span>
                  <span className="text-[10px] text-green-700 font-bold flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    Warga Terdaftar
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-snug mt-0.5">
                  {selectedPOI.name}
                </h3>
              </div>
            </div>

            {/* Rating & ETA */}
            <div className="text-right shrink-0">
              <div className="flex items-center justify-end text-amber-500 font-black text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                <span>{selectedPOI.rating}</span>
              </div>
              <span className="text-[11px] font-extrabold text-emerald-700 block">
                {selectedPOI.distanceMeter} m ({selectedPOI.etaMinutes} mnt)
              </span>
            </div>
          </div>

          {/* Location & Status Description */}
          <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1 border border-slate-100">
            <div className="flex items-center text-slate-500 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-1 shrink-0" />
              <span className="truncate font-medium">{selectedPOI.address}</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {selectedPOI.description}
            </p>
          </div>

          {/* ACTION BUTTONS: CHATQU, USHAQU KATALOG, TELEPON, NAVIGASI */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            
            {/* 1. INTEGRASI CHATQU */}
            <button
              onClick={() => {
                showNotification(`Membuka ChatQu dengan ${selectedPOI.name}...`);
                onOpenChatQu();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 active:scale-95 transition"
              title="Kirim Pesan ChatQu"
            >
              <MessageCircle className="w-5 h-5 text-sky-600 mb-0.5" />
              <span className="text-[10px] font-bold">ChatQu</span>
            </button>

            {/* 2. KATALOG USAHAQU (FOR BAKSO QU & FOOD STALLS) */}
            <button
              onClick={() => {
                if (selectedPOI.hasUsahaQuCatalog) {
                  setShowKatalogModal(true);
                } else {
                  showNotification('Katalog UsahaQu: Membuka Daftar Menu');
                  onOpenUsahaQu();
                }
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 active:scale-95 transition relative"
              title="Lihat Menu UsahaQu"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-700 mb-0.5" />
              <span className="text-[10px] font-bold">Katalog</span>
              <span className="absolute -top-1 -right-1 bg-emerald-700 text-white text-[7px] font-black px-1 rounded-full">
                POS
              </span>
            </button>

            {/* 3. TELEPON / WA */}
            <button
              onClick={() => showNotification(`Menghubungi ${selectedPOI.phone}...`)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 active:scale-95 transition"
              title="Hubungi"
            >
              <Phone className="w-5 h-5 text-slate-700 mb-0.5" />
              <span className="text-[10px] font-bold">Telepon</span>
            </button>

            {/* 4. ARAHKAN RUTE (GRAB STYLE) */}
            <button
              onClick={() => {
                showNotification(`Memulai navigasi ke ${selectedPOI.name} (${selectedPOI.distanceMeter}m)`);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-95 transition"
              title="Arahkan Navigasi"
            >
              <Navigation className="w-5 h-5 text-white mb-0.5 fill-white" />
              <span className="text-[10px] font-bold">Arahkan</span>
            </button>
          </div>
        </div>
      ) : (
        /* GRAB DRIVER IDLE BOTTOM SUMMARY BAR */
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md rounded-t-3xl shadow-xl border-t border-slate-200 p-3.5 pb-6 sm:pb-7 flex items-center justify-between android-navbar-safe">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5 text-emerald-700 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                {filteredPOIs.length} Titik Warga Terdeteksi
              </h4>
              <p className="text-[10px] text-slate-500">
                Radius {selectedRadius >= 1000 ? `${selectedRadius / 1000} km` : `${selectedRadius} m`} di sekeliling RT 03
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              // auto select first POI
              if (filteredPOIs.length > 0) {
                setSelectedPOI(filteredPOIs[0]);
              }
            }}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow active:scale-95 transition"
          >
            Pilih Titik
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: KATALOG USAHAQU KETIKA PILIH IKON */}
      {/* ========================================================================= */}
      {showKatalogModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto no-scrollbar p-4 space-y-3 shadow-2xl">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">Katalog UsahaQu (Bakso Qu)</h3>
                  <p className="text-[10px] text-slate-400">Siap Pesan Antar ke Rumah Anda</p>
                </div>
              </div>
              <button
                onClick={() => setShowKatalogModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {menuList.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-emerald-50/50 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>
                      <div className="text-xs font-extrabold text-emerald-700 font-mono mt-0.5">
                        Rp {item.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      showNotification(`"${item.name}" dipesan! Menghubungkan ke UsahaQu.`);
                      setShowKatalogModal(false);
                      onOpenUsahaQu();
                    }}
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shrink-0 shadow-xs active:scale-95 transition"
                  >
                    Pesan
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-500">Butuh menu lainnya?</span>
              <button
                onClick={() => {
                  setShowKatalogModal(false);
                  onOpenUsahaQu();
                }}
                className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                Buka UsahaQu POS <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: RADIUS SELECTOR (500M - 100KM) */}
      {/* ========================================================================= */}
      {showRadiusModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xs p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span>Pilih Radius Radar Kawasan</span>
              </div>
              <button onClick={() => setShowRadiusModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Peta OSM akan otomatis menyesuaikan lingkaran jangkauan dan zoom level:
            </p>

            <div className="space-y-1.5">
              {RADIUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedRadius(opt.value);
                    setShowRadiusModal(false);
                    showNotification(`Radius radar disetel ke ${opt.label}`);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition ${
                    selectedRadius === opt.value
                      ? 'bg-emerald-50 border border-emerald-500 text-emerald-800'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedRadius === opt.value && (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
