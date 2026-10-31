import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Upload,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  QrCode,
  UserCheck,
  FileText,
  Building,
  Briefcase,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { useI18n } from '../../i18n/I18nProvider.tsx';
import { Employee, EnterpriseDocument } from '../../types/index.ts';

interface QRCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee?: (emp: Employee) => void;
  onSelectDocument?: (doc: EnterpriseDocument) => void;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectEmployee,
  onSelectDocument,
}) => {
  const { employees, documents, departments, positions, addAuditLog } = useApp();
  const { language, t } = useI18n();

  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scannedRawData, setScannedRawData] = useState<string | null>(null);
  const [matchedEmployee, setMatchedEmployee] = useState<Employee | null>(null);
  const [matchedDocument, setMatchedDocument] = useState<EnterpriseDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Play pleasant chime on successful scan
  const playScanBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, []);

  // Process any string payload from QR or input
  const processScannedPayload = useCallback(
    (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;

      setIsProcessing(true);
      setScannedRawData(trimmed);
      playScanBeep();

      let targetCode = trimmed;

      // Try parsing JSON payload: {"code":"LHSE-001"} or {"employeeCode":"LHSE-001"}
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          targetCode = parsed.code || parsed.employeeCode || parsed.employeeId || parsed.id || parsed.docNumber || trimmed;
        } catch {
          // not valid JSON, use trimmed text
        }
      }

      // Check if URL with code param or path
      if (targetCode.includes('http://') || targetCode.includes('https://') || targetCode.includes('?')) {
        try {
          const url = new URL(targetCode);
          const empParam = url.searchParams.get('emp') || url.searchParams.get('code') || url.searchParams.get('id');
          if (empParam) targetCode = empParam;
        } catch {
          // fallback string search
        }
      }

      // 1. Search in Employees (by code, nationalId, passport, phone, or name)
      const normalizedTarget = targetCode.toLowerCase().trim();
      const foundEmp = employees.find((emp) => {
        return (
          emp.employeeCode.toLowerCase() === normalizedTarget ||
          emp.id.toLowerCase() === normalizedTarget ||
          (emp.nationalId && emp.nationalId.toLowerCase() === normalizedTarget) ||
          (emp.passportNumber && emp.passportNumber.toLowerCase() === normalizedTarget) ||
          (emp.partyCardNumber && emp.partyCardNumber.toLowerCase() === normalizedTarget) ||
          (emp.socialSecurityNumber && emp.socialSecurityNumber.toLowerCase() === normalizedTarget) ||
          `${emp.firstNameLao} ${emp.lastNameLao}`.toLowerCase() === normalizedTarget ||
          `${emp.firstNameEn} ${emp.lastNameEn}`.toLowerCase() === normalizedTarget
        );
      });

      if (foundEmp) {
        setMatchedEmployee(foundEmp);
        setMatchedDocument(null);
        setIsProcessing(false);
        addAuditLog(
          'QR_CODE_SCAN',
          'SYSTEM',
          'Security & Identity Verification',
          `QR Code scanned and verified employee: ${foundEmp.employeeCode} - ${foundEmp.firstNameEn} ${foundEmp.lastNameEn}`,
          { entityType: 'EMPLOYEE_ID_CARD', entityName: foundEmp.employeeCode, recordId: foundEmp.id }
        );
        return;
      }

      // 2. Search in Documents
      const foundDoc = documents.find((doc) => {
        return (
          doc.docNumber.toLowerCase() === normalizedTarget ||
          doc.id.toLowerCase() === normalizedTarget ||
          doc.title.toLowerCase().includes(normalizedTarget) ||
          doc.titleLao.toLowerCase().includes(normalizedTarget)
        );
      });

      if (foundDoc) {
        setMatchedDocument(foundDoc);
        setMatchedEmployee(null);
        setIsProcessing(false);
        addAuditLog(
          'QR_CODE_SCAN',
          'SYSTEM',
          'Security & Identity Verification',
          `QR Code scanned and verified document: ${foundDoc.docNumber} - ${foundDoc.title}`,
          { entityType: 'ENTERPRISE_DOCUMENT', entityName: foundDoc.docNumber, recordId: foundDoc.id }
        );
        return;
      }

      // No match found
      setMatchedEmployee(null);
      setMatchedDocument(null);
      setIsProcessing(false);
    },
    [employees, documents, playScanBeep]
  );

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Frame scanner loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || matchedEmployee || matchedDocument) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        processScannedPayload(code.data);
        return; // stop scanning after match
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [matchedEmployee, matchedDocument, processScannedPayload]);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        language === 'lo'
          ? 'ອຸປະກອນຂອງທ່ານບໍ່ຮອງຮັບການເປີດກ້ອງຖ່າຍຮູບ'
          : 'Webcam/Camera API is not supported on this device.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().then(() => {
          animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
        });
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        language === 'lo'
          ? 'ບໍ່ສາມາດເຂົ້າເຖິງກ້ອງຖ່າຍຮູບໄດ້ ກະລຸນາກວດສອບສິດການອະນຸຍາດ ຫຼື ໃຊ້ການອັບໂຫຼດຮູບພາບແທນ'
          : 'Unable to access camera. Please allow camera permissions or upload an image instead.'
      );
    }
  }, [cameraFacing, language, scanVideoFrame, stopCamera]);

  // Effect for Camera Lifecycle
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !matchedEmployee && !matchedDocument) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, cameraFacing, matchedEmployee, matchedDocument, startCamera, stopCamera]);

  // Handle Image Upload Scan
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          processScannedPayload(code.data);
        } else {
          setCameraError(
            language === 'lo'
              ? 'ບໍ່ພົບລະຫັດ QR Code ໃນຮູບພາບນີ້. ກະລຸນາລອງເລືອກຮູບໃໝ່ທີ່ມີຄວາມຊັດເຈນ'
              : 'No QR code detected in this image. Please upload a clear image of the ID card or QR code.'
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Reset to Scan Again
  const handleResetScan = () => {
    setMatchedEmployee(null);
    setMatchedDocument(null);
    setScannedRawData(null);
    setCameraError(null);
    setManualCode('');
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {language === 'lo' ? 'ລະບົບສະແກນ QR Code ບັດພະນັກງານ' : 'QR Code ID & Document Scanner'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'lo'
                  ? 'ສະແກນບັດປະຈຳຕົວ ຫຼື ເອກະສານເພື່ອດຶງຂໍ້ມູນ ແລະ ກວດສອບທັນທີ'
                  : 'Scan employee badges or documents for instant record verification'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              handleResetScan();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{language === 'lo' ? 'ກ້ອງຖ່າຍຮູບ (Camera)' : 'Camera'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'lo' ? 'ອັບໂຫຼດຮູບ (Upload)' : 'Upload Image'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>{language === 'lo' ? 'ຄົ້ນຫາລະຫັດ (Manual)' : 'Search Code'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Result view if matched */}
          {matchedEmployee && (
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 animate-scaleUp">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{language === 'lo' ? 'ກວດສອບພົບຂໍ້ມູນພະນັກງານ' : 'Employee Record Verified'}</span>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold">
                  {matchedEmployee.employeeCode}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 overflow-hidden">
                  {matchedEmployee.avatarUrl ? (
                    <img src={matchedEmployee.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{matchedEmployee.firstNameLao?.[0] || matchedEmployee.firstNameEn?.[0]}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                    {matchedEmployee.prefixLao ? `${matchedEmployee.prefixLao} ` : ''}
                    {matchedEmployee.firstNameLao} {matchedEmployee.lastNameLao}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                    {matchedEmployee.firstNameEn} {matchedEmployee.lastNameEn}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">
                        {departments.find((d) => d.id === matchedEmployee.departmentId)?.nameLao ||
                          departments.find((d) => d.id === matchedEmployee.departmentId)?.nameEn ||
                          'LHSE'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">
                        {positions.find((p) => p.id === matchedEmployee.positionId)?.titleLao ||
                          positions.find((p) => p.id === matchedEmployee.positionId)?.titleEn ||
                          'ພະນັກງານ'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{language === 'lo' ? 'ເຂົ້າສັງກັດ' : 'Joined'}: {matchedEmployee.joiningDate || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        {matchedEmployee.partyMemberStatus === 'FULL'
                          ? language === 'lo' ? 'ສະມາຊິກພັກສົມບູນ' : 'Full Party Member'
                          : matchedEmployee.partyMemberStatus === 'CANDIDATE'
                          ? language === 'lo' ? 'ສະມາຊິກພັກສຳຮອງ' : 'Party Candidate'
                          : language === 'lo' ? 'ມະຫາຊົນ' : 'Staff Member'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ສະແກນໃໝ່' : 'Scan Another'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectEmployee) onSelectEmployee(matchedEmployee);
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{language === 'lo' ? 'ເບິ່ງປະຫວັດພະນັກງານ' : 'View Full Profile'}</span>
                </button>
              </div>
            </div>
          )}

          {matchedDocument && (
            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 animate-scaleUp">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span>{language === 'lo' ? 'ກວດສອບພົບເອກະສານ' : 'Document Record Verified'}</span>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold">
                  {matchedDocument.docNumber}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'lo' ? matchedDocument.titleLao : matchedDocument.title}
                </h4>
                <p className="text-slate-500 dark:text-slate-400">
                  {language === 'lo' ? matchedDocument.descriptionLao : matchedDocument.description}
                </p>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 pt-1">
                  <span>{language === 'lo' ? 'ໝວດ' : 'Category'}: {matchedDocument.category}</span>
                  <span>{language === 'lo' ? 'ເວີຊັນ' : 'Version'}: v{matchedDocument.currentVersion}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'lo' ? 'ສະແກນໃໝ່' : 'Scan Another'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectDocument) onSelectDocument(matchedDocument);
                    stopCamera();
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>{language === 'lo' ? 'ເປີດເອກະສານ' : 'Open Document'}</span>
                </button>
              </div>
            </div>
          )}

          {/* No match error banner if raw scanned without match */}
          {scannedRawData && !matchedEmployee && !matchedDocument && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-800 dark:text-amber-300">
                    {language === 'lo' ? 'ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບລະຫັດນີ້' : 'No Matching Record Found'}
                  </div>
                  <div className="font-mono text-[11px] text-amber-700 dark:text-amber-400 break-all bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                    {scannedRawData}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 pt-1">
                    {language === 'lo'
                      ? 'ກະລຸນາກວດສອບວ່າເປັນລະຫັດພະນັກງານ LHSE-XXX ຫຼື ບັດປະຈຳຕົວທີ່ຖືກຕ້ອງ'
                      : 'Please verify that the code corresponds to an LHSE personnel record.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Camera Scanner */}
          {activeTab === 'camera' && !matchedEmployee && !matchedDocument && (
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-inner flex items-center justify-center">
                {/* Video element */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Reticle / Viewfinder Frame */}
                <div className="absolute inset-8 pointer-events-none border-2 border-white/40 rounded-2xl flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                    <div className="w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                  </div>

                  {/* Animated laser scan line */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_#3b82f6] animate-pulse" />

                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                    <div className="w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                  </div>
                </div>

                {/* Subtitle instructions */}
                <div className="absolute bottom-3 inset-x-3 bg-black/60 backdrop-blur-md rounded-xl py-1.5 px-3 text-center text-[11px] text-white">
                  {language === 'lo' ? 'ຈັດວາງ QR Code ໃຫ້ຢູ່ພາຍໃນກອບ' : 'Align QR code within the frame'}
                </div>
              </div>

              {/* Camera Switch Controls */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {cameraFacing === 'environment'
                      ? language === 'lo' ? 'ປ່ຽນເປັນກ້ອງໜ້າ' : 'Switch to Front Camera'
                      : language === 'lo' ? 'ປ່ຽນເປັນກ້ອງຫຼັງ' : 'Switch to Rear Camera'}
                  </span>
                </button>
              </div>

              {cameraError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Image Upload Scanner */}
          {activeTab === 'upload' && !matchedEmployee && !matchedDocument && (
            <div className="flex flex-col items-center">
              <label className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/20 transition-all text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">
                  {language === 'lo' ? 'ກົດເພື່ອເລືອກຮູບພາບ ຫຼື ລາກໄຟລ໌ມາໃສ່' : 'Click to upload or drag & drop'}
                </span>
                <span className="text-xs text-slate-400">PNG, JPG, WEBP, PDF screenshot</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {cameraError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2 w-full">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Manual Code Search */}
          {activeTab === 'manual' && !matchedEmployee && !matchedDocument && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'lo' ? 'ລະຫັດພະນັກງານ ຫຼື ເອກະສານ' : 'Employee Code or Document Number'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="LHSE-001, LHSE-022, DOC-..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') processScannedPayload(manualCode);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => processScannedPayload(manualCode)}
                    disabled={!manualCode.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Search className="w-4 h-4" />
                    <span>{language === 'lo' ? 'ກວດສອບ' : 'Verify'}</span>
                  </button>
                </div>
              </div>

              {/* Quick sample chips for testing */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {language === 'lo' ? 'ຕົວຢ່າງລະຫັດເພື່ອທົດລອງ (Quick Test)' : 'Sample Codes for Testing:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {employees.slice(0, 6).map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setManualCode(emp.employeeCode);
                        processScannedPayload(emp.employeeCode);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      {emp.employeeCode} ({emp.firstNameLao})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{language === 'lo' ? 'ລະບົບກວດສອບຄວາມຖືກຕ້ອງ LHSE Verification' : 'LHSE Certified Verification System'}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
          >
            {language === 'lo' ? 'ປິດ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
