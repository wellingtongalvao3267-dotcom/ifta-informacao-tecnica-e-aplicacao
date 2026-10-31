import { ComponentItem, UserAccount, AccessLog, CategoryAccessRule, UserRole, MachineItem } from '../types';
import { INITIAL_USERS, INITIAL_COMPONENTS, INITIAL_CATEGORY_PERMISSIONS, INITIAL_LOGS, INITIAL_MACHINES } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'ifta_users_v2',
  COMPONENTS: 'ifta_components_v2',
  MACHINES: 'ifta_machines_v2',
  CATEGORY_PERMISSIONS: 'ifta_cat_perms_v2',
  LOGS: 'ifta_access_logs_v2',
  CURRENT_USER: 'ifta_active_session_v2',
  HAS_SEEN_SPLASH: 'ifta_seen_splash_v2'
};

export const storageService = {
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    } else {
      try {
        const users: UserAccount[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        let changed = false;
        users.forEach(u => {
          if (u.username === 'MANUTENCAO' || (u.role as string) === 'MANUTENCAO') {
            u.username = 'MECANICA';
            u.role = 'MECANICA';
            if (u.displayName === 'Equipe de Manutenção Geral') {
              u.displayName = 'Equipe Técnica Mecânica';
            }
            changed = true;
          }
          if (u.username === 'CDI' || (u.role as string) === 'CDI' || u.username === 'DESENVOLVEDOR' || (u.role as string) === 'DESENVOLVEDOR') {
            u.username = 'CDI';
            u.role = 'CDI';
            u.displayName = 'CDI (Centro de Documentação Industrial)';
            u.passwordHash = 'wlt@1616';
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
      } catch {}
    }

    if (!localStorage.getItem(STORAGE_KEYS.COMPONENTS)) {
      localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(INITIAL_COMPONENTS));
    } else {
      try {
        const comps: ComponentItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPONENTS) || '[]');
        let changed = false;
        comps.forEach(c => {
          if (c.visibleToRoles && (c.visibleToRoles as string[]).includes('MANUTENCAO')) {
            c.visibleToRoles = c.visibleToRoles.map(r => ((r as string) === 'MANUTENCAO' ? 'MECANICA' : r));
            changed = true;
          }
          if (c.visibleToRoles && (c.visibleToRoles as string[]).includes('DESENVOLVEDOR')) {
            c.visibleToRoles = c.visibleToRoles.map(r => ((r as string) === 'DESENVOLVEDOR' ? 'CDI' : r));
            changed = true;
          }
          // Sanitizar caminhos antigos /src/assets/images/ para /assets/images/
          if (c.imageUrl && c.imageUrl.startsWith('/src/assets/images/')) {
            c.imageUrl = c.imageUrl.replace('/src/assets/images/', '/assets/images/');
            changed = true;
          }
          // Atualizar imagens vazias com as imagens oficiais do INITIAL_COMPONENTS
          const matchInit = INITIAL_COMPONENTS.find(ic => ic.id === c.id || ic.tagCode === c.tagCode);
          if (matchInit && (!c.imageUrl || c.imageUrl === '')) {
            c.imageUrl = matchInit.imageUrl;
            changed = true;
          }
          // Garantir que o payload de QR Code seja sempre válido, único e persistido
          const tagUpper = (c.tagCode || '').trim().toUpperCase();
          if (!c.qrCodeData || !c.qrCodeData.startsWith('IFTA:')) {
            c.qrCodeData = `IFTA:${tagUpper}`;
            changed = true;
          }
        });
        // Garantir que os novos componentes da esteira (comp-008, comp-009, comp-010) estejam presentes
        INITIAL_COMPONENTS.forEach(initComp => {
          if (!comps.some(c => c.id === initComp.id || c.tagCode === initComp.tagCode)) {
            comps.push(initComp);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(comps));
        }
      } catch {}
    }

    // Inicialização de Máquinas e Equipamentos
    if (!localStorage.getItem(STORAGE_KEYS.MACHINES)) {
      localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
    } else {
      try {
        const storedMachines: MachineItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MACHINES) || '[]');
        let changed = false;
        INITIAL_MACHINES.forEach(initMaq => {
          if (!storedMachines.some(m => m.id === initMaq.id || m.tagCode === initMaq.tagCode)) {
            storedMachines.push(initMaq);
            changed = true;
          }
        });
        // Garantir payload de QR Code válido e persistente para cada máquina e migrar permissões
        storedMachines.forEach(m => {
          const maqTagUpper = (m.tagCode || '').trim().toUpperCase();
          if (!m.qrCodeData || !m.qrCodeData.startsWith('IFTA:')) {
            m.qrCodeData = `IFTA:${maqTagUpper}`;
            changed = true;
          }
          if (!m.linkedComponents) {
            m.linkedComponents = [];
            changed = true;
          } else {
            m.linkedComponents.forEach(link => {
              if (!link.allowedRoles || link.allowedRoles.length === 0) {
                link.allowedRoles = ['CDI', 'MECANICA', 'ELETRICA'];
                changed = true;
              } else {
                if ((link.allowedRoles as string[]).includes('DESENVOLVEDOR')) {
                  link.allowedRoles = link.allowedRoles.map(r => ((r as string) === 'DESENVOLVEDOR' ? 'CDI' : r));
                  changed = true;
                }
                if ((link.allowedRoles as string[]).includes('MANUTENCAO')) {
                  link.allowedRoles = link.allowedRoles.map(r => ((r as string) === 'MANUTENCAO' ? 'MECANICA' : r));
                  changed = true;
                }
                // Garantir que CDI esteja sempre presente
                if (!link.allowedRoles.includes('CDI')) {
                  link.allowedRoles.push('CDI');
                  changed = true;
                }
              }
            });
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(storedMachines));
        }
      } catch {}
    }

    if (!localStorage.getItem(STORAGE_KEYS.CATEGORY_PERMISSIONS)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORY_PERMISSIONS, JSON.stringify(INITIAL_CATEGORY_PERMISSIONS));
    } else {
      try {
        const perms: CategoryAccessRule[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORY_PERMISSIONS) || '[]');
        let changed = false;
        perms.forEach(p => {
          if (p.allowedRoles && (p.allowedRoles as string[]).includes('MANUTENCAO')) {
            p.allowedRoles = p.allowedRoles.map(r => ((r as string) === 'MANUTENCAO' ? 'MECANICA' : r));
            changed = true;
          }
          if (p.allowedRoles && (p.allowedRoles as string[]).includes('DESENVOLVEDOR')) {
            p.allowedRoles = p.allowedRoles.map(r => ((r as string) === 'DESENVOLVEDOR' ? 'CDI' : r));
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.CATEGORY_PERMISSIONS, JSON.stringify(perms));
        }
      } catch {}
    }

    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    }

    const current = this.getCurrentUser();
    if (current && (current.username === 'MANUTENCAO' || (current.role as string) === 'MANUTENCAO')) {
      current.username = 'MECANICA';
      current.role = 'MECANICA';
      if (current.displayName === 'Equipe de Manutenção Geral') {
        current.displayName = 'Equipe Técnica Mecânica';
      }
      this.setCurrentUser(current);
    }
    if (current && (current.username === 'CDI' || (current.role as string) === 'CDI' || current.username === 'DESENVOLVEDOR' || (current.role as string) === 'DESENVOLVEDOR')) {
      current.username = 'CDI';
      current.role = 'CDI';
      current.displayName = 'CDI (Centro de Documentação Industrial)';
      current.passwordHash = 'wlt@1616';
      this.setCurrentUser(current);
    }

    // Sincronizar automaticamente com o servidor backend/Docker persistente
    this.syncWithServer().catch(() => {});
    
    // Iniciar canal em tempo real para sincronização instantânea entre múltiplos usuários
    this.initRealtime();
  },

  initRealtime() {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      if (typeof EventSource === 'undefined') return;
      try {
        if (eventSource) {
          try { eventSource.close(); } catch {}
        }

        eventSource = new EventSource('/api/realtime');

        eventSource.onopen = () => {
          window.dispatchEvent(new CustomEvent('ifta_realtime_status', { detail: { connected: true } }));
        };

        eventSource.onmessage = (e) => {
          try {
            const event = JSON.parse(e.data);
            if (!event || !event.type) return;

            // Snapshot recebido ao conectar imediatamente
            if (event.type === 'CONNECTED' && event.data) {
              let updated = false;
              if (Array.isArray(event.data.components) && event.data.components.length > 0) {
                localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(event.data.components));
                updated = true;
              }
              if (Array.isArray(event.data.machines) && event.data.machines.length > 0) {
                localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(event.data.machines));
                updated = true;
              }
              if (updated) {
                window.dispatchEvent(new CustomEvent('ifta_data_synced'));
              }
            } else if (event.type === 'COMPONENT_SAVED' && event.data) {
              const comp: ComponentItem = event.data;
              const items = this.getComponents();
              const idx = items.findIndex(c => c.id === comp.id || c.tagCode.toUpperCase() === comp.tagCode.toUpperCase());
              if (idx >= 0) {
                items[idx] = comp;
              } else {
                items.unshift(comp);
              }
              localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(items));
              window.dispatchEvent(new CustomEvent('ifta_realtime_notification', {
                detail: {
                  type: 'component',
                  action: idx >= 0 ? 'edit' : 'create',
                  item: comp,
                  message: `Peça "${comp.name}" (${comp.tagCode}) atualizada no catálogo!`
                }
              }));
              window.dispatchEvent(new CustomEvent('ifta_data_synced'));
            } else if (event.type === 'COMPONENT_DELETED' && event.data) {
              const { id } = event.data;
              const items = this.getComponents().filter(c => c.id !== id && c.tagCode !== id);
              localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(items));
              window.dispatchEvent(new CustomEvent('ifta_realtime_notification', {
                detail: {
                  type: 'component',
                  action: 'delete',
                  id,
                  message: `Uma peça foi removida do catálogo.`
                }
              }));
              window.dispatchEvent(new CustomEvent('ifta_data_synced'));
            } else if (event.type === 'MACHINE_SAVED' && event.data) {
              const machine: MachineItem = event.data;
              const machines = this.getMachines();
              const idx = machines.findIndex(m => m.id === machine.id || m.tagCode.toUpperCase() === machine.tagCode.toUpperCase());
              if (idx >= 0) {
                machines[idx] = machine;
              } else {
                machines.unshift(machine);
              }
              localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
              window.dispatchEvent(new CustomEvent('ifta_realtime_notification', {
                detail: {
                  type: 'machine',
                  action: idx >= 0 ? 'edit' : 'create',
                  item: machine,
                  message: `Máquina "${machine.name}" (${machine.tagCode}) atualizada no catálogo!`
                }
              }));
              window.dispatchEvent(new CustomEvent('ifta_data_synced'));
            } else if (event.type === 'MACHINE_DELETED' && event.data) {
              const { id } = event.data;
              const machines = this.getMachines().filter(m => m.id !== id && m.tagCode !== id);
              localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
              window.dispatchEvent(new CustomEvent('ifta_realtime_notification', {
                detail: {
                  type: 'machine',
                  action: 'delete',
                  id,
                  message: `Uma máquina foi excluída do sistema.`
                }
              }));
              window.dispatchEvent(new CustomEvent('ifta_data_synced'));
            } else if (event.type === 'DATABASE_UPDATED' && event.data) {
              if (Array.isArray(event.data.components)) {
                localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(event.data.components));
              }
              if (Array.isArray(event.data.machines)) {
                localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(event.data.machines));
              }
              window.dispatchEvent(new CustomEvent('ifta_data_synced'));
            }
          } catch {}
        };

        eventSource.onerror = () => {
          window.dispatchEvent(new CustomEvent('ifta_realtime_status', { detail: { connected: false } }));
          if (reconnectTimeout) clearTimeout(reconnectTimeout);
          reconnectTimeout = setTimeout(() => {
            connect();
          }, 4000);
        };
      } catch {}
    };

    connect();

    // Reconnect and sync on network restore
    window.addEventListener('online', () => {
      this.syncWithServer().catch(() => {});
      connect();
    });

    // Sincronização instantânea ao alternar abas ou focar a tela no celular
    window.addEventListener('focus', () => {
      this.syncWithServer().catch(() => {});
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncWithServer().catch(() => {});
      }
    });

    // Polling inteligente e ultra-rápido a cada 3s para garantir 100% de sincronismo em celulares
    setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        this.syncWithServer().catch(() => {});
      }
    }, 3000);
  },

  async syncWithServer(): Promise<{ success: boolean; source: 'server' | 'offline' }> {
    try {
      const res = await fetch(`/api/data?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache, no-store' }
      });
      if (!res.ok) throw new Error('Falha na resposta do servidor');
      const serverDb = await res.json();

      if (serverDb && Array.isArray(serverDb.components) && Array.isArray(serverDb.machines)) {
        let changed = false;
        const localComps = this.getComponents();
        const localMachines = this.getMachines();

        // Se o servidor possui dados salvos, atualiza o cache local
        if (serverDb.components.length > 0 || serverDb.machines.length > 0) {
          const localCompsStr = JSON.stringify(localComps);
          const serverCompsStr = JSON.stringify(serverDb.components);
          const localMachinesStr = JSON.stringify(localMachines);
          const serverMachinesStr = JSON.stringify(serverDb.machines);

          if (localCompsStr !== serverCompsStr) {
            localStorage.setItem(STORAGE_KEYS.COMPONENTS, serverCompsStr);
            changed = true;
          }
          if (localMachinesStr !== serverMachinesStr) {
            localStorage.setItem(STORAGE_KEYS.MACHINES, serverMachinesStr);
            changed = true;
          }
          if (Array.isArray(serverDb.categoryPermissions)) {
            const localPermsStr = JSON.stringify(this.getCategoryPermissions());
            const serverPermsStr = JSON.stringify(serverDb.categoryPermissions);
            if (localPermsStr !== serverPermsStr) {
              localStorage.setItem(STORAGE_KEYS.CATEGORY_PERMISSIONS, serverPermsStr);
              changed = true;
            }
          }
        } else if (localComps.length > 0 || localMachines.length > 0) {
          // Se o servidor estiver vazio, envia os dados locais para persistir no Docker
          await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              components: localComps,
              machines: localMachines,
              categoryPermissions: this.getCategoryPermissions()
            })
          });
        }

        if (changed && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ifta_data_synced'));
        }
        return { success: true, source: 'server' };
      }
    } catch {
      // Fallback offline: dados continuam salvos no localStorage
    }
    return { success: false, source: 'offline' };
  },

  getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: UserAccount[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  updateUserPassword(userId: string, newPassword: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].passwordHash = newPassword;
      this.saveUsers(users);
      return true;
    }
    return false;
  },

  updateUserProfile(userId: string, data: { displayName?: string; username?: string }): UserAccount | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      if (data.displayName !== undefined && data.displayName.trim()) {
        users[idx].displayName = data.displayName.trim();
      }
      if (data.username !== undefined && data.username.trim()) {
        users[idx].username = data.username.trim();
      }
      this.saveUsers(users);
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const updatedCurrent = { ...currentUser, ...users[idx] };
        this.setCurrentUser(updatedCurrent);
      }
      return users[idx];
    }
    return null;
  },

  getCategoryPermissions(): CategoryAccessRule[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORY_PERMISSIONS);
      return data ? JSON.parse(data) : INITIAL_CATEGORY_PERMISSIONS;
    } catch {
      return INITIAL_CATEGORY_PERMISSIONS;
    }
  },

  saveCategoryPermissions(rules: CategoryAccessRule[]) {
    localStorage.setItem(STORAGE_KEYS.CATEGORY_PERMISSIONS, JSON.stringify(rules));
  },

  getComponents(): ComponentItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPONENTS);
      const items: ComponentItem[] = data ? JSON.parse(data) : INITIAL_COMPONENTS;
      return items.map(c => ({
        ...c,
        visibleToRoles: Array.isArray(c.visibleToRoles) && c.visibleToRoles.length > 0 
          ? c.visibleToRoles 
          : ['CDI', 'MECANICA', 'ELETRICA']
      }));
    } catch {
      return INITIAL_COMPONENTS;
    }
  },

  saveComponents(items: ComponentItem[]) {
    localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(items));
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ components: items })
    }).catch(() => {});
  },

  isComponentTagUnique(tagCode: string, excludeId?: string): boolean {
    const clean = tagCode.trim().toUpperCase();
    if (!clean) return false;
    const comps = this.getComponents();
    return !comps.some(c => c.tagCode.toUpperCase() === clean && c.id !== excludeId);
  },

  generateUniqueComponentTag(prefix = 'COMP'): string {
    const comps = this.getComponents();
    const cleanPrefix = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'COMP';
    let counter = comps.length + 1;
    let candidate = `${cleanPrefix}-${String(counter).padStart(3, '0')}`;
    while (comps.some(c => c.tagCode.toUpperCase() === candidate)) {
      counter++;
      candidate = `${cleanPrefix}-${String(counter).padStart(3, '0')}`;
    }
    return candidate;
  },

  async saveComponent(item: ComponentItem): Promise<ComponentItem> {
    const items = this.getComponents();
    const idx = items.findIndex(i => i.id === item.id || (item.tagCode && i.tagCode.toUpperCase() === item.tagCode.trim().toUpperCase()));
    const now = new Date().toISOString();
    const cleanTag = item.tagCode.trim().toUpperCase();
    const cleanQr = `IFTA:${cleanTag}`;

    const normalizedItem: ComponentItem = {
      ...item,
      tagCode: cleanTag,
      qrCodeData: cleanQr,
      updatedAt: now
    };
    
    let resultItem: ComponentItem;
    if (idx >= 0) {
      items[idx] = normalizedItem;
      resultItem = items[idx];
    } else {
      const newItem = { 
        ...normalizedItem, 
        id: item.id || `comp-${Date.now()}`,
        createdAt: now 
      };
      items.unshift(newItem);
      resultItem = newItem;
    }

    // Salva imediatamente no localStorage para exibição imediata no dispositivo
    localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('ifta_data_synced'));

    // Persistência direta e atômica no Docker / backend Express com broadcast imediato
    try {
      const res = await fetch('/api/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultItem)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.component) {
          resultItem = json.component;
          const currentItems = this.getComponents();
          const targetIdx = currentItems.findIndex(c => c.id === resultItem.id || c.tagCode.toUpperCase() === resultItem.tagCode.toUpperCase());
          if (targetIdx >= 0) {
            currentItems[targetIdx] = resultItem;
          } else {
            currentItems.unshift(resultItem);
          }
          localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(currentItems));
          window.dispatchEvent(new CustomEvent('ifta_data_synced'));
        }
      }
    } catch (err) {
      console.warn('[STORAGE] Erro ao sincronizar peça com o servidor:', err);
    }

    return resultItem;
  },

  async deleteComponent(id: string): Promise<boolean> {
    const items = this.getComponents();
    const filtered = items.filter(i => i.id !== id && i.tagCode !== id);
    if (filtered.length !== items.length) {
      localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(filtered));

      // Atualiza componentes vinculados nas máquinas
      const machines = this.getMachines();
      let machinesChanged = false;
      const updatedMachines = machines.map(m => {
        if (m.linkedComponents && m.linkedComponents.some(l => l.componentId === id)) {
          machinesChanged = true;
          return {
            ...m,
            linkedComponents: m.linkedComponents.filter(l => l.componentId !== id)
          };
        }
        return m;
      });
      if (machinesChanged) {
        localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(updatedMachines));
      }

      window.dispatchEvent(new CustomEvent('ifta_data_synced'));

      // Exclusão definitiva no backend / Docker
      try {
        await fetch(`/api/components/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('[STORAGE] Erro ao excluir peça no servidor:', err);
      }

      return true;
    }
    return false;
  },

  getVisibleComponentsForRole(role: UserRole): ComponentItem[] {
    const all = this.getComponents();
    if (role === 'CDI' || role === 'DESENVOLVEDOR') {
      return all;
    }

    const normalize = (str: string) => 
      str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : '';

    const rules = this.getCategoryPermissions();
    const allowedCategories = new Set(
      rules
        .filter(r => r.allowedRoles && (
          r.allowedRoles.includes(role) ||
          (role === 'MECANICA' && r.allowedRoles.includes('MANUTENCAO'))
        ))
        .map(r => normalize(r.category))
    );

    // Also collect component IDs that are linked to machines and allowed for this role
    const machines = this.getMachines();
    const linkedComponentIdsForRole = new Set<string>();
    machines.forEach(m => {
      (m.linkedComponents || []).forEach(link => {
        const isAllowed = 
          link.allowedRoles?.includes(role) ||
          (role === 'MECANICA' && link.allowedRoles?.includes('MANUTENCAO')) ||
          (!link.allowedRoles || link.allowedRoles.length === 0);
        if (isAllowed) {
          linkedComponentIdsForRole.add(link.componentId.toLowerCase());
        }
      });
    });

    return all.filter(item => {
      // 1. If item has no restrictions, allow it
      if (!item.visibleToRoles || item.visibleToRoles.length === 0) return true;

      // 2. Direct role assignment check
      const directAllowed = item.visibleToRoles.some(r => 
        r === role || 
        (role === 'MECANICA' && r === 'MANUTENCAO')
      );

      // 3. Category rule check (accent-insensitive)
      const catAllowed = allowedCategories.has(normalize(item.category));

      // 4. Linked to a machine permitted for this role
      const linkedAllowed = 
        linkedComponentIdsForRole.has((item.id || '').toLowerCase()) ||
        linkedComponentIdsForRole.has((item.tagCode || '').toLowerCase());

      return directAllowed || catAllowed || linkedAllowed;
    });
  },

  getMachines(): MachineItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MACHINES);
      const list: MachineItem[] = data ? JSON.parse(data) : INITIAL_MACHINES;
      return list.map(m => ({
        ...m,
        linkedComponents: Array.isArray(m.linkedComponents) ? m.linkedComponents : []
      }));
    } catch {
      return INITIAL_MACHINES;
    }
  },

  saveMachines(machines: MachineItem[]) {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machines })
    }).catch(() => {});
  },

  isMachineTagUnique(tagCode: string, excludeId?: string): boolean {
    const clean = tagCode.trim().toUpperCase();
    if (!clean) return false;
    const machines = this.getMachines();
    return !machines.some(m => m.tagCode.toUpperCase() === clean && m.id !== excludeId);
  },

  generateUniqueMachineTag(prefix = 'MAQ'): string {
    const machines = this.getMachines();
    const cleanPrefix = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'MAQ';
    let counter = machines.length + 1;
    let candidate = `${cleanPrefix}-${String(counter).padStart(2, '0')}`;
    while (machines.some(m => m.tagCode.toUpperCase() === candidate)) {
      counter++;
      candidate = `${cleanPrefix}-${String(counter).padStart(2, '0')}`;
    }
    return candidate;
  },

  async saveMachine(machine: MachineItem): Promise<MachineItem> {
    const machines = this.getMachines();
    const idx = machines.findIndex(m => m.id === machine.id || (machine.tagCode && m.tagCode.toUpperCase() === machine.tagCode.trim().toUpperCase()));
    const now = new Date().toISOString();
    const cleanTag = machine.tagCode.trim().toUpperCase();
    const cleanQr = `IFTA:${cleanTag}`;

    const normalizedMachine: MachineItem = {
      ...machine,
      tagCode: cleanTag,
      qrCodeData: cleanQr,
      updatedAt: now
    };

    let resultMachine: MachineItem;
    if (idx >= 0) {
      machines[idx] = normalizedMachine;
      resultMachine = machines[idx];
    } else {
      const newMachine: MachineItem = {
        ...normalizedMachine,
        id: machine.id || `maq-${Date.now()}`,
        createdAt: now
      };
      machines.unshift(newMachine);
      resultMachine = newMachine;
    }

    // Salva localmente de imediato
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
    window.dispatchEvent(new CustomEvent('ifta_data_synced'));

    // Persistência direta e atômica no Docker / backend com broadcast
    try {
      const res = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultMachine)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.machine) {
          resultMachine = json.machine;
          const currentMachines = this.getMachines();
          const targetIdx = currentMachines.findIndex(m => m.id === resultMachine.id || m.tagCode.toUpperCase() === resultMachine.tagCode.toUpperCase());
          if (targetIdx >= 0) {
            currentMachines[targetIdx] = resultMachine;
          } else {
            currentMachines.unshift(resultMachine);
          }
          localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(currentMachines));
          window.dispatchEvent(new CustomEvent('ifta_data_synced'));
        }
      }
    } catch (err) {
      console.warn('[STORAGE] Erro ao sincronizar máquina com o servidor:', err);
    }

    return resultMachine;
  },

  async deleteMachine(id: string): Promise<boolean> {
    const machines = this.getMachines();
    const filtered = machines.filter(m => m.id !== id && m.tagCode !== id);
    if (filtered.length !== machines.length) {
      localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('ifta_data_synced'));

      // Exclusão definitiva no backend / Docker
      try {
        await fetch(`/api/machines/${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('[STORAGE] Erro ao excluir máquina no servidor:', err);
      }

      return true;
    }
    return false;
  },

  getMachineById(id: string): MachineItem | null {
    const machines = this.getMachines();
    return machines.find(m => m.id === id) || null;
  },

  getLogs(): AccessLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      return data ? JSON.parse(data) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  },

  addLog(username: string, role: UserRole, action: string, details?: string) {
    const logs = this.getLogs();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newLog: AccessLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: formattedDate,
      username,
      role,
      action,
      details: details || '',
      clientDevice: navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvel' : 'Estação de Trabalho Desktop'
    };

    logs.unshift(newLog);
    // Keep last 150 logs
    if (logs.length > 150) {
      logs.length = 150;
    }
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  clearLogs() {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
  },

  exportLogsCSV(): string {
    const logs = this.getLogs();
    const headers = ['ID', 'Data/Hora', 'Usuario', 'Perfil', 'Acao', 'Detalhes', 'Dispositivo'];
    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.username}"`,
      `"${l.role}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${(l.clientDevice || '').replace(/"/g, '""')}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  resetAllData() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(INITIAL_COMPONENTS));
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
    localStorage.setItem(STORAGE_KEYS.CATEGORY_PERMISSIONS, JSON.stringify(INITIAL_CATEGORY_PERMISSIONS));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
  },

  getCurrentUser(): UserAccount | null {
    try {
      const data = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserAccount | null) {
    if (user) {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }
};
