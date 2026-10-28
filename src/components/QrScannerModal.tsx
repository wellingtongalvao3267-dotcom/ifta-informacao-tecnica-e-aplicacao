import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, Upload, CheckCircle2, AlertTriangle, Scan, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';
import { ComponentItem } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanMatch: (tagCode: string) => void;
  components: ComponentItem[];
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanMatch,
  components
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [matchedComponent, setMatchedComponent] = useState<ComponentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'quick'>('camera');

  // Start camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    setScannedResult(null);
    setMatchedComponent(null);
    setCameraError(null);

    if (activeTab === 'camera') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Acesso à câmera não suportado neste navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCamera(true);
        scanFrame();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setHasCamera(false);
      setCameraError(error.message || 'Não foi possível acessar a câmera do dispositivo.');
      // Fallback to quick tab if camera unavailable
      setActiveTab('quick');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      handleCodeDetected(code.data);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleCodeDetected = (rawValue: string) => {
    stopCamera();
    setScannedResult(rawValue);

    // Look for component matching the rawValue or code after "IFTA:"
    const clean = rawValue.replace(/^IFTA:/i, '').trim().toUpperCase();
    const match = components.find(
      (c) =>
        c.tagCode.toUpperCase() === clean ||
        c.qrCodeData.toUpperCase() === rawValue.toUpperCase() ||
        c.id.toUpperCase() === clean
    );

    if (match) {
      setMatchedComponent(match);
      setTimeout(() => {
        onScanMatch(match.tagCode);
      }, 900);
    }
  };

  // Handle uploaded image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);

        if (code && code.data) {
          handleCodeDetected(code.data);
        } else {
          setCameraError('Nenhum QR Code legível foi detectado na imagem carregada.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Scan className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Escanear QR Code Industrial</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 px-5 pt-3 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('camera')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
              activeTab === 'camera'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Câmera ao Vivo</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carregar Imagem</span>
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
              activeTab === 'quick'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tags do Sistema</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 flex-1 flex flex-col items-center">
          {activeTab === 'camera' && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Reticle / targeting frame */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-44 border-2 border-amber-400/80 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400 -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400 -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400 -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400 -mb-1 -mr-1" />
                    <div className="w-full h-0.5 bg-amber-400/60 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab('quick')}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg"
                    >
                      Usar Lista de Tags Rápidas
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Aponte a câmera para a etiqueta QR code fixada no painel ou máquina.
              </p>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-8 bg-slate-950/50">
              <Upload className="w-10 h-10 text-slate-500 mb-3" />
              <p className="text-sm font-medium text-slate-200 mb-1">Selecione uma foto da etiqueta</p>
              <p className="text-xs text-slate-500 mb-4 text-center">
                Formatos aceitos: JPG, PNG, WebP contendo o código QR
              </p>
              <label className="cursor-pointer px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition shadow">
                <span>Escolher Arquivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {activeTab === 'quick' && (
            <div className="w-full">
              <p className="text-xs text-slate-400 mb-3">
                Selecione uma tag industrial para simular leitura de QR Code em campo:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {components.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => handleCodeDetected(comp.qrCodeData)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {comp.tagCode}
                        </span>
                        <span className="text-[11px] text-slate-500">· {comp.category}</span>
                      </div>
                      <p className="text-xs text-slate-300 truncate max-w-xs">{comp.name}</p>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-amber-300 font-medium">
                      Simular Leitura →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Success recognition badge */}
          {matchedComponent && (
            <div className="w-full mt-4 p-3 bg-emerald-950/70 border border-emerald-700/80 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-emerald-300 block">
                  Tag Reconhecida: {matchedComponent.tagCode}
                </span>
                <span className="text-xs text-emerald-200/80 truncate block">
                  {matchedComponent.name}
                </span>
              </div>
            </div>
          )}

          {scannedResult && !matchedComponent && (
            <div className="w-full mt-4 p-3 bg-amber-950/70 border border-amber-700/80 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs text-amber-200">
                Código lido: <code className="font-mono">{scannedResult}</code> (não catalogado na base atual).
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
