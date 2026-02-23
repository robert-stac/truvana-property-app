import React from 'react';
import { Building2 } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-blue-900 z-[9999]">
      {/* Animated Logo Container */}
      <div className="relative flex flex-col items-center animate-pulse">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-blue-900 shadow-2xl mb-6">
          <Building2 size={40} />
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">
            Truvana Holdings.
          </h1>
                </div>
      </div>

      {/* Loading Bar */}
      <div className="mt-12 w-48 h-1 bg-blue-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-400 animate-loading-bar origin-left"></div>
      </div>
      
      <p className="mt-4 text-blue-200/50 text-[10px] font-bold uppercase tracking-widest">
        Securing Session...
      </p>

      {/* Custom CSS for the bar animation if not in your tailwind config */}
      <style>{`
        @keyframes loading-bar {
          0% { transform: scaleX(0); }
          50% { transform: scaleX(0.7); }
          100% { transform: scaleX(1); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;