import React from 'react';
import { Search, QrCode, LogOut, Settings, X, Shield, Wrench, Zap, UserCheck, Edit2 } from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  currentUser: UserAccount;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenQrScanner: () => void;
  onOpenAdminPanel?: () => void;
  onOpenEditProfile?: () => void;
  onLogout: () => void;
  isAdminOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onOpenQrScanner,
  onOpenAdminPanel,
  onOpenEditProfile,
  onLogout,
  isAdminOpen
}) => {
  const getRoleIcon = () => {
    switch (currentUser.role) {
      case 'DESENVOLVEDOR':
        return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      case 'MECANICA':
      case 'MANUTENCAO':
        return <Wrench className="w-3.5 h-3.5 text-amber-400" />;
      case 'ELETRICA':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:gap-6">
        
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center shadow-sm">
            <img
              src="/assets/aistudio/logo_afta_c1e6655b.jpeg"
              alt="IFTA"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-bold tracking-tight text-white whitespace-nowrap">
              IFTA
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Informações Técnicas & Aplicação
            </span>
          </div>
        </div>

        {/* Search Bar Zone (Lupa no topo do app para pesquisas) */}
        <div className="flex-1 max-w-xl relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Pesquisar código (ex: MOT-IND), nome, fabricante, categoria ou máquina..."
            className="w-full pl-9 pr-8 py-1.5 md:py-2 bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-xs md:text-sm text-slate-100 placeholder-slate-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Actions: QR Code Scanner + Developer Tools + User Profile */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Canto superior direito: Opção para escanear QR Code */}
          <button
            type="button"
            onClick={onOpenQrScanner}
            title="Escanear QR Code da Peça"
            className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3.5 md:py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.97] rounded-lg transition shadow-md shadow-amber-500/20 whitespace-nowrap cursor-pointer ring-1 ring-amber-300/50"
          >
            <QrCode className="w-4 h-4 shrink-0" />
            <span className="inline font-bold">Escanear QR</span>
          </button>

          {/* Admin Panel Toggle (for DESENVOLVEDOR only) */}
          {currentUser.role === 'DESENVOLVEDOR' && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 md:py-2 text-xs font-medium rounded-lg border transition whitespace-nowrap ${
                isAdminOpen
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Painel do Desenvolvedor</span>
            </button>
          )}

          {/* User Profile Badge (Clickable to Edit Profile Name ONLY for DESENVOLVEDOR) */}
          {currentUser.role === 'DESENVOLVEDOR' && onOpenEditProfile ? (
            <button
              onClick={onOpenEditProfile}
              title="Clique para alterar dados do perfil (Exclusivo Desenvolvedor)"
              className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-xs text-slate-300 font-mono transition"
            >
              {getRoleIcon()}
              <span className="font-semibold text-slate-200 max-w-[120px] sm:max-w-[180px] truncate">
                {currentUser.displayName || currentUser.username}
              </span>
              <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition ml-0.5" />
            </button>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono">
              {getRoleIcon()}
              <span className="font-semibold text-slate-200 max-w-[120px] sm:max-w-[180px] truncate">
                {currentUser.displayName || currentUser.username}
              </span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Sair do Sistema"
            className="p-1.5 md:p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
