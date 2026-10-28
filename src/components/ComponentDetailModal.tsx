import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Wrench, 
  FileText, 
  Cpu, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Maximize2,
  ZoomIn,
  Copy,
  Check
} from 'lucide-react';
import { ComponentItem, UserRole } from '../types';
import { TechnicalItemImage } from './TechnicalItemImage';

interface ComponentDetailModalProps {
  component: ComponentItem | null;
  onClose: () => void;
  onEdit?: (component: ComponentItem) => void;
  onDelete?: (id: string) => void;
  userRole: UserRole;
  initialTab?: 'specs' | 'diagram' | 'maintenance' | 'failures' | 'manual' | 'qr';
}

export const ComponentDetailModal: React.FC<ComponentDetailModalProps> = ({
  component,
  onClose,
  onEdit,
  onDelete,
  userRole,
  initialTab = 'specs'
}) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'diagram' | 'maintenance' | 'failures' | 'manual' | 'qr'>(initialTab);
  const [copied, setCopied] = useState(false);
  const [zoomDiagram, setZoomDiagram] = useState(false);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, component?.id]);

  if (!component) return null;

  const handleCopyTag = () => {
    navigator.clipboard.writeText(component.tagCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative my-auto">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded font-mono text-xs font-bold text-amber-300">
              {component.tagCode}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{component.category}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">{component.manufacturer}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Imprimir Ficha Técnica"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Printer className="w-4 h-4" />
            </button>
            
            {userRole === 'DESENVOLVEDOR' && onEdit && (
              <button
                onClick={() => onEdit(component)}
                title="Editar Componente"
                className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {userRole === 'DESENVOLVEDOR' && onDelete && (
              <button
                onClick={() => {
                  if (confirm(`Deseja realmente excluir o componente ${component.tagCode}?`)) {
                    onDelete(component.id);
                  }
                }}
                title="Excluir Componente"
                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-slate-800 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Component Title & Kicker */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
              {component.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aplicação: <strong className="text-slate-300 font-medium">{component.application}</strong>
            </p>
          </div>

          <button
            onClick={handleCopyTag}
            className="self-start md:self-auto flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
          </button>
        </div>

        {/* Tab Navigation (Interactive Filter Controls) */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900 overflow-x-auto gap-4 text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Especificações & Visão Geral
          </button>

          <button
            onClick={() => setActiveTab('diagram')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'diagram'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Diagrama & Esquema Técnico
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'maintenance'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Manutenção Preventiva
          </button>

          <button
            onClick={() => setActiveTab('failures')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'failures'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Diagnóstico de Falhas
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'manual'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Manual & Datasheet
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`py-3 border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'qr'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Etiqueta QR Code
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: Specs & Overview */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {/* Media banner + description split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                  <TechnicalItemImage
                    src={component.imageUrl}
                    alt={component.name}
                    category={component.category}
                    tagCode={component.tagCode}
                    aspectRatio="4/3"
                    showBlueprintToggle={true}
                    allowZoom={true}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                      Descrição Geral & Operação
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {component.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Fabricante</span>
                      <span className="text-slate-200 font-semibold">{component.manufacturer}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Modelo Técnico</span>
                      <span className="text-slate-200 font-semibold">{component.model}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Tag do Ativo</span>
                      <span className="text-amber-400 font-semibold">{component.tagCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Intervalo Revisão</span>
                      <span className="text-slate-200 font-semibold tabular-nums">
                        {component.maintenanceIntervalHours ? `${component.maintenanceIntervalHours} horas` : 'Sob demanda'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specifications Table */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Parâmetros Técnicos Homologados</span>
                </h4>
                
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Parâmetro</th>
                        <th className="px-4 py-2.5 font-semibold">Especificação Homologada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {component.specs.map((spec, i) => (
                        <tr key={i} className="hover:bg-slate-900/40 transition">
                          <td className="px-4 py-2.5 text-slate-300 font-sans font-medium">{spec.label}</td>
                          <td className="px-4 py-2.5 text-amber-300 tabular-nums">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Technical Diagram & Schematic */}
          {activeTab === 'diagram' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Diagrama Funcional e Mapa de Conexões
                </h4>
                <button
                  onClick={() => setZoomDiagram(!zoomDiagram)}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>{zoomDiagram ? 'Tamanho Padrão' : 'Ampliar Visualização'}</span>
                </button>
              </div>

              {/* Schematic Canvas representation */}
              <div className={`w-full rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center relative transition-all ${
                zoomDiagram ? 'min-h-[500px]' : 'min-h-[300px]'
              }`}>
                {/* Visual CAD/Schematic SVG illustration */}
                <div className="w-full max-w-xl p-4 bg-slate-900/80 rounded-lg border border-slate-800 text-center relative overflow-hidden">
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500 uppercase">
                    Diagrama Homologado · IFTA-CAD-2026
                  </div>
                  
                  {/* Schematic Vector Drawing */}
                  <div className="my-6 flex items-center justify-center">
                    <svg viewBox="0 0 400 180" className="w-full max-w-md h-auto stroke-amber-400/80 fill-none">
                      {/* Grid lines */}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(71, 85, 105, 0.2)" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="400" height="180" fill="url(#grid)" />

                      {/* Main component box */}
                      <rect x="140" y="30" width="120" height="110" rx="6" stroke="#f59e0b" strokeWidth="2" fill="rgba(245, 158, 11, 0.05)" />
                      <text x="200" y="65" fill="#f8fafc" fontSize="12" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                        {component.tagCode}
                      </text>
                      <text x="200" y="85" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
                        {component.manufacturer.split('/')[0]}
                      </text>
                      <text x="200" y="105" fill="#e2e8f0" fontSize="10" textAnchor="middle" fontFamily="monospace">
                        {component.category}
                      </text>

                      {/* Input Lines */}
                      <path d="M 40 55 L 140 55" stroke="#38bdf8" strokeWidth="2" />
                      <circle cx="40" cy="55" r="4" fill="#38bdf8" />
                      <text x="50" y="48" fill="#38bdf8" fontSize="9" fontFamily="monospace">L1/24Vcc</text>

                      <path d="M 40 85 L 140 85" stroke="#38bdf8" strokeWidth="2" />
                      <circle cx="40" cy="85" r="4" fill="#38bdf8" />
                      <text x="50" y="78" fill="#38bdf8" fontSize="9" fontFamily="monospace">L2/GND</text>

                      <path d="M 40 115 L 140 115" stroke="#38bdf8" strokeWidth="2" />
                      <circle cx="40" cy="115" r="4" fill="#38bdf8" />
                      <text x="50" y="108" fill="#38bdf8" fontSize="9" fontFamily="monospace">L3/PE</text>

                      {/* Output Lines */}
                      <path d="M 260 65 L 360 65" stroke="#34d399" strokeWidth="2" />
                      <circle cx="360" cy="65" r="4" fill="#34d399" />
                      <text x="310" y="58" fill="#34d399" fontSize="9" fontFamily="monospace">Saída U</text>

                      <path d="M 260 95 L 360 95" stroke="#34d399" strokeWidth="2" />
                      <circle cx="360" cy="95" r="4" fill="#34d399" />
                      <text x="310" y="88" fill="#34d399" fontSize="9" fontFamily="monospace">Saída V</text>
                    </svg>
                  </div>

                  <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded border border-slate-800 text-left">
                    {component.diagramDescription || 'Esquema elétrico e mecânico aprovado para integração na planta industrial.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Maintenance Procedures */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Roteiro de Manutenção e Parâmetros de Torque</span>
                </h4>
                {component.maintenanceIntervalHours && (
                  <span className="text-xs font-mono text-amber-400">
                    Periodicidade: cada {component.maintenanceIntervalHours} horas
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {component.maintenanceGuide.map((step) => (
                  <div key={step.step} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono text-xs font-bold shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h5 className="text-sm font-semibold text-white">{step.title}</h5>
                        {step.torqueOrMeasure && (
                          <span className="text-xs font-mono text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {step.torqueOrMeasure}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {step.instruction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Failures & Corrective Actions */}
          {activeTab === 'failures' && (
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Matriz de Falhas Comuns e Ações Corretivas</span>
              </h4>

              <div className="space-y-3">
                {component.commonFailures.map((failure, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-300 mb-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <span>{failure.symptom}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800/80">
                      <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-semibold block mb-1">Causa Provável:</span>
                        <p className="text-slate-300">{failure.probableCause}</p>
                      </div>
                      <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-emerald-400 font-semibold block mb-1">Ação Corretiva Recomendada:</span>
                        <p className="text-slate-300">{failure.correctiveAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Manual & Datasheet */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">
                      {component.manualFileName || 'Manual_Tecnico_Homologado.pdf'}
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Documento oficial do fabricante · Homologado para engenharia IFTA
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Iniciando download seguro de: ${component.manualFileName || 'manual.pdf'}`)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Manual</span>
                  </button>
                </div>
              </div>

              {/* Reader summary preview */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <h6 className="font-semibold text-slate-300 mb-2">Resumo Executivo do Manual:</h6>
                <p className="text-slate-400 leading-relaxed mb-4">
                  {component.manualSummary || 'O documento inclui procedimentos de instalação elétrica e mecânica, tolerâncias dimensionais, esquema de conexões e tabela de peças sobressalentes homologadas.'}
                </p>

                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-400 space-y-1 text-[11px]">
                  <div>· Versão: 2026.4 / Revisão de Campo Aprovada</div>
                  <div>· Fabricante: {component.manufacturer}</div>
                  <div>· Código de Homologação: {component.tagCode}-DOC</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: QR Code Field Tag */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              {/* Printed Tag Preview Box */}
              <div className="p-6 bg-white text-slate-900 rounded-2xl border-4 border-slate-300 shadow-xl max-w-sm w-full flex flex-col items-center">
                <div className="font-black tracking-tight text-lg text-slate-900 mb-1">
                  IFTA ENGENHARIA
                </div>
                <div className="text-[10px] text-slate-600 font-mono uppercase tracking-wider mb-3">
                  Etiqueta de Identificação de Campo
                </div>

                {/* QR Code SVG */}
                <div className="p-3 bg-white border-2 border-slate-900 rounded-xl mb-3">
                  <svg viewBox="0 0 100 100" className="w-36 h-36">
                    {/* Simulated accurate QR Code Matrix */}
                    <rect width="100" height="100" fill="#ffffff" />
                    {/* Top-left locator */}
                    <rect x="5" y="5" width="25" height="25" fill="#000000" />
                    <rect x="9" y="9" width="17" height="17" fill="#ffffff" />
                    <rect x="13" y="13" width="9" height="9" fill="#000000" />
                    {/* Top-right locator */}
                    <rect x="70" y="5" width="25" height="25" fill="#000000" />
                    <rect x="74" y="9" width="17" height="17" fill="#ffffff" />
                    <rect x="78" y="13" width="9" height="9" fill="#000000" />
                    {/* Bottom-left locator */}
                    <rect x="5" y="70" width="25" height="25" fill="#000000" />
                    <rect x="9" y="74" width="17" height="17" fill="#ffffff" />
                    <rect x="13" y="78" width="9" height="9" fill="#000000" />
                    {/* Matrix data cells */}
                    <rect x="35" y="10" width="8" height="8" fill="#000000" />
                    <rect x="50" y="10" width="8" height="8" fill="#000000" />
                    <rect x="40" y="25" width="8" height="8" fill="#000000" />
                    <rect x="55" y="25" width="8" height="8" fill="#000000" />
                    <rect x="35" y="40" width="8" height="8" fill="#000000" />
                    <rect x="45" y="45" width="15" height="15" fill="#000000" />
                    <rect x="70" y="40" width="10" height="10" fill="#000000" />
                    <rect x="85" y="45" width="8" height="8" fill="#000000" />
                    <rect x="10" y="45" width="8" height="8" fill="#000000" />
                    <rect x="20" y="55" width="8" height="8" fill="#000000" />
                    <rect x="35" y="70" width="8" height="8" fill="#000000" />
                    <rect x="50" y="75" width="8" height="8" fill="#000000" />
                    <rect x="70" y="70" width="12" height="12" fill="#000000" />
                    <rect x="85" y="80" width="10" height="10" fill="#000000" />
                  </svg>
                </div>

                <div className="font-mono text-sm font-bold text-slate-900 tracking-wider">
                  {component.tagCode}
                </div>
                <div className="text-[11px] text-slate-700 font-medium truncate max-w-[240px]">
                  {component.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  {component.qrCodeData}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Etiqueta para Painel</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 shrink-0 flex items-center justify-between text-xs text-slate-500">
          <span>Cadastrado em: {component.createdAt ? new Date(component.createdAt).toLocaleDateString('pt-BR') : '2026'}</span>
          <span>IFTA Informações Técnicas e Aplicação</span>
        </div>
      </div>
    </div>
  );
};
