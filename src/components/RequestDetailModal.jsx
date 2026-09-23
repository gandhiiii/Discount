import React, { useState } from 'react';
import { useApp, isPresetDemoDoctor } from '../context/AppContext';
import { DoctorBiometricModal } from './DoctorBiometricModal';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ShieldCheck, 
  User, 
  Download, 
  MessageSquare, 
  Calendar,
  Building,
  Award,
  ArrowUpRight,
  Printer,
  Sparkles,
  ShieldAlert,
  Trash2,
  Fingerprint,
  Edit3,
  ChevronDown
} from 'lucide-react';

export const RequestDetailModal = ({ request, onClose }) => {
  const { activeUser, approveRequest, rejectRequest, escalateRequest, deleteRequest, updateDiscountRequest, doctors, departments, services } = useApp();
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState('APPROVE'); // 'APPROVE', 'ESCALATE_CFO', 'ESCALATE_EXEC', 'REJECT'
  const [showBiometricModal, setShowBiometricModal] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    patientName: request?.patientName || '',
    opdIpdNo: request?.opdIpdNo || '',
    totalBillAmount: request?.totalBillAmount || '',
    requestedDiscountVal: request?.requestedDiscountVal || '',
    requestedDiscountType: request?.requestedDiscountType || 'PERCENTAGE',
    doctorName: request?.doctorName || '',
    department: request?.department || '',
    serviceName: request?.serviceName || '',
    particulars: request?.particulars || '',
    detailedReason: request?.detailedReason || ''
  });

  const [isCustomParticular, setIsCustomParticular] = useState(false);

  if (!request) return null;

  const isPending = request.status?.startsWith('PENDING');
  const isApproved = request.status === 'APPROVED';
  const isRejected = request.status === 'REJECTED';

  // Role permissions checks
  const userRole = activeUser?.role || '';
  const isBMgr = userRole === 'BILLING_MANAGER';
  const isCA = userRole === 'CHIEF_ACCOUNTANT';
  const isCFO = userRole === 'CFO';
  const isExecutive = ['CHAIRMAN', 'VICE_CHAIRMAN', 'MD'].includes(userRole);
  const isAdmin = userRole === 'ADMIN';

  const canBMgrAction = (isBMgr || isAdmin) && (request.status === 'PENDING_BMGR' || request.status === 'PENDING');
  const canCAAction = (isCA || isAdmin) && (request.status === 'PENDING_CA' || request.status === 'PENDING_BMGR' || request.status === 'PENDING');
  const canCFOAction = (isCFO || isAdmin) && (request.status === 'PENDING_CFO' || request.status === 'PENDING_CA' || request.status === 'PENDING_BMGR' || request.status === 'PENDING');
  const canExecAction = (isExecutive || isAdmin) && isPending;

  const canAction = canBMgrAction || canCAAction || canCFOAction || canExecAction;

  const handleExecuteAction = () => {
    if (actionType === 'APPROVE') {
      setShowBiometricModal(true);
    } else if (actionType === 'ESCALATE_CA') {
      if (escalateRequest(request.id, 'CHIEF_ACCOUNTANT', comments || 'Amount exceeds Billing Manager limit. Escalating to Chief Accountant.')) {
        onClose();
      }
    } else if (actionType === 'ESCALATE_CFO') {
      if (escalateRequest(request.id, 'CFO', comments || 'Amount is High. Escalating to CFO for permission.')) {
        onClose();
      }
    } else if (actionType === 'ESCALATE_EXEC') {
      if (escalateRequest(request.id, 'EXECUTIVE', comments || 'Amount is Too High. Escalating to MD / Vice Chairman / Chairman.')) {
        onClose();
      }
    } else if (actionType === 'REJECT') {
      if (rejectRequest(request.id, comments)) {
        onClose();
      }
    }
  };

  const handleBiometricVerified = (authData) => {
    const finalRemark = `${comments ? comments + ' ' : ''}[✓ Verified via ${authData.method} by ${request.doctorName || activeUser.name}]`;
    approveRequest(request.id, finalRemark);
    setShowBiometricModal(false);
    onClose();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 md:p-8 border border-slate-200 shadow-2xl relative mt-auto sm:my-auto custom-scrollbar text-slate-900">
        
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 md:hidden"></div>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-mono font-extrabold text-sm">
              #{request.requestCode.split('-')[1]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{request.requestCode}</h3>
                {request.isDirectExecutiveGrant && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" /> Direct Executive Grant
                  </span>
                )}
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${
                  isApproved 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : isRejected 
                    ? 'bg-rose-50 text-rose-800 border-rose-200' 
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {request.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">Created: {new Date(request.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                isEditing
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Request'}</span>
            </button>

            {activeUser && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete discount request #${request.requestCode} permanently?`)) {
                    deleteRequest(request.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Delete Request"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Edit Details Form when isEditing is true */}
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateDiscountRequest(request.id, editForm);
              setIsEditing(false);
            }}
            className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 mb-6 space-y-4 text-slate-900"
          >
            <div className="flex items-center justify-between border-b border-blue-200 pb-3">
              <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                Edit Discount Request Details (#{request.requestCode})
              </h4>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                Changes will save & sync across devices
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  value={editForm.patientName}
                  onChange={e => setEditForm(prev => ({ ...prev, patientName: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">OPD / IPD Reg No</label>
                <input
                  type="text"
                  value={editForm.opdIpdNo}
                  onChange={e => setEditForm(prev => ({ ...prev, opdIpdNo: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Total Gross Bill (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={editForm.totalBillAmount}
                  onChange={e => setEditForm(prev => ({ ...prev, totalBillAmount: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Requested Discount %</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={editForm.requestedDiscountVal}
                  onChange={e => setEditForm(prev => ({ ...prev, requestedDiscountVal: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Attending Doctor</label>
                <div className="space-y-1">
                  {(() => {
                    const availableDocs = (doctors || []).filter(d => !isPresetDemoDoctor(d));
                    const matchDoc = availableDocs.find(d => d.trim().toLowerCase() === (editForm.doctorName || '').trim().toLowerCase());
                    const isExistingDoc = Boolean(matchDoc);
                    return (
                      <>
                        <select
                          value={isExistingDoc ? matchDoc : 'CUSTOM'}
                          onChange={e => {
                            const selected = e.target.value;
                            if (selected === 'CUSTOM') {
                              setEditForm(prev => ({ ...prev, doctorName: '' }));
                            } else {
                              setEditForm(prev => ({ ...prev, doctorName: selected, referenceName: selected }));
                            }
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600 truncate"
                        >
                          {availableDocs.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                          <option value="CUSTOM">+ Custom Doctor</option>
                        </select>

                        {(!isExistingDoc || editForm.doctorName === '') && (
                          <input
                            type="text"
                            required
                            placeholder="Type Attending Doctor Name..."
                            value={editForm.doctorName}
                            onChange={e => {
                              const val = e.target.value;
                              setEditForm(prev => ({ ...prev, doctorName: val, referenceName: val }));
                            }}
                            className="w-full bg-white border border-blue-500 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none shadow-sm"
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={editForm.department}
                  onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  {departments?.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Item Particulars</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">Dropdown Menu</span>
                </label>
                <div className="space-y-1">
                  {(() => {
                    const STANDARD_PRESETS = [
                      'Consultation & Clinical Procedure Particulars',
                      'OPD Consultation Charge Waiver',
                      'Spine Surgery Procedure & IPD Room Charge Concession',
                      'Spine MRI Scan & Diagnostic Radiology Waiver',
                      'CT Scan & Advanced Diagnostic Particulars',
                      'X-Ray & Diagnostic Imaging Waiver',
                      'Physiotherapy & Rehabilitation Package Waiver',
                      'Pathology Laboratory & Blood Test Concession',
                      'Emergency Care & ICU Bed Charge Concession',
                      'Pharmacy & Medical Supplies Concession'
                    ];

                    const isKnownPreset = STANDARD_PRESETS.includes(editForm.particulars);
                    const matchedService = (services || []).find(s => editForm.particulars === `${s} Procedure & Charge Waiver`);
                    const isServicePreset = Boolean(matchedService);

                    let currentValue = 'CUSTOM';
                    if (!isCustomParticular) {
                      if (isKnownPreset) currentValue = editForm.particulars;
                      else if (isServicePreset) currentValue = `SVC:${matchedService}`;
                    }

                    return (
                      <>
                        <div className="relative">
                          <select
                            value={
                              STANDARD_PRESETS.includes(editForm.particulars)
                                ? editForm.particulars
                                : (services?.some(s => editForm.particulars?.includes(s))
                                    ? `SVC:${services.find(s => editForm.particulars?.includes(s))}`
                                    : 'CUSTOM')
                            }
                            onChange={e => {
                              const val = e.target.value;
                              if (val === 'CUSTOM') {
                                // Custom text mode
                              } else if (val.startsWith('SVC:')) {
                                const svcName = val.replace('SVC:', '');
                                setEditForm(prev => ({ ...prev, particulars: `${svcName} Procedure & Charge Waiver` }));
                              } else {
                                setEditForm(prev => ({ ...prev, particulars: val }));
                              }
                            }}
                            className="w-full bg-blue-50/90 hover:bg-blue-100/80 border-2 border-blue-400 rounded-xl pl-3 pr-8 py-2 text-xs font-black text-blue-950 focus:outline-none focus:border-blue-600 appearance-none truncate shadow-sm cursor-pointer transition-all"
                          >
                            <option value="CUSTOM">▼ Select Billing Item Particular Dropdown Preset...</option>
                            <optgroup label="Standard Hospital Billing Particulars">
                              {STANDARD_PRESETS.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Hospital Services Directory">
                              {(services || []).map(svc => (
                                <option key={svc} value={`SVC:${svc}`}>{svc} ({svc} Waiver Particulars)</option>
                              ))}
                            </optgroup>
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-700 bg-white p-0.5 rounded border border-blue-300 flex items-center justify-center shadow-sm">
                            <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="e.g. MRI Brain Scan + OPD Consultation Charge Waiver"
                          value={editForm.particulars}
                          onChange={e => setEditForm(prev => ({ ...prev, particulars: e.target.value }))}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 shadow-sm"
                        />
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Billing Service</label>
                <select
                  value={editForm.serviceName}
                  onChange={e => setEditForm(prev => ({ ...prev, serviceName: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  {services?.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Reason / Case Remarks</label>
              <textarea
                rows={2}
                value={editForm.detailedReason}
                onChange={e => setEditForm(prev => ({ ...prev, detailedReason: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-blue-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
              >
                Save Changes & Sync
              </button>
            </div>
          </form>
        ) : null}

        {/* Workflow Progress Stepper Timeline (Billing ➔ CA ➔ CFO ➔ MD/Chairman) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-700 block mb-3">
            Multi-Tier Discount Permission Workflow Timeline
          </span>
          
          <div className="grid grid-cols-4 gap-2 text-center relative">
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0"></div>

            {/* Step 1: Billing Desk */}
            <div className="flex flex-col items-center relative z-10">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                1
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1">Billing Dept</span>
              <span className="text-[9px] text-slate-500">Discount Asked</span>
            </div>

            {/* Step 2: Chief Accountant */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`h-8 w-8 rounded-full font-bold flex items-center justify-center text-xs border ${
                request.status === 'PENDING_CA' 
                  ? 'bg-amber-500 text-white animate-pulse' 
                  : request.approvalChain?.some(c => c.role === 'CHIEF_ACCOUNTANT') || isApproved
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}>
                2
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1">Chief Accountant</span>
              <span className="text-[9px] text-slate-500">Standard Permission</span>
            </div>

            {/* Step 3: CFO */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`h-8 w-8 rounded-full font-bold flex items-center justify-center text-xs border ${
                request.status === 'PENDING_CFO'
                  ? 'bg-amber-500 text-white animate-pulse'
                  : request.approvalChain?.some(c => c.role === 'CFO') || (isApproved && request.requiredAuthorityRole === 'CFO')
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}>
                3
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1">CFO Permission</span>
              <span className="text-[9px] text-slate-500">High Amount</span>
            </div>

            {/* Step 4: MD / Vice Chairman / Chairman */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`h-8 w-8 rounded-full font-bold flex items-center justify-center text-xs border ${
                isApproved 
                  ? 'bg-emerald-600 text-white' 
                  : isRejected 
                  ? 'bg-rose-600 text-white' 
                  : request.status === 'PENDING_EXECUTIVE'
                  ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-200 text-slate-600 border-slate-300'
              }`}>
                4
              </div>
              <span className="text-[11px] font-bold text-slate-800 mt-1">MD / Chairman</span>
              <span className="text-[9px] text-slate-500">Too High Amount</span>
            </div>

          </div>
        </div>

        {/* Patient Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Patient Name</span>
            <span className="font-bold text-sm text-slate-900">{request.patientName}</span>
            <span className="text-xs text-slate-500 block font-mono">ID: {request.patientId}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Age & Gender</span>
            <span className="font-semibold text-sm text-slate-800">{request.patientAge} Yrs / {request.patientGender}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Department & Service</span>
            <span className="font-semibold text-sm text-blue-700">{request.department}</span>
            <span className="text-xs font-semibold text-blue-600 block">{request.serviceName || 'Consultation Fees'}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Attending Doctor</span>
            <span className="font-semibold text-sm text-slate-900">{request.doctorName || request.referenceName || (doctors && doctors[0]) || 'Consulting Doctor'}</span>
          </div>
        </div>

        {/* Official Particulars & Receipt Info Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="font-extrabold uppercase text-slate-500 tracking-wider text-[10px]">
              Receipt & OPD/IPD Tracking Info
            </span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Receipt No: {request.receiptNo || 'RCP-2026-9901'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-bold">OPD / IPD Registration No</span>
              <span className="font-mono font-extrabold text-blue-700">{request.opdIpdNo || 'OPD-8821'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-bold">Bill / Receipt Date</span>
              <span className="font-bold text-slate-900">{request.billDate || '2026-09-11'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-bold">Staff / Doctor Reference</span>
              <span className="font-bold text-slate-900">{request.referenceName || request.doctorName}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-bold">Patient / Relative Name</span>
              <span className="font-bold text-slate-900">{request.relativeName || 'N/A'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 md:col-span-2">
              <span className="text-[10px] text-slate-500 block font-bold">Item Particulars</span>
              <span className="font-semibold text-slate-900">{request.particulars || `${request.serviceName} Procedure Waiver`}</span>
            </div>
          </div>
        </div>

        {/* Financial Numbers Bar */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-center mb-6">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-bold block">Gross Bill Amount</span>
            <span className="text-xl font-black text-slate-900">₹{Number(request.totalBillAmount).toLocaleString('en-IN')}</span>
          </div>

          <div>
            <span className="text-[10px] text-blue-700 uppercase font-bold block">Requested Waiver ({request.requestedDiscountVal}%)</span>
            <span className="text-xl font-black text-blue-700">-₹{Number(request.calculatedDiscountAmount).toLocaleString('en-IN')}</span>
          </div>

          <div>
            <span className="text-[10px] text-emerald-700 uppercase font-bold block">Final Payable at Billing Desk</span>
            <span className="text-xl font-black text-emerald-700">₹{Number(request.finalPayableAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Multi-Tier Approval Chain Audit Trail */}
        {request.approvalChain && request.approvalChain.length > 0 && (
          <div className="mb-6 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
              Permission Approval Chain Audit Log
            </span>

            <div className="space-y-2">
              {request.approvalChain.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      {item.step || idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-200">
                          {item.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{item.comments}</p>
                      <span className="text-[10px] text-slate-500 font-mono">By: {item.actor}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Case Justification */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
          <span className="text-xs font-bold text-blue-700 block mb-1">
            Reason Category: {request.reasonCategory}
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">
            {request.detailedReason}
          </p>
          {request.proofFileName && (
            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Attachment: <strong className="text-slate-900">{request.proofFileName}</strong></span>
              <button 
                onClick={() => alert(`Viewing attachment: ${request.proofFileName}`)}
                className="text-blue-600 hover:underline font-semibold"
              >
                View Proof
              </button>
            </div>
          )}
        </div>

        {/* Interactive Action Control Panel for CA / CFO / MD / Chairman */}
        {isPending && canAction && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Authority Action Panel - Active User: {activeUser.name} ({activeUser.role})
              </h4>
            </div>

            {/* Action Choice Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActionType('APPROVE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                ✓ Grant Permission / Final Approve
              </button>

              {(isBMgr || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setActionType('ESCALATE_CA')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    actionType === 'ESCALATE_CA'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  ➔ Escalate to Chief Accountant
                </button>
              )}

              {(isCA || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setActionType('ESCALATE_CFO')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    actionType === 'ESCALATE_CFO'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  ➔ Escalate to CFO (High Amount)
                </button>
              )}

              {(isCFO || isAdmin) && (
                <button
                  type="button"
                  onClick={() => setActionType('ESCALATE_EXEC')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    actionType === 'ESCALATE_EXEC'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  ➔ Escalate to Executive (MD / Chairman - Too High)
                </button>
              )}

              <button
                type="button"
                onClick={() => setActionType('REJECT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  actionType === 'REJECT'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                ✕ Decline / Reject
              </button>
            </div>

            <textarea
              rows={2}
              placeholder={`Enter official remarks for ${actionType}...`}
              value={comments}
              onChange={e => setComments(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
            />

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={handleExecuteAction}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Fingerprint className="w-4 h-4" />
                Proceed with {actionType}
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReceipt}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-300"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              Print Official Receipt
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
          >
            Close
          </button>
        </div>

      </div>

      {/* Biometric Verification Modal */}
      {showBiometricModal && (
        <DoctorBiometricModal 
          onClose={() => setShowBiometricModal(false)}
          onVerify={handleBiometricVerified}
          doctorName={request.doctorName || activeUser.name}
          patientName={request.patientName}
        />
      )}
    </div>
  );
};
