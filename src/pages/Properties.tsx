import React, { useEffect, useState } from "react";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext"; // IMPORTED AUTH
import { Building2, Search, Home, MapPin, Users, Edit3, Trash2, PlusCircle, UserCircle } from "lucide-react";
// --- FIREBASE IMPORTS ---
import { db } from "../firebase";
import { 
  collection, onSnapshot, addDoc, updateDoc, 
  deleteDoc, doc, query, serverTimestamp, where, getDocs 
} from "firebase/firestore";

interface Property {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string;
  ownerId: string; // NEW: Track who owns this
}

interface Tenant {
  id: string;
  name: string;
  propertyId: string;
}

interface Owner {
  uid: string;
  username: string;
}

const Properties: React.FC = () => {
  const { formatUgx, currency, exchangeRate } = useCurrency();
  const { currentUser } = useAuth(); // GET CURRENT USER & ROLE
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]); // NEW: For the Admin dropdown
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState<Omit<Property, "id">>({
    name: "",
    location: "",
    price: 0,
    description: "",
    ownerId: "", // Default empty
  });
  
  const [usdDisplay, setUsdDisplay] = useState<string>("0");

  // --- 1. REAL-TIME FIREBASE SYNC (FILTERED BY ROLE) ---
  useEffect(() => {
    if (!currentUser) return;

    // Determine the query based on role
    const propertiesRef = collection(db, "properties");
    const q = currentUser.role === "admin" 
      ? query(propertiesRef) // Admin sees all
      : query(propertiesRef, where("ownerId", "==", currentUser.uid)); // Owners see their own

    const unsubscribeProps = onSnapshot(q, (snapshot) => {
      const propList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Property[];
      setProperties(propList);
    });

    const unsubscribeTenants = onSnapshot(collection(db, "tenants"), (snapshot) => {
      const tenantList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tenant[];
      setTenants(tenantList);
    });

    return () => {
      unsubscribeProps();
      unsubscribeTenants();
    };
  }, [currentUser]);

  // --- 2. FETCH OWNERS LIST (FOR ADMIN DROPDOWN) ---
  useEffect(() => {
    if (currentUser?.role === "admin") {
      const fetchOwners = async () => {
        const q = query(collection(db, "users"), where("role", "==", "owner"));
        const snapshot = await getDocs(q);
        const ownerList = snapshot.docs.map(doc => ({
          uid: doc.id,
          username: doc.data().username || "Unknown Owner"
        }));
        setOwners(ownerList);
      };
      fetchOwners();
    }
  }, [currentUser]);

  const getAltCurrency = (amount: number) => {
    const rate = exchangeRate || 3800; 
    if (currency === "UGX") {
      return `USD $${(amount / rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `UGX ${(amount * rate).toLocaleString()}`;
    }
  };

  const handleUgxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ugxValue = Number(e.target.value);
    const rate = exchangeRate || 3800;
    setFormData({ ...formData, price: ugxValue });
    setUsdDisplay((ugxValue / rate).toFixed(2));
  };

  const handleUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const usdValue = Number(e.target.value);
    const rate = exchangeRate || 3800;
    setUsdDisplay(e.target.value);
    setFormData({ ...formData, price: Math.round(usdValue * rate) });
  };

  // --- CLOUD SUBMIT LOGIC ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Admins must select an owner
    if (currentUser?.role === "admin" && !formData.ownerId) {
        alert("Please assign an owner to this property.");
        return;
    }

    try {
      // If an owner adds a property, it's automatically theirs
      const finalOwnerId = currentUser?.role === "admin" ? formData.ownerId : currentUser?.uid;

      if (editingId) {
        const propRef = doc(db, "properties", editingId);
        await updateDoc(propRef, {
          ...formData,
          ownerId: finalOwnerId,
          updatedAt: serverTimestamp()
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "properties"), {
          ...formData,
          ownerId: finalOwnerId,
          createdAt: serverTimestamp()
        });
      }
      setFormData({ name: "", location: "", price: 0, description: "", ownerId: "" });
      setUsdDisplay("0");
    } catch (err) {
      console.error("Firebase Error:", err);
      alert("Failed to save property to the cloud.");
    }
  };

  const handleEdit = (property: Property) => {
    const rate = exchangeRate || 3800;
    setEditingId(property.id);
    setFormData({
      name: property.name,
      location: property.location,
      price: property.price,
      description: property.description,
      ownerId: property.ownerId || ""
    });
    setUsdDisplay((property.price / rate).toFixed(2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const activeTenants = tenants.filter((t) => t.propertyId === id);
    if (activeTenants.length > 0) {
      alert(`Access Denied: Cannot delete. This property has ${activeTenants.length} active tenant(s).`);
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this property?")) return;
    
    try {
      await deleteDoc(doc(db, "properties", id));
    } catch (err) {
      alert("Error deleting property from cloud.");
    }
  };

  const getTenantCount = (propertyId: string) => tenants.filter((t) => t.propertyId === propertyId).length;

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             Properties
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {currentUser?.role === 'admin' ? "Managing all Truvana Holdings assets" : "Your assigned property portfolio"}
          </p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2.5 pl-10 pr-4 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* Entry Form - Only show to Admin (or owners if you allow them to add) */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className={`p-2 rounded-lg ${editingId ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                {editingId ? <Edit3 size={20}/> : <PlusCircle size={20}/>}
            </div>
            <h2 className="text-lg font-bold text-gray-900">
            {editingId ? "Edit Property Details" : "Register New Property"}
            </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Property Name</label>
            <input 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              required 
              placeholder="e.g. Truvana Plaza"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all" 
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Location</label>
            <input 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
              required 
              placeholder="e.g. Kampala Central"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all" 
            />
          </div>

          {/* ADMIN ONLY: OWNER DROPDOWN */}
          {currentUser?.role === "admin" && (
            <div className="lg:col-span-1">
              <label className="block text-xs font-medium text-purple-700 mb-1.5">Assign Landlord (Owner)</label>
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({...formData, ownerId: e.target.value})}
                required
                className="w-full px-4 py-2.5 border border-purple-200 bg-purple-50/30 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-sm transition-all"
              >
                <option value="">-- Select Owner --</option>
                {owners.map(o => (
                  <option key={o.uid} value={o.uid}>{o.username}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <label className="block text-xs font-medium text-blue-700 mb-1.5">Monthly Rent (UGX)</label>
            <input 
                type="number" 
                value={formData.price || ""} 
                onChange={handleUgxChange} 
                className="w-full px-4 py-2.5 border border-blue-200 bg-blue-50/50 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold text-blue-900 transition-all" 
                placeholder="0" 
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-green-700 mb-1.5">Equivalent (USD)</label>
            <input 
                type="number" 
                step="0.01" 
                value={usdDisplay === "0" ? "" : usdDisplay} 
                onChange={handleUsdChange} 
                className="w-full px-4 py-2.5 border border-green-200 bg-green-50/50 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-sm font-semibold text-green-900 transition-all" 
                placeholder="0.00" 
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Description / Notes</label>
          <textarea 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
            placeholder="Add any additional details about amenities or condition..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all resize-y min-h-[80px]" 
            rows={2} 
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button type="submit" className={`px-6 py-2.5 rounded-lg font-semibold shadow-sm text-sm transition-all flex items-center gap-2 ${editingId ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            {editingId ? "Save Changes" : "Create Property"}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={() => { setEditingId(null); setFormData({name:"", location:"", price:0, description:"", ownerId: ""}); setUsdDisplay("0"); }} 
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">Property Inventory</h3>
            {currentUser?.role === 'admin' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">ADMIN VIEW</span>}
        </div>
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    {currentUser?.role === 'admin' && <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>}
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenants</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Rent</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredProperties.length === 0 ? (
                <tr><td colSpan={currentUser?.role === 'admin' ? 6 : 5} className="p-12 text-center text-gray-400 text-sm">No properties found.</td></tr>
                ) : (
                filteredProperties.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Home size={18}/>
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 text-sm">{p.name}</div>
                                <div className="text-xs text-gray-500 truncate max-w-xs mt-0.5">{p.description || "No description"}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <MapPin size={14} className="text-gray-400" />
                            {p.location}
                        </div>
                    </td>

                    {/* ADMIN ONLY: SHOW WHO OWNS IT */}
                    {currentUser?.role === 'admin' && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-purple-600 text-xs font-medium">
                          <UserCircle size={14} />
                          {owners.find(o => o.uid === p.ownerId)?.username || "Unassigned"}
                        </div>
                      </td>
                    )}

                    <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <Users size={12}/> {getTenantCount(p.id)} Occupied
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="font-bold text-gray-900 text-sm">{formatUgx(p.price)}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">
                           {getAltCurrency(p.price)}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(p)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                                <Edit3 size={16}/>
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                                <Trash2 size={16}/>
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
    </div>
  );
};

export default Properties;