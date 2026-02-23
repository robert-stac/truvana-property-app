import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Import your auth hook

const MainSystemGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth(); // Get user data
  const [isLocked, setIsLocked] = useState(false);
  const [message, setMessage] = useState("");
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "license"), (doc) => {
      if (doc.exists()) {
        setIsLocked(doc.data().isLocked);
        setMessage(doc.data().message);
      }
      setConfigLoading(false);
    });
    return () => unsub();
  }, []);

  // Wait for both Auth and Config to load
  if (authLoading || configLoading) return null; 

  // --- THE SAFETY CATCH ---
  // If the system is locked, but the user is the Super Admin, bypass the lock!
  if (isLocked && !currentUser?.isSuperAdmin) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-[9999] p-6">
        <div className="bg-white p-10 rounded-3xl max-w-lg text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Service Suspended</h1>
          <p className="text-gray-600 mb-8">{message}</p>
          <div className="text-sm font-mono text-gray-400 border-t pt-4 uppercase tracking-widest">
            Contact Developer for Activation
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default MainSystemGuard;