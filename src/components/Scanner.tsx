import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Upload, AlertCircle, LogIn, LogOut, Users, History, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useAttendance } from '../context/AttendanceContext';

export default function Scanner() {
  const { attendance, addAttendance, lastScanned, setLastScanned } = useAttendance();
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastScanRef = useRef<{ id: string, time: number } | null>(null);

  useEffect(() => {
    if (isScanning) {
      const startScanner = async () => {
        try {
          const element = document.getElementById("qr-reader");
          if (!element) return;

          const scanner = new Html5Qrcode("qr-reader", { 
            useBarCodeDetectorIfSupported: true 
          } as any);
          html5QrCodeRef.current = scanner;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 30,
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                return { width: viewfinderWidth, height: viewfinderHeight };
              },
            },
            onScanSuccess,
            onScanFailure
          );
          setScannerError(null);
        } catch (err: any) {
          console.error("Unable to start scanning", err);
          setScannerError(err.message || "Could not access camera. Please ensure permissions are granted.");
          setIsScanning(false);
        }
      };

      const timer = setTimeout(startScanner, 100);
      return () => {
        clearTimeout(timer);
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
        }
      };
    }
  }, [isScanning]);

  function onScanSuccess(decodedText: string) {
    try {
      const data = JSON.parse(decodedText);
      if (data.id && data.name) {
        const now = Date.now();
        if (lastScanRef.current && lastScanRef.current.id === data.id && (now - lastScanRef.current.time < 3000)) {
          return;
        }
        lastScanRef.current = { id: data.id, time: now };
        const type = addAttendance(data);
        setLastScanned({ name: data.name, type });
        setTimeout(() => setLastScanned(null), 3000);
      }
    } catch (e) {
      const now = Date.now();
      if (lastScanRef.current && lastScanRef.current.id === decodedText && (now - lastScanRef.current.time < 3000)) {
        return;
      }
      lastScanRef.current = { id: decodedText, time: now };
      const type = addAttendance({ id: decodedText, name: decodedText, purok: 'Unknown' });
      setLastScanned({ name: decodedText, type });
      setTimeout(() => setLastScanned(null), 3000);
    }
  }

  function onScanFailure() {}

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const html5QrCode = new Html5Qrcode("qr-reader-hidden");
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      onScanSuccess(decodedText);
      setScannerError(null);
    } catch (err: any) {
      console.error("Error scanning file", err);
      setScannerError("Could not find a valid QR code in this image.");
    } finally {
      html5QrCode.clear();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Purok', 'Date', 'Time In', 'Time Out'];
    const rows = attendance.map(a => [
      a.name,
      a.purok,
      format(a.timeIn || a.timestamp, 'yyyy-MM-dd'),
      format(a.timeIn || a.timestamp, 'HH:mm:ss'),
      a.timeOut ? format(a.timeOut, 'HH:mm:ss') : 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div id="qr-reader-hidden" className="hidden"></div>
      <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Live QR Scanner</h2>
            <p className="text-sm text-neutral-500">Scan resident QR codes to record attendance</p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-full font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-all flex items-center gap-2"
            >
              <Upload size={18} />
              Upload QR
            </button>
            <button 
              onClick={() => {
                setScannerError(null);
                setIsScanning(!isScanning);
              }}
              className={cn(
                "px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2",
                isScanning 
                  ? "bg-red-50 text-red-600 hover:bg-red-100" 
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200"
              )}
            >
              {isScanning ? <><X size={18} /> Stop Camera</> : <><Camera size={18} /> Start Camera</>}
            </button>
          </div>
        </div>
        
        <div className="h-[700px] bg-neutral-900 relative flex items-center justify-center overflow-hidden">
          {isScanning && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-scan" />
              <div className="absolute inset-0 border-[2px] border-blue-500/20" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Full-Screen Scanning Active
              </div>
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm text-white/80 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold">
                Point camera at any QR code
              </div>
            </div>
          )}
          {!isScanning ? (
            <div className="text-center space-y-4 p-8">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto">
                <Camera className="text-neutral-600 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <p className="text-neutral-400 max-w-xs mx-auto">
                  Click "Start Camera" or "Upload QR" to record attendance.
                </p>
                {scannerError && (
                  <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-medium bg-red-950/30 px-4 py-2 rounded-lg border border-red-900/50">
                    <AlertCircle size={16} />
                    {scannerError}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div id="qr-reader" className="w-full h-full object-cover"></div>
          )}
          
          <AnimatePresence>
            {lastScanned && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "absolute bottom-6 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-20",
                  lastScanned.type === 'in' ? "bg-green-500" : "bg-orange-500"
                )}
              >
                {lastScanned.type === 'in' ? <LogIn size={20} /> : <LogOut size={20} />}
                <span className="font-bold whitespace-nowrap">
                  {lastScanned.type === 'in' ? 'Time In: ' : 'Time Out: '} {lastScanned.name}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Users className="text-blue-600" />}
          label="Total Attendees"
          value={attendance.length}
        />
        <StatCard 
          icon={<History className="text-orange-600" />}
          label="Last Scanned"
          value={attendance[0]?.name || 'None'}
          subValue={attendance[0] ? format(attendance[0].timeOut || attendance[0].timeIn || attendance[0].timestamp, 'hh:mm a') : ''}
        />
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 flex flex-col justify-center">
          <button 
            onClick={exportToCSV}
            disabled={attendance.length === 0}
            className="w-full py-3 bg-neutral-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download size={20} />
            Export Attendance
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string | number, subValue?: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-neutral-50 rounded-lg">
          {icon}
        </div>
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-neutral-900">{value}</span>
        {subValue && <span className="text-xs font-medium text-neutral-400">{subValue}</span>}
      </div>
    </div>
  );
}
