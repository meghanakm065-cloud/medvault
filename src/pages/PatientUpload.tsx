import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, auth } from '../lib/firebase';
import { FileUp, FileText, ClipboardList, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function PatientUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<'prescription' | 'report'>('prescription');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File is too large (max 5MB)');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !auth.currentUser) return;

    setLoading(true);
    setError('');

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `records/${auth.currentUser.uid}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, 'records'), {
            patientId: auth.currentUser?.uid,
            fileURL: downloadURL,
            fileName: file.name,
            type: type,
            createdAt: serverTimestamp()
          });

          setLoading(false);
          navigate('/patient/timeline');
        }
      );
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Medical Record</h2>

        <form onSubmit={handleUpload} className="space-y-8">
          {/* Custom File Dropzone */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-700">Select Document (PDF or Image)</label>
            <div className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'}`}>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                required
              />
              <div className={`p-4 rounded-2xl mb-4 ${file ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {file ? <CheckCircle className="w-8 h-8" /> : <FileUp className="w-8 h-8" />}
              </div>
              <p className={`font-bold ${file ? 'text-green-700' : 'text-gray-900'}`}>
                {file ? file.name : 'Choose a file or drag it here'}
              </p>
              <p className="text-xs text-gray-500 mt-2">Maximum file size: 5MB</p>
            </div>
          </div>

          {/* Record Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('prescription')}
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${type === 'prescription' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-semibold">Prescription</span>
            </button>
            <button
              type="button"
              onClick={() => setType('report')}
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${type === 'report' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
            >
              <ClipboardList className="w-5 h-5" />
              <span className="font-semibold">Test Report</span>
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100"
            >
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold text-blue-700">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Confirm and Upload
                <FileUp className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
