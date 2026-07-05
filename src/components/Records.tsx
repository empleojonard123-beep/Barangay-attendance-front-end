import React, { useState, useRef } from 'react';
import { Search, LogIn, LogOut, Download, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { useAttendance } from '../context/AttendanceContext';
import { Resident } from '../types';

export default function Records() {
  const { attendance, removeRecord } = useAttendance();
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadTarget, setDownloadTarget] = useState<Resident | null>(null);
  const hiddenQrRef = useRef<HTMLDivElement>(null);

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

  const filteredAttendance = attendance.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.purok.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
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

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Attendance Records</h2>
          <p className="text-neutral-500">Viewing all recorded attendees for today's assembly</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input 
            type="text"
            placeholder="Search name or purok..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Resident Name</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Purok</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Time In</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Time Out</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900">{record.name}</div>
                      <div className="text-xs text-neutral-400 font-mono">{record.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                        Purok {record.purok}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-green-600 font-bold">
                        <LogIn size={14} />
                        {format(record.timeIn || record.timestamp, 'hh:mm:ss a')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record.timeOut ? (
                        <div className="flex items-center gap-2 text-orange-600 font-bold">
                          <LogOut size={14} />
                          {format(record.timeOut, 'hh:mm:ss a')}
                        </div>
                      ) : (
                        <span className="text-neutral-300 font-medium italic">Not yet logged out</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => triggerDownload(record)}
                          className="p-2 text-neutral-400 hover:text-blue-600 transition-colors"
                          title="Download QR Code"
                        >
                          <Download size={18} />
                        </button>
                        <button 
                          onClick={() => removeRecord(record.id)}
                          className="p-2 text-neutral-300 hover:text-red-600 transition-colors"
                          title="Remove Record"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                    {searchQuery ? 'No matching records found.' : 'No attendance recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
