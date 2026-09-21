import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RequestCard } from './RequestCard';
import { 
  Stethoscope, 
  PlusCircle, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Search, 
  Building, 
  Filter, 
  ShieldCheck,
  UserCheck,
  FileText
} from 'lucide-react';

export const DoctorPortalView = ({ onSelectRequest, onOpenNewModal }) => {
  const { requests, activeUser, createDiscountRequest, triggerToast, doctors } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  const doctorName = activeUser?.name || (doctors && doctors[0]) || 'Hospital Doctor';

  // Filter requests ONLY for this specific doctor's patients
  const doctorRequests = requests.filter(r => {
    const isMyPatient = (
      (r.doctorName && r.doctorName.toLowerCase().includes(doctorName.toLowerCase())) ||
      (r.referenceName && r.referenceName.toLowerCase().includes(doctorName.toLowerCase())) ||
      (r.requestedBy && r.requestedBy.toLowerCase().includes(doctorName.toLowerCase()))
    );

    const matchesSearch = (
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = 
      statusFilter === 'ALL' || 
      r.status === statusFilter || 
      (statusFilter === 'PENDING' && r.status?.startsWith('PENDING'));

    return isMyPatient && matchesSearch && matchesStatus;
  });

  // Doctor's Own Patient KPI Statistics
  const totalPatientRequestsCount = doctorRequests.length;
  const approvedDoctorRequests = doctorRequests.filter(r => r.status === 'APPROVED');
  const pendingDoctorRequests = doctorRequests.filter(r => r.status?.startsWith('PENDING'));
  
  const totalConcessionsAmount = approvedDoctorRequests.reduce(
    (sum, r) => sum + Number(r.calculatedDiscountAmount || 0), 0
  );
  const pendingConcessionsAmount = pendingDoctorRequests.reduce(
    (sum, r) => sum + Number(r.calculatedDiscountAmount || 0), 0
  );

  // Doctor Direct Concession Modal Form State
  const [docFormData, setDocFormData] = useState({
    patientName: '',
    patientId: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    patientAge: '45',
    patientGender: 'Male',
    targetDepartment: 'OPD',
    targetPlace: 'OPD Reception',
    totalBillAmount: '12500',
    discountVal: '15',
    reasonCategory: 'Management Special Grant',
    detailedReason: 'Consultant doctor recommended concession for patient medical treatment.'
  });

  const handleCreateDoctorConcession = (e) => {
    e.preventDefault();
    if (!docFormData.patientName.trim()) {
      triggerToast('Please provide patient name.', 'warning');
      return;
    }

    const payload = {
      patientName: docFormData.patientName.trim(),
      patientId: docFormData.patientId.trim(),
      patientAge: docFormData.patientAge,
      patientGender: docFormData.patientGender,
      department: docFormData.targetDepartment,
      serviceName: docFormData.targetPlace,
      doctorName: doctorName,
      particulars: `Doctor Concession for ${docFormData.targetPlace} (${docFormData.targetDepartment})`,
      totalBillAmount: Number(docFormData.totalBillAmount),
      requestedDiscountType: 'PERCENTAGE',
      requestedDiscountVal: Number(docFormData.discountVal),
      reasonCategory: docFormData.reasonCategory,
      detailedReason: docFormData.detailedReason,
      targetApprovalRole: 'BILLING_MANAGER'
    };

    createDiscountRequest(payload);
    setShowDoctorModal(false);
    setDocFormData({
      patientName: '',
      patientId: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientAge: '45',
      patientGender: 'Male',
      targetDepartment: 'OPD',
      targetPlace: 'OPD Reception',
      totalBillAmount: '12500',
      discountVal: '15',
      reasonCategory: 'Management Special Grant',
      detailedReason: 'Consultant doctor recommended concession for patient medical treatment.'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Doctor Header Banner */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-blue-200 bg-gradient-to-r from-white via-blue-50/60 to-blue-100/40 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Consultant Doctor Portal
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: {activeUser.username || activeUser.id}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
              Welcome, {doctorName}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Viewing own patient discount requests, amounts, and direct concession requests routed to OPD, IPD, Physiotherapy, Rehab & Support.
            </p>
          </div>

          <button
            onClick={() => setShowDoctorModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            + Issue Direct Patient Concession
          </button>
        </div>
      </div>

      {/* Doctor Own Patient Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Patient Count */}
        <div className="glass-card p-5 rounded-2xl border border-emerald-200 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              My Patient Requests Count
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totalPatientRequestsCount} Patients
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
              {approvedDoctorRequests.length} Approved / {pendingDoctorRequests.length} Pending
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Concessions Amount */}
        <div className="glass-card p-5 rounded-2xl border border-blue-200 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              My Total Concessions Granted
            </span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">
              ₹{totalConcessionsAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
              Cumulative Waiver Amount
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Pending Approvals */}
        <div className="glass-card p-5 rounded-2xl border border-amber-200 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              My Pending Concessions
            </span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">
              ₹{pendingConcessionsAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
              {pendingDoctorRequests.length} Requests Awaiting Clearance
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Executive Visibility Seal */}
        <div className="glass-card p-5 rounded-2xl border border-indigo-200 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Executive Board Audit
            </span>
            <span className="text-sm font-extrabold text-indigo-700 mt-1 block">
              Visible to MD & Chairman
            </span>
            <span className="text-[11px] text-indigo-600 font-semibold block mt-0.5">
              Access Granted by Admin
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={`Search ${doctorName}'s patient requests by name, UHID, or code...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-blue-600" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 rounded-xl pl-4 pr-8 py-2 focus:outline-none focus:border-blue-600 w-full max-w-full truncate"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved Concessions</option>
            <option value="REJECTED">Declined Requests</option>
          </select>
        </div>
      </div>

      {/* Doctor's Own Requests Grid */}
      {doctorRequests.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl border border-slate-200 bg-white space-y-3">
          <Stethoscope className="w-12 h-12 text-blue-500/50 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Patient Discount Requests Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not have any patient discount requests matching the selected filters for {doctorName}. Click below to create a direct concession!
          </p>
          <button
            onClick={() => setShowDoctorModal(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20"
          >
            <PlusCircle className="w-4 h-4" /> Issue Patient Concession
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctorRequests.map(req => (
            <RequestCard 
              key={req.id} 
              request={req} 
              onSelect={onSelectRequest} 
            />
          ))}
        </div>
      )}

      {/* Modal for Direct Doctor Concession Creation */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 shadow-2xl relative my-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Direct Doctor Concession Request
                  </h3>
                  <p className="text-xs text-blue-700 font-semibold">{doctorName}</p>
                </div>
              </div>

              <button
                onClick={() => setShowDoctorModal(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoctorConcession} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Shah"
                    value={docFormData.patientName}
                    onChange={e => setDocFormData({ ...docFormData, patientName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UHID / Patient ID</label>
                  <input
                    type="text"
                    placeholder="UHID-2026-8801"
                    value={docFormData.patientId}
                    onChange={e => setDocFormData({ ...docFormData, patientId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-blue-700 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Target Department / Billing Desk Dropdown */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-blue-700 mb-1">
                    Target Department / Place *
                  </label>
                  <select
                    value={docFormData.targetDepartment}
                    onChange={e => setDocFormData({ ...docFormData, targetDepartment: e.target.value })}
                    className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-900 font-bold focus:outline-none focus:border-blue-600"
                  >
                    <option value="OPD">OPD Reception</option>
                    <option value="Clinical Operation">IPD Billing Desk</option>
                    <option value="Advance Modality Center">Physiotherapy (AMC)</option>
                    <option value="Advance Modality Center">Rehab Center (AMC)</option>
                    <option value="Pharmcy">Pharmacy</option>
                    <option value="F&B">F&B / Canteen</option>
                    <option value="Radiology">Radiology (MRI/CT)</option>
                    <option value="Other Support Service">Other Support Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-700 mb-1">
                    Specific Service Place
                  </label>
                  <select
                    value={docFormData.targetPlace}
                    onChange={e => setDocFormData({ ...docFormData, targetPlace: e.target.value })}
                    className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-900 font-bold focus:outline-none focus:border-blue-600"
                  >
                    <option value="OPD Reception">OPD Reception Counter</option>
                    <option value="IPD Billing Desk">IPD Room & Surgery Billing</option>
                    <option value="Physiotherapy">Physiotherapy Session</option>
                    <option value="Rehab">Spine Rehab Concession</option>
                    <option value="Pharmcy">Pharmacy Medicines</option>
                    <option value="MRI">MRI / CT Scan</option>
                    <option value="Consultation Fees">Consultation Fees Waiver</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Bill Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={docFormData.totalBillAmount}
                    onChange={e => setDocFormData({ ...docFormData, totalBillAmount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-700 mb-1">Concession (% Required)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={docFormData.discountVal}
                    onChange={e => setDocFormData({ ...docFormData, discountVal: e.target.value })}
                    className="w-full bg-slate-50 border border-blue-300 rounded-xl px-3.5 py-2 text-xs text-blue-700 font-bold focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical / Concession Reason</label>
                <textarea
                  rows={2}
                  required
                  value={docFormData.detailedReason}
                  onChange={e => setDocFormData({ ...docFormData, detailedReason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  Submit Doctor Concession
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
