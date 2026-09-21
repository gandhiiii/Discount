import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_FILE = path.join(__dirname, 'data.json');

// MIME types map
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=UTF-8'
};

// Persistence helpers
const loadFromDisk = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      console.log(`[Stavya Local Server] ✅ Loaded state from data.json (${parsed.requests?.length || 0} requests, ${parsed.users?.length || 0} users)`);
      return parsed;
    }
  } catch (e) {
    console.warn('[Stavya Local Server] ⚠️ Could not read data.json, starting clean:', e.message);
  }
  return { requests: [], users: [], doctors: [], departments: [], services: [] };
};

const saveToDisk = (state) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Stavya Local Server] ❌ Failed to write data.json:', e.message);
  }
};

let sharedNetworkState = loadFromDisk();
let registeredWebhooks = [];

const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "Stavya Spine Hospital — Discount & Approval Integration API",
    description: "Enterprise Portability & REST API for integrating Stavya Spine Hospital Billing Discount Software with third-party HIS, EMR, ERP, and Tally software.",
    version: "1.0.0",
    contact: {
      name: "Stavya IT Administration",
      email: "api-support@stavya.org",
      url: "https://stavya.org"
    }
  },
  servers: [
    {
      url: `http://localhost:${PORT}/api/v1`,
      description: "Local Windows Server API"
    }
  ]
};

// Network IP helper
const getNetworkAddresses = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
};

// Create HTTP server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // --- API ROUTING ---
  if (req.url.startsWith('/api/')) {
    // /api/sync
    if (req.url === '/api/sync' || req.url.startsWith('/api/sync?')) {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            sharedNetworkState = {
              ...parsed,
              serverTimestamp: Date.now()
            };
            saveToDisk(sharedNetworkState);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, timestamp: sharedNetworkState.serverTimestamp }));
          } catch (e) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
          }
        });
        return;
      }

      if (req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(sharedNetworkState || {}));
        return;
      }
    }

    // Enterprise REST API v1
    if (req.url.startsWith('/api/v1')) {
      const urlPath = req.url.replace('/api/v1', '').split('?')[0];

      // GET /api/v1/health
      if (urlPath === '/health' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: "online",
          system: "Stavya Spine Hospital Billing Discount Local Server",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
          serverTimestamp: Date.now(),
          totalRequests: sharedNetworkState?.requests?.length || 0,
          totalUsers: sharedNetworkState?.users?.length || 0,
          webhooksCount: registeredWebhooks.length
        }));
        return;
      }

      // GET /api/v1/openapi.json
      if (urlPath === '/openapi.json' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(OPENAPI_SPEC, null, 2));
        return;
      }

      // GET /api/v1/export
      if (urlPath === '/export' && req.method === 'GET') {
        const exportBundle = {
          metadata: {
            systemId: "STAVYA-SPINE-LOCAL",
            systemName: "Stavya Spine Hospital Local Server",
            exportTimestamp: new Date().toISOString(),
            schemaVersion: "1.0",
            checksum: `SHA256-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          },
          payload: {
            requests: sharedNetworkState?.requests || [],
            users: sharedNetworkState?.users || [],
            doctors: sharedNetworkState?.doctors || [],
            departments: sharedNetworkState?.departments || [],
            services: sharedNetworkState?.services || []
          }
        };
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="stavya_discount_system_export.json"');
        res.end(JSON.stringify(exportBundle, null, 2));
        return;
      }

      // POST /api/v1/import
      if (urlPath === '/import' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const payload = data.payload || data;
            if (!sharedNetworkState) sharedNetworkState = {};

            if (Array.isArray(payload.requests)) sharedNetworkState.requests = payload.requests;
            if (Array.isArray(payload.users)) sharedNetworkState.users = payload.users;
            if (Array.isArray(payload.doctors)) sharedNetworkState.doctors = payload.doctors;
            if (Array.isArray(payload.departments)) sharedNetworkState.departments = payload.departments;
            if (Array.isArray(payload.services)) sharedNetworkState.services = payload.services;

            sharedNetworkState.serverTimestamp = Date.now();
            saveToDisk(sharedNetworkState);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: "System data imported successfully",
              importedRequests: payload.requests?.length || 0,
              importedUsers: payload.users?.length || 0,
              serverTimestamp: sharedNetworkState.serverTimestamp
            }));
          } catch (e) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: "Invalid import package payload" }));
          }
        });
        return;
      }

      // GET /api/v1/requests
      if (urlPath === '/requests' && req.method === 'GET') {
        const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
        const statusFilter = parsedUrl.searchParams.get('status');
        const patientIdFilter = parsedUrl.searchParams.get('patientId');
        const doctorFilter = parsedUrl.searchParams.get('doctor');

        let reqs = sharedNetworkState?.requests || [];
        if (statusFilter) {
          reqs = reqs.filter(r => r.status?.toUpperCase() === statusFilter.toUpperCase());
        }
        if (patientIdFilter) {
          reqs = reqs.filter(r => r.patientId?.toLowerCase().includes(patientIdFilter.toLowerCase()));
        }
        if (doctorFilter) {
          reqs = reqs.filter(r => r.doctorName?.toLowerCase().includes(doctorFilter.toLowerCase()));
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ count: reqs.length, requests: reqs }));
        return;
      }

      // POST /api/v1/requests
      if (urlPath === '/requests' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const input = JSON.parse(body);
            if (!input.patientName || !input.totalBillAmount) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "patientName and totalBillAmount are required fields" }));
              return;
            }

            const totalAmt = Number(input.totalBillAmount) || 0;
            const discountVal = Number(input.requestedDiscountVal) || 0;
            const discType = input.requestedDiscountType || 'PERCENTAGE';
            const calcAmt = discType === 'PERCENTAGE' ? (totalAmt * discountVal) / 100 : discountVal;
            const finalAmt = Math.max(0, totalAmt - calcAmt);

            let reqRole = 'BILLING_MANAGER';
            if (calcAmt > 200000) reqRole = 'MD';
            else if (calcAmt > 25000) reqRole = 'CFO';

            const newReq = {
              id: `REQ-${Date.now().toString().slice(-4)}`,
              requestCode: `DISC-${Math.floor(1000 + Math.random() * 9000)}`,
              patientId: input.patientId || `UHID-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              patientName: input.patientName,
              patientAge: input.patientAge || 45,
              patientGender: input.patientGender || 'Male',
              department: input.department || 'Radiology',
              serviceName: input.serviceName || 'MRI',
              doctorName: input.doctorName || 'Dr. Rajesh Kumar',
              particulars: input.particulars || `${input.serviceName || 'Medical Service'} Waiver Request`,
              referenceName: input.referenceName || input.doctorName || 'EMR Integration',
              relativeName: input.relativeName || 'N/A',
              receiptNo: input.receiptNo || `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
              billDate: new Date().toISOString().split('T')[0],
              opdIpdNo: input.opdIpdNo || 'OPD-SYS',
              totalBillAmount: totalAmt,
              requestedDiscountType: discType,
              requestedDiscountVal: discountVal,
              calculatedDiscountAmount: calcAmt,
              finalPayableAmount: finalAmt,
              reasonCategory: input.reasonCategory || 'Management Special Grant',
              detailedReason: input.detailedReason || 'Created via REST API Integration',
              proofFileName: input.proofFileName || 'API_Payload.json',
              requestedBy: input.requestedBy || 'HIS/EMR API Gateway',
              requiredAuthorityRole: reqRole,
              currentApproverRole: reqRole,
              status: reqRole === 'MD' ? 'PENDING_MD' : reqRole === 'CFO' ? 'PENDING_CFO' : 'PENDING_BMGR',
              isDirectExecutiveGrant: false,
              approverComments: '',
              approvedBy: '',
              approvalTimestamp: null,
              createdAt: new Date().toISOString(),
              approvalChain: [
                {
                  step: 1,
                  title: 'Submitted via External API Endpoint',
                  actor: input.requestedBy || 'HIS System Integration API',
                  role: 'REST_API',
                  action: 'SUBMITTED',
                  comments: `Request created via POST /api/v1/requests. Total Bill: ₹${totalAmt}, Discount: ${discountVal}${discType === 'PERCENTAGE' ? '%' : ' INR'}.`,
                  timestamp: new Date().toISOString()
                }
              ]
            };

            if (!sharedNetworkState) sharedNetworkState = { requests: [], users: [] };
            if (!Array.isArray(sharedNetworkState.requests)) sharedNetworkState.requests = [];
            sharedNetworkState.requests.unshift(newReq);
            sharedNetworkState.serverTimestamp = Date.now();
            saveToDisk(sharedNetworkState);

            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: "Discount request created successfully via API",
              request: newReq
            }));
          } catch (e) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: "Invalid JSON body" }));
          }
        });
        return;
      }

      // GET /api/v1/users
      if (urlPath === '/users' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          count: sharedNetworkState?.users?.length || 0,
          users: sharedNetworkState?.users || []
        }));
        return;
      }

      // POST /api/v1/users
      if (urlPath === '/users' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const newUser = JSON.parse(body);
            if (!newUser.name || !newUser.role) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "name and role are required fields" }));
              return;
            }
            if (!newUser.id) newUser.id = `USR-EXT-${Date.now().toString().slice(-4)}`;

            if (!sharedNetworkState) sharedNetworkState = { users: [] };
            if (!Array.isArray(sharedNetworkState.users)) sharedNetworkState.users = [];

            const existingIdx = sharedNetworkState.users.findIndex(u => u.id === newUser.id || u.username === newUser.username);
            if (existingIdx >= 0) {
              sharedNetworkState.users[existingIdx] = { ...sharedNetworkState.users[existingIdx], ...newUser };
            } else {
              sharedNetworkState.users.push(newUser);
            }
            sharedNetworkState.serverTimestamp = Date.now();
            saveToDisk(sharedNetworkState);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: "User directory synced successfully",
              user: newUser
            }));
          } catch (e) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: "Invalid user JSON body" }));
          }
        });
        return;
      }

      // GET /api/v1/webhooks
      if (urlPath === '/webhooks' && req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          count: registeredWebhooks.length,
          webhooks: registeredWebhooks
        }));
        return;
      }

      // POST /api/v1/webhooks
      if (urlPath === '/webhooks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
          try {
            const wh = JSON.parse(body);
            if (!wh.url) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: "url is required for webhook registration" }));
              return;
            }
            const webhookItem = {
              id: `WH-${Date.now().toString().slice(-4)}`,
              url: wh.url,
              events: wh.events || ["REQUEST_CREATED", "REQUEST_APPROVED", "REQUEST_REJECTED"],
              active: true,
              createdAt: new Date().toISOString()
            };
            registeredWebhooks.push(webhookItem);
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: "Webhook registered successfully",
              webhook: webhookItem
            }));
          } catch (e) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: "Invalid webhook JSON body" }));
          }
        });
        return;
      }
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Endpoint not found on Local Server" }));
    return;
  }

  // --- STATIC FILE SERVING WITH SPA FALLBACK ---
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST_DIR, reqPath);

  // Check if file exists in dist
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to dist/index.html for client-side routing
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`Server Error: ${readErr.message}`);
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(content);
    });
  });
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  const ips = getNetworkAddresses();
  console.log('\n================================================================');
  console.log('🏥 STAVYA SPINE HOSPITAL — LOCAL WINDOWS SERVER RUNNING');
  console.log('================================================================');
  console.log(`💻 Local Workstation Access:   http://localhost:${PORT}`);
  ips.forEach(ip => {
    console.log(`🌐 Hospital Network Access:    http://${ip}:${PORT}`);
  });
  console.log('================================================================');
  console.log(`💾 Persistent Database File:    ${DATA_FILE}`);
  console.log(`⚡ REST API Endpoint:          http://localhost:${PORT}/api/v1/health`);
  console.log('================================================================\n');
});
