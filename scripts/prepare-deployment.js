import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const deploymentDir = path.join(rootDir, 'deployment');
const distDir = path.join(rootDir, 'dist');
const deploymentDistDir = path.join(deploymentDir, 'dist');

console.log('🚀 Preparing Local Windows Server Deployment Package...\n');

// 1. Run Vite build
console.log('📦 Step 1: Building production web application with Vite...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  console.log('✅ Production build successful!\n');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}

// 2. Ensure deployment directories exist
if (!fs.existsSync(deploymentDir)) {
  fs.mkdirSync(deploymentDir, { recursive: true });
}

// 3. Copy dist directory to deployment/dist
console.log('📂 Step 2: Copying build artifacts to deployment/dist...');
if (fs.existsSync(deploymentDistDir)) {
  fs.rmSync(deploymentDistDir, { recursive: true, force: true });
}

function copyFolderRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  files.forEach((file) => {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  });
}

copyFolderRecursiveSync(distDir, deploymentDistDir);
console.log('✅ Static build assets copied successfully!\n');

// 4. Seed data.json if missing in deployment
const rootDataFile = path.join(rootDir, 'data.json');
const deploymentDataFile = path.join(deploymentDir, 'data.json');

if (!fs.existsSync(deploymentDataFile)) {
  if (fs.existsSync(rootDataFile)) {
    fs.copyFileSync(rootDataFile, deploymentDataFile);
    console.log('📄 Step 3: Seeded data.json from project root.');
  } else {
    fs.writeFileSync(deploymentDataFile, JSON.stringify({ requests: [], users: [], doctors: [], departments: [], services: [] }, null, 2));
    console.log('📄 Step 3: Created initial empty data.json in deployment folder.');
  }
} else {
  console.log('📄 Step 3: deployment/data.json already exists (preserved existing data).');
}

console.log('\n🎉 Deployment package successfully prepared inside:');
console.log(`👉 ${deploymentDir}`);
console.log('\nNext steps to run on Local Windows Server:');
console.log('1. Run: cd deployment && node server.js');
console.log('2. Or double-click: deployment/start-server.bat\n');
