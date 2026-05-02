import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Stethoscope, 
  Search, 
  QrCode, 
  ArrowRight, 
  Activity, 
  Clock, 
  UserPlus,
  AlertCircle,
  Users,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import QRScannerModal from '../components/QRScannerModal';

interface RecentPatient {
  id: string;
  name: string;
  lastViewed: number;
}

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('recentPatients');
    if (saved) {
      setRecentPatients(JSON.parse(saved));
    }
  }, []);

  const addToRecent = (id: string, name: string) => {
    const updated = [
      { id, name, lastViewed: Date.now() },
      ...recentPatients.filter(p => p.id !== id)
    ].slice(0, 5);
    setRecentPatients(updated);
    localStorage.setItem('recentPatients', JSON.stringify(updated));
  };

  const handleSearch = async (e?: React.FormEvent, idToSearch?: string) => {
    if (e) e.preventDefault();
    const id = idToSearch || patientId;
    if (!id.trim()) return;

    setLoading(true);
    setError('');

    try {
      const trimmedId = id.trim();
      const patientDoc = await getDoc(doc(db, 'users', trimmedId));
      
      if (!patientDoc.exists()) {
        setError('Patient ID not found. Please verify and try again.');
      } else {
        const data = patientDoc.data();
        if (data.role !== 'patient') {
          setError('This ID belongs to another doctor, not a patient.');
        } else {
          addToRecent(trimmedId, data.name);
          navigate(`/doctor/patient/${trimmedId}`);
        }
      }
    } catch (err) {
      setError('An error occurred while searching.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {showScanner && (
        <QRScannerModal 
          onScan={(id) => {
            setShowScanner(false);
            handleSearch(undefined, id);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      <main className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-6">
        
        {/* Welcome Block (Bento 1) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-8 md:row-span-2 bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-100"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Stethoscope className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Medical Practitioner</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Good day, Dr. {profile.name}</h2>
            <p className="text-blue-100 mt-2 font-medium opacity-80">{profile.degree} • Active Session</p>
          </div>
          <Activity className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10" />
        </motion.div>

        {/* Stats Block (Bento 2) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 md:col-span-4 md:row-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center"
        >
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-slate-800 tracking-tight">System Online</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Biometric Sync Active</p>
        </motion.div>

        {/* Search Block (Bento 3) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-1 md:col-span-4 md:row-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col"
        >
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Patient Inquiry</h3>
          <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">Search Database</h3>
          <p className="text-slate-500 text-xs mb-6">Connect to patient vault via unique ID.</p>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Patient ID..."
                required
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono text-xs"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase px-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}
          </form>
        </motion.div>

        {/* QR Scan Block (Bento 4) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-1 md:col-span-4 md:row-span-2 bg-slate-900 rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between group"
        >
          <div className="flex justify-between items-start">
            <div className="bg-slate-800 w-10 h-10 rounded-xl flex items-center justify-center text-blue-400 group-hover:text-white transition-colors">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight mb-2">QR Scan Access</h3>
            <button 
              onClick={() => setShowScanner(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-900/20"
            >
              Start Camera
            </button>
          </div>
        </motion.div>

        {/* AI Med Ref Block (Bento 5) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-1 md:col-span-4 md:row-span-2 bg-indigo-50 border border-indigo-100 rounded-3xl p-6 flex flex-col justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-indigo-900 font-black text-sm tracking-tight">Healthu AI</p>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Medical Assistant</p>
            </div>
          </div>
          <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
            Need a quick reference or explanation for medical terms? Ask Healthu.
          </p>
        </motion.div>

        {/* Recent Consultations Block (Bento 6) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="col-span-1 md:col-span-8 md:row-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-slate-800 font-black tracking-tight">Quick Access</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase">Recent</span>
            </div>
            <Users className="w-4 h-4 text-slate-300" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentPatients.length === 0 ? (
              <div className="col-span-full py-4 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No recent patients</p>
              </div>
            ) : (
              recentPatients.map((p) => (
                <button 
                  key={p.id}
                  onClick={() => navigate(`/doctor/patient/${p.id}`)}
                  className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 rounded-2xl transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-blue-600 font-black text-[10px]">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-black text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {p.id.slice(0, 8)}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </button>
              ))
            )}
          </div>
        </motion.div>

      </main>
    </div>
  );
}
