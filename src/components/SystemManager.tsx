import React, { useState } from 'react';
import { Database, Download, Upload, ShieldCheck, Server, CloudSync, AlertCircle } from 'lucide-react';
// --- FIREBASE IMPORTS ---
import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  writeBatch 
} from "firebase/firestore";

const SystemManager: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  // --- CLOUD EXPORT LOGIC ---
  const exportData = async () => {
    setIsSyncing(true);
    try {
      // Fetch all collections from the cloud to ensure the backup is current
      const collections = ["properties", "tenants", "repairs", "vacatedTenants"];
      const backup: any = { timestamp: new Date().toISOString() };

      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        backup[colName] = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Truvana Holdings_Cloud_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      alert("Export failed. Please check your internet connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  // --- CLOUD IMPORT (RESTORE) LOGIC ---
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (window.confirm("WARNING: This will upload this backup to the CLOUD and affect all linked devices (including your Samsung phone). Continue?")) {
          setIsSyncing(true);
          const batch = writeBatch(db);

          // Map through the backup data and prepare cloud writes
          if (data.properties) data.properties.forEach((p: any) => batch.set(doc(db, "properties", p.id), p));
          if (data.tenants) data.tenants.forEach((t: any) => batch.set(doc(db, "tenants", t.id), t));
          if (data.repairs) data.repairs.forEach((r: any) => batch.set(doc(db, "repairs", r.id), r));
          if (data.vacatedTenants) data.vacatedTenants.forEach((v: any) => batch.set(doc(db, "vacatedTenants", v.id), v));

          await batch.commit();
          alert("Cloud Database restored and synchronized successfully!");
          window.location.reload();
        }
      } catch (err) {
        alert("Invalid backup file. Please ensure you are using a genuine Truvana Holdings. JSON file.");
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8 pb-12 px-4">
      
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-blue-900 text-white rounded-2xl shadow-lg">
            <Server size={28} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-blue-900 uppercase tracking-tight">System Settings</h2>
            <p className="text-gray-500 font-semibold text-[10px] uppercase tracking-[0.2em]">Cloud Configuration & Backups</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Software Status Section */}
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">System Version</h3>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-100">V3.1.0 Cloud</span>
            </div>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
                Your application is now linked to Firebase. Data is automatically synchronized between your devices.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl text-blue-700">
              <ShieldCheck size={20} className="text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-widest">Cloud Sync Active</span>
          </div>
        </div>

        {/* Backup Section */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
            <h3 className="font-bold text-lg text-gray-800 uppercase tracking-tight">Cloud Data Management</h3>
            <Database className="text-blue-900/10" size={32} />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wide">Download Cloud Backup</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                    Generate a JSON file containing all data currently stored in the cloud. Use this for offline archiving.
                </p>
                <button
                onClick={exportData}
                disabled={isSyncing}
                className="w-full bg-blue-900 text-white py-3.5 rounded-xl font-bold hover:bg-blue-800 flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                <Download size={18} /> {isSyncing ? "SYNCING..." : "DOWNLOAD BACKUP"}
                </button>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wide">Restore to Cloud</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                    Upload a backup file to overwrite the cloud database. This will update your device simultaneously.
                </p>
                <label className={`w-full border-2 border-dashed border-gray-200 text-gray-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all text-xs ${isSyncing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload size={18} /> {isSyncing ? "UPLOADING..." : "UPLOAD BACKUP FILE"}
                    <input type="file" className="hidden" onChange={importData} accept=".json" />
                </label>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Connectivity Banner */}
      <div className="bg-blue-900 p-6 rounded-[1.5rem] flex flex-col md:flex-row gap-6 items-center shadow-xl">
        <div className="p-4 bg-blue-800 text-white rounded-xl shadow-inner">
            <CloudSync size={24} />
        </div>
        <div>
            <p className="text-[11px] text-blue-200 font-bold uppercase mb-1 tracking-wider">Multi-Device Synchronization</p>
            <p className="text-xs text-white leading-relaxed font-medium">
                Truvana Holdings system is now <strong>Cloud-Enabled</strong>. Changes made on this device will appear on all the other devices linked to this account 
                instantly. Always ensure you have a stable internet connection for real-time updates.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SystemManager;