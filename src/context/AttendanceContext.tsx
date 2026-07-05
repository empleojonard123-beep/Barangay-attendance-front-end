import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Resident, AttendanceRecord } from '../types';

interface AttendanceContextType {
  attendance: AttendanceRecord[];
  addAttendance: (resident: Partial<Resident>) => 'in' | 'out';
  removeRecord: (id: string) => void;
  lastScanned: { name: string; type: 'in' | 'out' } | null;
  setLastScanned: (val: { name: string; type: 'in' | 'out' } | null) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('barangay_attendance');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((a: any) => ({
        ...a,
        timeIn: a.timeIn || a.timestamp || Date.now()
      }));
    } catch (e) {
      console.error("Failed to parse attendance records", e);
      return [];
    }
  });

  const [lastScanned, setLastScanned] = useState<{ name: string; type: 'in' | 'out' } | null>(null);
  const lastScanRef = useRef<{ id: string, time: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('barangay_attendance', JSON.stringify(attendance));
  }, [attendance]);

  const addAttendance = (resident: Partial<Resident>): 'in' | 'out' => {
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.id === resident.id && (now - lastScanRef.current.time < 3000)) {
      return attendance.find(a => a.id === resident.id)?.timeOut ? 'out' : 'in';
    }
    lastScanRef.current = { id: resident.id || '', time: now };

    const existingIndex = attendance.findIndex(a => a.id === resident.id);
    
    if (existingIndex !== -1) {
      const updatedAttendance = [...attendance];
      updatedAttendance[existingIndex] = {
        ...updatedAttendance[existingIndex],
        timeOut: Date.now()
      };
      setAttendance(updatedAttendance);
      return 'out';
    } else {
      const record: AttendanceRecord = {
        id: resident.id || Math.random().toString(36).substr(2, 9),
        name: resident.name || 'Unknown',
        purok: resident.purok || 'N/A',
        timestamp: Date.now(),
        timeIn: Date.now(),
        status: 'present'
      };
      setAttendance(prev => [record, ...prev]);
      return 'in';
    }
  };

  const removeRecord = (id: string) => {
    setAttendance(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AttendanceContext.Provider value={{ attendance, addAttendance, removeRecord, lastScanned, setLastScanned }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
