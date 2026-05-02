import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MedicalRecord } from '../types';
import { 
  FileText, 
  ClipboardList, 
  Calendar, 
  ExternalLink, 
  ArrowLeft,
  ChevronRight,
  Clock,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';

export default function PatientTimeline() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecords = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'records'),
          where('patientId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MedicalRecord[];
        setRecords(data);
      } catch (err) {
        console.error('Error fetching records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-2 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Medical History</h2>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {records.length} Records
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center shadow-sm">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Briefcase className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No records found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-8">Start your medical timeline by uploading your first prescription or report.</p>
          <button 
            onClick={() => navigate('/patient/upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-2xl transition-all"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gray-100 hidden sm:block" />

          <div className="space-y-6">
            {records.map((record, index) => (
              <motion.div 
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex flex-col sm:flex-row gap-4 group"
              >
                {/* Timeline Dot */}
                <div className="hidden sm:flex items-center justify-center w-14 h-14 bg-white border-4 border-gray-50 rounded-2xl z-10 shadow-sm text-blue-600 flex-shrink-0">
                  {record.type === 'prescription' ? <FileText className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                </div>

                <div className="flex-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="sm:hidden w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                      {record.type === 'prescription' ? <FileText className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${record.type === 'prescription' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                          {record.type}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(record.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {record.fileName || 'Unnamed Document'}
                      </h4>
                    </div>
                  </div>

                  <a 
                    href={record.fileURL} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 hover:bg-blue-600 hover:text-white text-gray-600 font-bold rounded-2xl transition-all text-sm group/btn"
                  >
                    View File
                    <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
