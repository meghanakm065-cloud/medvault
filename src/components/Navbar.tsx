import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User, Activity } from 'lucide-react';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return (
    <nav className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">MedVault</span>
      </div>
    </nav>
  );

  return (
    <nav className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
      <Link to={profile?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transition-transform hover:scale-105">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">MedVault</span>
      </Link>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end mr-1">
          <span className="text-sm font-semibold text-slate-800">{profile?.name || 'User'}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {profile?.role === 'doctor' ? `DR • ${profile.degree}` : `Patient ID: ${profile?.uid.slice(0, 8)}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold uppercase overflow-hidden">
            {profile?.name?.slice(0, 2) || <User className="w-5 h-5" />}
          </div>
          <button 
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Logout"
            id="logout-btn"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
