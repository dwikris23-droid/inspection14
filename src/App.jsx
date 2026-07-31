import React, { useState, useMemo, useEffect } from 'react';
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
  Eye,
  Printer,
  ShieldAlert,
  Check,
  Factory,
  Sliders,
  Calculator,
  ArrowRight,
  Settings,
  Info,
  Sparkles,
  RefreshCw,
  Scissors,
  ChevronDown,
  CheckSquare,
  Edit3,
  Save,
  PlusCircle,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  FileSpreadsheet,
  Download,
  Activity,
  HardDrive,
  RotateCcw,
} from 'lucide-react';

// Dynamic Formula Evaluator Engine (Support L, T, P, Q and JS math operators)
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

const INITIAL_PRODUCT_TEMPLATES = [
  {
    id: 'PROD-RB01',
    name: 'Roller Blinds (RBO01 Blackout Series)',
    category: 'Window Blinds',
    defaultL: 120,
    defaultT: 200,
    defaultP: 0,
    defaultQ: 1,
    unitDim: 'cm',
    bomFormulas: [
      {
        id: 'M1',
        name: 'Kain RBO01 Blackout',
        unit: 'm²',
        formula: '((L-3)*(T+25))/10000',
        tolerancePct: 3,
        note: 'Potongan kain utama + overlap gulungan',
      },
      {
        id: 'M2',
        name: 'Tube Aluminium 38mm',
        unit: 'cm',
        formula: 'L - 3',
        tolerancePct: 2,
        note: 'Pipa roll atas',
      },
      {
        id: 'M3',
        name: 'Headrail Profile Top',
        unit: 'cm',
        formula: 'L - 3',
        tolerancePct: 2,
        note: 'Rel pembungkus atas',
      },
      {
        id: 'M4',
        name: 'Bottom Rail Heavy Duty',
        unit: 'cm',
        formula: 'L - 3',
        tolerancePct: 2,
        note: 'Pemberat bagian bawah',
      },
      {
        id: 'M5',
        name: 'Roller Mechanism Set',
        unit: 'Set',
        formula: '1',
        tolerancePct: 0,
        note: 'Mekanisme rantai dan spring',
      },
      {
        id: 'M6',
        name: 'Bracket Mounting',
        unit: 'Pcs',
        formula: 'L > 150 ? 3 : 2',
        tolerancePct: 0,
        note: '2 pcs jika L<=150cm, 3 pcs jika >150cm',
      },
      {
        id: 'M7',
        name: 'Chain Tarikan Nylon',
        unit: 'cm',
        formula: '(T * 2) - 20',
        tolerancePct: 5,
        note: 'Panjang keliling rantai',
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
        name: 'Tinggi Akhir (T)',
        targetFormula: 'T',
        minTol: -0.5,
        maxTol: 0.5,
        unit: 'cm',
      },
      {
        id: 'S3',
        name: 'Pemotongan Tube (Cut)',
        targetFormula: 'L - 3',
        minTol: -0.1,
        maxTol: 0.1,
        unit: 'cm',
      },
    ],
    estWasteStandardPct: 3.0,
  },
  {
    id: 'PROD-ZB02',
    name: 'Zebra Blinds / Dual Shade Premium',
    category: 'Window Blinds',
    defaultL: 150,
    defaultT: 180,
    defaultP: 0,
    defaultQ: 1,
    unitDim: 'cm',
    bomFormulas: [
      {
        id: 'M1',
        name: 'Kain Zebra Stripe Dual',
        unit: 'm²',
        formula: '((L-3)*(T*2+30))/10000',
        tolerancePct: 3,
        note: 'Dual layer fabric formula',
      },
      {
        id: 'M2',
        name: 'Tube Aluminium Zebra 38mm',
        unit: 'cm',
        formula: 'L - 3',
        tolerancePct: 2,
        note: 'Pipa atas Zebra',
      },
      {
        id: 'M3',
        name: 'Cassette Cover Box',
        unit: 'cm',
        formula: 'L - 1',
        tolerancePct: 2,
        note: 'Box penutup zebra',
      },
      {
        id: 'M4',
        name: 'Bottom Roller Tube',
        unit: 'cm',
        formula: 'L - 3',
        tolerancePct: 2,
        note: 'Rel bawah double',
      },
      {
        id: 'M5',
        name: 'Zebra Mechanism Kit',
        unit: 'Set',
        formula: '1',
        tolerancePct: 0,
        note: 'Mekanisme putar zebra',
      },
      {
        id: 'M6',
        name: 'Bracket Cassette',
        unit: 'Pcs',
        formula: 'L > 140 ? 3 : 2',
        tolerancePct: 0,
        note: 'Bracket gantung box',
      },
    ],
    soDimensionSpecs: [
      {
        id: 'S1',
        name: 'Lebar Box Cassette',
        targetFormula: 'L - 1',
        minTol: -0.2,
        maxTol: 0.2,
        unit: 'cm',
      },
      {
        id: 'S2',
        name: 'Tinggi Total Drop (T)',
        targetFormula: 'T',
        minTol: -0.5,
        maxTol: 0.5,
        unit: 'cm',
      },
    ],
    estWasteStandardPct: 3.5,
  },
  {
    id: 'PROD-BOX01',
    name: 'Custom Box Karton Flute (P x L x T)',
    category: 'Packaging',
    defaultL: 30,
    defaultT: 20,
    defaultP: 15,
    defaultQ: 100,
    unitDim: 'cm',
    bomFormulas: [
      {
        id: 'M1',
        name: 'Lembaran Karton Corrugated B-Flute',
        unit: 'm²',
        formula: '(((2*L + 2*T + 5)*(P + T + 3))/10000) * Q',
        tolerancePct: 4,
        note: 'Luas bentangan sheet karton',
      },
      {
        id: 'M2',
        name: 'Lem Industri Cold Glue',
        unit: 'Kg',
        formula: '0.005 * Q',
        tolerancePct: 5,
        note: 'Lem sambungan kuping',
      },
      {
        id: 'M3',
        name: 'Tinta Cetak Waterbased',
        unit: 'Kg',
        formula: '0.002 * Q',
        tolerancePct: 5,
        note: 'Sablon logo & keterangan',
      },
    ],
    soDimensionSpecs: [
      {
        id: 'S1',
        name: 'Panjang Luar Box',
        targetFormula: 'L',
        minTol: -0.2,
        maxTol: 0.2,
        unit: 'cm',
      },
      {
        id: 'S2',
        name: 'Lebar Luar Box',
        targetFormula: 'T',
        minTol: -0.2,
        maxTol: 0.2,
        unit: 'cm',
      },
      {
        id: 'S3',
        name: 'Tinggi Luar Box',
        targetFormula: 'P',
        minTol: -0.2,
        maxTol: 0.2,
        unit: 'cm',
      },
    ],
    estWasteStandardPct: 4.0,
  },
];

const INITIAL_INSPECTIONS = [
  {
    id: 'INSP-2026-101',
    date: '2026-07-29 09:30',
    woNumber: 'WO-CUSTOM-8801',
    soNumber: 'SO-IND-9912',
    customer: 'PT Horizon Design Interior',
    productName: 'Roller Blinds (RBO01 Blackout Series)',
    dimInput: { L: 120, T: 200, P: 0, Q: 1, unitDim: 'cm' },
    inspector: 'Deni Kurniawan (QC Lead)',
    shift: 'Shift 1 - Pagi',
    overallStatus: 'PASS',
    statusReason:
      'Semua pemakaian BoM hasil kalkulasi L120 T200 dan ukuran fisik sesuai toleransi SO.',
    bomComparison: [
      {
        materialName: 'Kain RBO01 Blackout',
        unit: 'm²',
        planned: 2.63,
        actual: 2.68,
        devPct: 1.9,
        formula: '((L-3)*(T+25))/10000',
        status: 'OK',
      },
      {
        materialName: 'Tube Aluminium 38mm',
        unit: 'cm',
        planned: 117,
        actual: 117,
        devPct: 0,
        formula: 'L - 3',
        status: 'OK',
      },
      {
        materialName: 'Headrail Profile Top',
        unit: 'cm',
        planned: 117,
        actual: 117,
        devPct: 0,
        formula: 'L - 3',
        status: 'OK',
      },
      {
        materialName: 'Bottom Rail Heavy Duty',
        unit: 'cm',
        planned: 117,
        actual: 117,
        devPct: 0,
        formula: 'L - 3',
        status: 'OK',
      },
      {
        materialName: 'Roller Mechanism Set',
        unit: 'Set',
        planned: 1,
        actual: 1,
        devPct: 0,
        formula: '1',
        status: 'OK',
      },
      {
        materialName: 'Bracket Mounting',
        unit: 'Pcs',
        planned: 2,
        actual: 2,
        devPct: 0,
        formula: 'L > 150 ? 3 : 2',
        status: 'OK',
      },
    ],
    wasteAudit: {
      reportedWaste: 0.15,
      actualMeasuredWaste: 0.16,
      wasteUnit: 'm²',
      varianceWaste: 0.01,
      variancePct: 6.67,
      status: 'VERIFIED',
      notes: 'Sisa potongan ujung kain rol normal.',
    },
    soDimensionCheck: [
      {
        specName: 'Lebar Akhir (L)',
        target: 120,
        unit: 'cm',
        actual: 120.1,
        status: 'PASS',
        remark: 'Toleransi ±0.2 cm',
      },
      {
        specName: 'Tinggi Akhir (T)',
        target: 200,
        unit: 'cm',
        actual: 199.8,
        status: 'PASS',
        remark: 'Toleransi ±0.5 cm',
      },
      {
        specName: 'Pemotongan Tube (Cut)',
        target: 117,
        unit: 'cm',
        actual: 117.0,
        status: 'PASS',
        remark: 'In Spec',
      },
    ],
  },
  {
    id: 'INSP-2026-102',
    date: '2026-07-29 11:15',
    woNumber: 'WO-CUSTOM-8802',
    soNumber: 'SO-IND-9915',
    customer: 'CV Sinar Megah Blinds',
    productName: 'Roller Blinds (RBO01 Blackout Series)',
    dimInput: { L: 180, T: 220, P: 0, Q: 2, unitDim: 'cm' },
    inspector: 'Ahmad Zaky (QC Inspector)',
    shift: 'Shift 1 - Pagi',
    overallStatus: 'PASS',
    statusReason: 'Pemakaian BoM akurat dan ukuran fisik masuk toleransi.',
    bomComparison: [
      {
        materialName: 'Kain RBO01 Blackout',
        unit: 'm²',
        planned: 8.67,
        actual: 8.85,
        devPct: 2.07,
        formula: '((L-3)*(T+25))/10000 * Q',
        status: 'OK',
      },
      {
        materialName: 'Tube Aluminium 38mm',
        unit: 'cm',
        planned: 354,
        actual: 354,
        devPct: 0,
        formula: '(L - 3) * Q',
        status: 'OK',
      },
      {
        materialName: 'Bracket Mounting',
        unit: 'Pcs',
        planned: 6,
        actual: 6,
        devPct: 0,
        formula: '3 * Q',
        status: 'OK',
      },
    ],
    wasteAudit: {
      reportedWaste: 0.25,
      actualMeasuredWaste: 0.28,
      wasteUnit: 'm²',
      varianceWaste: 0.03,
      variancePct: 12.0,
      status: 'VERIFIED',
      notes: 'Waste terukur dalam ambang wajar.',
    },
    soDimensionCheck: [
      {
        specName: 'Lebar Akhir (L)',
        target: 180,
        unit: 'cm',
        actual: 180.0,
        status: 'PASS',
        remark: 'Sesuai SO',
      },
      {
        specName: 'Tinggi Akhir (T)',
        target: 220,
        unit: 'cm',
        actual: 219.7,
        status: 'PASS',
        remark: 'Sesuai SO',
      },
    ],
  },
  {
    id: 'INSP-2026-103',
    date: '2026-07-28 15:40',
    woNumber: 'WO-CUSTOM-8790',
    soNumber: 'SO-KAY-3301',
    customer: 'PT Arsitek Graha Utama',
    productName: 'Zebra Blinds / Dual Shade Premium',
    dimInput: { L: 160, T: 190, P: 0, Q: 1, unitDim: 'cm' },
    inspector: 'Rian Hidayat (QC Officer)',
    shift: 'Shift 2 - Siang',
    overallStatus: 'CONDITIONAL',
    statusReason:
      'Terdapat sedikit pemborosan bahan kain Zebra (+5.2%), namun dimensi fisik produk lulus QC.',
    bomComparison: [
      {
        materialName: 'Kain Zebra Stripe Dual',
        unit: 'm²',
        planned: 6.44,
        actual: 6.8,
        devPct: 5.59,
        formula: '((L-3)*(T*2+30))/10000',
        status: 'EXCEEDED',
      },
      {
        materialName: 'Tube Aluminium Zebra 38mm',
        unit: 'cm',
        planned: 157,
        actual: 157,
        devPct: 0,
        formula: 'L - 3',
        status: 'OK',
      },
      {
        materialName: 'Cassette Cover Box',
        unit: 'cm',
        planned: 159,
        actual: 159,
        devPct: 0,
        formula: 'L - 1',
        status: 'OK',
      },
    ],
    wasteAudit: {
      reportedWaste: 0.2,
      actualMeasuredWaste: 0.35,
      wasteUnit: 'm²',
      varianceWaste: 0.15,
      variancePct: 75.0,
      status: 'DISCREPANCY_HIGH',
      notes: 'Selisih waste terukur lebih tinggi dari laporan operator shift.',
    },
    soDimensionCheck: [
      {
        specName: 'Lebar Box Cassette',
        target: 159,
        unit: 'cm',
        actual: 159.1,
        status: 'PASS',
        remark: 'In Spec',
      },
      {
        specName: 'Tinggi Total Drop (T)',
        target: 190,
        unit: 'cm',
        actual: 190.2,
        status: 'PASS',
        remark: 'In Spec',
      },
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('new_inspection');
  const [productTemplates, setProductTemplates] = useState(
    INITIAL_PRODUCT_TEMPLATES
  );
  const [inspections, setInspections] = useState(INITIAL_INSPECTIONS);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // PRINT / PDF PREVIEW MODAL STATE
  const [printPreviewModal, setPrintPreviewModal] = useState({
    isOpen: false,
    type: 'SUMMARY',
    data: null,
  });

  // Search & Filters for History & Summary
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // RENTANG TANGGAL FILTER STATE
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // STEP WORKFLOW STATE IN NEW INSPECTION
  const [inspectionStep, setInspectionStep] = useState(1);

  // Product Selection & Custom Dimensions State
  const [selectedProductTemplateId, setSelectedProductTemplateId] = useState(
    productTemplates[0]?.id || ''
  );
  const [woNumberInput, setWoNumberInput] = useState('WO-CUSTOM-2026-004');
  const [soNumberInput, setSoNumberInput] = useState('SO-CUST-88102');
  const [customerInput, setCustomerInput] = useState(
    'PT Decor Minimalis Indonesia'
  );
  const [shiftInput, setShiftInput] = useState('Shift 1 - Pagi');
  const [inspectorInput, setInspectorInput] = useState(
    'Ahmad Zaky (QC Inspector)'
  );

  // Dimensions State
  const [dimL, setDimL] = useState(120);
  const [dimT, setDimT] = useState(200);
  const [dimP, setDimP] = useState(0);
  const [dimQ, setDimQ] = useState(1);

  // Field Actuals Inputs
  const [actualBomUsage, setActualBomUsage] = useState({});
  const [reportedWasteVal, setReportedWasteVal] = useState('');
  const [actualWasteVal, setActualWasteVal] = useState('');
  const [actualDimensionsMeasured, setActualDimensionsMeasured] = useState({});
  const [inspectionNotes, setInspectionNotes] = useState('');

  // MODAL / EDITOR STATES
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    id: '',
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
    ],
    estWasteStandardPct: 3.0,
  });

  const currentTemplate = useMemo(() => {
    return (
      productTemplates.find((p) => p.id === selectedProductTemplateId) ||
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

  // ACTION: DELETE INSPECTION ITEM FROM HISTORY
  const handleDeleteInspection = (id) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data inspeksi ${id}?`)) {
      setInspections((prev) => prev.filter((item) => item.id !== id));
      if (selectedInspection?.id === id) {
        setSelectedInspection(null);
      }
      showToast(`Data inspeksi ${id} berhasil dihapus!`, 'error');
    }
  };

  // ACTION: RESET DATE RANGE FILTER
  const handleResetDateFilter = () => {
    setStartDate('');
    setEndDate('');
    showToast('Filter rentang tanggal berhasil di-reset.');
  };

  const calculatedTargetBom = useMemo(() => {
    if (!currentTemplate) return [];
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
    if (!currentTemplate) return [];
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

  const handleSubmitInspection = (e) => {
    e.preventDefault();
    if (!auditEvaluation) return;

    const newInspectionRecord = {
      id: `INSP-2026-${String(inspections.length + 101).padStart(3, '0')}`,
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

    setInspections([newInspectionRecord, ...inspections]);
    showToast(
      `Inspeksi ${newInspectionRecord.id} berhasil disimpan! Status: ${newInspectionRecord.overallStatus}`,
      newInspectionRecord.overallStatus === 'PASS' ? 'success' : 'error'
    );

    setInspectionStep(1);
    setActiveTab('summary');
  };

  const handleUpdateFormulaItem = (tmplId, formulaId, updatedField, value) => {
    setProductTemplates((prevTemplates) => {
      return prevTemplates.map((tmpl) => {
        if (tmpl.id !== tmplId) return tmpl;
        const updatedBom = tmpl.bomFormulas.map((f) => {
          if (f.id !== formulaId) return f;
          return { ...f, [updatedField]: value };
        });
        return { ...tmpl, bomFormulas: updatedBom };
      });
    });
    showToast('Rumus BoM berhasil diperbarui!');
  };

  const handleAddFormulaRow = (tmplId) => {
    setProductTemplates((prevTemplates) => {
      return prevTemplates.map((tmpl) => {
        if (tmpl.id !== tmplId) return tmpl;
        const newId = `M${tmpl.bomFormulas.length + 1}`;
        const newRow = {
          id: newId,
          name: 'Komponen Baru',
          unit: 'Pcs',
          formula: '1',
          tolerancePct: 2,
          note: 'Komponen tambahan',
        };
        return { ...tmpl, bomFormulas: [...tmpl.bomFormulas, newRow] };
      });
    });
    showToast('Komponen BoM baru ditambahkan!');
  };

  const handleDeleteFormulaRow = (tmplId, formulaId) => {
    setProductTemplates((prevTemplates) => {
      return prevTemplates.map((tmpl) => {
        if (tmpl.id !== tmplId) return tmpl;
        return {
          ...tmpl,
          bomFormulas: tmpl.bomFormulas.filter((f) => f.id !== formulaId),
        };
      });
    });
    showToast('Komponen BoM dihapus!');
  };

  // Filtered Inspections for History & Summary by Search, Status, and Date Range
  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || item.overallStatus === statusFilter;

      // Extract date string "YYYY-MM-DD"
      const itemDateStr = item.date.substring(0, 10);
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

  // COMPUTE EXECUTIVE SUMMARY & AGGREGATED BOM REKAP DATA BASED ON FILTERED INSPECTIONS
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
    let totalPlannedUnits = 0;
    let totalActualUnits = 0;

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
              exceededCount: 0,
              recordsCount: 0,
            };
          }
          materialMap[key].totalPlanned += parseFloat(mat.planned) || 0;
          materialMap[key].totalActual += parseFloat(mat.actual) || 0;
          materialMap[key].recordsCount += 1;
          if (mat.status === 'EXCEEDED') {
            materialMap[key].exceededCount += 1;
          }

          totalPlannedUnits += parseFloat(mat.planned) || 0;
          totalActualUnits += parseFloat(mat.actual) || 0;
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

    const netWasteVariance = totalActualWaste - totalReportedWaste;

    const shiftMap = {};
    filteredInspections.forEach((r) => {
      const s = r.shift || 'Shift 1 - Pagi';
      if (!shiftMap[s]) {
        shiftMap[s] = {
          shift: s,
          total: 0,
          pass: 0,
          conditional: 0,
          reject: 0,
        };
      }
      shiftMap[s].total += 1;
      if (r.overallStatus === 'PASS') shiftMap[s].pass += 1;
      if (r.overallStatus === 'CONDITIONAL') shiftMap[s].conditional += 1;
      if (r.overallStatus === 'REJECT') shiftMap[s].reject += 1;
    });

    const shiftData = Object.values(shiftMap);

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
        netVariance: parseFloat(netWasteVariance.toFixed(2)),
        discrepancyCount: totalDiscrepancies,
      },
      shiftData,
    };
  }, [filteredInspections]);

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

      {/* Top Header Navigation */}
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
                    Custom BoM v3.5
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Custom Product BoM Calculator & Field QC Inspection
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-1">
              {[
                {
                  id: 'new_inspection',
                  label: '+ Inspeksi & BoM Calc',
                  icon: Calculator,
                },
                {
                  id: 'summary',
                  label: '📊 Summary & Rekap Laporan',
                  icon: FileText,
                },
                { id: 'dashboard', label: 'Dashboard & KPI', icon: BarChart3 },
                { id: 'history', label: 'Riwayat Audit', icon: ClipboardCheck },
                {
                  id: 'formulas',
                  label: 'Master Formula & BoM Editor',
                  icon: Settings,
                },
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
                  <Calculator className="w-6 h-6 text-indigo-400" /> Form
                  Inspeksi Produk Custom & BoM Calculator
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  <b>Logika Inspeksi:</b> Step 1 Input Ukuran Produk → Sistem
                  Hitung BoM Standar → Step 2 Input Realisasi Lapangan.
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
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                    1
                  </span>
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
                  <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Step 2: Realisasi Lapangan & Audit</span>
                </button>
              </div>
            </div>

            {inspectionStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Informasi Order & Model
                      Produk Custom
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Model / Template Produk Custom:
                      </label>
                      <select
                        value={selectedProductTemplateId}
                        onChange={(e) =>
                          setSelectedProductTemplateId(e.target.value)
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:border-indigo-500 focus:outline-none"
                      >
                        {productTemplates.map((tmpl) => (
                          <option key={tmpl.id} value={tmpl.id}>
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

                <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800 to-indigo-950/40 border border-slate-700 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Ruler className="w-5 h-5 text-indigo-400" /> Input
                        Dimensi Spesifikasi Produk (Ukuran SO)
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                      Satuan: {currentTemplate?.unitDim}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-700">
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

                    {(currentTemplate?.id?.includes('BOX') || dimP > 0) && (
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
                    )}

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
                      <Sparkles className="w-5 h-5 text-indigo-400" /> Hasil
                      Kalkulasi Otomatis BoM Standar
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
              </div>
            )}

            {inspectionStep === 2 && (
              <form
                onSubmit={handleSubmitInspection}
                className="space-y-6 animate-fadeIn"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-800 border border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block">Produk:</span>
                    <span className="font-bold text-white text-sm">
                      {currentTemplate?.name}
                    </span>
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
                  <h3 className="font-bold text-white text-base">
                    1. Realisasi Pemakaian Bahan Baku
                  </h3>
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
                            <td className="py-3 px-3 font-semibold text-slate-200">
                              {item.materialName}
                            </td>
                            <td className="py-3 px-3 text-slate-400">
                              {item.unit}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-indigo-300">
                              {item.planned}
                            </td>
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
                            <td className="py-3 px-3 font-mono font-bold">
                              {item.devPct}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                  <h3 className="font-bold text-white text-base">
                    2. Audit Waste
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Waste Operator:
                      </label>
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
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Waste QC Terukur:
                      </label>
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
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-2"
                  >
                    <ClipboardCheck className="w-5 h-5" />
                    <span>Simpan Hasil Inspeksi</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: SUMMARY & REKAP LAPORAN */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800 via-indigo-950/60 to-slate-800 border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-400" /> Ringkasan &
                  Rekapitulasi Laporan QC Operasional
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Akumulasi total konsumsi bahan baku dan audit waste berdasarkan filter rentang tanggal.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={triggerPrintSummaryReport}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Export PDF Summary</span>
                </button>
              </div>
            </div>

            {/* BARIS TRIGGER FILTER RENTANG TANGGAL */}
            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-slate-300">
                    Mulai Tanggal:
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-300">
                    S/D Tanggal:
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* TOMBOL TRIGGER RESET FILTER TANGGAL */}
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
                Menampilkan Data:{' '}
                <strong className="text-white font-mono">
                  {summaryMetrics?.totalInspections || 0}
                </strong>{' '}
                Item Inspeksi
              </div>
            </div>

            {/* KPI Summary Cards */}
            {summaryMetrics ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total Order
                    </span>
                    <div className="text-3xl font-black text-white mt-1">
                      {summaryMetrics.totalInspections}
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Pass Rate
                    </span>
                    <div className="text-3xl font-black text-emerald-400 mt-1">
                      {summaryMetrics.passRate}%
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Order Reject
                    </span>
                    <div className="text-3xl font-black text-rose-400 mt-1">
                      {summaryMetrics.rejectCount}
                    </div>
                  </div>
                  <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 border border-rose-500/20">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Waste Discrepancy
                    </span>
                    <div className="text-3xl font-black text-amber-400 mt-1">
                      {summaryMetrics.wasteSummary.discrepancyCount}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-800 rounded-2xl border border-slate-700 text-slate-400">
                Tidak ada data inspeksi dalam rentang tanggal yang dipilih.
              </div>
            )}

            {/* REKAP TABLE */}
            {summaryMetrics && (
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                <h3 className="font-bold text-white text-base">
                  Rekapitulasi Akumulasi Bahan Baku
                </h3>
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
                          <td className="py-3.5 px-4 font-sans font-bold text-white">
                            {mat.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-sans">
                            {mat.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right text-indigo-300 font-bold">
                            {mat.totalPlannedFormatted}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-white">
                            {mat.totalActualFormatted}
                          </td>
                          <td
                            className={`py-3.5 px-4 text-right font-bold ${
                              mat.diffFormatted > 0
                                ? 'text-rose-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {mat.diffFormatted > 0
                              ? `+${mat.diffFormatted}`
                              : mat.diffFormatted}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold">
                            {mat.devPctFormatted}%
                          </td>
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
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Total Inspeksi
                </span>
                <div className="text-3xl font-extrabold text-white mt-2">
                  {summaryMetrics?.totalInspections || 0}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Pass Rate
                </span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2">
                  {summaryMetrics?.passRate || 0}%
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Order Reject
                </span>
                <div className="text-3xl font-extrabold text-rose-400 mt-2">
                  {summaryMetrics?.rejectCount || 0}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Waste Discrepancy
                </span>
                <div className="text-3xl font-extrabold text-amber-400 mt-2">
                  {summaryMetrics?.wasteSummary.discrepancyCount || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RIWAYAT AUDIT (TAMBAH FITUR HAPUS ITEM & FILTER RENTANG TANGGAL) */}
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

              {/* FILTER RENTANG TANGGAL DI RIWAYAT */}
              <div className="flex flex-wrap items-center gap-3 text-xs w-full lg:w-auto">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none text-xs"
                    title="Tanggal Mulai"
                  />
                  <span className="text-slate-500">s/d</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none text-xs"
                    title="Tanggal Selesai"
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
                    title="Reset Filter Tanggal"
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
                      <tr key={item.id} className="hover:bg-slate-750">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                          <div>{item.id}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {item.date}
                          </div>
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

                          {/* TOMBOL TRIGGER HAPUS ITEM HISTORI */}
                          <button
                            onClick={() => handleDeleteInspection(item.id)}
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
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-400 italic"
                      >
                        Tidak ada riwayat data inspeksi yang ditemukan.
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
                  <Settings className="w-6 h-6 text-indigo-400" /> Master
                  Formula & Editor BoM Custom
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              {productTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {tmpl.id}
                      </span>
                      <h3 className="font-bold text-white text-lg mt-0.5">
                        {tmpl.name}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleAddFormulaRow(tmpl.id)}
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
                        {tmpl.bomFormulas.map((f) => (
                          <tr key={f.id} className="hover:bg-slate-750">
                            <td className="py-2.5 px-3 font-sans">
                              <input
                                type="text"
                                value={f.name}
                                onChange={(e) =>
                                  handleUpdateFormulaItem(
                                    tmpl.id,
                                    f.id,
                                    'name',
                                    e.target.value
                                  )
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <input
                                type="text"
                                value={f.unit}
                                onChange={(e) =>
                                  handleUpdateFormulaItem(
                                    tmpl.id,
                                    f.id,
                                    'unit',
                                    e.target.value
                                  )
                                }
                                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-indigo-300 text-xs"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={f.formula}
                                onChange={(e) =>
                                  handleUpdateFormulaItem(
                                    tmpl.id,
                                    f.id,
                                    'formula',
                                    e.target.value
                                  )
                                }
                                className="w-full bg-slate-900 border border-indigo-500/50 rounded px-2.5 py-1 text-emerald-400 font-mono text-xs font-bold"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() =>
                                  handleDeleteFormulaRow(tmpl.id, f.id)
                                }
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
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL PRINT PREVIEW */}
      {printPreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex justify-center items-start overflow-y-auto p-4 printable-modal-overlay">
          <div className="bg-white text-slate-900 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden my-6 border border-slate-300 printable-document animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-sm">Print Dokumen QC</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={executeBrowserPrint}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
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

            <div className="p-8 space-y-6">
              <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    FABRICA INDONESIA
                  </h1>
                  <p className="text-xs text-slate-600">
                    Sistem Inspeksi QC & BoM Custom
                  </p>
                </div>
              </div>

              {printPreviewModal.type === 'SUMMARY' && summaryMetrics && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xs uppercase text-slate-800">
                    Rekapitulasi Inspeksi QC
                  </h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th>Bahan Baku</th>
                        <th>Satuan</th>
                        <th className="text-right">Total Target</th>
                        <th className="text-right">Total Aktual</th>
                        <th className="text-right">Selisih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryMetrics.aggregatedMaterials.map((mat, i) => (
                        <tr key={i}>
                          <td className="font-bold">{mat.name}</td>
                          <td>{mat.unit}</td>
                          <td className="text-right font-mono">
                            {mat.totalPlannedFormatted}
                          </td>
                          <td className="text-right font-mono">
                            {mat.totalActualFormatted}
                          </td>
                          <td className="text-right font-mono">{mat.diffFormatted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
