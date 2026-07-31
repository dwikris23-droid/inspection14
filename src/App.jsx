// src/App.js
import React, { useState, useMemo, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, onSnapshot, addDoc } from 'firebase/firestore'; 
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
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
  Calculator,
  ArrowRight,
  Settings,
  Sparkles,
  Scissors,
  Edit3,
  PlusCircle,
  X,
  Users,
  Activity,
} from 'lucide-react';

// Evaluator Formula Dinamis (Mendukung L, T, P, Q dan Operator Matematika JS)
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

export default function App() {
  const [activeTab, setActiveTab] = useState('new_inspection');
  const [productTemplates, setProductTemplates] = useState(INITIAL_PRODUCT_TEMPLATES);
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [printPreviewModal, setPrintPreviewModal] = useState({
    isOpen: false,
    type: 'SUMMARY',
    data: null,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [inspectionStep, setInspectionStep] = useState(1);

  const [selectedProductTemplateId, setSelectedProductTemplateId] = useState(
    productTemplates[0]?.id || ''
  );
  const [woNumberInput, setWoNumberInput] = useState('WO-CUSTOM-2026-004');
  const [soNumberInput, setSoNumberInput] = useState('SO-CUST-88102');
  const [customerInput, setCustomerInput] = useState('PT Decor Minimalis Indonesia');
  const [shiftInput, setShiftInput] = useState('Shift 1 - Pagi');
  const [inspectorInput, setInspectorInput] = useState('Ahmad Zaky (QC Inspector)');

  const [dimL, setDimL] = useState(120);
  const [dimT, setDimT] = useState(200);
  const [dimP, setDimP] = useState(0);
  const [dimQ, setDimQ] = useState(1);

  const [actualBomUsage, setActualBomUsage] = useState({});
  const [reportedWasteVal, setReportedWasteVal] = useState('');
  const [actualWasteVal, setActualWasteVal] = useState('');
  const [actualDimensionsMeasured, setActualDimensionsMeasured] = useState({});
  const [inspectionNotes, setInspectionNotes] = useState('');

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

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

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

  const currentTemplate = useMemo(() => {
    return (
      productTemplates.find((p) => p.id === selectedProductTemplateId) ||
      productTemplates[0]
    );
  }, [productTemplates, selectedProductTemplateId]);

  useEffect(() => {
    if (currentTemplate) {
      setDimL(currentTemplate.defaultL || 100);
      setDimT(currentTemplate.defaultT || 150);
      setDimP(currentTemplate.defaultP || 0);
      setDimQ(currentTemplate.defaultQ || 1);
    }
  }, [selectedProductTemplateId, currentTemplate]);

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

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!auditEvaluation) return;

    const inspectionCustomId = `INSP-2026-${String(
      inspections.length + 101
    ).padStart(3, '0')}`;

    const newInspectionRecord = {
      inspectionCustomId,
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

    try {
      await addDoc(collection(db, 'inspections'), newInspectionRecord);

      showToast(
        `Inspeksi ${inspectionCustomId} berhasil disimpan ke Firebase!`,
        'success'
      );

      setInspectionStep(1);
      setActiveTab('summary');
    } catch (err) {
      console.error('Gagal menyimpan ke Firebase:', err);
      showToast('Gagal menyimpan data ke Firebase!', 'error');
    }
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

  const handleCreateNewProduct = (e) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.id) {
      showToast('Harap isi ID dan Nama Produk!', 'error');
      return;
    }

    setProductTemplates([...productTemplates, newProductForm]);
    setSelectedProductTemplateId(newProductForm.id);
    setIsAddProductModalOpen(false);
    showToast(`Model produk baru "${newProductForm.name}" berhasil dibuat!`);

    setNewProductForm({
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
  };

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const searchKey = searchQuery.toLowerCase();
      const matchesSearch =
        (item.inspectionCustomId &&
          item.inspectionCustomId.toLowerCase().includes(searchKey)) ||
        (item.id && item.id.toLowerCase().includes(searchKey)) ||
        (item.woNumber && item.woNumber.toLowerCase().includes(searchKey)) ||
        (item.customer && item.customer.toLowerCase().includes(searchKey)) ||
        (item.productName && item.productName.toLowerCase().includes(searchKey));
      const matchesStatus =
        statusFilter === 'ALL' || item.overallStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inspections, searchQuery, statusFilter]);

  const summaryMetrics = useMemo(() => {
    const totalInspections = inspections.length;
    if (totalInspections === 0) return null;

    const passCount = inspections.filter(
      (i) => i.overallStatus === 'PASS'
    ).length;
    const conditionalCount = inspections.filter(
      (i) => i.overallStatus === 'CONDITIONAL'
    ).length;
    const rejectCount = inspections.filter(
      (i) => i.overallStatus === 'REJECT'
    ).length;
    const passRate = ((passCount / totalInspections) * 100).toFixed(1);

    const materialMap = {};
    let totalPlannedUnits = 0;
    let totalActualUnits = 0;

    inspections.forEach((record) => {
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

    inspections.forEach((r) => {
      if (r.wasteAudit) {
        totalReportedWaste += parseFloat(r.wasteAudit.reportedWaste) || 0;
        totalActualWaste += parseFloat(r.wasteAudit.actualMeasuredWaste) || 0;
        if (r.wasteAudit.status === 'DISCREPANCY_HIGH') totalDiscrepancies += 1;
      }
    });

    const netWasteVariance = totalActualWaste - totalReportedWaste;

    const shiftMap = {};
    inspections.forEach((r) => {
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
  }, [inspections]);

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
      <style>{`
        @media print {
          header, footer, nav, .no-print, button, .toast-notification, .modal-backdrop-blur {
            display: none !important;
          }

          body, html {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .printable-modal-overlay {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            z-index: 99999 !important;
          }

          .printable-document {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .printable-document * {
            color: #000000 !important;
            border-color: #cbd5e1 !important;
          }

          .printable-document table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 10px !important;
          }

          .printable-document th, .printable-document td {
            border: 1px solid #94a3b8 !important;
            padding: 6px 10px !important;
            font-size: 11px !important;
          }

          .printable-document th {
            background-color: #f1f5f9 !important;
            font-weight: bold !important;
          }

          .badge-pass {
            background-color: #d1fae5 !important;
            color: #065f46 !important;
            border: 1px solid #10b981 !important;
            padding: 2px 8px !important;
            border-radius: 4px !important;
            font-weight: bold !important;
          }

          .badge-reject {
            background-color: #ffe4e6 !important;
            color: #9f1239 !important;
            border: 1px solid #f43f5e !important;
            padding: 2px 8px !important;
            border-radius: 4px !important;
            font-weight: bold !important;
          }

          .badge-cond {
            background-color: #fef3c7 !important;
            color: #92400e !important;
            border: 1px solid #f59e0b !important;
            padding: 2px 8px !important;
            border-radius: 4px !important;
            font-weight: bold !important;
          }

          .page-break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 no-print">
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
                    <button
                      onClick={() => setIsAddProductModalOpen(true)}
                      className="text-xs bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-3 py-1.5 rounded-lg font-bold border border-indigo-500/30 flex items-center gap-1 transition-all"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Tambah Model Produk
                      Baru
                    </button>
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
                      <p className="text-xs text-slate-300 mt-0.5">
                        Masukkan ukuran Lebar ($L$), Tinggi ($T$), dan Jumlah
                        Order ($Q$). Sistem akan menghitung otomatis resep BoM.
                      </p>
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
                        className="w-full bg-slate-800 border-2 border-indigo-500/60 rounded-lg px-3 py-2 font-mono text-lg text-white font-bold focus:outline-none focus:border-indigo-400"
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
                        className="w-full bg-slate-800 border-2 border-indigo-500/60 rounded-lg px-3 py-2 font-mono text-lg text-white font-bold focus:outline-none focus:border-indigo-400"
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
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400" /> Hasil
                        Kalkulasi Otomatis BoM Standar
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dihitung otomatis oleh rumus preset untuk produk{' '}
                        <b>{currentTemplate?.name}</b> dengan ukuran{' '}
                        <b>
                          L: {dimL}cm x T: {dimT}cm (Qty: {dimQ})
                        </b>
                        .
                      </p>
                    </div>
                    <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
                      System Calculated Target
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Komponen / Bahan Baku</th>
                          <th className="py-2.5 px-3">Rumus Formula Custom</th>
                          <th className="py-2.5 px-3">
                            Hasil Kalkulasi Target
                          </th>
                          <th className="py-2.5 px-3">Satuan</th>
                          <th className="py-2.5 px-3">Toleransi Operasional</th>
                          <th className="py-2.5 px-3">Keterangan</th>
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
                            <td className="py-3 px-3 text-slate-400 font-sans">
                              {item.note}
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
                    <span className="text-slate-400 block">
                      Produk & Dimensi:
                    </span>
                    <span className="font-bold text-white text-sm">
                      {currentTemplate?.name}
                    </span>
                    <div className="text-indigo-400 font-mono font-semibold">
                      L: {dimL}cm | T: {dimT}cm | Qty: {dimQ}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      Shift Kerja Operasional:
                    </span>
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
                    <span className="text-slate-400 block">
                      Inspector / Penanggung Jawab QC:
                    </span>
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
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                        1
                      </div>
                      <h3 className="font-bold text-white text-base">
                        Pemeriksaan Pemakaian Bahan Baku (Target BoM vs.
                        Realisasi Lapangan)
                      </h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Komponen / Bahan</th>
                          <th className="py-2.5 px-3">Satuan</th>
                          <th className="py-2.5 px-3">Target BoM Kalkulasi</th>
                          <th className="py-2.5 px-3 w-40">
                            Pemakaian Aktual Lapangan
                          </th>
                          <th className="py-2.5 px-3">Deviasi (%)</th>
                          <th className="py-2.5 px-3">Status Pemakaian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/60 text-xs">
                        {auditEvaluation?.bomDetails.map((item) => (
                          <tr
                            key={item.materialId}
                            className="hover:bg-slate-750"
                          >
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
                              <span
                                className={
                                  item.devPct > 0
                                    ? 'text-amber-400'
                                    : item.devPct < 0
                                    ? 'text-blue-400'
                                    : 'text-slate-300'
                                }
                              >
                                {item.devPct > 0
                                  ? `+${item.devPct}%`
                                  : `${item.devPct}%`}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {item.status === 'OK' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  <Check className="w-3 h-3" /> Sesuai Toleransi
                                </span>
                              ) : item.status === 'EXCEEDED' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                  <AlertTriangle className="w-3 h-3" /> Boros
                                  (&gt;+{item.tolerancePct}%)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Kurang Pemakaian
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                        2
                      </div>
                      <h3 className="font-bold text-white text-base">
                        Audit Discrepancy Waste Produksi
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/60 p-4 rounded-xl border border-slate-700">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        1. Waste Dilaporkan Operator Shift
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={reportedWasteVal}
                        onChange={(e) => setReportedWasteVal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-base focus:border-indigo-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        2. Waste Terukur QC / Inspector (Fisik)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={actualWasteVal}
                        onChange={(e) => setActualWasteVal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-base focus:border-indigo-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="flex flex-col justify-center bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                      <div className="text-xs text-slate-400 uppercase font-bold">
                        Selisih Discrepancy Waste
                      </div>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span
                          className={`text-2xl font-black font-mono ${
                            auditEvaluation?.wasteAudit.isDiscrepancy
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {auditEvaluation?.wasteAudit.diff > 0
                            ? `+${auditEvaluation.wasteAudit.diff}`
                            : auditEvaluation?.wasteAudit.diff}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ({auditEvaluation?.wasteAudit.devPct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                        3
                      </div>
                      <h3 className="font-bold text-white text-base">
                        Pemeriksaan Ukuran Hasil Kerja vs. Target Sales Order
                        (SO)
                      </h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Parameter Dimensi</th>
                          <th className="py-2.5 px-3">Target SO</th>
                          <th className="py-2.5 px-3">Batas Toleransi</th>
                          <th className="py-2.5 px-3 w-40">Hasil Ukur Fisik</th>
                          <th className="py-2.5 px-3">Kualifikasi</th>
                          <th className="py-2.5 px-3">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/60 text-xs">
                        {auditEvaluation?.specDetails.map((item) => (
                          <tr key={item.specId} className="hover:bg-slate-750">
                            <td className="py-3 px-3 font-semibold text-slate-200">
                              {item.specName}
                            </td>
                            <td className="py-3 px-3 font-mono text-indigo-300 font-bold">
                              {item.target} {item.unit}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                              {item.minAllowed} s/d {item.maxAllowed}{' '}
                              {item.unit}
                            </td>
                            <td className="py-3 px-3">
                              <input
                                type="number"
                                step="any"
                                value={
                                  actualDimensionsMeasured[item.specId] || ''
                                }
                                onChange={(e) =>
                                  setActualDimensionsMeasured({
                                    ...actualDimensionsMeasured,
                                    [item.specId]: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded px-2.5 py-1.5 font-mono text-white text-sm font-bold"
                                required
                              />
                            </td>
                            <td className="py-3 px-3">
                              {item.status === 'PASS' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5" /> LULUS
                                  (PASS)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                                  <XCircle className="w-3.5 h-3.5" /> CACAT
                                  (FAIL)
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-slate-400">
                              {item.remark}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4 shadow-2xl">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-indigo-400" /> Hasil
                    Akhir Evaluasi Sistem & Rekomendasi Keputusan
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs text-slate-300 font-semibold block">
                        Catatan Kejadian / Persetujuan Supervisor:
                      </label>
                      <textarea
                        rows={3}
                        value={inspectionNotes}
                        onChange={(e) => setInspectionNotes(e.target.value)}
                        placeholder="Masukkan catatan kendala mesin, dispensasi toleransi dari supervisor..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex flex-col justify-between">
                      <div>
                        <div className="text-xs text-slate-400 uppercase font-bold">
                          Rekomendasi System:
                        </div>
                        <div
                          className={`text-2xl font-black mt-1 tracking-wider ${
                            auditEvaluation?.recommendedStatus === 'PASS'
                              ? 'text-emerald-400'
                              : auditEvaluation?.recommendedStatus === 'REJECT'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {auditEvaluation?.recommendedStatus}
                        </div>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          {auditEvaluation?.autoReason}
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="mt-4 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2"
                      >
                        <ClipboardCheck className="w-5 h-5" />
                        <span>Simpan Hasil Inspeksi</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-800 via-indigo-950/60 to-slate-800 border border-slate-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-400" /> Ringkasan &
                  Rekapitulasi Laporan QC Operasional
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Akumulasi total konsumsi bahan baku (Plan BoM vs Realisasi),
                  audit waste per shift, dan kualifikasi mutu produk.
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

            {summaryMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total WO Diinspeksi
                    </span>
                    <div className="text-3xl font-black text-white mt-1">
                      {summaryMetrics.totalInspections}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        Order
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      QC Pass Rate
                    </span>
                    <div className="text-3xl font-black text-emerald-400 mt-1">
                      {summaryMetrics.passRate}%
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {summaryMetrics.passCount} dari{' '}
                      {summaryMetrics.totalInspections} Lulus
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Order Reject / Cacat
                    </span>
                    <div className="text-3xl font-black text-rose-400 mt-1">
                      {summaryMetrics.rejectCount}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Gagal spesifikasi SO
                    </span>
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
                      {summaryMetrics.wasteSummary.discrepancyCount}{' '}
                      <span className="text-xs font-normal text-slate-400">
                        Kasus
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Net:{' '}
                      {summaryMetrics.wasteSummary.netVariance > 0
                        ? `+${summaryMetrics.wasteSummary.netVariance}`
                        : summaryMetrics.wasteSummary.netVariance}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" /> Rekapitulasi
                    Akumulasi Pemakaian Bahan Baku (Target BoM vs Realisasi)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Menampilkan akumulasi jumlah pemakaian bahan baku hasil
                    kalkulasi rumus BoM dibanding realisasi fisik di lapangan.
                  </p>
                </div>
                <span className="text-xs bg-slate-900 text-indigo-300 border border-slate-700 px-3 py-1 rounded-full font-mono">
                  Aggregated BoM Summary
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Nama Bahan / Komponen</th>
                      <th className="py-3 px-4">Satuan</th>
                      <th className="py-3 px-4 text-right">
                        Total Plan BoM (Target)
                      </th>
                      <th className="py-3 px-4 text-right">
                        Total Aktual Lapangan
                      </th>
                      <th className="py-3 px-4 text-right">
                        Selisih (Variance)
                      </th>
                      <th className="py-3 px-4 text-right">Deviasi (%)</th>
                      <th className="py-3 px-4 text-center">
                        Status Pemakaian
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
                    {summaryMetrics?.aggregatedMaterials.map((mat, idx) => (
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
                              : mat.diffFormatted < 0
                              ? 'text-blue-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {mat.diffFormatted > 0
                            ? `+${mat.diffFormatted}`
                            : mat.diffFormatted}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold">
                          <span
                            className={
                              mat.devPctFormatted > 0
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {mat.devPctFormatted > 0
                              ? `+${mat.devPctFormatted}%`
                              : `${mat.devPctFormatted}%`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-sans">
                          {mat.exceededCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />{' '}
                              {mat.exceededCount}x Over-budget
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <Check className="w-3 h-3" /> Efisien / In-Budget
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-700 pb-3">
                  <Users className="w-5 h-5 text-indigo-400" /> Ringkasan
                  Performa QC per Shift Kerja
                </h3>

                <div className="space-y-3">
                  {summaryMetrics?.shiftData.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">
                          {s.shift}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Total Inspeksi: {s.total} Order
                        </div>
                      </div>

                      <div className="flex space-x-2 text-xs font-bold font-mono">
                        <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30">
                          PASS: {s.pass}
                        </span>
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/30">
                          COND: {s.conditional}
                        </span>
                        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30">
                          REJ: {s.reject}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
                <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-700 pb-3">
                  <Scissors className="w-5 h-5 text-amber-400" /> Ringkasan
                  Audit Discrepancy Waste
                </h3>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">
                      Total Waste Dilaporkan Operator:
                    </span>
                    <span className="text-white font-bold">
                      {summaryMetrics?.wasteSummary.totalReported} Unit
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">
                      Total Waste Terukur QC Fisik:
                    </span>
                    <span className="text-indigo-300 font-bold">
                      {summaryMetrics?.wasteSummary.totalActual} Unit
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400 font-sans">
                      Akumulasi Selisih Discrepancy:
                    </span>
                    <span
                      className={`font-bold ${
                        summaryMetrics?.wasteSummary.netVariance > 0
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {summaryMetrics?.wasteSummary.netVariance > 0
                        ? `+${summaryMetrics.wasteSummary.netVariance}`
                        : summaryMetrics?.wasteSummary.netVariance}{' '}
                      Unit
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400 font-sans">
                      Jumlah Kasus Selisih Tinggi (&gt;15%):
                    </span>
                    <span className="text-amber-400 font-bold">
                      {summaryMetrics?.wasteSummary.discrepancyCount} Kejadian
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Inspeksi
                </span>
                <div className="text-3xl font-extrabold text-white mt-2">
                  {summaryMetrics?.totalInspections || 0}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Pass Rate
                </span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-2">
                  {summaryMetrics?.passRate || 0}%
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Order Reject
                </span>
                <div className="text-3xl font-extrabold text-rose-400 mt-2">
                  {summaryMetrics?.rejectCount || 0}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Waste Discrepancy
                </span>
                <div className="text-3xl font-extrabold text-amber-400 mt-2">
                  {summaryMetrics?.wasteSummary.discrepancyCount || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800 border border-slate-700">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari ID, WO, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-400 font-semibold">
                  Status Filter:
                </label>
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
                  {filteredInspections.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-750">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        {item.inspectionCustomId || item.id}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'formulas' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-indigo-400" /> Master
                  Formula & Editor BoM Custom
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Ubah rumus matematika, batas toleransi, atau tambah model
                  produk baru secara langsung. Gunakan parameter:{' '}
                  <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">
                    L
                  </code>{' '}
                  (Lebar),{' '}
                  <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">
                    T
                  </code>{' '}
                  (Tinggi),{' '}
                  <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">
                    P
                  </code>{' '}
                  (Panjang),{' '}
                  <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">
                    Q
                  </code>{' '}
                  (Qty).
                </p>
              </div>

              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Buat Model Produk Baru</span>
              </button>
            </div>

            <div className="space-y-6">
              {productTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-6 rounded-2xl bg-slate-800 border border-slate-700 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {tmpl.id}
                        </span>
                        <span className="text-xs text-slate-400">
                          Kategori: {tmpl.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-lg mt-0.5">
                        {tmpl.name}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAddFormulaRow(tmpl.id)}
                        className="text-xs bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-3 py-1.5 rounded-lg font-bold border border-emerald-500/30 flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah Komponen Bahan
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 uppercase border-b border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">Nama Bahan</th>
                          <th className="py-2.5 px-3">Satuan</th>
                          <th className="py-2.5 px-3">
                            Rumus Formula Custom (L, T, P, Q)
                          </th>
                          <th className="py-2.5 px-3 w-28">Toleransi (%)</th>
                          <th className="py-2.5 px-3">
                            Catatan Potong / Perakitan
                          </th>
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
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-semibold focus:border-indigo-500"
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
                                className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-indigo-300 text-xs font-bold focus:border-indigo-500"
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
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono text-xs focus:border-indigo-500"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                value={f.tolerancePct}
                                onChange={(e) =>
                                  handleUpdateFormulaItem(
                                    tmpl.id,
                                    f.id,
                                    'tolerancePct',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs text-center focus:border-indigo-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <input
                                type="text"
                                value={f.note}
                                onChange={(e) =>
                                  handleUpdateFormulaItem(
                                    tmpl.id,
                                    f.id,
                                    'note',
                                    e.target.value
                                  )
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 text-xs focus:border-indigo-500"
                              />
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() =>
                                  handleDeleteFormulaRow(tmpl.id, f.id)
                                }
                                className="p-1 bg-rose-500/20 text-rose-300 hover:bg-rose-600 hover:text-white rounded transition-all"
                                title="Hapus Baris"
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

      {/* MODAL TAMBAH MODEL PRODUK BARU */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn no-print">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" /> Buat Model /
                Template Produk Baru
              </h3>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProduct} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Kode Unique ID Produk:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PROD-VB03"
                  value={newProductForm.id}
                  onChange={(e) =>
                    setNewProductForm({ ...newProductForm, id: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Nama Model Produk:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Vertical Blinds Semi-Blackout"
                  value={newProductForm.name}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Kategori:
                  </label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Window Blinds">Window Blinds</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Furniture Custom">Furniture Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    Satuan Ukuran Dimensi:
                  </label>
                  <input
                    type="text"
                    value={newProductForm.unitDim}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        unitDim: e.target.value,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-700 text-white font-bold hover:bg-slate-600 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
                >
                  Simpan Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL INSPEKSI */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn no-print">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Detail Inspeksi: {selectedInspection.inspectionCustomId || selectedInspection.id}
                </h3>
                <p className="text-slate-400 mt-0.5">
                  WO: {selectedInspection.woNumber} | SO: {selectedInspection.soNumber} - {selectedInspection.customer}
                </p>
              </div>
              <button
                onClick={() => setSelectedInspection(null)}
                className="p-1 rounded-lg bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-900 p-3 rounded-xl border border-slate-700">
              <div>
                <span className="text-slate-400 block">Produk:</span>
                <span className="font-bold text-white">{selectedInspection.productName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Inspector / Shift:</span>
                <span className="font-bold text-white">{selectedInspection.inspector} ({selectedInspection.shift})</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2 uppercase text-indigo-400">Pemeriksaan BoM:</h4>
              <table className="w-full text-left border border-slate-700 rounded-lg overflow-hidden">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="p-2">Material</th>
                    <th className="p-2">Target BoM</th>
                    <th className="p-2">Aktual</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {selectedInspection.bomComparison?.map((b, i) => (
                    <tr key={i}>
                      <td className="p-2 text-white">{b.materialName}</td>
                      <td className="p-2 text-indigo-300 font-mono">{b.planned} {b.unit}</td>
                      <td className="p-2 text-white font-mono">{b.actual} {b.unit}</td>
                      <td className="p-2 font-bold">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedInspection(null)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL / DIALOG CETAK PDF REPORT & SERTIFIKAT AUDIT */}
      {printPreviewModal.isOpen && (
        <div className="printable-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="printable-document bg-white text-slate-900 rounded-2xl max-w-4xl w-full p-8 space-y-6 shadow-2xl border border-slate-300 my-8">
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 no-print">
              <div className="flex items-center space-x-3">
                <Printer className="w-8 h-8 text-indigo-600" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Pratinjau Dokumen Cetak / Export PDF
                  </h2>
                  <p className="text-xs text-slate-500">
                    Gunakan tombol di sebelah kanan untuk mencetak atau menyimpan
                    sebagai dokumen PDF.
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={executeBrowserPrint}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-lg shadow hover:bg-indigo-700 flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" /> Cetak / Save PDF
                </button>
                <button
                  onClick={() =>
                    setPrintPreviewModal({
                      isOpen: false,
                      type: 'SUMMARY',
                      data: null,
                    })
                  }
                  className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-lg hover:bg-slate-300"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* HALAMAN DOKUMEN CETAK SUMMARY REKAP */}
            {printPreviewModal.type === 'SUMMARY' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                      LAPORAN REKAPITULASI AUDIT QC & KONSUMSI BOM
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Sistem Operasional Inspeksi Produksi Custom (OP-INSPECT)
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>
                      Dicetak Tanggal:{' '}
                      <span className="font-mono font-bold text-slate-800">
                        {new Date().toISOString().substring(0, 10)}
                      </span>
                    </div>
                    <div>Status: Terverifikasi Sistem</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Total Inspeksi
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {printPreviewModal.data?.totalInspections} Order
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Pass Rate
                    </div>
                    <div className="text-lg font-black text-emerald-700">
                      {printPreviewModal.data?.passRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Reject / Cacat
                    </div>
                    <div className="text-lg font-black text-rose-700">
                      {printPreviewModal.data?.rejectCount} Order
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Waste Discrepancy
                    </div>
                    <div className="text-lg font-black text-amber-700">
                      {printPreviewModal.data?.wasteSummary?.discrepancyCount}{' '}
                      Kasus
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm uppercase text-slate-800 mb-2 border-b pb-1">
                    1. Akumulasi Konsumsi Bahan Baku (Target BoM vs Realisasi)
                  </h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Nama Bahan</th>
                        <th>Satuan</th>
                        <th>Target BoM</th>
                        <th>Aktual</th>
                        <th>Selisih</th>
                        <th>Deviasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printPreviewModal.data?.aggregatedMaterials.map(
                        (mat, idx) => (
                          <tr key={idx}>
                            <td className="font-bold">{mat.name}</td>
                            <td>{mat.unit}</td>
                            <td className="text-right font-mono">
                              {mat.totalPlannedFormatted}
                            </td>
                            <td className="text-right font-mono">
                              {mat.totalActualFormatted}
                            </td>
                            <td className="text-right font-mono">
                              {mat.diffFormatted}
                            </td>
                            <td className="text-right font-mono">
                              {mat.devPctFormatted}%
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* HALAMAN DOKUMEN CETAK SINGLE INSPECTION */}
            {printPreviewModal.type === 'SINGLE' && printPreviewModal.data && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <div>
                    <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                      SERTIFIKAT HASIL INSPEKSI QC PRODUKSI
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ID Inspeksi: {printPreviewModal.data.inspectionCustomId || printPreviewModal.data.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={
                      printPreviewModal.data.overallStatus === 'PASS' 
                        ? 'badge-pass' 
                        : printPreviewModal.data.overallStatus === 'REJECT' 
                        ? 'badge-reject' 
                        : 'badge-cond'
                    }>
                      {printPreviewModal.data.overallStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p><strong>No. WO:</strong> {printPreviewModal.data.woNumber}</p>
                    <p><strong>No. SO / Customer:</strong> {printPreviewModal.data.soNumber} / {printPreviewModal.data.customer}</p>
                    <p><strong>Produk:</strong> {printPreviewModal.data.productName}</p>
                  </div>
                  <div>
                    <p><strong>Tanggal:</strong> {printPreviewModal.data.date}</p>
                    <p><strong>Inspector:</strong> {printPreviewModal.data.inspector}</p>
                    <p><strong>Shift:</strong> {printPreviewModal.data.shift}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase text-slate-800 mb-1">Rincian Komponen BoM</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Target</th>
                        <th>Aktual</th>
                        <th>Deviasi (%)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printPreviewModal.data.bomComparison?.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.materialName}</td>
                          <td>{item.planned} {item.unit}</td>
                          <td>{item.actual} {item.unit}</td>
                          <td>{item.devPct}%</td>
                          <td>{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="font-bold text-xs uppercase text-slate-800 mb-1">Pemeriksaan Dimensi SO</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Spesifikasi</th>
                        <th>Target SO</th>
                        <th>Aktual Ukur</th>
                        <th>Kualifikasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printPreviewModal.data.soDimensionCheck?.map((spec, idx) => (
                        <tr key={idx}>
                          <td>{spec.specName}</td>
                          <td>{spec.target} {spec.unit}</td>
                          <td>{spec.actual} {spec.unit}</td>
                          <td>{spec.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs border-t pt-2">
                  <p><strong>Catatan Audit:</strong> {printPreviewModal.data.statusReason}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
