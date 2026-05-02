import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import { doc, updateDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { OperationType, MedicalRecord } from '../types';
import { 
  Upload, 
  Clock, 
  User as UserIcon, 
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  FileText,
  ClipboardList,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { RemindersList } from '../components/RemindersList';

export default function PatientDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [recentRecords, setRecentRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecent = async () => {
      if (!profile) return;
      try {
        const q = query(
          collection(db, 'records'),
          where('patientId', '==', profile.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MedicalRecord[];
        setRecentRecords(data);
      } catch (err) {
        console.error('Recent records fetch failed:', err);
      } finally {
        setLoadingRecords(false);
      }
    };
    fetchRecent();
  }, [profile]);

  const toggleSharing = async () => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        sharingEnabled: !profile.sharingEnabled
      });
      await refreshProfile();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:h-[calc(100vh-120px)] lg:overflow-hidden lg:flex lg:flex-col">
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-6 h-full">
        
        {/* Profile Card (Bento Item 1) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-4 md:row-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Patient Health Profile</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 text-sm font-medium">Age / Gender</span>
                <span className="font-bold text-slate-800">{profile.age} / {profile.gender}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 text-sm font-medium">Blood Group</span>
                <span className="text-red-500 font-black uppercase tracking-tight">{profile.bloodGroup}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm font-medium">Name</span>
                <span className="font-bold text-slate-800 truncate pl-4">{profile.name}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/onboarding')}
            className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all border border-slate-100 mt-4 outline-none"
          >
            Update Profile
          </button>
        </motion.div>

        {/* QR Access Card (Bento Item 2) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 md:col-span-3 md:row-span-4 bg-blue-600 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-white text-center group"
        >
          <h3 className="text-blue-100 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Instant Doctor Access</h3>
          <div className="bg-white p-4 rounded-2xl mb-6 shadow-2xl transition-transform group-hover:scale-105 duration-500">
            <QRCodeCanvas 
              value={window.location.origin + `/doctor/patient/${profile.uid}`}
              size={140}
              level={"H"}
              includeMargin={false}
              className="rounded-lg"
            />
          </div>
          <p className="font-bold text-sm text-blue-50 mb-1">Clinic Scan Code</p>
          <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold">Valid Profile Sync</p>
        </motion.div>

        {/* Quick Actions (Bento Item 3) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-1 md:col-span-5 md:row-span-2 bg-white rounded-3xl p-4 shadow-sm border border-slate-100 grid grid-cols-2 gap-4"
        >
          <Link to="/patient/upload" className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all group p-4">
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Upload Record</span>
          </Link>
          <Link to="/patient/timeline" className="flex flex-col items-center justify-center bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all group p-4 shadow-lg shadow-slate-200">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-2 text-white group-hover:bg-blue-600 transition-all">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-black text-white uppercase tracking-tight">Full Timeline</span>
          </Link>
        </motion.div>

        {/* Privacy Control (Bento Item 4) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-1 md:col-span-4 md:row-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between"
        >
          <div>
            <h3 className="text-slate-800 font-black tracking-tight mb-0.5">Privacy Mode</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Secure Doc Access</p>
          </div>
          <button 
            onClick={toggleSharing}
            className={`w-14 h-8 rounded-full flex items-center px-1 relative transition-colors duration-300 ${profile.sharingEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
          >
            <motion.div 
              animate={{ x: profile.sharingEnabled ? 24 : 0 }}
              className="w-6 h-6 bg-white rounded-full shadow-md"
            />
          </button>
        </motion.div>

        {/* Recent Medical Records (Bento Item 5) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-1 md:col-span-5 md:row-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-800 font-black tracking-tight">Recent Records</h3>
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase tracking-tighter ring-1 ring-blue-100">Latest Sync</span>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {loadingRecords ? (
              <div className="h-full flex items-center justify-center text-slate-300">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : recentRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                <FileText className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No records found</p>
              </div>
            ) : (
              recentRecords.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all hover:bg-white group">
                  <div className={`w-10 h-10 rounded-xl shadow-sm flex items-center justify-center ${rec.type === 'prescription' ? 'bg-white text-purple-600' : 'bg-white text-blue-600'}`}>
                    {rec.type === 'prescription' ? <FileText className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">{rec.fileName}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{rec.createdAt?.toDate().toLocaleDateString()}</p>
                  </div>
                  <a href={rec.fileURL} target="_blank" rel="noreferrer" className="p-2 text-slate-300 hover:text-blue-600 hover:bg-white rounded-lg transition-all">
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
          <Link to="/patient/timeline" className="mt-4 text-center text-xs font-bold text-blue-600 hover:underline py-2 bg-slate-50 rounded-xl">
            View All Reports
          </Link>
        </motion.div>

        {/* Health Reminders (Bento Item 6) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="col-span-1 md:col-span-3 md:row-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
        >
          <RemindersList />
        </motion.div>

      </main>
    </div>
  );
}
