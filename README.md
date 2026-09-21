# 📊 VKU FIELD SURVEY — HỆ THỐNG THU THẬP DỮ LIỆU THỰC ĐỊA NGOẠI TUYẾN
## ĐÓNG GÓI APP THẬT SỰ CHO IPHONE (iOS) & ANDROID (PWA & CAPACITOR NATIVE)

**Học phần:** Lập trình ứng dụng di động đa nền tảng (Cross-Platform Mobile App Development)  
**Thời lượng:** Tuần 3 – Tuần 4 | **Trọng số:** 10% điểm tổng kết  
**Đơn vị:** Khoa Khoa học Máy tính — Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)  
**Sinh viên thực hiện:** Nguyễn Thị Thương — **MSSV:** 23IT.B219 — **Lớp:** 23ITB  
**Email sinh viên:** [thuongnt.23itb@vku.udn.vn](mailto:thuongnt.23itb@vku.udn.vn)  
**Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn  

---

## 🌐 1. ĐỊA CHỈ TRẢI NGHIỆM TRỰC TIẾP (LIVE DEMO)
* **Live Web App & PWA Standalone:** **[https://vku-field-survey-28x.pages.dev/](https://vku-field-survey-28x.pages.dev/)**
* Hệ thống hoạt động 100% Offline-First, cài đặt trực tiếp lên điện thoại iPhone và Android chỉ với 1 chạm.

---

## 🚀 2. CÁC TÍNH NĂNG MỚI ĐƯỢC NÂNG CẤP TOÀN DIỆN

### 📸 2.1. Tính Năng Lưu Ảnh Trực Tiếp Vào Máy Điện Thoại (Photo Storage / Gallery)
Trước đây, ảnh chỉ được lưu tạm thời vào IndexedDB để gửi báo cáo. Giờ đây hệ thống đã bổ sung cơ chế lưu ảnh toàn diện:
1. **Tự động lưu ảnh vào máy khi chụp:** Ngay khi mở camera chụp và nén ảnh qua Canvas, hệ thống tự động xuất và lưu tệp ảnh chất lượng cao vào bộ nhớ máy điện thoại (`Downloads` / `Thư viện ảnh`).
2. **Nút bấm lưu thủ công:** Bổ sung nút `📥 Lưu Ảnh Vào Máy Điện Thoại` ngay bên dưới ảnh xem trước để người dùng chủ động tải lại bất kỳ lúc nào.
3. **Tải ảnh từ lịch sử khảo sát:** Tại mục *"Hàng Đợi & Lịch Sử"*, mỗi phiếu khảo sát có ảnh đính kèm đều có nút `📥 Tải ảnh về máy` để điều tra viên dễ dàng lấy lại tư liệu kiểm định thực địa.
4. **Hỗ trợ Web Share API & Filesystem:** Trên iPhone (iOS Safari) và Android (Chrome), ảnh được chia sẻ trực tiếp vào album ảnh hệ thống (**Save to Photos / Lưu hình ảnh**). Trong môi trường Capacitor Native, ảnh được ghi qua `@capacitor/filesystem`.

---

### 📱 2.2. Đóng Gói Thành App Thật Sự Chạy Trên Điện Thoại iPhone & Android

#### A. Đối với điện thoại Android:
1. **Dự án Android Studio hoàn chỉnh (`android/`):**
   * Đã tích hợp Capacitor 6 với 3 plugin cốt lõi: `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor/network`.
   * Cấu hình đầy đủ quyền trong `AndroidManifest.xml`: `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`.
2. **Quy trình Build File Cài Đặt `.apk` Miễn Phí (GitHub Actions):**
   * Tệp quy trình `.github/workflows/build-apk.yml` tự động biên dịch mã nguồn thành file `app-debug.apk` trên môi trường đám mây Ubuntu của GitHub mỗi khi bạn push code.
   * Bạn chỉ cần tải file `.apk` về điện thoại Android và mở cài đặt là có app native độc lập 100%!

#### B. Đối với điện thoại iPhone (iOS):
1. **Dự án Xcode hoàn chỉnh (`ios/App/App.xcworkspace`):**
   * Cấu hình chi tiết các chuỗi quyền `Info.plist`: `NSCameraUsageDescription`, `NSPhotoLibraryAddUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`.
2. **Cài đặt App Độc Lập 100% Không Mất Tiền (PWA Standalone WebAPK):**
   * Trên iPhone, mở trình duyệt Safari truy cập: `https://vku-field-survey-28x.pages.dev/`
   * Bấm nút **Chia sẻ (Share - biểu tượng ô vuông có mũi tên trỏ lên)** ở cạnh dưới màn hình.
   * Chọn **"Thêm vào MH chính" (Add to Home Screen)** và bấm **Thêm (Add)**.
   * **Kết quả:** Trên màn hình chính iPhone sẽ xuất hiện icon ứng dụng **VKU Field Survey** riêng biệt. Khi mở lên, app chạy toàn màn hình độc lập (không có thanh địa chỉ Safari), chụp ảnh lưu vào máy và lưu offline bằng IndexedDB mượt mà y hệt như app tải từ App Store!

---

## 📋 3. BẢNG KIỂM TRA TÍNH NĂNG (FEATURE CHECKLIST)

| STT | Yêu cầu tính năng | Trạng thái | Minh chứng kỹ thuật trong mã nguồn |
|:---:|:---|:---:|:---|
| 1 | **PWA Standalone & Icon** | ✅ Hoàn thành | `manifest.json`: `display: standalone`, icon chuẩn 192x192 & 512x512, cài đặt mượt mà trên iOS và Android. |
| 2 | **Lưu ảnh vào máy điện thoại** | ✅ Mới bổ sung | `app.js` (`savePhotoToDevice`): Hỗ trợ tự động tải về, Web Share API, Capacitor Filesystem và nút tải lại trong lịch sử. |
| 3 | **Camera & Nén ảnh Canvas** | ✅ Hoàn thành | Tối ưu ảnh chụp từ 5-10MB xuống ~100KB JPEG chống tràn bộ nhớ IndexedDB. |
| 4 | **Offline Cache-First Boot** | ✅ Hoàn thành | `sw.js`: Pre-cache toàn bộ App Shell, nạp trang dưới 1 giây ngay cả khi tắt mạng. |
| 5 | **Định vị GPS độ chính xác cao** | ✅ Hoàn thành | Lấy toạ độ Vĩ độ, Kinh độ, Sai số mét và link mở Google Maps trực tiếp. |
| 6 | **5 Hạng mục & Đánh giá 1-5 sao** | ✅ Hoàn thành | Hardware, Projector, AC, Electrical, Furniture, Market/Service với radio 1-5 sao trực quan. |
| 7 | **Real-time Draft Persistence** | ✅ Hoàn thành | `db.js`: Tự động lưu nháp vào IndexedDB khi gõ, phục hồi nguyên vẹn khi tải lại (F5). |
| 8 | **Hàng đợi Offline (PENDING_SYNC)** | ✅ Hoàn thành | Cấp phát UUID v4 RFC-4122, timestamp ISO, gắn nhãn cam `PENDING_SYNC`. |
| 9 | **Tự động đồng bộ khi có mạng** | ✅ Hoàn thành | Bắt sự kiện `online`, đồng bộ tuần tự lên Cloudflare KV / D1 / Máy chủ và đổi sang `✅ SYNCED`. |
| 10 | **Xuất báo cáo Excel / CSV** | ✅ Hoàn thành | Tải file `.csv` chuẩn UTF-8 BOM hiển thị tiếng Việt hoàn hảo trên Excel. |
| 11 | **Đóng gói Android Native** | ✅ Mới bổ sung | Thư mục `android/` hoàn chỉnh cho Android Studio + workflow build `.apk` tự động. |
| 12 | **Đóng gói iOS Native** | ✅ Mới bổ sung | Thư mục `ios/` hoàn chỉnh cho Xcode + `Info.plist` cấp quyền Camera, Photo Library và GPS. |

---

## 💻 4. HƯỚNG DẪN THỰC THI & ĐÓNG GÓI TẠI MÁY CỦA BẠN

### Bước 1: Đồng bộ mã nguồn và tệp web vào app
```powershell
cd "D:\TÀI LIỆU\LẬP TRÌNH ĐA NỀN TẢNG\CODE_BAITAP\Tuan_03_MiniProject1_VKU_FieldSurvey"

# Đóng gói web assets vào www và đồng bộ vào Android & iOS:
npm run cap:sync
```

### Bước 2: Mở dự án trong Android Studio (nếu có máy cài Android Studio)
```powershell
npm run cap:open:android
```
Sau đó trong Android Studio, chọn **Build > Build Bundle(s) / APK(s) > Build APK(s)** để xuất file `.apk`.

### Bước 3: Hoặc dùng GitHub Actions để tự động nhận file APK (Miễn phí 100%)
1. Bạn commit và push mã nguồn lên repository GitHub của bạn:
   ```powershell
   git add .
   git commit -m "feat: add photo local saving and native mobile app packaging"
   git push origin main
   ```
2. Truy cập tab **Actions** trên GitHub repository của bạn:
   * Chọn workflow **"Build Android APK"**.
   * Sau khi máy chủ hoàn tất build (khoảng 2-3 phút), tải file **`app-debug.apk`** ở mục **Artifacts** về cài vào điện thoại Android.

---
*Bản quyền © 2026 Nguyễn Thị Thương (23IT.B219) — Trường ĐH CNTT&TT Việt - Hàn (VKU).*
