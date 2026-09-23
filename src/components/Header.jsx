import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Building2, 
  ShieldAlert, 
  UserCheck, 
  PlusCircle, 
  FileSpreadsheet, 
  Bell, 
  Radio,
  Settings,
  Users,
  LogOut,
  RotateCcw,
  Smartphone,
  Globe,
  Link2,
  Cpu,
  Calculator,
  Menu,
  X,
  Calendar
} from 'lucide-react';

export const Header = ({ 
  onOpenNewModal, 
  onOpenExcelModal, 
  onOpenNotifDrawer, 
  onOpenSupabaseModal,
  onOpenMobileSyncModal,
  onOpenPortingModal,
  onOpenTallyModal,
  onOpenTallyCloneModal,
  onOpenLoginModal,
  activeTab,
  setActiveTab 
}) => {
  const { users, activeUser, setActiveUser, notifications, supabaseConfig, logout, isBillingRole, getRoleMeta, resetSystemDefaults, manualSync } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isBillingStaff = isBillingRole(activeUser?.role);
  const roleMeta = getRoleMeta(activeUser?.role);

  const userRole = activeUser?.role || '';
  const hasFullAccess = [
    'ADMIN',
    'CFO',
    'CHIEF_ACCOUNTANT',
    'FINANCE_MGR',
    'BILLING_MANAGER',
    'MD',
    'AD',
    'DIRECTOR',
    'CHAIRMAN',
    'VICE_CHAIRMAN'
  ].includes(userRole);

  return (
    <header className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Brand & Connection Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-700 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/20 text-white font-extrabold flex-shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight truncate">
                Stavya Spine Hospital
              </h1>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide hidden sm:inline-block">
                Stavya Intelligence
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-badge"></span>
                <span className="hidden sm:inline">{supabaseConfig.isConnected ? 'Supabase Realtime' : 'Spine OPD System'}</span>
                <span className="sm:hidden">Online</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center Tabs: Desktop Only (Admin Role Only) */}
        {activeUser?.role === 'ADMIN' && (
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-xs transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white font-black shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              OPD Dashboard & Waivers
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white font-black shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Directory & Roles</span>
            </button>
          </div>
        )}

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
          
          {/* Active Logged-In User Session */}
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500 block -mb-0.5">
                Active User Session
              </span>
              {activeUser?.role === 'ADMIN' ? (
                <select
                  value={activeUser?.id || activeUser?.role}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const targetUser = users.find(u => u.id === selectedId || u.role === selectedId || u.username === selectedId);
                    if (targetUser) {
                      setActiveUser(targetUser);
                    }
                  }}
                  className="bg-transparent text-xs font-extrabold text-blue-700 focus:outline-none cursor-pointer hover:text-blue-800 transition-colors max-w-[180px] truncate"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id} className="bg-white text-slate-900 font-sans">
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-extrabold text-blue-700 block max-w-[180px] truncate">
                  {activeUser?.name || 'Staff User'}
                </span>
              )}
            </div>
          </div>

          {/* New Request Button */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            New Discount
          </button>

          {/* Executive & Admin Only Tools */}
          {hasFullAccess && (
            <>
              {/* Export Excel Button */}
              {!isBillingStaff && (
                <button
                  onClick={onOpenExcelModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs transition-all active:scale-95"
                  title="Download Formatted Excel Report"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export Excel</span>
                </button>
              )}

              {/* Mobile Sync Trigger Button */}
              <button
                onClick={onOpenMobileSyncModal}
                className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                title="Mobile Sync & QR Code"
              >
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Mobile Sync</span>
              </button>

              {/* Automated Daily Data Backup & Snapshots Button */}
              <button
                onClick={() => onOpenPortingModal('DAILY_BACKUP')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Daily Data Backup, Automated Snapshots & History"
              >
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Daily Data Backup</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>

              {/* System Data Recovery & Restore Button */}
              <button
                onClick={() => onOpenPortingModal('RECOVERY')}
                className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="System Data Recovery, Snapshot Restore & Backup Upload"
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Data Recovery</span>
              </button>

              {/* Port & API Integration Modal Button */}
              <button
                onClick={() => onOpenPortingModal('EXPORT_IMPORT')}
                className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Software Migration, OpenAPI & REST Integration API"
              >
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>Port & API</span>
              </button>

              {/* Tally ERP 9 / Tally Prime Accounting Button */}
              <button
                onClick={onOpenTallyModal}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Tally ERP 9 / Tally Prime Direct Integration & Data Merger"
              >
                <Calculator className="w-4 h-4 text-amber-600" />
                <span>Tally Sync</span>
              </button>

              {/* Tally Interactive Clone Module */}
              <button
                onClick={onOpenTallyCloneModal}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
                title="Interactive Tally Prime Emulator & Accounting Vouchers Module"
              >
                <Building2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Tally Clone OS</span>
              </button>

              {/* Quick Manual Sync Refresh Button */}
              <button
                onClick={() => {
                  if (manualSync) manualSync();
                }}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                title="Instant Live Network Sync & Refresh"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              </button>

              {/* Supabase Config Trigger (Admin Only) */}
              {activeUser?.role === 'ADMIN' && (
                <button
                  onClick={onOpenSupabaseModal}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
                  title="Supabase & Realtime Settings"
                >
                  <Radio className="w-4 h-4 text-blue-600" />
                </button>
              )}
            </>
          )}

          {/* Live Notification Drawer Trigger (Visible to All) */}
          <button
            onClick={onOpenNotifDrawer}
            className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all"
            title="Live SMS & Email Activity Feed"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center animate-bounce">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Reset System Defaults (Admin Only) */}
          {activeUser?.role === 'ADMIN' && (
            <button
              onClick={() => {
                if (window.confirm('Reset all roles, services, and requests to default system configuration?')) {
                  resetSystemDefaults();
                }
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200 transition-all"
              title="Reset System Data to Defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Logout Button (Visible to All) */}
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all"
            title="Logout Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile View Right Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onOpenNotifDrawer}
            className="relative p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 active:scale-95"
          >
            <Bell className="w-4.5 h-4.5 text-amber-600" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-blue-600 active:scale-95"
            aria-label="Toggle Mobile Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Slide-Out Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 mt-2 border-t border-slate-200 space-y-3 animate-fadeIn">
          
          {/* Mobile Active User session badge */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block -mb-0.5">Session User</span>
                <span className="text-xs font-bold text-blue-700 truncate block">{activeUser?.name}</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {activeUser?.role}
            </span>
          </div>

          {/* Admin Tabs Switcher for Admin role on Mobile */}
          {activeUser?.role === 'ADMIN' && (
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                className={`py-2 rounded-lg text-xs font-bold ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              >
                OPD Dashboard
              </button>
              <button
                onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                className={`py-2 rounded-lg text-xs font-bold ${activeTab === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
              >
                User Directory
              </button>
            </div>
          )}

          {/* Grid of Action Buttons on Mobile Menu */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => { onOpenNewModal(); setMobileMenuOpen(false); }}
              className="py-2.5 px-3 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md col-span-2 sm:col-span-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Discount</span>
            </button>

            {hasFullAccess && (
              <>
                <button
                  onClick={() => { onOpenMobileSyncModal(); setMobileMenuOpen(false); }}
                  className="py-2.5 px-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile Sync</span>
                </button>

                <button
                  onClick={() => { onOpenPortingModal('DAILY_BACKUP'); setMobileMenuOpen(false); }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Daily Data Backup</span>
                </button>

                <button
                  onClick={() => { onOpenPortingModal('RECOVERY'); setMobileMenuOpen(false); }}
                  className="py-2.5 px-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-extrabold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Data Recovery</span>
                </button>

                <button
                  onClick={() => { onOpenPortingModal(); setMobileMenuOpen(false); }}
                  className="py-2.5 px-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Port & API</span>
                </button>

                {!isBillingStaff && (
                  <button
                    onClick={() => { onOpenExcelModal(); setMobileMenuOpen(false); }}
                    className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                )}

                <button
                  onClick={() => { if (manualSync) manualSync(); setMobileMenuOpen(false); }}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 text-blue-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span>Sync Refresh</span>
                </button>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">Stavya Spine Hospital OS v1.0</span>
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); }}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      )}

    </header>
  );
};
