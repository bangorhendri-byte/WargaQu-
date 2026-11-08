# WargaQu Mobile App (dengan UsahaQu POS Kasir Bakso Qu)

Aplikasi superapp warga modern dengan modul POS Kasir & Manajemen Restoran UsahaQu (Bakso Qu 1.0).

---

## 🌐 Cara Deploy ke GitHub Pages (Otomatis)

Proyek ini telah dikonfigurasi penuh agar dapat di-deploy secara otomatis ke **GitHub Pages** menggunakan GitHub Actions (`.github/workflows/deploy-pages.yml`) dan base path relatif (`base: './'`).

### Langkah Mengaktifkan di Repositori GitHub:
1. Buka repositori proyek Anda di **GitHub**.
2. Masuk ke menu **Settings** > pilih **Pages** (di sidebar kiri).
3. Pada bagian **Build and deployment**:
   - Di dropdown **Source**, pilih **GitHub Actions**.
4. Selesai! Sekarang setiap kali Anda melakukan `git push` ke branch `main` atau `master`:
   - GitHub Actions akan otomatis men-compile aplikasi web Vite.
   - Hasil build akan langsung dipublikasikan ke URL: `https://<username>.github.io/<nama-repo>/`.

### Menjalankan Deploy Manual:
1. Buka tab **Actions** di repositori GitHub Anda.
2. Pilih workflow **"Deploy to GitHub Pages"**.
3. Klik tombol **Run workflow** di sebelah kanan atas.

---

## 🚀 Cara Build APK di GitHub Actions

Workflow GitHub Actions sudah disiapkan di file [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml).

### Metode 1: Jalankan Manual via Tombol di GitHub (Paling Mudah)
1. Buka repositori proyek Anda di GitHub.
2. Klik tab **Actions** di menu atas.
3. Di sidebar sebelah kiri, pilih workflow **"Build Android APK (Bakso Qu 1.0)"**.
4. Klik tombol dropdown **"Run workflow"** di sisi kanan atas.
5. Pilih branch (misal: `main` atau `master`), lalu klik **"Run workflow"**.
6. Tunggu proses build selesai (sekitar 3-5 menit).
7. Klik run workflow yang berhasil, scroll ke bagian **Artifacts** di bagian bawah halaman.
8. Download file **`BaksoQu-1.0-APK`** (berisi file `BaksoQu-1.0.apk`) dan pasang langsung di HP Android Anda!

---

### Catatan & Solusi Jika Workflow Sebelumnya Gagal:
1. **Dependency Resolution**: Sudah diperbaiki dengan penambahan `package-lock.json` dan opsi `--legacy-peer-deps` agar instalasi package Vite & Capacitor tidak gagal saat resolving.
2. **Android SDK Version**: SDK disesuaikan ke Android 15 (API 35) yang sudah terinstall secara native di runner Ubuntu GitHub Actions.
3. **Java Version**: Menggunakan JDK 17 (Temurin) yang optimal dan kompatibel dengan Gradle 8 & Android Gradle Plugin.
4. **Android SDK Licenses**: Ditambahkan langkah persetujuan lisensi SDK otomatis (`sdkmanager --licenses`) agar Gradle tidak menolak kompilasi.
5. **Izin Android**: File `AndroidManifest.xml` sudah langsung dikonfigurasi dengan izin Bluetooth Thermal Printer & Storage tanpa perlu manipulasi script di workflow.

---

### Metode 2: Build Otomatis saat Push / Git Tag
- Setiap kali Anda melakukan **`git push`** ke branch `main` atau `master`, GitHub Actions akan otomatis meng-compile APK terbaru.
- Jika Anda membuat Git Tag (contoh: `v1.0.0`):
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```
  Workflow akan otomatis membuat rilis di **GitHub Releases** dan melampirkan file `BaksoQu-1.0-debug.apk` yang siap diunduh siapa saja.

---

## 🛠️ Cara Build APK di Komputer Lokal (Opsional)

Jika Anda memiliki Android Studio di komputer lokal:

```bash
# 1. Install dependencies
npm install

# 2. Build file web Vite
npm run build

# 3. Sinkronkan dengan Capacitor Android
npx cap add android   # Hanya pertama kali
npx cap sync android

# 4. Buka di Android Studio
npx cap open android
```
Dari Android Studio, pilih menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 📱 Fitur Utama Bakso Qu 1.0
- **Denah Meja Interaktif**: Grid kartu meja dengan switch Lock / Unlock untuk mengatur posisi meja (Drag & Drop), indikator status (Kosong, Terisi, Menunggu Pembayaran).
- **Alur Transaksi Cepat**: Mode Meja & Bungkus (Takeaway), bottom sheet pilihan menu bakso & minuman lengkap dengan counter Qty.
- **Cetak Bluetooth Thermal**: Terintegrasi Web Bluetooth API untuk cetak Struk Dapur dan Nota Pembayaran Lunas (ukuran 58mm & 80mm).
- **Modal & Bahan**: Manajemen stok inventaris bahan baku dengan perhitungan nilai modal otomatis.
- **Omset & Statistik**: Ringkasan omset harian, bulanan, total transaksi, dan grafik bar/line penjualan interaktif.
- **Laporan & Export**: Riwayat transaksi lengkap dengan filter tanggal dan tombol Export PDF & CSV.
- **Pengaturan Lengkap**: Profil restoran, nama kasir, persentase pajak (PB1), biaya servis, dan footer nota kasir.
