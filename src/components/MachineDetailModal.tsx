import React, { useState } from 'react';
import { 
  X, 
  Cog, 
  Wrench, 
  Zap, 
  Shield, 
  Ruler, 
  MapPin, 
  Layers, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ChevronRight
} from 'lucide-react';
import { MachineItem, ComponentItem, UserRole } from '../types';

interface MachineDetailModalProps {
  machine: MachineItem | null;
  onClose: () => void;
  allComponents: ComponentItem[];
  userRole: UserRole;
  onSelectComponent: (comp: ComponentItem, initialTab?: 'specs' | 'diagram' | 'maintenance' | 'failures' | 'manual' | 'qr') => void;
  onEditMachine?: (machine: MachineItem) => void;
  onDeleteMachine?: (machineId: string) => void;
}

export const MachineDetailModal: React.FC<MachineDetailModalProps> = ({
  machine,
  onClose,
  allComponents,
  userRole,
  onSelectComponent,
  onEditMachine,
  onDeleteMachine
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!machine) return null;

  // Components visible for this user's profile
  const visibleLinked = machine.linkedComponents.filter(link => {
    if (userRole === 'DESENVOLVEDOR') return true;
    return link.allowedRoles.includes(userRole);
  });

  const hiddenCount = machine.linkedComponents.length - visibleLinked.length;

  const getRoleTheme = () => {
    if (userRole === 'MECANICA') {
      return {
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
        title: 'Área Técnica: Mecânica',
        icon: <Wrench className="w-4 h-4 text-sky-400" />,
        text: 'Você tem acesso aos itens mecânicos desta máquina (ex: rolamentos, mancais, fita transportadora e rolos) pré-definidos pelo desenvolvedor.'
      };
    }
    if (userRole === 'ELETRICA') {
      return {
        badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        title: 'Área Técnica: Elétrica & Automação',
        icon: <Zap className="w-4 h-4 text-amber-400" />,
        text: 'Você tem acesso aos itens elétricos desta máquina (ex: motor elétrico, inversor de frequência, sensores e disjuntores) pré-definidos pelo desenvolvedor.'
      };
    }
    return {
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      title: 'Controle de Engenharia: Desenvolvedor',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      text: 'Visualização irrestrita de todos os componentes vinculados e controle de permissões por perfil técnico.'
    };
  };

  const theme = getRoleTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Cog className="w-6 h-6 animate-spin-slow" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                  {machine.tagCode}
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {machine.status || 'OPERACIONAL'}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${theme.badge}`}>
                  {userRole}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mt-1">
                {machine.name}
              </h2>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{machine.sector}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              title="Gerar e Imprimir QR Code da Máquina"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">QR da Máquina</span>
            </button>

            {userRole === 'DESENVOLVEDOR' && onEditMachine && (
              <button
                onClick={() => onEditMachine(machine)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-md shadow-amber-500/15"
                title="Editar Máquina e Vínculo de Itens"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editar Máquina</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Profile Role Notice Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${theme.badge}`}>
            <div className="shrink-0 mt-0.5">
              {theme.icon}
            </div>
            <div className="flex-1 text-xs">
              <strong className="block font-semibold mb-0.5">{theme.title}</strong>
              <p className="leading-relaxed opacity-90">{theme.text}</p>
            </div>
          </div>

          {/* Machine Technical Overview & Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Dimensions Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold mb-1 flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dimensões Técnicas</span>
                </span>
                <p className="text-xs font-mono text-slate-200 leading-relaxed font-semibold">
                  {machine.dimensions || 'Conforme especificação mecânica original.'}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                Identificador: {machine.tagCode}
              </div>
            </div>

            {/* Sector & Line */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Localização na Planta</span>
                </span>
                <p className="text-xs text-slate-200 font-medium">
                  {machine.sector}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                Status: {machine.status || 'OPERACIONAL'}
              </div>
            </div>

            {/* Segregation Status */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Componentes Disponíveis</span>
                </span>
                <div className="text-xs text-slate-200">
                  <span className="text-lg font-bold font-mono text-amber-400">{visibleLinked.length}</span>
                  <span className="text-slate-400 ml-1">itens liberados para você</span>
                </div>
              </div>
              {hiddenCount > 0 && userRole !== 'DESENVOLVEDOR' && (
                <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500">
                  +{hiddenCount} itens restritos à outra equipe
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {machine.description && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Descrição Funcional & Aplicação
              </span>
              {machine.description}
            </div>
          )}

          {/* Linked Components List (Filtered by Role) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Componentes Vinculados à Máquina</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Exibindo {visibleLinked.length} de {machine.linkedComponents.length} itens
              </span>
            </div>

            {visibleLinked.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleLinked.map((link) => {
                  const comp = allComponents.find(c => c.id === link.componentId);
                  if (!comp) return null;

                  return (
                    <div
                      key={link.componentId}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between gap-3 group"
                    >
                      <div>
                        {/* Header of Item Card */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {comp.tagCode}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {comp.category}
                          </span>
                        </div>

                        {/* Component Name */}
                        <h4 
                          onClick={() => onSelectComponent(comp, 'specs')}
                          className="text-xs font-bold text-white group-hover:text-amber-400 transition cursor-pointer line-clamp-2"
                        >
                          {comp.name}
                        </h4>

                        {/* Position on Machine */}
                        {link.positionOrFunction && (
                          <div className="mt-1.5 text-[11px] text-amber-300/90 font-mono bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                            <span className="text-slate-500">Função: </span>
                            {link.positionOrFunction}
                          </div>
                        )}

                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {comp.manufacturer} · {comp.model}
                        </p>

                        {/* Allowed roles badges if developer */}
                        {userRole === 'DESENVOLVEDOR' && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-[10px] text-slate-500 font-mono">Acessível por:</span>
                            {link.allowedRoles.map(r => (
                              <span 
                                key={r}
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                                  r === 'MECANICA' 
                                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                                    : r === 'ELETRICA'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Link to Component Details */}
                      <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {comp.specs?.length || 0} especificações
                        </span>

                        <button
                          type="button"
                          onClick={() => onSelectComponent(comp, 'specs')}
                          className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition cursor-pointer"
                        >
                          <span>Ver Ficha Técnica</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-white mb-1">
                  Nenhum componente liberado para o perfil {userRole} nesta máquina
                </p>
                <p className="text-slate-500 max-w-md mx-auto">
                  O desenvolvedor configurou os itens desta máquina exclusivamente para a outra equipe técnica especializada.
                </p>
              </div>
            )}
          </div>

          {/* Segregation Note for Non-Devs */}
          {hiddenCount > 0 && userRole !== 'DESENVOLVEDOR' && (
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Esta máquina também conta com <strong>{hiddenCount} itens</strong> sob responsabilidade da equipe {userRole === 'MECANICA' ? 'Elétrica (motoredutor, inversor de frequência, sensores)' : 'Mecânica (rolamentos, mancais, correia, rolos)'}.
              </span>
            </div>
          )}

          {/* Delete Machine Button (Developer Only) */}
          {userRole === 'DESENVOLVEDOR' && onDeleteMachine && (
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-400 block">Zona de Exclusão</span>
                <span className="text-[11px] text-slate-500">Remove o cadastro desta máquina (as peças vinculadas permanecem salvas).</span>
              </div>

              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      onDeleteMachine(machine.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-lg transition"
                  >
                    Confirmar Exclusão
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg border border-rose-500/20 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Máquina</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            IFTA · Sistema de Gestão Técnica de Ativos
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* QR Code Modal for Machine */}
      {showQrModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {machine.tagCode}
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                {machine.name}
              </h3>
              <p className="text-xs text-slate-400">{machine.sector}</p>
            </div>

            {/* QR Code rendering */}
            <div className="p-4 bg-white rounded-xl inline-block shadow-inner mx-auto border-2 border-slate-300">
              <svg viewBox="0 0 100 100" className="w-44 h-44">
                <rect width="100" height="100" fill="#ffffff" />
                {/* Top-left locator */}
                <rect x="6" y="6" width="26" height="26" fill="#000000" />
                <rect x="10" y="10" width="18" height="18" fill="#ffffff" />
                <rect x="14" y="14" width="10" height="10" fill="#000000" />
                {/* Top-right locator */}
                <rect x="68" y="6" width="26" height="26" fill="#000000" />
                <rect x="72" y="10" width="18" height="18" fill="#ffffff" />
                <rect x="76" y="14" width="10" height="10" fill="#000000" />
                {/* Bottom-left locator */}
                <rect x="6" y="68" width="26" height="26" fill="#000000" />
                <rect x="10" y="72" width="18" height="18" fill="#ffffff" />
                <rect x="14" y="76" width="10" height="10" fill="#000000" />
                {/* Data modules */}
                <rect x="36" y="8" width="6" height="6" fill="#000000" />
                <rect x="46" y="8" width="6" height="6" fill="#000000" />
                <rect x="56" y="8" width="6" height="6" fill="#000000" />
                <rect x="38" y="20" width="6" height="6" fill="#000000" />
                <rect x="48" y="20" width="6" height="6" fill="#000000" />
                <rect x="58" y="20" width="6" height="6" fill="#000000" />
                <rect x="8" y="38" width="6" height="6" fill="#000000" />
                <rect x="18" y="38" width="6" height="6" fill="#000000" />
                <rect x="38" y="38" width="8" height="8" fill="#000000" />
                <rect x="50" y="38" width="6" height="6" fill="#000000" />
                <rect x="68" y="38" width="6" height="6" fill="#000000" />
                <rect x="80" y="38" width="6" height="6" fill="#000000" />
                <rect x="38" y="52" width="6" height="6" fill="#000000" />
                <rect x="48" y="52" width="8" height="8" fill="#000000" />
                <rect x="60" y="52" width="6" height="6" fill="#000000" />
                <rect x="74" y="52" width="6" height="6" fill="#000000" />
                <rect x="38" y="68" width="6" height="6" fill="#000000" />
                <rect x="48" y="68" width="6" height="6" fill="#000000" />
                <rect x="60" y="68" width="6" height="6" fill="#000000" />
                <rect x="74" y="68" width="6" height="6" fill="#000000" />
                <rect x="84" y="68" width="6" height="6" fill="#000000" />
                <rect x="38" y="80" width="6" height="6" fill="#000000" />
                <rect x="52" y="80" width="6" height="6" fill="#000000" />
                <rect x="64" y="80" width="8" height="8" fill="#000000" />
                <rect x="80" y="80" width="6" height="6" fill="#000000" />
              </svg>
            </div>

            <p className="text-[11px] text-slate-400">
              Aponte o leitor de QR Code para acessar imediatamente esta máquina e seus componentes de acordo com o seu perfil.
            </p>

            <button
              onClick={() => window.print()}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition shadow-md"
            >
              Imprimir Etiqueta da Máquina
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
