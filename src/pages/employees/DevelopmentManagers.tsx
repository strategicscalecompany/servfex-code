import React, { useState } from 'react';
import {
  Code2,
  Search,
  Plus,
  GitBranch,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  Laptop,
  Eye,
  GitPullRequest,
  Server,
  Smartphone,
  Globe,
  Shield,
  Activity,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

interface DevelopmentManager {
  id: string;
  name: string;
  email: string;
  domain: 'Core Backend & APIs' | 'Customer Android App' | 'Partner / Vendor App' | 'Super Admin Web' | 'Cloud & DevOps' | 'QA & Security';
  title: string;
  repositories: string[];
  teamSize: number;
  currentSprint: string;
  status: 'In Sprint' | 'Code Review' | 'Release Staging';
  healthScore: number;
  githubHandle: string;
}

const INITIAL_DEV_MANAGERS: DevelopmentManager[] = [
  {
    id: 'DM-501',
    name: 'Vikas Rao',
    email: 'vikas.rao@servfex.com',
    domain: 'Core Backend & APIs',
    title: 'Lead Distributed Systems Architect',
    repositories: ['servfex-be-core', 'servfex-realtime-gateway', 'prisma-db-engine'],
    teamSize: 8,
    currentSprint: 'Sprint 26 - Instant Payouts Engine',
    status: 'In Sprint',
    healthScore: 99,
    githubHandle: '@vikas-servfex',
  },
  {
    id: 'DM-502',
    name: 'Ananya Deshmukh',
    email: 'ananya.d@servfex.com',
    domain: 'Customer Android App',
    title: 'Staff Android Engineer & Tech Lead',
    repositories: ['servfex-customer-android', 'compose-design-system'],
    teamSize: 6,
    currentSprint: 'Sprint 14 - QR Flow & Live Map Tracking',
    status: 'Release Staging',
    healthScore: 98,
    githubHandle: '@ananya-droid',
  },
  {
    id: 'DM-503',
    name: 'Gautam Singhal',
    email: 'gautam.s@servfex.com',
    domain: 'Partner / Vendor App',
    title: 'Staff Mobile Engineer (Vendor / Fleet)',
    repositories: ['scrvfex-vendor-android', 'osmdroid-navigation-sdk'],
    teamSize: 5,
    currentSprint: 'Sprint 11 - Offline Cache & Job Dispatcher',
    status: 'In Sprint',
    healthScore: 97,
    githubHandle: '@gautam-tech',
  },
  {
    id: 'DM-504',
    name: 'Nisha Pillai',
    email: 'nisha.p@servfex.com',
    domain: 'Super Admin Web',
    title: 'Lead Frontend Systems Engineer',
    repositories: ['servfex-admin-fe', 'servfex-shared-ui'],
    teamSize: 4,
    currentSprint: 'Sprint 18 - Realtime Ops Dashboard & Inboxing',
    status: 'Code Review',
    healthScore: 100,
    githubHandle: '@nisha-ui',
  },
  {
    id: 'DM-505',
    name: 'Tarun Saxena',
    email: 'tarun.s@servfex.com',
    domain: 'Cloud & DevOps',
    title: 'Principal Infrastructure & SRE Manager',
    repositories: ['servfex-iac-terraform', 'k8s-manifests', 'github-ci-cd'],
    teamSize: 4,
    currentSprint: 'Sprint 9 - Zero-Downtime Cluster Migration',
    status: 'In Sprint',
    healthScore: 99,
    githubHandle: '@tarun-cloud',
  },
  {
    id: 'DM-506',
    name: 'Shruti Sen',
    email: 'shruti.s@servfex.com',
    domain: 'QA & Security',
    title: 'Head of Quality Engineering & SecOps',
    repositories: ['servfex-e2e-playwright', 'api-contract-tests', 'security-auditor'],
    teamSize: 5,
    currentSprint: 'Sprint 16 - Multi-Role Penetration Testing',
    status: 'Release Staging',
    healthScore: 99,
    githubHandle: '@shruti-secqa',
  },
];

export const DevelopmentManagers: React.FC = () => {
  const [managers, setManagers] = useState<DevelopmentManager[]>(INITIAL_DEV_MANAGERS);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [selectedManager, setSelectedManager] = useState<DevelopmentManager | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    domain: 'Core Backend & APIs' as DevelopmentManager['domain'],
    title: '',
    githubHandle: '',
    teamSize: 4,
    currentSprint: '',
  });

  const filteredManagers = managers.filter((mgr) => {
    const matchesSearch =
      mgr.name.toLowerCase().includes(search.toLowerCase()) ||
      mgr.title.toLowerCase().includes(search.toLowerCase()) ||
      mgr.domain.toLowerCase().includes(search.toLowerCase()) ||
      mgr.email.toLowerCase().includes(search.toLowerCase());

    const matchesDomain = domainFilter === 'ALL' || mgr.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    const newMgr: DevelopmentManager = {
      id: `DM-${Math.floor(500 + Math.random() * 200)}`,
      name: formData.name,
      email: formData.email,
      domain: formData.domain,
      title: formData.title,
      repositories: ['servfex-subsystem'],
      teamSize: Number(formData.teamSize) || 4,
      currentSprint: formData.currentSprint || 'Sprint 1 - Initialization',
      status: 'In Sprint',
      healthScore: 99,
      githubHandle: formData.githubHandle || `@${formData.name.toLowerCase().replace(' ', '')}`,
    };

    setManagers([newMgr, ...managers]);
    setIsAddOpen(false);
    setFormData({
      name: '',
      email: '',
      domain: 'Core Backend & APIs',
      title: '',
      githubHandle: '',
      teamSize: 4,
      currentSprint: '',
    });
  };

  const getDomainIcon = (domain: DevelopmentManager['domain']) => {
    switch (domain) {
      case 'Core Backend & APIs':
        return <Server className="w-4 h-4 text-emerald-600" />;
      case 'Customer Android App':
      case 'Partner / Vendor App':
        return <Smartphone className="w-4 h-4 text-sky-600" />;
      case 'Super Admin Web':
        return <Globe className="w-4 h-4 text-indigo-600" />;
      case 'Cloud & DevOps':
        return <Cpu className="w-4 h-4 text-amber-600" />;
      case 'QA & Security':
        return <Shield className="w-4 h-4 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
              <Code2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Development Managers</h1>
              <p className="text-xs text-slate-500">
                Software engineering leads, platform architects, mobile teams, and cloud infrastructure heads.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Development Manager</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Engineering Leads</span>
            <Laptop className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{managers.length}</div>
          <p className="text-xs text-slate-500 mt-1">Across 6 tech ecosystems</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tech Headcount</span>
            <Terminal className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {managers.reduce((acc, m) => acc + m.teamSize, 0)} Engineers
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Backend, Mobile & Frontend</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Microservices</span>
            <Server className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">14 Repos</div>
          <p className="text-xs text-slate-500 mt-1">CI/CD pipelines healthy</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Uptime Index</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">99.98%</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Production availability</p>
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
            placeholder="Search dev managers by name, engineering domain, sprint, or handle..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-slate-900 outline-none"
          />
        </div>

        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="p-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none"
        >
          <option value="ALL">All Engineering Domains</option>
          <option value="Core Backend & APIs">Core Backend & APIs</option>
          <option value="Customer Android App">Customer Android App</option>
          <option value="Partner / Vendor App">Partner / Vendor App</option>
          <option value="Super Admin Web">Super Admin Web</option>
          <option value="Cloud & DevOps">Cloud & DevOps</option>
          <option value="QA & Security">QA & Security</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Development Manager</th>
                <th className="py-3.5 px-4">Technical Domain</th>
                <th className="py-3.5 px-4">Team Size</th>
                <th className="py-3.5 px-4">Current Sprint Focus</th>
                <th className="py-3.5 px-4">Sprint Status</th>
                <th className="py-3.5 px-4">Code Health</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No development managers found matching filters.
                  </td>
                </tr>
              ) : (
                filteredManagers.map((mgr) => (
                  <tr key={mgr.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {mgr.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block">{mgr.name}</span>
                          <span className="text-xs text-slate-400">{mgr.githubHandle}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        {getDomainIcon(mgr.domain)}
                        <span>{mgr.domain}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{mgr.title}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 text-xs">{mgr.teamSize}</span>
                      <span className="text-xs text-slate-400 ml-1">engineers</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[200px]">{mgr.currentSprint}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          mgr.status === 'Release Staging'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : mgr.status === 'Code Review'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            mgr.status === 'Release Staging'
                              ? 'bg-purple-500'
                              : mgr.status === 'Code Review'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        {mgr.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{mgr.healthScore}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedManager(mgr)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedManager && (
        <Modal
          isOpen={!!selectedManager}
          onClose={() => setSelectedManager(null)}
          title={`Engineering Lead: ${selectedManager.name}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-base">
                  {selectedManager.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">{selectedManager.name}</h3>
                  <p className="text-xs text-indigo-600 font-bold">{selectedManager.title}</p>
                  <span className="text-[11px] text-slate-500">{selectedManager.domain}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedManager.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Work Email</span>
                <span className="font-bold text-slate-800">{selectedManager.email}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Internal Git Handle</span>
                <span className="font-bold text-slate-800">{selectedManager.githubHandle}</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Team Size</span>
                <span className="font-extrabold text-slate-900 text-base">{selectedManager.teamSize} Engineers</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <span className="text-slate-400 font-bold uppercase block mb-1">Code Health</span>
                <span className="font-extrabold text-emerald-700 text-base">{selectedManager.healthScore}% Passing</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Governed Repositories & Subsystems
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedManager.repositories.map((repo) => (
                  <span
                    key={repo}
                    className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 flex items-center gap-1.5"
                  >
                    <GitBranch className="w-3 h-3 text-indigo-500" />
                    {repo}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedManager(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Dev Manager Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Appoint Development Manager" maxWidth="lg">
        <form onSubmit={handleAddManager} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rahul Nair"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. rahul.n@servfex.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Engineering Domain</label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value as any })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              >
                <option value="Core Backend & APIs">Core Backend & APIs</option>
                <option value="Customer Android App">Customer Android App</option>
                <option value="Partner / Vendor App">Partner / Vendor App</option>
                <option value="Super Admin Web">Super Admin Web</option>
                <option value="Cloud & DevOps">Cloud & DevOps</option>
                <option value="QA & Security">QA & Security</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Title / Designation</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Lead Mobile Platform Engineer"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Git / System Handle</label>
              <input
                type="text"
                value={formData.githubHandle}
                onChange={(e) => setFormData({ ...formData, githubHandle: e.target.value })}
                placeholder="@rahul-dev"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Team Size</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Current Sprint Focus</label>
            <input
              type="text"
              value={formData.currentSprint}
              onChange={(e) => setFormData({ ...formData, currentSprint: e.target.value })}
              placeholder="e.g. Sprint 12 - Performance & Bundle Optimization"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
