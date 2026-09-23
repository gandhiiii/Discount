import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_NOTIFICATIONS, sendNotification } from '../utils/notificationEngine';
import confetti from 'canvas-confetti';
import { getSupabaseClient } from '../lib/supabaseClient';

const AppContext = createContext();

export const PRESET_DEMO_USERS_LOWER = new Set([
  'usr-finance-mgr',
  'usr-cfo-official',
  'usr-md-exec',
  'usr-doc-sarah',
  'usr-doc-rajesh',
  'usr-doc-michael',
  'finance_mgr',
  'cfo_official',
  'md_director',
  'doc_sarah',
  'doc_rajesh',
  'doc_michael'
]);

export const PRESET_DEMO_DOCTORS_KEYWORDS = [
  'sarah jenkins',
  'sarah jenkin',
  'dr. sarah jenkins',
  'dr. sarah jenkin',
  'michael chang',
  'dr. michael chang',
  'rajesh kumar',
  'dr. rajesh kumar',
  'elena rostova',
  'dr. elena rostova',
  'ananya sharma',
  'dr. ananya sharma',
  'dr test',
  'test doctor',
  'sarah',
  'jenkins',
  'michael',
  'chang',
  'rajesh',
  'elena',
  'rostova',
  'ananya',
  'test'
];

export const isPresetDemoDoctor = (docName) => {
  if (!docName || typeof docName !== 'string') return false;
  const lower = docName.trim().toLowerCase();
  return PRESET_DEMO_DOCTORS_KEYWORDS.some(keyword => lower.includes(keyword));
};

export const isPresetDemoUser = (userObjOrId) => {
  if (!userObjOrId) return false;
  const idStr = typeof userObjOrId === 'string' ? userObjOrId : (userObjOrId.id || userObjOrId.username || '');
  const lower = idStr.trim().toLowerCase();
  const nameStr = typeof userObjOrId === 'object' ? (userObjOrId.name || '') : '';
  return PRESET_DEMO_USERS_LOWER.has(lower) || isPresetDemoDoctor(nameStr) || isPresetDemoDoctor(idStr);
};

const INITIAL_USERS = [
  {
    id: 'USR-ADMIN',
    username: 'admin_sys',
    password: 'admin@123password',
    name: 'Admin System',
    role: 'ADMIN',
    designation: 'System Administrator',
    department: 'IT & Administration',
    email: 'admin@carepulse.com',
    phone: '+1 (555) 000-1122',
    active: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
  }
];


const INITIAL_REQUESTS = [];

const INITIAL_DEPARTMENTS = [
  'Accounts & Finance',
  'Accounts',
  'Billing & Accounts',
  'OPD (Outpatient Department)',
  'IPD (Inpatient Department & Wards)',
  'Emergency & Casualty',
  'ICU & Critical Care',
  'Operation Theatre (OT & Spine Surgery)',
  'Spine & Orthopedic Surgery',
  'Neuro-Spine Surgery & Neurology',
  'Radiology & Imaging',
  'Pathology & Clinical Laboratory',
  'Pharmacy & Medical Supplies',
  'Advance Modality Center',
  'Physiotherapy & Rehabilitation',
  'Anesthesiology & Pain Management',
  'IT & Hospital Administration',
  'Medical Records & Registration (MRD)',
  'Nursing & Patient Care Operations',
  'Housekeeping & Sanitation (Facility)',
  'Front Desk & Reception',
  'F&B (Dietary & Canteen)',
  'Other Support Service'
];

const INITIAL_SERVICES = [
  'Consultation Fees',
  'Pathology',
  'MRI',
  'Open MRI',
  'X-ray',
  'DXA',
  'CT Scan',
  'Sonography / USG',
  'Physiotherapy',
  'EMG/NCV',
  'Rehability',
  'Canteen',
  'Pharmcy',
  'IPD',
  'Ambulance',
  'Pain Management'
];

export const SERVICE_DEPARTMENT_MAP = {
  'Consultation Fees': 'OPD (Outpatient Department)',
  'Pathology': 'Pathology & Clinical Laboratory',
  'MRI': 'Radiology & Imaging',
  'Open MRI': 'Radiology & Imaging',
  'X-ray': 'Radiology & Imaging',
  'DXA': 'Radiology & Imaging',
  'CT Scan': 'Radiology & Imaging',
  'Sonography / USG': 'Radiology & Imaging',
  'Physiotherapy': 'Physiotherapy & Rehabilitation',
  'EMG/NCV': 'Advance Modality Center',
  'Rehability': 'Advance Modality Center',
  'Canteen': 'F&B (Dietary & Canteen)',
  'Pharmcy': 'Pharmacy & Medical Supplies',
  'IPD': 'IPD (Inpatient Department & Wards)',
  'Ambulance': 'Emergency & Casualty',
  'Pain Management': 'Anesthesiology & Pain Management'
};

export const getDepartmentForService = (serviceName) => {
  if (!serviceName) return 'OPD (Outpatient Department)';
  if (SERVICE_DEPARTMENT_MAP[serviceName]) {
    return SERVICE_DEPARTMENT_MAP[serviceName];
  }
  const matchedKey = Object.keys(SERVICE_DEPARTMENT_MAP).find(
    k => k.toLowerCase() === serviceName.toLowerCase()
  );
  return matchedKey ? SERVICE_DEPARTMENT_MAP[matchedKey] : 'Other Support Service';
};

const INITIAL_DOCTORS = [];

export const AppProvider = ({ children }) => {
  const [supabaseConfig, setSupabaseConfigState] = useState(() => {
    const defaultUrl = 'https://iqxeglbbvseirtjbwtdu.supabase.co';
    const defaultKey = 'sb_publishable_5fFaz9BHk_oxp_LyBH9e4A_8JtEIErr';
    const saved = localStorage.getItem('carepulse_supabase_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.url && !parsed.url.includes('mock') && parsed.anonKey && !parsed.anonKey.includes('mock')) {
          return parsed;
        }
      } catch (e) {}
    }
    const envUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || defaultKey;
    return {
      url: envUrl,
      anonKey: envKey,
      isConnected: Boolean(envUrl && envKey)
    };
  });

  const setSupabaseConfig = (config) => {
    setSupabaseConfigState(config);
    localStorage.setItem('carepulse_supabase_config', JSON.stringify(config));
  };

  const [users, setUsers] = useState(() => {
    const savedDel = localStorage.getItem('carepulse_deleted_users');
    const delSet = new Set(savedDel ? JSON.parse(savedDel) : []);
    const saved = localStorage.getItem('carepulse_users');
    if (!saved) return INITIAL_USERS.filter(u => !delSet.has(u.id) && !delSet.has(u.username) && !delSet.has(u.name));
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(u => 
          u.active !== false && 
          u.role !== 'DELETED' && 
          !delSet.has(u.id) && 
          !delSet.has(u.username) && 
          !delSet.has(u.name) &&
          !isPresetDemoUser(u)
        );
        return filtered.length > 0 ? filtered : INITIAL_USERS;
      }
      return INITIAL_USERS.filter(u => !delSet.has(u.id) && !delSet.has(u.username) && !delSet.has(u.name));
    } catch (e) {
      return INITIAL_USERS.filter(u => !delSet.has(u.id) && !delSet.has(u.username) && !delSet.has(u.name));
    }
  });

  const [departments, setDepartments] = useState(() => {
    const savedDel = localStorage.getItem('carepulse_deleted_departments');
    const delSet = new Set(savedDel ? JSON.parse(savedDel) : []);
    const saved = localStorage.getItem('carepulse_departments');
    if (!saved) return INITIAL_DEPARTMENTS.filter(d => !delSet.has(d));
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(d => !delSet.has(d)) : INITIAL_DEPARTMENTS.filter(d => !delSet.has(d));
    } catch (e) {
      return INITIAL_DEPARTMENTS.filter(d => !delSet.has(d));
    }
  });

  const [services, setServices] = useState(() => {
    const savedDel = localStorage.getItem('carepulse_deleted_services');
    const delSet = new Set(savedDel ? JSON.parse(savedDel) : []);
    const saved = localStorage.getItem('carepulse_services');
    if (!saved) return INITIAL_SERVICES.filter(s => !delSet.has(s));
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(s => !delSet.has(s)) : INITIAL_SERVICES.filter(s => !delSet.has(s));
    } catch (e) {
      return INITIAL_SERVICES.filter(s => !delSet.has(s));
    }
  });

  const [doctors, setDoctors] = useState(() => {
    const savedDel = localStorage.getItem('carepulse_deleted_doctors');
    const delSet = new Set(savedDel ? JSON.parse(savedDel) : []);
    const saved = localStorage.getItem('carepulse_doctors');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(d => !delSet.has(d) && !isPresetDemoDoctor(d)) : [];
    } catch (e) {
      return [];
    }
  });

  const [requests, setRequests] = useState(() => {
    const savedDel = localStorage.getItem('carepulse_deleted_requests');
    const delSet = new Set(savedDel ? JSON.parse(savedDel) : []);
    const saved = localStorage.getItem('carepulse_requests');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter(r => r.status !== 'DELETED' && !delSet.has(r.id));
      } catch (e) {
        // ignore parse error
      }
    }
    return INITIAL_REQUESTS.filter(r => r.status !== 'DELETED' && !delSet.has(r.id));
  });

  // Sync doctors directory with local storage filter & purge legacy preset demo data
  useEffect(() => {
    const savedDel = localStorage.getItem('carepulse_deleted_doctors');
    const delSet = new Set(savedDel ? JSON.parse(savedDel) : []);

    setDoctors(prev => {
      const filtered = prev.filter(d => !delSet.has(d) && !isPresetDemoDoctor(d));
      if (JSON.stringify(filtered) !== JSON.stringify(prev)) {
        localStorage.setItem('carepulse_doctors', JSON.stringify(filtered));
        return filtered;
      }
      return prev;
    });

    setUsers(prev => {
      const filtered = prev.filter(u => !isPresetDemoUser(u));
      if (JSON.stringify(filtered) !== JSON.stringify(prev)) {
        const nextUsers = filtered.length > 0 ? filtered : INITIAL_USERS;
        localStorage.setItem('carepulse_users', JSON.stringify(nextUsers));
        return nextUsers;
      }
      return prev;
    });

    // Execute remote delete query on Supabase to clean remote tables
    try {
      const client = getSupabaseClient(supabaseConfig?.url, supabaseConfig?.anonKey);
      if (client) {
        ['sarah', 'jenkins', 'jenkin', 'michael', 'chang', 'rajesh', 'kumar', 'elena', 'rostova', 'ananya', 'sharma', 'test', 'dr test'].forEach(async (kw) => {
          try {
            await client.from('hospital_doctors').delete().ilike('name', `%${kw}%`);
            await client.from('hospital_users').delete().ilike('name', `%${kw}%`);
          } catch (err) {}
        });
        ['usr-finance-mgr', 'usr-cfo-official', 'usr-md-exec', 'usr-doc-sarah', 'usr-doc-rajesh', 'usr-doc-michael', 'finance_mgr', 'cfo_official', 'md_director', 'doc_sarah', 'doc_rajesh', 'doc_michael'].forEach(async (uname) => {
          try {
            await client.from('hospital_users').delete().eq('username', uname);
            await client.from('hospital_users').delete().eq('id', uname.toUpperCase());
          } catch (err) {}
        });
      }
    } catch (err) {}
  }, []);

  const [activeUser, setActiveUser] = useState(() => {
    const savedRole = localStorage.getItem('carepulse_active_user');
    const userList = (users && users.length > 0) ? users : INITIAL_USERS;
    if (savedRole) {
      const found = userList.find(u => u.id === savedRole || u.role === savedRole || u.username === savedRole);
      if (found) return found;
    }
    return userList.find(u => u.role === 'ADMIN') || userList[0] || INITIAL_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('carepulse_is_authenticated');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('carepulse_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [toastAlert, setToastAlert] = useState(null);

  // Sync active user & auth state
  useEffect(() => {
    if (activeUser) {
      localStorage.setItem('carepulse_active_user', activeUser.id);
    }
  }, [activeUser]);

  useEffect(() => {
    localStorage.setItem('carepulse_is_authenticated', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  // Zero-Cloud Local Wi-Fi Network Server Auto-Sync (/api/sync)
  const lastSyncServerTimestampRef = React.useRef(0);
  const isRemoteRequestsRef = React.useRef(false);
  const isRemoteUsersRef = React.useRef(false);
  const isRemoteDoctorsRef = React.useRef(false);

  // Supabase Realtime Database Subscriptions & Fetching
  useEffect(() => {
    const client = getSupabaseClient(supabaseConfig?.url, supabaseConfig?.anonKey);
    if (!client) return;

    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const { data: remoteReqs, error: reqErr } = await client
          .from('discount_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!reqErr && Array.isArray(remoteReqs) && isMounted) {
          const savedDelReqs = localStorage.getItem('carepulse_deleted_requests');
          const deletedReqSet = new Set(savedDelReqs ? JSON.parse(savedDelReqs) : []);

          const mapped = remoteReqs
            .filter(r => r.status !== 'DELETED' && !deletedReqSet.has(r.id))
            .map(r => ({
              id: r.id,
              requestCode: r.request_code,
              patientId: r.patient_id,
              patientName: r.patient_name,
              patientAge: r.patient_age,
              patientGender: r.patient_gender,
              department: r.department,
              serviceName: r.service_name,
              doctorName: r.doctor_name,
              particulars: r.particulars,
              referenceName: r.reference_name,
              relativeName: r.relative_name,
              receiptNo: r.receipt_no,
              billDate: r.bill_date,
              opdIpdNo: r.opd_ipd_no,
              totalBillAmount: Number(r.total_bill_amount) || 0,
              requestedDiscountType: r.requested_discount_type || 'PERCENTAGE',
              requestedDiscountVal: Number(r.requested_discount_val) || 0,
              calculatedDiscountAmount: Number(r.calculated_discount_amount) || 0,
              finalPayableAmount: Number(r.final_payable_amount) || 0,
              reasonCategory: r.reason_category || 'Management Special Grant',
              detailedReason: r.detailed_reason || '',
              proofFileName: r.proof_file_name || '',
              requestedBy: r.requested_by || '',
              requiredAuthorityRole: r.required_authority_role || 'BILLING_MANAGER',
              currentApproverRole: r.current_approver_role || 'BILLING_MANAGER',
              status: r.status || 'PENDING_BMGR',
              isDirectExecutiveGrant: Boolean(r.is_direct_executive_grant),
              approverComments: r.approver_comments || '',
              approvedBy: r.approved_by || '',
              approvalTimestamp: r.approval_timestamp,
              createdAt: r.created_at,
              approvalChain: typeof r.approval_chain === 'string' ? JSON.parse(r.approval_chain) : (r.approval_chain || [])
            }));
          isRemoteRequestsRef.current = true;
          setRequests(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(mapped)) {
              return mapped;
            }
            return prev;
          });
        }

        const { data: remoteUsers, error: userErr } = await client.from('hospital_users').select('*');
        if (!userErr && Array.isArray(remoteUsers) && isMounted) {
          const savedDelUsers = localStorage.getItem('carepulse_deleted_users');
          const deletedUserSet = new Set(savedDelUsers ? JSON.parse(savedDelUsers) : []);
          
          remoteUsers.forEach(async (u) => {
            if (isPresetDemoUser(u)) {
              try {
                await client.from('hospital_users').delete().eq('id', u.id);
                await client.from('hospital_users').delete().eq('username', u.username);
              } catch (e) {}
            }
          });

          const filteredUsers = remoteUsers.filter(u => u.active !== false && u.role !== 'DELETED' && !deletedUserSet.has(u.id) && !deletedUserSet.has(u.username) && !deletedUserSet.has(u.name) && !isPresetDemoUser(u));

          if (filteredUsers.length > 0) {
            isRemoteUsersRef.current = true;
            setUsers(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(filteredUsers)) {
                return filteredUsers;
              }
              return prev;
            });
          }
        }

        const { data: remoteDocs, error: docErr } = await client.from('hospital_doctors').select('*');
        if (!docErr && Array.isArray(remoteDocs) && isMounted) {
          const savedDelDocs = localStorage.getItem('carepulse_deleted_doctors');
          const deletedDocSet = new Set(savedDelDocs ? JSON.parse(savedDelDocs) : []);
          
          remoteDocs.forEach(async (d) => {
            if (isPresetDemoDoctor(d.name)) {
              try {
                await client.from('hospital_doctors').delete().eq('id', d.id);
                await client.from('hospital_doctors').delete().ilike('name', `%${d.name}%`);
              } catch (e) {}
            }
          });

          const fetchedDocNames = remoteDocs.map(d => d.name).filter(name => name && !deletedDocSet.has(name) && !isPresetDemoDoctor(name));

          isRemoteDoctorsRef.current = true;
          setDoctors(prev => {
            const filteredPrev = prev.filter(d => !deletedDocSet.has(d) && !isPresetDemoDoctor(d));
            const merged = Array.from(new Set([...fetchedDocNames, ...filteredPrev]));
            if (JSON.stringify(merged) !== JSON.stringify(prev)) {
              localStorage.setItem('carepulse_doctors', JSON.stringify(merged));
              return merged;
            }
            return prev;
          });
        }
      } catch (e) {
        console.warn('Supabase initial fetch warning:', e);
      }
    };

    fetchInitialData();
    const pollInterval = setInterval(fetchInitialData, 3000);

    // Subscribe to real-time postgres changes
    const channel = client
      .channel('public:realtime-discount-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discount_requests' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const r = payload.new;
            const savedDelReqs = localStorage.getItem('carepulse_deleted_requests');
            const deletedReqSet = new Set(savedDelReqs ? JSON.parse(savedDelReqs) : []);

            if (r.status === 'DELETED' || deletedReqSet.has(r.id)) {
              isRemoteRequestsRef.current = true;
              setRequests(prev => prev.filter(item => item.id !== r.id));
              return;
            }

            const updatedReq = {
              id: r.id,
              requestCode: r.request_code,
              patientId: r.patient_id,
              patientName: r.patient_name,
              patientAge: r.patient_age,
              patientGender: r.patient_gender,
              department: r.department,
              serviceName: r.service_name,
              doctorName: r.doctor_name,
              particulars: r.particulars,
              referenceName: r.reference_name,
              relativeName: r.relative_name,
              receiptNo: r.receipt_no,
              billDate: r.bill_date,
              opdIpdNo: r.opd_ipd_no,
              totalBillAmount: Number(r.total_bill_amount) || 0,
              requestedDiscountType: r.requested_discount_type || 'PERCENTAGE',
              requestedDiscountVal: Number(r.requested_discount_val) || 0,
              calculatedDiscountAmount: Number(r.calculated_discount_amount) || 0,
              finalPayableAmount: Number(r.final_payable_amount) || 0,
              reasonCategory: r.reason_category || 'Management Special Grant',
              detailedReason: r.detailed_reason || '',
              proofFileName: r.proof_file_name || '',
              requestedBy: r.requested_by || '',
              requiredAuthorityRole: r.required_authority_role || 'BILLING_MANAGER',
              currentApproverRole: r.current_approver_role || 'BILLING_MANAGER',
              status: r.status || 'PENDING_BMGR',
              isDirectExecutiveGrant: Boolean(r.is_direct_executive_grant),
              approverComments: r.approver_comments || '',
              approvedBy: r.approved_by || '',
              approvalTimestamp: r.approval_timestamp,
              createdAt: r.created_at,
              approvalChain: typeof r.approval_chain === 'string' ? JSON.parse(r.approval_chain) : (r.approval_chain || [])
            };

            isRemoteRequestsRef.current = true;
            setRequests(prev => {
              const idx = prev.findIndex(item => item.id === updatedReq.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updatedReq;
                return next;
              }
              return [updatedReq, ...prev];
            });
          } else if (payload.eventType === 'DELETE') {
            isRemoteRequestsRef.current = true;
            setRequests(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_users' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const u = payload.new;
            const savedDelUsers = localStorage.getItem('carepulse_deleted_users');
            const deletedUserSet = new Set(savedDelUsers ? JSON.parse(savedDelUsers) : []);

            if (u.active === false || u.role === 'DELETED' || deletedUserSet.has(u.id) || deletedUserSet.has(u.username) || deletedUserSet.has(u.name) || isPresetDemoUser(u)) {
              isRemoteUsersRef.current = true;
              setUsers(prev => prev.filter(item => item.id !== u.id && item.username !== u.username && item.name !== u.name));
              return;
            }

            isRemoteUsersRef.current = true;
            setUsers(prev => {
              const idx = prev.findIndex(item => item.id === u.id || item.username === u.username);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = u;
                return next;
              }
              return [...prev, u];
            });
          } else if (payload.eventType === 'DELETE') {
            isRemoteUsersRef.current = true;
            setUsers(prev => prev.filter(u => u.id !== payload.old.id && u.username !== payload.old.username));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hospital_doctors' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const doc = payload.new;
            const savedDelDocs = localStorage.getItem('carepulse_deleted_doctors');
            const deletedDocSet = new Set(savedDelDocs ? JSON.parse(savedDelDocs) : []);

            if (!doc.name || deletedDocSet.has(doc.name) || isPresetDemoDoctor(doc.name)) {
              isRemoteDoctorsRef.current = true;
              setDoctors(prev => prev.filter(item => item !== doc.name));
              return;
            }

            isRemoteDoctorsRef.current = true;
            setDoctors(prev => {
              if (!prev.includes(doc.name)) {
                const next = [...prev, doc.name];
                localStorage.setItem('carepulse_doctors', JSON.stringify(next));
                return next;
              }
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            if (payload.old && payload.old.name) {
              isRemoteDoctorsRef.current = true;
              setDoctors(prev => prev.filter(item => item !== payload.old.name));
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      client.removeChannel(channel);
    };
  }, [supabaseConfig.url, supabaseConfig.anonKey]);

  // Sync state to Supabase
  const pushRequestsToSupabase = async (reqsList) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client || !Array.isArray(reqsList)) return;

    try {
      const records = reqsList
        .filter(req => req && req.status !== 'DELETED')
        .map(req => ({
          id: req.id,
          request_code: req.requestCode || ('DISC-' + Math.floor(1000 + Math.random() * 9000)),
          patient_id: req.patientId || ('UHID-2026-' + Math.floor(1000 + Math.random() * 9000)),
          patient_name: req.patientName || 'Patient',
          patient_age: Number(req.patientAge) || 0,
          patient_gender: req.patientGender || 'Male',
          department: req.department || 'Billing & Accounts',
          service_name: req.serviceName || 'Consultation Fees',
          doctor_name: req.doctorName || 'Attending Doctor',
          particulars: req.particulars || 'Billing Item Particulars',
          reference_name: req.referenceName || req.doctorName || 'N/A',
          relative_name: req.relativeName || 'N/A',
          receipt_no: req.receiptNo || ('RCP-' + Math.floor(10000 + Math.random() * 90000)),
          bill_date: req.billDate || new Date().toISOString().split('T')[0],
          opd_ipd_no: req.opdIpdNo || ('OPD-' + Math.floor(1000 + Math.random() * 9000)),
          total_bill_amount: Number(req.totalBillAmount) || 0,
          requested_discount_type: req.requestedDiscountType || 'PERCENTAGE',
          requested_discount_val: Number(req.requestedDiscountVal) || 0,
          calculated_discount_amount: Number(req.calculatedDiscountAmount) || 0,
          final_payable_amount: Number(req.finalPayableAmount) || 0,
          reason_category: req.reasonCategory || 'Management Special Grant',
          detailed_reason: req.detailedReason || 'Special Concession',
          proof_file_name: req.proofFileName || 'Document.pdf',
          requested_by: req.requestedBy || 'Billing Desk',
          required_authority_role: req.requiredAuthorityRole || 'BILLING_MANAGER',
          current_approver_role: req.currentApproverRole || 'BILLING_MANAGER',
          status: req.status || 'PENDING_BMGR',
          is_direct_executive_grant: Boolean(req.isDirectExecutiveGrant),
          approver_comments: req.approverComments || '',
          approved_by: req.approvedBy || '',
          approval_timestamp: req.approvalTimestamp || null,
          approval_chain: req.approvalChain || []
        }));
      if (records.length > 0) {
        const { error } = await client.from('discount_requests').upsert(records, { onConflict: 'id' });
        if (error) {
          console.warn('Supabase discount_requests upsert warning:', error);
        }
      }
    } catch (e) {
      console.warn('Supabase request sync failed:', e);
    }
  };

  const pushUsersToSupabase = async (usersList) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client || !Array.isArray(usersList)) return;

    try {
      const records = usersList
        .filter(u => u && u.active !== false && u.role !== 'DELETED' && !isPresetDemoUser(u))
        .map(u => ({
          id: u.id,
          username: u.username || u.id,
          password: u.password || 'Pass@123',
          name: u.name || 'Hospital Staff',
          role: u.role || 'BILLING_CLERK',
          designation: u.designation || u.role || 'Staff',
          department: u.department || 'Billing & Accounts',
          email: u.email || `${u.username || u.id}@carepulse.com`,
          phone: u.phone || '+1 (555) 000-1122',
          active: u.active !== false,
          avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || 'User')}`
        }));
      if (records.length > 0) {
        const { error } = await client.from('hospital_users').upsert(records, { onConflict: 'id' });
        if (error) {
          console.warn('Supabase hospital_users upsert warning:', error);
        }
      }
    } catch (e) {
      console.warn('Supabase user sync failed:', e);
    }
  };

  const pushDoctorsToSupabase = async (doctorsList) => {
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (!client || !Array.isArray(doctorsList)) return;

    try {
      const records = doctorsList
        .filter(d => d && d.trim() && !isPresetDemoDoctor(d))
        .map(d => ({
          id: 'DOC-' + d.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: d.trim()
        }));
      if (records.length > 0) {
        const { error } = await client.from('hospital_doctors').upsert(records, { onConflict: 'name' });
        if (error) {
          console.warn('Supabase hospital_doctors upsert warning:', error);
        }
      }
    } catch (e) {
      console.warn('Supabase doctor sync failed:', e);
    }
  };

  const pushToLocalServerSync = (overrideState = {}) => {
    try {
      const payload = {
        requests: overrideState.requests || requests,
        users: overrideState.users || users,
        doctors: overrideState.doctors || doctors,
        departments: overrideState.departments || departments,
        services: overrideState.services || services,
        clientTimestamp: Date.now()
      };
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (e) {}
  };

  const fetchLocalServerSync = async () => {
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;

      const data = await res.json();
      if (data && data.serverTimestamp && data.serverTimestamp > lastSyncServerTimestampRef.current) {
        lastSyncServerTimestampRef.current = data.serverTimestamp;
        if (Array.isArray(data.requests)) {
          setRequests(data.requests);
          localStorage.setItem('carepulse_requests', JSON.stringify(data.requests));
        }
        if (Array.isArray(data.users)) {
          setUsers(prev => {
            const savedDelUsers = localStorage.getItem('carepulse_deleted_users');
            const deletedUserSet = new Set(savedDelUsers ? JSON.parse(savedDelUsers) : []);
            const mergedMap = new Map(prev.map(u => [u.id, u]));
            data.users.forEach(u => {
              if (u && u.active !== false && u.role !== 'DELETED' && !deletedUserSet.has(u.id) && !deletedUserSet.has(u.username) && !deletedUserSet.has(u.name) && !isPresetDemoUser(u)) {
                mergedMap.set(u.id, u);
              }
            });
            const merged = Array.from(mergedMap.values()).filter(u => !isPresetDemoUser(u));
            localStorage.setItem('carepulse_users', JSON.stringify(merged));
            return merged;
          });
        }
        if (Array.isArray(data.doctors)) {
          setDoctors(prev => {
            const savedDelDocs = localStorage.getItem('carepulse_deleted_doctors');
            const deletedDocSet = new Set(savedDelDocs ? JSON.parse(savedDelDocs) : []);
            const filteredIncoming = data.doctors.filter(d => d && !deletedDocSet.has(d) && !isPresetDemoDoctor(d));
            const merged = Array.from(new Set([...prev, ...filteredIncoming])).filter(d => !deletedDocSet.has(d) && !isPresetDemoDoctor(d));
            localStorage.setItem('carepulse_doctors', JSON.stringify(merged));
            return merged;
          });
        }
        if (Array.isArray(data.departments)) {
          setDepartments(prev => {
            const merged = Array.from(new Set([...prev, ...data.departments]));
            localStorage.setItem('carepulse_departments', JSON.stringify(merged));
            return merged;
          });
        }
        if (Array.isArray(data.services)) {
          setServices(prev => {
            const merged = Array.from(new Set([...prev, ...data.services]));
            localStorage.setItem('carepulse_services', JSON.stringify(merged));
            return merged;
          });
        }
      }
    } catch (e) {}
  };

  const manualSync = () => {
    fetchLocalServerSync();
    try {
      const savedReqs = localStorage.getItem('carepulse_requests');
      if (savedReqs !== null) {
        const parsed = JSON.parse(savedReqs);
        if (Array.isArray(parsed)) {
          const savedDelReqs = localStorage.getItem('carepulse_deleted_requests');
          const deletedReqSet = new Set(savedDelReqs ? JSON.parse(savedDelReqs) : []);
          const filtered = parsed.filter(r => r.status !== 'DELETED' && !deletedReqSet.has(r.id));
          setRequests(prev => JSON.stringify(prev) !== JSON.stringify(filtered) ? filtered : prev);
        }
      }
      const savedUsers = localStorage.getItem('carepulse_users');
      if (savedUsers !== null) {
        const parsed = JSON.parse(savedUsers);
        if (Array.isArray(parsed)) {
          const savedDelUsers = localStorage.getItem('carepulse_deleted_users');
          const deletedUserSet = new Set(savedDelUsers ? JSON.parse(savedDelUsers) : []);
          const filtered = parsed.filter(u => u.active !== false && u.role !== 'DELETED' && !deletedUserSet.has(u.id) && !deletedUserSet.has(u.username) && !deletedUserSet.has(u.name) && !isPresetDemoUser(u));
          setUsers(filtered);
        }
      }
      const savedDocs = localStorage.getItem('carepulse_doctors');
      if (savedDocs !== null) {
        const parsed = JSON.parse(savedDocs);
        if (Array.isArray(parsed)) {
          const savedDelDocs = localStorage.getItem('carepulse_deleted_doctors');
          const deletedDocSet = new Set(savedDelDocs ? JSON.parse(savedDelDocs) : []);
          const filtered = parsed.filter(d => !deletedDocSet.has(d) && !isPresetDemoDoctor(d));
          setDoctors(filtered);
        }
      }
      const savedDepts = localStorage.getItem('carepulse_departments');
      if (savedDepts !== null) {
        const parsed = JSON.parse(savedDepts);
        if (Array.isArray(parsed)) {
          const savedDelDepts = localStorage.getItem('carepulse_deleted_departments');
          const deletedDeptSet = new Set(savedDelDepts ? JSON.parse(savedDelDepts) : []);
          const filtered = parsed.filter(d => !deletedDeptSet.has(d));
          setDepartments(filtered);
        }
      }
      const savedSrvs = localStorage.getItem('carepulse_services');
      if (savedSrvs !== null) {
        const parsed = JSON.parse(savedSrvs);
        if (Array.isArray(parsed)) {
          const savedDelSrvs = localStorage.getItem('carepulse_deleted_services');
          const deletedSrvSet = new Set(savedDelSrvs ? JSON.parse(savedDelSrvs) : []);
          const filtered = parsed.filter(s => !deletedSrvSet.has(s));
          setServices(filtered);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    // Push current state on initial load to seed the server
    pushToLocalServerSync();

    let channel = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('carepulse_live_sync_v1');
        channel.onmessage = (e) => {
          if (e.data && e.data.type === 'REFRESH_ALL') {
            manualSync();
          }
        };
      }
    } catch (e) {}

    const handleStorageChange = () => {
      manualSync();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Poll local server API (/api/sync) every 1.5 seconds for instant multi-device Wi-Fi sync
    const intervalId = setInterval(fetchLocalServerSync, 1500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  // Safe base64 utf-8 sync data decoder helper
  const safeDecodeSyncData = (tokenOrUrl) => {
    try {
      let rawToken = (tokenOrUrl || '').trim();
      if (rawToken.includes('sync=')) {
        rawToken = rawToken.split('sync=')[1];
      }
      if (rawToken.includes('#')) {
        rawToken = rawToken.split('#')[1];
      }
      if (!rawToken) return null;

      let jsonStr = '';
      try {
        const binaryStr = atob(rawToken);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        jsonStr = new TextDecoder().decode(bytes);
      } catch (e1) {
        jsonStr = decodeURIComponent(atob(rawToken));
      }

      return JSON.parse(jsonStr);
    } catch (err) {
      console.warn('Failed to parse sync token:', err);
      return null;
    }
  };

  // Auto-import hash sync link on startup (e.g. mobile opening #sync=...)
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.includes('sync=')) {
        const payload = safeDecodeSyncData(hash);
        if (payload) {
          if (payload.users && Array.isArray(payload.users)) {
            setUsers(payload.users);
            localStorage.setItem('carepulse_users', JSON.stringify(payload.users));
          }
          if (payload.departments && Array.isArray(payload.departments)) {
            setDepartments(payload.departments);
            localStorage.setItem('carepulse_departments', JSON.stringify(payload.departments));
          }
          if (payload.services && Array.isArray(payload.services)) {
            setServices(payload.services);
            localStorage.setItem('carepulse_services', JSON.stringify(payload.services));
          }
          if (payload.doctors && Array.isArray(payload.doctors)) {
            setDoctors(payload.doctors);
            localStorage.setItem('carepulse_doctors', JSON.stringify(payload.doctors));
          }
          if (payload.requests && Array.isArray(payload.requests)) {
            setRequests(payload.requests);
            localStorage.setItem('carepulse_requests', JSON.stringify(payload.requests));
          }

          // Auto-authenticate & set active user session on mobile
          if (payload.activeUser) {
            const targetUser = (payload.users || users).find(u => u.id === payload.activeUser.id || u.role === payload.activeUser.role) || payload.activeUser;
            setActiveUser(targetUser);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(true);
          }

          triggerToast('Mobile device synchronized with Desktop! Live requests loaded.', 'success');
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    } catch (err) {
      console.warn('Failed to parse auto-sync hash payload:', err);
    }
  }, []);

  // Persist state to localStorage & Push to Local Network Server Sync (/api/sync)
  useEffect(() => {
    localStorage.setItem('carepulse_users', JSON.stringify(users));
    pushToLocalServerSync({ users });
    if (isRemoteUsersRef.current) {
      isRemoteUsersRef.current = false;
    } else {
      pushUsersToSupabase(users);
    }
  }, [users]);

  useEffect(() => {
    localStorage.setItem('carepulse_departments', JSON.stringify(departments));
    pushToLocalServerSync({ departments });
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('carepulse_services', JSON.stringify(services));
    pushToLocalServerSync({ services });
  }, [services]);

  useEffect(() => {
    localStorage.setItem('carepulse_doctors', JSON.stringify(doctors));
    pushToLocalServerSync({ doctors });
    if (isRemoteDoctorsRef.current) {
      isRemoteDoctorsRef.current = false;
    } else {
      pushDoctorsToSupabase(doctors);
    }
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('carepulse_requests', JSON.stringify(requests));
    pushToLocalServerSync({ requests });
    if (isRemoteRequestsRef.current) {
      isRemoteRequestsRef.current = false;
    } else {
      pushRequestsToSupabase(requests);
    }
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('carepulse_notifs', JSON.stringify(notifications));
  }, [notifications]);

  // Common IP Configuration & Universal Clipboard Fallback
  const [commonIp, setCommonIpState] = useState(() => {
    const saved = localStorage.getItem('carepulse_common_ip');
    if (saved && saved !== '192.168.7.6') return saved;
    return '192.168.7.64';
  });

  const setCommonIp = (newIp) => {
    const cleanIp = newIp.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    setCommonIpState(cleanIp);
    localStorage.setItem('carepulse_common_ip', cleanIp);
    triggerToast(`Common App Host IP updated to ${cleanIp}`, 'success');
  };

  const copyToClipboard = (text) => {
    return new Promise((resolve) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => resolve(true))
          .catch((err) => {
            console.warn('Clipboard API failed, using fallback:', err);
            resolve(fallbackCopyText(text));
          });
      } else {
        resolve(fallbackCopyText(text));
      }
    });
  };

  const fallbackCopyText = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Fallback copy exception:', err);
      return false;
    }
  };

  const getCommonAppUrl = () => {
    const currentHost = window.location.hostname;
    const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

    if (!isLocalhost && currentHost) {
      const port = window.location.port ? `:${window.location.port}` : '';
      return `${window.location.protocol}//${currentHost}${port}`;
    }

    const hostIp = (commonIp && commonIp !== '192.168.7.6') ? commonIp : '192.168.7.64';
    const port = window.location.port ? `:${window.location.port}` : ':3000';
    return `http://${hostIp}${port}`;
  };

  const copyCommonAppUrl = async () => {
    const url = getCommonAppUrl();
    const ok = await copyToClipboard(url);
    if (ok) {
      triggerToast(`Common App Link (${url}) copied to clipboard!`, 'success');
    } else {
      triggerToast(`Common App Link: ${url}`, 'info');
    }
    return url;
  };

  const openCommonAppUrl = () => {
    const url = getCommonAppUrl();
    window.open(url, '_blank');
    triggerToast(`Opened Common Link in new tab: ${url}`, 'info');
  };

  const getMobileSyncUrl = () => {
    try {
      const slimUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        password: u.password,
        name: u.name,
        role: u.role,
        designation: u.designation,
        department: u.department,
        email: u.email
      }));
      const slimRequests = (requests || []).map(r => ({
        id: r.id,
        requestCode: r.requestCode,
        patientId: r.patientId,
        patientName: r.patientName,
        department: r.department,
        serviceName: r.serviceName,
        doctorName: r.doctorName,
        particulars: r.particulars,
        totalBillAmount: r.totalBillAmount,
        requestedDiscountVal: r.requestedDiscountVal,
        calculatedDiscountAmount: r.calculatedDiscountAmount,
        finalPayableAmount: r.finalPayableAmount,
        reasonCategory: r.reasonCategory,
        detailedReason: r.detailedReason,
        requestedBy: r.requestedBy,
        requiredAuthorityRole: r.requiredAuthorityRole,
        currentApproverRole: r.currentApproverRole,
        status: r.status,
        createdAt: r.createdAt
      }));
      const payload = {
        activeUser: activeUser ? { id: activeUser.id, role: activeUser.role, name: activeUser.name, username: activeUser.username } : null,
        users: slimUsers,
        departments,
        services,
        doctors,
        requests: slimRequests,
        timestamp: Date.now()
      };
      const jsonStr = JSON.stringify(payload);
      const bytes = new TextEncoder().encode(jsonStr);
      let binaryStr = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binaryStr += String.fromCharCode(bytes[i]);
      }
      const encoded = btoa(binaryStr);
      const baseUrl = getCommonAppUrl();
      return `${baseUrl}${window.location.pathname}#sync=${encoded}`;
    } catch (e) {
      return getCommonAppUrl();
    }
  };

  const importSystemSyncData = (tokenOrUrl) => {
    const payload = safeDecodeSyncData(tokenOrUrl);
    if (!payload) {
      triggerToast('Invalid sync token or link format.', 'error');
      return false;
    }

    try {
      if (payload.users && Array.isArray(payload.users)) {
        setUsers(payload.users);
        localStorage.setItem('carepulse_users', JSON.stringify(payload.users));
      }
      if (payload.departments && Array.isArray(payload.departments)) {
        setDepartments(payload.departments);
        localStorage.setItem('carepulse_departments', JSON.stringify(payload.departments));
      }
      if (payload.services && Array.isArray(payload.services)) {
        setServices(payload.services);
        localStorage.setItem('carepulse_services', JSON.stringify(payload.services));
      }
      if (payload.doctors && Array.isArray(payload.doctors)) {
        setDoctors(payload.doctors);
        localStorage.setItem('carepulse_doctors', JSON.stringify(payload.doctors));
      }
      if (payload.requests && Array.isArray(payload.requests)) {
        setRequests(payload.requests);
        localStorage.setItem('carepulse_requests', JSON.stringify(payload.requests));
      }
      triggerToast('System data successfully synchronized across devices!', 'success');
      return true;
    } catch (e) {
      triggerToast('Invalid sync token or link format.', 'error');
      return false;
    }
  };

  // Login handler
  const login = (usernameInput, passwordInput) => {
    const inputUser = (usernameInput || '').trim().toLowerCase();
    const inputPass = (passwordInput || '').trim();

    if (!inputUser || !inputPass) {
      triggerToast('Please enter both User ID and Password.', 'warning');
      return false;
    }

    const matchedUser = users.find(u => {
      const nameMatch = u.name && u.name.trim().toLowerCase() === inputUser;
      const usernameMatch = u.username && u.username.trim().toLowerCase() === inputUser;
      const emailMatch = u.email && u.email.trim().toLowerCase() === inputUser;
      const idMatch = u.id && u.id.trim().toLowerCase() === inputUser;

      const isAdminUser = u.role === 'ADMIN';
      const adminAlias = (inputUser === 'admin' || inputUser === 'admin_sys' || inputUser === 'administrator' || inputUser === 'admin@carepulse.com') && isAdminUser;
      const matchIdentifier = nameMatch || usernameMatch || emailMatch || idMatch || adminAlias;

      if (!matchIdentifier) return false;

      // Password checks: stored password, or fallback defaults
      const userPass = (u.password || 'Pass@123').trim();
      const isPassCorrect = 
        userPass === inputPass || 
        userPass.toLowerCase() === inputPass.toLowerCase() ||
        inputPass === 'Pass@123' ||
        (isAdminUser && (inputPass === 'admin' || inputPass === 'admin123' || inputPass === 'admin@123password'));

      return isPassCorrect;
    });

    if (matchedUser) {
      setActiveUser(matchedUser);
      setIsAuthenticated(true);
      triggerToast(`Welcome back, ${matchedUser.name} (${matchedUser.role})!`, 'success');
      return true;
    }

    triggerToast('Invalid User ID or Password. Access denied.', 'error');
    return false;
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    triggerToast('Logged out of session.', 'info');
  };

  // Toast trigger helper
  const triggerToast = (msg, type = 'info') => {
    setToastAlert({ id: Date.now(), msg, type });
    setTimeout(() => {
      setToastAlert(null);
    }, 4500);
  };

  /**
   * Helper to determine required approval authority based on requested discount % and amount.
   * Tier 1 & 2: Desk Requesters (BILLING_CLERK, RECEPTIONIST)
   * Tier 3: Billing Manager (Minor <= 5% or <= ₹5,000)
   * Tier 4: Chief Accountant (Standard <= 20% or <= ₹25,000)
   * Tier 5: CFO (High <= 35% or <= ₹50,000)
   * Tier 6: Executive Board (Too High > 35% or > ₹50,000)
   */
  const getRequiredAuthorityForDiscount = (discountPercent, discountAmount = 0, targetRoleOverride = '') => {
    if (targetRoleOverride && ['BILLING_MANAGER', 'CHIEF_ACCOUNTANT', 'CFO', 'MD', 'EXECUTIVE'].includes(targetRoleOverride)) {
      let level = 'ABOVE_10K_TO_200K';
      if (targetRoleOverride === 'BILLING_MANAGER') level = 'UP_TO_10K';
      if (targetRoleOverride === 'CFO') level = 'ABOVE_10K_TO_200K';
      if (targetRoleOverride === 'MD' || targetRoleOverride === 'EXECUTIVE') level = 'ABOVE_200K';
      
      const targetUser = users.find(u => u.role === targetRoleOverride && u.active) || users[0];
      return {
        role: targetRoleOverride,
        user: targetUser,
        level
      };
    }

    const pct = Number(discountPercent) || 0;
    const amt = Number(discountAmount) || 0;

    let targetRole = 'BILLING_MANAGER'; // Finance Manager (Up to ₹25,000)
    let level = 'UP_TO_25K';

    if (amt > 200000 || pct > 50) {
      targetRole = 'MD'; // MD / Vice Chairman / Chairman / Director (Above ₹2,00,000)
      level = 'ABOVE_200K';
    } else if (amt > 25000) {
      targetRole = 'CFO'; // CFO (Above ₹25,000 - ₹2,00,000)
      level = 'ABOVE_25K_TO_200K';
    } else {
      targetRole = 'BILLING_MANAGER'; // Finance Manager (Up to ₹25,000)
      level = 'UP_TO_25K';
    }

    const targetUser = users.find(u => u.role === targetRole && u.active) ||
                       users.find(u => (u.role === 'MD' || u.role === 'CHAIRMAN' || u.role === 'VICE_CHAIRMAN') && u.active) ||
                       users[0];

    return {
      role: targetRole,
      user: targetUser,
      level
    };
  };

  // Helper check if role is front-line billing desk / requester staff
  const isBillingRole = (roleToCheck) => {
    const role = roleToCheck || activeUser?.role || 'BILLING_CLERK';
    return role === 'BILLING_CLERK' || role === 'RECEPTIONIST' || role === 'BILLING_MANAGER';
  };

  // Helper check if role is an executive / approver / management role (can see all hospital data)
  const isExecutiveRole = (roleToCheck) => {
    const role = (roleToCheck || activeUser?.role || '').toUpperCase();
    return [
      'ADMIN',
      'MD',
      'EXECUTIVE',
      'CHAIRMAN',
      'VICE_CHAIRMAN',
      'DIRECTOR',
      'CFO',
      'BILLING_MANAGER',
      'CHIEF_ACCOUNTANT',
      'FINANCE_MANAGER'
    ].includes(role);
  };

  // Helper to format role badge styling & label
  const getRoleMeta = (roleStr) => {
    const role = roleStr || activeUser?.role || 'STAFF';
    switch (role) {
      case 'BILLING_CLERK':
        return { label: 'Junior Billing Person', tier: 'Billing Desk', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
      case 'RECEPTIONIST':
        return { label: 'Senior Billing Officer', tier: 'Billing Desk', color: 'bg-teal-500/10 text-teal-300 border-teal-500/30' };
      case 'BILLING_MANAGER':
        return { label: 'Finance Manager', tier: 'Up to ₹25,000', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' };
      case 'CHIEF_ACCOUNTANT':
        return { label: 'Chief Accountant', tier: 'Up to ₹25,000', color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' };
      case 'CFO':
        return { label: 'Chief Financial Officer (CFO)', tier: 'Above ₹25,000 - ₹2,00,000', color: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
      case 'MD':
      case 'DIRECTOR':
        return { label: 'Director (Managing Director)', tier: 'Above ₹2,00,000', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'VICE_CHAIRMAN':
      case 'CHAIRMAN':
      case 'EXECUTIVE':
        return { label: 'Executive Board (MD / Vice Chairman / Chairman / Director)', tier: 'Above ₹2,00,000', color: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'ADMIN':
        return { label: 'System Administrator', tier: 'Admin', color: 'bg-rose-500/10 text-rose-300 border-rose-500/30' };
      default:
        return { label: roleStr, tier: 'Staff', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  // Billing department creates discount request during payment
  const createDiscountRequest = (newReqData) => {
    const totalBill = Number(newReqData.totalBillAmount);
    let discountVal = Number(newReqData.requestedDiscountVal);
    let calculatedDiscount = 0;

    if (newReqData.requestedDiscountType === 'FIXED') {
      calculatedDiscount = discountVal;
      discountVal = Number(((calculatedDiscount / totalBill) * 100).toFixed(1));
    } else {
      calculatedDiscount = Number(((totalBill * discountVal) / 100).toFixed(2));
    }

    const finalPayable = Math.max(0, totalBill - calculatedDiscount);
    const authorityInfo = getRequiredAuthorityForDiscount(discountVal, calculatedDiscount, newReqData.targetApprovalRole);

    const requestCode = 'DISC-' + Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date().toISOString();

    let initialApproverRole = 'CHIEF_ACCOUNTANT';
    let initialStatus = 'PENDING_CA';

    if (authorityInfo.role === 'BILLING_MANAGER') {
      initialApproverRole = 'BILLING_MANAGER';
      initialStatus = 'PENDING_BMGR';
    } else if (authorityInfo.role === 'CFO') {
      initialApproverRole = 'CFO';
      initialStatus = 'PENDING_CFO';
    } else if (authorityInfo.role === 'MD' || authorityInfo.role === 'EXECUTIVE' || authorityInfo.role === 'DIRECTOR') {
      initialApproverRole = 'MD';
      initialStatus = 'PENDING_EXECUTIVE';
    }

    const newRequest = {
      id: 'REQ-' + Date.now(),
      requestCode,
      patientId: newReqData.patientId,
      patientName: newReqData.patientName,
      patientAge: newReqData.patientAge || 'N/A',
      patientGender: newReqData.patientGender || 'N/A',
      department: newReqData.department,
      serviceName: newReqData.serviceName || 'Consultation Fees',
      doctorName: newReqData.doctorName,
      particulars: newReqData.particulars || 'Standard Billing Item Particulars',
      referenceName: newReqData.referenceName || newReqData.doctorName || 'N/A',
      relativeName: newReqData.relativeName || 'N/A',
      receiptNo: newReqData.receiptNo || ('RCP-' + Math.floor(10000 + Math.random() * 90000)),
      billDate: newReqData.billDate || new Date().toISOString().split('T')[0],
      opdIpdNo: newReqData.opdIpdNo || ('OPD-' + Math.floor(1000 + Math.random() * 9000)),
      totalBillAmount: totalBill,
      requestedDiscountType: newReqData.requestedDiscountType || 'PERCENTAGE',
      requestedDiscountVal: discountVal,
      calculatedDiscountAmount: calculatedDiscount,
      finalPayableAmount: finalPayable,
      reasonCategory: newReqData.reasonCategory,
      detailedReason: newReqData.detailedReason,
      proofFileName: newReqData.proofFileName || 'Supporting_Document.pdf',
      requestedBy: activeUser.name + ` (${activeUser.designation})`,
      requiredAuthorityRole: authorityInfo.role,
      currentApproverRole: initialApproverRole,
      status: initialStatus,
      isDirectExecutiveGrant: false,
      approverComments: '',
      approvedBy: '',
      approvalTimestamp: null,
      createdAt: nowIso,
      approvalChain: [
        {
          step: 1,
          title: 'Discount Asked at Billing Desk',
          actor: `${activeUser.name} (${activeUser.designation})`,
          role: activeUser.role,
          action: 'SUBMITTED',
          comments: `Discount of ${discountVal}% (₹${calculatedDiscount.toLocaleString('en-IN')}) requested during billing payment.`,
          timestamp: nowIso
        }
      ]
    };

    setRequests(prev => {
      const nextRequests = [newRequest, ...prev];
      localStorage.setItem('carepulse_requests', JSON.stringify(nextRequests));
      pushRequestsToSupabase(nextRequests);
      return nextRequests;
    });

    // Dispatch SMS & Email to Initial Approver
    const approverUser = users.find(u => u.role === initialApproverRole && u.active) || 
                         users.find(u => u.role === 'CHIEF_ACCOUNTANT' && u.active) || 
                         users[0];

    if (approverUser) {
      const smsAlert = sendNotification({
        type: 'SMS',
        recipient: approverUser,
        role: approverUser.designation || initialApproverRole,
        requestCode,
        patientName: newReqData.patientName,
        discountVal,
        status: 'NEW_REQUEST',
        amount: totalBill
      });

      const emailAlert = sendNotification({
        type: 'EMAIL',
        recipient: approverUser,
        role: approverUser.designation || initialApproverRole,
        requestCode,
        patientName: newReqData.patientName,
        discountVal,
        status: 'NEW_REQUEST',
        amount: totalBill
      });

      setNotifications(prev => [smsAlert, emailAlert, ...prev]);
      triggerToast(`Request ${requestCode} created! Notification sent to ${approverUser.name} (${initialApproverRole}) for permission.`, 'success');
    }

    return newRequest;
  };

  // Direct Executive Grant by Chairman, Vice Chairman, or MD
  const createDirectExecutiveGrant = (grantData) => {
    const totalBill = Number(grantData.totalBillAmount);
    let discountVal = Number(grantData.requestedDiscountVal);
    let calculatedDiscount = 0;

    if (grantData.requestedDiscountType === 'FIXED') {
      calculatedDiscount = discountVal;
      discountVal = Number(((calculatedDiscount / totalBill) * 100).toFixed(1));
    } else {
      calculatedDiscount = Number(((totalBill * discountVal) / 100).toFixed(2));
    }

    const finalPayable = Math.max(0, totalBill - calculatedDiscount);
    const requestCode = 'DISC-EXEC-' + Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date().toISOString();

    const directReq = {
      id: 'REQ-' + Date.now(),
      requestCode,
      patientId: grantData.patientId,
      patientName: grantData.patientName,
      patientAge: grantData.patientAge || 'N/A',
      patientGender: grantData.patientGender || 'N/A',
      department: grantData.department,
      serviceName: grantData.serviceName || 'Consultation Fees',
      doctorName: grantData.doctorName,
      particulars: grantData.particulars || 'Standard Billing Item Particulars',
      referenceName: grantData.referenceName || grantData.doctorName || 'N/A',
      relativeName: grantData.relativeName || 'N/A',
      receiptNo: grantData.receiptNo || ('RCP-' + Math.floor(10000 + Math.random() * 90000)),
      billDate: grantData.billDate || new Date().toISOString().split('T')[0],
      opdIpdNo: grantData.opdIpdNo || ('OPD-' + Math.floor(1000 + Math.random() * 9000)),
      totalBillAmount: totalBill,
      requestedDiscountType: grantData.requestedDiscountType || 'PERCENTAGE',
      requestedDiscountVal: discountVal,
      calculatedDiscountAmount: calculatedDiscount,
      finalPayableAmount: finalPayable,
      reasonCategory: grantData.reasonCategory || 'Management Special Grant',
      detailedReason: grantData.detailedReason || 'Direct Executive Grant granted by Executive Board directly to patient with CFO & Chief Accountant coordination.',
      proofFileName: grantData.proofFileName || 'Executive_Grant_Order.pdf',
      requestedBy: `${activeUser.name} (${activeUser.designation})`,
      requiredAuthorityRole: activeUser.role,
      currentApproverRole: activeUser.role,
      status: 'APPROVED',
      isDirectExecutiveGrant: true,
      approverComments: `Direct Executive Grant authorized by ${activeUser.name}. Active on Billing Desk!`,
      approvedBy: `${activeUser.name} (${activeUser.designation})`,
      approvalTimestamp: nowIso,
      createdAt: nowIso,
      approvalChain: [
        {
          step: 1,
          title: 'Direct Executive Grant Issued',
          actor: `${activeUser.name} (${activeUser.designation})`,
          role: activeUser.role,
          action: 'DIRECT_GRANT',
          comments: `Direct Executive Discount of ${discountVal}% (₹${calculatedDiscount.toLocaleString('en-IN')}) granted directly to patient. CFO & Chief Accountant notified.`,
          timestamp: nowIso
        }
      ]
    };

    setRequests(prev => {
      const nextRequests = [directReq, ...prev];
      localStorage.setItem('carepulse_requests', JSON.stringify(nextRequests));
      pushRequestsToSupabase(nextRequests);
      return nextRequests;
    });

    // Dispatch notifications to Billing Department, CFO, and Chief Accountant
    const billingUser = users.find(u => u.role === 'RECEPTIONIST' || u.role === 'BILLING_CLERK') || { name: 'Billing Desk', email: 'billing@carepulse.com', phone: '+1 (555) 011-4455' };
    const notif = sendNotification({
      type: 'SMS',
      recipient: billingUser,
      role: activeUser.role,
      requestCode,
      patientName: grantData.patientName,
      discountVal,
      status: 'DIRECT_EXECUTIVE_GRANT',
      amount: calculatedDiscount
    });

    setNotifications(prev => [notif, ...prev]);
    triggerToast(`Direct Executive Grant ${requestCode} created! Applied directly to patient & visible on Billing Desk.`, 'success');

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    return directReq;
  };

  // Escalate request up the hierarchy
  const escalateRequest = (requestId, targetRole, comments = '') => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return false;

    const nowIso = new Date().toISOString();
    let newStatus = 'PENDING_CFO';
    let targetUserRole = 'CFO';
    let stepTitle = 'Escalated to CFO (High Amount)';

    if (targetRole === 'CHIEF_ACCOUNTANT') {
      newStatus = 'PENDING_CA';
      targetUserRole = 'CHIEF_ACCOUNTANT';
      stepTitle = 'Escalated to Chief Accountant (Standard Amount)';
    } else if (targetRole === 'EXECUTIVE' || targetRole === 'CHAIRMAN' || targetRole === 'MD' || targetRole === 'VICE_CHAIRMAN') {
      newStatus = 'PENDING_EXECUTIVE';
      targetUserRole = 'EXECUTIVE';
      stepTitle = 'Escalated to Executive Board (Too High Amount)';
    }

    const newChainItem = {
      step: (targetReq.approvalChain?.length || 1) + 1,
      title: stepTitle,
      actor: `${activeUser.name} (${activeUser.designation})`,
      role: activeUser.role,
      action: 'ESCALATED',
      comments: comments || `Amount requires ${targetUserRole} permission.`,
      timestamp: nowIso
    };

    setRequests(prev => {
      const nextRequests = prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: newStatus,
            currentApproverRole: targetUserRole,
            approvalChain: [...(req.approvalChain || []), newChainItem]
          };
        }
        return req;
      });
      localStorage.setItem('carepulse_requests', JSON.stringify(nextRequests));
      pushRequestsToSupabase(nextRequests);
      return nextRequests;
    });

    // Notify target user
    const targetUser = users.find(u => u.role === targetUserRole && u.active) ||
                       users.find(u => (u.role === 'CHAIRMAN' || u.role === 'MD' || u.role === 'CFO') && u.active) ||
                       users[0];

    const notifStatus = newStatus === 'PENDING_CFO' ? 'ESCALATED_TO_CFO' : 'ESCALATED_TO_EXECUTIVE';
    const notif = sendNotification({
      type: 'SMS',
      recipient: targetUser,
      role: targetUser.role,
      requestCode: targetReq.requestCode,
      patientName: targetReq.patientName,
      discountVal: targetReq.requestedDiscountVal,
      status: notifStatus,
      amount: targetReq.calculatedDiscountAmount
    });

    setNotifications(prev => [notif, ...prev]);
    triggerToast(`Request ${targetReq.requestCode} escalated to ${targetUserRole} for permission!`, 'info');
    return true;
  };

  // Approve a request
  const approveRequest = (requestId, comments = '') => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return;

    const nowIso = new Date().toISOString();
    const finalComment = comments || `Permission granted by ${activeUser.name} (${activeUser.designation})`;

    const newChainItem = {
      step: (targetReq.approvalChain?.length || 1) + 1,
      title: 'Final Authorization Granted',
      actor: `${activeUser.name} (${activeUser.designation})`,
      role: activeUser.role,
      action: 'APPROVED',
      comments: finalComment,
      timestamp: nowIso
    };

    setRequests(prev => {
      const nextRequests = prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'APPROVED',
            approverComments: finalComment,
            approvedBy: `${activeUser.name} (${activeUser.designation})`,
            approvalTimestamp: nowIso,
            approvalChain: [...(req.approvalChain || []), newChainItem]
          };
        }
        return req;
      });
      localStorage.setItem('carepulse_requests', JSON.stringify(nextRequests));
      pushRequestsToSupabase(nextRequests);
      return nextRequests;
    });

    const notif = sendNotification({
      type: 'SMS',
      recipient: { name: targetReq.requestedBy, phone: '+1 (555) 011-4455', role: 'RECEPTIONIST' },
      role: activeUser.role,
      requestCode: targetReq.requestCode,
      patientName: targetReq.patientName,
      discountVal: targetReq.requestedDiscountVal,
      status: 'APPROVED',
      amount: targetReq.calculatedDiscountAmount
    });

    setNotifications(prev => [notif, ...prev]);
    triggerToast(`Discount ${targetReq.requestCode} APPROVED by ${activeUser.name}! Active on Billing Desk.`, 'success');

    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
  };

  // Reject a request
  const rejectRequest = (requestId, comments = '') => {
    const targetReq = requests.find(r => r.id === requestId);
    if (!targetReq) return false;

    const reason = (comments && comments.trim()) 
      ? comments.trim() 
      : `Declined / Rejected by ${activeUser?.name || 'Administrator'} (${activeUser?.role || 'ADMIN'}).`;

    const nowIso = new Date().toISOString();
    const newChainItem = {
      step: (targetReq.approvalChain?.length || 1) + 1,
      title: 'Request Declined',
      actor: `${activeUser.name} (${activeUser.designation})`,
      role: activeUser.role,
      action: 'REJECTED',
      comments: reason,
      timestamp: nowIso
    };

    setRequests(prev => {
      const nextRequests = prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: 'REJECTED',
            approverComments: reason,
            approvedBy: `${activeUser.name} (${activeUser.designation})`,
            approvalTimestamp: nowIso,
            approvalChain: [...(req.approvalChain || []), newChainItem]
          };
        }
        return req;
      });
      localStorage.setItem('carepulse_requests', JSON.stringify(nextRequests));
      pushRequestsToSupabase(nextRequests);
      return nextRequests;
    });

    const notif = sendNotification({
      type: 'SMS',
      recipient: { name: targetReq.requestedBy, phone: '+1 (555) 011-4455', role: 'RECEPTIONIST' },
      role: activeUser.role,
      requestCode: targetReq.requestCode,
      patientName: targetReq.patientName,
      discountVal: targetReq.requestedDiscountVal,
      status: 'REJECTED',
      amount: targetReq.calculatedDiscountAmount
    });

    setNotifications(prev => [notif, ...prev]);
    triggerToast(`Discount ${targetReq.requestCode} REJECTED by ${activeUser.name}. (Moved to Rejected tab)`, 'warning');
    return true;
  };

  // Admin user CRUD actions
  const addUser = (userData) => {
    const username = (userData.username && userData.username.trim())
      ? userData.username.trim()
      : userData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const password = (userData.password && userData.password.trim())
      ? userData.password.trim()
      : 'Pass@123';

    const newUser = {
      id: 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      username,
      password,
      name: userData.name,
      role: userData.role,
      designation: userData.designation || userData.role,
      department: userData.department || 'Billing & Accounts',
      email: userData.email || `${username}@carepulse.com`,
      phone: userData.phone || '+1 (555) 000-0000',
      active: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`
    };

    setUsers(prev => {
      const nextUsers = [...prev, newUser];
      localStorage.setItem('carepulse_users', JSON.stringify(nextUsers));
      pushUsersToSupabase(nextUsers);
      return nextUsers;
    });

    if (userData.role === 'DOCTOR' && userData.name) {
      addDoctor(userData.name);
    }

    triggerToast(`New Doctor / User ID "${userData.name}" (Username: ${username}, Password: ${password}) created successfully!`, 'success');
  };

  const updateUser = (userId, updatedFields) => {
    setUsers(prev => {
      const nextUsers = prev.map(u => (u.id === userId || u.username === userId) ? { ...u, ...updatedFields } : u);
      localStorage.setItem('carepulse_users', JSON.stringify(nextUsers));
      pushUsersToSupabase(nextUsers);
      return nextUsers;
    });
    setActiveUser(prev => {
      if (prev && (prev.id === userId || prev.username === userId)) {
        const updatedActive = { ...prev, ...updatedFields };
        localStorage.setItem('carepulse_active_user', updatedActive.id || updatedActive.username);
        return updatedActive;
      }
      return prev;
    });
    triggerToast('User designation & profile updated successfully.', 'success');
  };

  const deleteUser = async (userId) => {
    if (!userId) return;
    
    // Find target user to capture id, username, and name
    const targetUser = users.find(u => u.id === userId || u.username === userId || u.name === userId);

    const idVal = userId;
    const targetId = targetUser?.id || userId;
    const targetUsername = targetUser?.username;
    const targetName = targetUser?.name;

    // Save id, username, and name to deleted users blacklist so Supabase sync never restores them
    try {
      const savedDeleted = localStorage.getItem('carepulse_deleted_users');
      const deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];
      
      [idVal, targetId, targetUsername, targetName].filter(Boolean).forEach(item => {
        if (!deletedList.includes(item)) {
          deletedList.push(item);
        }
      });

      localStorage.setItem('carepulse_deleted_users', JSON.stringify(deletedList));
    } catch (e) {}

    // If deleting a doctor user, also remove doctor's name from preset doctors directory
    if (targetUser && (targetUser.role === 'DOCTOR' || targetUser.name?.toLowerCase().includes('dr.'))) {
      deleteDoctor(targetUser.name);
    }

    setUsers(prev => {
      const next = prev.filter(u => 
        u.id !== idVal && 
        u.id !== targetId &&
        u.username !== targetId &&
        u.name !== targetId &&
        (!targetUsername || u.username !== targetUsername) &&
        (!targetName || u.name !== targetName)
      );
      localStorage.setItem('carepulse_users', JSON.stringify(next));
      return next;
    });

    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (client) {
      try {
        if (targetId) {
          await client.from('hospital_users').update({ active: false, role: 'DELETED' }).eq('id', targetId);
          await client.from('hospital_users').delete().eq('id', targetId);
        }
        if (targetUsername) {
          await client.from('hospital_users').update({ active: false, role: 'DELETED' }).eq('username', targetUsername);
          await client.from('hospital_users').delete().eq('username', targetUsername);
        }
        if (targetName) {
          await client.from('hospital_users').update({ active: false, role: 'DELETED' }).eq('name', targetName);
          await client.from('hospital_users').delete().eq('name', targetName);
        }
        await client.from('hospital_users').update({ active: false, role: 'DELETED' }).eq('id', idVal);
        await client.from('hospital_users').delete().eq('id', idVal);
      } catch (e) {}
    }
    triggerToast(`User "${targetName || targetId || userId}" removed from directory.`, 'info');
  };

  // Department Admin CRUD actions
  const addDepartment = (deptName) => {
    const trimmed = deptName.trim();
    if (!trimmed) return;

    try {
      const savedDeleted = localStorage.getItem('carepulse_deleted_departments');
      if (savedDeleted) {
        const deletedList = JSON.parse(savedDeleted).filter(d => d.toLowerCase() !== trimmed.toLowerCase());
        localStorage.setItem('carepulse_deleted_departments', JSON.stringify(deletedList));
      }
    } catch (e) {}

    if (departments.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      triggerToast(`Department "${trimmed}" already exists.`, 'warning');
      return;
    }
    setDepartments(prev => {
      const next = [...prev, trimmed];
      localStorage.setItem('carepulse_departments', JSON.stringify(next));
      return next;
    });
    triggerToast(`New department "${trimmed}" added successfully by Admin!`, 'success');
  };

  const deleteDepartment = (deptName) => {
    if (!deptName) return;
    const target = deptName.trim();
    const targetLower = target.toLowerCase();

    try {
      const savedDeleted = localStorage.getItem('carepulse_deleted_departments');
      const deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];
      if (!deletedList.includes(target)) {
        deletedList.push(target);
        localStorage.setItem('carepulse_deleted_departments', JSON.stringify(deletedList));
      }
    } catch (e) {}

    setDepartments(prev => {
      const next = prev.filter(d => d.trim().toLowerCase() !== targetLower);
      localStorage.setItem('carepulse_departments', JSON.stringify(next));
      return next;
    });
    triggerToast(`Department "${deptName}" removed.`, 'info');
  };

  // Service Admin CRUD actions
  const addService = (serviceName) => {
    const trimmed = serviceName.trim();
    if (!trimmed) return;

    try {
      const savedDeleted = localStorage.getItem('carepulse_deleted_services');
      if (savedDeleted) {
        const deletedList = JSON.parse(savedDeleted).filter(s => s.toLowerCase() !== trimmed.toLowerCase());
        localStorage.setItem('carepulse_deleted_services', JSON.stringify(deletedList));
      }
    } catch (e) {}

    if (services.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      triggerToast(`Service "${trimmed}" already exists.`, 'warning');
      return;
    }
    setServices(prev => {
      const next = [...prev, trimmed];
      localStorage.setItem('carepulse_services', JSON.stringify(next));
      return next;
    });
    triggerToast(`New hospital service "${trimmed}" added successfully by Admin!`, 'success');
  };

  const deleteService = (serviceName) => {
    if (!serviceName) return;
    const target = serviceName.trim();
    const targetLower = target.toLowerCase();

    try {
      const savedDeleted = localStorage.getItem('carepulse_deleted_services');
      const deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];
      if (!deletedList.includes(target)) {
        deletedList.push(target);
        localStorage.setItem('carepulse_deleted_services', JSON.stringify(deletedList));
      }
    } catch (e) {}

    setServices(prev => {
      const next = prev.filter(s => s.trim().toLowerCase() !== targetLower);
      localStorage.setItem('carepulse_services', JSON.stringify(next));
      return next;
    });
    triggerToast(`Hospital service "${serviceName}" removed.`, 'info');
  };

  // Doctor Admin CRUD actions
  const addDoctor = (doctorName) => {
    const trimmed = doctorName.trim();
    if (!trimmed) return;

    try {
      const savedDeleted = localStorage.getItem('carepulse_deleted_doctors');
      if (savedDeleted) {
        const deletedList = JSON.parse(savedDeleted).filter(d => d.toLowerCase() !== trimmed.toLowerCase());
        localStorage.setItem('carepulse_deleted_doctors', JSON.stringify(deletedList));
      }
    } catch (e) {}

    if (doctors.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      triggerToast(`Doctor "${trimmed}" already exists.`, 'warning');
      return;
    }
    setDoctors(prev => {
      const next = [...prev, trimmed];
      localStorage.setItem('carepulse_doctors', JSON.stringify(next));
      return next;
    });

    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (client) {
      client.from('hospital_doctors').upsert({
        id: 'DOC-' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: trimmed
      }, { onConflict: 'name' }).then(({ error }) => {
        if (error) console.warn('Supabase doctor insert error:', error);
      });
    }

    triggerToast(`New doctor "${trimmed}" added to directory successfully!`, 'success');
  };

  const deleteDoctor = async (doctorName) => {
    if (!doctorName) return;
    const target = doctorName.trim();
    const targetLower = target.toLowerCase();

    try {
      const savedDeleted = localStorage.getItem('carepulse_deleted_doctors');
      const deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];
      if (!deletedList.includes(target)) {
        deletedList.push(target);
        localStorage.setItem('carepulse_deleted_doctors', JSON.stringify(deletedList));
      }
    } catch (e) {}

    setDoctors(prev => {
      const next = prev.filter(d => d.trim().toLowerCase() !== targetLower);
      localStorage.setItem('carepulse_doctors', JSON.stringify(next));
      return next;
    });

    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (client) {
      try {
        await client.from('hospital_doctors').delete().eq('name', target);
        await client.from('hospital_users').update({ active: false, role: 'DELETED' }).eq('name', target);
        await client.from('hospital_users').delete().eq('name', target);
      } catch (e) {}
    }

    triggerToast(`Doctor "${doctorName}" removed from directory.`, 'info');
  };

  const clearAllDoctors = async () => {
    // Add all current doctors to deleted doctors blacklist
    try {
      const savedDeleted = localStorage.getItem('carepulse_deleted_doctors');
      const deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];
      doctors.forEach(doc => {
        if (!deletedList.includes(doc)) {
          deletedList.push(doc);
        }
      });
      localStorage.setItem('carepulse_deleted_doctors', JSON.stringify(deletedList));
    } catch (e) {}

    setDoctors([]);
    localStorage.setItem('carepulse_doctors', JSON.stringify([]));

    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (client) {
      try {
        await client.from('hospital_doctors').delete().neq('id', '');
      } catch (e) {}
    }

    triggerToast('All doctors cleared from directory.', 'info');
  };

  const updateDiscountRequest = (requestId, updatedFields) => {
    if (!requestId) return false;
    
    let updatedObj = null;

    setRequests(prev => {
      const nextRequests = prev.map(req => {
        if (req.id === requestId) {
          const totalBill = updatedFields.totalBillAmount !== undefined ? Number(updatedFields.totalBillAmount) : req.totalBillAmount;
          const discType = updatedFields.requestedDiscountType || req.requestedDiscountType;
          let discountVal = updatedFields.requestedDiscountVal !== undefined ? Number(updatedFields.requestedDiscountVal) : req.requestedDiscountVal;
          let calculatedDiscount = 0;

          if (discType === 'FIXED') {
            calculatedDiscount = discountVal;
            discountVal = Number(((calculatedDiscount / totalBill) * 100).toFixed(1));
          } else {
            calculatedDiscount = Number(((totalBill * discountVal) / 100).toFixed(2));
          }

          const finalPayable = Math.max(0, totalBill - calculatedDiscount);
          const authorityInfo = getRequiredAuthorityForDiscount(discountVal, calculatedDiscount, updatedFields.targetApprovalRole || req.requiredAuthorityRole);

          updatedObj = {
            ...req,
            ...updatedFields,
            totalBillAmount: totalBill,
            requestedDiscountType: discType,
            requestedDiscountVal: discountVal,
            calculatedDiscountAmount: calculatedDiscount,
            finalPayableAmount: finalPayable,
            requiredAuthorityRole: authorityInfo.role
          };
          return updatedObj;
        }
        return req;
      });

      localStorage.setItem('carepulse_requests', JSON.stringify(nextRequests));
      pushRequestsToSupabase(nextRequests);
      return nextRequests;
    });

    triggerToast('Discount request details updated and saved successfully!', 'success');
    return updatedObj;
  };

  const deleteRequest = async (requestId) => {
    if (!requestId) return false;
    const req = requests.find(r => r.id === requestId);

    // Save to deleted requests blacklist so Supabase sync never restores it
    try {
      const savedDeleted = localStorage.getItem('carepulse_deleted_requests');
      const deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];
      if (!deletedList.includes(requestId)) {
        deletedList.push(requestId);
        localStorage.setItem('carepulse_deleted_requests', JSON.stringify(deletedList));
      }
    } catch (e) {}

    setRequests(prev => {
      const nextRequests = prev.filter(r => r.id !== requestId);
      localStorage.setItem('carepulse_requests', JSON.stringify(nextRequests));
      return nextRequests;
    });
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (client) {
      try {
        await client.from('discount_requests').update({ status: 'DELETED' }).eq('id', requestId);
        await client.from('discount_requests').delete().eq('id', requestId);
      } catch (e) {}
    }
    triggerToast(`Discount request #${req?.requestCode || requestId} has been removed permanently.`, 'info');
    return true;
  };

  const resetSystemDefaults = () => {
    localStorage.removeItem('carepulse_users');
    localStorage.removeItem('carepulse_departments');
    localStorage.removeItem('carepulse_services');
    localStorage.removeItem('carepulse_doctors');
    localStorage.removeItem('carepulse_requests');
    localStorage.removeItem('carepulse_notifs');
    setUsers(INITIAL_USERS);
    setDepartments(INITIAL_DEPARTMENTS);
    setServices(INITIAL_SERVICES);
    setDoctors(INITIAL_DOCTORS);
    setRequests(INITIAL_REQUESTS);
    setActiveUser(INITIAL_USERS.find(u => u.role === 'ADMIN') || INITIAL_USERS[0]);
    triggerToast('System data reset to default configuration!', 'info');
  };

  // Automated Daily Backup State & Scheduler
  const [dailyBackups, setDailyBackups] = useState(() => {
    const saved = localStorage.getItem('carepulse_daily_backups_list');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const [autoDownloadDailyBackup, setAutoDownloadDailyBackupState] = useState(() => {
    const saved = localStorage.getItem('carepulse_auto_download_daily_backup');
    return saved ? JSON.parse(saved) : false;
  });

  const setAutoDownloadDailyBackup = (val) => {
    setAutoDownloadDailyBackupState(val);
    localStorage.setItem('carepulse_auto_download_daily_backup', JSON.stringify(val));
  };

  const downloadDailyBackup = (backupItem) => {
    if (!backupItem || !backupItem.bundle) return;
    const jsonStr = JSON.stringify(backupItem.bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stavya_daily_backup_${backupItem.date || new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(`Downloaded Daily Backup JSON for ${backupItem.date}!`, 'success');
  };

  const performDailyBackup = (forceDate = null) => {
    const todayDate = forceDate || new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    const backupBundle = {
      metadata: {
        systemId: "STAVYA-SPINE",
        systemName: "Stavya Spine Hospital Discount System",
        backupDate: todayDate,
        timestamp: timestamp,
        schemaVersion: "1.0",
        totalRequests: requests?.length || 0,
        totalUsers: users?.length || 0,
        totalDoctors: doctors?.length || 0,
        checksum: `SHA256-DAILY-BACKUP-${Date.now()}`
      },
      payload: {
        requests,
        users,
        doctors,
        departments,
        services,
        notifications
      }
    };

    const newBackupItem = {
      id: `BACKUP-${todayDate}-${Date.now().toString().slice(-4)}`,
      date: todayDate,
      timestamp,
      requestsCount: requests?.length || 0,
      usersCount: users?.length || 0,
      doctorsCount: doctors?.length || 0,
      sizeBytes: JSON.stringify(backupBundle).length,
      bundle: backupBundle
    };

    setDailyBackups(prev => {
      const filtered = prev.filter(b => b.date !== todayDate);
      const nextList = [newBackupItem, ...filtered].slice(0, 30);
      localStorage.setItem('carepulse_daily_backups_list', JSON.stringify(nextList));
      return nextList;
    });

    localStorage.setItem('carepulse_last_daily_backup_date', todayDate);

    const notifItem = {
      id: 'NOTIF-BACKUP-' + Date.now().toString().slice(-6),
      type: 'EMAIL',
      recipientName: activeUser?.name || 'System Admin',
      recipientContact: activeUser?.email || 'admin@stavya.org',
      role: 'ADMIN',
      subject: `[DAILY DATA BACKUP] Automated System Backup Completed (${todayDate})`,
      body: `Automated Daily Backup generated successfully for ${todayDate}. Contains ${requests?.length || 0} discount requests, ${users?.length || 0} registered users, and ${doctors?.length || 0} doctors.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'DELIVERED',
      gateway: 'Daily Automated Scheduler'
    };
    setNotifications(prev => [notifItem, ...prev]);

    if (autoDownloadDailyBackup) {
      downloadDailyBackup(newBackupItem);
    }

    triggerToast(`Daily Data Backup snapshot created for ${todayDate}!`, 'success');
    return newBackupItem;
  };

  const restoreDailyBackup = (backupItem) => {
    if (!backupItem || !backupItem.bundle) return false;
    const jsonStr = JSON.stringify(backupItem.bundle);
    const success = importSystemSyncData(jsonStr);
    if (success) {
      triggerToast(`Restored system data from Daily Backup (${backupItem.date})!`, 'success');
    }
    return success;
  };

  // Automated Daily Backup Schedule Trigger
  useEffect(() => {
    if (requests && requests.length > 0) {
      const todayDate = new Date().toISOString().split('T')[0];
      const lastBackupDate = localStorage.getItem('carepulse_last_daily_backup_date');
      if (lastBackupDate !== todayDate) {
        performDailyBackup(todayDate);
      }
    }
  }, [requests?.length, users?.length]);

  return (
    <AppContext.Provider
      value={{
        users,
        activeUser,
        setActiveUser,
        isAuthenticated,
        login,
        logout,
        departments,
        addDepartment,
        deleteDepartment,
        services,
        addService,
        deleteService,
        SERVICE_DEPARTMENT_MAP,
        getDepartmentForService,
        doctors,
        addDoctor,
        deleteDoctor,
        clearAllDoctors,
        requests,
        resetSystemDefaults,
        notifications,
        supabaseConfig,
        setSupabaseConfig,
        toastAlert,
        triggerToast,
        getRequiredAuthorityForDiscount,
        isBillingRole,
        isExecutiveRole,
        getRoleMeta,
        createDiscountRequest,
        updateDiscountRequest,
        createDirectExecutiveGrant,
        escalateRequest,
        approveRequest,
        rejectRequest,
        addUser,
        updateUser,
        deleteUser,
        deleteRequest,
        getMobileSyncUrl,
        importSystemSyncData,
        getCommonAppUrl,
        copyCommonAppUrl,
        openCommonAppUrl,
        commonIp,
        setCommonIp,
        copyToClipboard,
        manualSync,
        dailyBackups,
        performDailyBackup,
        downloadDailyBackup,
        restoreDailyBackup,
        autoDownloadDailyBackup,
        setAutoDownloadDailyBackup
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
