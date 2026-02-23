import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext"; 
import packageInfo from "../../package.json";
import { 
  Building2, 
  Users, 
  AlertCircle, 
  Download, 
  Upload, 
  ShieldCheck, 
  TrendingUp,
  Clock,
  Hammer,
  RefreshCcw,
  Database
} from "lucide-react";

// --- FIREBASE IMPORTS ---
import { db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  writeBatch, 
  getDocs,
  query,
  where 
} from "firebase/firestore";

const SystemStatus: React.FC = () => {
  const navigate = useNavigate();
  const [lastBackup] = useState<string | null>(localStorage.getItem('last_backup_date'));
  const needRefresh = false; 

  const isBackupOverdue = () => {
    if (!lastBackup) return true;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(lastBackup) < sevenDaysAgo;
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${needRefresh ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-xs font-medium text-gray-500">Version {packageInfo.version} Stable</span>
        </div>
        {needRefresh ? <AlertCircle size={16} className="text-orange-500" /> : <ShieldCheck size={16} className="text-green-500" />}
      </div>
      
      <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 border ${isBackupOverdue() ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
        <Database size={18} className={isBackupOverdue() ? 'text-red-500' : 'text-gray-400'} />
        <div>
          <p className="text-xs text-gray-500 font-medium">Cloud Sync Status</p>
          <p className={`text-sm font-semibold ${isBackupOverdue() ? 'text-red-700' : 'text-gray-900'}`}>
            {lastBackup ? "System Connected" : "Initial Backup Required"}
          </p>
        </div>
      </div>

      <button onClick={() => navigate('/system')} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-all">
        <RefreshCcw size={16} />
        System Settings
      </button>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { formatUgx, currency, exchangeRate } = useCurrency();
  const { currentUser } = useAuth(); 
  const [properties, setProperties] = useState<any[]>([]);
  const [overdueTenants, setOverdueTenants] = useState<any[]>([]);
  const [pendingRepairs, setPendingRepairs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    totalRepairs: 0,
    totalRevenue: 0,
    totalBalance: 0,
  });

  // --- REAL-TIME CLOUD UPDATES ---
  useEffect(() => {
    if (!currentUser) return;

    // Determine if we show everything (Admin) or filtered (Landlord)
    const isAdmin = currentUser.role === 'admin';

    // 1. Properties Query Logic
    const propBase = collection(db, "properties");
    const propQuery = isAdmin ? query(propBase) : query(propBase, where("ownerId", "==", currentUser.uid));
    
    const unsubProps = onSnapshot(propQuery, (propSnap) => {
      const pList = propSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProperties(pList);

      // 2. Tenants Query Logic
      const tenantBase = collection(db, "tenants");
      const tenantQuery = isAdmin ? query(tenantBase) : query(tenantBase, where("ownerId", "==", currentUser.uid));
      
      const unsubTenants = onSnapshot(tenantQuery, (tenantSnap) => {
        const tList = tenantSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // 3. Repairs Query Logic
        const repairBase = collection(db, "repairs");
        const repairQuery = isAdmin ? query(repairBase) : query(repairBase, where("ownerId", "==", currentUser.uid));
        
        const unsubRepairs = onSnapshot(repairQuery, (repairSnap) => {
          const rList = repairSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const processedTenants = tList.map((t: any) => {
            const paidUntilDate = new Date(t.paidUntil);
            const isExpired = today >= paidUntilDate;
            const baseBalance = Number(t.balance || 0);
            const effectiveArrears = isExpired ? baseBalance + (Number(t.rentAmount) || 0) : baseBalance;

            let daysLate = 0;
            if (isExpired) {
                const diffTime = Math.abs(today.getTime() - paidUntilDate.getTime());
                daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            return { ...t, effectiveArrears, daysLate };
          });

          const overdue = processedTenants.filter(t => t.effectiveArrears > 0);
          const revenue = tList.reduce((acc: number, t: any) => acc + Number(t.lastAmountPaid || 0), 0);
          const totalDynamicBalance = processedTenants.reduce((acc: number, t: any) => acc + t.effectiveArrears, 0);
          const repairCosts = rList.reduce((acc: number, r: any) => acc + Number(r.cost || 0), 0);

          setOverdueTenants(overdue.sort((a, b) => b.effectiveArrears - a.effectiveArrears));
          setPendingRepairs(rList.slice(-4).reverse());
          setStats({
            totalProperties: pList.length,
            activeTenants: tList.length,
            totalRepairs: repairCosts,
            totalRevenue: revenue,
            totalBalance: totalDynamicBalance,
          });
        });
        return () => unsubRepairs();
      });
      return () => unsubTenants();
    });
    return () => unsubProps();
  }, [currentUser]);

  const getAltCurrency = (amount: number) => {
    const rate = exchangeRate || 3800; 
    const converted = currency === "UGX" ? (amount / rate) : (amount * rate);
    const symbol = currency === "UGX" ? "USD $" : "UGX ";
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExport = async () => {
    if (!currentUser) return;
    const isAdmin = currentUser.role === 'admin';

    // Helper to get correct query based on role
    const getRoleQuery = (colName: string) => {
      const colRef = collection(db, colName);
      return isAdmin ? query(colRef) : query(colRef, where("ownerId", "==", currentUser.uid));
    };

    const backupData = {
      properties: (await getDocs(getRoleQuery("properties"))).docs.map(d => ({id: d.id, ...d.data()})),
      tenants: (await getDocs(getRoleQuery("tenants"))).docs.map(d => ({id: d.id, ...d.data()})),
      repairs: (await getDocs(getRoleQuery("repairs"))).docs.map(d => ({id: d.id, ...d.data()})),
      vacatedTenants: (await getDocs(getRoleQuery("vacatedTenants"))).docs.map(d => ({id: d.id, ...d.data()}))
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Truvana_Backup_${isAdmin ? 'Full' : currentUser.uid}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    localStorage.setItem('last_backup_date', new Date().toISOString());
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!window.confirm("Upload this backup to the cloud?")) return;
        const batch = writeBatch(db);
        
        // Import logic: Admins keep original ownerIds, Landlords get their own UID tagged
        const tagOwner = (item: any) => currentUser.role === 'admin' ? item : { ...item, ownerId: currentUser.uid };

        if (data.properties) data.properties.forEach((p: any) => batch.set(doc(db, "properties", p.id), tagOwner(p)));
        if (data.tenants) data.tenants.forEach((t: any) => batch.set(doc(db, "tenants", t.id), tagOwner(t)));
        if (data.repairs) data.repairs.forEach((r: any) => batch.set(doc(db, "repairs", r.id), tagOwner(r)));
        
        await batch.commit();
        alert("Cloud synchronization successful!");
      } catch (err) { alert("Failed to sync."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12 text-left">
      <div className="px-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {currentUser?.role === 'admin' ? "Master Administrator View" : "Real-time Landlord Cloud Management"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon={<Building2 size={24}/>} label="Total Units" value={stats.totalProperties} color="blue" />
        <StatCard icon={<Users size={24}/>} label="Active Tenants" value={stats.activeTenants} color="green" />
        <StatCard 
          icon={<TrendingUp size={24}/>} 
          label="Gross Revenue" 
          value={formatUgx(stats.totalRevenue)} 
          subValue={getAltCurrency(stats.totalRevenue)}
          color="purple" 
        />
        <StatCard 
          icon={<AlertCircle size={24}/>} 
          label="Total Arrears" 
          value={formatUgx(stats.totalBalance)} 
          subValue={getAltCurrency(stats.totalBalance)}
          color="red" 
        />
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 min-w-0 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Clock className="text-red-600" size={18} /> Overdue Payments
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-4 text-left">Tenant</th>
                    <th className="px-6 py-4 text-left">Unit</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Total Owed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {overdueTenants.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-gray-400">All accounts are settled</td></tr>
                  ) : (
                    overdueTenants.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{t.name}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {properties.find(p=>p.id===t.propertyId)?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${t.daysLate > 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                            {t.daysLate > 0 ? `${t.daysLate} days late` : "Balance Owed"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="font-bold text-red-600">{formatUgx(t.effectiveArrears)}</div>
                            <div className="text-[10px] text-red-400 font-bold uppercase">{getAltCurrency(t.effectiveArrears)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <Hammer className="text-orange-500" size={18} /> Recent Maintenance
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingRepairs.length === 0 ? (
                <p className="col-span-2 text-center py-8 text-gray-400 text-sm">No recent repairs</p>
              ) : (
                pendingRepairs.map((r, i) => (
                  <div key={i} className="p-5 border border-gray-100 rounded-xl bg-gray-50/30">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm">{r.issue}</h4>
                      <span className="font-bold text-blue-600 text-sm">{formatUgx(r.cost)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {properties.find(p => p.id === r.propertyId)?.name || "General Property"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="w-full xl:w-80 space-y-6">
          <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
             <ShieldCheck className="absolute top-[-10px] right-[-10px] text-white opacity-10" size={100} />
             <h3 className="text-lg font-bold mb-2">Cloud Sync</h3>
             <p className="text-blue-100 text-sm mb-6">Backup your cloud data or restore from a JSON file.</p>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExport} className="bg-white text-blue-700 py-3 rounded-lg font-semibold text-xs flex flex-col items-center justify-center gap-1 hover:bg-blue-50 transition-all">
                  <Download size={16} /> Backup
                </button>
                <label className="border border-blue-400 bg-blue-700 text-white py-3 rounded-lg font-semibold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-blue-800 transition-all">
                  <Upload size={16} /> Restore
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
             </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl text-white shadow-lg">
            <p className="text-gray-400 text-xs font-medium uppercase mb-2">Net Cash Flow</p>
            <p className="text-3xl font-bold text-emerald-400">{formatUgx(stats.totalRevenue - stats.totalRepairs)}</p>
            <p className="text-xs font-bold text-emerald-500/80 mt-1">{getAltCurrency(stats.totalRevenue - stats.totalRepairs)}</p>
          </div>

          <SystemStatus />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue, color }: any) => {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-emerald-600 bg-emerald-50 border-emerald-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    red: "text-red-600 bg-red-50 border-red-100"
  };
  
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md h-full">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-gray-500 text-xs font-medium uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subValue && <p className={`text-[10px] font-bold mt-1 ${colors[color].split(' ')[0]}`}>{subValue}</p>}
    </div>
  );
};

export default Dashboard;