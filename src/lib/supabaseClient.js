import { createClient } from '@supabase/supabase-js';

let cachedClient = null;
let lastUrl = null;
let lastKey = null;

const DEFAULT_URL = 'https://iqxeglbbvseirtjbwtdu.supabase.co';
const DEFAULT_KEY = 'sb_publishable_5fFaz9BHk_oxp_LyBH9e4A_8JtEIErr';

/**
 * Get or initialize Supabase Client instance
 */
export const getSupabaseClient = (customUrl, customKey) => {
  let url = customUrl || import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL;
  let key = customKey || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_KEY;

  if (!url || url.includes('mock')) {
    url = DEFAULT_URL;
  }
  if (!key || key.includes('mock')) {
    key = DEFAULT_KEY;
  }

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('[Supabase] Initialization error:', err);
    return null;
  }
};

/**
 * SQL Schema script for user reference when setting up real Supabase database
 */
export const SUPABASE_SQL_SCHEMA = `-- CarePulse / Stavya Hospital Billing Discount Database Schema
-- Paste and Run this in your Supabase Project SQL Editor (https://app.supabase.com):

-- 1. Create User Directory Table
CREATE TABLE IF NOT EXISTS hospital_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'ADMIN', 'BILLING_MANAGER', 'CFO', 'MD', 'DOCTOR', 'RECEPTIONIST'
  designation TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT TRUE,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Discount Requests Table
CREATE TABLE IF NOT EXISTS discount_requests (
  id TEXT PRIMARY KEY,
  request_code TEXT NOT NULL UNIQUE,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INT,
  patient_gender TEXT,
  department TEXT NOT NULL,
  service_name TEXT,
  doctor_name TEXT NOT NULL,
  particulars TEXT,
  reference_name TEXT,
  relative_name TEXT,
  receipt_no TEXT,
  bill_date TEXT,
  opd_ipd_no TEXT,
  total_bill_amount NUMERIC NOT NULL,
  requested_discount_type TEXT NOT NULL DEFAULT 'PERCENTAGE', -- 'PERCENTAGE' or 'FIXED'
  requested_discount_val NUMERIC NOT NULL,
  calculated_discount_amount NUMERIC NOT NULL,
  final_payable_amount NUMERIC NOT NULL,
  reason_category TEXT NOT NULL,
  detailed_reason TEXT NOT NULL,
  proof_file_name TEXT,
  requested_by TEXT NOT NULL,
  required_authority_role TEXT NOT NULL,
  current_approver_role TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING_BMGR', -- 'PENDING_BMGR', 'PENDING_CFO', 'PENDING_MD', 'APPROVED', 'REJECTED'
  is_direct_executive_grant BOOLEAN DEFAULT FALSE,
  approver_comments TEXT,
  approved_by TEXT,
  approval_timestamp TIMESTAMPTZ,
  approval_chain JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Hospital Doctors Directory Table
CREATE TABLE IF NOT EXISTS hospital_doctors (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Turn ON Row Level Security (RLS) & Grant access
ALTER TABLE hospital_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select hospital_users" ON hospital_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert hospital_users" ON hospital_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update hospital_users" ON hospital_users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete hospital_users" ON hospital_users FOR DELETE USING (true);

CREATE POLICY "Allow public select discount_requests" ON discount_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert discount_requests" ON discount_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update discount_requests" ON discount_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete discount_requests" ON discount_requests FOR DELETE USING (true);

CREATE POLICY "Allow public select hospital_doctors" ON hospital_doctors FOR SELECT USING (true);
CREATE POLICY "Allow public insert hospital_doctors" ON hospital_doctors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update hospital_doctors" ON hospital_doctors FOR UPDATE USING (true);
CREATE POLICY "Allow public delete hospital_doctors" ON hospital_doctors FOR DELETE USING (true);

-- 5. Enable Realtime Publications for Live Sync across all browsers/devices
ALTER PUBLICATION supabase_realtime ADD TABLE discount_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE hospital_users;
ALTER PUBLICATION supabase_realtime ADD TABLE hospital_doctors;
`;
