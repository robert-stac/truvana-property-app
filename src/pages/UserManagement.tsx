import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { UserPlus, Shield, User, Trash2, AlertTriangle, Mail, Loader2, Key, Building2 } from "lucide-react";

const UserManagement: React.FC = () => {
  const { registerNewUser, currentUser, resetUserPassword } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); 
  
  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  // Updated default to "owner" for Landlords
  const [role, setRole] = useState<"admin" | "owner">("owner");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time listener for users in Firestore
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("username", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
      setLoading(false);
    }, (error) => {
      console.error("User Listener Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Passes the role (admin or owner) to your register function
      await registerNewUser(email.trim(), password, username.trim(), role);
      setEmail("");
      setPassword("");
      setUsername("");
      setRole("owner");
      alert(`Account for ${username} created as ${role} successfully!`);
    } catch (error: any) {
      alert(`Creation Failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (email: string, name: string) => {
    if (window.confirm(`Send a secure password reset link to ${name} (${email})?`)) {
      try {
        await resetUserPassword(email);
        alert(`Reset link sent to ${email}.`);
      } catch (error: any) {
        alert("Error sending reset email: " + error.message);
      }
    }
  };

  // Updated toggleRole to include "owner" logic
  const toggleRole = async (uid: string, currentRole: string) => {
    if (uid === currentUser?.uid) {
      alert("Security Protocol: You cannot change your own administrative permissions.");
      return;
    }

    // Logic: Cycles Admin -> Owner -> Admin
    const newRole = currentRole === "admin" ? "owner" : "admin";
    
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
    } catch (err) {
      alert("Permission denied. Ensure your Firestore rules allow updating the 'role' field.");
    }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    if (uid === currentUser?.uid) {
      alert("Security Protocol: You cannot delete the active admin session.");
      return;
    }

    if (window.confirm(`PERMANENT ACTION: Remove all cloud access for ${name}?`)) {
      try {
        await deleteDoc(doc(db, "users", uid));
      } catch (err) {
        alert("Delete failed. This user might have active session locks.");
      }
    }
  };

  if (currentUser?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <AlertTriangle size={48} className="mb-4 text-orange-400" />
        <p className="font-bold text-lg">Access Denied</p>
        <p className="text-sm italic">This directory is restricted to System Administrators only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 text-left px-4">
      <div className="px-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Personnel</h1>
        <p className="text-gray-500 text-sm mt-1">Manage Admins & Landlords • Truvana Holdings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create User Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit sticky top-24">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <UserPlus size={18} className="text-blue-600" /> Provision Account
          </h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                type="text" required
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" required
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@truvana.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Initial Password</label>
              <input 
                type="password" required
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Designated Role</label>
              <select 
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="owner">Landlord (Property Owner)</option>
                <option value="admin">System Admin (Full Control)</option>
              </select>
            </div>
            <button 
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md flex items-center justify-center gap-2 transition-all disabled:bg-blue-300"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Create User"}
            </button>
          </form>
        </div>

        {/* User List Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Cloud Directory</h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold uppercase tracking-widest">Live Sync</span>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-20 flex flex-col items-center gap-4 text-gray-400">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-xs font-medium uppercase tracking-widest">Querying Firestore...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 text-left">User Profile</th>
                    <th className="px-6 py-4 text-left">Role Assignment</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                            {u.role === 'admin' ? <Shield size={18}/> : <Building2 size={18}/>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-sm">{u.username}</span>
                              {u.uid === currentUser?.uid && (
                                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-tighter">Active Session</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Mail size={10} /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleRole(u.uid, u.role)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-tighter cursor-pointer hover:shadow-sm transition-all border ${
                            u.role === 'admin' 
                              ? 'bg-purple-50 text-purple-700 border-purple-100' 
                              : 'bg-orange-50 text-orange-700 border-orange-100'
                          }`}
                        >
                          {u.role === 'admin' ? 'Admin' : 'Landlord'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleResetPassword(u.email, u.username)}
                            className="p-2.5 rounded-xl text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-all"
                            title="Reset Password"
                          >
                            <Key size={18} />
                          </button>

                          <button 
                            onClick={() => handleDeleteUser(u.uid, u.username)}
                            disabled={u.uid === currentUser?.uid}
                            className={`p-2.5 rounded-xl transition-all ${
                              u.uid === currentUser?.uid 
                                ? 'text-gray-200 cursor-not-allowed' 
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;