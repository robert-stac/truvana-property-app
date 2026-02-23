import { Link, useLocation } from "react-router-dom";
import { Home, Building2, FileText, PersonStanding, Wrench, UserX } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const linkClasses = (path: string) =>
    `flex items-center gap-1 px-4 py-2 rounded hover:bg-blue-700 hover:text-white transition ${
      location.pathname === path ? "bg-blue-700 text-white" : "text-gray-700"
    }`;

  return (
    <nav className="w-full bg-white shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-50">
      <h1 className="text-xl font-bold text-blue-700">Truvana Holdings.</h1>

      <div className="flex gap-4">
        <Link to="/" className={linkClasses("/")}>
          <Home size={16} /> Dashboard
        </Link>
        <Link to="/properties" className={linkClasses("/properties")}>
          <Building2 size={16} /> Properties
        </Link>
        <Link to="/tenants" className={linkClasses("/tenants")}>
          <PersonStanding size={16} /> Tenants
        </Link>
        <Link to="/repairs" className={linkClasses("/repairs")}>
          <Wrench size={16} /> Repairs
        </Link>
        <Link to="/reports" className={linkClasses("/reports")}>
          <FileText size={16} /> Reports
        </Link>
        <Link to="/vacated" className={linkClasses("/vacated")}>
          <UserX size={16} /> Vacated
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;