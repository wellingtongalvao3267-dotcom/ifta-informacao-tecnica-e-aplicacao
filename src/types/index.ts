export type UserRole = 'DESENVOLVEDOR' | 'MECANICA' | 'ELETRICA' | 'MANUTENCAO';

export interface UserAccount {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string; // Plaintext or hashed for local validation
  lastLogin?: string;
  allowedCategories?: string[]; // Categories this user can access (configured by developer)
}

export interface TechnicalSpec {
  label: string;
  value: string;
  unit?: string;
}

export interface MaintenanceStep {
  step: number;
  title: string;
  instruction: string;
  torqueOrMeasure?: string;
}

export interface CommonFailure {
  symptom: string;
  probableCause: string;
  correctiveAction: string;
}

export interface ComponentItem {
  id: string;
  tagCode: string; // Part number or asset tag (e.g. MOT-ENG-042)
  name: string;
  category: string; // e.g. "Elétrica", "Mecânica", "Pneumática", "Automação", "Hidráulica"
  manufacturer: string;
  model: string;
  application: string; // e.g. "Linha de Envase 02 - Misturador Principal"
  description: string;
  imageUrl: string;
  technicalDiagramUrl?: string;
  diagramDescription?: string;
  specs: TechnicalSpec[];
  maintenanceIntervalHours?: number;
  maintenanceGuide: MaintenanceStep[];
  commonFailures: CommonFailure[];
  manualFileName?: string;
  manualSummary?: string;
  qrCodeData: string;
  isRestricted?: boolean; // If restricted only to specific roles
  visibleToRoles: UserRole[]; // Which profiles can see this item
  createdAt: string;
  updatedAt: string;
}

export interface AccessLog {
  id: string;
  timestamp: string;
  username: string;
  role: UserRole;
  action: string; // e.g. "Login no Sistema", "Consulta de Peça: MOT-ENG-042", "Escanear QR Code", etc.
  details?: string;
  clientDevice?: string;
}

export interface CategoryAccessRule {
  category: string;
  allowedRoles: UserRole[];
}
