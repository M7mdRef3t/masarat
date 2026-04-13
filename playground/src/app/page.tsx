"use client";

import { useMemo, useState } from "react";
import {
  PATH_DESCRIPTIONS,
  PATH_NAMES,
  SYMPTOM_TYPE_LABELS,
  resolvePathId,
  symptomIdsToSymptomType,
} from "@/masarat/resolver";
import { generateDynamicPlan } from "@/masarat/planGenerator";
import { buildAIPlanPrompt } from "@/masarat/planTemplates";
import { generateMockPatterns, MOCK_SCENARIOS } from "@/masarat/mockGenerator";
import type {
  ContactLevel,
  DetectedPattern,
  DynamicRecoveryPlan,
  PathId,
  Ring,
  SymptomType,
} from "@/masarat/types";
import type { PatternAnalysisResult } from "@/masarat/patternAnalyzer";

type TabId = "dashboard" | "prompt" | "trace";
type WhatsAppTone = "short" | "balanced" | "firm";

interface ScenarioSeed {
  name: string;
  person: string;
  zone: Ring;
  contact: ContactLevel;
  symptoms: SymptomType[];
  isSOS: boolean;
}

interface InferenceApiData {
  personLabel: string;
  pathId: PathId;
  pathName: string;
  pathDescription: string;
  symptomType: SymptomType;
  patternAnalysis: PatternAnalysisResult;
  plan: DynamicRecoveryPlan;
  aiPrompt: string;
}

interface InferenceApiResponse {
  ok: boolean;
  data?: InferenceApiData;
  error?: string;
}

interface WhatsAppApiResponse {
  ok: boolean;
  data?: {
    provider: "mock" | "meta";
    delivered: boolean;
    messageId: string;
    to: string;
  };
  error?: string;
}

function buildWhatsAppDraft(result: InferenceApiData, tone: WhatsAppTone): string {
  const topInsights = result.plan.insights.slice(0, 2);
  const firstStep = result.plan.steps[0];
  const insightsLine = topInsights.length > 0 ? topInsights.join(" | ") : "";
  const firstStepLine = firstStep ? `${firstStep.title} - ${firstStep.successCriteria}` : "";
  const templates: Record<WhatsAppTone, Record<PathId, string[]>> = {
    short: {
      path_sos: [
        `طوارئ: ${result.pathName}.`,
        "الأولوية الآن للمسافة والحماية الفورية.",
        firstStepLine ? `ابدأ بـ: ${firstStepLine}` : "",
      ],
      path_protection: [
        `المسار: ${result.pathName}.`,
        "الموقف محتاج حدود واضحة فورًا.",
        firstStepLine ? `الخطوة الأولى: ${firstStepLine}` : "",
      ],
      path_detox: [
        `المسار: ${result.pathName}.`,
        "التركيز على فك الذنب والضغط الداخلي.",
        firstStepLine ? `ابدأ بـ: ${firstStepLine}` : "",
      ],
      path_negotiation: [
        `المسار: ${result.pathName}.`,
        "المطلوب كلام واضح وحدود محسوبة.",
        firstStepLine ? `ابدأ بـ: ${firstStepLine}` : "",
      ],
      path_deepening: [
        `المسار: ${result.pathName}.`,
        "المرحلة مناسبة لتعميق الاستقرار.",
        firstStepLine ? `ابدأ بـ: ${firstStepLine}` : "",
      ],
    },
    balanced: {
      path_sos: [
        "دي رسالة طوارئ من مسارات.",
        `التصنيف الحالي: ${result.pathName}.`,
        "الأولوية دلوقتي هي تقليل الاحتكاك وتأمين المسافة فورًا.",
        insightsLine ? `مؤشرات الخطر: ${insightsLine}` : "",
        firstStepLine ? `التحرك الأول المطلوب: ${firstStepLine}` : "",
      ],
      path_protection: [
        `التقييم الحالي: ${result.pathName}.`,
        "الوضع محتاج حدود واضحة ومسافة فورية بدون تفاوض طويل.",
        `وصف سريع: ${result.pathDescription}`,
        insightsLine ? `الأنماط المرصودة: ${insightsLine}` : "",
        firstStepLine ? `أول خطوة تنفيذ: ${firstStepLine}` : "",
      ],
      path_detox: [
        `المسار المناسب دلوقتي: ${result.pathName}.`,
        "التركيز هنا على فصل الضغط الداخلي عن الحقيقة، وتهدئة الذنب المفتعل.",
        `الوصف: ${result.pathDescription}`,
        insightsLine ? `التركيز النفسي: ${insightsLine}` : "",
        firstStepLine ? `الخطوة الافتتاحية: ${firstStepLine}` : "",
      ],
      path_negotiation: [
        `المسار الحالي: ${result.pathName}.`,
        "الموقف مش محتاج انفجار، لكنه محتاج حدود محسوبة وكلام واضح.",
        `ملخص: ${result.pathDescription}`,
        insightsLine ? `نقط الانتباه: ${insightsLine}` : "",
        firstStepLine ? `بداية التنفيذ: ${firstStepLine}` : "",
      ],
      path_deepening: [
        `المسار الحالي: ${result.pathName}.`,
        "المرحلة دي مناسبة للتعميق وبناء نمط أكثر استقرارًا بدل مجرد رد فعل.",
        `الوصف: ${result.pathDescription}`,
        insightsLine ? `أهم البصائر: ${insightsLine}` : "",
        firstStepLine ? `الخطوة التالية: ${firstStepLine}` : "",
      ],
    },
    firm: {
      path_sos: [
        `إنذار واضح: ${result.pathName}.`,
        "أي تأخير هنا بيزود الخطر، فالمطلوب مسافة فورية وتقليل أي احتكاك مباشر.",
        insightsLine ? `أسباب القرار: ${insightsLine}` : "",
        firstStepLine ? `التنفيذ الآن: ${firstStepLine}` : "",
      ],
      path_protection: [
        `القرار الحاسم: ${result.pathName}.`,
        "لازم حدود مباشرة ووقف أي سحب عاطفي أو تفاوض مرهق من غير داعي.",
        `التوصيف: ${result.pathDescription}`,
        insightsLine ? `الأدلة السلوكية: ${insightsLine}` : "",
        firstStepLine ? `ابدأ فورًا بـ: ${firstStepLine}` : "",
      ],
      path_detox: [
        `القرار الحالي: ${result.pathName}.`,
        "ممنوع تسيب الذنب المصنوع يوجّهك. المطلوب تهدئة داخلية وفصل بين الحقيقة والابتزاز النفسي.",
        insightsLine ? `ما يدعم القرار: ${insightsLine}` : "",
        firstStepLine ? `نقطة البداية: ${firstStepLine}` : "",
      ],
      path_negotiation: [
        `المسار المناسب: ${result.pathName}.`,
        "لا توسّع النقاش بلا حدود. المطلوب صياغة واضحة، قصيرة، ومحسوبة.",
        insightsLine ? `عناصر الانتباه: ${insightsLine}` : "",
        firstStepLine ? `التحرك العملي: ${firstStepLine}` : "",
      ],
      path_deepening: [
        `المسار الحالي: ${result.pathName}.`,
        "دي مرحلة تثبيت، فلازم التعامل يكون واعي ومنظم بدل الرجوع لردود الفعل القديمة.",
        insightsLine ? `مرتكزات التعميق: ${insightsLine}` : "",
        firstStepLine ? `الخطوة الحاسمة التالية: ${firstStepLine}` : "",
      ],
    },
  };

  return templates[tone][result.pathId].filter(Boolean).join("\n");
}

const Card = ({
  children,
  title,
  className = "",
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => (
  <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl backdrop-blur-md ${className}`}>
    {title ? (
      <h2 className="mb-6 border-b border-zinc-800 pb-2 text-xs font-black uppercase tracking-widest text-zinc-500">
        {title}
      </h2>
    ) : null}
    {children}
  </div>
);

const RadioGroup = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <div className="mb-8">
    <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
            value === opt.value
              ? "border-teal-500/50 bg-teal-500/10 text-teal-400 shadow-[0_0_20px_rgba(20,184,166,0.15)]"
              : "border-zinc-700/50 bg-zinc-800/30 text-zinc-500 hover:border-zinc-500"
          }`}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const SymptomToggle = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
      active
        ? "border-zinc-100 bg-zinc-100 text-black shadow-lg"
        : "border-zinc-800 bg-transparent text-zinc-500 hover:border-zinc-700"
    }`}
    type="button"
  >
    {label}
  </button>
);

const TabButton = ({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${
      active ? "border-teal-500 bg-teal-500/5 text-teal-400" : "border-transparent text-zinc-500 hover:text-zinc-300"
    }`}
    type="button"
  >
    {icon ? <span>{icon}</span> : null}
    {label}
  </button>
);

const CONTACT_LABELS: Record<ContactLevel, string> = {
  high: "عالي",
  medium: "متوسط",
  low: "منخفض",
  none: "معدوم",
};

const PATH_REASONING: Record<PathId, string> = {
  path_protection: "المحرك اكتشف [دائرة حمراء + احتكاك عالي]. الاستراتيجية: سيادة خارجية عبر المسافة الفورية.",
  path_detox: "المحرك اكتشف [احتكاك منخفض أو انعزال بعد استنزاف]. الاستراتيجية: تصفية ذهنية داخلية وفصل الشعور بالذنب.",
  path_negotiation: "المحرك اكتشف [دائرة صفراء]. الاستراتيجية: الحفاظ على الحدود عبر المسافة الدبلوماسية.",
  path_deepening: "المحرك اكتشف [دائرة خضراء]. الاستراتيجية: تعميق الوعي وبناء علاقة صحية بحدود مستقرة.",
  path_sos: "تم رصد إشارة طوارئ. الأولوية الآن لبروتوكول الخروج والحماية الفورية.",
};

const SYMPTOMS = [
  { id: "guilt", label: "ذنب مستمر" },
  { id: "walking_eggshells", label: "مشي على قشر بيض" },
  { id: "exhausted", label: "استنزاف طاقة" },
  { id: "suppressed_anger", label: "غضب مكبوت" },
] as const;

function splitSituations(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinPlanInsights(symptomType: SymptomType): string[] {
  return [`تم اكتشاف نمط ${SYMPTOM_TYPE_LABELS[symptomType]}`, "سلوك استنزافي متكرر"];
}

function mapScenario(scenario: ScenarioSeed) {
  return {
    personLabel: scenario.person,
    zone: scenario.zone,
    contact: scenario.contact,
    selectedSymptoms: scenario.symptoms.map((item) => item.toString()),
    isSOS: scenario.isSOS,
  };
}

const LogicTrace = ({
  zone,
  contact,
  isSOS,
  symptomType,
  pathId,
}: {
  zone: Ring;
  contact: ContactLevel;
  isSOS: boolean;
  symptomType: SymptomType;
  pathId: PathId;
}) => {
  const steps = [
    { label: "مدخل: الدائرة", value: zone === "red" ? "حمراء" : zone === "yellow" ? "صفراء" : "خضراء", status: "ok" },
    { label: "مدخل: الاحتكاك", value: CONTACT_LABELS[contact], status: "ok" },
    { label: "مدخل: الطوارئ", value: isSOS ? "مفعل" : "غير مفعل", status: isSOS ? "warning" : "ok" },
    { label: "مدخل: الأعراض", value: SYMPTOM_TYPE_LABELS[symptomType], status: "ok" },
    { label: "المحرك: المسار النهائي", value: PATH_NAMES[pathId], status: "success" },
  ] as const;

  return (
    <div className="space-y-4 font-mono">
      {steps.map((step) => (
        <div key={step.label} className="group flex items-center gap-6">
          <div className="w-40 text-[10px] font-bold uppercase text-zinc-600">{step.label}</div>
          <div className="h-px flex-1 bg-zinc-800 transition-all group-hover:bg-zinc-700" />
          <div
            className={`rounded px-3 py-1 text-[10px] font-black uppercase ${
              step.status === "success"
                ? "bg-teal-500 text-black"
                : step.status === "warning"
                  ? "bg-red-500 text-white"
                  : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {step.value}
          </div>
        </div>
      ))}
      <div className="mt-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-right">
        <h4 className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">تفسير قرار النظام</h4>
        <p className="text-sm leading-relaxed italic text-zinc-400">{PATH_REASONING[pathId]}</p>
      </div>
    </div>
  );
};

const PromptConsole = ({ prompt }: { prompt: string }) => (
  <div className="group relative">
    <div className="absolute right-4 top-4 text-[10px] font-black uppercase tracking-widest text-teal-500/50 transition-all group-hover:text-teal-500">
      تعليمات الذكاء الاصطناعي
    </div>
    <pre
      className="max-h-[600px] overflow-x-auto whitespace-pre-wrap rounded-3xl border border-zinc-800 bg-black/50 p-8 text-left font-mono text-xs leading-relaxed text-zinc-400"
      dir="ltr"
    >
      {prompt}
    </pre>
  </div>
);

export default function MasaratPlayground() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [personLabel, setPersonLabel] = useState("الشخص");
  const [zone, setZone] = useState<Ring>("red");
  const [contact, setContact] = useState<ContactLevel>("medium");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isSOS, setIsSOS] = useState(false);
  const [situationsText, setSituationsText] = useState(
    "بيطلب فلوس كل يوم وبشكل مفاجئ\nبيبعت رسايل فيها ذنب ومسؤولية\nبيكلمني متأخر بالليل وعايز رد فوري"
  );
  const [whatsAppNumber, setWhatsAppNumber] = useState("201000000000");
  const [whatsAppMessage, setWhatsAppMessage] = useState("اختبار من منصة مسارات");
  const [whatsAppTone, setWhatsAppTone] = useState<WhatsAppTone>("balanced");
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [inferenceError, setInferenceError] = useState("");
  const [whatsAppError, setWhatsAppError] = useState("");
  const [whatsAppStatus, setWhatsAppStatus] = useState("");
  const [serverResult, setServerResult] = useState<InferenceApiData | null>(null);

  const symptomType = useMemo(() => symptomIdsToSymptomType(selectedSymptoms), [selectedSymptoms]);
  const localPathId = useMemo(
    () =>
      resolvePathId({
        zone,
        contact,
        isSOS,
        symptomType,
      }),
    [zone, contact, isSOS, symptomType]
  );

  const localPatterns = useMemo(() => generateMockPatterns(zone, [symptomType]), [zone, symptomType]);
  const localPlan = useMemo(
    () => generateDynamicPlan(personLabel, zone, localPatterns, joinPlanInsights(symptomType), []),
    [personLabel, zone, symptomType, localPatterns]
  );
  const localPrompt = useMemo(
    () =>
      buildAIPlanPrompt(
        personLabel,
        zone,
        localPatterns,
        splitSituations(situationsText),
        ["كفاءة حدود منخفضة", "اعتماد عاطفي متبادل"],
        []
      ),
    [personLabel, zone, localPatterns, situationsText]
  );

  const renderedPathId = serverResult?.pathId ?? localPathId;
  const renderedPatterns = serverResult?.patternAnalysis.patterns ?? localPatterns;
  const renderedPlan = serverResult?.plan ?? localPlan;
  const renderedPrompt = serverResult?.aiPrompt ?? localPrompt;
  const renderedDescription = serverResult?.pathDescription ?? PATH_DESCRIPTIONS[renderedPathId];
  const renderedPathName = serverResult?.pathName ?? PATH_NAMES[renderedPathId];
  const renderedSymptomType = serverResult?.symptomType ?? symptomType;
  const renderedInsights = renderedPlan.insights;

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const loadScenario = (scenario: ScenarioSeed) => {
    const mapped = mapScenario(scenario);
    setPersonLabel(mapped.personLabel);
    setZone(mapped.zone);
    setContact(mapped.contact);
    setSelectedSymptoms(mapped.selectedSymptoms);
    setIsSOS(mapped.isSOS);
    setServerResult(null);
    setInferenceError("");
    setActiveTab("dashboard");
  };

  const handleInference = async () => {
    setIsRunningInference(true);
    setInferenceError("");

    try {
      const response = await fetch("/api/masarat/inference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personLabel,
          zone,
          contact,
          isSOS,
          symptoms: selectedSymptoms,
          situations: splitSituations(situationsText),
        }),
      });

      const result = (await response.json()) as InferenceApiResponse;
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "فشل تشغيل التحليل.");
      }

      setServerResult(result.data);
      setWhatsAppMessage(buildWhatsAppDraft(result.data, whatsAppTone));
      setActiveTab("dashboard");
    } catch (error) {
      setInferenceError(error instanceof Error ? error.message : "حصلت مشكلة أثناء التحليل.");
    } finally {
      setIsRunningInference(false);
    }
  };

  const handleWhatsAppSend = async () => {
    setIsSendingWhatsApp(true);
    setWhatsAppError("");
    setWhatsAppStatus("");

    try {
      const response = await fetch("/api/whatsapp/send-live", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: whatsAppNumber,
          message: whatsAppMessage,
        }),
      });

      const result = (await response.json()) as WhatsAppApiResponse;
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "فشل إرسال الرسالة.");
      }

      setWhatsAppStatus(
        `اترسلت عبر ${result.data.provider === "meta" ? "Meta" : "Mock"} • id: ${result.data.messageId}`
      );
    } catch (error) {
      setWhatsAppError(error instanceof Error ? error.message : "حصلت مشكلة أثناء الإرسال.");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-4 font-sans text-zinc-100 selection:bg-teal-500/30 md:p-8" dir="rtl">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex flex-col justify-between gap-6 border-b border-zinc-800 pb-8 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-3xl font-black tracking-tighter text-white">
              معماري <span className="text-teal-500">المسارات</span>
            </h1>
            <div className="flex items-center gap-3">
              <span className="rounded bg-teal-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-teal-500">
                إصدار 2.0 // شفاف
              </span>
              <p className="text-sm font-medium tracking-wide text-zinc-500">مختبر تصميم الأنظمة السيادية</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-1.5">
            <button
              onClick={() => setIsSOS((prev) => !prev)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${
                isSOS ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)]" : "text-zinc-500 hover:text-red-400"
              }`}
              type="button"
            >
              صفر الطوارئ
            </button>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="scrollbar-hide flex max-w-[300px] gap-1 overflow-x-auto">
              {(MOCK_SCENARIOS as ScenarioSeed[]).map((scenario) => (
                <button
                  key={scenario.name}
                  onClick={() => loadScenario(scenario)}
                  className="whitespace-nowrap rounded-lg border border-transparent bg-zinc-800 px-3 py-1.5 text-[10px] text-zinc-400 transition-all hover:border-zinc-700 hover:text-white"
                  type="button"
                >
                  سيناريو: {scenario.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <nav className="mb-4 flex gap-0 border-b border-zinc-900 lg:col-span-12">
            <TabButton label="لوحة التحكم" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon="📊" />
            <TabButton label="تتبع المنطق" active={activeTab === "trace"} onClick={() => setActiveTab("trace")} icon="🌩️" />
            <TabButton label="أوامر الذكاء" active={activeTab === "prompt"} onClick={() => setActiveTab("prompt")} icon="🤖" />
          </nav>

          <div className="space-y-6 lg:col-span-4">
            <Card title="إحداثيات الموقف">
              <div className="mb-8">
                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-400">اسم الطرف الآخر</label>
                <input
                  type="text"
                  value={personLabel}
                  onChange={(event) => setPersonLabel(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm transition-colors focus:border-teal-500 focus:outline-none"
                />
              </div>

              <RadioGroup
                label="المنطقة (الدائرة)"
                options={[
                  { label: "حمراء (استنزاف)", value: "red" },
                  { label: "صفراء (تفاوض)", value: "yellow" },
                  { label: "خضراء (دعم)", value: "green" },
                ]}
                value={zone}
                onChange={setZone}
              />

              <RadioGroup
                label="مستوى الاحتكاك"
                options={[
                  { label: "عالي", value: "high" },
                  { label: "متوسط", value: "medium" },
                  { label: "منخفض", value: "low" },
                  { label: "معدوم", value: "none" },
                ]}
                value={contact}
                onChange={setContact}
              />

              <div className="mb-6">
                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-400">ملف الأعراض السائدة</label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map((symptom) => (
                    <SymptomToggle
                      key={symptom.id}
                      label={symptom.label}
                      active={selectedSymptoms.includes(symptom.id)}
                      onClick={() => toggleSymptom(symptom.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">مواقف التحليل الحية</label>
                <textarea
                  value={situationsText}
                  onChange={(event) => setSituationsText(event.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none"
                  placeholder="كل موقف في سطر..."
                />
                <button
                  onClick={handleInference}
                  className="w-full rounded-2xl bg-teal-500 px-4 py-3 text-sm font-black text-black transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isRunningInference}
                  type="button"
                >
                  {isRunningInference ? "بيشغل الـ Inference..." : "تحليل مسارات"}
                </button>
                {inferenceError ? <p className="text-xs font-bold text-red-400">{inferenceError}</p> : null}
              </div>
            </Card>

            <Card title="زر الواتساب الحي">
              <div className="space-y-3">
                <RadioGroup
                  label="نبرة الرسالة"
                  options={[
                    { label: "مختصر", value: "short" },
                    { label: "عادي", value: "balanced" },
                    { label: "حازم", value: "firm" },
                  ]}
                  value={whatsAppTone}
                  onChange={(value) => {
                    setWhatsAppTone(value);
                    if (serverResult) {
                      setWhatsAppMessage(buildWhatsAppDraft(serverResult, value));
                    }
                  }}
                />
                <input
                  type="text"
                  value={whatsAppNumber}
                  onChange={(event) => setWhatsAppNumber(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="2010xxxxxxxx"
                />
                <textarea
                  value={whatsAppMessage}
                  onChange={(event) => setWhatsAppMessage(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none"
                  placeholder="اكتب الرسالة هنا"
                />
                <button
                  onClick={handleWhatsAppSend}
                  className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSendingWhatsApp}
                  type="button"
                >
                  {isSendingWhatsApp ? "جاري إرسال الرسالة..." : "الواتساب"}
                </button>
                {whatsAppStatus ? <p className="text-xs font-bold text-emerald-400">{whatsAppStatus}</p> : null}
                {whatsAppError ? <p className="text-xs font-bold text-red-400">{whatsAppError}</p> : null}
              </div>
            </Card>

            <Card title="الأنماط السلوكية المرصودة">
              <div className="space-y-4">
                {renderedPatterns.map((pattern: DetectedPattern, index: number) => (
                  <div key={`${pattern.type}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-right">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-teal-500">
                        نمط مرصود ({pattern.type})
                      </span>
                      <span className="text-[10px] font-mono text-zinc-600">
                        الدقة: {((pattern.confidence ?? 0.8) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="mb-3 text-xs font-bold text-zinc-300">{pattern.examples[0]}</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      {pattern.triggers?.map((trigger: string) => (
                        <span key={trigger} className="rounded bg-zinc-800 px-2 py-0.5 text-[9px] font-bold text-zinc-500">
                          #{trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-8 lg:col-span-8">
            {activeTab === "dashboard" ? (
              <div>
                <div
                  className={`mb-8 rounded-3xl border-2 p-8 transition-all duration-700 ${
                    renderedPathId === "path_protection"
                      ? "border-red-500/20 bg-red-500/5 shadow-[0_0_50px_rgba(239,68,68,0.05)]"
                      : renderedPathId === "path_detox"
                        ? "border-zinc-500/20 bg-zinc-500/5"
                        : "border-teal-500/20 bg-teal-500/5 shadow-[0_0_50px_rgba(20,184,166,0.05)]"
                  }`}
                >
                  <div className="mb-8 flex flex-col justify-between gap-6 text-right md:flex-row md:items-center">
                    <div>
                      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">المسار المحسوم بالنظام</div>
                      <h2 className="mb-4 text-5xl font-black italic tracking-tighter text-white">{renderedPathName}</h2>
                    </div>
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 shadow-inner">
                      <div
                        className={`h-8 w-8 animate-pulse rounded-full blur-xl ${
                          renderedPathId === "path_protection"
                            ? "bg-red-500"
                            : renderedPathId === "path_detox"
                              ? "bg-zinc-400"
                              : "bg-teal-400"
                        }`}
                      />
                    </div>
                  </div>
                  <p className="max-w-2xl border-r-4 border-zinc-800 pr-6 text-right text-xl font-medium italic leading-relaxed text-zinc-400">
                    {renderedDescription}
                  </p>
                </div>

                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {renderedPlan.steps.map((step) => (
                    <Card key={step.id} title={`الأسبوع ${step.week}: ${step.title}`}>
                      <p className="mb-4 text-xs font-bold leading-relaxed text-zinc-500">{step.description}</p>
                      <div className="space-y-3">
                        {step.actions.map((action) => (
                          <div key={action.id} className="flex gap-3 text-right text-xs">
                            <span className="text-teal-500">✦</span>
                            <span className="font-medium text-zinc-300">{action.text}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4">
                        <span className="text-[10px] font-black uppercase text-zinc-600">معايير النجاح</span>
                        <span className="text-[10px] font-bold text-teal-500">{step.successCriteria}</span>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card title="بصائر الذكاء الاصطناعي السيادي">
                  <ul className="space-y-4">
                    {renderedInsights.map((insight, index) => (
                      <li key={`${insight}-${index}`} className="flex items-start gap-4 text-right">
                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,1)]" />
                        <p className="text-sm font-bold leading-relaxed text-zinc-300">{insight}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ) : null}

            {activeTab === "trace" ? (
              <Card title="مسار اتخاذ القرار (رؤية المعماري)">
                <LogicTrace
                  zone={zone}
                  contact={contact}
                  isSOS={isSOS}
                  symptomType={renderedSymptomType}
                  pathId={renderedPathId}
                />
              </Card>
            ) : null}

            {activeTab === "prompt" ? (
              <Card title="سياق الذكاء الاصطناعي (أوامر المولد)">
                <PromptConsole prompt={renderedPrompt} />
              </Card>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <span className="text-[10px] font-black uppercase text-zinc-600">سرعة المعالجة</span>
            <span className="text-[10px] font-mono text-teal-500">{isRunningInference ? "جاري..." : "API جاهز"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <span className="text-[10px] font-black uppercase text-zinc-600">دقة الأنماط</span>
            <span className="text-[10px] font-mono text-teal-500">
              {renderedPatterns[0]?.confidence ? `${(renderedPatterns[0].confidence! * 100).toFixed(0)}%` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <span className="text-[10px] font-black uppercase text-zinc-600">الوضع الحالي</span>
            <span className="text-[10px] font-mono text-teal-500">{serverResult ? "متصل بالـ API" : "محلي"}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <span className="text-[10px] font-black uppercase text-zinc-600">وحدة الإرسال</span>
            <span className="text-[10px] font-mono text-teal-500">{whatsAppStatus ? "واتساب شغال" : "جاهز"}</span>
          </div>
        </div>
      </div>

      <footer className="mt-20 border-t border-zinc-900 py-12 text-center text-[10px] font-black uppercase tracking-[1em] text-zinc-700 opacity-40">
        محرك مسارات // فلسفة حية
      </footer>
    </div>
  );
}
