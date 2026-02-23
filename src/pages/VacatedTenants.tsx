import React, { useEffect, useState } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext"; // IMPORTED AUTH
import { 
  RotateCcw, 
  Printer, 
  FileDown, 
  Search, 
  Users, 
  Building2, 
  CalendarDays
} from "lucide-react";
// --- FIREBASE IMPORTS ---
import { db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where,
  orderBy
} from "firebase/firestore";

interface VacatedTenant {
  id: string;
  name: string;
  propertyId: string;
  ownerId: string; // Added for RBAC
  rent: number;
  amountPaid: number;
  balance: number;
  expiryDate: string;
  vacatedDate: string;
  reason: string;
}

const VacatedTenants: React.FC = () => {
  const { formatUgx, currency, exchangeRate } = useCurrency();
  const { currentUser } = useAuth(); // GET USER DATA
  const [vacated, setVacated] = useState<VacatedTenant[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- 1. REAL-TIME CLOUD DATA (FILTERED BY OWNER) ---
  useEffect(() => {
    if (!currentUser) return;

    // A. Sync Properties (Filtered)
    const propRef = collection(db, "properties");
    const propQuery = currentUser.role === "admin" 
        ? query(propRef) 
        : query(propRef, where("ownerId", "==", currentUser.uid));

    const unsubscribeProps = onSnapshot(propQuery, (snapshot) => {
      const propList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(propList);
    });

    // B. Sync Vacated Tenants (Filtered)
    const vacatedRef = collection(db, "vacatedTenants");
    const vacatedQuery = currentUser.role === "admin"
        ? query(vacatedRef, orderBy("archivedAt", "desc"))
        : query(vacatedRef, where("ownerId", "==", currentUser.uid), orderBy("archivedAt", "desc"));

    const unsubscribeVacated = onSnapshot(vacatedQuery, (snapshot) => {
      const vacatedList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as VacatedTenant[];
      setVacated(vacatedList);
    });

    return () => {
      unsubscribeProps();
      unsubscribeVacated();
    };
  }, [currentUser]);

  const getAltCurrency = (amount: number) => {
    const rate = exchangeRate || 3800; 
    if (currency === "UGX") {
      return `USD $${(amount / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `UGX ${(amount * rate).toLocaleString()}`;
    }
  };

  // --- CLOUD RESTORE LOGIC ---
  const handleRestore = async (id: string) => {
    const tenantToRestore = vacated.find((t) => t.id === id);
    if (!tenantToRestore) return;

    if (!window.confirm(`Restore ${tenantToRestore.name} to active tenants?`)) return;

    try {
      // 1. Add back to active 'tenants' collection (preserving ownerId)
      await addDoc(collection(db, "tenants"), {
        name: tenantToRestore.name,
        contact: "", 
        propertyId: tenantToRestore.propertyId,
        ownerId: tenantToRestore.ownerId, // Critical for RBAC consistency
        rentAmount: tenantToRestore.rent,
        lastAmountPaid: tenantToRestore.amountPaid,
        balance: tenantToRestore.balance,
        paidUntil: tenantToRestore.expiryDate || new Date().toISOString().split('T')[0],
        rentFrequency: "Monthly",
        paymentHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Remove from 'vacatedTenants' collection
      await deleteDoc(doc(db, "vacatedTenants", id));

    } catch (err) {
      console.error("Restore failed:", err);
      alert("Failed to restore tenant. Please check your connection.");
    }
  };

  const exportCSV = () => {
    const header = ["Name", "Property", "Amount Paid (UGX)", "Balance (UGX)", "Reason", "Vacated Date"];
    const rows = filtered.map(t => [
      t.name,
      properties.find(p => p.id === t.propertyId)?.name || "N/A",
      t.amountPaid,
      t.balance,
      t.reason || "N/A",
      t.vacatedDate
    ]);
    const content = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Vacated_Archive_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filtered = vacated.filter(t => {
    const property = properties.find(p => p.id === t.propertyId);
    const searchStr = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(searchStr) ||
      (property?.name.toLowerCase().includes(searchStr) || "") ||
      (t.reason?.toLowerCase().includes(searchStr) || "")
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            Vacated Tenants Archive
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {currentUser?.role === 'admin' ? "Full Portfolio History" : "Your Historical Property Records"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search name, unit or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all"
            />
          </div>
          
          <button onClick={() => window.print()} className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold text-sm flex items-center gap-2 transition-all">
            <Printer size={16} /> Print
          </button>
          
          <button onClick={exportCSV} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 shadow-sm font-semibold text-sm flex items-center gap-2 transition-all">
            <FileDown size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <h3 className="font-bold text-gray-800 text-sm">Historical Ledger</h3>
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{filtered.length} Archived Records</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Tenant & Previous Unit</th>
                <th className="px-6 py-4 text-right">Total Paid</th>
                <th className="px-6 py-4 text-right">Final Balance</th>
                <th className="px-6 py-4 text-center">Reason</th>
                <th className="px-6 py-4 text-center">Departure Date</th>
                <th className="px-6 py-4 text-center print:hidden">Reinstatement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                        <Users size={48} />
                        <p className="mt-4 font-bold text-gray-500">No vacated records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const property = properties.find(p => p.id === t.propertyId);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                                <Building2 size={10}/> {property?.name || "Unit Removed"}
                            </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-gray-900 text-sm">{formatUgx(t.amountPaid)}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{getAltCurrency(t.amountPaid)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-bold text-sm ${t.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {t.balance > 0 ? `-${formatUgx(t.balance)}` : "Settled"}
                        </div>
                        {t.balance > 0 && (
                          <div className="text-[10px] text-red-400 font-bold uppercase tracking-tight">
                            {getAltCurrency(t.balance)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-bold uppercase">
                          {t.reason || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-600 uppercase">
                           <CalendarDays size={10}/> {t.vacatedDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center print:hidden">
                        <button 
                          onClick={() => handleRestore(t.id)} 
                          className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-blue-600 transition-all text-[10px] font-bold uppercase tracking-tight shadow-sm active:scale-95"
                        >
                          <RotateCcw size={12} /> Restore
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Styling */}
      <style>{`
        @media print {
          body { background: white !important; font-size: 10pt; }
          .max-w-7xl { max-width: 100% !important; margin: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
          .rounded-2xl { border-radius: 4px !important; }
          .bg-gray-50 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          th { border-bottom: 2px solid #000 !important; }
          td { border-bottom: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
};

export default VacatedTenants;