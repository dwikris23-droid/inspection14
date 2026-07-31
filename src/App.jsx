// App.jsx
import React, { useState } from 'react';
import AddTemplateModal from './components/AddTemplateModal';
import PdfPreviewModal from './components/PdfPreviewModal';

export default function App() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Dashboard QC</h1>

      <div className="flex gap-4">
        {/* Tombol pemicu modal */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 px-4 py-2 rounded-lg"
        >
          + Tambah Template Produk
        </button>

        <button 
          onClick={() => setIsPdfModalOpen(true)}
          className="bg-slate-700 px-4 py-2 rounded-lg"
        >
          Preview PDF
        </button>
      </div>

      {/* Panggil komponen modal di sini */}
      <AddTemplateModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      <PdfPreviewModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
      />
    </div>
  );
}
