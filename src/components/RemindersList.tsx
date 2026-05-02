import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Bell, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Clock, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { OperationType } from '../types';

interface Reminder {
  id: string;
  text: string;
  time?: string;
  completed: boolean;
  patientId: string;
}

export function RemindersList() {
  const { profile } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'reminders'),
      where('patientId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reminder[];
      setReminders(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reminders');
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !profile) return;

    try {
      await addDoc(collection(db, 'reminders'), {
        patientId: profile.uid,
        text: newText.trim(),
        time: newTime,
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewText('');
      setNewTime('');
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reminders');
    }
  };

  const toggleComplete = async (reminder: Reminder) => {
    try {
      await updateDoc(doc(db, 'reminders', reminder.id), {
        completed: !reminder.completed
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reminders');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reminders');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-800 font-black tracking-tight">Health Reminders</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {isAdding ? <Plus className="w-4 h-4 rotate-45" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={handleAdd}
            className="mb-4 space-y-3 overflow-hidden"
          >
            <input 
              type="text"
              placeholder="What to remind? (e.g. Med A)"
              required
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <div className="flex gap-2">
              <input 
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Bell className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active reminders</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <motion.div 
              layout
              key={reminder.id}
              className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                reminder.completed 
                  ? 'bg-slate-50 border-slate-100 opacity-60' 
                  : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'
              }`}
            >
              <button 
                onClick={() => toggleComplete(reminder)}
                className="shrink-0 transition-transform active:scale-90"
              >
                {reminder.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 hover:text-blue-500" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${reminder.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                  {reminder.text}
                </p>
                {reminder.time && (
                  <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <Clock className="w-3 h-3" />
                    {reminder.time}
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleDelete(reminder.id)}
                className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
