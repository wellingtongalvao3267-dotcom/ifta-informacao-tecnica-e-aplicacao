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
  QrCode
} from 'lucide-react';
import { ComponentItem, UserAccount, UserRole } from './types';
import { storageService } from './services/storageService';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { ComponentCard } from './components/ComponentCard';
import { ComponentDetailModal } from './components/ComponentDetailModal';
import { QrScannerModal, matchComponentFromQr } from './components/QrScannerModal';
import { AdminPanel } from './components/AdminPanel';
import { ComponentFormModal } from './components/ComponentFormModal';
import { EditProfileModal } from './components/EditProfileModal';

export default function App() {
  // Splash and Auth State
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // App Data State
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [sortBy, setSortBy] = useState<'name' | 'tag' | 'recent'>('recent');

  // Modals
  const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentItem | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState<'specs' | 'diagram' | 'maintenance' | 'failures' | 'manual' | 'qr'>('specs');

  // Initialize service on mount
  useEffect(() => {
    storageService.init();
    const existingUser = storageService.getCurrentUser();
    if (existingUser) {
      setCurrentUser(existingUser);
    }
  }, []);

  // Reload visible components whenever user or permissions change
  const refreshComponents = () => {
    if (!currentUser) return;
    const visible = storageService.getVisibleComponentsForRole(currentUser.role);
    setComponents(visible);
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
    // Busca prioritária em todo o catálogo da fábrica para garantir acesso imediato às especificações
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

    // Fallback secundário na lista filtrada atual
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
      
      {/* Top Navbar with Lupa and Top-Right QR Code Scanner */}
      <Navbar
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenQrScanner={handleOpenQrScanner}
        onOpenAdminPanel={currentUser.role === 'DESENVOLVEDOR' ? () => setIsAdminPanelOpen(true) : undefined}
        onOpenEditProfile={currentUser.role === 'DESENVOLVEDOR' ? () => setIsEditProfileOpen(true) : undefined}
        onLogout={handleLogout}
        isAdminOpen={isAdminPanelOpen}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Profile Status Banner */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {currentUser.role === 'DESENVOLVEDOR' && <Shield className="w-5 h-5" />}
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
                {currentUser.role === 'DESENVOLVEDOR' && (
                  <button
                    onClick={() => setIsEditProfileOpen(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 ml-1 cursor-pointer font-medium"
                  >
                    Alterar nome do perfil
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser.role === 'DESENVOLVEDOR'
                  ? 'Acesso irrestrito a todas as áreas, edição de esquemas, gerenciamento de usuários e logs de acesso.'
                  : `Acesso para consulta rápida das informações e diagramas pré-selecionados pelo desenvolvedor.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {currentUser.role === 'DESENVOLVEDOR' && (
              <>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
                >
                  Editar Perfil
                </button>

                <button
                  onClick={() => {
                    setEditingComponent(null);
                    setIsFormModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg transition shadow-md shadow-amber-500/15"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Peça / Componente</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter Toolbar & Category Segmented Controls (Rule 1A Interactive Filter Controls) */}
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
              Todas as Categorias ({components.length})
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

        {/* Results Info (Rule 1A Zero-Pill text metadata) */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <div className="flex items-center gap-2">
            <span>Exibindo <strong className="text-slate-200 font-mono tabular-nums">{filteredComponents.length}</strong> de <strong className="text-slate-200 font-mono tabular-nums">{components.length}</strong> componentes</span>
            {searchQuery && (
              <>
                <span aria-hidden="true">·</span>
                <span>Filtro: "{searchQuery}"</span>
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

      {/* Detail Modal */}
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
        components={components}
        allComponents={storageService.getComponents()}
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
            visibleToRoles: ['DESENVOLVEDOR', 'MECANICA', 'ELETRICA'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          setIsFormModalOpen(true);
        }}
      />

      {/* Developer Admin Panel */}
      {currentUser.role === 'DESENVOLVEDOR' && (
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

      {/* Developer Component Form Modal (Create / Edit) */}
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

      {/* Edit Profile Modal (Accessible only by DESENVOLVEDOR) */}
      {isEditProfileOpen && currentUser && currentUser.role === 'DESENVOLVEDOR' && (
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
    </div>
  );
}
