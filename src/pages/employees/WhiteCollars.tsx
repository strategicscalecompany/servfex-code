import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MoreVertical,
  X,
  UserCheck,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface WhiteCollarEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: 'HR & Talent' | 'Finance & Accounts' | 'Legal & Compliance' | 'Marketing & Growth' | 'Operations Admin' | 'Executive Office';
  role: string;
  location: string;
  status: 'Active' | 'On Leave' | 'Remote';
  joinedDate: string;
  avatarBg: string;
  reportsTo: string;
}

const INITIAL_WHITE_COLLARS: WhiteCollarEmployee[] = [
  {
    id: 'WC-101',
    name: 'Aditi Sharma',
    email: 'aditi.sharma@servfex.com',
    phone: '+91 98765 43210',
    department: 'HR & Talent',
    role: 'Lead People & Culture Manager',
    location: 'Corporate HQ - Hyderabad',
    status: 'Active',
    joinedDate: '15 Jan 2024',
    avatarBg: 'bg-indigo-600',
    reportsTo: 'Chief Executive Officer',
  },
  {
    id: 'WC-102',
    name: 'Rohit Verma',
    email: 'rohit.v@servfex.com',
    phone: '+91 98111 22334',
    department: 'Finance & Accounts',
    role: 'Senior Financial Controller',
    location: 'Corporate HQ - Hyderabad',
    status: 'Active',
    joinedDate: '01 Mar 2024',
    avatarBg: 'bg-emerald-600',
    reportsTo: 'Head of Finance',
  },
  {
    id: 'WC-103',
    name: 'Pooja Iyer',
    email: 'pooja.iyer@servfex.com',
    phone: '+91 97222 33445',
    department: 'Legal & Compliance',
    role: 'General Legal Counsel & Risk Officer',
    location: 'Corporate HQ - Hyderabad',
    status: 'Active',
    joinedDate: '10 Feb 2024',
    avatarBg: 'bg-amber-600',
    reportsTo: 'Chief Executive Officer',
  },
  {
    id: 'WC-104',
    name: 'Karan Mehra',
    email: 'karan.m@servfex.com',
    phone: '+91 99333 44556',
    department: 'Marketing & Growth',
    role: 'Head of Growth & Partner Acquisition',
    location: 'Regional Office - Bengaluru',
    status: 'Remote',
    joinedDate: '12 Apr 2024',
    avatarBg: 'bg-rose-600',
    reportsTo: 'Chief Marketing Officer',
  },
  {
    id: 'WC-105',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@servfex.com',
    phone: '+91 91444 55667',
    department: 'Operations Admin',
    role: 'Central Operations Coordinator',
    location: 'Corporate HQ - Hyderabad',
    status: 'Active',
    joinedDate: '20 May 2024',
    avatarBg: 'bg-sky-600',
    reportsTo: 'Chief Operating Officer',
  },
  {
    id: 'WC-106',
    name: 'Arjun Nambiar',
    email: 'arjun.n@servfex.com',
    phone: '+91 96555 66778',
    department: 'HR & Talent',
    role: 'Senior Technical Recruiter',
    location: 'Regional Office - Bengaluru',
    status: 'On Leave',
    joinedDate: '08 Aug 2024',
    avatarBg: 'bg-purple-600',
    reportsTo: 'Aditi Sharma',
  },
];

export const WhiteCollars: React.FC = () => {
  const [employees, setEmployees] = useState<WhiteCollarEmployee[]>(INITIAL_WHITE_COLLARS);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStaff, setSelectedStaff] = useState<WhiteCollarEmployee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'HR & Talent' as WhiteCollarEmployee['department'],
    role: '',
    location: 'Corporate HQ - Hyderabad',
    status: 'Active' as WhiteCollarEmployee['status'],
    reportsTo: '',
  });

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      emp.location.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: WhiteCollarEmployee = {
      id: `WC-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      role: formData.role,
      location: formData.location,
      status: formData.status,
      joinedDate: 'Just now',
      avatarBg: 'bg-indigo-600',
      reportsTo: formData.reportsTo || 'Super Admin',
    };

    setEmployees([newEmp, ...employees]);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'HR & Talent',
      role: '',
      location: 'Corporate HQ - Hyderabad',
      status: 'Active',
      reportsTo: '',
    });
  };

  const toggleStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === id) {
          const nextStatus = emp.status === 'Active' ? 'On Leave' : 'Active';
          return { ...emp, status: nextStatus };
        }
        return emp;
      })
    );
    if (selectedStaff && selectedStaff.id === id) {
      setSelectedStaff((prev) => (prev ? { ...prev, status: prev.status === 'Active' ? 'On Leave' : 'Active' } : null));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Briefcase className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">White Collar Staff</h1>
              <p className="text-xs text-slate-500">Corporate HQ, Human Resources, Finance, Legal & Administrative Personnel</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add White Collar Staff</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Corporate Staff</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{employees.length}</div>
          <p className="text-xs text-slate-500 mt-1">Across 6 corporate divisions</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active In Office</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {employees.filter((e) => e.status === 'Active').length}
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">On-premise presence</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Remote / Hybrid</span>
            <UserCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {employees.filter((e) => e.status === 'Remote').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Regional liaison teams</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">On Leave / Vacation</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {employees.filter((e) => e.status === 'On Leave').length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Approved time off</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, corporate email, role title, or office..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-slate-900 outline-none"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="p-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Departments</option>
          <option value="HR & Talent">HR & Talent</option>
          <option value="Finance & Accounts">Finance & Accounts</option>
          <option value="Legal & Compliance">Legal & Compliance</option>
          <option value="Marketing & Growth">Marketing & Growth</option>
          <option value="Operations Admin">Operations Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Remote">Remote</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Office Location</th>
                <th className="py-3.5 px-4">Reports To</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No white-collar personnel found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${emp.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                        >
                          {emp.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{emp.name}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {emp.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block text-xs">{emp.role}</span>
                      <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {emp.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">{emp.reportsTo}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : emp.status === 'Remote'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            emp.status === 'Active'
                              ? 'bg-emerald-500'
                              : emp.status === 'Remote'
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{emp.joinedDate}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStaff(emp)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => toggleStatus(emp.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                        >
                          {emp.status === 'Active' ? 'Set Leave' : 'Set Active'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <Modal
          isOpen={!!selectedStaff}
          onClose={() => setSelectedStaff(null)}
          title={`Corporate Profile: ${selectedStaff.name}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl ${selectedStaff.avatarBg} text-white flex items-center justify-center font-extrabold text-lg`}
                >
                  {selectedStaff.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{selectedStaff.name}</h3>
                  <p className="text-xs text-indigo-600 font-bold">{selectedStaff.role}</p>
                  <span className="text-[11px] text-slate-500">{selectedStaff.department}</span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedStaff.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {selectedStaff.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Direct Phone</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedStaff.phone}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Corporate Email</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {selectedStaff.email}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Assigned Base</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {selectedStaff.location}
                </span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Reporting Line</span>
                <span className="font-bold text-slate-800">{selectedStaff.reportsTo}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-bold uppercase tracking-wider text-slate-500 block">Governance & Access Rights</span>
              <p className="text-slate-600">
                Authorized for Corporate HQ management, Super Admin employee directories, and departmental audits.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedStaff(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => toggleStatus(selectedStaff.id)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
              >
                Toggle {selectedStaff.status === 'Active' ? 'On Leave' : 'Active'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add White Collar Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register White Collar Staff" maxWidth="lg">
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Vikram Singhania"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. vikram.s@servfex.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98000 00000"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              >
                <option value="HR & Talent">HR & Talent</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="Legal & Compliance">Legal & Compliance</option>
                <option value="Marketing & Growth">Marketing & Growth</option>
                <option value="Operations Admin">Operations Admin</option>
                <option value="Executive Office">Executive Office</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Role / Designation</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Senior Compensation Analyst"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Office Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Corporate HQ - Hyderabad"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Reporting Line</label>
              <input
                type="text"
                value={formData.reportsTo}
                onChange={(e) => setFormData({ ...formData, reportsTo: e.target.value })}
                placeholder="e.g. Aditi Sharma (HR Lead)"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              >
                <option value="Active">Active</option>
                <option value="Remote">Remote</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
            >
              Create Staff Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
