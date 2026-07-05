import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Plus, FileDown, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { useAttendance } from '../context/AttendanceContext';
import { Resident } from '../types';

export default function Register() {
  const { addAttendance } = useAttendance();
  const navigate = useNavigate();
  const [newResident, setNewResident] = useState({ name: '', purok: '', id: '' });
  const [downloadTarget, setDownloadTarget] = useState<Resident | null>(null);
  const hiddenQrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newResident.name && newResident.purok && !newResident.id) {
      setNewResident(prev => ({
        ...prev,
        id: `BRGY-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      }));
    }
  }, [newResident.name, newResident.purok]);

  const triggerDownload = (resident: Resident) => {
    setDownloadTarget(resident);
    setTimeout(() => {
      if (!hiddenQrRef.current) return;
      const svg = hiddenQrRef.current.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 100;
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
          
          ctx.fillStyle = 'black';
          ctx.font = 'bold 20px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(resident.name, canvas.width / 2, img.height + 50);
          ctx.font = '16px Inter, sans-serif';
          ctx.fillText(`Purok ${resident.purok}`, canvas.width / 2, img.height + 80);
          
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_${resident.name.replace(/\s+/g, '_')}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          setDownloadTarget(null);
        }
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }, 100);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="hidden" ref={hiddenQrRef}>
        {downloadTarget && (
          <QRCodeSVG 
            value={JSON.stringify({
              id: downloadTarget.id,
              name: downloadTarget.name,
              purok: downloadTarget.purok
            })} 
            size={200}
            level="H"
          />
        )}
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Resident Registration</h2>
        <p className="text-neutral-500">Generate a QR code for a resident to use for future assemblies</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 ml-1">Full Name</label>
            <input 
              type="text"
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Juan Dela Cruz"
              value={newResident.name}
              onChange={(e) => setNewResident({...newResident, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-700 ml-1">Purok</label>
            <select 
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
              value={newResident.purok}
              onChange={(e) => setNewResident({...newResident, purok: e.target.value})}
            >
              <option value="">Select Purok</option>
              {[1,2,3,4,5,6,7].map(i => (
                <option key={i} value={i}>Purok {i}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200">
          {newResident.name && newResident.purok ? (
            <div className="space-y-6 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <QRCodeSVG 
                  value={JSON.stringify({
                    id: newResident.id,
                    name: newResident.name,
                    purok: newResident.purok
                  })} 
                  size={200}
                  level="H"
                />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{newResident.name}</p>
                <p className="text-blue-600 font-medium">Purok {newResident.purok}</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => triggerDownload({
                    id: newResident.id,
                    name: newResident.name,
                    purok: newResident.purok,
                    timestamp: Date.now()
                  })}
                  className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-50 transition-all shadow-sm"
                >
                  <FileDown size={18} />
                  Download QR
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2 text-neutral-400">
              <QrCode size={48} className="mx-auto opacity-20" />
              <p>Enter resident details to generate QR code</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            if (newResident.name && newResident.purok) {
              addAttendance({
                id: newResident.id || `MANUAL-${Date.now()}`,
                name: newResident.name,
                purok: newResident.purok
              });
              setNewResident({ name: '', purok: '', id: '' });
              navigate('/records');
            }
          }}
          disabled={!newResident.name || !newResident.purok}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          Register & Record Attendance
        </button>
      </div>
    </motion.div>
  );
}
