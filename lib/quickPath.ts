/**
 * Masarat — Quick Path (Crisis Engine)
 * ═══════════════════════════════════════════════
 * Instant exit phrases and breathing cues for
 * acute crisis moments. Zero AI dependency —
 * all static, battle-tested responses.
 *
 * "مش محتاج تفكر — محتاج تتحرك."
 */

import type { QuickPathSituation, QuickPathResult } from "./types";

// ─── Static Crisis Phrases ──────────────────────────────

export const STATIC_PHRASES: Record<QuickPathSituation, QuickPathResult> = {
  pressure: {
    exitPhrase: '"محتاج وقت أفكر — هرد عليك بعدين"',
    breathingCue: "خد نفس عميق من البطن. 4 ثواني دخول، 6 ثواني خروج.",
    followUpAction: "ابعد عن الموقف جسدياً لو ممكن — حتى خطوتين كافيين.",
    situation: "pressure",
    timestamp: 0,
  },
  guilt: {
    exitPhrase: '"أنا بحاول أعمل اللي أقدر عليه — ده مش أنانية"',
    breathingCue: "ضع يدك على صدرك. حس بدقات قلبك. أنت هنا.",
    followUpAction: 'اكتب جملة واحدة: "أنا مش مسؤول عن..."',
    situation: "guilt",
    timestamp: 0,
  },
  anger: {
    exitPhrase: '"مش هقدر أكمل الكلام دلوقتي — محتاج أهدى"',
    breathingCue: "عد من 10 لـ 1 ببطء. كل رقم = نفس.",
    followUpAction: "اشرب ماية. الجسم بيحتاج يبرد قبل العقل.",
    situation: "anger",
    timestamp: 0,
  },
  overwhelmed: {
    exitPhrase: '"أنا مش في الوضع المناسب دلوقتي — نتكلم بعدين"',
    breathingCue: "5-4-3-2-1: شوف 5 حاجات، اسمع 4، حس بـ 3، اشم 2، دوق 1.",
    followUpAction: "قلل الضوضاء — صامت التليفون، أغلق تاب واحد.",
    situation: "overwhelmed",
    timestamp: 0,
  },
  boundary: {
    exitPhrase: '"لأ، مش هقدر — شكراً لفهمك"',
    breathingCue: 'الـ "لأ" مش محتاج تبرير. نفس واحد كافي.',
    followUpAction: "لو حسيت بالذنب — طبيعي. الإحساس ده مش دليل إنك غلطان.",
    situation: "boundary",
    timestamp: 0,
  },
  escape: {
    exitPhrase: '"معذرة، محتاج أمشي دلوقتي"',
    breathingCue: "امشي بخطوات واضحة. الجسم بيعرف الطريق.",
    followUpAction: "لما تبعد — اكتب كلمة واحدة بتوصف إحساسك.",
    situation: "escape",
    timestamp: 0,
  },
};

// ─── Labels & Icons ─────────────────────────────────────

export const SITUATION_LABELS: Record<QuickPathSituation, string> = {
  pressure: "ضغط من شخص",
  guilt: "إحساس بالذنب",
  anger: "غضب",
  overwhelmed: "إرهاق",
  boundary: "محتاج أقول لأ",
  escape: "محتاج أخرج",
};

export const SITUATION_ICONS: Record<QuickPathSituation, string> = {
  pressure: "⚡",
  guilt: "💭",
  anger: "🔥",
  overwhelmed: "🌊",
  boundary: "🛡️",
  escape: "🚪",
};

/**
 * Get a static quick-path result for a crisis situation.
 * This is the pure-logic layer — AI enhancement is done at the platform level.
 */
export function getStaticQuickPath(situation: QuickPathSituation): QuickPathResult {
  return { ...STATIC_PHRASES[situation], timestamp: Date.now() };
}
