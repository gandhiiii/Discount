import React, { useState } from 'react';
import { useApp, isPresetDemoDoctor } from '../context/AppContext';
import { 
  UserPlus, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Percent, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  UserCircle,
  AlertCircle,
  Building,
  Info,
  Sparkles,
  Stethoscope
} from 'lucide-react';

export const AdminUserManagement = () => {
  const { 
    users, 
    addUser, 
    updateUser, 
    deleteUser, 
    activeUser, 
    setActiveUser,
    departments,
    addDepartment,
    deleteDepartment,
    services,
    addService,
    deleteService,
    getDepartmentForService,
    doctors,
    addDoctor,
    deleteDoctor,
    clearAllDoctors,
    getRoleMeta
  } = useApp();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');

  const [editingDesignationId, setEditingDesignationId] = useState(null);
  const [editingDesignationText, setEditingDesignationText] = useState('');

  const isAdmin = activeUser?.role === 'ADMIN';

  // New user form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'CHIEF_ACCOUNTANT',
    designation: '',
    department: 'Billing & Accounts / Finance',
    email: '',
    phone: ''
  });

  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [showFormPassword, setShowFormPassword] = useState(false);

  const toggleCardPassword = (userId) => {
    setShowPasswordMap(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleNameChange = (nameVal) => {
    const autoUsername = nameVal.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    setFormData(prev => ({
      ...prev,
      name: nameVal,
      username: prev.username || autoUsername,
      email: prev.email || (autoUsername ? `${autoUsername}@carepulse.com` : ''),
      phone: prev.phone || '+1 (555) 000-1122'
    }));
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      triggerToast('Please provide a name for the new user.', 'warning');
      return;
    }

    const cleanName = formData.name.trim();
    const autoUsername = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const username = (formData.username && formData.username.trim()) ? formData.username.trim() : autoUsername;
    const password = (formData.password && formData.password.trim()) ? formData.password.trim() : 'Pass@123';
    const designation = (formData.designation && formData.designation.trim()) ? formData.designation.trim() : (formData.role || 'Staff');
    const email = (formData.email && formData.email.trim()) ? formData.email.trim() : `${username}@carepulse.com`;
    const phone = (formData.phone && formData.phone.trim()) ? formData.phone.trim() : '+1 (555) 000-1122';

    const userPayload = {
      name: cleanName,
      username,
      password,
      role: formData.role || 'CHIEF_ACCOUNTANT',
      designation,
      department: formData.department || 'Billing & Accounts',
      email,
      phone
    };

    if (editingUserId) {
      updateUser(editingUserId, userPayload);
      setEditingUserId(null);
    } else {
      addUser(userPayload);
    }

    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'CHIEF_ACCOUNTANT',
      designation: '',
      department: 'Billing & Accounts',
      email: '',
      phone: ''
    });
    setShowAddModal(false);
  };

  const handleEdit = (user) => {
    setFormData({
      username: user.username || '',
      password: user.password || '',
      name: user.name,
      role: user.role,
      designation: user.designation,
      department: user.department,
      email: user.email,
      phone: user.phone
    });
    setEditingUserId(user.id);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* Top Banner Notice */}
      <div className="glass-card p-6 rounded-2xl border border-blue-200 bg-white relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-slate-900">Multi-Tier Role Hierarchy & Department Control</h2>
            </div>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl font-medium">
              Configure Chief Accountant, CFO, MD, Vice Chairman, Chairman, and Billing Department users for permission routing.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingUserId(null);
              setFormData({
                username: '',
                password: '',
                name: '',
                role: 'CHIEF_ACCOUNTANT',
                designation: '',
                department: departments[0] || 'Billing & Accounts',
                email: '',
                phone: ''
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all active:scale-95 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Create Authority User
          </button>
        </div>
      </div>

      {/* Visual Role Hierarchy Card */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">Hospital Billing & Discount Role Hierarchy Structure</h3>
          </div>
          <span className="text-xs text-blue-700 font-mono font-bold">6-Tier Multi-Level Workflow</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-blue-800">Tier 1 Approval</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 font-extrabold">Up to ₹25,000/-</span>
              </div>
              <p className="font-extrabold text-sm text-slate-900 mt-2">FINANCE MANAGER</p>
              <p className="text-xs text-blue-700 font-semibold">Finance Manager / Chief Accountant Desk</p>
            </div>
            <p className="text-xs text-slate-600 border-t border-blue-200/80 pt-2 font-medium">All Department requests up to ₹25,000/- routed for approval</p>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-purple-800">Tier 2 Approval</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 font-extrabold">₹25,000/- to ₹2,00,000/-</span>
              </div>
              <p className="font-extrabold text-sm text-slate-900 mt-2">CFO</p>
              <p className="text-xs text-purple-700 font-semibold">Chief Financial Officer (CFO)</p>
            </div>
            <p className="text-xs text-slate-600 border-t border-purple-200/80 pt-2 font-medium">All Department requests above ₹25,000/- to ₹2,00,000/-</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold text-amber-800">Tier 3 Executive</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-extrabold">Above ₹2,00,000/-</span>
              </div>
              <p className="font-extrabold text-sm text-slate-900 mt-2">MD / VICE CHAIRMAN / CHAIRMAN / DIRECTOR</p>
              <p className="text-xs text-amber-700 font-semibold">Executive Management Board</p>
            </div>
            <p className="text-xs text-slate-600 border-t border-amber-200/80 pt-2 font-medium">All Department requests exceeding ₹2,00,000/- & Direct Grants</p>
          </div>
        </div>
      </div>

      {/* Admin Department Control Box */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">Hospital Departments Directory</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono font-medium">{departments.length} Departments Active</span>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (newDeptName.trim()) {
              addDepartment(newDeptName);
              setNewDeptName('');
            }
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            required
            placeholder="Type new department name (e.g. Cardiology, Neurosurgery, ICU)..."
            value={newDeptName}
            onChange={e => setNewDeptName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition-all"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all active:scale-95"
          >
            + Add Department
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {departments.map((dept) => (
            <div 
              key={dept}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
            >
              <span>{dept}</span>
              <button
                type="button"
                onClick={() => deleteDepartment(dept)}
                className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                title="Remove Department"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Hospital Services Control Box */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-base text-slate-900">Hospital Billing Services Directory</h3>
          </div>
          <span className="text-xs text-blue-700 font-mono font-semibold">{services.length} Services Configured</span>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (newServiceName.trim()) {
              addService(newServiceName);
              setNewServiceName('');
            }
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            required
            placeholder="Type new service name (e.g. Consultation Fees, Pathology, MRI, Open MRI, Pharmacy, IPD)..."
            value={newServiceName}
            onChange={e => setNewServiceName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition-all"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all active:scale-95"
          >
            + Add Service
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {services.map((srv) => (
            <div 
              key={srv}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs font-semibold text-blue-900"
            >
              <span>{srv}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-normal">
                {getDepartmentForService ? getDepartmentForService(srv) : 'General'}
              </span>
              <button
                type="button"
                onClick={() => deleteService(srv)}
                className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                title="Remove Service"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Hospital Doctors Control Box */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Hospital Doctors Directory</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-700 font-mono font-semibold">{doctors?.length || 0} Attending Doctors</span>
            {doctors && doctors.length > 0 && (
              <button
                type="button"
                onClick={clearAllDoctors}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-all"
              >
                Clear All Preset Doctors
              </button>
            )}
          </div>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (newDoctorName.trim()) {
              addDoctor(newDoctorName);
              setNewDoctorName('');
            }
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            required
            placeholder="Type new doctor name (e.g. Dr. John Smith)..."
            value={newDoctorName}
            onChange={e => setNewDoctorName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition-all"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all active:scale-95"
          >
            + Add Doctor
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {doctors?.filter(doc => !isPresetDemoDoctor(doc)).map((doc) => (
            <div 
              key={doc}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs font-semibold text-emerald-900"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              <span>{doc}</span>
              <button
                type="button"
                onClick={() => deleteDoctor(doc)}
                className="text-slate-400 hover:text-rose-600 text-xs font-bold ml-1"
                title="Remove Doctor"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Approval Procedure Financial Threshold Reference Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Hospital Approval Procedure Financial Limits
          </h3>
          <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
            Official Routing Limits
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-center space-y-1">
            <span className="text-xs text-slate-600 font-bold block uppercase tracking-wide">Tier 1 Approval</span>
            <span className="text-lg font-extrabold text-blue-700 block">Up to ₹10,000/-</span>
            <span className="text-xs text-blue-800 font-semibold block">Trf to Finance Manager</span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center space-y-1">
            <span className="text-xs text-slate-600 font-bold block uppercase tracking-wide">Tier 2 Approval</span>
            <span className="text-lg font-extrabold text-amber-700 block">Above ₹10,000/- - ₹2,00,000/-</span>
            <span className="text-xs text-amber-800 font-semibold block">Trf to CFO</span>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 text-center space-y-1">
            <span className="text-xs text-slate-600 font-bold block uppercase tracking-wide">Tier 3 Approval</span>
            <span className="text-lg font-extrabold text-rose-700 block">Above ₹2,00,000/-</span>
            <span className="text-xs text-rose-800 font-semibold block">Director (Managing Director)</span>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.filter(u => u && u.active !== false && u.role !== 'DELETED' && !isPresetDemoUser(u)).map(user => {
          return (
            <div 
              key={user.id} 
              className={`glass-card p-5 rounded-2xl bg-white border relative transition-all duration-200 hover:border-blue-400 shadow-sm ${
                user.id === activeUser.id ? 'ring-2 ring-blue-600 border-blue-400' : 'border-slate-200'
              }`}
            >
              {user.id === activeUser.id && (
                <span className="absolute top-4 right-4 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-sm">
                  Logged In As
                </span>
              )}

              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-blue-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 truncate">{user.name}</h3>
                  
                  {editingDesignationId === user.id ? (
                    <div className="mt-1 flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={editingDesignationText}
                        onChange={e => setEditingDesignationText(e.target.value)}
                        onBlur={() => {
                          if (editingDesignationText.trim()) {
                            updateUser(user.id, { designation: editingDesignationText.trim() });
                          }
                          setEditingDesignationId(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            if (editingDesignationText.trim()) {
                              updateUser(user.id, { designation: editingDesignationText.trim() });
                            }
                            setEditingDesignationId(null);
                          }
                        }}
                        className="bg-white border border-blue-600 rounded px-2 py-0.5 text-xs text-blue-800 font-bold focus:outline-none w-full"
                      />
                    </div>
                  ) : (
                    <p 
                      onClick={() => {
                        if (isAdmin) {
                          setEditingDesignationId(user.id);
                          setEditingDesignationText(user.designation || '');
                        }
                      }}
                      className="text-xs text-slate-500 font-medium hover:text-blue-700 cursor-pointer flex items-center gap-1 group/desig"
                      title="Click to edit Designation"
                    >
                      <span className="truncate">{user.designation || 'Click to set Designation'}</span>
                      <Edit3 className="w-3 h-3 opacity-0 group-hover/desig:opacity-100 text-blue-600 flex-shrink-0" />
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getRoleMeta(user.role).color}`}>
                      {user.role} ({getRoleMeta(user.role).tier})
                    </span>

                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      {user.department}
                    </span>
                  </div>
                </div>
              </div>

              {/* Login Credentials Strip (Admin Viewable) */}
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">User ID / Username:</span>
                  <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {user.username || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {showPasswordMap[user.id] ? user.password || 'Pass@123' : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCardPassword(user.id)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold ml-1"
                    >
                      {showPasswordMap[user.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Info for Notifications */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Edit Limits & Profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {user.role !== 'ADMIN' && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove authority user "${user.name}" (${user.username || user.role}) from the directory permanently?`)) {
                        deleteUser(user.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors flex items-center gap-1 text-xs font-bold px-2 py-1"
                    title="Delete User"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Adding / Editing Authority User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl relative text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  {editingUserId ? 'Edit Authority Profile' : 'Create Authority User'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert Hoffman"
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1">User ID / Username</label>
                  <input
                    type="text"
                    placeholder="e.g. ca_robert (auto-generated if empty)"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3.5 py-2 text-sm text-blue-900 font-mono focus:outline-none focus:border-blue-600 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Password</label>
                <div className="relative">
                  <input
                    type={showFormPassword ? "text" : "password"}
                    placeholder="Enter password (default: Pass@123)"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-20 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-600 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3 top-2.5 text-xs text-blue-600 hover:text-blue-800 font-bold"
                  >
                    {showFormPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Chief Accountant"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role Hierarchy</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition-all"
                  >
                    <option value="DOCTOR">DOCTOR (Attending Doctor Signatory & Confirmation)</option>
                    <option value="BILLING_CLERK">BILLING_CLERK (Junior Billing Person)</option>
                    <option value="RECEPTIONIST">RECEPTIONIST (Senior Billing Officer)</option>
                    <option value="ACCOUNTANT">ACCOUNTANT / ACCOUNTS OFFICER (Accounts Department)</option>
                    <option value="CHIEF_ACCOUNTANT">CHIEF_ACCOUNTANT (Chief Accountant - Up to ₹25,000/-)</option>
                    <option value="BILLING_MANAGER">BILLING_MANAGER (Finance Manager - Up to ₹25,000/-)</option>
                    <option value="CFO">CFO (Chief Financial Officer - Above ₹25,000/- to ₹2,00,000/-)</option>
                    <option value="MD">MD / DIRECTOR (Managing Director - Above ₹2,00,000/-)</option>
                    <option value="VICE_CHAIRMAN">VICE_CHAIRMAN (Executive Board)</option>
                    <option value="CHAIRMAN">CHAIRMAN (Hospital Chairman)</option>
                    <option value="ADMIN">ADMIN (System Administrator)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition-all"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone (For SMS)</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 (555) 000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. official@hospital.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-600 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  {editingUserId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
