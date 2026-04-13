/**
 * Masarat — Types
 * ═══════════════════════════════════════════════
 * All domain types for the guided path engine.
 * Pure data definitions — zero platform dependencies.
 */

// ─── Path Identification ────────────────────────────────

/** 5 مسارات رئيسية (فلسفة: كل التعافي حدود) */
export type PathId =
  | "path_protection"   // درع الحماية = حدود خارجية (أحمر + احتكاك عالي)
  | "path_detox"        // الصيام الشعوري = حدود داخلية (رمادي / أحمر + احتكاك منخفض)
  | "path_negotiation"  // فن المسافة (أصفر)
  | "path_deepening"    // الجذور العميقة (أخضر)
  | "path_sos";         // الطوارئ القصوى

/** نوع الألم / العرض السائد */
export type SymptomType = "guilt" | "fear" | "drain" | "anger" | "mixed";

/** معدل الاحتكاك */
export type ContactLevel = "high" | "medium" | "low" | "none";

/** مرحلة المسار */
export type PathStage = "awareness" | "resistance" | "acceptance" | "integration";

/** منطقة العلاقة */
export type Ring = "red" | "yellow" | "green";

/** نوع العلاقة */
export type RelationshipRole = "family" | "work" | "love" | "money" | "general" | "unknown";

// ─── Task & Phase ───────────────────────────────────────

/** مهمة ديناميكية (يومية أو أسبوعية) — قد يولّدها الـ AI */
export interface DynamicTask {
  id: string;
  type: "reflection" | "writing" | "practice" | "observation" | "challenge" | "breathing";
  title: string;
  text: string;
  helpText?: string;
  requiresInput?: boolean;
  placeholder?: string;
  /** صعوبة مقترحة (1–5) */
  difficultyHint?: number;
}

/** مرحلة أسبوعية في المسار */
export interface PathPhase {
  week: number;
  focus: string;
  description: string;
  tasks: DynamicTask[];
  successCriteria?: string;
}

/** مسار تعافي كامل — قد يُولَّد من AI */
export interface RecoveryPath {
  id: PathId;
  name: string;
  nameAr: string;
  description: string;
  phases: {
    week1: PathPhase;
    week2: PathPhase;
    week3: PathPhase;
  };
  /** للسماح للـ AI بتعديل الصعوبة لاحقاً */
  aiAdjustmentFactor?: number;
  /** هل الخطة مولّدة بالذكاء الاصطناعي؟ */
  aiGenerated?: boolean;
}

// ─── Progress Tracking ──────────────────────────────────

/** تقدّم يومي */
export interface DailyProgress {
  date: string; // YYYY-MM-DD
  didComplete: boolean;
  moodScore?: number; // 1–5
  taskId?: string;
  note?: string;
}

/** سياق المستخدم في المسار */
export interface UserPathContext {
  currentPathId: PathId;
  stage: PathStage;
  dailyProgress: DailyProgress[];
  aiAdjustmentFactor: number;
  recoveryPathSnapshot?: RecoveryPath;
  lastPathGeneratedAt?: number;
}

// ─── Dynamic Plan Types ─────────────────────────────────

/** نوع النمط المكتشف */
export type PatternType = "timing" | "financial" | "emotional" | "behavioral" | "boundary";

/** نمط مكتشف — duck-type friendly (platform may include extra fields) */
export interface DetectedPattern {
  type: PatternType;
  examples: string[];
  frequency: number;
  /** SDK field — optional for backward compat with platform's patternAnalyzer */
  confidence?: number;
  /** Platform fields — optional in SDK context */
  pattern?: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  triggers?: string[];
}

/** خطوة في خطة ديناميكية */
export interface DynamicAction {
  id: string;
  type: "reflection" | "writing" | "practice" | "observation" | "challenge";
  text: string;
  placeholder?: string;
  requiresInput?: boolean;
  helpText?: string;
}

/** خطوة أسبوعية في الخطة الديناميكية */
export interface DynamicStep {
  id: string;
  week: number;
  title: string;
  goal: string;
  targetPattern?: PatternType;
  description: string;
  actions: DynamicAction[];
  completed: boolean;
  successCriteria: string;
  warningMessage?: string;
}

/** خطة التعافي الديناميكية الكاملة */
export interface DynamicRecoveryPlan {
  personLabel: string;
  ring: Ring;
  primaryPattern: PatternType | null;
  totalWeeks: number;
  steps: DynamicStep[];
  insights: string[];
  generated: number;
  aiGenerated?: boolean;
}

// ─── Quick Path (Crisis) Types ──────────────────────────

export type QuickPathSituation =
  | "pressure"    // ضغط من شخص
  | "guilt"       // إحساس بالذنب
  | "anger"       // غضب
  | "overwhelmed" // إرهاق
  | "boundary"    // محتاج أقول لأ
  | "escape";     // محتاج أخرج من موقف

export interface QuickPathResult {
  exitPhrase: string;
  breathingCue: string;
  followUpAction: string;
  situation: QuickPathSituation;
  timestamp: number;
}

export interface QuickPathHistoryEntry {
  situation: QuickPathSituation;
  exitPhrase: string;
  timestamp: number;
}

// ─── Path Generation Input ──────────────────────────────

/** مدخلات تحديد المسار */
export interface ResolvePathInput {
  zone: Ring;
  isGreyPath?: boolean;
  contact: ContactLevel;
  symptomType?: SymptomType;
  isSOS?: boolean;
}

/** مدخلات توليد المسار */
export interface GeneratePathInput {
  personLabel: string;
  pathId: PathId;
  stage?: string;
  lastDifficulty?: string;
  symptomType?: SymptomType;
  relationshipRole?: RelationshipRole;
}

// ─── Symptom Exercise (external integration) ────────────

/** تمرين مخصص لعرض (من خارج SDK — يمرر للـ plan generator) */
export interface SymptomExercise {
  week: number;
  title: string;
  description: string;
  actions: DynamicAction[];
  successCriteria: string;
}
