/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  @alrehla/masarat — Guided Path Engine               ║
 * ║  محرك المسارات المُوجَّهة                              ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Build adaptive, AI-ready recovery & growth journeys.
 *
 * Philosophy: "كل التعافي حدود"
 *   — External boundaries (حدود خارجية — مع الشخص)
 *   — Internal boundaries (حدود داخلية — مع النفس)
 *
 * @example
 * ```ts
 * import { resolvePathId, buildFallbackRecoveryPath, generateDynamicPlan } from "@alrehla/masarat";
 *
 * // 1. Determine the right path
 * const pathId = resolvePathId({ zone: "red", contact: "high" });
 *
 * // 2. Build a static recovery path
 * const path = buildFallbackRecoveryPath({ personLabel: "ماما", pathId });
 *
 * // 3. Build a dynamic plan from patterns
 * const plan = generateDynamicPlan("ماما", "red", patterns, insights);
 * ```
 */

// ─── Types ──────────────────────────────────────────────
export type {
  PathId,
  SymptomType,
  ContactLevel,
  PathStage,
  Ring,
  RelationshipRole,
  DynamicTask,
  PathPhase,
  RecoveryPath,
  DailyProgress,
  UserPathContext,
  PatternType,
  DetectedPattern,
  DynamicAction,
  DynamicStep,
  DynamicRecoveryPlan,
  QuickPathSituation,
  QuickPathResult,
  QuickPathHistoryEntry,
  ResolvePathInput,
  GeneratePathInput,
  SymptomExercise,
} from "./types";

export type {
  PatternAnalysisResult
} from "./patternAnalyzer";

// ─── Path Resolver ──────────────────────────────────────
export {
  resolvePathId,
  symptomIdsToSymptomType,
  PATH_NAMES,
  PATH_DESCRIPTIONS,
  SYMPTOM_TYPE_LABELS,
  ROLE_LABELS,
} from "./resolver";

// ─── Path Templates ─────────────────────────────────────
export {
  buildFallbackRecoveryPath,
  buildRecoveryPathPrompt,
  PATH_PHILOSOPHY_RULES,
} from "./pathTemplates";

// ─── Dynamic Plan Generator ─────────────────────────────
export {
  generateDynamicPlan,
  generateBasicPlan,
} from "./planGenerator";

// ─── Plan Templates (Prompts) ───────────────────────────
export {
  buildAIPlanPrompt,
  buildPatternAnalysisPrompt,
  buildQuickFeedbackPrompt
} from "./planTemplates";

// ─── Quick Path (Crisis) ────────────────────────────────
export {
  getStaticQuickPath,
  STATIC_PHRASES,
  SITUATION_LABELS,
  SITUATION_ICONS,
} from "./quickPath";

// ─── Pattern Analyzer ───────────────────────────────────
export {
  analyzeSituations,
  quickAnalyze
} from "./patternAnalyzer";
