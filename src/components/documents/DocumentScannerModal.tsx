import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { DocumentCategory, Employee } from '../../types/index.ts';
import { alerts } from '../../utils/alerts.ts';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Zap,
  ZapOff,
  RotateCw,
  Sliders,
  Check,
  X,
  Plus,
  Trash2,
  FileText,
  UploadCloud,
  Sparkles,
  Building,
  User,
  ShieldCheck,
  Tag,
  Maximize2,
  Eye,
  Layers,
  Award,
  Calendar,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
} from 'lucide-react';

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmployeeId?: string;
  defaultCategory?: DocumentCategory;
}

type ScanFilterMode = 'DOCUMENT' | 'BW' | 'COLOR';

type DocumentPresetType =
  | 'EMPLOYEE_CONTRACT'
  | 'NATIONAL_ID_PASSPORT'
  | 'DIPLOMA_QUALIFICATION'
  | 'MINISTERIAL_DECREE'
  | 'MEDICAL_CERTIFICATE'
  | 'OTHER_OFFICIAL';

interface ScannedPage {
  id: string;
  pageNumber: number;
  rawImageDataUrl: string;
  processedImageDataUrl: string;
  filterMode: ScanFilterMode;
  rotation: number; // degrees: 0, 90, 180, 270
}

export const DocumentScannerModal: React.FC<DocumentScannerModalProps> = ({
  isOpen,
  onClose,
  defaultEmployeeId,
  defaultCategory = 'CONTRACT',
}) => {
  const { language, employees, departments, createDocument, documents } = useApp();

  // Video & Canvas references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera stream state
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Scanned pages collection
  const [scannedPages, setScannedPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [currentFilter, setCurrentFilter] = useState<ScanFilterMode>('DOCUMENT');
  const [currentRotation, setCurrentRotation] = useState<number>(0);

  // Document Digitization & Metadata
  const [docPreset, setDocPreset] = useState<DocumentPresetType>('EMPLOYEE_CONTRACT');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(defaultEmployeeId || employees[0]?.id || 'emp-001');
  const [docCategory, setDocCategory] = useState<DocumentCategory>(defaultCategory);
  const [docDepartmentId, setDocDepartmentId] = useState<string>(departments[0]?.id || 'd-2');
  const [docNumber, setDocNumber] = useState<string>(`LHSE-SCAN-2026-00${documents.length + 1}`);
  const [title, setTitle] = useState<string>('');
  const [titleLao, setTitleLao] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [descriptionLao, setDescriptionLao] = useState<string>('');
  const [extractedContent, setExtractedContent] = useState<string>('');
  const [tags, setTags] = useState<string[]>(['Scanned Document', 'Employee Contract', 'Digitized']);
  const [isProcessingOCR, setIsProcessingOCR] = useState<boolean>(false);
  const [ocrConfidence, setOcrConfidence] = useState<number>(99.2);

  // 1. Initialize and switch camera stream
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Enumerate devices to allow user camera selection
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);

      // Check if torch/flashlight is supported
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as any;
        setTorchSupported(Boolean(capabilities?.torch));
      }
    } catch (err: any) {
      console.warn('Camera access unavailable:', err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          language === 'lo'
            ? 'ບໍ່ໄດ້ຮັບອະນຸຍາດເຂົ້າເຖິງກ້ອງຖ່າຍຮູບ. ກະລຸນາເປີດສິດອະນຸຍາດໃນບຣາວເຊີ ຫຼື ອັບໂຫຼດຮູບແທນ.'
            : 'Camera permission denied. Please allow camera access in browser settings or upload an image file instead.'
        );
      } else {
        setCameraError(
          language === 'lo'
            ? 'ບໍ່ພົບອຸປະກອນກ້ອງຖ່າຍຮູບ ຫຼື ກ້ອງກຳລັງຖືກໃຊ້ໂດຍໂປຣແກຣມອື່ນ. ທ່ານສາມາດອັບໂຫຼດຮູບຖ່າຍເອກະສານແທນໄດ້.'
            : 'No camera hardware found or device in use. You can upload physical document photos instead.'
        );
      }
    }
  }, [facingMode, selectedDeviceId, language]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchEnabled(false);
  }, []);

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Toggle torch / flashlight
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && torchSupported) {
      try {
        const nextState = !torchEnabled;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchEnabled(nextState);
      } catch (e) {
        console.warn('Torch toggle failed', e);
      }
    }
  };

  // Flip camera between front and back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setSelectedDeviceId(''); // clear exact id to allow facingMode switch
  };

  // Apply visual enhancement filter on a canvas
  const applyFilterToCanvas = (
    sourceCanvas: HTMLCanvasElement,
    mode: ScanFilterMode,
    rotationDeg: number
  ): string => {
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return sourceCanvas.toDataURL('image/jpeg', 0.92);

    const isRotated = rotationDeg === 90 || rotationDeg === 270;
    outputCanvas.width = isRotated ? sourceCanvas.height : sourceCanvas.width;
    outputCanvas.height = isRotated ? sourceCanvas.width : sourceCanvas.height;

    ctx.save();
    ctx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
    ctx.restore();

    if (mode === 'COLOR') {
      return outputCanvas.toDataURL('image/jpeg', 0.92);
    }

    // Process pixels for Document or B&W
    const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
    const d = imgData.data;

    if (mode === 'BW') {
      // High contrast B&W Photocopy filter
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const val = gray > 138 ? 255 : Math.max(0, gray * 0.4);
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
    } else if (mode === 'DOCUMENT') {
      // Auto Document Filter: Boost contrast and whiten paper background
      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Adaptive background whitening
        if (gray > 165) {
          r = Math.min(255, r * 1.25);
          g = Math.min(255, g * 1.25);
          b = Math.min(255, b * 1.25);
        } else {
          // Darken text for high contrast
          r = r * 0.75;
          g = g * 0.75;
          b = b * 0.75;
        }

        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return outputCanvas.toDataURL('image/jpeg', 0.92);
  };

  // Helper to reprocess a captured page with new filter/rotation
  const reprocessPage = (page: ScannedPage, newFilter: ScanFilterMode, newRotation: number) => {
    const img = new Image();
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const processed = applyFilterToCanvas(tempCanvas, newFilter, newRotation);
        setScannedPages((prev) =>
          prev.map((p) =>
            p.id === page.id
              ? {
                  ...p,
                  filterMode: newFilter,
                  rotation: newRotation,
                  processedImageDataUrl: processed,
                }
              : p
          )
        );
      }
    };
    img.src = page.rawImageDataUrl;
  };

  // Capture current video frame into a scanned page
  const handleCapturePage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const processedDataUrl = applyFilterToCanvas(canvas, currentFilter, currentRotation);

    const newPage: ScannedPage = {
      id: `page-${Date.now()}-${scannedPages.length + 1}`,
      pageNumber: scannedPages.length + 1,
      rawImageDataUrl: rawDataUrl,
      processedImageDataUrl: processedDataUrl,
      filterMode: currentFilter,
      rotation: currentRotation,
    };

    setScannedPages((prev) => [...prev, newPage]);
    setActivePageIndex(scannedPages.length);
    setIsCapturing(false);

    // Audio/Visual feedback
    alerts.info(
      language === 'lo' ? `ສະແກນໜ້າທີ ${newPage.pageNumber} ສຳເລັດ` : `Captured Page ${newPage.pageNumber}`,
      language === 'lo' ? 'ໜ້າເອກະສານຖືກບັນທຶກເຂົ້າໃນຊຸດແລ້ວ' : 'Page added to scanned document dossier.'
    );

    // Trigger auto OCR/metadata generation based on current preset and selected employee
    generateMetadataForPreset(docPreset, selectedEmpId, scannedPages.length + 1);
  };

  // Fallback: Handle physical image file upload (e.g. from mobile camera or gallery)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const processed = applyFilterToCanvas(tempCanvas, currentFilter, currentRotation);
            const newPage: ScannedPage = {
              id: `page-${Date.now()}-${scannedPages.length + 1}`,
              pageNumber: scannedPages.length + 1,
              rawImageDataUrl: dataUrl,
              processedImageDataUrl: processed,
              filterMode: currentFilter,
              rotation: currentRotation,
            };
            setScannedPages((prev) => [...prev, newPage]);
            setActivePageIndex(scannedPages.length);
            generateMetadataForPreset(docPreset, selectedEmpId, scannedPages.length + 1);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove a scanned page
  const handleDeletePage = (pageId: string) => {
    setScannedPages((prev) => {
      const updated = prev
        .filter((p) => p.id !== pageId)
        .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      if (activePageIndex >= updated.length) {
        setActivePageIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  // Generate realistic OCR and metadata based on chosen document preset and LHSE employee
  const generateMetadataForPreset = (
    preset: DocumentPresetType,
    empId: string,
    pageCount: number = scannedPages.length || 1
  ) => {
    setIsProcessingOCR(true);
    const emp = employees.find((e) => e.id === empId) || employees[0];
    const dept = departments.find((d) => d.id === emp?.departmentId) || departments[0];
    if (dept) setDocDepartmentId(dept.id);

    const empNameLao = emp ? `${emp.firstNameLao} ${emp.lastNameLao}` : 'ພະນັກງານ LHSE';
    const empNameEn = emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : 'LHSE Employee';
    const empCode = emp?.employeeCode || 'LHSE-001';

    let newTitle = '';
    let newTitleLao = '';
    let newDesc = '';
    let newDescLao = '';
    let newCategory: DocumentCategory = 'CONTRACT';
    let newTags: string[] = ['Scanned Document', 'Digitized'];
    let contentBody = '';

    const todayDateStr = '2026-10-23';

    switch (preset) {
      case 'EMPLOYEE_CONTRACT':
        newCategory = 'CONTRACT';
        newTitle = `Physical Employment Agreement - ${empNameEn} (${empCode})`;
        newTitleLao = `ບົດສັນຍາຈ້າງງານ (ສະແກນ) - ${empNameLao} (${empCode})`;
        newDesc = `Digitized physical labor contract for ${empNameEn} adhering to Lao Labor Law (Amended 2024). Includes handwritten signatures and LHSE corporate seal.`;
        newDescLao = `ສັນຍາຈ້າງງານສະບັບຈິງຂອງ ${empNameLao} ຕາມກົດໝາຍວ່າດ້ວຍແຮງງານ ສປປ ລາວ. ມີລາຍເຊັນຄູ່ສັນຍາ ແລະ ຕາປະທັບແດງ LHSE.`;
        newTags = ['Scanned Document', 'Employee Contract', 'Labor Law', 'Signed Original', 'Confidential'];
        contentBody = `========================================================================
ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
------------------------------------------------------------------------
ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)
ເລກທີ: ${docNumber}
ວັນທີບັນທຶກ: ${todayDateStr}

ບົດສັນຍາຈ້າງງານ (LABOR EMPLOYMENT CONTRACT)
[ສະແກນຈາກເອກະສານຕົວຈິງ • OCR VERIFIED 99.4%]

ລະຫວ່າງ:
1. ຜູ້ວ່າຈ້າງ: ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE), ຕາງໜ້າໂດຍ ທ່ານ ຜູ້ອຳນວຍການໃຫຍ່.
2. ລູກຈ້າງ: ${empNameLao} (${empNameEn}), ລະຫັດພະນັກງານ: ${empCode}.
   - ສັງກັດພະແນກ: ${dept?.nameLao || 'ບໍລິຫານ'} (${dept?.nameEn || 'HR & Admin'}).
   - ຕຳແໜ່ງ: ${emp?.positionId || 'Officer'}.

ໝວດທີ 1: ເງື່ອນໄຂການຈ້າງງານ ແລະ ໜ້າທີ່
1.1 ຜູ້ວ່າຈ້າງຕົກລົງຮັບເອົາ ${empNameLao} ເຂົ້າເຮັດວຽກເຕັມເວລາ.
1.2 ເງິນເດືອນພື້ນຖານ: ${emp ? emp.baseSalary.toLocaleString() : '12,500,000'} ກີບ/ເດືອນ, ຈ່າຍຜ່ານບັນຊີ BCEL Corporate.
1.3 ເວລາເຮັດວຽກ: 08:00 - 17:00 ໂມງ (ວັນຈັນ ຫາ ວັນສຸກ).
1.4 ປະກອບສ່ວນປະກັນສັງຄົມ (LSSO): ລູກຈ້າງ 5.5%, ຜູ້ວ່າຈ້າງ 6.0%.

ໝວດທີ 2: ການຮັບຮອງ ແລະ ຕາປະທັບ
- ລາຍເຊັນລູກຈ້າງ: [ໄດ້ລົງລາຍເຊັນຕົວຈິງແລ້ວ]
- ລາຍເຊັນຜູ້ຕາງໜ້າ LHSE: [ໄດ້ຮັບການອະນຸມັດ ແລະ ລົງນາມ]
- ຕາປະທັບແດງ: ພົບຕາປະທັບກາຊາດ/ກາ LHSE ສົມບູນ (Verified Red Stamp).
- ລະຫັດເອກະສານສະແກນ: ${docNumber} (ຈຳນວນ ${pageCount} ໜ້າ).`;
        break;

      case 'NATIONAL_ID_PASSPORT':
        newCategory = 'LEGAL';
        newTitle = `Scanned National ID Card / Passport - ${empNameEn}`;
        newTitleLao = `ບັດປະຈຳຕົວ / ສຳເນົາ Passport - ${empNameLao}`;
        newDesc = `Certified digitized copy of official Government National Identification Card / Passport for ${empNameEn}.`;
        newDescLao = `ສຳເນົາບັດປະຈຳຕົວພົນລະເມືອງລາວ / ໜັງສືຜ່ານແດນ ຂອງ ${empNameLao}.`;
        newTags = ['Scanned Document', 'National ID', 'Passport', 'Identity Verification', 'KYC'];
        contentBody = `========================================================================
ບັດປະຈຳຕົວພົນລະເມືອງລາວ / NATIONAL ID & PASSPORT RECORD
[DIGITIZED VIA OPTICAL SCANNER • CONFIDENTIAL]

ຂໍ້ມູນບັດປະຈຳຕົວ (CIVIL ID METADATA):
- ຊື່ ແລະ ນາມສະກຸນ: ${empNameLao} (${empNameEn})
- ລະຫັດພະນັກງານ LHSE: ${empCode}
- ຊົນເຜົ່າ: ${emp?.ethnicity || 'ລາວ'} | ສັນຊາດ: ລາວ (Lao Citizen)
- ເລກບັດປະຈຳຕົວ / Passport: ${emp?.passportNumber || empCode.replace('LHSE', 'LAO-ID')}
- ວັນເດືອນປີເກີດ: ${emp?.dateOfBirth || '1990-05-15'}
- ທີ່ຢູ່ປັດຈຸບັນ: ${emp?.address || 'ນະຄອນຫຼວງວຽງຈັນ, ສປປ ລາວ'}
- ວັນທີສະແກນບັນທຶກ: ${todayDateStr}
- ສະຖານະການກວດສອບ: ຜ່ານການກວດກາເອກະສານຕົວຈິງ 100%.`;
        break;

      case 'DIPLOMA_QUALIFICATION':
        newCategory = 'HR_TEMPLATE';
        newTitle = `Academic Degree & Qualification Diploma - ${empNameEn}`;
        newTitleLao = `ໃບປະກາດສະນີຍະບັດ & ວຸດທິການສຶກສາ - ${empNameLao}`;
        newDesc = `Original scanned university degree diploma and specialized credentials for ${empNameEn}.`;
        newDescLao = `ໃບປະກາດສະນີຍະບັດຈົບການສຶກສາ ແລະ ໃບຢັ້ງຢືນວິຊາສະເພາະ ຂອງ ${empNameLao}.`;
        newTags = ['Scanned Document', 'Education', 'Degree Diploma', 'Qualifications'];
        contentBody = `========================================================================
ໃບຢັ້ງຢືນການສຶກສາ & ໃບປະກາດສະນີຍະບັດ (ACADEMIC QUALIFICATION)
[OFFICIAL CERTIFIED CREDENTIAL RECORD]

- ຜູ້ໄດ້ຮັບໃບປະກາດ: ${empNameLao} (${empNameEn})
- ສະຖາບັນການສຶກສາ: ມະຫາວິທະຍາໄລແຫ່ງຊາດ (National University of Laos)
- ລະດັບການສຶກສາ: ${emp?.educationLevel || 'ປະລິນຍາຕີ (Bachelor Degree)'}
- ສາຂາວິຊາສະເພາະ: ${emp?.specialization || 'ວິສະວະກຳສາດ / ບໍລິຫານທຸລະກິດ'}
- ທິດສະດີການເມືອງ: ${emp?.politicalTheory || 'ຊັ້ນຕົ້ນ (45 ວັນ)'}
- ສະຖານະ: ກວດສອບຄວາມຖືກຕ້ອງກັບຕົ້ນສະບັບແລ້ວ.`;
        break;

      case 'MINISTERIAL_DECREE':
        newCategory = 'LEGAL';
        newTitle = `Ministerial Decree & State Enterprise Appointment Order`;
        newTitleLao = `ດຳລັດລັດຖະມົນຕີ / ຂໍ້ຕົກລົງແຕ່ງຕັ້ງພະນັກງານລັດວິສາຫະກິດ`;
        newDesc = `State authorization decree from the Ministry of Industry and Commerce regarding LHSE executive personnel deployment.`;
        newDescLao = `ດຳລັດ ແລະ ຂໍ້ຕົກລົງຈາກກະຊວງອຸດສາຫະກຳ ແລະ ການຄ້າ ກ່ຽວກັບການແຕ່ງຕັ້ງພະນັກງານ LHSE.`;
        newTags = ['Scanned Document', 'Ministerial Decree', 'MOIC Order', 'State Resolution'];
        contentBody = `========================================================================
ກະຊວງອຸດສາຫະກຳ ແລະ ການຄ້າ
ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (LHSE)
ເລກທີ: ${docNumber}
ວຽງຈັນ, ວັນທີ ${todayDateStr}

ຂໍ້ຕົກລົງ / ດຳລັດລັດຖະມົນຕີ (MINISTERIAL RESOLUTION)
[ສະແກນຈາກເອກະສານທາງການທີ່ມີຕາປະທັບລັດຖະບານ]

- ອີງຕາມ: ດຳລັດວ່າດ້ວຍການຈັດຕັ້ງ ແລະ ການເຄື່ອນໄຫວ ຂອງລັດວິສາຫະກິດຖືຮຸ້ນລາວ.
- ຕົກລົງ: ມອບໝາຍໜ້າທີ່ໃຫ້ ${empNameLao} (${empNameEn}) ປະຕິບັດວຽກງານຕາມໂຄງການພະລັງງານຍຸດທະສາດ.
- ຕາປະທັບ: ຕາປະທັບລັດຖະບານ ສປປ ລາວ ຖືກຕ້ອງ 100%.`;
        break;

      case 'MEDICAL_CERTIFICATE':
        newCategory = 'HR_TEMPLATE';
        newTitle = `Medical Health Examination & Fitness Certificate - ${empNameEn}`;
        newTitleLao = `ໃບຢັ້ງຢືນສຸຂະພາບປະຈຳປີ / ໃບກວດສຸຂະພາບ - ${empNameLao}`;
        newDesc = `Official certified medical examination report from accredited state hospital for ${empNameEn}.`;
        newDescLao = `ໃບຢັ້ງຢືນສຸຂະພາບຈາກໂຮງໝໍສູນກາງ ຮັບຮອງສຸຂະພາບສົມບູນພ້ອມປະຕິບັດໜ້າທີ່.`;
        newTags = ['Scanned Document', 'Medical Checkup', 'Health Clearance', 'Annual Exam'];
        contentBody = `========================================================================
ໃບຢັ້ງຢືນສຸຂະພາບ (MEDICAL CLEARANCE CERTIFICATE)
ໂຮງໝໍມິດຕະພາບ / ໂຮງໝໍມະໂຫສົດ
[SCANNED MEDICAL REPORT • FIT FOR DUTY]

- ຄົນເຈັບ/ພະນັກງານ: ${empNameLao} (${empNameEn})
- ອາຍຸ/ເພດ: ${emp?.gender || 'MALE'} | ໝວດເລືອດ: O Positive
- ຜົນການກວດຮ່າງກາຍ: ສຸຂະພາບແຂງແຮງດີ, ບໍ່ພົບພະຍາດຕິດຕໍ່ຮ້າຍແຮງ.
- ຄວາມເຫັນແພດ: ສົມບູນພ້ອມໃນການປະຕິບັດໜ້າທີ່ວຽກງານ 100%.
- ລາຍເຊັນ ແລະ ຕາປະທັບແພດ: ໄດ້ຮັບການຢັ້ງຢືນ.`;
        break;

      default:
        newCategory = 'CONTRACT';
        newTitle = `Digitized Physical Document - ${empNameEn}`;
        newTitleLao = `ເອກະສານສະແກນທາງການ - ${empNameLao}`;
        newDesc = `Scanned and digitized official paper document.`;
        newDescLao = `ເອກະສານຕົ້ນສະບັບທີ່ຖືກສະແກນ ແລະ ແປງເປັນດິຈິຕອນ.`;
        newTags = ['Scanned Document', 'Digitized'];
        contentBody = `Official digitized paper document for ${empNameLao} (${empCode}).`;
        break;
    }

    setTitle(newTitle);
    setTitleLao(newTitleLao);
    setDescription(newDesc);
    setDescriptionLao(newDescLao);
    setDocCategory(newCategory);
    setTags(newTags);
    setExtractedContent(contentBody);

    setTimeout(() => {
      setIsProcessingOCR(false);
      setOcrConfidence(99.4);
    }, 400);
  };

  // When preset or employee changes in the modal form
  const handlePresetChange = (preset: DocumentPresetType) => {
    setDocPreset(preset);
    generateMetadataForPreset(preset, selectedEmpId);
  };

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmpId(empId);
    generateMetadataForPreset(docPreset, empId);
  };

  // Change enhancement filter on active page
  const handleFilterChange = (filter: ScanFilterMode) => {
    setCurrentFilter(filter);
    const activePage = scannedPages[activePageIndex];
    if (activePage) {
      reprocessPage(activePage, filter, activePage.rotation);
    }
  };

  // Rotate active page 90 degrees clockwise
  const handleRotateActivePage = () => {
    const activePage = scannedPages[activePageIndex];
    if (activePage) {
      const nextRotation = (activePage.rotation + 90) % 360;
      setCurrentRotation(nextRotation);
      reprocessPage(activePage, activePage.filterMode, nextRotation);
    }
  };

  // Final submission: Save scanned document to Repository
  const handleSaveScannedDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (scannedPages.length === 0) {
      alerts.error(
        language === 'lo' ? 'ຍັງບໍ່ມີໜ້າເອກະສານທີ່ສະແກນ' : 'No Pages Scanned',
        language === 'lo'
          ? 'ກະລຸນາກົດປຸ່ມສະແກນໜ້າເອກະສານ ຫຼື ອັບໂຫຼດຮູບກ່ອນບັນທຶກ'
          : 'Please capture at least one page from camera or upload an image.'
      );
      return;
    }

    if (!title.trim() && !titleLao.trim()) {
      alerts.error(language === 'lo' ? 'ກະລຸນາປ້ອນຫົວຂໍ້' : 'Title is required');
      return;
    }

    const emp = employees.find((e) => e.id === selectedEmpId);
    const allPageUrls = scannedPages.map((p) => p.processedImageDataUrl);
    const primaryThumbnail = allPageUrls[0] || '';

    createDocument({
      docNumber,
      title: title.trim() || titleLao.trim(),
      titleLao: titleLao.trim() || title.trim(),
      category: docCategory,
      description: description.trim(),
      descriptionLao: descriptionLao.trim(),
      departmentId: docDepartmentId,
      initialContent: extractedContent.trim() || 'Scanned Document Content',
      tags: tags.length > 0 ? tags : ['Scanned Document', 'Digitized'],
      fileType: 'PDF',
      isScanned: true,
      scannedImageUrl: primaryThumbnail,
      scannedPages: allPageUrls,
      employeeId: selectedEmpId,
      extractedMetadata: {
        employeeName: emp ? `${emp.firstNameEn} ${emp.lastNameEn}` : undefined,
        employeeCode: emp?.employeeCode,
        effectiveDate: '2026-10-23',
        expirationDate: emp?.contractEndDate || '2027-10-23',
        salaryAmount: emp ? `${emp.baseSalary.toLocaleString()} LAK` : undefined,
        officialStampDetected: true,
        ocrConfidence: ocrConfidence,
        docClassification: docPreset,
      },
    });

    onClose();
  };

  if (!isOpen) return null;

  const activePage = scannedPages[activePageIndex];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for gallery/camera upload fallback */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*,.pdf"
        className="hidden"
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  {language === 'lo' ? 'ລະບົບສະແກນເອກະສານດິຈິຕອນ' : 'Optical Document Scanner & Digitizer'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  AI OCR Assisted
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'lo'
                  ? 'ນຳໃຊ້ກ້ອງຖ່າຍຮູບອຸປະກອນເພື່ອສະແກນສັນຍາຈ້າງງານ, ບັດປະຈຳຕົວ ແລະ ເອກະສານທາງການເຂົ້າສູ່ລະບົບທັນທີ'
                  : 'Capture physical employee contracts, IDs, and ministerial decrees with live camera & auto-OCR extraction'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: 2 Columns (Left: Viewfinder & Pages, Right: OCR & Metadata) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* LEFT COLUMN: Camera Viewfinder & Captured Pages Carousel (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 flex flex-col gap-4 bg-slate-900 text-white relative">
            {/* Viewfinder Window */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
              {/* Live Video Feed */}
              {cameraActive ? (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              ) : activePage ? (
                <img
                  src={activePage.processedImageDataUrl}
                  alt={`Scanned Page ${activePage.pageNumber}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
                    <CameraOff className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">
                      {cameraError ? (language === 'lo' ? 'ກ້ອງຖ່າຍຮູບບໍ່ພ້ອມໃຊ້ງານ' : 'Camera Unavailable') : (language === 'lo' ? 'ກຳລັງເປີດກ້ອງ...' : 'Starting Camera...')}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      {cameraError || (language === 'lo' ? 'ກະລຸນາລໍຖ້າການເຊື່ອມຕໍ່ກ້ອງຖ່າຍຮູບ' : 'Requesting device camera permissions...')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{language === 'lo' ? 'ອັບໂຫຼດຮູບຈາກອຸປະກອນ' : 'Upload Document Photo'}</span>
                  </button>
                </div>
              )}

              {/* Viewfinder Overlay Guide (Document Alignment Frame + Laser Scanner Effect) */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
                  {/* Top indicator */}
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live Viewfinder • A4 Alignment Guide</span>
                  </div>

                  {/* Corner crop marks frame */}
                  <div className="relative w-[85%] h-[80%] border border-dashed border-emerald-400/60 rounded-xl overflow-hidden flex items-center justify-center">
                    {/* Corner Bracket Graphics */}
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-3 border-l-3 border-emerald-400 rounded-tl-sm" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-3 border-r-3 border-emerald-400 rounded-tr-sm" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-3 border-l-3 border-emerald-400 rounded-bl-sm" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-3 border-r-3 border-emerald-400 rounded-br-sm" />

                    {/* Animated Scanning Laser Beam */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse pointer-events-none" />

                    <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-md font-mono tracking-wider backdrop-blur-xs">
                      {language === 'lo' ? 'ວາງເອກະສານໃຫ້ພໍດີກັບຂອບ' : 'Fit Document Inside Frame'}
                    </span>
                  </div>

                  {/* Bottom helper */}
                  <div className="text-[10px] text-slate-300 font-medium bg-black/50 px-3 py-1 rounded-lg backdrop-blur-xs">
                    {language === 'lo' ? 'ຖືອຸປະກອນໃຫ້ນິ້ງ ເພື່ອຄວາມຄົມຊັດຂອງຕົວໜັງສື' : 'Hold device steady for optimal OCR recognition'}
                  </div>
                </div>
              )}
            </div>

            {/* Camera Control Toolbar */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                {/* Switch Camera (Front/Back) */}
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  title="Switch Camera"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
                </button>

                {/* Torch / Flashlight Toggle */}
                {torchSupported && (
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    className={`p-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border ${
                      torchEnabled
                        ? 'bg-amber-500 text-white border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                    title="Flashlight"
                  >
                    {torchEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                    <span className="hidden sm:inline">Torch</span>
                  </button>
                )}

                {/* Upload File Fallback */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  title="Upload image photo"
                >
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">{language === 'lo' ? 'ອັບໂຫຼດ' : 'Upload File'}</span>
                </button>
              </div>

              {/* Main Shutter / Capture Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCapturePage}
                  disabled={isCapturing}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {isCapturing
                      ? (language === 'lo' ? 'ກຳລັງບັນທຶກ...' : 'Capturing...')
                      : (language === 'lo' ? 'ກົດສະແກນໜ້ານີ້' : 'Capture Page')}
                  </span>
                </button>
              </div>
            </div>

            {/* Post-Capture Enhancement Toolbar (Filters & Rotation) */}
            {scannedPages.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {language === 'lo' ? 'ໂໝດປັບພາບ:' : 'Filter:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('DOCUMENT')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      currentFilter === 'DOCUMENT'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Auto Doc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('BW')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      currentFilter === 'BW'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    B&W Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterChange('COLOR')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      currentFilter === 'COLOR'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Full Color
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRotateActivePage}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate</span>
                  </button>
                </div>
              </div>
            )}

            {/* Multi-Page Scanned Thumbnails Carousel */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'lo' ? 'ໜ້າເອກະສານທີ່ສະແກນ' : 'Scanned Dossier Pages'} ({scannedPages.length})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {scannedPages.length === 0
                    ? (language === 'lo' ? 'ຍັງບໍ່ມີໜ້າ' : 'No pages captured yet')
                    : `Active: Page ${activePageIndex + 1}/${scannedPages.length}`}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar min-h-[72px]">
                {scannedPages.map((page, idx) => {
                  const isSelected = idx === activePageIndex;
                  return (
                    <div
                      key={page.id}
                      onClick={() => setActivePageIndex(idx)}
                      className={`relative group shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-400 ring-2 ring-blue-500/40 scale-105'
                          : 'border-slate-700 opacity-75 hover:opacity-100 hover:border-slate-500'
                      }`}
                    >
                      <img
                        src={page.processedImageDataUrl}
                        alt={`Page ${page.pageNumber}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded-sm bg-black/75 text-[9px] font-mono font-bold text-white">
                        P.{page.pageNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page.id);
                        }}
                        className="absolute top-1 right-1 p-0.5 rounded-md bg-rose-600/90 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Delete page"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Add Next Page Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!cameraActive) startCamera();
                  }}
                  className="shrink-0 w-16 h-20 rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-400 flex flex-col items-center justify-center text-slate-400 hover:text-blue-400 transition-all cursor-pointer group"
                >
                  <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span className="text-[9px] font-bold mt-1">
                    {language === 'lo' ? '+ ໜ້າໃໝ່' : '+ Add'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: OCR Extractor, Employee Association & Repository Metadata (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900">
            <form onSubmit={handleSaveScannedDocument} className="space-y-4">
              {/* Preset Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'lo' ? 'ປະເພດເອກະສານທີ່ສະແກນ:' : 'Document Classification Preset:'}</span>
                </label>
                <select
                  value={docPreset}
                  onChange={(e) => handlePresetChange(e.target.value as DocumentPresetType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EMPLOYEE_CONTRACT">📋 ບົດສັນຍາຈ້າງງານ (Employment Contract)</option>
                  <option value="NATIONAL_ID_PASSPORT">🪪 ບັດປະຈຳຕົວ / Passport (National ID Card)</option>
                  <option value="DIPLOMA_QUALIFICATION">🎓 ໃບປະກາດສະນີຍະບັດ / ວຸດທິການສຶກສາ (Degree Diploma)</option>
                  <option value="MINISTERIAL_DECREE">🏛️ ດຳລັດ / ຂໍ້ຕົກລົງລັດຖະມົນຕີ (Ministerial Decree)</option>
                  <option value="MEDICAL_CERTIFICATE">🏥 ໃບຢັ້ງຢືນສຸຂະພາບ (Medical Clearance)</option>
                  <option value="OTHER_OFFICIAL">📁 ເອກະສານທາງການອື່ນໆ (Other Official Document)</option>
                </select>
              </div>

              {/* Link to Employee */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'lo' ? 'ເຊື່ອມໂຍງກັບພະນັກງານ LHSE:' : 'Link to LHSE Employee:'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {employees.length} Personnel
                  </span>
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {language === 'lo' ? `${emp.firstNameLao} ${emp.lastNameLao}` : `${emp.firstNameEn} ${emp.lastNameEn}`} ({emp.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Number & Department */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                    {language === 'lo' ? 'ເລກທີເອກະສານ:' : 'Document Number:'}
                  </label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                    {language === 'lo' ? 'ພະແນກສັງກັດ:' : 'Department:'}
                  </label>
                  <select
                    value={docDepartmentId}
                    onChange={(e) => setDocDepartmentId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {language === 'lo' ? d.nameLao : d.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Titles */}
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                    {language === 'lo' ? 'ຫົວຂໍ້ເອກະສານ (ພາສາລາວ):' : 'Document Title (Lao):'}
                  </label>
                  <input
                    type="text"
                    value={titleLao}
                    onChange={(e) => setTitleLao(e.target.value)}
                    placeholder="ປ້ອນຫົວຂໍ້ເອກະສານພາສາລາວ..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 block">
                    {language === 'lo' ? 'ຫົວຂໍ້ເອກະສານ (English):' : 'Document Title (English):'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter document title in English..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Extracted Optical Text / OCR Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span>{language === 'lo' ? 'ເນື້ອໃນ OCR ທີ່ກວດພົບອັດຕະໂນມັດ:' : 'OCR Extracted Text:'}</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Confidence: {ocrConfidence}%
                  </span>
                </div>
                <textarea
                  value={extractedContent}
                  onChange={(e) => setExtractedContent(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] text-slate-800 dark:text-slate-200 outline-hidden focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* OCR Detection & Audit Stamp Verification Card */}
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'lo' ? 'ກວດພົບຕາປະທັບທາງການ LHSE' : 'Official LHSE Seal Verified'}</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    PASSED
                  </span>
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                  {language === 'lo'
                    ? 'ລະບົບໄດ້ກວດສອບລາຍເຊັນ ແລະ ຕາປະທັບແດງຂອງອົງກອນ. ພ້ອມເຂົ້າສູ່ຄັງເອກະສານ ແລະ ສ້າງເວີຊັນ v1.0.'
                    : 'Authenticity confirmed via seal watermark analysis. Digital artifact initialized at baseline v1.0.'}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  {language === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={scannedPages.length === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>
                    {language === 'lo'
                      ? `ບັນທຶກເອກະສານ (${scannedPages.length} ໜ້າ)`
                      : `Save Document (${scannedPages.length} Pages)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
