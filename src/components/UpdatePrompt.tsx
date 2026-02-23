import React, { useState } from 'react';
import { DownloadCloud, X, RefreshCw } from 'lucide-react';

const UpdatePrompt: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    setIsUpdating(true);
    // Give it a tiny delay for the spinner to show before the refresh
    setTimeout(() => {
      updateServiceWorker(true);
    }, 800);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999]">
      <div className="bg-blue-900 text-white p-6 rounded-[2rem] shadow-2xl border border-blue-400 max-w-sm animate-in fade-in slide-in-from-bottom-10 duration-500">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className={`p-3 bg-blue-700 rounded-2xl ${isUpdating ? 'animate-spin' : 'animate-bounce'}`}>
              <DownloadCloud className="text-white" size={24} />
            </div>
            <div>
              <h4 className="font-black text-lg leading-tight">System Update</h4>
              <p className="text-xs text-blue-200 mt-1 font-medium">
                New features are ready for Truvana Holdings.
              </p>
            </div>
          </div>
          {!isUpdating && (
            <button onClick={close} className="text-blue-400 hover:text-white transition">
              <X size={20} />
            </button>
          )}
        </div>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="w-full mt-5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-lg"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              Installing...
            </>
          ) : (
            'Download & Restart'
          )}
        </button>
      </div>
    </div>
  );
};

export default UpdatePrompt;