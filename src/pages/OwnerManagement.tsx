import React, { useState } from 'react';
import { 
  Users, 
  Building2, 
  Wallet, 
  TrendingUp, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

const OwnerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Mock Data for Truvana Owners
  const [owners] = useState([
    {
      id: "OWN-001",
      name: "Alexander Truvana",
      email: "alex@truvana.com",
      phone: "+254 712 345 678",
      properties: 12,
      totalUnits: 45,
      revenueGenerated: 1250000,
      mgmtFee: "10%",
      status: "Active",
      payoutStatus: "Paid",
      lastDisbursement: "2026-02-15"
    },
    {
      id: "OWN-002",
      name: "Sarah Jenkins",
      email: "s.jenkins@outlook.com",
      phone: "+254 722 987 654",
      properties: 3,
      totalUnits: 8,
      revenueGenerated: 450000,
      mgmtFee: "8%",
      status: "Active",
      payoutStatus: "Pending",
      lastDisbursement: "2026-01-10"
    },
    {
      id: "OWN-003",
      name: "Hillview Estates Ltd",
      email: "admin@hillview.co.ke",
      phone: "+254 733 111 222",
      properties: 1,
      totalUnits: 24,
      revenueGenerated: 890000,
      mgmtFee: "12%",
      status: "Inactive",
      payoutStatus: "N/A",
      lastDisbursement: "2025-12-20"
    }
  ]);

  const stats = [
    { title: 'Total Owners', value: '42', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Units Managed', value: '184', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Total Revenue', value: 'KES 4.2M', icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Avg. Mgmt Fee', value: '9.2%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Owner Management</h1>
          <p className="text-gray-500 text-sm">Monitor landlord performance and portfolio health.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm">
          <Plus size={18} />
          Add New Owner
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              <h3 className="text-xl font-bold text-gray-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email, or ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <Filter size={16} className="text-gray-500" />
            <select 
              className="bg-transparent text-sm font-medium focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Owners Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner Detail</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Portfolio</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue (YTD)</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payout</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {owners.map((owner) => (
                <tr key={owner.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {owner.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{owner.name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail size={12} /> {owner.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-700">{owner.properties} Properties</div>
                    <div className="text-xs text-gray-400">{owner.totalUnits} Total Units</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-800">KES {owner.revenueGenerated.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {owner.mgmtFee}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {owner.payoutStatus === 'Paid' ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : owner.payoutStatus === 'Pending' ? (
                        <Clock size={16} className="text-amber-500" />
                      ) : (
                        <AlertCircle size={16} className="text-gray-400" />
                      )}
                      <span className={`text-sm font-medium ${
                        owner.payoutStatus === 'Paid' ? 'text-green-700' : 
                        owner.payoutStatus === 'Pending' ? 'text-amber-700' : 'text-gray-500'
                      }`}>
                        {owner.payoutStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>Showing 1 to 3 of 42 owners</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerManagement;