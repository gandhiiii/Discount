import React, { useState } from 'react';
import { useApp, isPresetDemoDoctor } from '../context/AppContext';
import { 
  FileText, 
  User, 
  IndianRupee, 
  Percent, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck,
  UploadCloud, 
  CheckCircle,
  Building,
  Stethoscope,
  Sparkles,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

export const NewDiscountModal = ({ onClose }) => {
  const { createDiscountRequest, createDirectExecutiveGrant, getRequiredAuthorityForDiscount, activeUser, users, departments, services, doctors, getDepartmentForService } = useApp();

  const isExecutive = ['CHAIRMAN', 'VICE_CHAIRMAN', 'MD'].includes(activeUser?.role);
  const [isDirectGrantMode, setIsDirectGrantMode] = useState(isExecutive);

  const defaultService = (services && services[0]) || 'Consultation Fees';
  const defaultDept = getDepartmentForService ? getDepartmentForService(defaultService) : (departments[0] || 'OPD');
  const defaultDoc = (doctors && doctors[0]) || '';

  const [formData, setFormData] = useState({
    patientId: 'PT-' + Math.floor(10000 + Math.random() * 90000),
    patientName: '',
    patientAge: 45,
    patientGender: 'Male',
    department: defaultDept,
    serviceName: defaultService,
    doctorName: defaultDoc,
    receiptNo: 'RCP-' + Math.floor(10000 + Math.random() * 90000),
    billDate: new Date().toISOString().split('T')[0],
    opdIpdNo: 'OPD-' + Math.floor(1000 + Math.random() * 9000),
    referenceName: defaultDoc,
    relativeName: '',
    particulars: 'Consultation & Clinical Procedure Particulars',
    totalBillAmount: 25000,
    requestedDiscountType: 'PERCENTAGE',
    requestedDiscountVal: 20,
    targetApprovalRole: 'CFO',
    reasonCategory: 'Below Poverty Line / Emergency Charity',
    detailedReason: '',
    proofFileName: ''
  });

  const [isCustomParticular, setIsCustomParticular] = useState(false);

  // Sync default doctor when doctors array updates asynchronously
  React.useEffect(() => {
    const availableDocs = (doctors || []).filter(d => !isPresetDemoDoctor(d));
    if (availableDocs.length > 0) {
      setFormData(prev => {
        if (!prev.doctorName || isPresetDemoDoctor(prev.doctorName) || !availableDocs.includes(prev.doctorName)) {
          const firstDoc = availableDocs[0];
          return {
            ...prev,
            doctorName: firstDoc,
            referenceName: (!prev.referenceName || isPresetDemoDoctor(prev.referenceName)) ? firstDoc : prev.referenceName
          };
        }
        return prev;
      });
    }
  }, [doctors]);

  // Calculate live financials
  const bill = Number(formData.totalBillAmount) || 0;
  let discountVal = Number(formData.requestedDiscountVal) || 0;
  let calculatedDiscount = 0;

  if (formData.requestedDiscountType === 'FIXED') {
    calculatedDiscount = discountVal;
    discountVal = bill > 0 ? Number(((calculatedDiscount / bill) * 100).toFixed(1)) : 0;
  } else {
    calculatedDiscount = Number(((bill * discountVal) / 100).toFixed(2));
  }

  const netPayable = Math.max(0, bill - calculatedDiscount);

  // Determine required authority level & target user
  const authorityTarget = getRequiredAuthorityForDiscount(discountVal, calculatedDiscount, formData.targetApprovalRole);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.detailedReason) return;

    if (isDirectGrantMode && isExecutive) {
      createDirectExecutiveGrant({
        ...formData,
        requestedDiscountVal: discountVal,
        calculatedDiscountAmount: calculatedDiscount,
        finalPayableAmount: netPayable
      });
    } else {
      createDiscountRequest({
        ...formData,
        requestedDiscountVal: discountVal,
        calculatedDiscountAmount: calculatedDiscount,
        finalPayableAmount: netPayable
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 md:p-8 border border-slate-200 shadow-2xl relative mt-auto sm:my-auto custom-scrollbar">
        
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 md:hidden"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {isDirectGrantMode ? 'Issue Direct Executive Discount to Patient' : 'Submit Discount Permission Request'}
              </h3>
              <p className="text-xs text-slate-500">
                {isDirectGrantMode 
                  ? 'Directly grants discount to patient with CFO & Chief Accountant assistance (Immediately active on Billing Desk)'
                  : 'Submitted at payment time ➔ Chief Accountant permission ➔ CFO (if High) ➔ MD/Chairman (if Too High)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Executive Direct Mode Switcher if user is Executive */}
        {isExecutive && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-900 block">Executive Board Action</span>
                <span className="text-[11px] text-amber-700">Logged in as {activeUser.name} ({activeUser.role})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDirectGrantMode(!isDirectGrantMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                isDirectGrantMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              {isDirectGrantMode ? 'Direct Executive Grant Active' : 'Switch to Standard Billing Request'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Patient Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient ID</label>
              <input
                type="text"
                required
                value={formData.patientId}
                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Robert Chen"
                value={formData.patientName}
                onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min="0"
                max="120"
                value={formData.patientAge}
                onChange={e => setFormData({ ...formData, patientAge: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 min-w-0 box-border"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.patientGender}
                onChange={e => setFormData({ ...formData, patientGender: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 min-w-0 box-border"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 min-w-0 box-border"
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-blue-700 mb-1 flex items-center justify-between">
                <span>Hospital Service</span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Required</span>
              </label>
              <div className="space-y-1.5">
                {(() => {
                  const matchSvc = (services || []).find(s => s.trim().toLowerCase() === (formData.serviceName || '').trim().toLowerCase());
                  const isExistingSvc = Boolean(matchSvc);
                  return (
                    <>
                      <div className="relative">
                        <select
                          value={isExistingSvc ? matchSvc : 'CUSTOM'}
                          onChange={e => {
                            const selected = e.target.value;
                            if (selected === 'CUSTOM') {
                              setFormData({ ...formData, serviceName: '' });
                            } else {
                              const mappedDept = getDepartmentForService ? getDepartmentForService(selected) : formData.department;
                              setFormData(prev => ({
                                ...prev,
                                serviceName: selected,
                                department: mappedDept,
                                particulars: prev.particulars?.includes('Particulars') || prev.particulars?.includes('Waiver') || !prev.particulars
                                  ? `${selected} Procedure & Charge Waiver`
                                  : prev.particulars
                              }));
                            }
                          }}
                          className="w-full bg-blue-50/80 hover:bg-blue-100/60 border-2 border-blue-400 rounded-xl pl-3.5 pr-10 py-2 text-sm text-blue-950 font-black focus:outline-none focus:border-blue-600 appearance-none min-w-0 box-border truncate shadow-sm cursor-pointer transition-all"
                        >
                          <optgroup label="Standard Hospital Services">
                            {(services || []).map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </optgroup>
                          <option value="CUSTOM">+ Custom Hospital Service...</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-700 bg-white p-1 rounded-md border border-blue-300 flex items-center justify-center shadow-sm">
                          <ChevronDown className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>

                      {(!isExistingSvc || formData.serviceName === '') && (
                        <input
                          type="text"
                          required
                          placeholder="Type Custom Hospital Service Name..."
                          value={formData.serviceName}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              serviceName: val,
                              particulars: prev.particulars?.includes('Waiver') || !prev.particulars
                                ? `${val || 'Custom Service'} Procedure Waiver`
                                : prev.particulars
                            }));
                          }}
                          className="w-full bg-white border border-blue-500 rounded-xl px-3 py-1.5 text-xs text-blue-900 font-semibold focus:outline-none shadow-sm min-w-0 box-border"
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="col-span-2 md:col-span-1 min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Doctor</label>
              <div className="space-y-1.5">
                {(() => {
                  const availableDocs = (doctors || []).filter(d => !isPresetDemoDoctor(d));
                  const matchDoc = availableDocs.find(d => d.trim().toLowerCase() === (formData.doctorName || '').trim().toLowerCase());
                  const isExistingDoc = Boolean(matchDoc);
                  return (
                    <>
                      <select
                        value={isExistingDoc ? matchDoc : 'CUSTOM'}
                        onChange={e => {
                          const selected = e.target.value;
                          if (selected === 'CUSTOM') {
                            setFormData({ ...formData, doctorName: '', referenceName: '' });
                          } else {
                            setFormData({ ...formData, doctorName: selected, referenceName: selected });
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium min-w-0 box-border truncate"
                      >
                        {availableDocs.map(doc => (
                          <option key={doc} value={doc}>{doc}</option>
                        ))}
                        <option value="CUSTOM">+ Custom Doctor</option>
                      </select>

                      {(!isExistingDoc || formData.doctorName === '') && (
                        <input
                          type="text"
                          required
                          placeholder="Type Doctor Name..."
                          value={formData.doctorName}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData({ ...formData, doctorName: val, referenceName: val });
                          }}
                          className="w-full bg-white border border-blue-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none shadow-sm min-w-0 box-border"
                        />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Billing Receipt & Registration Particulars Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Receipt Particulars & Patient Reference Info
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RCP-2026-9042"
                  value={formData.receiptNo}
                  onChange={e => setFormData({ ...formData, receiptNo: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-mono min-w-0 box-border"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Date / Receipt Date</label>
                <input
                  type="date"
                  required
                  value={formData.billDate}
                  onChange={e => setFormData({ ...formData, billDate: e.target.value })}
                  className="w-full max-w-full min-w-0 box-border bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 appearance-none"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">OPD / IPD No</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OPD-88210 / IPD-4412"
                  value={formData.opdIpdNo}
                  onChange={e => setFormData({ ...formData, opdIpdNo: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-mono min-w-0 box-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Staff / Doctor / Reference Name</label>
                <input
                  type="text"
                  placeholder="e.g. Attending Doctor / Staff Reference"
                  value={formData.referenceName}
                  onChange={e => setFormData({ ...formData, referenceName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 min-w-0 box-border"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name / Relative Name</label>
                <input
                  type="text"
                  placeholder="e.g. Robert Chen (Father: James Chen)"
                  value={formData.relativeName}
                  onChange={e => setFormData({ ...formData, relativeName: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 min-w-0 box-border"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Particulars (Billing Item Particulars)</span>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-extrabold flex items-center gap-1">
                  <span>Dropdown Menu</span>
                  <ChevronDown className="w-3 h-3 text-blue-600 stroke-[3]" />
                </span>
              </label>
              <div className="space-y-2">
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

                  return (
                    <>
                      <div className="relative">
                        <select
                          value={
                            STANDARD_PRESETS.includes(formData.particulars)
                              ? formData.particulars
                              : (services?.some(s => formData.particulars?.includes(s))
                                  ? `SVC:${services.find(s => formData.particulars?.includes(s))}`
                                  : 'CUSTOM')
                          }
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              // Custom text mode
                            } else if (val.startsWith('SVC:')) {
                              const svcName = val.replace('SVC:', '');
                              setFormData(prev => ({ ...prev, particulars: `${svcName} Procedure & Charge Waiver` }));
                            } else {
                              setFormData(prev => ({ ...prev, particulars: val }));
                            }
                          }}
                          className="w-full bg-blue-50/90 hover:bg-blue-100/80 border-2 border-blue-400 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-blue-950 font-black focus:outline-none focus:border-blue-600 appearance-none min-w-0 box-border truncate shadow-sm cursor-pointer transition-all"
                        >
                          <option value="CUSTOM">▼ Select Billing Item Particular Dropdown Preset...</option>
                          <optgroup label="Standard Hospital Billing Particulars">
                            {STANDARD_PRESETS.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Hospital Services Particulars Directory">
                            {(services || []).map(svc => (
                              <option key={svc} value={`SVC:${svc}`}>{svc} ({svc} Waiver Particulars)</option>
                            ))}
                          </optgroup>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-700 bg-white p-1 rounded-md border border-blue-300 flex items-center justify-center shadow-sm">
                          <ChevronDown className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Type or edit particular details (e.g. MRI Brain Scan Waiver)..."
                        value={formData.particulars}
                        onChange={e => setFormData(prev => ({ ...prev, particulars: e.target.value }))}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-blue-600 min-w-0 box-border shadow-sm"
                      />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Financials & Discount Calculator */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-blue-600" />
              Bill Payment & Discount Waiver Calculation (INR ₹)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Bill Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.totalBillAmount}
                  onChange={e => setFormData({ ...formData, totalBillAmount: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Mode</label>
                <select
                  value={formData.requestedDiscountType}
                  onChange={e => setFormData({ ...formData, requestedDiscountType: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-700 mb-1">
                  {formData.requestedDiscountType === 'PERCENTAGE' ? 'Requested Discount (%)' : 'Requested Discount (₹)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={formData.requestedDiscountType === 'PERCENTAGE' ? 100 : bill}
                  required
                  value={formData.requestedDiscountVal}
                  onChange={e => setFormData({ ...formData, requestedDiscountVal: e.target.value })}
                  className="w-full bg-white border border-blue-300 rounded-xl px-3.5 py-2 text-sm font-extrabold text-blue-700 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Quick Discount Matrix Select Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Discount Matrix Preset Tiers:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        requestedDiscountType: 'PERCENTAGE',
                        requestedDiscountVal: pct
                      });
                    }}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                      Number(formData.requestedDiscountVal) === pct && formData.requestedDiscountType === 'PERCENTAGE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 scale-[1.02]'
                        : 'bg-white text-blue-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <span>{pct}%</span>
                    <span className="text-[9px] opacity-75 font-normal">
                      {pct === 10 ? '(Routine)' : pct === 25 ? '(Staff/Doc)' : pct === 50 ? '(Hardship)' : '(100% BPL)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Breakdown Display */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-white border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Gross Patient Bill</span>
                <span className="text-sm font-extrabold text-slate-900">₹{bill.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-600 uppercase font-bold block">Calculated Waiver</span>
                <span className="text-sm font-extrabold text-blue-600">-₹{calculatedDiscount.toLocaleString('en-IN')} ({discountVal}%)</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 uppercase font-bold block">Final Payable at Billing</span>
                <span className="text-sm font-extrabold text-emerald-700">₹{netPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Target Approval Authority Selector & Dynamic Visualizer */}
          {!isDirectGrantMode && (
            <div className="p-4.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Target Approval Authority</span>
                  </label>
                  <p className="text-[11px] text-slate-600">
                    Select required approver or let system calculate based on waiver amount
                  </p>
                </div>

                <select
                  value={formData.targetApprovalRole}
                  onChange={e => setFormData({ ...formData, targetApprovalRole: e.target.value })}
                  className="bg-white border border-indigo-300 text-indigo-900 font-extrabold rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="BILLING_MANAGER">Finance Manager (Up to ₹25,000/-)</option>
                  <option value="CFO">CFO (Above ₹25,000/- to ₹2,00,000/-)</option>
                  <option value="MD">MD / Vice Chairman / Chairman / Director (Above ₹2,00,000/-)</option>
                </select>
              </div>

              {/* Stepper Preview */}
              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-indigo-200 font-semibold text-slate-700">
                <div className={`flex items-center gap-1.5 ${authorityTarget.role === 'BILLING_MANAGER' ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                  <span className={`h-5 w-5 rounded-full font-bold flex items-center justify-center text-[10px] ${authorityTarget.role === 'BILLING_MANAGER' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
                  <span>Finance Manager</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                
                <div className={`flex items-center gap-1.5 ${authorityTarget.role === 'CHIEF_ACCOUNTANT' ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                  <span className={`h-5 w-5 rounded-full font-bold flex items-center justify-center text-[10px] ${authorityTarget.role === 'CHIEF_ACCOUNTANT' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                  <span>Chief Accountant</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                <div className={`flex items-center gap-1.5 ${authorityTarget.role === 'CFO' ? 'text-amber-800 font-bold' : 'text-slate-500'}`}>
                  <span className={`h-5 w-5 rounded-full font-bold flex items-center justify-center text-[10px] ${authorityTarget.role === 'CFO' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                  <span>CFO</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                <div className={`flex items-center gap-1.5 ${['MD', 'DIRECTOR', 'EXECUTIVE'].includes(authorityTarget.role) ? 'text-rose-700 font-extrabold' : 'text-slate-500'}`}>
                  <span className={`h-5 w-5 rounded-full font-bold flex items-center justify-center text-[10px] ${['MD', 'DIRECTOR', 'EXECUTIVE'].includes(authorityTarget.role) ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-600'}`}>4</span>
                  <span>Director / MD</span>
                </div>
              </div>
            </div>
          )}

          {/* Justification & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason Category</label>
              <select
                value={formData.reasonCategory}
                onChange={e => setFormData({ ...formData, reasonCategory: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Below Poverty Line / Emergency Charity">Below Poverty Line / Emergency Charity</option>
                <option value="Staff / Relative Welfare">Staff / Relative Welfare</option>
                <option value="Management Special Grant">Management Special Grant</option>
                <option value="Package Adjustment / Routine">Package Adjustment / Routine</option>
                <option value="Disputed Billing Correction">Disputed Billing Correction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attach Proof / Order Document</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. BPL_Verification_Card.pdf"
                  value={formData.proofFileName}
                  onChange={e => setFormData({ ...formData, proofFileName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <UploadCloud className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Case Justification & Notes (Mandatory)
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide detailed reasons for asking discount during patient payment time..."
              value={formData.detailedReason}
              onChange={e => setFormData({ ...formData, detailedReason: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-white font-black text-sm shadow-md transition-all active:scale-95 ${
                isDirectGrantMode
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              {isDirectGrantMode ? 'Grant Executive Discount Directly to Patient' : 'Dispatch Permission Request'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
