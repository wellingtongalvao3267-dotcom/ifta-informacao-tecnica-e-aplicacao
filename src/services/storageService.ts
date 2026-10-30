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
          if (u.username === 'DESENVOLVEDOR' || (u.role as string) === 'DESENVOLVEDOR') {
            u.username = 'CDI';
            u.role = 'CDI';
            u.displayName = 'CDI (Centro de Documentação Industrial)';
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
    if (current && (current.username === 'DESENVOLVEDOR' || (current.role as string) === 'DESENVOLVEDOR')) {
      current.username = 'CDI';
      current.role = 'CDI';
      current.displayName = 'CDI (Centro de Documentação Industrial)';
      this.setCurrentUser(current);
    }
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

  saveComponent(item: ComponentItem): ComponentItem {
    const items = this.getComponents();
    const idx = items.findIndex(i => i.id === item.id);
    const now = new Date().toISOString();
    const cleanTag = item.tagCode.trim().toUpperCase();
    const cleanQr = `IFTA:${cleanTag}`;

    const normalizedItem: ComponentItem = {
      ...item,
      tagCode: cleanTag,
      qrCodeData: cleanQr,
      updatedAt: now
    };
    
    if (idx >= 0) {
      items[idx] = normalizedItem;
      this.saveComponents(items);
      return items[idx];
    } else {
      const newItem = { 
        ...normalizedItem, 
        id: item.id || `comp-${Date.now()}`,
        createdAt: now 
      };
      items.unshift(newItem);
      this.saveComponents(items);
      return newItem;
    }
  },

  deleteComponent(id: string): boolean {
    const items = this.getComponents();
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length !== items.length) {
      this.saveComponents(filtered);
      // Clean up linked components in machines if any
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
        this.saveMachines(updatedMachines);
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

  saveMachine(machine: MachineItem): MachineItem {
    const machines = this.getMachines();
    const idx = machines.findIndex(m => m.id === machine.id);
    const now = new Date().toISOString();
    const cleanTag = machine.tagCode.trim().toUpperCase();
    const cleanQr = `IFTA:${cleanTag}`;

    const normalizedMachine: MachineItem = {
      ...machine,
      tagCode: cleanTag,
      qrCodeData: cleanQr,
      updatedAt: now
    };

    if (idx >= 0) {
      machines[idx] = normalizedMachine;
      this.saveMachines(machines);
      return machines[idx];
    } else {
      const newMachine: MachineItem = {
        ...normalizedMachine,
        id: machine.id || `maq-${Date.now()}`,
        createdAt: now
      };
      machines.unshift(newMachine);
      this.saveMachines(machines);
      return newMachine;
    }
  },

  deleteMachine(id: string): boolean {
    const machines = this.getMachines();
    const filtered = machines.filter(m => m.id !== id);
    if (filtered.length !== machines.length) {
      this.saveMachines(filtered);
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
