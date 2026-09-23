/**
 * Stavya Spine Hospital — Enterprise Integration & Portability API Client SDK
 * Helpers for third-party HIS, EMR, ERP, and Tally software integration.
 */

const API_BASE_URL = typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://localhost:3000/api/v1';

/**
 * Fetch API Health Status
 */
export async function getApiHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

/**
 * Download / Export Complete Software Data Package
 */
export async function exportDataPackage() {
  const res = await fetch(`${API_BASE_URL}/export`);
  if (!res.ok) throw new Error('Failed to export data package');
  return await res.json();
}

/**
 * Import Software Data Package from external JSON payload
 */
export async function importDataPackage(payload) {
  const res = await fetch(`${API_BASE_URL}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to import payload');
  }
  return await res.json();
}

/**
 * List Discount Requests with optional filters
 */
export async function fetchDiscountRequests(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const url = `${API_BASE_URL}/requests${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch requests');
  return await res.json();
}

/**
 * Create a new discount request via REST API
 */
export async function createDiscountRequestApi(requestData) {
  const res = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create discount request');
  }
  return await res.json();
}

/**
 * Register Callback Webhook URL
 */
export async function registerWebhookApi(url, events = ["REQUEST_CREATED", "REQUEST_APPROVED", "REQUEST_REJECTED"]) {
  const res = await fetch(`${API_BASE_URL}/webhooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, events })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to register webhook');
  }
  return await res.json();
}

/**
 * Trigger Test Webhook Event
 */
export async function triggerTestWebhookApi() {
  const res = await fetch(`${API_BASE_URL}/webhooks/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return await res.json();
}

/**
 * Standard Third-Party HIS/EMR Payload Adapter
 * Converts external hospital system schemas (e.g. Cerner, Epic, Meditech, Tally, custom HIS) into Stavya schema.
 */
export function adaptExternalHisRecord(hisRecord) {
  return {
    patientId: hisRecord.uhid || hisRecord.patient_id || hisRecord.mrn || `UHID-${Date.now()}`,
    patientName: hisRecord.patient_name || hisRecord.name || 'Unknown Patient',
    patientAge: Number(hisRecord.age) || 40,
    patientGender: hisRecord.gender || 'Male',
    department: hisRecord.dept || hisRecord.department || 'OPD',
    serviceName: hisRecord.service || hisRecord.procedure || 'Consultation Fees',
    doctorName: hisRecord.doctor || hisRecord.consultant || 'Attending Doctor',
    totalBillAmount: Number(hisRecord.gross_amount || hisRecord.total_bill || hisRecord.amount) || 0,
    requestedDiscountType: hisRecord.discount_unit === 'INR' ? 'FIXED' : 'PERCENTAGE',
    requestedDiscountVal: Number(hisRecord.discount_value || hisRecord.discount_percent || 10),
    reasonCategory: hisRecord.reason_type || 'Management Special Grant',
    detailedReason: hisRecord.remarks || hisRecord.comments || 'Ported from External HIS System',
    requestedBy: hisRecord.operator || 'External HIS Porting Engine'
  };
}
