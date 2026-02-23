import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc
} from "firebase/firestore";
import { Users, ShieldAlert, Lock, Unlock, Trash2 } from "lucide-react";

const SuperAdmin: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubConfig = onSnapshot(doc(db, "config", "license"), (doc) => {
      setSystemConfig(doc.data());
    });

    return () => { unsubUsers(); unsubConfig(); };
  }, []);

  const toggleMasterLock = async () => {
    const newStatus = !systemConfig?.isLocked;
    if (window.confirm(`Turn ${newStatus ? "ON" : "OFF"} Master Lock?`)) {
      await updateDoc(doc(db, "config", "license"), { isLocked: newStatus });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "expired" : "active";
    await updateDoc(doc(db, "users", userId), { subscriptionStatus: newStatus });
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (window.confirm(`Are you sure you want to delete ${userEmail}? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, "users", userId));
        alert("User record deleted from database.");
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-left">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Portal</h1>
          <p className="text-gray-500">Internal Developer Controls</p>
        </div>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-3">
          <Users size={20} />
          <span className="font-bold">{users.length} Total Users</span>
        </div>
      </div>

      {/* MASTER KILL SWITCH */}
      <div className={`p-6 rounded-3xl mb-10 border-2 flex items-center justify-between ${systemConfig?.isLocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${systemConfig?.isLocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            <ShieldAlert size={30} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Master System Lock</h2>
            <p className="text-gray-600">Currently: {systemConfig?.isLocked ? "LOCKED" : "ACTIVE"}</p>
          </div>
        </div>
        <button onClick={toggleMasterLock} className={`px-8 py-3 rounded-xl font-bold text-white ${systemConfig?.isLocked ? 'bg-green-600' : 'bg-red-600'}`}>
          {systemConfig?.isLocked ? "Unlock System" : "Lock Entire App"}
        </button>
      </div>

      {/* USER LIST */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase">User Email</th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase">Role</th>
              <th className="px-6 py-4 font-bold text-gray-400 uppercase">Status</th>
              <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 font-medium text-gray-900">{user.email}</td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 rounded bg-gray-100 text-xs font-bold">{user.role}</span>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.subscriptionStatus || 'inactive'}
                   </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => toggleUserStatus(user.id, user.subscriptionStatus)} className="p-2 hover:bg-gray-100 rounded-lg">
                    {user.subscriptionStatus === 'active' ? <Lock size={18} className="text-red-500" /> : <Unlock size={18} className="text-green-500" />}
                  </button>
                  <button onClick={() => handleDeleteUser(user.id, user.email)} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdmin;