import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LogIn, ShieldAlert, Eye, EyeOff } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState(""); // Changed from username to email for Firebase
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, loginWithGoogle } = useAuth(); // Added loginWithGoogle

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = "/property-app-updates/"; 
    } catch (err: any) {
      setError("Invalid credentials. Please use your registered email and password.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      window.location.href = "/property-app-updates/";
    } catch (err: any) {
      setError("Google Sign-In failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-white/10">
        
        {/* Logo Section */}
        <div className="text-center">
          <div className="mx-auto h-30 w-30 bg-blue-900 rounded-2xl flex items-center justify-center overflow-hidden mb-6 shadow-xl ring-4 ring-blue-50">
            <img 
              src="/pwa-512x512.png" 
              alt="Truvana Holdings. Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-black text-blue-900 tracking-tight uppercase leading-none">
            Truvana Holdings.
          </h2>
          
          <p className="mt-1 text-[10px] text-blue-800 font-bold uppercase tracking-[0.2em]">
            Property Management System
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-bold animate-pulse">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div className="text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field with Toggle */}
            <div className="text-left">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            <span className="absolute left-4 inset-y-0 flex items-center">
              <LogIn className="h-5 w-5 text-blue-300" />
            </span>
            Secure Sign In
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-100"></span>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">Or continue with</span>
          </div>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98] shadow-sm"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            className="w-5 h-5" 
            alt="Google" 
          />
          Sign in with Google
        </button>

        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-8">
          Authorized Access Only
        </p>
      </div>
    </div>
  );
};

export default Login;