/**
 * Masarat — Path Resolver
 * ═══════════════════════════════════════════════
 * Determines the correct recovery path based on
 * zone (ring), contact level, and symptom profile.
 *
 * Philosophy: "كل التعافي حدود"
 *   — External boundaries (مع الشخص)
 *   — Internal boundaries (مع النفس)
 */

import type { PathId, ContactLevel, SymptomType, ResolvePathInput } from "./types";

// ─── Symptom Classifier ─────────────────────────────────

const GUILT_IDS = ["guilt", "shame", "over_explaining", "people_pleasing"];
const FEAR_IDS = ["anxiety_before_contact", "anxiety_low_mood", "walking_eggshells", "avoidance", "checking_phone"];
const DRAIN_IDS = ["exhausted", "chronic_fatigue", "time_drained", "relief_on_cancel", "brain_fog", "inner_emptiness"];
const ANGER_IDS = ["suppressed_anger", "physical_tension", "chest_tightness", "stomach_knot"];

/** Classify a list of symptom IDs into a dominant symptom type */
export function symptomIdsToSymptomType(symptomIds: string[]): SymptomType {
  if (symptomIds.length === 0) return "mixed";
  const guilt = GUILT_IDS.some((id) => symptomIds.includes(id));
  const fear = FEAR_IDS.some((id) => symptomIds.includes(id));
  const drain = DRAIN_IDS.some((id) => symptomIds.includes(id));
  const anger = ANGER_IDS.some((id) => symptomIds.includes(id));
  if (guilt && !fear && !drain && !anger) return "guilt";
  if (fear && !guilt && !drain && !anger) return "fear";
  if (drain && !guilt && !fear && !anger) return "drain";
  if (anger && !guilt && !fear && !drain) return "anger";
  return "mixed";
}

// ─── Path Resolution ────────────────────────────────────

/**
 * Resolve the appropriate recovery path from a diagnostic matrix.
 *
 * Logic:
 *   - SOS → `path_sos`
 *   - Grey / (Red + low contact) → `path_detox` (internal boundaries)
 *   - Red + high contact → `path_protection` (external boundaries)
 *   - Yellow → `path_negotiation`
 *   - Green → `path_deepening`
 */
export function resolvePathId(input: ResolvePathInput): PathId {
  const { zone, isGreyPath, contact, isSOS } = input;

  if (isSOS) return "path_sos";

  // Grey or (Red + low/no contact) → internal boundaries
  if (isGreyPath || (zone === "red" && (contact === "low" || contact === "none"))) {
    return "path_detox";
  }

  // Red + high/medium contact → external boundaries
  if (zone === "red" && (contact === "high" || contact === "medium")) {
    return "path_protection";
  }

  if (zone === "yellow") return "path_negotiation";
  if (zone === "green") return "path_deepening";

  return "path_negotiation";
}

// ─── Metadata ───────────────────────────────────────────

/** Path display names (Arabic) */
export const PATH_NAMES: Record<PathId, string> = {
  path_protection: "درع الحماية",
  path_detox: "الصيام الشعوري",
  path_negotiation: "فن المسافة",
  path_deepening: "الجذور العميقة",
  path_sos: "الطوارئ القصوى",
};

/** Path descriptions */
export const PATH_DESCRIPTIONS: Record<PathId, string> = {
  path_protection:
    "مسرح الحدود الخارجية: المعركة بينك وبين الشخص. السلاح: لا، التجاهل، الوقت، المسافة. استنزاف نشط (احتكاك عالي). الهدف: وقف النزيف، حدود صارمة، فنون الرد البارد — «قول لا للغير».",
  path_detox:
    "مسرح الحدود الداخلية: المعركة بينك وبين نفسك (أفكارك/مشاعرك). السلاح: إيقاف الأفكار، تفكيك الذنب، الصيام الشعوري. استنزاف عن بُعد — العدو جوا الدماغ. الهدف: «قول لا لنفسك» — انضباط ذاتي، حدود مع أفكارك.",
  path_negotiation:
    "منطقة صفراء. الهدف: إدارة العلاقة بأقل خسائر، دبلوماسية عاطفية.",
  path_deepening:
    "منطقة خضراء. الهدف: تحويل العلاقة لمصدر قوة ودعم.",
  path_sos:
    "طوارئ. الهدف: الخروج الآمن، توجيه لجهات مختصة.",
};

/** Symptom type labels */
export const SYMPTOM_TYPE_LABELS: Record<SymptomType, string> = {
  guilt: "ذنب و تبرير",
  fear: "قلق و تجنب",
  drain: "استنزاف و إرهاق",
  anger: "غضب مكبوت و توتر جسدي",
  mixed: "مزيج من المشاعر",
};

/** Relationship role labels */
export const ROLE_LABELS: Record<string, string> = {
  family: "علاقة عائلية (سلطة روحية ممكنة: أم، أب، إلخ)",
  work: "علاقة عمل (سلطة مادية: مدير، زميل، عميل)",
  love: "علاقة عاطفية (شريك، خطيب، زوج/ة)",
  money: "علاقة مالية/اجتماعية",
  general: "علاقة عامة",
  unknown: "غير محدد",
};
