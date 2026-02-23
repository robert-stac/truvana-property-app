import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Trash2, Edit2, CheckCircle, AlertCircle, 
  Clock, Calendar, DollarSign, ArrowRightLeft, History, X, UserCircle 
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, onSnapshot, addDoc, updateDoc, 
  deleteDoc, doc, query, orderBy, serverTimestamp, where 
} from "firebase/firestore";

const Tenants: React.FC = () => {
  const { formatUgx, toggleCurrency, currency, exchangeRate } = useCurrency();
  const { currentUser } = useAuth(); 
  
  const [tenants, setTenants] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewHistory, setViewHistory] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [vacateModal, setVacateModal] = useState<{show: boolean, tenant: any | null, reason: string}>({
    show: false,
    tenant: null,
    reason: ""
  });

  const [paymentModal, setPaymentModal] = useState<{show: boolean, tenant: any | null, amount: number}>({
    show: false,
    tenant: null,
    amount: 0
  });

  const [newTenant, setNewTenant] = useState({
    id: "",
    name: "",
    contact: "",
    propertyId: "",
    rentAmount: 0,
    rentFrequency: "Monthly",
    paidUntil: new Date().toISOString().split('T')[0],
    balance: 0,
    lastAmountPaid: 0,
    paymentHistory: [] as any[] 
  });

  // UPDATED: Decoupled listeners for instant data retrieval
  useEffect(() => {
    if (!currentUser) return;

    // 1. Properties Listener (Parallel)
    const propRef = collection(db, "properties");
    const propQuery = currentUser.role === "admin" 
        ? query(propRef) 
        : query(propRef, where("ownerId", "==", currentUser.uid));

    const unsubscribeProps = onSnapshot(propQuery, (snapshot) => {
      const propList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(propList);
    });

    // 2. Tenants Listener (Parallel - No longer nested)
    const tenantRef = collection(db, "tenants");
    const tenantQuery = currentUser.role === "admin"
      ? query(tenantRef, orderBy("name", "asc"))
      : query(tenantRef, where("ownerId", "==", currentUser.uid), orderBy("name", "asc"));

    const unsubscribeTenants = onSnapshot(tenantQuery, (snapshot) => {
      const tenantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTenants(tenantList);
    });

    // Clean up both listeners
    return () => {
      unsubscribeProps();
      unsubscribeTenants();
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

  const handleAmountChange = (value: string, inputType: "UGX" | "USD", field: "rentAmount" | "lastAmountPaid") => {
    const numValue = Number(value);
    const rate = exchangeRate || 3800;
    if (inputType === "USD") {
      setNewTenant({ ...newTenant, [field]: Math.round(numValue * rate) });
    } else {
      setNewTenant({ ...newTenant, [field]: numValue });
    }
  };

  const calculateEffectiveArrears = (tenant: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paidUntilDate = new Date(tenant.paidUntil);
    const isExpired = today >= paidUntilDate;
    const baseBalance = Number(tenant.balance || 0);
    return isExpired ? baseBalance + (Number(tenant.rentAmount) || 0) : baseBalance;
  };

  const getTenantStatus = (tenant: any) => {
    const effectiveArrears = calculateEffectiveArrears(tenant);
    if (effectiveArrears > 0) return { label: "ARREARS", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle };
    const today = new Date();
    const dueDate = new Date(tenant.paidUntil);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return { label: "DUE SOON", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock };
    return { label: "ACTIVE", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle };
  };

  const saveTenant = async () => {
    if (!newTenant.propertyId) return alert("Please select a unit/property.");
    setLoading(true);
    const selectedProp = properties.find(p => p.id === newTenant.propertyId);
    
    const tenantData = {
      name: newTenant.name || "Unnamed",
      contact: newTenant.contact || "",
      propertyId: newTenant.propertyId,
      ownerId: selectedProp?.ownerId || currentUser?.uid,
      rentAmount: Number(newTenant.rentAmount) || 0,
      rentFrequency: newTenant.rentFrequency || "Monthly",
      paidUntil: newTenant.paidUntil || new Date().toISOString().split('T')[0],
      balance: Math.max(0, Number(newTenant.rentAmount || 0) - Number(newTenant.lastAmountPaid || 0)),
      lastAmountPaid: Number(newTenant.lastAmountPaid) || 0,
      paymentHistory: newTenant.paymentHistory || [],
      updatedAt: serverTimestamp()
    };

    try {
      if (newTenant.id) {
        await updateDoc(doc(db, "tenants", newTenant.id), tenantData);
      } else {
        await addDoc(collection(db, "tenants"), { ...tenantData, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert("Error saving: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleVacateConfirm = async () => {
    const { tenant, reason } = vacateModal;
    if (!tenant) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "vacatedTenants"), {
        name: tenant.name,
        propertyId: tenant.propertyId,
        ownerId: tenant.ownerId,
        rent: tenant.rentAmount,
        amountPaid: tenant.lastAmountPaid,
        balance: tenant.balance,
        expiryDate: tenant.paidUntil,
        vacatedDate: new Date().toISOString().split('T')[0],
        reason: reason || "Standard Vacation",
        archivedAt: serverTimestamp()
      });
      await deleteDoc(doc(db, "tenants", tenant.id));
      setVacateModal({ show: false, tenant: null, reason: "" });
    } catch (err) {
      alert("Error archiving: " + err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTenant = (tenant: any) => setVacateModal({ show: true, tenant, reason: "" });

  const handleEdit = (tenant: any) => {
    setNewTenant({ ...tenant, contact: tenant.contact || "", rentFrequency: tenant.rentFrequency || "Monthly" });
    setShowModal(true);
  };

  const resetForm = () => {
    setNewTenant({
      id: "", name: "", contact: "", propertyId: "",
      rentAmount: 0, rentFrequency: "Monthly",
      paidUntil: new Date().toISOString().split('T')[0],
      balance: 0, lastAmountPaid: 0, paymentHistory: []
    });
  };

  const recordPayment = (tenant: any) => {
    setPaymentModal({ show: true, tenant, amount: calculateEffectiveArrears(tenant) });
  };

  const handleProcessPayment = async () => {
    const { tenant, amount } = paymentModal;
    if (!tenant || amount <= 0) return;
    setLoading(true);

    const totalPaidThisPeriod = (tenant.lastAmountPaid || 0) + amount;
    const newBalance = Math.max(0, (tenant.rentAmount || 0) - totalPaidThisPeriod);
    const newTransaction = {
        date: new Date().toLocaleString(),
        amount: amount,
        currency: "UGX",
        altAmount: getAltCurrency(amount)
    };

    let newPaidUntil = tenant.paidUntil;
    let finalPaidTotal = totalPaidThisPeriod;

    if (newBalance <= 0) {
      const date = new Date(tenant.paidUntil);
      if (tenant.rentFrequency === "3 Months") date.setMonth(date.getMonth() + 3);
      else if (tenant.rentFrequency === "6 Months") date.setMonth(date.getMonth() + 6);
      else if (tenant.rentFrequency === "Yearly") date.setFullYear(date.getFullYear() + 1);
      else date.setMonth(date.getMonth() + 1);
      newPaidUntil = date.toISOString().split('T')[0];
      finalPaidTotal = 0; 
    }

    try {
      await updateDoc(doc(db, "tenants", tenant.id), {
        lastAmountPaid: finalPaidTotal,
        paidUntil: newPaidUntil,
        balance: newBalance,
        paymentHistory: [newTransaction, ...(tenant.paymentHistory || [])],
        updatedAt: serverTimestamp()
      });
      setPaymentModal({ show: false, tenant: null, amount: 0 });
    } catch (err) {
      alert("Payment failed: " + err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t =>
      (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      properties.find(p => p.id === t.propertyId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tenant Directory</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
             {currentUser?.role === 'admin' ? "Full Portfolio Overview" : "Your Active Residents"}
          </p>
        </div>
        
        <div className="flex gap-3">
            <button onClick={toggleCurrency} className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                <ArrowRightLeft size={18} className="text-blue-600"/>
                <span>{currency === "UGX" ? "UGX" : "USD"}</span>
            </button>

            <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-blue-900 text-white px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-800 transition-all font-semibold shadow-md active:scale-95 text-sm">
                <Plus size={18} /> Add Tenant
            </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search tenants..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rent Amount</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Paid So Far</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-red-600">Arrears</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Paid Until</th>
                <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTenants.map((tenant) => {
                const property = properties.find((p) => p.id === tenant.propertyId);
                const status = getTenantStatus(tenant);
                const displayArrears = calculateEffectiveArrears(tenant);

                return (
                  <tr key={tenant.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">{tenant.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{property?.name || "No Unit"}</span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase border border-blue-100">
                          {tenant.rentFrequency || "Monthly"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{formatUgx(tenant.rentAmount || 0)}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase">{getAltCurrency(tenant.rentAmount || 0)}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-emerald-600 font-bold">{formatUgx(tenant.lastAmountPaid || 0)}</div>
                      <div className="text-[10px] text-emerald-400 font-bold uppercase">{getAltCurrency(tenant.lastAmountPaid || 0)}</div>
                    </td>
                    <td className="p-4">
                      <div className={`font-black ${displayArrears > 0 ? "text-red-600" : "text-gray-300"}`}>
                        {displayArrears > 0 ? formatUgx(displayArrears) : "CLEARED"}
                      </div>
                      {displayArrears > 0 && <div className="text-[10px] text-red-400 font-bold uppercase">{getAltCurrency(displayArrears)}</div>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-600">
                        {new Date(tenant.paidUntil).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewHistory(tenant)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg"><History size={16} /></button>
                        <button onClick={() => recordPayment(tenant)} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg"><DollarSign size={16} /></button>
                        <button onClick={() => handleEdit(tenant)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => deleteTenant(tenant)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. VACATE MODAL */}
      {vacateModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="font-bold text-gray-800 text-xl">Vacate Tenant?</h2>
              <p className="text-sm text-gray-500 mt-2">Moving <b>{vacateModal.tenant?.name}</b> to archive.</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium" value={vacateModal.reason} onChange={(e) => setVacateModal({...vacateModal, reason: e.target.value})}>
                  <option value="">Select reason...</option>
                  <option value="End of Lease">End of Lease</option>
                  <option value="Eviction">Eviction</option>
                  <option value="Relocation">Relocation</option>
              </select>
              <div className="flex gap-3">
                <button disabled={loading} onClick={() => setVacateModal({show: false, tenant: null, reason: ""})} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
                <button disabled={loading} onClick={handleVacateConfirm} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg disabled:opacity-50">
                  {loading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HISTORY MODAL */}
      {viewHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <h2 className="font-bold text-xl text-gray-800">History: {viewHistory.name}</h2>
                    <button onClick={() => setViewHistory(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                    {viewHistory.paymentHistory?.length > 0 ? (
                        viewHistory.paymentHistory.map((h: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{h.date}</p>
                                    <p className="font-bold text-gray-700">Payment Received</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-emerald-600">+{Number(h.amount || 0).toLocaleString()} UGX</p>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase">{h.altAmount || getAltCurrency(h.amount || 0)}</p>
                                </div>
                            </div>
                        ))
                    ) : <p className="text-center text-gray-400 py-10">No history available</p>}
                </div>
            </div>
        </div>
      )}

      {/* 3. PAYMENT MODAL */}
      {paymentModal.show && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 text-center border-b border-gray-50">
              <h2 className="font-bold text-gray-800 text-lg">Record Payment</h2>
              <p className="text-sm text-gray-500">{paymentModal.tenant?.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-xl text-center">
                <p className="text-[10px] font-bold text-blue-400 uppercase">Total Arrears Due</p>
                <p className="font-black text-blue-900">{formatUgx(paymentModal.amount)}</p>
                <p className="text-[10px] font-bold text-blue-400 uppercase mt-1">({getAltCurrency(paymentModal.amount)})</p>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400 text-xs font-bold uppercase">UGX</span>
                  <input type="number" className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" value={paymentModal.amount} onChange={(e) => setPaymentModal({...paymentModal, amount: Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button disabled={loading} onClick={() => setPaymentModal({show: false, tenant: null, amount: 0})} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancel</button>
                <button disabled={loading} onClick={handleProcessPayment} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg disabled:opacity-50">
                   {loading ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADD/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800 text-lg">{newTenant.id ? "Edit Tenant" : "New Tenant"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Full Name" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Phone" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newTenant.contact} onChange={(e) => setNewTenant({ ...newTenant, contact: e.target.value })} />
                <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm" value={newTenant.propertyId} onChange={(e) => setNewTenant({ ...newTenant, propertyId: e.target.value })}>
                  <option value="">Select Unit</option>
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative col-span-2 md:col-span-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Rent (UGX)</label>
                   <div className="relative mt-1">
                      <span className="absolute left-3 top-3.5 text-gray-400 text-xs font-bold">UGX</span>
                      <input type="number" placeholder="Rent Amount" className="w-full pl-12 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" value={newTenant.rentAmount} onChange={(e) => handleAmountChange(e.target.value, "UGX", "rentAmount")} />
                   </div>
                </div>

                <div className="relative col-span-2 md:col-span-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Rent (USD Estimate)</label>
                   <div className="relative mt-1">
                      <span className="absolute left-3 top-3.5 text-gray-400 text-xs font-bold">USD</span>
                      <input type="number" placeholder="USD Amount" className="w-full pl-12 p-3 bg-blue-50/50 border border-blue-100 rounded-xl outline-none font-bold text-blue-700" value={(newTenant.rentAmount / (exchangeRate || 3800)).toFixed(2)} onChange={(e) => handleAmountChange(e.target.value, "USD", "rentAmount")} />
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Frequency</label>
                   <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" value={newTenant.rentFrequency} onChange={(e) => setNewTenant({ ...newTenant, rentFrequency: e.target.value })}>
                    <option value="Monthly">Monthly</option>
                    <option value="3 Months">Quarterly</option>
                    <option value="6 Months">Bi-Annual</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Paid Until</label>
                   <input type="date" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold" value={newTenant.paidUntil} onChange={(e) => setNewTenant({ ...newTenant, paidUntil: e.target.value })} />
                </div>
              </div>

              <button disabled={loading} onClick={saveTenant} className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-md mt-2 disabled:opacity-50">
                {loading ? "Saving Tenant..." : "Save Tenant Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;