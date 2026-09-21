import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = 'https://iqxeglbbvseirtjbwtdu.supabase.co';
let supabaseKey = 'sb_publishable_5fFaz9BHk_oxp_LyBH9e4A_8JtEIErr';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'VITE_SUPABASE_URL' && val) supabaseUrl = val;
      if (key === 'VITE_SUPABASE_ANON_KEY' && val) supabaseKey = val;
    }
  });
}

console.log('📡 Connecting to Supabase URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

// Read data.json
const dataPath = path.resolve(__dirname, '../data.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

async function pushData() {
  console.log(`\n--- Pushing ${data.users.length} Users to hospital_users table ---`);
  const { data: usersData, error: usersErr } = await supabase
    .from('hospital_users')
    .upsert(data.users, { onConflict: 'id' });

  if (usersErr) {
    console.error('❌ Error pushing users:', usersErr.message);
    if (usersErr.code === '42P01') {
      console.error('💡 Hint: The "hospital_users" table does not exist in your Supabase database yet. Please run the SQL schema script in your Supabase SQL Editor.');
    }
  } else {
    console.log('✅ Users pushed/synced successfully!');
  }

  console.log(`\n--- Pushing ${data.requests.length} Discount Requests to discount_requests table ---`);
  const formattedRequests = data.requests.map(req => ({
    id: req.id,
    request_code: req.requestCode,
    patient_id: req.patientId,
    patient_name: req.patientName,
    patient_age: req.patientAge,
    patient_gender: req.patientGender,
    department: req.department,
    service_name: req.serviceName,
    doctor_name: req.doctorName,
    particulars: req.particulars,
    reference_name: req.referenceName,
    relative_name: req.relativeName,
    receipt_no: req.receiptNo,
    bill_date: req.billDate,
    opd_ipd_no: req.opdIpdNo,
    total_bill_amount: req.totalBillAmount,
    requested_discount_type: req.requestedDiscountType,
    requested_discount_val: req.requestedDiscountVal,
    calculated_discount_amount: req.calculatedDiscountAmount,
    final_payable_amount: req.finalPayableAmount,
    reason_category: req.reasonCategory,
    detailed_reason: req.detailedReason,
    proof_file_name: req.proofFileName,
    requested_by: req.requestedBy,
    required_authority_role: req.requiredAuthorityRole,
    current_approver_role: req.currentApproverRole,
    status: req.status,
    is_direct_executive_grant: req.isDirectExecutiveGrant,
    approver_comments: req.approverComments,
    approved_by: req.approvedBy,
    approval_timestamp: req.approvalTimestamp,
    approval_chain: req.approvalChain
  }));

  const { data: reqsData, error: reqsErr } = await supabase
    .from('discount_requests')
    .upsert(formattedRequests, { onConflict: 'id' });

  if (reqsErr) {
    console.error('❌ Error pushing requests:', reqsErr.message);
    if (reqsErr.code === '42P01') {
      console.error('💡 Hint: The "discount_requests" table does not exist in your Supabase database yet. Please run the SQL schema script in your Supabase SQL Editor.');
    }
  } else {
    console.log('✅ Discount Requests pushed/synced successfully!');
  }
  if (Array.isArray(data.doctors) && data.doctors.length > 0) {
    console.log(`\n--- Pushing ${data.doctors.length} Doctors to hospital_doctors table ---`);
    const docRecords = data.doctors.map(d => ({
      id: 'DOC-' + d.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: d
    }));
    const { error: docsErr } = await supabase
      .from('hospital_doctors')
      .upsert(docRecords, { onConflict: 'name' });

    if (docsErr) {
      console.error('❌ Error pushing doctors:', docsErr.message);
    } else {
      console.log('✅ Doctors pushed/synced successfully!');
    }
  }
}

pushData();
