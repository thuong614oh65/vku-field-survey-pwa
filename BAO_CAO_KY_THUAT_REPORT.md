# BÁO CÁO KỸ THUẬT TIỂU LUẬN / MINI-PROJECT 1
## HỌC PHẦN: PHÁT TRIỂN ỨNG DỤNG DI ĐỘNG ĐA NỀN TẢNG (LỚP 4)
**TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG VIỆT - HÀN (VKU)**

---

### 📋 THÔNG TIN SINH VIÊN & ĐỀ TÀI
* **Họ và tên sinh viên:** Nguyễn Thị Thương
* **Mã số sinh viên:** 23IT.B219
* **Lớp sinh hoạt:** 23SE4
* **Lớp học phần:** Phát triển ứng dụng di động đa nền tảng (4)
* **Email sinh viên:** [thuongnt.23itb@vku.udn.vn](mailto:thuongnt.23itb@vku.udn.vn)
* **Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn
* **Tên đề tài:** *VKU Field Survey — Hệ thống thu thập dữ liệu & kiểm định thực địa ngoại tuyến, Đồng bộ thời gian thực & Liên thông Đặt phòng VKU (PWA & Capacitor Native)*
* **Thời gian thực hiện:** Tuần 3 – Tuần 4 • **Trọng số điểm:** 10% • **Ngày cập nhật:** 12/10/2026

---

## 1. THÔNG TIN BÀN GIAO & LIÊN KẾT MINH CHỨNG (DELIVERABLES)
* **🌐 Live Demo URL (VKU Field Survey - Mini-Project 1):** [https://vku-field-survey-28x.pages.dev/](https://vku-field-survey-28x.pages.dev/)
* **🌐 Hệ sinh thái liên kết (VKU Room Booking - Mini-Project 2):** [https://vku-room-booking-17t.pages.dev/](https://vku-room-booking-17t.pages.dev/)
* **📁 GitHub Repository:** [https://github.com/thuong614oh65/vku-field-survey-pwa](https://github.com/thuong614oh65/vku-field-survey-pwa)
* **📱 Đóng gói ứng dụng di động:**
  - **Android:** Dự án Android Studio hoàn chỉnh (`android/`) kèm quy trình tự động build file `app-debug.apk` qua GitHub Actions.
  - **iPhone (iOS):** Dự án Xcode (`ios/`) kèm cơ chế PWA Standalone cài đặt trực tiếp về Màn hình chính chạy độc lập 100%.

---

## 2. BẢNG KIỂM TRA ĐỐI SOÁT TÍNH NĂNG (FEATURE CHECKLIST)

| STT | Tính năng yêu cầu | Trạng thái | Minh chứng kỹ thuật trong mã nguồn |
|:---:|:---|:---:|:---|
| 1 | **PWA Standalone & Local Icons** | ✅ Đạt 100% | `manifest.json`: `display: standalone`, `theme_color: #0284c7`, icon 192x192 & 512x512 cục bộ. |
| 2 | **Service Worker v15 Network-First + Offline Cache** | ✅ Mới nâng cấp | `sw.js`: Ưu tiên tải bản mới nhất khi có mạng và tự động fallback về Cache khi mất mạng (<1s). |
| 3 | **Multi-step Inspection Form** | ✅ Đạt 100% | `index.html`: 4 bước khảo sát chuẩn ODK Collect, giao diện hiện đại, trực quan. |
| 4 | **Đồng hồ Thời Gian Thực Chuẩn Server (Live Clock)** | ✅ Mới nâng cấp | `calibrateRealServerTime()` & `syncSurveyTimeToRealTime()`: Đồng bộ HTTP `Date` từ Cloudflare Server, chạy từng giây (`🟢 Thời gian thực: HH:MM:SS`) và không bị ghi đè bởi bản nháp cũ. |
| 5 | **Liên thông 2 chiều với VKU Room Booking (MP2)** | ✅ Mới nâng cấp | `prefillFromRoomBookingParams()`: Tự động nhận mã phòng, tòa nhà, tầng, họ tên, MSSV khi chuyển từ ứng dụng Đặt phòng VKU sang; tích hợp nút **`🏫 Đặt Phòng VKU`** trên Header. |
| 6 | **Định vị GPS ("Lấy tọa độ vệ tinh")** | ✅ Đạt 100% | Thu thập Vĩ độ, Kinh độ, Sai số mét và liên kết mở trực tiếp trên Google Maps. |
| 7 | **Camera & Nén ảnh Canvas** | ✅ Đạt 100% | Nén ảnh tự động về chuẩn JPEG ~95KB, lưu trữ vào IndexedDB chống tràn bộ nhớ. |
| 8 | **Lưu ảnh vào máy điện thoại** | ✅ Đạt 100% | Hàm `savePhotoToDevice()`: Tự động lưu ảnh khi chụp, nút tải thủ công và nút tải lại trong lịch sử. |
| 9 | **5 Nhóm thiết bị & Đánh giá 1-5 sao** | ✅ Đạt 100% | Gồm `Hardware`, `Projector`, `AC`, `Electrical`, `Furniture`, `Market/Service` và radio 1-5 sao. |
| 10 | **Real-time Draft Persistence** | ✅ Đạt 100% | `db.js`: Tự động lưu nháp sau 450ms; khôi phục dữ liệu khi bấm F5 mà vẫn giữ thời gian thực hiện tại. |
| 11 | **Offline Queue (PENDING_SYNC)** | ✅ Đạt 100% | Cấp phát mã UUID v4 RFC-4122 độc nhất, timestamp ISO thực tế và gắn nhãn màu cam `PENDING_SYNC`. |
| 12 | **Background Sync & Auto-Dispatch** | ✅ Đạt 100% | Bắt sự kiện `window.ononline`, tự động đồng bộ tuần tự từng bản ghi và đổi trạng thái `SYNCED`. |
| 13 | **Xuất báo cáo Excel / CSV** | ✅ Đạt 100% | Xuất file CSV chuẩn UTF-8 BOM mở trực tiếp trên Microsoft Excel không bị lỗi font tiếng Việt. |
| 14 | **Đóng gói Android Studio & iPhone Xcode Native** | ✅ Đạt 100% | Sinh thư mục `android/` và `ios/`, cấu hình đầy đủ quyền Camera, Storage, GPS. |

---

## 3. KIẾN TRÚC HỆ THỐNG & CÁC NÂNG CẤP TRỌNG TÂM

### 3.1. Cơ chế Đồng hồ Thời Gian Thực Chuẩn Xác (Server-Calibrated Real-Time Clock)
* Khắc phục triệt để tình trạng trường `Thời gian khảo sát` bị giữ nguyên giờ cũ từ bản nháp `IndexedDB` hoặc lệch giờ đồng hồ thiết bị:
  1. Khi khởi chạy, hàm `calibrateRealServerTime()` gửi truy vấn `HEAD` nhẹ tới máy chủ để lấy header `Date` chuẩn quốc tế và tính độ lệch `serverTimeOffsetMs`.
  2. Bộ đếm `setInterval` cập nhật huy hiệu **`🟢 Thời gian thực: HH:MM:SS • DD/MM/YYYY`** mỗi giây và tự động đồng bộ vào ô `#survey-time` cho tới khi người dùng chủ động chỉnh tay.
  3. Khi khôi phục bản nháp (`restoreDraftIfPresent`), hệ thống khôi phục toàn bộ nội dung khảo sát nhưng **bảo toàn thời gian thực hiện tại**, và ghi nhận đúng thời điểm thực tế lúc nhấn nút gửi báo cáo.

### 3.2. Liên thông Hệ sinh thái với Mini-Project 2 (`VKU Room Booking`)
* Khi sinh viên bấm nút **`📊 Đánh Giá CSVC`** từ ứng dụng **VKU Room Booking** (`https://vku-room-booking-17t.pages.dev/`), hệ thống truyền các tham số `?from=room-booking&room=V.A201&building=Khu+V&floor=Tầng+2&name=...&studentId=...`.
* Hàm `prefillFromRoomBookingParams()` trong `app.js` tự động ánh xạ tòa nhà, tầng, mã phòng, họ tên, MSSV vào biểu mẫu khảo sát và hiển thị thông báo chào mừng, tạo thành quy trình khép kín: **Đặt phòng học $\rightarrow$ Quét QR Check-in $\rightarrow$ Khảo sát & Đánh giá CSVC phòng học**.

---

*Đà Nẵng, Ngày 12 tháng 10 năm 2026*  
**Sinh viên thực hiện:**  
**Nguyễn Thị Thương (23IT.B219 - Lớp 23SE4)**
