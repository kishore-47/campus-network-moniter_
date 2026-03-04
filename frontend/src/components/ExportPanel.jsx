import React from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ExportPanel = ({ devices, summary }) => {
  
  const exportToCSV = () => {
    const headers = ['Device Name', 'IP Address', 'Type', 'Location', 'Status', 'Uptime %', 'Latency (ms)'];
    const rows = devices.map(device => [
      device.name,
      device.ip_address,
      device.device_type,
      device.location,
      device.status,
      device.uptime_percent.toFixed(2),
      device.latest_latency_ms ? device.latest_latency_ms.toFixed(2) : 'N/A'
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-devices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Campus Network Monitor Report', 14, 20);
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Devices: ${summary.total_devices}`, 14, 38);
    doc.text(`Devices UP: ${summary.devices_up}`, 14, 46);
    doc.text(`Devices DOWN: ${summary.devices_down}`, 14, 54);
    
    // Table
    const tableData = devices.map(device => [
      device.name,
      device.ip_address,
      device.device_type,
      device.status,
      device.uptime_percent.toFixed(2) + '%',
      device.latest_latency_ms ? device.latest_latency_ms.toFixed(2) + ' ms' : 'N/A'
    ]);

    doc.autoTable({
      startY: 65,
      head: [['Device', 'IP', 'Type', 'Status', 'Uptime', 'Latency']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    doc.save(`network-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex gap-3 animate-slideDown">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all transform hover:scale-105"
      >
        <FileSpreadsheet size={18} />
        Export CSV
      </button>
      <button
        onClick={exportToPDF}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all transform hover:scale-105"
      >
        <FileText size={18} />
        Export PDF
      </button>
    </div>
  );
};

export default ExportPanel;