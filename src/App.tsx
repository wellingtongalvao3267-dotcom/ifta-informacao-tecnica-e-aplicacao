import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Filter, 
  Wrench, 
  Zap, 
  Shield, 
  Info, 
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
  QrCode,
  Cog,
  LayoutGrid
} from 'lucide-react';
import { ComponentItem, UserAccount, UserRole, MachineItem } from './types';
import { storageService } from './services/storageService';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { ComponentCard } from './components/ComponentCard';
import { ComponentDetailModal } from './components/ComponentDetailModal';
import { QrScannerModal, matchComponentFromQr, matchMachineFromQr } from './components/QrScannerModal';
import { AdminPanel } from './components/AdminPanel';
import { ComponentFormModal } from './components/ComponentFormModal';
import { EditProfileModal } from './components/EditProfileModal';
import { MachineCard } from './components/MachineCard';
import { MachineDetailModal } from './components/MachineDetailModal';
import { MachineFormModal } from './components/MachineFormModal';
import { OfflineManagerModal } from './components/OfflineManagerModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Splash and Auth State
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // App Data State
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [sortBy, setSortBy] = useState<'name' | 'tag' | 'recent'>('recent');
  const [activeViewSection, setActiveViewSection] = useState<'all' | 'machines' | 'components'>('all');

  // Modals
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineItem | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isMachineFormOpen, setIsMachineFormOpen] = useState(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentItem | null>(null);
  const [editingMachine, setEditingMachine] = useState<MachineItem | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState<'specs' | 'diagram' | 'maintenance' | 'failures' | 'manual' | 'qr'>('specs');

  // Initialize service on mount
  useEffect(() => {
    storageService.init();
    const existingUser = storageService.getCurrentUser();
    if (existingUser) {
      setCurrentUser(existingUser);
    }
  }, []);

  // Reload visible components and machines whenever user or permissions change
  const refreshComponents = () => {
    if (!currentUser) return;
    const visible = storageService.getVisibleComponentsForRole(currentUser.role);
    setComponents(visible);
    const allMachines = storageService.getMachines();
    setMachines(allMachines);
  };

  useEffect(() => {
    if (currentUser) {
      refreshComponents();
    }
  }, [currentUser]);

  // Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    const visible = storageService.getVisibleComponentsForRole(user.role);
    setComponents(visible);
    const allMachines = storageService.getMachines();
    setMachines(allMachines);
  };

  const handleLogout = () => {
    if (currentUser) {
      storageService.addLog(
        currentUser.username,
        currentUser.role,
        'Encerramento de Sessão',
        'Usuário desconectado do sistema.'
      );
    }
    storageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleSelectComponent = (comp: ComponentItem, initialTab: 'specs' | 'diagram' | 'maintenance' | 'failures' | 'manual' | 'qr' = 'specs') => {
    setSelectedComponent(comp);
    setDetailInitialTab(initialTab);
    if (currentUser) {
      storageService.addLog(
        currentUser.username,
        currentUser.role,
        `Consulta de Peça: ${comp.tagCode}`,
        `Abertura da ficha técnica de ${comp.name}`
      );
    }
  };

  const handleSelectMachine = (maq: MachineItem) => {
    setSelectedMachine(maq);
    if (currentUser) {
      storageService.addLog(
        currentUser.username,
        currentUser.role,
        `Consulta de Máquina: ${maq.tagCode}`,
        `Abertura da ficha de máquina ${maq.name} (Perfil: ${currentUser.role})`
      );
    }
  };

  const handleOpenQrScanner = () => {
    setIsQrScannerOpen(true);
    if (currentUser) {
      storageService.addLog(
        currentUser.username,
        currentUser.role,
        'Acesso ao Scanner QR',
        'Abertura do módulo de leitura por câmera/etiqueta.'
      );
    }
  };

  const handleScanMatch = (tagCode: string) => {
    setIsQrScannerOpen(false);
    // 1. Busca em máquinas da fábrica
    const allMaqs = storageService.getMachines();
    const maqMatch = matchMachineFromQr(tagCode, allMaqs.length > 0 ? allMaqs : machines);
    if (maqMatch) {
      handleSelectMachine(maqMatch);
      return;
    }

    // 2. Busca prioritária em todo o catálogo da fábrica para garantir acesso imediato às especificações
    const all = storageService.getComponents();
    const match = matchComponentFromQr(tagCode, all.length > 0 ? all : components);
    if (match) {
      handleSelectComponent(match, 'specs');
      if (currentUser) {
        storageService.addLog(
          currentUser.username,
          currentUser.role,
          `Leitura QR Bem-sucedida: ${match.tagCode}`,
          `Especificações técnicas de ${match.name} abertas para consulta.`
        );
      }
      return;
    }

    // 3. Fallback secundário na lista filtrada atual
    const fallbackMatch = matchComponentFromQr(tagCode, components);
    if (fallbackMatch) {
      handleSelectComponent(fallbackMatch, 'specs');
    }
  };

  const handleSaveComponent = (item: ComponentItem) => {
    storageService.saveComponent(item);
    refreshComponents();
    setIsFormModalOpen(false);
    setEditingComponent(null);
    if (currentUser) {
      storageService.addLog(
        currentUser.username,
        currentUser.role,
        `Edição/Cadastro de Peça: ${item.tagCode}`,
        `Registro atualizado no banco de dados.`
      );
    }
  };

  const handleDeleteComponent = (id: string) => {
    const comp = components.find(c => c.id === id);
    storageService.deleteComponent(id);
    refreshComponents();
    if (selectedComponent?.id === id) {
      setSelectedComponent(null);
    }
    if (currentUser && comp) {
      storageService.addLog(
        currentUser.username,
        currentUser.role,
        `Exclusão de Peça: ${comp.tagCode}`,
        `Componente removido do catálogo.`
      );
    }
  };

  const handleSaveMachine = (machine: MachineItem) => {
    storageService.saveMachine(machine);
    refreshComponents();
    setIsMachineFormOpen(false);
    setEditingMachine(null);
    if (currentUser) {
      storageService.addLog(
        currentUser.username,
        currentUser.role,
        `Cadastro/Edição de Máquina: ${machine.tagCode}`,
        `Máquina ${machine.name} salva no cadastro de ativos.`
      );
    }
  };

  const handleDeleteMachine = (id: string) => {
    const maq = machines.find(m => m.id === id);
    storageService.deleteMachine(id);
    refreshComponents();
    if (selectedMachine?.id === id) {
      setSelectedMachine(null);
    }
    if (currentUser && maq) {
      storageService.addLog(
        currentUser.username,
        currentUser.role,
        `Exclusão de Máquina: ${maq.tagCode}`,
        `Máquina ${maq.name} removida da planta.`
      );
    }
  };

  // If splash is showing, render Splash Screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // If not logged in, render Login Screen
  if (!currentUser) {
    return (
      <LoginScreen 
        onLoginSuccess={handleLoginSuccess}
        onShowSplashAgain={() => setShowSplash(true)}
      />
    );
  }

  // Categories list extracted from current available components
  const availableCategories = Array.from(new Set(components.map(c => c.category))).filter(Boolean);

  // Filtering & Sorting
  const filteredMachines = machines.filter(m => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.tagCode.toLowerCase().includes(query) ||
      m.sector.toLowerCase().includes(query) ||
      m.description.toLowerCase().includes(query) ||
      (m.dimensions && m.dimensions.toLowerCase().includes(query))
    );
  });

  const filteredComponents = components.filter(comp => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || (
      comp.name.toLowerCase().includes(query) ||
      comp.tagCode.toLowerCase().includes(query) ||
      comp.model.toLowerCase().includes(query) ||
      comp.manufacturer.toLowerCase().includes(query) ||
      comp.application.toLowerCase().includes(query) ||
      comp.category.toLowerCase().includes(query) ||
      (comp.specs && comp.specs.some(s => s.label.toLowerCase().includes(query) || s.value.toLowerCase().includes(query)))
    );

    const matchesCategory = selectedCategory === 'TODAS' || comp.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'tag') return a.tagCode.localeCompare(b.tagCode);
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
  });

  const isCdi = currentUser.role === 'CDI' || currentUser.role === 'DESENVOLVEDOR';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
      
      {/* Top Navbar with Lupa and Top-Right QR Code Scanner */}
      <Navbar
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenQrScanner={handleOpenQrScanner}
        onOpenAdminPanel={isCdi ? () => setIsAdminPanelOpen(true) : undefined}
        onOpenEditProfile={isCdi ? () => setIsEditProfileOpen(true) : undefined}
        onOpenOfflineManager={() => setIsOfflineModalOpen(true)}
        onLogout={handleLogout}
        isAdminOpen={isAdminPanelOpen}
      />

      {/* Offline Status Badge / Alert Bar */}
      <OfflineIndicator onOpenManager={() => setIsOfflineModalOpen(true)} />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Profile Status Banner */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {isCdi && <Shield className="w-5 h-5" />}
              {(currentUser.role === 'MECANICA' || currentUser.role === 'MANUTENCAO') && <Wrench className="w-5 h-5" />}
              {currentUser.role === 'ELETRICA' && <Zap className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">
                  Banco de Dados Técnico — {currentUser.displayName}
                </span>
                <span className="text-xs font-mono text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {currentUser.role}
                </span>
                {isCdi && (
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 ml-1 cursor-pointer font-medium"
                  >
                    Alterar nome do perfil
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isCdi
                  ? 'Acesso CDI (Público com Senha): Cadastre e vincule máquinas, defina permissões de peças e gerencie o banco de dados técnico. Seus itens permanecem salvos permanentemente.'
                  : currentUser.role === 'MECANICA'
                  ? 'Acesso Mecânico: Ao pesquisar máquinas na lupa ou navegar abaixo, você tem acesso às peças mecânicas pré-definidas (rolamentos, mancais, correia, rolos).'
                  : 'Acesso Elétrico: Ao pesquisar máquinas na lupa ou navegar abaixo, você tem acesso às peças elétricas e automação pré-definidas (motores, inversores, sensores).'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {isCdi && (
              <>
                {/* Opção solicitada pelo usuário: CADASTRA MAQUINA */}
                <button
                  onClick={() => {
                    setEditingMachine(null);
                    setIsMachineFormOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-md shadow-amber-500/20 cursor-pointer"
                  title="Cadastrar nova máquina e vincular peças com permissões de perfil"
                >
                  <Cog className="w-4 h-4 animate-spin-slow" />
                  <span>Cadastrar Máquina</span>
                </button>

                <button
                  onClick={() => {
                    setEditingComponent(null);
                    setIsFormModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Peça / Componente</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* View Switcher: Todos vs Máquinas vs Peças */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveViewSection('all')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeViewSection === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Todos os Ativos ({filteredMachines.length + filteredComponents.length})</span>
          </button>

          <button
            onClick={() => setActiveViewSection('machines')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeViewSection === 'machines'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cog className="w-3.5 h-3.5" />
            <span>Máquinas & Equipamentos ({filteredMachines.length})</span>
          </button>

          <button
            onClick={() => setActiveViewSection('components')}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 ${
              activeViewSection === 'components'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Peças & Componentes ({filteredComponents.length})</span>
          </button>
        </div>

        {/* SECTION 1: Máquinas & Equipamentos (ex: Esteira Transportadora 01) */}
        {(activeViewSection === 'all' || activeViewSection === 'machines') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <Cog className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Máquinas & Linhas de Produção
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Acesso conjunto para Mecânica e Elétrica, com itens divididos por perfil técnico
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  {filteredMachines.length} máquina(s)
                </span>
                {isCdi && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMachine(null);
                      setIsMachineFormOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-md shadow-amber-500/20 cursor-pointer"
                    title="Cadastrar nova máquina e vincular peças"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar Máquina</span>
                  </button>
                )}
              </div>
            </div>

            {filteredMachines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMachines.map(machine => (
                  <MachineCard
                    key={machine.id}
                    machine={machine}
                    allComponents={storageService.getComponents()}
                    userRole={currentUser.role}
                    onSelect={handleSelectMachine}
                    onOpenQr={(m) => {
                      setSelectedMachine(m);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-3">
                <p>Nenhuma máquina corresponde aos critérios de pesquisa.</p>
                {isCdi && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMachine(null);
                      setIsMachineFormOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Máquina</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: Peças & Componentes Individuais */}
        {(activeViewSection === 'all' || activeViewSection === 'components') && (
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            {/* Filter Toolbar & Category Segmented Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
              
              {/* Categories Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedCategory('TODAS')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === 'TODAS'
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Todas as Peças ({components.length})
                </button>

                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {cat} ({components.filter(c => c.category === cat).length})
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2 text-xs text-slate-400 self-end md:self-auto shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>Ordenar:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="tag">Código / Tag (A-Z)</option>
                  <option value="name">Nome da Peça (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <div className="flex items-center gap-2">
                <span>Exibindo <strong className="text-slate-200 font-mono tabular-nums">{filteredComponents.length}</strong> de <strong className="text-slate-200 font-mono tabular-nums">{components.length}</strong> componentes</span>
                {searchQuery && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Filtro de busca: "{searchQuery}"</span>
                  </>
                )}
              </div>
            </div>

            {/* Component Grid */}
            {filteredComponents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredComponents.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    onSelect={(comp) => handleSelectComponent(comp, 'specs')}
                    onOpenQr={(comp) => handleSelectComponent(comp, 'qr')}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center max-w-md mx-auto">
                <Info className="w-12 h-12 text-slate-600 mb-3" />
                <h3 className="text-base font-semibold text-white mb-1">
                  Nenhum componente encontrado
                </h3>
                <p className="text-xs text-slate-400 mb-4 text-center">
                  {searchQuery
                    ? `Nenhum resultado corresponde à busca por "${searchQuery}" nesta categoria.`
                    : 'Não há peças cadastradas para este filtro ou liberadas para o seu perfil.'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                  >
                    Limpar Pesquisa
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400">IFTA</span>
          <span>· Informações Técnicas e Aplicação</span>
          <span aria-hidden="true">·</span>
          <span>Desenvolvido por <strong>Wellington Galvão</strong></span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <button 
            onClick={() => setShowSplash(true)}
            className="hover:text-amber-400 transition"
          >
            Apresentação & Logo
          </button>
          <span aria-hidden="true">·</span>
          <span>Engenharia & Manutenção 2026</span>
        </div>
      </footer>

      {/* Floating Action Button (FAB) para Escanear QR Code em Dispositivos Móveis */}
      <div className="fixed bottom-5 right-5 z-40 sm:hidden">
        <button
          type="button"
          onClick={handleOpenQrScanner}
          className="flex items-center gap-2 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-full shadow-2xl shadow-amber-500/30 active:scale-95 transition-all border-2 border-slate-950 cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>Escanear QR</span>
        </button>
      </div>

      {/* Machine Detail Modal */}
      {selectedMachine && (
        <MachineDetailModal
          machine={selectedMachine}
          onClose={() => setSelectedMachine(null)}
          allComponents={storageService.getComponents()}
          userRole={currentUser.role}
          onSelectComponent={(comp, initialTab) => {
            handleSelectComponent(comp, initialTab || 'specs');
          }}
          onEditMachine={isCdi ? (maq) => {
            setSelectedMachine(null);
            setEditingMachine(maq);
            setIsMachineFormOpen(true);
          } : undefined}
          onDeleteMachine={isCdi ? handleDeleteMachine : undefined}
        />
      )}

      {/* CDI Machine Form Modal (Create / Edit) */}
      {isMachineFormOpen && isCdi && (
        <MachineFormModal
          isOpen={isMachineFormOpen}
          onClose={() => {
            setIsMachineFormOpen(false);
            setEditingMachine(null);
          }}
          onSave={handleSaveMachine}
          initialMachine={editingMachine}
          allComponents={storageService.getComponents()}
        />
      )}

      {/* Component Detail Modal */}
      <ComponentDetailModal
        component={selectedComponent}
        onClose={() => setSelectedComponent(null)}
        onEdit={(comp) => {
          setSelectedComponent(null);
          setEditingComponent(comp);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteComponent}
        userRole={currentUser.role}
        initialTab={detailInitialTab}
      />

      {/* QR Scanner Modal (Canto Superior Direito / Top Right Scanner) */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanMatch={handleScanMatch}
        onScanMatchMachine={handleSelectMachine}
        components={components}
        allComponents={storageService.getComponents()}
        machines={machines}
        currentUserRole={currentUser.role}
        onAddNewWithCode={(code) => {
          setIsQrScannerOpen(false);
          setEditingComponent({
            id: '',
            tagCode: code.toUpperCase().replace(/\s+/g, '-'),
            name: '',
            category: 'Mecânica',
            manufacturer: '',
            model: '',
            application: '',
            description: '',
            imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
            qrCodeData: code,
            specs: [
              { label: 'Tensão', value: '220/380 V' },
              { label: 'Potência', value: '7.5 kW' }
            ],
            maintenanceGuide: [
              { step: 1, title: 'Inspeção Visual', instruction: 'Verificar alinhamento e fixação.', torqueOrMeasure: 'Visual' }
            ],
            commonFailures: [
              { symptom: 'Ruído anormal', probableCause: 'Falta de lubrificação', correctiveAction: 'Aplicar lubrificante' }
            ],
            manualFileName: 'manual_tecnico.pdf',
            manualSummary: 'Manual de operação e manutenção técnica.',
            maintenanceIntervalHours: 4000,
            visibleToRoles: ['CDI', 'MECANICA', 'ELETRICA'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          setIsFormModalOpen(true);
        }}
      />

      {/* CDI Admin Panel */}
      {isCdi && (
        <AdminPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          components={storageService.getComponents()}
          onAddNewComponent={() => {
            setIsAdminPanelOpen(false);
            setEditingComponent(null);
            setIsFormModalOpen(true);
          }}
          onEditComponent={(comp) => {
            setIsAdminPanelOpen(false);
            setEditingComponent(comp);
            setIsFormModalOpen(true);
          }}
          onDeleteComponent={handleDeleteComponent}
          onDataRefresh={refreshComponents}
        />
      )}

      {/* CDI Component Form Modal (Create / Edit) */}
      {isFormModalOpen && (
        <ComponentFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingComponent(null);
          }}
          onSave={handleSaveComponent}
          initialComponent={editingComponent}
        />
      )}

      {/* Edit Profile Modal (Accessible by CDI) */}
      {isEditProfileOpen && currentUser && isCdi && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={currentUser}
          onProfileUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            refreshComponents();
          }}
        />
      )}

      {/* Offline Management Modal (Download database & PWA offline cache) */}
      <OfflineManagerModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
        onDataRestored={() => {
          refreshComponents();
        }}
      />
    </div>
  );
}
