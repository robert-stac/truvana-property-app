import React from "react";
import { Lock, CreditCard } from "lucide-react";

const SubscriptionOverlay: React.FC<{ onSelectPlan: () => void }> = ({ onSelectPlan }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-gray-100">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Inactive</h2>
        <p className="text-gray-500 mb-8 text-sm">
          Your access to the property management portal has expired. Please renew your subscription to continue.
        </p>
        <button 
          onClick={onSelectPlan}
          className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <CreditCard size={18} /> Renew Subscription
        </button>
      </div>
    </div>
  );
};

export default SubscriptionOverlay;