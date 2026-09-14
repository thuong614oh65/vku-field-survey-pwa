/**
 * IndexedDB Database Module: VKU Field Survey
 * Triển khai lưu trữ có cấu trúc Offline-First và Hàng đợi đồng bộ PENDING_SYNC
 */

const DB_NAME = 'VKU_FieldSurvey_DB';
const DB_VERSION = 2; // Nâng cấp để hỗ trợ store draft & UUID key
const STORE_SURVEYS = 'surveys';
const STORE_DRAFT = 'draft';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Store lưu trữ các phiếu khảo sát (Khóa chính là UUID)
      if (!db.objectStoreNames.contains(STORE_SURVEYS)) {
        const surveyStore = db.createObjectStore(STORE_SURVEYS, { keyPath: 'id' });
        surveyStore.createIndex('status', 'status', { unique: false });
        surveyStore.createIndex('timestamp', 'timestamp', { unique: false });
        surveyStore.createIndex('building', 'building', { unique: false });
        surveyStore.createIndex('category', 'category', { unique: false });
      }

      // 2. Store lưu trữ bản nháp thời gian thực (Real-time Draft Persistence)
      if (!db.objectStoreNames.contains(STORE_DRAFT)) {
        db.createObjectStore(STORE_DRAFT, { keyPath: 'key' });
      }

      console.log('[IndexedDB] Nâng cấp cấu trúc Database v2 thành công.');
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Sinh chuỗi UUID v4 chuẩn RFC-4122
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Thêm một phiếu khảo sát mới vào IndexedDB
 * Gắn nhãn trạng thái mặc định: 'PENDING_SYNC'
 */
async function addSurveyRecord(data) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SURVEYS, 'readwrite');
    const store = tx.objectStore(STORE_SURVEYS);

    const record = {
      ...data,
      id: data.id || generateUUID(),
      status: data.status || 'PENDING_SYNC',
      timestamp: data.timestamp || new Date().toISOString()
    };

    const request = store.add(record);
    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cập nhật hoặc chèn một phiếu khảo sát (Upsert)
 */
async function upsertSurveyRecord(data) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SURVEYS, 'readwrite');
    const store = tx.objectStore(STORE_SURVEYS);
    const request = store.put(data);
    request.onsuccess = () => resolve(data);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lấy tất cả các phiếu khảo sát
 */
async function getAllSurveyRecords() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SURVEYS, 'readonly');
    const store = tx.objectStore(STORE_SURVEYS);
    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result || [];
      records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(records);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lấy danh sách các phiếu đang chờ đồng bộ (status = 'PENDING_SYNC')
 */
async function getPendingSurveyRecords() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SURVEYS, 'readonly');
    const store = tx.objectStore(STORE_SURVEYS);
    const index = store.index('status');
    const request = index.getAll('PENDING_SYNC');

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cập nhật trạng thái phiếu đã được đồng bộ lên máy chủ
 */
async function markSurveyAsSynced(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SURVEYS, 'readwrite');
    const store = tx.objectStore(STORE_SURVEYS);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const data = getRequest.result;
      if (data) {
        data.status = 'SYNCED';
        data.syncedAt = new Date().toISOString();
        const updateRequest = store.put(data);
        updateRequest.onsuccess = () => resolve(true);
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve(false);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Xóa một bản ghi phiếu khảo sát
 */
async function deleteSurveyRecord(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SURVEYS, 'readwrite');
    const store = tx.objectStore(STORE_SURVEYS);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lưu bản nháp biểu mẫu theo thời gian thực (Real-time Draft Persistence)
 */
async function saveDraftForm(draftData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFT, 'readwrite');
    const store = tx.objectStore(STORE_DRAFT);
    const record = { key: 'current_draft', data: draftData, updatedAt: new Date().toISOString() };
    const request = store.put(record);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lấy bản nháp đã lưu
 */
async function getDraftForm() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFT, 'readonly');
    const store = tx.objectStore(STORE_DRAFT);
    const request = store.get('current_draft');
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Xóa bản nháp sau khi đã gửi thành công
 */
async function clearDraftForm() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DRAFT, 'readwrite');
    const store = tx.objectStore(STORE_DRAFT);
    const request = store.delete('current_draft');
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Xuất các phương thức ra window
window.SurveyDB = {
  addSurveyRecord,
  upsertSurveyRecord,
  getAllSurveyRecords,
  getPendingSurveyRecords,
  markSurveyAsSynced,
  deleteSurveyRecord,
  saveDraftForm,
  getDraftForm,
  clearDraftForm,
  generateUUID
};
