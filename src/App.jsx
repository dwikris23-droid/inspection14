import React, { useState, useMemo, useEffect } from 'react';

// Import Firebase (Firestore)
import { db } from './firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

// Import Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Import Lucide Icons
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Layers,
  Ruler,
  Trash2,
  FileText,
  BarChart3,
  Package,
  ChevronRight,
} from 'lucide-react';

// ----------------------------------------------------------------------
// PRESET TEMPLATE MASTER PRODUK & FORMULA BOM DEFAULT
// ----------------------------------------------------------------------
const INITIAL_PRODUCT_TEMPLATES = [
  {
    id: 'PROD-RB01',
    name: 'Roller Blinds (RBO01 Blackout Series)',
    unitDim: 'cm',
    estWasteStandardPct: 5,
    sizeToleranceCm: 0.5,
    bomFormulas: [
      { id: 'M1', name: 'Kain RBO01 Blackout', unit: 'm²', formula: '((L-3)*(T+25))/10000', tolerancePct: 3 },
      { id: 'M2', name: 'Tube Aluminium 38mm', unit: 'cm', formula: 'L - 3', tolerancePct: 2 },
      { id: 'M3', name: 'Bottom Rail Heavy Duty', unit: 'cm', formula: 'L - 3.5', tolerancePct: 2 },
      { id: 'M4', name: 'Rantai / Chain Mechanism', unit: 'm', formula: '(T * 2) / 100', tolerancePct: 1 },
    ],
  },
  {
    id: 'PROD-BOX01',
    name: 'Hard Box Packaging Premium',
    unitDim: 'cm',
    estWasteStandardPct: 4,
    sizeToleranceCm: 0.3,
    bomFormulas: [
      { id: 'M1', name: 'Kertas Board 2mm', unit: 'Kg', formula: '(L * T * 0.05)', tolerancePct: 3 },
      { id: 'M2', name: 'Art Paper Cover', unit: 'm²', formula: '((L+5)*(T+5))/10000', tolerancePct: 2 },
    ],
  },
];

export default function App() {
  // --- STATE UTAMA ---
  const [activeTab, setActiveTab] = useState('qc'); // 'qc' | 'summary' | 'dashboard'
  const [inspectionStep, setInspectionStep] = useState(1);
  const [productTemplates, setProductTemplates] = useState(INITIAL_PRODUCT_TEMPLATES);
  const [inspections, setInspections] = useState([]);
  
  // State Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // --- STATE INPUT FORM ---
  const [selectedProductId, setSelectedProductId] = useState('PROD-RB01');
  const [woNumberInput, setWoNumberInput] = useState('WO-2026-001');
  const [soNumberInput, setSoNumberInput] = useState('SO-2026-089');
  const [customerInput, setCustomerInput] = useState('PT Sinar Wijaya');
  const [inspectorInput, setInspectorInput] = useState('Budi Santoso');
  const [shiftInput, setShiftInput] = useState('Shift 1');
  const [inspectionNotes, setInspectionNotes] = useState('');

  // Dimensi Input
  const [dimL, setDimL] = useState(150);
  const [dimT, setDimT] = useState(200);
  const [dimP, setDimP] = useState(0);
  const [dimQ, setDimQ] = useState(0);

  // Input Waste
  const [reportedWasteVal, setReportedWasteVal] = useState(0.2);
  const [actualWasteVal, setActualWasteVal] = useState(0.35);

  // Target SO untuk Langkah 3
  const [soTargetL, setSoTargetL] = useState(150);
  const [soTargetT, setSoTargetT] = useState(200);
  const [soTargetQty, setSoTargetQty] = useState(10);
  const [actualQty, setActualQty] = useState(10);

  // Helper Toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Template Aktif
  const currentTemplate = useMemo(() => {
    return productTemplates.find((p) => p.id === selectedProductId) || productTemplates[0];
  }, [productTemplates, selectedProductId]);

  // ----------------------------------------------------------------------
  // REALTIME LISTENER FIREBASE FIRESTORE
  // ----------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'inspections'),
      (snapshot) => {
        const fetchedInspections = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInspections(fetchedInspections);
      },
      (error) => {
        console.error('Firebase connection error:', error);
        showToast('Gagal terhubung ke Firebase', 'error');
      }
    );

    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------------------------
  // ENGINE EVALUASI AUDIT (BOM, WASTE DISCREPANCY, SPEC SO)
  // ----------------------------------------------------------------------
  const auditEvaluation = useMemo(() => {
    if (!currentTemplate) return null;

    const L = parseFloat(dimL) || 0;
    const T = parseFloat(dimT) || 0;

    // 1. Kalkulasi BoM
    const bomDetails = currentTemplate.bomFormulas.map((item) => {
      let calcQty = 0;
      try {
        calcQty = Function('L', 'T', `return ${item.formula};`)(L, T);
      } catch (e) {
        calcQty = 0;
      }
      return {
        ...item,
        calculatedQty: Math.max(0, parseFloat(calcQty.toFixed(2))),
      };
    });

    // 2. Audit Waste Discrepancy
    const rep = parseFloat(reportedWasteVal) || 0;
    const act = parseFloat(actualWasteVal) || 0;
    const diff = act - rep;
    const devPct = rep > 0 ? (diff / rep) * 100 : 0;
    const isDiscrepancy = Math.abs(devPct) > 15 && Math.abs(diff) > 0.05;

    // 3. SO Spec Dimension & Qty Check
    const diffL = Math.abs(L - (parseFloat(soTargetL) || 0));
    const diffT = Math.abs(T - (parseFloat(soTargetT) || 0));
    const tol = currentTemplate.sizeToleranceCm || 0.5;

    const passL = diffL <= tol;
    const passT = diffT <= tol;
    const passQty = parseInt(actualQty) === parseInt(soTargetQty);

    const isPass = passL && passT && passQty && !isDiscrepancy;

    let autoReason = 'Seluruh kriteria ukuran, BoM, dan waste berada dalam batas toleransi.';
    if (!isPass) {
      const reasons = [];
      if (!passL) reasons.push(`Lebar deviasi ${diffL.toFixed(1)}cm (max ${tol}cm)`);
      if (!passT) reasons.push(`Tinggi deviasi ${diffT.toFixed(1)}cm (max ${tol}cm)`);
      if (!passQty) reasons.push(`Qty tidak sesuai target SO`);
      if (isDiscrepancy) reasons.push(`Terdeteksi selisih waste tinggi (${devPct.toFixed(1)}%)`);
      autoReason = `Ditolak/Warning: ${reasons.join(', ')}.`;
    }

    return {
      recommendedStatus: isPass ? 'PASS' : 'REJECT / WARNING',
      autoReason,
      bomDetails,
      wasteAudit: {
        reported: rep,
        actual: act,
        diff: parseFloat(diff.toFixed(2)),
        devPct: parseFloat(devPct.toFixed(1)),
        isDiscrepancy,
      },
      specDetails: {
        targetL: soTargetL,
        targetT: soTargetT,
        actualL: L,
        actualT: T,
        targetQty: soTargetQty,
        actualQty,
        passL,
        passT,
        passQty,
        toleranceCm: tol,
      },
    };
  }, [
    currentTemplate,
    dimL,
    dimT,
    reportedWasteVal,
    actualWasteVal,
    soTargetL,
    soTargetT,
    soTargetQty,
    actualQty,
  ]);

  // ----------------------------------------------------------------------
  // HANDLER SIMPAN KE FIREBASE
  // ----------------------------------------------------------------------
  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!auditEvaluation) return;

    const newInspectionRecord = {
      inspectionCustomId: `INSP-2026-${String(inspections.length + 101).padStart(3, '0')}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      woNumber: woNumberInput,
      soNumber: soNumberInput,
      customer: customerInput,
      productName: `${currentTemplate.name} (L:${dimL} T:${dimT} ${currentTemplate.unitDim})`,
      dimInput: {
        L: dimL,
        T: dimT,
        P: dimP,
        Q: dimQ,
        unitDim: currentTemplate.unitDim,
      },
      inspector: inspectorInput,
      shift: shiftInput,
      overallStatus: auditEvaluation.recommendedStatus,
      statusReason: inspectionNotes || auditEvaluation.autoReason,
      bomComparison: auditEvaluation.bomDetails,
      wasteAudit: {
        reportedWaste: auditEvaluation.wasteAudit.reported,
        actualMeasuredWaste: auditEvaluation.wasteAudit.actual,
        wasteUnit: currentTemplate.id.includes('BOX') ? 'Kg' : 'm²',
        varianceWaste: auditEvaluation.wasteAudit.diff,
        variancePct: auditEvaluation.wasteAudit.devPct,
        status: auditEvaluation.wasteAudit.isDiscrepancy ? 'DISCREPANCY_HIGH' : 'VERIFIED',
        notes:
          inspectionNotes ||
          (auditEvaluation.wasteAudit.isDiscrepancy
            ? 'Terdapat selisih signifikan waste terukur.'
            : 'Laporan waste sesuai.'),
      },
      soDimensionCheck: auditEvaluation.specDetails,
    };

    try {
      // Simpan data ke Firestore koleksi "inspections"
      await addDoc(collection(db, 'inspections'), newInspectionRecord);

      showToast(
        `Inspeksi ${newInspectionRecord.inspectionCustomId} berhasil disimpan ke Firebase! Status: ${newInspectionRecord.overallStatus}`,
        newInspectionRecord.overallStatus === 'PASS' ? 'success' : 'error'
      );

      setInspectionNotes('');
      setInspectionStep(1);
      setActiveTab('summary');
    } catch (err) {
      console.error('Gagal menyimpan ke Firebase:', err);
      showToast('Gagal menyimpan data ke Firebase!', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-12">
      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 transition-all ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">QC & Production Audit System</h1>
              <p className="text-xs text-slate-400">Pabrik & Manufaktur Modul Control</p>
            </div>
          </div>

          <nav className="flex space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('qc')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'qc' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ruler className="w-4 h-4" /> Form Inspeksi QC
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'summary' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Riwayat Inspeksi ({inspections.length})
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard Analytics
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* =================================================================== */}
        {/* TAB 1: FORM INSPEKSI QC STEPS                                      */}
        {/* =================================================================== */}
        {activeTab === 'qc' && (
          <form onSubmit={handleSubmitInspection} className="space-y-6">
            {/* STEPPER BAR */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { step: 1, title: '1. Spesifikasi & Ukuran', desc: 'WO, SO, Customer & Dimensi' },
                { step: 2, title: '2. Audit BoM & Waste', desc: 'Pemakaian Bahan & Waste' },
                { step: 3, title: '3. Hasil Kerja vs Target SO', desc: 'Toleransi & Final Decision' },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setInspectionStep(s.step)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    inspectionStep === s.step
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-sm">{s.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>

            {/* STEP 1: SPESIFIKASI & UKURAN */}
            {inspectionStep === 1 && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" /> Informasi Produk & Dimensi Hasil Kerja
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">PILIH MASTER PRODUK</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                    >
                      {productTemplates.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">NO. WORK ORDER (WO)</label>
                    <input
                      type="text"
                      value={woNumberInput}
                      onChange={(e) => setWoNumberInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">NO. SALES ORDER (SO)</label>
                    <input
                      type="text"
                      value={soNumberInput}
                      onChange={(e) => setSoNumberInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">NAMA CUSTOMER</label>
                    <input
                      type="text"
                      value={customerInput}
                      onChange={(e) => setCustomerInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">INSPEKTOR QC</label>
                    <input
                      type="text"
                      value={inspectorInput}
                      onChange={(e) => setInspectorInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">SHIFT</label>
                    <input
                      type="text"
                      value={shiftInput}
                      onChange={(e) => setShiftInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Dimensi Fisik Terukur ({currentTemplate.unitDim})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Lebar (L)</label>
                      <input
                        type="number"
                        value={dimL}
                        onChange={(e) => setDimL(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tinggi (T)</label>
                      <input
                        type="number"
                        value={dimT}
                        onChange={(e) => setDimT(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Panjang Tambahan (P)</label>
                      <input
                        type="number"
                        value={dimP}
                        onChange={(e) => setDimP(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Quantity/Sisi (Q)</label>
                      <input
                        type="number"
                        value={dimQ}
                        onChange={(e) => setDimQ(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setInspectionStep(2)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
                  >
                    Lanjut ke Audit BoM & Waste <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: AUDIT BOM & WASTE DISCREPANCY */}
            {inspectionStep === 2 && (
              <div className="space-y-6">
                {/* POIN 1: KALKULASI BOM */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" /> 1. Pemakaian Bahan Baku (BoM Kalkulasi)
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                        <tr>
                          <th className="p-3">Komponen Bahan Baku</th>
                          <th className="p-3">Formula Standard</th>
                          <th className="p-3 text-right">Hasil Kebutuhan</th>
                          <th className="p-3">Satuan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {auditEvaluation?.bomDetails.map((item) => (
                          <tr key={item.id}>
                            <td className="p-3 font-medium text-white">{item.name}</td>
                            <td className="p-3 font-mono text-xs text-indigo-400">{item.formula}</td>
                            <td className="p-3 text-right font-bold text-emerald-400">{item.calculatedQty}</td>
                            <td className="p-3 text-slate-400">{item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* POIN 2: AUDIT DISCREPANCY WASTE */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" /> 2. Audit Discrepancy Waste Produksi
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Waste Dilaporkan Operator ({currentTemplate.id.includes('BOX') ? 'Kg' : 'm²'})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={reportedWasteVal}
                        onChange={(e) => setReportedWasteVal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Waste Terukur Fisik QC ({currentTemplate.id.includes('BOX') ? 'Kg' : 'm²'})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={actualWasteVal}
                        onChange={(e) => setActualWasteVal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white"
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Selisih & Deviasi Waste:</span>
                      <span className="text-base font-bold text-white">
                        {auditEvaluation?.wasteAudit.diff > 0 ? `+${auditEvaluation?.wasteAudit.diff}` : auditEvaluation?.wasteAudit.diff} ({auditEvaluation?.wasteAudit.devPct}%)
                      </span>
                    </div>
                    {auditEvaluation?.wasteAudit.isDiscrepancy ? (
                      <span className="text-xs font-bold text-red-400 bg-red-950/60 border border-red-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> DISCREPANCY HIGH (&gt;15%)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> VERIFIED / NORMAL
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setInspectionStep(1)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionStep(3)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
                  >
                    Lanjut ke Verifikasi Target SO <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: POIN 3 (HASIL KERJA VS TARGET SALES ORDER) */}
            {inspectionStep === 3 && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-indigo-400" /> 3. Pemeriksaan Ukuran Hasil Kerja vs Target Sales Order
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase">Target Spesifikasi SO</h3>
                    <div>
                      <label className="text-xs text-slate-500">Target Lebar SO (cm)</label>
                      <input
                        type="number"
                        value={soTargetL}
                        onChange={(e) => setSoTargetL(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Target Tinggi SO (cm)</label>
                      <input
                        type="number"
                        value={soTargetT}
                        onChange={(e) => setSoTargetT(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Target Quantity SO</label>
                      <input
                        type="number"
                        value={soTargetQty}
                        onChange={(e) => setSoTargetQty(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase">Audit Presisi Lapangan</h3>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Pemeriksaan Lebar (L)</span>
                      {auditEvaluation?.specDetails.passL ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Sesuai (±{auditEvaluation?.specDetails.toleranceCm}cm)
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Deviasi Tinggi
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Pemeriksaan Tinggi (T)</span>
                      {auditEvaluation?.specDetails.passT ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Sesuai (±{auditEvaluation?.specDetails.toleranceCm}cm)
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Deviasi Tinggi
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-slate-500">Qty Diinspeksi Lolos</label>
                      <input
                        type="number"
                        value={actualQty}
                        onChange={(e) => setActualQty(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">CATATAN & CATATAN KHUSUS INSPEKTOR</label>
                  <textarea
                    rows="3"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="Masukkan alasan jika REJECT atau catatan kondisi fisik barang..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  ></textarea>
                </div>

                {/* VERDICT SUMMARY */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    auditEvaluation?.recommendedStatus === 'PASS'
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/40 border-red-800 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {auditEvaluation?.recommendedStatus === 'PASS' ? (
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-400" />
                    )}
                    <div>
                      <div className="font-bold text-base">STATUS HASIL: {auditEvaluation?.recommendedStatus}</div>
                      <div className="text-xs opacity-80">{auditEvaluation?.autoReason}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setInspectionStep(2)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-950 text-sm"
                  >
                    Simpan Laporan Inspeksi ke Firebase
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* =================================================================== */}
        {/* TAB 2: RIWAYAT INSPEKSI DARI FIREBASE                              */}
        {/* =================================================================== */}
        {activeTab === 'summary' && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" /> Data Inspeksi Realtime (Firebase Firestore)
            </h2>

            {inspections.length === 0 ? (
              <div className="text-center py-12 text-slate-500">Belum ada data inspeksi tersimpan.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">ID Inspeksi</th>
                      <th className="p-3">WO / SO</th>
                      <th className="p-3">Produk & Dimensi</th>
                      <th className="p-3">Status Waste</th>
                      <th className="p-3">Overall Status</th>
                      <th className="p-3">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {inspections.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3 font-mono font-bold text-indigo-400">{item.inspectionCustomId}</td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{item.woNumber}</div>
                          <div className="text-xs text-slate-500">{item.soNumber}</div>
                        </td>
                        <td className="p-3">{item.productName}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              item.wasteAudit?.status === 'DISCREPANCY_HIGH'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {item.wasteAudit?.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.overallStatus === 'PASS'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {item.overallStatus}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-slate-500">{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: DASHBOARD ANALYTICS RECHARTS                                */}
        {/* =================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" /> Analytics Monitoring Laporan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Rasio Kelulusan Status Inspeksi</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'PASS', value: inspections.filter((x) => x.overallStatus === 'PASS').length || 0 },
                          { name: 'REJECT', value: inspections.filter((x) => x.overallStatus !== 'PASS').length || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10B981" />
                        <Cell fill="#EF4444" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Perbandingan Waste (Reported vs Actual)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={inspections.slice(-5).map((item) => ({
                        so: item.soNumber || 'SO',
                        Reported: item.wasteAudit?.reportedWaste || 0,
                        Actual: item.wasteAudit?.actualMeasuredWaste || 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="so" stroke="#94A3B8" />
                      <YAxis stroke="#94A3B8" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Reported" fill="#3B82F6" />
                      <Bar dataKey="Actual" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
