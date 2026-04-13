import type { ContactLevel, DetectedPattern, PatternType, Ring, SymptomType } from "./types";

const MOCK_PATTERNS: Record<PatternType, string[]> = {
  timing: [
    "اتصال متكرر في أوقات متأخرة جدا بدون سبب عاجل.",
    "طلب خدمات في أوقات الراحة الخاصة بك.",
    "إرسال رسائل ضاغطة ومطالبة برد فوري.",
  ],
  financial: [
    "طلب مبالغ مالية متكررة تحت ضغط عاطفي.",
    "تحميلك مسؤولية إخفاقات مالية للطرف الآخر.",
    "استخدام المال كوسيلة للتحكم في القرارات.",
  ],
  emotional: [
    "استخدام الذنب للتحكم في تصرفاتك.",
    "لعب دور الضحية عند مواجهة أي خطأ.",
    "الصمت العقابي عند عدم تنفيذ الرغبات.",
  ],
  behavioral: [
    "تغيير المزاج المفاجئ للسيطرة على الأجواء.",
    "التدخل في تفاصيل الخصوصية بشكل مستفز.",
    "تجاهل الحدود المتفق عليها مسبقا.",
  ],
  boundary: [
    "فتح مواضيع حساسة في أماكن عامة.",
    "تجاوز المساحة الشخصية الجسدية أو النفسية.",
    "التحدث بالنيابة عنك في وجود الآخرين.",
  ],
};

export function generateMockPatterns(ring: Ring, symptoms: SymptomType[]): DetectedPattern[] {
  const result: DetectedPattern[] = [];
  const types: PatternType[] = [];

  if (symptoms.includes("guilt")) types.push("emotional");
  if (symptoms.includes("drain")) types.push("timing", "behavioral");
  if (symptoms.includes("fear")) types.push("boundary");
  if (types.length === 0) types.push("behavioral");

  types.forEach((type) => {
    const examples = MOCK_PATTERNS[type];
    result.push({
      type,
      examples: [examples[Math.floor(Math.random() * examples.length)]],
      frequency: Math.floor(Math.random() * 5) + 3,
      confidence: 0.85 + Math.random() * 0.1,
      description: "نمط مكتشف بناء على السلوكيات المتكررة.",
      severity: ring === "red" ? "high" : ring === "yellow" ? "medium" : "low",
      triggers: ["الضغط النفسي", "غياب الحدود"],
    });
  });

  return result;
}

export const MOCK_SCENARIOS: Array<{
  name: string;
  person: string;
  zone: Ring;
  contact: ContactLevel;
  symptoms: SymptomType[];
  isSOS: boolean;
}> = [
  {
    name: "الأهل والذنب",
    person: "ماما",
    zone: "red",
    contact: "high",
    symptoms: ["guilt"],
    isSOS: false,
  },
  {
    name: "الشغل والاستنزاف",
    person: "المدير",
    zone: "yellow",
    contact: "medium",
    symptoms: ["drain"],
    isSOS: false,
  },
  {
    name: "علاقة سامة سابقة",
    person: "س",
    zone: "red",
    contact: "none",
    symptoms: ["fear", "guilt"],
    isSOS: false,
  },
];
