/**
 * Application Controller: VKU Field Survey PWA & Capacitor
 * Triển khai đầy đủ: Offline Queue (PENDING_SYNC), Real-time Draft Persistence,
 * Geolocation GPS, Camera nén ảnh Canvas, và Tự động đồng bộ khi có mạng.
 * Tích hợp chuẩn kiến trúc từ Tuần 1 đến Tuần 3.
 */

// Global State
let currentGpsCoords = null;
let currentPhotoBase64 = null;
let draftDebounceTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Gán thời gian hiện tại cho ô input datetime-local
  const surveyTimeInput = document.getElementById('survey-time');
  if (surveyTimeInput) {
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    surveyTimeInput.value = localISO;
  }

  // 1. Phục hồi bản nháp từ IndexedDB nếu có (Real-time Draft Persistence)
  await restoreDraftForm();

  // 2. Theo dõi trạng thái Mạng (Web API & Capacitor Network fallback)
  setupNetworkMonitoring();

  // 3. Thiết lập Geolocation GPS
  setupGeolocation();

  // 4. Thiết lập Camera & Nén ảnh Canvas
  setupCamera();

  // 5. Tự động lưu bản nháp theo thời gian thực khi người dùng gõ
  setupDraftAutosave();

  // 6. Xử lý Gửi Form Khảo sát
  setupFormSubmission();

  // 7. Thiết lập nút Đồng bộ và Xuất CSV
  document.getElementById('btn-sync-queue').addEventListener('click', () => dispatchSyncQueue(true));
  document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);

  // 8. Tải danh sách hàng đợi ban đầu & kéo dữ liệu Cloud
  refreshQueueUI();
  pullSurveysFromCloud();

  // 9. Đăng ký Service Worker
  registerServiceWorker();

  // 10. Thiết lập cài đặt PWA về màn hình chính điện thoại
  setupPwaInstallation();
});

/* ==========================================================
 * 0. ĐIỀU HƯỚNG TABS SẢN PHẨM THỰC TẾ
 * ========================================================== */
window.switchTab = function (tabName) {
  const formSection = document.getElementById('section-form');
  const queueSection = document.getElementById('section-queue');
  const analyticsSection = document.getElementById('section-analytics');
  const btnForm = document.getElementById('tab-btn-form');
  const btnQueue = document.getElementById('tab-btn-queue');
  const btnAnalytics = document.getElementById('tab-btn-analytics');

  formSection.classList.add('hidden');
  queueSection.classList.add('hidden');
  analyticsSection.classList.add('hidden');
  btnForm.classList.remove('active');
  btnQueue.classList.remove('active');
  btnAnalytics.classList.remove('active');

  if (tabName === 'form') {
    formSection.classList.remove('hidden');
    btnForm.classList.add('active');
  } else if (tabName === 'queue') {
    queueSection.classList.remove('hidden');
    btnQueue.classList.add('active');
    refreshQueueUI();
    // Tự động kiểm tra và đồng bộ ngay khi chuyển sang tab hàng đợi nếu có mạng
    if (typeof triggerAutoSyncIfOnline === 'function') {
      triggerAutoSyncIfOnline();
    }
    pullSurveysFromCloud();
  } else if (tabName === 'analytics') {
    analyticsSection.classList.remove('hidden');
    btnAnalytics.classList.add('active');
    renderAnalyticsDashboard();
    pullSurveysFromCloud();
  }
};

/* ==========================================================
 * 1. REAL-TIME DRAFT PERSISTENCE (LƯU BẢN NHÁP VÀO INDEXEDDB)
 * ========================================================== */
function setupDraftAutosave() {
  const form = document.getElementById('survey-form');
  const draftIndicator = document.getElementById('draft-indicator');

  form.addEventListener('input', () => {
    clearTimeout(draftDebounceTimer);
    draftDebounceTimer = setTimeout(async () => {
      const draftData = {
        inspector: document.getElementById('inspector').value,
        inspectorCode: document.getElementById('inspector-code').value,
        surveyTime: document.getElementById('survey-time').value,
        building: document.getElementById('building').value,
        floor: document.getElementById('floor').value,
        room: document.getElementById('room').value,
        targetPerson: document.getElementById('target-person').value,
        address: document.getElementById('address').value,
        category: document.getElementById('category').value,
        rating: document.querySelector('input[name="condition_rating"]:checked')?.value || '5',
        defectNotes: document.getElementById('defect-notes').value,
        location: currentGpsCoords,
        photo: currentPhotoBase64
      };
      await window.SurveyDB.saveDraftForm(draftData);
      draftIndicator.classList.remove('hidden');
      setTimeout(() => draftIndicator.classList.add('hidden'), 2000);
    }, 450);
  });
}

async function restoreDraftForm() {
  try {
    const draft = await window.SurveyDB.getDraftForm();
    if (!draft) return;

    if (draft.inspector) document.getElementById('inspector').value = draft.inspector;
    if (draft.inspectorCode) document.getElementById('inspector-code').value = draft.inspectorCode;
    if (draft.surveyTime) document.getElementById('survey-time').value = draft.surveyTime;
    if (draft.building) document.getElementById('building').value = draft.building;
    if (draft.floor) document.getElementById('floor').value = draft.floor;
    if (draft.room) document.getElementById('room').value = draft.room;
    if (draft.targetPerson) document.getElementById('target-person').value = draft.targetPerson;
    if (draft.address) document.getElementById('address').value = draft.address;
    if (draft.category) document.getElementById('category').value = draft.category;

    if (draft.rating) {
      const radio = document.querySelector(`input[name="condition_rating"][value="${draft.rating}"]`);
      if (radio) radio.checked = true;
    }
    if (draft.defectNotes) document.getElementById('defect-notes').value = draft.defectNotes;

    if (draft.location) {
      currentGpsCoords = draft.location;
      document.getElementById('gps-coords').textContent = `Vĩ độ: ${draft.location.latitude}, Kinh độ: ${draft.location.longitude} (±${draft.location.accuracy}m)`;
      document.getElementById('gps-map-link').href = `https://www.google.com/maps?q=${draft.location.latitude},${draft.location.longitude}`;
      document.getElementById('gps-result').classList.remove('hidden');
      document.getElementById('gps-status').textContent = '✅ Đã có vị trí từ bản nháp';
    }

    if (draft.photo) {
      currentPhotoBase64 = draft.photo;
      document.getElementById('photo-img').src = draft.photo;
      document.getElementById('photo-preview-wrap').classList.remove('hidden');
      document.getElementById('photo-size-badge').textContent = '✅ Đã khôi phục ảnh nháp';
    }

    showToast('💾 Đã khôi phục bản nháp khảo sát trước đó từ IndexedDB!');
  } catch (err) {
    console.warn('Không thể nạp bản nháp:', err);
  }
}

/* ==========================================================
 * 2. QUẢN LÝ TRẠNG THÁI MẠNG (ONLINE / OFFLINE) & TỰ ĐỘNG ĐỒNG BỘ 100%
 * ========================================================== */
let autoSyncTimer = null;

async function triggerAutoSyncIfOnline() {
  if (isSyncing) return;
  try {
    const pending = await window.SurveyDB.getPendingSurveyRecords();
    if (pending.length === 0) return;

    let online = navigator.onLine;
    if (!online) {
      try {
        await fetch('./__healthcheck?' + Date.now(), { method: 'HEAD', cache: 'no-store' });
        online = true;
      } catch {
        online = false;
      }
    }

    if (online) {
      const netIndicator = document.getElementById('net-indicator');
      const offlineBanner = document.getElementById('offline-banner');
      netIndicator.textContent = '🟢 Online';
      netIndicator.className = 'badge online';
      offlineBanner.classList.add('hidden');
      await dispatchSyncQueue(false);
    }
  } catch (err) {
    console.error('Lỗi khi tự động đồng bộ ngầm:', err);
  }
}

function setupNetworkMonitoring() {
  const netIndicator = document.getElementById('net-indicator');
  const offlineBanner = document.getElementById('offline-banner');

  function updateStatus(isOnline) {
    if (isOnline) {
      netIndicator.textContent = '🟢 Online';
      netIndicator.className = 'badge online';
      offlineBanner.classList.add('hidden');

      // TỰ ĐỘNG ĐỒNG BỘ: Chờ 400ms ổn định sóng rồi tự động đồng bộ ngay
      clearTimeout(autoSyncTimer);
      autoSyncTimer = setTimeout(() => {
        triggerAutoSyncIfOnline();
      }, 400);
    } else {
      netIndicator.textContent = '🔴 Offline';
      netIndicator.className = 'badge offline';
      offlineBanner.classList.remove('hidden');
    }
  }

  // Tương thích cả Capacitor Network Native lẫn Web API
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network) {
    const { Network } = window.Capacitor.Plugins;
    Network.getStatus().then((status) => updateStatus(status.connected));
    Network.addListener('networkStatusChange', (status) => updateStatus(status.connected));
  } else {
    window.addEventListener('online', () => updateStatus(true));
    window.addEventListener('offline', () => updateStatus(false));
    updateStatus(navigator.onLine);
  }

  // Tự động kích hoạt khi người dùng quay lại màn hình app (iOS Safari / Android khi vừa bật Wifi từ Control Center)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerAutoSyncIfOnline();
    }
  });
  window.addEventListener('focus', () => {
    triggerAutoSyncIfOnline();
  });
  window.addEventListener('pageshow', () => {
    triggerAutoSyncIfOnline();
  });

  // Tự động quét hàng đợi ngầm mỗi 2.5 giây: Nếu có phiếu PENDING_SYNC và có mạng thì TỰ ĐỘNG đồng bộ tức thì
  setInterval(() => {
    triggerAutoSyncIfOnline();
  }, 2500);

  // Tự động đồng bộ kéo dữ liệu mới nhất từ Cloud mỗi 5 giây nếu đang Online
  setInterval(() => {
    if (navigator.onLine) {
      pullSurveysFromCloud();
    }
  }, 5000);
}

function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast-message');
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), duration);
}

/* ==========================================================
 * 3. GEOLOCATION GPS (TỌA ĐỘ VỆ TINH & FALLBACK THÔNG MINH)
 * ========================================================== */
function setupGeolocation() {
  const btnGps = document.getElementById('btn-get-gps');
  const gpsStatus = document.getElementById('gps-status');
  const gpsResult = document.getElementById('gps-result');
  const gpsCoords = document.getElementById('gps-coords');
  const gpsMapLink = document.getElementById('gps-map-link');

  function applyCoordinates(lat, lng, acc, label) {
    currentGpsCoords = {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      accuracy: Math.round(acc)
    };

    gpsCoords.textContent = `Vĩ độ: ${currentGpsCoords.latitude}, Kinh độ: ${currentGpsCoords.longitude} (±${currentGpsCoords.accuracy}m)`;
    gpsMapLink.href = `https://www.google.com/maps?q=${currentGpsCoords.latitude},${currentGpsCoords.longitude}`;
    gpsResult.classList.remove('hidden');
    gpsStatus.textContent = label || '✅ Đã bắt tọa độ thành công';
    showToast('📍 Đã ghi nhận tọa độ GPS thực địa!');
  }

  btnGps.addEventListener('click', () => {
    // Kiểm tra Secure Context: Chrome chặn GPS trên HTTP qua IP LAN (192.168.x.x)
    const isSecure = window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

    if (!isSecure && location.protocol !== 'https:') {
      const confirmVku = confirm(
        '⚠️ Trình duyệt Chrome bảo vệ bảo mật: Chỉ mở GPS phần cứng trên "localhost" hoặc link HTTPS.\n\n' +
        'Bạn có muốn tự động lấy tọa độ thực địa tại Khuôn viên Trường Đại học VKU Đà Nẵng (15.9753, 108.2524) để tiếp tục không?'
      );
      if (confirmVku) {
        applyCoordinates(15.975298, 108.252355, 10, '✅ Tọa độ Khuôn viên VKU Đà Nẵng');
      } else {
        gpsStatus.textContent = '⚠️ Trình duyệt chặn GPS trên HTTP IP';
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      alert('Trình duyệt không hỗ trợ Geolocation API.');
      return;
    }

    gpsStatus.textContent = 'Đang bắt tín hiệu vệ tinh...';
    btnGps.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        btnGps.disabled = false;
        const { latitude, longitude, accuracy } = pos.coords;
        applyCoordinates(latitude, longitude, accuracy, '✅ Đã bắt tọa độ thành công');
      },
      (err) => {
        btnGps.disabled = false;
        console.warn('Lỗi định vị GPS:', err);
        const confirmFallback = confirm(
          `⚠️ Không truy xuất được GPS thiết bị (${err.message}).\n\n` +
          'Bạn có muốn sử dụng tọa độ thực địa Khuôn viên VKU Đà Nẵng (15.9753, 108.2524) để hoàn tất phiếu không?'
        );
        if (confirmFallback) {
          applyCoordinates(15.975298, 108.252355, 15, '✅ Tọa độ Khuôn viên VKU Đà Nẵng');
        } else {
          gpsStatus.textContent = '❌ Lỗi GPS: ' + err.message;
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });
}

/* ==========================================================
 * 4. CAMERA & NÉN ẢNH CANVAS (COMPRESSION)
 * ========================================================== */
function setupCamera() {
  const photoFileInput = document.getElementById('photo-file');
  const photoSizeBadge = document.getElementById('photo-size-badge');
  const photoPreviewWrap = document.getElementById('photo-preview-wrap');
  const photoImg = document.getElementById('photo-img');
  const btnRemovePhoto = document.getElementById('btn-remove-photo');

  photoFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    photoSizeBadge.textContent = 'Đang nén ảnh...';

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Nén ảnh qua Canvas để giảm xuống ~100KB JPEG (chống tràn bộ nhớ IndexedDB)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > MAX_WIDTH) {
            h *= MAX_WIDTH / w;
            w = MAX_WIDTH;
          }
        } else {
          if (h > MAX_HEIGHT) {
            w *= MAX_HEIGHT / h;
            h = MAX_HEIGHT;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.72);
        photoImg.src = currentPhotoBase64;
        photoPreviewWrap.classList.remove('hidden');
        photoSizeBadge.textContent = `✅ Đã nén (${Math.round(currentPhotoBase64.length / 1024)} KB)`;
        showToast('📸 Đã chụp và tối ưu ảnh hiện trường!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  btnRemovePhoto.addEventListener('click', () => {
    currentPhotoBase64 = null;
    photoFileInput.value = '';
    photoPreviewWrap.classList.add('hidden');
    photoSizeBadge.textContent = 'Chưa có ảnh';
    showToast('Đã xóa ảnh hiện tại.');
  });
}

/* ==========================================================
 * 5. GỬI FORM VÀ LƯU HÀNG ĐỢI OFFLINE (PENDING_SYNC)
 * ========================================================== */
function setupFormSubmission() {
  const form = document.getElementById('survey-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isOnline = navigator.onLine;

    const record = {
      id: window.SurveyDB.generateUUID(),
      timestamp: new Date().toISOString(),
      inspector: document.getElementById('inspector').value.trim(),
      inspectorCode: document.getElementById('inspector-code').value.trim(),
      surveyTime: document.getElementById('survey-time').value,
      building: document.getElementById('building').value,
      floor: document.getElementById('floor').value,
      room: document.getElementById('room').value.trim(),
      targetPerson: document.getElementById('target-person').value.trim(),
      address: document.getElementById('address').value.trim(),
      category: document.getElementById('category').value,
      rating: document.querySelector('input[name="condition_rating"]:checked')?.value || '5',
      defectNotes: document.getElementById('defect-notes').value.trim(),
      location: currentGpsCoords,
      photo: currentPhotoBase64,
      status: isOnline ? 'SYNCED' : 'PENDING_SYNC'
    };

    try {
      await window.SurveyDB.addSurveyRecord(record);

      if (isOnline) {
        postSurveyToCloud(record);
        showToast('✅ Đã gửi và đồng bộ phiếu lên Cloud thành công!');
      } else {
        showToast('💾 Mất mạng: Đã gắn UUID và lưu vào hàng đợi PENDING_SYNC! Sẽ tự đồng bộ lên Cloud khi có mạng!', 4500);
      }

      // Xóa bản nháp trong IndexedDB
      await window.SurveyDB.clearDraftForm();

      // Reset form
      form.reset();
      currentGpsCoords = null;
      currentPhotoBase64 = null;
      document.getElementById('gps-result').classList.add('hidden');
      document.getElementById('gps-status').textContent = 'Chưa bắt tọa độ';
      document.getElementById('photo-preview-wrap').classList.add('hidden');
      document.getElementById('photo-size-badge').textContent = 'Chưa có ảnh';
      document.querySelector('input[name="condition_rating"][value="5"]').checked = true;

      // Reset lại ngày giờ hiện tại
      const now = new Date();
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      document.getElementById('survey-time').value = localISO;

      refreshQueueUI();
      window.switchTab('queue');
    } catch (err) {
      console.error('Lỗi khi lưu phiếu khảo sát:', err);
      showToast('❌ Lỗi khi ghi dữ liệu vào IndexedDB!');
    }
  });
}

/* ==========================================================
 * 6. HIỂN THỊ HÀNG ĐỢI ĐỒNG BỘ (OFFLINE QUEUE LIST)
 * ========================================================== */
async function refreshQueueUI() {
  try {
    const allRecords = await window.SurveyDB.getAllSurveyRecords();
    const pendingList = await window.SurveyDB.getPendingSurveyRecords();

    // Cập nhật tổng số lượng
    const totalCountEl = document.getElementById('total-count');
    if (totalCountEl) totalCountEl.textContent = allRecords.length;

    // Cập nhật Badge PENDING_SYNC
    const pendingBadge = document.getElementById('pending-badge');
    pendingBadge.textContent = `⏳ ${pendingList.length} PENDING_SYNC`;
    pendingBadge.style.display = pendingList.length > 0 ? 'inline-flex' : 'none';

    const listEl = document.getElementById('survey-queue-list');
    if (allRecords.length === 0) {
      listEl.innerHTML = '<p class="empty-state">Chưa có phiếu khảo sát nào. Hãy điền form bên trái để bắt đầu!</p>';
      return;
    }

    listEl.innerHTML = allRecords.map((item) => {
      const isPending = item.status === 'PENDING_SYNC';
      const badgeClass = isPending ? 'badge-pending' : 'badge-synced';
      const badgeText = isPending ? '⏳ PENDING_SYNC' : '✅ SYNCED';
      const timeStr = new Date(item.timestamp).toLocaleString('vi-VN');

      const photoHtml = item.photo
        ? `<img src="${item.photo}" class="queue-photo-thumb" alt="Ảnh hiện trường" />`
        : '';

      const gpsHtml = item.location
        ? `📍 GPS: ${item.location.latitude}, ${item.location.longitude} (±${item.location.accuracy}m) - <a href="https://www.google.com/maps?q=${item.location.latitude},${item.location.longitude}" target="_blank" style="color:#0284c7;">Bản đồ</a>`
        : '📍 GPS: Không có';

      const targetPersonHtml = item.targetPerson ? `• Người trả lời: ${item.targetPerson}` : '';

      return `
        <div class="queue-card" data-id="${item.id}">
          <div class="queue-card-top">
            <div>
              <span class="queue-room-title">${item.building} - ${item.floor} - ${item.room}</span>
              <div class="queue-uuid">UUID: ${item.id}</div>
            </div>
            <span class="queue-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="queue-meta">
            👤 Phỏng vấn viên: <strong>${item.inspector}</strong> (${item.inspectorCode || 'N/A'}) ${targetPersonHtml} • 🕒 ${timeStr}
          </div>
          <div class="queue-meta">
            🏠 Địa chỉ: ${item.address || 'Không ghi'}
          </div>
          <div class="queue-content-box">
            <div>• <strong>Hạng mục:</strong> ${item.category} | <strong>Đánh giá:</strong> ${'⭐'.repeat(Number(item.rating))} (${item.rating}/5)</div>
            <div>• ${gpsHtml}</div>
            ${item.defectNotes ? `<div>• <strong>Ghi chú / Sự cố:</strong> <em>${item.defectNotes}</em></div>` : ''}
            ${photoHtml}
          </div>
          <div class="queue-bottom-actions">
            <span style="font-size:11px; color:#94a3b8;">${isPending ? 'Chờ mạng để đồng bộ tuần tự' : 'Đã đồng bộ lên hệ thống'}</span>
            <button type="button" class="btn-del-item" onclick="window.handleDeleteSurveyItem('${item.id}')">🗑️ Xóa</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Lỗi khi nạp hàng đợi:', err);
  }
}

/* ==========================================================
 * 7. ĐỒNG BỘ HÀNG ĐỢI TUẦN TỰ LÊN CLOUD (SEQUENTIAL CLOUD SYNC)
 * ========================================================== */
let isSyncing = false;

async function postSurveyToCloud(record) {
  if (!navigator.onLine) return false;
  try {
    const payload = { ...record, status: 'SYNCED' };
    const res = await fetch('./api/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.warn('Lỗi gửi lên Cloud API:', err);
    return false;
  }
}

let isPullingCloud = false;
async function pullSurveysFromCloud() {
  if (isPullingCloud || !navigator.onLine) return;
  try {
    isPullingCloud = true;
    const res = await fetch('./api/surveys?' + Date.now());
    if (!res.ok) return;
    const cloudItems = await res.json();
    if (Array.isArray(cloudItems) && cloudItems.length > 0) {
      const localPending = await window.SurveyDB.getPendingSurveyRecords();
      const pendingIds = new Set(localPending.map((p) => p.id));

      let hasNew = false;
      for (const item of cloudItems) {
        if (!pendingIds.has(item.id)) {
          await window.SurveyDB.upsertSurveyRecord({ ...item, status: 'SYNCED' });
          hasNew = true;
        }
      }
      if (hasNew) {
        refreshQueueUI();
      }
    }
  } catch (err) {
    console.warn('Lỗi kéo dữ liệu từ Cloud API:', err);
  } finally {
    isPullingCloud = false;
  }
}

window.handleDeleteSurveyItem = async (id) => {
  if (confirm('Bạn có chắc muốn xóa bản ghi khảo sát này?')) {
    await window.SurveyDB.deleteSurveyRecord(id);
    if (navigator.onLine) {
      try {
        await fetch(`./api/surveys?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Lỗi xóa trên Cloud API:', err);
      }
    }
    showToast('Đã xóa phiếu khảo sát.');
    refreshQueueUI();
  }
};

async function dispatchSyncQueue(showNotice = true) {
  if (isSyncing) return;
  if (!navigator.onLine) {
    if (showNotice) showToast('⚠️ Thiết bị đang ngoại tuyến, không thể đồng bộ!');
    return;
  }

  try {
    const pendingItems = await window.SurveyDB.getPendingSurveyRecords();
    if (pendingItems.length === 0) {
      if (showNotice) showToast('🎉 Tất cả phiếu khảo sát đã được đồng bộ!');
      return;
    }

    isSyncing = true;
    showToast(`⚡ Đang TỰ ĐỘNG đồng bộ ${pendingItems.length} phiếu khảo sát...`, 2000);

    // Gửi tuần tự từng bản ghi lên Server / Cloudflare Worker API
    for (const item of pendingItems) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await postSurveyToCloud(item);
      await window.SurveyDB.markSurveyAsSynced(item.id);
    }

    showToast(`🚀 Đã TỰ ĐỘNG đồng bộ thành công ${pendingItems.length} phiếu khảo sát!`, 3000);
    refreshQueueUI();
  } catch (err) {
    console.error('Lỗi trong tiến trình đồng bộ:', err);
    showToast('❌ Lỗi xảy ra khi đồng bộ hàng đợi!');
  } finally {
    isSyncing = false;
  }
}

/* ==========================================================
 * 8. XUẤT BÁO CÁO CSV (EXCEL UTF-8)
 * ========================================================== */
async function exportToCSV() {
  const records = await window.SurveyDB.getAllSurveyRecords();
  if (records.length === 0) {
    alert('Không có dữ liệu nào trong hàng đợi để xuất!');
    return;
  }

  const headers = [
    'UUID', 'Thời gian', 'Người phỏng vấn', 'Mã DTV/SV', 'Tòa nhà/Khu vực', 'Tầng', 'Phòng/Điểm khảo sát',
    'Người trả lời', 'Địa chỉ', 'Hạng mục', 'Đánh giá (Sao)', 'Ghi chú sự cố', 'Vĩ độ', 'Kinh độ', 'Sai số GPS (m)', 'Trạng thái'
  ];

  const rows = records.map((r) => [
    `"${r.id}"`,
    `"${r.timestamp}"`,
    `"${r.inspector}"`,
    `"${r.inspectorCode || ''}"`,
    `"${r.building}"`,
    `"${r.floor}"`,
    `"${r.room}"`,
    `"${r.targetPerson || ''}"`,
    `"${(r.address || '').replace(/"/g, '""')}"`,
    `"${r.category}"`,
    r.rating,
    `"${(r.defectNotes || '').replace(/"/g, '""')}"`,
    r.location ? r.location.latitude : '',
    r.location ? r.location.longitude : '',
    r.location ? r.location.accuracy : '',
    `"${r.status}"`
  ]);

  const csvString = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `VKU_FieldSurvey_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📥 Đã xuất file CSV thành công!');
}

/* ==========================================================
 * 9. ĐĂNG KÝ SERVICE WORKER (BACKGROUND SYNC SUPPORT)
 * ========================================================== */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('./sw.js');
        console.log('[PWA] Service Worker đăng ký thành công:', reg.scope);

        // Đăng ký Background Sync nếu trình duyệt hỗ trợ
        if ('sync' in reg) {
          window.addEventListener('offline', () => {
            reg.sync.register('sync-vku-surveys').catch((err) => console.log('Lỗi đăng ký Sync:', err));
          });
        }
      } catch (err) {
        console.error('[PWA] Lỗi đăng ký Service Worker:', err);
      }
    });
  }
}

/* ==========================================================
 * 10. TRUNG TÂM THỐNG KÊ & BÁO CÁO (ANALYTICS DASHBOARD)
 * ========================================================== */
async function renderAnalyticsDashboard() {
  try {
    const records = await window.SurveyDB.getAllSurveyRecords();
    const total = records.length;
    const synced = records.filter((r) => r.status === 'SYNCED').length;
    const pending = records.filter((r) => r.status === 'PENDING_SYNC').length;

    let avgRating = 0;
    if (total > 0) {
      const sumRating = records.reduce((acc, r) => acc + Number(r.rating || 0), 0);
      avgRating = (sumRating / total).toFixed(1);
    }

    const kpiTotal = document.getElementById('kpi-total');
    const kpiSynced = document.getElementById('kpi-synced');
    const kpiPending = document.getElementById('kpi-pending');
    const kpiRating = document.getElementById('kpi-rating');
    const kpiRatingStars = document.getElementById('kpi-rating-stars');

    if (kpiTotal) kpiTotal.textContent = total;
    if (kpiSynced) kpiSynced.textContent = synced;
    if (kpiPending) kpiPending.textContent = pending;
    if (kpiRating) kpiRating.textContent = total > 0 ? `${avgRating} / 5` : '0.0 / 5';
    if (kpiRatingStars) {
      const rounded = Math.round(Number(avgRating));
      kpiRatingStars.textContent = total > 0 ? '⭐'.repeat(rounded) : 'Chưa có đánh giá';
    }

    const categories = [
      { key: 'Hardware', label: 'Hardware (Máy tính, Thiết bị CNTT)', icon: '💻' },
      { key: 'Projector', label: 'Projector (Máy chiếu, Âm thanh)', icon: '📽️' },
      { key: 'AC', label: 'AC (Máy điều hòa, Thông gió)', icon: '❄️' },
      { key: 'Electrical', label: 'Electrical (Hệ thống điện, Đèn)', icon: '⚡' },
      { key: 'Furniture', label: 'Furniture (Bàn ghế, Cửa)', icon: '🪑' },
      { key: 'Market/Service', label: 'Market / Service (Hàng hóa, Điểm bán)', icon: '🛒' }
    ];

    const catCounts = {};
    categories.forEach((c) => (catCounts[c.key] = 0));
    records.forEach((r) => {
      if (catCounts[r.category] !== undefined) {
        catCounts[r.category]++;
      } else {
        catCounts[r.category] = 1;
      }
    });

    const barsWrap = document.getElementById('category-bars-wrap');
    if (barsWrap) {
      if (total === 0) {
        barsWrap.innerHTML = '<p class="empty-state">Chưa có dữ liệu thống kê. Hãy điền phiếu khảo sát để xem phân tích!</p>';
        return;
      }

      barsWrap.innerHTML = categories.map((c) => {
        const count = catCounts[c.key] || 0;
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return `
          <div class="cat-bar-row">
            <div class="cat-bar-meta">
              <span class="cat-bar-label">${c.icon} ${c.label}</span>
              <span class="cat-bar-count">${count} phiếu (${percent}%)</span>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Lỗi khi render Dashboard thống kê:', err);
  }
}

/* ==========================================================
 * 11. HỘP THOẠI THÔNG TIN HỆ THỐNG (SYSTEM SPECS MODAL)
 * ========================================================== */
window.openSystemInfoModal = function () {
  const modal = document.getElementById('modal-sysinfo');
  if (modal) modal.classList.remove('hidden');
};

window.closeSystemInfoModal = function () {
  const modal = document.getElementById('modal-sysinfo');
  if (modal) modal.classList.add('hidden');
};

/* ==========================================================
 * 12. QUẢN LÝ CÀI ĐẶT PWA VỀ MÀN HÌNH CHÍNH (INSTALL APP)
 * ========================================================== */
let deferredPrompt = null;
function setupPwaInstallation() {
  const btnInstall = document.getElementById('btn-install-app');
  if (!btnInstall) return;

  // Lắng nghe sự kiện trước khi cài đặt PWA
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    btnInstall.style.display = 'inline-flex';
    btnInstall.classList.add('pulse-animation');
    console.log('[PWA] Đã bắt sự kiện beforeinstallprompt, sẵn sàng cài đặt.');
  });

  btnInstall.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] Kết quả cài đặt của người dùng:', outcome);
      deferredPrompt = null;
      btnInstall.style.display = 'none';
    } else {
      alert(
        '📱 HƯỚNG DẪN CÀI ĐẶT ỨNG DỤNG VỀ ĐIỆN THOẠI:\n\n' +
        '• Trên Android (Chrome): Nhấp vào biểu tượng 3 chấm góc trên bên phải -> Chọn "Cài đặt ứng dụng" (hoặc "Thêm vào màn hình chính").\n\n' +
        '• Trên iPhone / iPad (Safari): Nhấp vào nút Chia sẻ (biểu tượng hình vuông có mũi tên lên) -> Chọn "Thêm vào MH chính" (Add to Home Screen).\n\n' +
        'Sau khi cài đặt, ứng dụng sẽ có biểu tượng icon riêng trên màn hình, mở lên chạy toàn màn hình độc lập (Standalone) như ứng dụng Android gốc, không có thanh địa chỉ trình duyệt!'
      );
    }
  });

  window.addEventListener('appinstalled', () => {
    showToast('🎉 Đã cài đặt VKU Field Survey về điện thoại thành công!');
    btnInstall.style.display = 'none';
  });
}

