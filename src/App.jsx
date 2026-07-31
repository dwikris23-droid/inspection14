import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';

import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Ruler,
  Trash2,
  FileText,
  BarChart3,
  Package,
  ChevronRight,
  Eye,
  Printer,
  Calculator,
  ArrowRight,
  Settings,
  Sparkles,
  Edit3,
  PlusCircle,
  X,
  Calendar,
  Download,
  Activity,
  RotateCcw,
} from 'lucide-react';

// ==========================================
// KONFIGURASI FIREBASE FIRESTORE
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dynamic Formula Evaluator Engine
const evaluateFormula = (formulaStr, params) => {
  try {
    const { L = 0, T = 0, P = 0, Q = 1 } = params;
    let expr = String(formulaStr)
      .replace(/\bL\b/gi, L)
      .replace(/\bT\b/gi, T)
      .replace(/\bP\b/gi, P)
      .replace(/\bQ\b/gi, Q);

    const sanitized = expr.replace(/[^0-9\.\+\-\*\/\(\)\s\>\<\?\:\,\%]/g, '');
    if (!sanitized.trim()) return 0;

    const result = new Function('Math', `return (${sanitized});`)(Math);
    return isNaN(result) || !isFinite(result) ? 0 : Math.max(0, result);
  } catch (err) {
    console.error('Formula evaluation error:', err);
    return 0;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('new_inspection');
  
  const [productTemplates, setProductTemplates] = useState([]);
  const [inspections, setInspections] = useState([]);
  
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // PREVIEW MODAL STATE FOR PDF / PRINT
  const [printPreviewModal, setPrintPreviewModal] = useState({
    isOpen: false,
    type: 'SUMMARY', // 'SUMMARY' atau 'SINGLE'
    data: null,
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Workflow State
  const [inspectionStep, setInspectionStep] = useState(1);
  const [selectedProductTemplateId, setSelectedProductTemplateId] = useState('');

  // Input Field
  const [woNumberInput, setWoNumberInput] = useState('');
  const [soNumberInput, setSoNumberInput] = useState('');
  const [customerInput, setCustomerInput] = useState('');
  const [shiftInput, setShiftInput] = useState('Shift 1 - Pagi');
  const [inspectorInput, setInspectorInput] = useState('');

  // Dimensions State (Dimensi P, L, T, Q Kembali Lengkap)
  const [dimL, setDimL] = useState(100);
  const [dimT, setDimT] = useState(100);
  const [dimP, setDimP] = useState(0);
  const [dimQ, setDimQ] = useState(1);

  // Field Actuals Inputs
  const [actualBomUsage, setActualBomUsage] = useState({});
  const [reportedWasteVal, setReportedWasteVal] = useState('');
  const [actualWasteVal, setActualWasteVal] = useState('');
  const [actualDimensionsMeasured, setActualDimensionsMeasured] = useState({});
  const [inspectionNotes, setInspectionNotes] = useState('');

  // MODAL STATES
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    customId: '',
    name: '',
    category: 'Window Blinds',
    unitDim: 'cm',
    defaultL: 100,
    defaultT: 150,
    defaultP: 0,
    defaultQ: 1,
    bomFormulas: [
      {
        id: 'M1',
        name: 'Bahan Utama',
        unit: 'm²',
        formula: '((L-2)*(T+10))/10000',
        tolerancePct: 3,
        note: 'Formula bahan utama',
      },
    ],
    soDimensionSpecs: [
      {
        id: 'S1',
        name: 'Lebar Akhir (L)',
        targetFormula: 'L',
        minTol: -0.2,
        maxTol: 0.2,
        unit: 'cm',
      },
      {
        id: 'S2',
        name: 'Panjang Akhir (P)',
        targetFormula: 'P',
        minTol: -0.2,
        maxTol: 0.2,
        unit: 'cm',
      },
    ],
    estWasteStandardPct: 3.0,
  });

  // LISTEN DATA REALTIME FROM FIRESTORE
  useEffect(() => {
    const unsubscribeTemplates = onSnapshot(
      collection(db, 'productTemplates'),
      (snapshot) => {
        const templates = snapshot.docs.map((doc) => ({
          docId: doc.id,
          ...doc.data(),
        }));
        setProductTemplates(templates);
        if (templates.length > 0 && !selectedProductTemplateId) {
          setSelectedProductTemplateId(templates[0].docId);
        }
      }
    );

    const unsubscribeInspections = onSnapshot(
      collection(db, 'inspections'),
      (snapshot) => {
        const inspList = snapshot.docs.map((doc) => ({
          docId: doc.id,
          ...doc.data(),
        }));
        setInspections(inspList);
      }
    );

    return () => {
      unsubscribeTemplates();
      unsubscribeInspections();
    };
  }, []);

  const currentTemplate = useMemo(() => {
    return (
      productTemplates.find((p) => p.docId === selectedProductTemplateId) ||
      productTemplates[0]
    );
  }, [productTemplates, selectedProductTemplateId]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (currentTemplate) {
      setDimL(currentTemplate.defaultL || 100);
      setDimT(currentTemplate.defaultT || 150);
      setDimP(currentTemplate.defaultP || 0);
      setDimQ(currentTemplate.defaultQ || 1);
    }
  }, [selectedProductTemplateId, currentTemplate]);

  const handleDeleteInspection = async (docId, customId) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data inspeksi ${customId || docId}?`)) {
      try {
        await deleteDoc(doc(db, 'inspections', docId));
        if (selectedInspection?.docId === docId) {
          setSelectedInspection(null);
        }
        showToast(`Data inspeksi berhasil dihapus!`, 'error');
      } catch (err) {
        showToast(`Gagal menghapus data: ${err.message}`, 'error');
      }
    }
  };

  const handleResetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    showToast('Filter rentang tanggal berhasil di-reset.');
  };

  const handleSaveNewProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.customId || !newProductForm.name) {
      showToast('Harap isi ID dan Nama Produk Template!', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'productTemplates'), newProductForm);
      // PERBAIKAN: AUTO CLOSE POPUP & NOTIFIKASI BERHASIL
      setIsAddProductModalOpen(false);
      showToast(`Template produk ${newProductForm.name} berhasil disimpan!`);

      setNewProductForm({
        customId: '',
        name: '',
        category: 'Window Blinds',
        unitDim: 'cm',
        defaultL: 100,
        defaultT: 150,
        defaultP: 0,
        defaultQ: 1,
        bomFormulas: [
          {
            id: 'M1',
            name: 'Bahan Utama',
            unit: 'm²',
            formula: '((L-2)*(T+10))/10000',
            tolerancePct: 3,
            note: 'Formula bahan utama',
          },
        ],
        soDimensionSpecs: [
          {
            id: 'S1',
            name: 'Lebar Akhir (L)',
            targetFormula: 'L',
            minTol: -0.2,
            maxTol: 0.2,
            unit: 'cm',
          },
          {
            id: 'S2',
            name: 'Panjang Akhir (P)',
            targetFormula: 'P',
            minTol: -0.2,
            maxTol: 0.2,
            unit: 'cm',
          },
        ],
        estWasteStandardPct: 3.0,
      });
    } catch (err) {
      showToast(`Gagal menyimpan template: ${err.message}`, 'error');
    }
  };

  const handleExportCSV = () => {
    if (filteredInspections.length === 0) {
      showToast('Tidak ada data untuk diekspor!', 'error');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID Inspeksi,Tanggal,WO Number,SO Number,Customer,Produk,Status,Inspector\n';

    filteredInspections.forEach((row) => {
      csvContent += `"${row.id || row.docId}","${row.date}","${row.woNumber}","${row.soNumber}","${row.customer}","${row.productName}","${row.overallStatus}","${row.inspector}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QC_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data berhasil diekspor ke format CSV!');
  };

  const calculatedTargetBom = useMemo(() => {
    if (!currentTemplate || !currentTemplate.bomFormulas) return [];
    const params = {
      L: parseFloat(dimL) || 0,
      T: parseFloat(dimT) || 0,
      P: parseFloat(dimP) || 0,
      Q: parseFloat(dimQ) || 1,
    };

    return currentTemplate.bomFormulas.map((item) => {
      const baseQty = evaluateFormula(item.formula, params);
      const isQMultiplied = String(item.formula).toUpperCase().includes('Q');
      const totalTarget = isQMultiplied ? baseQty : baseQty * params.Q;

      return {
        ...item,
        calculatedQty: parseFloat(totalTarget.toFixed(3)),
        formulaText: item.formula,
      };
    });
  }, [currentTemplate, dimL, dimT, dimP, dimQ]);

  const calculatedTargetSpecs = useMemo(() => {
    if (!currentTemplate || !currentTemplate.soDimensionSpecs) return [];
    const params = {
      L: parseFloat(dimL) || 0,
      T: parseFloat(dimT) || 0,
      P: parseFloat(dimP) || 0,
      Q: parseFloat(dimQ) || 1,
    };

    return currentTemplate.soDimensionSpecs.map((spec) => {
      const targetVal = evaluateFormula(spec.targetFormula, params);
      return {
        ...spec,
        targetValue: parseFloat(targetVal.toFixed(2)),
      };
    });
  }, [currentTemplate, dimL, dimT, dimP, dimQ]);

  const syncDefaultsForStep2 = () => {
    const defaultBomActuals = {};
    calculatedTargetBom.forEach((item) => {
      defaultBomActuals[item.id] = item.calculatedQty;
    });
    setActualBomUsage(defaultBomActuals);

    const defaultDimActuals = {};
    calculatedTargetSpecs.forEach((spec) => {
      defaultDimActuals[spec.id] = spec.targetValue;
    });
    setActualDimensionsMeasured(defaultDimActuals);

    const mainFabric = calculatedTargetBom[0];
    const estWaste = mainFabric
      ? (
          mainFabric.calculatedQty *
          ((currentTemplate?.estWasteStandardPct || 3) / 100)
        ).toFixed(2)
      : '0.1';
    setReportedWasteVal(estWaste);
    setActualWasteVal(estWaste);
  };

  const auditEvaluation = useMemo(() => {
    if (!calculatedTargetBom.length) return null;

    let bomFailedCount = 0;
    const bomDetails = calculatedTargetBom.map((item) => {
      const actVal = parseFloat(actualBomUsage[item.id]) || 0;
      const targetVal = item.calculatedQty;
      const devPct =
        targetVal > 0 ? ((actVal - targetVal) / targetVal) * 100 : 0;
      const isExceeded = Math.abs(devPct) > item.tolerancePct;
      if (isExceeded) bomFailedCount++;

      let status = 'OK';
      if (isExceeded) {
        status = devPct > 0 ? 'EXCEEDED' : 'UNDER_USED';
      }

      return {
        materialId: item.id,
        materialName: item.name,
        unit: item.unit,
        planned: targetVal,
        actual: actVal,
        tolerancePct: item.tolerancePct,
        devPct: parseFloat(devPct.toFixed(2)),
        formula: item.formulaText,
        status,
      };
    });

    const repWaste = parseFloat(reportedWasteVal) || 0;
    const actWaste = parseFloat(actualWasteVal) || 0;
    const wasteDiff = actWaste - repWaste;
    const wasteDevPct = repWaste > 0 ? (wasteDiff / repWaste) * 100 : 0;
    const isWasteDiscrepancy =
      Math.abs(wasteDevPct) > 15 && Math.abs(wasteDiff) > 0.1;

    let specFailCount = 0;
    const specDetails = calculatedTargetSpecs.map((spec) => {
      const actVal = parseFloat(actualDimensionsMeasured[spec.id]) || 0;
      const targetVal = spec.targetValue;
      const minAllowed = targetVal + spec.minTol;
      const maxAllowed = targetVal + spec.maxTol;
      const isPass = actVal >= minAllowed && actVal <= maxAllowed;

      if (!isPass) specFailCount++;

      return {
        specId: spec.id,
        specName: spec.name,
        target: targetVal,
        minAllowed: parseFloat(minAllowed.toFixed(2)),
        maxAllowed: parseFloat(maxAllowed.toFixed(2)),
        unit: spec.unit,
        actual: actVal,
        status: isPass ? 'PASS' : 'FAIL',
        remark: isPass
          ? 'Sesuai Spesifikasi SO'
          : `Diluar Batas (${minAllowed.toFixed(1)} - ${maxAllowed.toFixed(
              1
            )} ${spec.unit})`,
      };
    });

    let recommendedStatus = 'PASS';
    let autoReason =
      'Seluruh kalkulasi BoM custom, waste terukur, dan dimensi produk memenuhi spesifikasi SO.';

    if (specFailCount > 0) {
      recommendedStatus = 'REJECT';
      autoReason = `Terdapat ${specFailCount} spesifikasi dimensi hasil potong/perakitan yang TIDAK SESUAI pesanan SO.`;
    } else if (bomFailedCount > 0 || isWasteDiscrepancy) {
      if (bomFailedCount > 1 || Math.abs(wasteDevPct) > 50) {
        recommendedStatus = 'REJECT';
        autoReason =
          'Pemakaian bahan baku aktual menyimpang jauh dari standar kalkulasi BoM formula.';
      } else {
        recommendedStatus = 'CONDITIONAL';
        autoReason =
          'Dimensi produk sesuai, namun terdapat deviasi kecil pada konsumsi bahan baku. Butuh persetujuan supervisor.';
      }
    }

    return {
      bomDetails,
      bomFailedCount,
      wasteAudit: {
        reported: repWaste,
        actual: actWaste,
        diff: parseFloat(wasteDiff.toFixed(2)),
        devPct: parseFloat(wasteDevPct.toFixed(2)),
        isDiscrepancy: isWasteDiscrepancy,
      },
      specDetails,
      specFailCount,
      recommendedStatus,
      autoReason,
    };
  }, [
    calculatedTargetBom,
    calculatedTargetSpecs,
    actualBomUsage,
    reportedWasteVal,
    actualWasteVal,
    actualDimensionsMeasured,
  ]);

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!auditEvaluation || !currentTemplate) return;

    const newInspectionRecord = {
      id: `INSP-2026-${String(inspections.length + 101).padStart(3, '0')}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      woNumber: woNumberInput,
      soNumber: soNumberInput,
      customer: customerInput,
      productName: `${currentTemplate.name} (P:${dimP} L:${dimL} T:${dimT} ${currentTemplate.unitDim})`,
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
        wasteUnit: currentTemplate.customId?.includes('BOX') ? 'Kg' : 'm²',
        varianceWaste: auditEvaluation.wasteAudit.diff,
        variancePct: auditEvaluation.wasteAudit.devPct,
        status: auditEvaluation.wasteAudit.isDiscrepancy
          ? 'DISCREPANCY_HIGH'
          : 'VERIFIED',
        notes:
          inspectionNotes ||
          (auditEvaluation.wasteAudit.isDiscrepancy
            ? 'Terdapat selisih signifikan waste terukur.'
            : 'Laporan waste sesuai.'),
      },
      soDimensionCheck: auditEvaluation.specDetails,
    };

    try {
      await addDoc(collection(db, 'inspections'), newInspectionRecord);
      // PERBAIKAN: NOTIFIKASI "BERHASIL DISIMPAN"
      showToast(
        `Hasil Inspeksi ${newInspectionRecord.id} berhasil disimpan!`,
        newInspectionRecord.overallStatus === 'PASS' ? 'success' : 'error'
      );
      setInspectionStep(1);
      setActiveTab('summary');
    } catch (err) {
      showToast(`Gagal menyimpan data inspeksi: ${err.message}`, 'error');
    }
  };

  const handleUpdateFormulaItem = async (tmplDocId, formulaId, updatedField, value) => {
    const tmpl = productTemplates.find((t) => t.docId === tmplDocId);
    if (!tmpl) return;

    const updatedBom = tmpl.bomFormulas.map((f) => {
      if (f.id !== formulaId) return f;
      return { ...f, [updatedField]: value };
    });

    try {
      await updateDoc(doc(db, 'productTemplates', tmplDocId), {
        bomFormulas: updatedBom,
      });
      showToast('Rumus BoM berhasil disimpan!');
    } catch (err) {
      showToast(`Gagal update formula: ${err.message}`, 'error');
    }
  };

  const handleAddFormulaRow = async (tmplDocId) => {
    const tmpl = productTemplates.find((t) => t.docId === tmplDocId);
    if (!tmpl) return;

    const newId = `M${(tmpl.bomFormulas?.length || 0) + 1}`;
    const newRow = {
      id: newId,
      name: 'Komponen Baru',
      unit: 'Pcs',
      formula: '1',
      tolerancePct: 2,
      note: 'Komponen tambahan',
    };

    try {
      await updateDoc(doc(db, 'productTemplates', tmplDocId), {
        bomFormulas: [...(tmpl.bomFormulas || []), newRow],
      });
      showToast('Komponen BoM baru berhasil disimpan!');
    } catch (err) {
      showToast(`Gagal menambah komponen: ${err.message}`, 'error');
    }
  };

  const handleDeleteFormulaRow = async (tmplDocId, formulaId) => {
    const tmpl = productTemplates.find((t) => t.docId === tmplDocId);
    if (!tmpl) return;

    const updatedBom = tmpl.bomFormulas.filter((f) => f.id !== formulaId);

    try {
      await updateDoc(doc(db, 'productTemplates', tmplDocId), {
        bomFormulas: updatedBom,
      });
      showToast('Komponen BoM berhasil dihapus!');
    } catch (err) {
      showToast(`Gagal menghapus komponen: ${err.message}`, 'error');
    }
  };

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const matchesSearch =
        (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.woNumber && item.woNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.customer && item.customer.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.productName && item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || item.overallStatus === statusFilter;

      const itemDateStr = item.date ? item.date.substring(0, 10) : '';
      let matchesDateRange = true;

      if (startDate) {
        matchesDateRange = matchesDateRange && itemDateStr >= startDate;
      }
      if (endDate) {
        matchesDateRange = matchesDateRange && itemDateStr <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [inspections, searchQuery, statusFilter, startDate, endDate]);

  const summaryMetrics = useMemo(() => {
    const totalInspections = filteredInspections.length;
    if (totalInspections === 0) return null;

    const passCount = filteredInspections.filter(
      (i) => i.overallStatus === 'PASS'
    ).length;
    const conditionalCount = filteredInspections.filter(
      (i) => i.overallStatus === 'CONDITIONAL'
    ).length;
    const rejectCount = filteredInspections.filter(
      (i) => i.overallStatus === 'REJECT'
    ).length;
    const passRate = ((passCount / totalInspections) * 100).toFixed(1);

    const materialMap = {};

    filteredInspections.forEach((record) => {
      if (record.bomComparison && Array.isArray(record.bomComparison)) {
        record.bomComparison.forEach((mat) => {
          const key = `${mat.materialName} (${mat.unit})`;
          if (!materialMap[key]) {
            materialMap[key] = {
              name: mat.materialName,
              unit: mat.unit,
              totalPlanned: 0,
              totalActual: 0,
            };
          }
          materialMap[key].totalPlanned += parseFloat(mat.planned) || 0;
          materialMap[key].totalActual += parseFloat(mat.actual) || 0;
        });
      }
    });

    const aggregatedMaterials = Object.values(materialMap).map((item) => {
      const diff = item.totalActual - item.totalPlanned;
      const devPct =
        item.totalPlanned > 0 ? (diff / item.totalPlanned) * 100 : 0;
      return {
        ...item,
        totalPlannedFormatted: parseFloat(item.totalPlanned.toFixed(2)),
        totalActualFormatted: parseFloat(item.totalActual.toFixed(2)),
        diffFormatted: parseFloat(diff.toFixed(2)),
        devPctFormatted: parseFloat(devPct.toFixed(2)),
      };
    });

    let totalReportedWaste = 0;
    let totalActualWaste = 0;
    let totalDiscrepancies = 0;

    filteredInspections.forEach((r) => {
      if (r.wasteAudit) {
        totalReportedWaste += parseFloat(r.wasteAudit.reportedWaste) || 0;
        totalActualWaste += parseFloat(r.wasteAudit.actualMeasuredWaste) || 0;
        if (r.wasteAudit.status === 'DISCREPANCY_HIGH') totalDiscrepancies += 1;
      }
    });

    return {
      totalInspections,
      passCount,
      conditionalCount,
      rejectCount,
      passRate,
      aggregatedMaterials,
      wasteSummary: {
        totalReported: parseFloat(totalReportedWaste.toFixed(2)),
        totalActual: parseFloat(totalActualWaste.toFixed(2)),
        discrepancyCount: totalDiscrepancies,
      },
    };
  }, [filteredInspections]);

  // TRIGGER PRINT FUNCTIONS
  const triggerPrintSummaryReport = () => {
    setPrintPreviewModal({
      isOpen: true,
      type: 'SUMMARY',
      data: summaryMetrics,
    });
  };

  const triggerPrintSingleInspection = (inspection) => {
    setPrintPreviewModal({
      isOpen: true,
      type: 'SINGLE',
      data: inspection,
    });
  };

  const executeBrowserPrint = () => {
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* STYLE KHUSUS PRINT PDF */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-document, .printable-document * {
            visibility: visible;
          }
          .printable-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`toast-notification fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border transition-all animate-bounce ${
            toastMessage.type === 'error'
              ? 'bg-rose-950 border-rose-600 text-rose-200'
              : 'bg-emerald-950 border-emerald-600 text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          ) : (
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          )}
          <div className="text-sm font-semibold">{toastMessage.text}</div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700/80 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-wide flex items-center gap-2">
                  OP-INSPECT{' '}
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono border border-indigo-500/30">
                    Firestore Sync
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Custom Product BoM Calculator & Field QC Inspection
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              {[
                { id: 'new_inspection', label: '+ Inspeksi & BoM Calc', icon: Calculator },
                { id: 'summary', label: '📊 Summary & Rekap Laporan', icon: FileText },
                { id: 'dashboard', label: 'Dashboard & KPI', icon: BarChart3 },
                { id: 'history', label: 'Riwayat Audit', icon: ClipboardCheck },
                { id: 'formulas', label: 'Master Formula & BoM Editor', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 no-print">
        {/* TAB 1: NEW INSPECTION */}
        {activeTab === 'new_inspection' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-indigo-400" /> Form Inspeksi Produk Custom & BoM Calculator
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  <b>Logika Inspeksi:</b> Step 1 Input Ukuran Produk → Sistem Hitung BoM Standar → Step 2 Input Realisasi Lapangan.
                </p>
              </div>

              <div className="flex items-center space-x-3 bg-slate-900/80 p-2 rounded-xl border border-slate-700">
                <button
                  onClick={() => setInspectionStep(1)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    inspectionStep === 1
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
                  <span>Step 1: Input Dimensi & Calc BoM</span>
                </button>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <button
                  onClick={() => {
                    syncDefaultsForStep2();
                    setInspectionStep(2);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    inspectionStep === 2
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
                  <span>Step 2: Realisasi Lapangan & Audit</span>
                </button>
              </div>
            </div>

            {inspectionStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Informasi Order & Model Produk Custom
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Model / Template Produk Custom:
                      </label>
                      <select
                        value={selectedProductTemplateId}
                        onChange={(e) => setSelectedProductTemplateId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none"
                      >
                        {productTemplates.length === 0 && (
                          <option value="">(Belum Ada Template di Firestore)</option>
                        )}
                        {productTemplates.map((tmpl) => (
                          <option key={tmpl.docId} value={tmpl.docId}>
                            {tmpl.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Nomor Work Order (WO):
                      </label>
                      <input
                        type="text"
                        value={woNumberInput}
                        onChange={(e) => setWoNumberInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                        placeholder="Contoh: WO-8801"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Nomor Sales Order (SO) & Customer:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={soNumberInput}
                          onChange={(e) => setSoNumberInput(e.target.value)}
                          className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none font-mono"
                          placeholder="No SO"
                        />
                        <input
                          type="text"
                          value={customerInput}
                          onChange={(e) => setCustomerInput(e.target.value)}
                          className="w-1/2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                          placeholder="Nama Customer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {currentTemplate ? (
                  <>
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800 to-indigo-950/40 border border-slate-700 space-y-4 shadow-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Ruler className="w-5 h-5 text-indigo-400" /> Input Dimensi Spesifikasi Produk (Ukuran SO)
                        </h3>
                        <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                          Satuan: {currentTemplate?.unitDim}
                        </span>
                      </div>

                      {/* PERBAIKAN: INSPEKSI UKURAN P, L, T DITAMPILKAN KEMBALI SECARA PENUH */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                        <div>
                          <label className="text-xs font-bold text-indigo-300 block mb-1">
                            Panjang (P) [{currentTemplate?.unitDim}]
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={dimP}
                            onChange={(e) => setDimP(e.target.value)}
                            className="w-full bg-slate-800 border-2 border-indigo-500/60 rounded-lg px-3 py-2 font-mono text-lg text-white font-bold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-indigo-300 block mb-1">
                            Lebar (L) [{currentTemplate?.unitDim}]
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={dimL}
                            onChange={(e) => setDimL(e.target.value)}
                            className="w-full bg-slate-800 border-2 border-indigo-500/60 rounded-lg px-3 py-2 font-mono text-lg text-white font-bold focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-indigo-300 block mb-1">
                            Tinggi (T) [{currentTemplate?.unitDim}]
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={dimT}
                            onChange={(e) => setDimT(e.target.value)}
                            className="w-full bg-slate-800 border-2 border-indigo-500/60 rounded-lg px-3 py-2 font-mono text-lg text-white font-bold focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-400 block mb-1">
                            Jumlah / Qty Order
                          </label>
                          <input
                            type="number"
                            value={dimQ}
                            onChange={(e) => setDimQ(e.target.value)}
                            className="w-full bg-slate-800 border-2 border-emerald-500/60 rounded-lg px-3 py-2 font-mono text-lg text-white font-bold focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                        <h3 className="font-bold text-white text-base flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-indigo-400" /> Hasil Kalkulasi Otomatis BoM Standar
                        </h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                            <tr>
                              <th className="py-2.5 px-3">Komponen / Bahan</th>
                              <th className="py-2.5 px-3">Rumus Formula Custom</th>
                              <th className="py-2.5 px-3">Hasil Kalkulasi Target</th>
                              <th className="py-2.5 px-3">Satuan</th>
                              <th className="py-2.5 px-3">Toleransi Operasional</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
                            {calculatedTargetBom.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-750">
                                <td className="py-3 px-3 font-sans font-semibold text-slate-200">
                                  {item.name}
                                </td>
                                <td className="py-3 px-3 text-indigo-400 bg-slate-900/60 px-2 py-1 rounded">
                                  {item.formulaText}
                                </td>
                                <td className="py-3 px-3 font-bold text-emerald-400 text-sm">
                                  {item.calculatedQty}
                                </td>
                                <td className="py-3 px-3 text-slate-300 font-sans">
                                  {item.unit}
                                </td>
                                <td className="py-3 px-3 text-slate-400">
                                  ±{item.tolerancePct}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          onClick={() => {
                            syncDefaultsForStep2();
                            setInspectionStep(2);
                          }}
                          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all"
                        >
                          <span>Lanjut ke Step 2: Input Realisasi Lapangan</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center bg-slate-800 rounded-2xl border border-slate-700 text-slate-400">
                    Silakan tambahkan <b>Template Produk Baru</b> terlebih dahulu di menu <b>Master Formula</b>.
                  </div>
                )}
              </div>
            )}

            {inspectionStep === 2 && (
              <form onSubmit={handleSubmitInspection} className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-800 border border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block">Produk:</span>
                    <span className="font-bold text-white text-sm">{currentTemplate?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Shift Kerja:</span>
                    <select
                      value={shiftInput}
                      onChange={(e) => setShiftInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-semibold mt-1 focus:outline-none"
                    >
                      <option value="Shift 1 - Pagi">Shift 1 - Pagi</option>
                      <option value="Shift 2 - Siang">Shift 2 - Siang</option>
                      <option value="Shift 3 - Malam">Shift 3 - Malam</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Inspector QC:</span>
                    <input
                      type="text"
                      value={inspectorInput}
                      onChange={(e) => setInspectorInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-semibold mt-1 focus:outline-none"
                      placeholder="Nama Inspector"
                      required
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => setInspectionStep(1)}
                      className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Ubah Dimensi (Step 1)
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                  <h3 className="font-bold text-white text-base">1. Realisasi Pemakaian Bahan Baku</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Komponen</th>
                          <th className="py-2.5 px-3">Satuan</th>
                          <th className="py-2.5 px-3">Target BoM</th>
                          <th className="py-2.5 px-3 w-40">Pemakaian Aktual</th>
                          <th className="py-2.5 px-3">Deviasi (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/60 text-xs">
                        {auditEvaluation?.bomDetails.map((item) => (
                          <tr key={item.materialId}>
                            <td className="py-3 px-3 font-semibold text-slate-200">{item.materialName}</td>
                            <td className="py-3 px-3 text-slate-400">{item.unit}</td>
                            <td className="py-3 px-3 font-mono font-bold text-indigo-300">{item.planned}</td>
                            <td className="py-3 px-3">
                              <input
                                type="number"
                                step="any"
                                value={actualBomUsage[item.materialId] || ''}
                                onChange={(e) =>
                                  setActualBomUsage({
                                    ...actualBomUsage,
                                    [item.materialId]: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded px-2.5 py-1.5 font-mono text-white text-sm font-bold"
                                required
                              />
                            </td>
                            <td className="py-3 px-3 font-mono font-bold">{item.devPct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                  <h3 className="font-bold text-white text-base">2. Audit Waste & Catatan Inspeksi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Waste Operator:</label>
                      <input
                        type="number"
                        step="any"
                        value={reportedWasteVal}
                        onChange={(e) => setReportedWasteVal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Waste QC Terukur:</label>
                      <input
                        type="number"
                        step="any"
                        value={actualWasteVal}
                        onChange={(e) => setActualWasteVal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Catatan QC Inspeksi Tambahan:</label>
                    <textarea
                      rows={2}
                      value={inspectionNotes}
                      onChange={(e) => setInspectionNotes(e.target.value)}
                      placeholder="Masukkan catatan pendukung (opsional)..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-2"
                  >
                    <ClipboardCheck className="w-5 h-5" />
                    <span>Simpan Hasil Inspeksi ke Firestore</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800 via-indigo-950/60 to-slate-800 border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-400" /> Ringkasan & Rekapitulasi Laporan QC Operasional
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Akumulasi total konsumsi bahan baku dan audit waste berdasarkan filter rentang tanggal.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor CSV / Excel</span>
                </button>
                <button
                  onClick={triggerPrintSummaryReport}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Export PDF Summary</span>
                </button>
              </div>
            </div>

            {/* Filter Tanggal */}
            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-slate-300">Mulai Tanggal:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-300">S/D Tanggal:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {(startDate || endDate) && (
                  <button
                    onClick={handleResetDateFilter}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-400">
                Menampilkan Data: <strong className="text-white font-mono">{summaryMetrics?.totalInspections || 0}</strong> Item Inspeksi
              </div>
            </div>

            {/* KPI Cards */}
            {summaryMetrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Order</span>
                    <div className="text-3xl font-black text-white mt-1">{summaryMetrics.totalInspections}</div>
                  </div>
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pass Rate</span>
                    <div className="text-3xl font-black text-emerald-400 mt-1">{summaryMetrics.passRate}%</div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Reject</span>
                    <div className="text-3xl font-black text-rose-400 mt-1">{summaryMetrics.rejectCount}</div>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Waste Discrepancy</span>
                    <div className="text-3xl font-black text-amber-400 mt-1">{summaryMetrics.wasteSummary.discrepancyCount}</div>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-800 rounded-2xl border border-slate-700 text-slate-400">
                Belum ada data inspeksi tersimpan di Firestore.
              </div>
            )}

            {/* Rekap Table */}
            {summaryMetrics && (
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                <h3 className="font-bold text-white text-base">Rekapitulasi Akumulasi Bahan Baku</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Nama Bahan</th>
                        <th className="py-3 px-4">Satuan</th>
                        <th className="py-3 px-4 text-right">Total Target</th>
                        <th className="py-3 px-4 text-right">Total Aktual</th>
                        <th className="py-3 px-4 text-right">Selisih</th>
                        <th className="py-3 px-4 text-right">Deviasi (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
                      {summaryMetrics.aggregatedMaterials.map((mat, idx) => (
                        <tr key={idx} className="hover:bg-slate-750">
                          <td className="py-3.5 px-4 font-sans font-bold text-white">{mat.name}</td>
                          <td className="py-3.5 px-4 text-slate-400 font-sans">{mat.unit}</td>
                          <td className="py-3.5 px-4 text-right text-indigo-300 font-bold">{mat.totalPlannedFormatted}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-white">{mat.totalActualFormatted}</td>
                          <td className={`py-3.5 px-4 text-right font-bold ${mat.diffFormatted > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {mat.diffFormatted > 0 ? `+${mat.diffFormatted}` : mat.diffFormatted}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold">{mat.devPctFormatted}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-400">Total Inspeksi</span>
                <div className="text-3xl font-extrabold text-white mt-2">{summaryMetrics?.totalInspections || 0}</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-400">Pass Rate</span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2">{summaryMetrics?.passRate || 0}%</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-400">Order Reject</span>
                <div className="text-3xl font-extrabold text-rose-400 mt-2">{summaryMetrics?.rejectCount || 0}</div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-400">Waste Discrepancy</span>
                <div className="text-3xl font-extrabold text-amber-400 mt-2">{summaryMetrics?.wasteSummary?.discrepancyCount || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RIWAYAT AUDIT */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800 border border-slate-700">
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari ID, WO, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs w-full lg:w-auto">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none text-xs"
                  />
                  <span className="text-slate-500">s/d</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none text-xs"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="PASS">PASS (Lulus)</option>
                    <option value="CONDITIONAL">CONDITIONAL</option>
                    <option value="REJECT">REJECT (Cacat)</option>
                  </select>
                </div>

                {(startDate || endDate) && (
                  <button
                    onClick={handleResetDateFilter}
                    className="p-1.5 bg-rose-600/20 hover:bg-rose-600 rounded-lg text-rose-300 hover:text-white transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Tanggal & ID</th>
                    <th className="py-3 px-4">WO / Customer</th>
                    <th className="py-3 px-4">Spesifikasi</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 text-xs">
                  {filteredInspections.length > 0 ? (
                    filteredInspections.map((item) => (
                      <tr key={item.docId} className="hover:bg-slate-750">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                          <div>{item.id || item.docId}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{item.date}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {item.woNumber} - {item.customer}
                        </td>
                        <td className="py-3.5 px-4">{item.productName}</td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] ${
                              item.overallStatus === 'PASS'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : item.overallStatus === 'REJECT'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {item.overallStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => triggerPrintSingleInspection(item)}
                            className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600 rounded-lg text-indigo-300 hover:text-white transition-all"
                            title="Cetak PDF Sertifikat QC"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedInspection(item)}
                            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-all"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInspection(item.docId, item.id)}
                            className="p-1.5 bg-rose-600/20 hover:bg-rose-600 rounded-lg text-rose-300 hover:text-white border border-rose-500/30 transition-all"
                            title="Hapus Record Inspeksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        Tidak ada data inspeksi tersimpan di Firestore.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: MASTER FORMULA EDITOR */}
        {activeTab === 'formulas' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-indigo-400" /> Master Formula & Editor BoM Custom
                </h2>
              </div>
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Template Produk Baru</span>
              </button>
            </div>

            <div className="space-y-6">
              {productTemplates.length === 0 ? (
                <div className="p-8 text-center bg-slate-800 rounded-2xl border border-slate-700 text-slate-400">
                  Belum ada template produk di Firestore. Klik <b>Tambah Template Produk Baru</b> untuk membuat.
                </div>
              ) : (
                productTemplates.map((tmpl) => (
                  <div key={tmpl.docId} className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {tmpl.customId || tmpl.docId}
                        </span>
                        <h3 className="font-bold text-white text-lg mt-0.5">{tmpl.name}</h3>
                      </div>

                      <button
                        onClick={() => handleAddFormulaRow(tmpl.docId)}
                        className="text-xs bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-3 py-1.5 rounded-lg font-bold border border-emerald-500/30 flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Komponen Bahan
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900/80 text-slate-400 uppercase border-b border-slate-700">
                          <tr>
                            <th className="py-2.5 px-3">Nama Bahan</th>
                            <th className="py-2.5 px-3">Satuan</th>
                            <th className="py-2.5 px-3">Rumus Formula Custom</th>
                            <th className="py-2.5 px-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/60 font-mono">
                          {tmpl.bomFormulas?.map((f) => (
                            <tr key={f.id} className="hover:bg-slate-750">
                              <td className="py-2.5 px-3 font-sans">
                                <input
                                  type="text"
                                  value={f.name}
                                  onChange={(e) =>
                                    handleUpdateFormulaItem(tmpl.docId, f.id, 'name', e.target.value)
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                                />
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                <input
                                  type="text"
                                  value={f.unit}
                                  onChange={(e) =>
                                    handleUpdateFormulaItem(tmpl.docId, f.id, 'unit', e.target.value)
                                  }
                                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-indigo-300 text-xs"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  value={f.formula}
                                  onChange={(e) =>
                                    handleUpdateFormulaItem(tmpl.docId, f.id, 'formula', e.target.value)
                                  }
                                  className="w-full bg-slate-900 border border-indigo-500/50 rounded px-2.5 py-1 text-emerald-400 font-mono text-xs font-bold"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => handleDeleteFormulaRow(tmpl.docId, f.id)}
                                  className="p-1 rounded bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL VIEW INSPECTION DETAIL */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 no-print">
          <div className="bg-slate-800 border border-slate-700 text-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedInspection(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 border-b border-slate-700 pb-3">
              <ClipboardCheck className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="font-bold text-lg">{selectedInspection.id || selectedInspection.docId}</h3>
                <p className="text-xs text-slate-400">{selectedInspection.date} | {selectedInspection.inspector}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><strong className="text-slate-400">WO / SO:</strong> {selectedInspection.woNumber} / {selectedInspection.soNumber}</div>
              <div><strong className="text-slate-400">Customer:</strong> {selectedInspection.customer}</div>
              <div className="col-span-2"><strong className="text-slate-400">Produk & Ukuran:</strong> {selectedInspection.productName}</div>
              <div className="col-span-2"><strong className="text-slate-400">Catatan QC:</strong> {selectedInspection.statusReason}</div>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-xs uppercase text-indigo-300 mb-2">Perbandingan BoM</h4>
              <div className="bg-slate-900 rounded-xl p-3 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-1">Bahan</th>
                      <th className="pb-1">Target</th>
                      <th className="pb-1">Aktual</th>
                      <th className="pb-1">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {selectedInspection.bomComparison?.map((m, idx) => (
                      <tr key={idx}>
                        <td className="py-1 font-sans">{m.materialName}</td>
                        <td className="py-1">{m.planned} {m.unit}</td>
                        <td className="py-1">{m.actual} {m.unit}</td>
                        <td className="py-1">
                          <span className={m.status === 'OK' ? 'text-emerald-400' : 'text-rose-400'}>{m.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PRODUCT TEMPLATE BARU (AUTO CLOSE SETELAH SIMPAN) */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4 no-print">
          <form onSubmit={handleSaveNewProduct} className="bg-slate-800 border border-slate-700 text-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddProductModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-400">
              <PlusCircle className="w-5 h-5" /> Tambah Template Produk Custom Baru
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">ID Produk Custom (Unik):</label>
                <input
                  type="text"
                  placeholder="misal: PROD-WOOD01"
                  value={newProductForm.customId}
                  onChange={(e) => setNewProductForm({...newProductForm, customId: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Kategori Produk:</label>
                <input
                  type="text"
                  value={newProductForm.category}
                  onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">Nama Deskripsi Produk:</label>
                <input
                  type="text"
                  placeholder="misal: Wooden Blinds 50mm Premium Series"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="px-4 py-2 bg-slate-700 text-slate-300 text-xs rounded-xl font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-xl font-bold shadow-lg"
              >
                Simpan ke Firestore
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* TEMPLATE LAPORAN PRINT / PDF PREVIEW       */}
      {/* ========================================== */}
      {printPreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex justify-center items-start overflow-y-auto p-4">
          <div className="bg-white text-slate-900 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 border border-slate-300 printable-document animate-fadeIn">
            {/* Header Modal Action Bar (Hidden when Printing) */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm">Preview Cetak Dokumen PDF</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={executeBrowserPrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() =>
                    setPrintPreviewModal({
                      isOpen: false,
                      type: 'SUMMARY',
                      data: null,
                    })
                  }
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ISI TEMPLATE DOKUMEN CETAK */}
            <div className="p-8 space-y-6 text-slate-900">
              {/* Header Dokumen */}
              <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-black tracking-wider text-slate-900">
                    FABRICA INDONESIA
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold">
                    Laporan Resmi QC & Audit Consumable BoM Custom
                  </p>
                </div>
                <div className="text-right text-xs font-mono text-slate-500">
                  Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}
                </div>
              </div>

              {/* MODEL TEMPLATE 1: SUMMARY REPORT */}
              {printPreviewModal.type === 'SUMMARY' && summaryMetrics && (
                <div className="space-y-6">
                  <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                    <h3 className="font-bold text-sm text-slate-800 uppercase mb-2">
                      Ringkasan Kinerja QC Operasional
                    </h3>
                    <div className="grid grid-cols-4 gap-4 text-xs font-mono">
                      <div>Total Order: <strong>{summaryMetrics.totalInspections}</strong></div>
                      <div>Pass Rate: <strong className="text-emerald-700">{summaryMetrics.passRate}%</strong></div>
                      <div>Order Reject: <strong className="text-rose-700">{summaryMetrics.rejectCount}</strong></div>
                      <div>Discrepancy: <strong>{summaryMetrics.wasteSummary.discrepancyCount}</strong></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase text-slate-800 mb-3 border-b pb-1">
                      Akumulasi Rekapitulasi Pemakaian Bahan Baku (BoM)
                    </h4>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                          <th className="py-2 px-3">Nama Bahan Baku</th>
                          <th className="py-2 px-3">Satuan</th>
                          <th className="py-2 px-3 text-right">Total Target BoM</th>
                          <th className="py-2 px-3 text-right">Total Realisasi</th>
                          <th className="py-2 px-3 text-right">Selisih Varian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {summaryMetrics.aggregatedMaterials.map((mat, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-sans font-semibold text-slate-900">{mat.name}</td>
                            <td className="py-2 px-3 font-sans text-slate-600">{mat.unit}</td>
                            <td className="py-2 px-3 text-right">{mat.totalPlannedFormatted}</td>
                            <td className="py-2 px-3 text-right font-bold">{mat.totalActualFormatted}</td>
                            <td className={`py-2 px-3 text-right font-bold ${mat.diffFormatted > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                              {mat.diffFormatted > 0 ? `+${mat.diffFormatted}` : mat.diffFormatted}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MODEL TEMPLATE 2: SERTIFIKAT SINGLE INSPECTION (UKURAN PRODUK DITAMPILKAN DI SINI) */}
              {printPreviewModal.type === 'SINGLE' && printPreviewModal.data && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="space-y-1 text-xs">
                      <div><strong className="text-slate-600">ID Inspeksi:</strong> <span className="font-mono font-bold text-slate-900">{printPreviewModal.data.id || printPreviewModal.data.docId}</span></div>
                      <div><strong className="text-slate-600">Work Order (WO):</strong> {printPreviewModal.data.woNumber || '-'}</div>
                      <div><strong className="text-slate-600">Sales Order (SO):</strong> {printPreviewModal.data.soNumber || '-'}</div>
                      <div><strong className="text-slate-600">Customer:</strong> {printPreviewModal.data.customer || '-'}</div>
                      {/* PERBAIKAN: UKURAN / SPESIFIKASI DITAMPILKAN DI LAPORAN PDF */}
                      <div className="pt-1">
                        <strong className="text-slate-600">Spesifikasi Ukuran:</strong>{' '}
                        <span className="font-mono text-indigo-700 font-bold">
                          {printPreviewModal.data.dimInput 
                            ? `P: ${printPreviewModal.data.dimInput.P || 0} | L: ${printPreviewModal.data.dimInput.L || 0} | T: ${printPreviewModal.data.dimInput.T || 0} ${printPreviewModal.data.dimInput.unitDim || 'cm'} (Qty: ${printPreviewModal.data.dimInput.Q || 1})`
                            : printPreviewModal.data.productName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs space-y-1">
                      <div><strong className="text-slate-600">Tanggal:</strong> {printPreviewModal.data.date}</div>
                      <div><strong className="text-slate-600">Inspector:</strong> {printPreviewModal.data.inspector}</div>
                      <div><strong className="text-slate-600">Shift:</strong> {printPreviewModal.data.shift}</div>
                      <div className="pt-2">
                        <span className={`px-3 py-1 rounded text-xs font-bold border ${
                          printPreviewModal.data.overallStatus === 'PASS' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}>
                          STATUS: {printPreviewModal.data.overallStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase text-slate-800 mb-2 border-b pb-1">
                      Detail Pemakaian Bahan Baku (BoM Actual vs Target)
                    </h4>
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                          <th className="py-2 px-2">Komponen</th>
                          <th className="py-2 px-2 text-right">Target BoM</th>
                          <th className="py-2 px-2 text-right">Aktual Lapangan</th>
                          <th className="py-2 px-2 text-right">Deviasi</th>
                          <th className="py-2 px-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {printPreviewModal.data.bomComparison?.map((m, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-2 font-sans">{m.materialName}</td>
                            <td className="py-2 px-2 text-right">{m.planned} {m.unit}</td>
                            <td className="py-2 px-2 text-right font-bold">{m.actual} {m.unit}</td>
                            <td className="py-2 px-2 text-right">{m.devPct}%</td>
                            <td className="py-2 px-2 text-center font-sans font-bold">
                              {m.status === 'OK' ? (
                                <span className="text-emerald-700">OK</span>
                              ) : (
                                <span className="text-rose-700">{m.status}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs">
                    <strong>Catatan QC & Evaluasi Otomatis:</strong>
                    <p className="mt-1 text-slate-700 italic">{printPreviewModal.data.statusReason || 'Tidak ada catatan.'}</p>
                  </div>
                </div>
              )}

              {/* Signatures Footer */}
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-12"></div>
                  <p className="mt-2 font-bold text-slate-800">Inspector Quality Control</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-12"></div>
                  <p className="mt-2 font-bold text-slate-800">Head of Production / Supervisor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
