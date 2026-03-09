import React, { useEffect, useState } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { 
  Wrench, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  Building2, 
  Clock, 
  FileText,
  CheckCircle2,
  Hammer
} from "lucide-react";
// --- FIREBASE IMPORTS ---
import { db } from "../firebase";
import { 
  collection, onSnapshot, addDoc, updateDoc, 
  deleteDoc, doc, serverTimestamp 
} from "firebase/firestore";

interface Property {
  id: string;
  name: string;
}

interface Repair {
  id: string;
  propertyId: string;
  issue: string;
  description: string;
  cost: number;
  status: "Pending" | "In Progress" | "Completed";
  date: string;
}

const Repairs: React.FC = () => {
  const { formatUgx, currency, exchangeRate } = useCurrency();
  const [properties, setProperties] = useState<Property[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<Omit<Repair, "id">>({
    propertyId: "",
    issue: "",
    description: "",
    cost: 0,
    status: "Pending",
    date: new Date().toISOString().split("T")[0],
  });

  const [usdCost, setUsdCost] = useState<string>("0");

  // --- REAL-TIME FIREBASE SYNC ---
  useEffect(() => {
    // Listen for Properties (to populate the dropdown)
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      const propList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Property[];
      setProperties(propList);
    });

    // Listen for Repairs
    const unsubscribeRepairs = onSnapshot(collection(db, "repairs"), (snapshot) => {
      const repairList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Repair[];
      setRepairs(repairList);
    });

    return () => {
      unsubscribeProps();
      unsubscribeRepairs();
    };
  }, []);

  // Helper for table display
  const getAltCurrency = (amount: number) => {
    const rate = exchangeRate || 3800; 
    if (currency === "USD") {
      return `UGX ${(amount * rate).toLocaleString()}`;
    } else {
      return `USD $${(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  // Dual Currency Sync Logic
  const handleUgxChange = (val: number) => {
    const rate = exchangeRate || 3800;
    setFormData({ ...formData, cost: val / rate });
    setUsdCost((val / rate).toFixed(2));
  };

  const handleUsdChange = (val: number) => {
    setUsdCost(val.toString());
    setFormData({ ...formData, cost: val });
  };

  // --- CLOUD SUBMIT LOGIC ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const repairRef = doc(db, "repairs", editingId);
        await updateDoc(repairRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "repairs"), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      setFormData({ propertyId: "", issue: "", description: "", cost: 0, status: "Pending", date: new Date().toISOString().split("T")[0] });
      setUsdCost("");
    } catch (err) {
      console.error("Firebase Error:", err);
      alert("Failed to save the repair record to the cloud.");
    }
  };

  // --- CLOUD DELETE LOGIC ---
  const handleDelete = async (id: string) => {
    if (window.confirm("Permanently delete this maintenance record? This will sync for all users.")) {
      try {
        await deleteDoc(doc(db, "repairs", id));
      } catch (err) {
        alert("Error deleting record from cloud.");
      }
    }
  };

  const filtered = repairs.filter(r => {
    const property = properties.find(p => p.id === r.propertyId);
    return r.issue.toLowerCase().includes(searchTerm.toLowerCase()) || 
           property?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            Repairs & Maintenance
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track property upkeep and service costs</p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by issue or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2.5 pl-10 pr-4 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className={`p-2 rounded-lg ${editingId ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                {editingId ? <Edit3 size={20}/> : <Plus size={20}/>}
            </div>
            <h2 className="text-lg font-bold text-gray-900">
            {editingId ? "Update Maintenance Record" : "Log New Repair Task"}
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Building2 size={14} className="text-gray-400"/> Property
              </label>
              <select 
                value={formData.propertyId} 
                onChange={(e) => setFormData({...formData, propertyId: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 outline-none" 
                required
              >
                <option value="">Select a unit...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Wrench size={14} className="text-gray-400"/> Issue Summary
              </label>
              <input 
                type="text" 
                value={formData.issue} 
                onChange={(e) => setFormData({...formData, issue: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none" 
                placeholder="e.g., Plumbing Leak"
                required 
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400"/> Status & Date
            </label>
            <select 
              value={formData.status} 
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:border-blue-500 outline-none"
            >
              <option value="Pending">Pending Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <input 
              type="date" 
              value={formData.date} 
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 focus:border-blue-500 outline-none" 
            />
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1.5">Estimated Cost (USD)</label>
                  <input 
                    type="number" 
                    value={formData.cost || ""} 
                    onChange={(e) => handleUsdChange(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-blue-200 bg-blue-50/30 rounded-lg text-sm font-semibold focus:border-blue-500 outline-none" 
                    placeholder="0" 
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-green-700 mb-1.5">Equivalent Cost (UGX)</label>
                  <input 
                    type="number" 
                    value={formData.cost ? (formData.cost * (exchangeRate || 3800)).toFixed(0) : ""} 
                    onChange={(e) => handleUgxChange(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-green-200 bg-green-50/30 rounded-lg text-sm font-semibold focus:border-green-500 outline-none" 
                    placeholder="0" 
                  />
               </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FileText size={14} className="text-gray-400"/> Description / Notes
              </label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none resize-none" 
                rows={1}
                placeholder="Optional details..."
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
          <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm">
            {editingId ? "Update Record" : "Save Record"}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={() => { setEditingId(null); setFormData({ propertyId: "", issue: "", description: "", cost: 0, status: "Pending", date: new Date().toISOString().split("T")[0] }); setUsdCost("0"); }}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Repairs Directory */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <h3 className="font-bold text-gray-800 text-sm">Maintenance Log</h3>
           <span className="text-xs text-gray-400 font-medium">{filtered.length} entries found</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Issue Details</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Costing</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                    <AlertCircle size={32} className="mx-auto mb-2 opacity-20"/>
                    No records matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const property = properties.find(p => p.id === r.propertyId);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 text-sm">{r.issue}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1"><Building2 size={10}/> {property?.name || "Unknown Property"}</span>
                            <span className="text-[10px] text-gray-400">• {r.date}</span>
                        </div>
                        {r.description && <div className="text-xs text-gray-400 mt-1 italic truncate max-w-xs">"{r.description}"</div>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          r.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                          r.status === 'In Progress' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {r.status === 'Completed' && <CheckCircle2 size={10}/>}
                          {r.status === 'In Progress' && <Hammer size={10}/>}
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-gray-900 text-sm">{formatUgx(r.cost)}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">
                          {getAltCurrency(r.cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { 
                            setEditingId(r.id); 
                            setFormData({...r}); 
                            setUsdCost(r.cost.toString()); 
                            window.scrollTo({top: 0, behavior: 'smooth'}); 
                          }} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit3 size={16}/>
                          </button>
                          <button onClick={() => handleDelete(r.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Repairs;