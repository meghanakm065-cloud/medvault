import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, MedicalRecord } from '../types';
import { 
  ArrowLeft, 
  ShieldAlert, 
  User, 
  Calendar, 
  ExternalLink, 
  FileText, 
  ClipboardList,
  Mail,
  MapPin,
  Activity,
  Droplet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DoctorPatientView() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<UserProfile | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setError('');

      try {
        // Fetch patient profile
        const patientDoc = await getDoc(doc(db, 'users', id));
        if (!patientDoc.exists()) {
          setError('Patient not found');
          setLoading(false);
          return;
        }

        const patientData = patientDoc.data() as UserProfile;
        setPatient(patientData);

        // Check sharing status
        if (!patientData.sharingEnabled) {
          setLoading(false);
          return;
        }

        // Fetch records if shared
        const q = query(
          collection(db, 'records'),
          where('patientId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const recordsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MedicalRecord[];
        setRecords(recordsData);

      } catch (err: any) {
        console.error('Error fetching patient data:', err);
        setError('Unauthorized access or network error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="font-bold text-gray-500 animate-pulse">Verifying Access...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto text-center mt-12 bg-white p-10 rounded-3xl border border-red-50 shadow-sm">
      <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
      <p className="text-gray-500 mb-8">{error}</p>
      <button 
        onClick={() => navigate('/doctor/dashboard')}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-8 py-3 rounded-2xl transition-all"
      >
        Return to Dashboard
      </button>
    </div>
  );

  if (patient && !patient.sharingEnabled) return (
    <div className="max-w-md mx-auto text-center mt-12 bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
      <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-500 mb-8">Patient <span className="font-bold text-gray-900">{patient.name}</span> has disabled data sharing for this account.</p>
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-left mb-8">
        <p className="text-sm text-blue-700 leading-relaxed font-medium">
          Note: Ask the patient to toggle "Sharing ON" in their dashboard to view their history.
        </p>
      </div>
      <button 
        onClick={() => navigate('/doctor/dashboard')}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg"
      >
        Go Back
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/doctor/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <div className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ring-1 ring-green-100">
          <Activity className="w-3.5 h-3.5" /> SECURE ACCESS GRANTED
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Patient Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 border-2 border-white shadow-sm">
                <User className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{patient?.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 mb-6">
                <Mail className="w-3.5 h-3.5" />
                {patient?.email}
              </div>

              <div className="w-full grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 p-3 rounded-2xl text-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">Age</span>
                  <span className="font-bold text-gray-900">{patient?.age} yrs</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl text-center">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">Gender</span>
                  <span className="font-bold text-gray-900">{patient?.gender}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl text-center col-span-2 flex items-center justify-center gap-2">
                  <Droplet className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-gray-900">Blood Group: {patient?.bloodGroup}</span>
                </div>
              </div>

              <div className="w-full text-left bg-gray-50 p-4 rounded-2xl">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3" /> Address
                </span>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  {patient?.address}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Timeline Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Patient Timeline</h2>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
              {records.length} Recorded entries
            </div>
          </div>

          <div className="space-y-4">
            {records.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                <p className="text-gray-500">No medical records available for this patient.</p>
              </div>
            ) : (
              records.map((record, index) => (
                <motion.div 
                  key={record.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${record.type === 'prescription' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                      {record.type === 'prescription' ? <FileText className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold capitalize">{record.type}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {record.createdAt?.toDate().toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 underline decoration-blue-100 underline-offset-4 group-hover:decoration-blue-400 transition-all">
                        {record.fileName}
                      </h4>
                    </div>
                  </div>
                  <a 
                    href={record.fileURL} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
