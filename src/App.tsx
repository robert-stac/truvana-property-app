import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SystemManager from './components/SystemManager';
import SplashScreen from './components/SplashScreen'; 
import MainSystemGuard from './components/MainSystemGuard';
import { Lock } from 'lucide-react';

// Pages
import Dashboard from './pages/dashboard';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants';
import Reports from './pages/Reports';
import AddProperty from './pages/AddProperty';
import VacatedTenants from './pages/VacatedTenants';
import Repairs from './pages/Repairs';
import Login from './pages/Login'; 
import UserManagement from './pages/UserManagement';
import SuperAdmin from './pages/SuperAdmin';

// Context
import { CurrencyProvider } from './context/CurrencyContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// --- SUB-COMPONENT TO PROTECT CONTENT ---
const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <SplashScreen />;
  }

  // 1. LOGIN IS ALWAYS ACCESSIBLE
  if (!currentUser) {
    return <Login />;
  }

  // 2. INDIVIDUAL LOCK LOGIC (Landlords)
  const isIndividualLocked = currentUser?.subscriptionStatus !== 'active' && !currentUser?.isSuperAdmin;

  if (isIndividualLocked) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center p-10 bg-white rounded-3xl border border-gray-100 shadow-sm mt-10">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <Lock size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Account Restricted</h2>
          <p className="text-gray-500 mt-4 max-w-md">
            Your access to the Truvana Cloud has been suspended. Please contact the system administrator to settle your subscription.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<SplashScreen />}> 
        <Routes>
          {/* SUPER ADMIN PORTAL: Outside the MainSystemGuard */}
          <Route path="/super-portal" element={
            currentUser?.isSuperAdmin === true ? <SuperAdmin /> : <Navigate to="/" />
          } />

          {/* ALL OTHER ROUTES: Wrapped in the MainSystemGuard */}
          <Route path="*" element={
            <MainSystemGuard>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/add-property" element={<AddProperty />} />
                <Route path="/repairs" element={<Repairs />} />
                <Route path="/vacated" element={<VacatedTenants />} />
                <Route path="/settings" element={<SystemManager />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainSystemGuard>
          } />
        </Routes>
      </Suspense>
    </Layout>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // --- DATA MIGRATION SCRIPT (V1 to V2) ---
    const CURRENT_VERSION = "2.0";
    const installedVersion = localStorage.getItem("app_version");

    if (installedVersion !== CURRENT_VERSION) {
      const storedTenants = JSON.parse(localStorage.getItem("tenants") || "[]");
      const updatedTenants = storedTenants.map((t: any) => ({
        ...t,
        propertyId: t.propertyId || "unassigned",
        balance: Number(t.balance || 0),
        amountPaid: Number(t.amountPaid || 0),
        nextPaymentDate: t.nextPaymentDate || new Date().toISOString().split('T')[0]
      }));
      localStorage.setItem("tenants", JSON.stringify(updatedTenants));

      const storedRepairs = JSON.parse(localStorage.getItem("repairs") || "[]");
      const updatedRepairs = storedRepairs.map((r: any) => ({
        ...r,
        propertyId: r.propertyId || "unassigned",
        cost: Number(r.cost || 0),
        issue: r.issue || r.description || "Unspecified Repair"
      }));
      localStorage.setItem("repairs", JSON.stringify(updatedRepairs));

      const storedProperties = JSON.parse(localStorage.getItem("properties") || "[]");
      const updatedProperties = storedProperties.map((p: any) => ({
        ...p,
        id: p.id?.toString() || Math.random().toString(36).substr(2, 9)
      }));
      localStorage.setItem("properties", JSON.stringify(updatedProperties));

      localStorage.setItem("app_version", CURRENT_VERSION);
      // Removed import.meta.env.BASE_URL to prevent routing errors on Vercel
      window.location.assign(window.location.origin + "/");
    }
  }, []);

  return (
    <AuthProvider>
      <CurrencyProvider>
        {/* Removed basename to ensure root-level serving on Vercel */}
        <Router>
          <div className="min-h-screen bg-gray-50 font-sans antialiased">
            <AppContent />
          </div>
        </Router>
      </CurrencyProvider>
    </AuthProvider>
  );
};

export default App;