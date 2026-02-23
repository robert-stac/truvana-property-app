import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Save, 
  X, 
  MapPin, 
  Layers, 
  FileText, 
  ArrowLeft,
  CheckCircle2
} from "lucide-react";

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    units: "",
    type: "Residential",
    description: "",
    status: "Active"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Logic to save to LocalStorage
    const existingProperties = JSON.parse(localStorage.getItem("properties") || "[]");
    const newProperty = {
      id: crypto.randomUUID(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem("properties", JSON.stringify([...existingProperties, newProperty]));
    
    setIsSaved(true);
    setTimeout(() => {
      navigate("/dashboard"); // Redirect after success
    }, 1500);
  };

  if (isSaved) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="bg-green-100 text-green-600 p-6 rounded-full animate-bounce">
          <CheckCircle2 size={60} />
        </div>
        <h2 className="text-3xl font-black uppercase text-gray-800">Property Registered!</h2>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Updating Global Registry...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 pb-12 animate-in fade-in duration-500">
      
      {/* Top Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Portfolio
          </button>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-4">
            <Building2 className="text-blue-700" size={40} />
            Add New Property
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1 ml-1">
            Global Asset Entry • Truvana Holdings.
          </p>
        </div>

        <button 
          onClick={() => navigate("/dashboard")}
          className="p-4 bg-white text-gray-400 rounded-2xl border border-gray-100 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Wide Form Container */}
      <form onSubmit={handleSubmit} className="w-full bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Form Body */}
        <div className="p-10 xl:p-20 space-y-16">
          
          {/* Section 1: Basic Identity */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
               <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Layers size={18}/></div>
               <h3 className="font-black text-gray-800 uppercase tracking-tighter text-xl">Core Identity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Property Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Truvana Holdings Heights"
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-bold transition-all text-gray-800"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Location / Address</label>
                <div className="relative">
                  <input 
                    required
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Kampala Central"
                    className="w-full p-5 pl-14 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-bold transition-all text-gray-800"
                  />
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Total Units</label>
                <input 
                  required
                  type="number" 
                  value={formData.units}
                  onChange={(e) => setFormData({...formData, units: e.target.value})}
                  placeholder="Number of rooms/shops"
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-bold transition-all text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Detailed Specs */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
               <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><FileText size={18}/></div>
               <h3 className="font-black text-gray-800 uppercase tracking-tighter text-xl">Classification & Notes</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Property Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-bold transition-all text-gray-800 appearance-none"
                >
                  <option>Residential</option>
                  <option>Commercial</option>
                  <option>Mixed Use</option>
                  <option>Industrial</option>
                </select>
              </div>

              <div className="md:col-span-3 space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">General Description</label>
                <textarea 
                  rows={1}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe amenities, proximity to roads, etc."
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-bold transition-all text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-10 xl:px-20 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3 text-gray-400 italic">
              <CheckCircle2 size={18} />
              <span className="text-xs font-bold">All changes are localized to your device storage.</span>
           </div>
           
           <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 md:flex-none px-10 py-5 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:text-gray-700 transition-colors"
              >
                Discard
              </button>
              <button 
                type="submit"
                className="flex-1 md:flex-none px-16 py-5 bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-800 transition-all flex items-center justify-center gap-3"
              >
                <Save size={18} />
                Confirm & Register
              </button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default AddProperty;