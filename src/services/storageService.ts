import { ComponentItem, UserAccount, AccessLog, CategoryAccessRule, UserRole } from '../types';
import { INITIAL_USERS, INITIAL_COMPONENTS, INITIAL_CATEGORY_PERMISSIONS, INITIAL_LOGS } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'ifta_users_v2',
  COMPONENTS: 'ifta_components_v2',
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
        });
        if (changed) {
          localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(comps));
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
      return data ? JSON.parse(data) : INITIAL_COMPONENTS;
    } catch {
      return INITIAL_COMPONENTS;
    }
  },

  saveComponents(items: ComponentItem[]) {
    localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(items));
  },

  saveComponent(item: ComponentItem): ComponentItem {
    const items = this.getComponents();
    const idx = items.findIndex(i => i.id === item.id);
    const now = new Date().toISOString();
    
    if (idx >= 0) {
      items[idx] = { ...item, updatedAt: now };
      this.saveComponents(items);
      return items[idx];
    } else {
      const newItem = { ...item, createdAt: now, updatedAt: now };
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
      return true;
    }
    return false;
  },

  getVisibleComponentsForRole(role: UserRole): ComponentItem[] {
    const all = this.getComponents();
    if (role === 'DESENVOLVEDOR') {
      return all;
    }

    const rules = this.getCategoryPermissions();
    const allowedCategories = new Set(
      rules.filter(r => r.allowedRoles.includes(role)).map(r => r.category.toLowerCase().trim())
    );

    return all.filter(item => {
      // Direct role assignment or category rule
      const directAllowed = item.visibleToRoles && item.visibleToRoles.includes(role);
      const catAllowed = allowedCategories.has(item.category.toLowerCase().trim());
      return directAllowed || catAllowed;
    });
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
