import React, { useEffect, useState } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { 
  Printer, 
  PieChart, 
  FileDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet,
  Building2,
  Filter
} from "lucide-react";
// --- FIREBASE IMPORTS ---
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const Reports: React.FC = () => {
  const { formatUgx, currency, exchangeRate } = useCurrency();
  const [selectedProperty, setSelectedProperty] = useState<string>("all");

  const [reportData, setReportData] = useState<{
    tenants: any[];
    properties: any[];
    repairs: any[];
  }>({
    tenants: [],
    properties: [],
    repairs: [],
  });

  // --- REAL-TIME DATA AGGREGATION ---
  useEffect(() => {
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (propSnap) => {
      const storedProperties = propSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const unsubscribeTenants = onSnapshot(collection(db, "tenants"), (tenantSnap) => {
        const storedTenants = tenantSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const unsubscribeRepairs = onSnapshot(collection(db, "repairs"), (repairSnap) => {
          const storedRepairs = repairSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          setReportData({ 
            tenants: storedTenants, 
            properties: storedProperties, 
            repairs: storedRepairs
          });
        });

        return () => unsubscribeRepairs();
      });

      return () => unsubscribeTenants();
    });

    return () => unsubscribeProps();
  }, []);

  const getAltCurrency = (amount: number) => {
    const rate = exchangeRate || 3800; 
    const converted = currency === "UGX" ? (amount / rate) : (amount * rate);
    const symbol = currency === "UGX" ? "USD $" : "UGX ";
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // --- DYNAMIC LOGIC PROCESSING ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const processedTenants = reportData.tenants.map((t: any) => {
    const paidUntilDate = new Date(t.paidUntil);
    const isExpired = today >= paidUntilDate;
    const baseBalance = Number(t.balance || 0);
    
    // Dynamic Arrears: if date passed, add rent to balance
    const effectiveArrears = isExpired ? baseBalance + (Number(t.rentAmount) || 0) : baseBalance;

    let daysLate = 0;
    if (isExpired) {
        const diffTime = Math.abs(today.getTime() - paidUntilDate.getTime());
        daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const property = reportData.properties.find((p: any) => p.id === t.propertyId);
    
    return { 
      ...t, 
      effectiveArrears, 
      daysLate, 
      propertyName: property ? property.name : "Unassigned Unit" 
    };
  });

  // --- FILTERING ---
  const filteredTenants = selectedProperty === "all" 
    ? processedTenants 
    : processedTenants.filter(t => t.propertyId === selectedProperty);

  const filteredRepairs = selectedProperty === "all" 
    ? reportData.repairs 
    : reportData.repairs.filter(r => r.propertyId === selectedProperty);

  const filteredOverdue = filteredTenants
    .filter(t => t.effectiveArrears > 0)
    .sort((a, b) => b.effectiveArrears - a.effectiveArrears);

  // --- TOTALS ---
  const totalRevenue = filteredTenants.reduce((acc, t: any) => acc + Number(t.lastAmountPaid || 0), 0);
  const totalArrears = filteredTenants.reduce((acc, t: any) => acc + t.effectiveArrears, 0);
  const totalRepairs = filteredRepairs.reduce((acc, r: any) => acc + Number(r.cost || 0), 0);
  const netPosition = totalRevenue - totalRepairs;

  const exportCSV = () => {
    const propertyName = selectedProperty === "all" ? "Full Portfolio" : reportData.properties.find(p => p.id === selectedProperty)?.name;
    
    const sections = [
      [`FINANCIAL REPORT: ${propertyName?.toUpperCase()}`],
      ["Generated", new Date().toLocaleString()],
      [""],
      ["Metric", "Value (UGX)"],
      ["Total Collected", totalRevenue],
      ["Total Arrears", totalArrears],
      ["Repairs Outlay", totalRepairs],
      ["Net Cash Position", netPosition],
      [""],
      ["ARREARS RISK TRACKING"],
      ["Tenant Name", "Status", "Total Owed (UGX)"],
      ...filteredOverdue.map(t => [t.name, t.daysLate > 0 ? `${t.daysLate} Days Late` : "Balance Due", t.effectiveArrears]),
      [""],
      ["MAINTENANCE LOG"],
      ["Issue", "Cost (UGX)"],
      ...filteredRepairs.map(r => [r.issue, r.cost])
    ];

    const content = sections.map(e => e.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${propertyName?.replace(/\s+/g, '_')}_Report_v3.csv`;
    link.click();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12 text-left">
      
      {/* Header with Property Filter */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-6 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Property Analytics</h1>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Truvana Holdings. Management</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-grow md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select 
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
            >
              <option value="all">All Properties</option>
              {reportData.properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all">
            <Printer size={16} /> Print
          </button>
          
          <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm transition-all">
            <FileDown size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><ArrowUpRight size={20}/></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gross Revenue</span>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatUgx(totalRevenue)}</div>
          <div className="text-[10px] font-bold text-emerald-600 mt-1">{getAltCurrency(totalRevenue)}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-red-50 text-red-600 rounded-lg"><ArrowDownRight size={20}/></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Arrears</span>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatUgx(totalArrears)}</div>
          <div className="text-[10px] font-bold text-red-600 mt-1">{getAltCurrency(totalArrears)}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-orange-50 text-orange-600 rounded-lg"><PieChart size={20}/></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Repairs</span>
          </div>
          <div className="text-xl font-bold text-gray-900">{formatUgx(totalRepairs)}</div>
          <div className="text-[10px] font-bold text-orange-600 mt-1">{getAltCurrency(totalRepairs)}</div>
        </div>

        <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-blue-500 text-white rounded-lg"><Wallet size={20}/></span>
            <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Net Position</span>
          </div>
          <div className="text-xl font-bold">{formatUgx(netPosition)}</div>
          <div className="text-[10px] font-bold text-blue-100 mt-1">{getAltCurrency(netPosition)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Arrears List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-800">Aging Arrears Table (Dynamic)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-100">
                {filteredOverdue.length > 0 ? filteredOverdue.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{t.name}</div>
                      {selectedProperty === "all" && <div className="text-[10px] text-gray-400 font-bold uppercase">{t.propertyName}</div>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${t.daysLate > 0 ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                        {t.daysLate > 0 ? `${t.daysLate} Days Late` : 'Balance Due'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="font-bold text-red-600">{formatUgx(t.effectiveArrears)}</div>
                       <div className="text-[10px] text-red-400 font-bold">{getAltCurrency(t.effectiveArrears)}</div>
                    </td>
                  </tr>
                )) : (
                  <tr><td className="px-6 py-10 text-center text-gray-400 italic text-sm">No arrears found for this selection.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Repair Impact */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-800">Recent Maintenance Costs</h3>
          </div>
          <div className="p-6 space-y-4">
            {filteredRepairs.length > 0 ? filteredRepairs.slice(-5).reverse().map((r: any, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{r.issue}</p>
                  <p className="text-[10px] text-blue-600 font-bold uppercase">{reportData.properties.find(p => p.id === r.propertyId)?.name}</p>
                </div>
                <div className="text-right font-bold text-gray-900 text-sm">{formatUgx(r.cost)}</div>
              </div>
            )) : (
                <div className="py-10 text-center text-gray-400 italic text-sm">No repair records found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;