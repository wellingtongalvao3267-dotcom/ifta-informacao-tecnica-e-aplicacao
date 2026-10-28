import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Scan, 
  RefreshCw, 
  Search, 
  Lock, 
  ArrowRight,
  Plus
} from 'lucide-react';
import jsQR from 'jsqr';
import { ComponentItem } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanMatch: (tagCode: string) => void;
  components: ComponentItem[];
  allComponents?: ComponentItem[];
  currentUserRole?: string;
  onAddNewWithCode?: (code: string) => void;
}

// Resilient matcher across multiple fields, URLs, prefixes, and models
export function matchComponentFromQr(
  rawValue: string, 
  itemList: ComponentItem[]
): ComponentItem | null {
  if (!rawValue || !rawValue.trim()) return null;
  const raw = rawValue.trim();
  const rawUpper = raw.toUpperCase();

  // Strip standard prefixes, URLs, and queries
  const clean = rawUpper
    .replace(/^HTTPS?:\/\/[^\/]+\//i, '')
    .replace(/^IFTA[:\-\/_\s]+/i, '')
    .replace(/[#\?].*$/, '')
    .trim();

  // Helper to remove punctuation for relaxed alphanumeric matching
  const strip = (str: string) => str.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const strippedClean = strip(clean);
  const strippedRaw = strip(raw);

  // 1. Direct tagCode match
  const directTag = itemList.find(
    c => c.tagCode.toUpperCase() === rawUpper || c.tagCode.toUpperCase() === clean
  );
  if (directTag) return directTag;

  // 2. Direct qrCodeData match
  const directQr = itemList.find(
    c => c.qrCodeData.toUpperCase() === rawUpper || c.qrCodeData.toUpperCase() === clean
  );
  if (directQr) return directQr;

  // 3. Relaxed stripped match (e.g. MOTIND042 matches MOT-IND-042)
  if (strippedClean.length >= 3) {
    const strippedMatch = itemList.find(c => {
      const cTag = strip(c.tagCode);
      const cId = strip(c.id);
      const cModel = strip(c.model || '');
      return (
        cTag === strippedClean ||
        cTag === strippedRaw ||
        (cModel && (cModel === strippedClean || cModel === strippedRaw)) ||
        cId === strippedClean
      );
    });
    if (strippedMatch) return strippedMatch;
  }

  // 4. Model / Part Number match
  const modelMatch = itemList.find(c => {
    if (!c.model) return false;
    const cModel = c.model.toUpperCase();
    return (
      cModel === rawUpper ||
      cModel === clean ||
      (cModel.length >= 4 && (rawUpper.includes(cModel) || clean.includes(cModel)))
    );
  });
  if (modelMatch) return modelMatch;

  // 5. Substring match: QR string contains component tag
  const subMatch = itemList.find(c => {
    const tag = c.tagCode.toUpperCase();
    return rawUpper.includes(tag) || clean.includes(tag);
  });
  if (subMatch) return subMatch;

  // 6. Name match if string is detailed
  if (clean.length >= 5) {
    const nameMatch = itemList.find(
      c => c.name.toUpperCase().includes(clean) || clean.includes(c.name.toUpperCase())
    );
    if (nameMatch) return nameMatch;
  }

  return null;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanMatch,
  components,
  allComponents = components,
  currentUserRole = 'DESENVOLVEDOR',
  onAddNewWithCode
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [matchedComponent, setMatchedComponent] = useState<ComponentItem | null>(null);
  const [restrictedComponent, setRestrictedComponent] = useState<ComponentItem | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual' | 'quick'>('camera');

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    setScannedResult(null);
    setMatchedComponent(null);
    setRestrictedComponent(null);
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
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
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
      setActiveTab('manual');
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
    // Use attemptBoth for regular and inverted (dark-mode) QR codes
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth'
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
    setRestrictedComponent(null);
    setMatchedComponent(null);

    // 1. Try matching within user-accessible components
    const match = matchComponentFromQr(rawValue, components);
    if (match) {
      setMatchedComponent(match);
      setTimeout(() => {
        onScanMatch(match.tagCode);
      }, 800);
      return;
    }

    // 2. If not found in accessible components, check full database
    const fullMatch = matchComponentFromQr(rawValue, allComponents);
    if (fullMatch) {
      // It exists in database, but user's profile is restricted from that category
      setRestrictedComponent(fullMatch);
      return;
    }

    // 3. Not found anywhere
    setMatchedComponent(null);
  };

  // Upload photo handler
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
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data) {
          handleCodeDetected(code.data);
        } else {
          setCameraError('Nenhum QR Code legível foi detectado na imagem. Certifique-se de que o código está nítido e bem iluminado.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleCodeDetected(manualCodeInput.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <Scan className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Escanear QR Code Industrial</h3>
              <p className="text-[11px] text-slate-400">Leitura inteligente de etiquetas, tags e códigos de peças</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 px-5 pt-2.5 gap-3 text-xs font-medium shrink-0 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('camera'); setCameraError(null); }}
            className={`pb-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'camera'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Câmera ao Vivo</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('manual'); stopCamera(); }}
            className={`pb-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'manual'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Digitar Código / Tag</span>
          </button>

          <button
            onClick={() => { setActiveTab('upload'); stopCamera(); }}
            className={`pb-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'upload'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carregar Foto</span>
          </button>

          <button
            onClick={() => { setActiveTab('quick'); stopCamera(); }}
            className={`pb-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'quick'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tags Rápidas</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col items-center">
          
          {/* TAB 1: Live Camera */}
          {activeTab === 'camera' && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
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
                  <div className="w-48 h-48 border-2 border-amber-400/80 rounded-xl relative shadow-2xl">
                    <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400 -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400 -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400 -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400 -mb-1 -mr-1" />
                    <div className="w-full h-0.5 bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse" />
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-5 text-center">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                    <p className="text-xs text-slate-300 mb-3 max-w-xs">{cameraError}</p>
                    <button
                      onClick={() => setActiveTab('manual')}
                      className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-semibold text-xs rounded-lg"
                    >
                      Digitar Código Manualmente
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Aponte a câmera para a etiqueta QR code na peça, painel ou máquina.
              </p>
            </div>
          )}

          {/* TAB 2: Manual Input */}
          {activeTab === 'manual' && (
            <div className="w-full space-y-3">
              <p className="text-xs text-slate-300">
                Digite a tag da peça, part number ou código do QR Code:
              </p>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="Ex: MOT-IND-042, INV-ELET-018, 1LE1, VTUG-10..."
                    className="w-full pl-3 pr-24 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 uppercase focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-md transition flex items-center gap-1"
                  >
                    <span>Localizar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
              <p className="text-[11px] text-slate-500">
                O sistema reconhece tags como <code className="text-amber-400">MOT-IND-042</code>, códigos sem traço (<code className="text-amber-400">MOTIND042</code>), códigos com prefixo <code className="text-amber-400">IFTA:</code> ou modelos dos fabricantes.
              </p>
            </div>
          )}

          {/* TAB 3: Upload Photo */}
          {activeTab === 'upload' && (
            <div className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-8 bg-slate-950/50">
              <Upload className="w-10 h-10 text-slate-500 mb-3" />
              <p className="text-sm font-medium text-slate-200 mb-1">Selecione uma foto da etiqueta com QR Code</p>
              <p className="text-xs text-slate-500 mb-4 text-center">
                Formatos aceitos: JPG, PNG, WebP
              </p>
              <label className="cursor-pointer px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition shadow">
                <span>Escolher Arquivo do Dispositivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* TAB 4: Quick System Tags */}
          {activeTab === 'quick' && (
            <div className="w-full">
              <p className="text-xs text-slate-400 mb-3">
                Selecione uma tag industrial para simular leitura de QR Code em campo:
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {components.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => handleCodeDetected(comp.qrCodeData)}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition flex items-center justify-between group"
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

          {/* STATUS NOTIFICATIONS */}
          
          {/* Case 1: Match Found and User has permission */}
          {matchedComponent && (
            <div className="w-full mt-4 p-3.5 bg-emerald-950/80 border border-emerald-700 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-emerald-300 block">
                  Peça Localizada: {matchedComponent.tagCode}
                </span>
                <span className="text-xs text-emerald-200/90 truncate block">
                  {matchedComponent.name} ({matchedComponent.category})
                </span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                  Abrindo ficha técnica completa...
                </span>
              </div>
            </div>
          )}

          {/* Case 2: Component exists in database, BUT user role does not have category permission */}
          {restrictedComponent && (
            <div className="w-full mt-4 p-3.5 bg-amber-950/80 border border-amber-600 rounded-xl flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 text-xs">
                <span className="font-semibold text-amber-300 block mb-1">
                  Peça Cadastrada no Sistema: {restrictedComponent.tagCode}
                </span>
                <p className="text-amber-200/90 leading-relaxed mb-2">
                  O item <strong>"{restrictedComponent.name}"</strong> foi localizado no banco de dados, porém pertence à categoria <strong>"{restrictedComponent.category}"</strong>, que atualmente não está liberada para o seu perfil (<strong>{currentUserRole}</strong>).
                </p>
                <p className="text-[11px] text-amber-400">
                  💡 <strong>Solução:</strong> Solicite ao usuário <strong>Desenvolvedor</strong> para liberar a categoria "{restrictedComponent.category}" na aba <em>Permissões por Usuário</em> do Painel.
                </p>
              </div>
            </div>
          )}

          {/* Case 3: Code was scanned but not found in entire database */}
          {scannedResult && !matchedComponent && !restrictedComponent && (
            <div className="w-full mt-4 p-3.5 bg-slate-950 border border-slate-700 rounded-xl space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <span>Código lido da etiqueta: </span>
                  <code className="font-mono text-amber-300 font-semibold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {scannedResult}
                  </code>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Nenhuma peça cadastrada corresponde a este código ou modelo no banco de dados. Verifique se o código impresso na etiqueta corresponde a uma peça já cadastrada.
              </p>
              {currentUserRole === 'DESENVOLVEDOR' && onAddNewWithCode && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddNewWithCode(scannedResult);
                  }}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Nova Peça com este Código</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
