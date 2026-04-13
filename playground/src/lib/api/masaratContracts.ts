import {
  buildAIPlanPrompt,
  generateDynamicPlan,
  resolvePathId,
  symptomIdsToSymptomType,
  analyzeSituations,
  PATH_DESCRIPTIONS,
  PATH_NAMES,
  type ContactLevel,
  type Ring,
} from "@alrehla/masarat";
import type { DetectedPattern, DynamicRecoveryPlan, PathId, PatternAnalysisResult } from "@alrehla/masarat";

export interface MasaratInferenceRequest {
  personLabel: string;
  zone: Ring;
  contact: ContactLevel;
  isSOS?: boolean;
  symptoms?: string[];
  situations?: string[];
}

export interface MasaratInferenceResponse {
  personLabel: string;
  pathId: PathId;
  pathName: string;
  pathDescription: string;
  symptomType: ReturnType<typeof symptomIdsToSymptomType>;
  patternAnalysis: PatternAnalysisResult;
  plan: DynamicRecoveryPlan;
  aiPrompt: string;
}

function isRing(value: unknown): value is Ring {
  return value === "red" || value === "yellow" || value === "green";
}

function isContactLevel(value: unknown): value is ContactLevel {
  return value === "high" || value === "medium" || value === "low" || value === "none";
}

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseInferencePayload(payload: unknown): MasaratInferenceRequest {
  if (!payload || typeof payload !== "object") {
    throw new Error("Body لازم يكون JSON object.");
  }

  const candidate = payload as Record<string, unknown>;
  const personLabel =
    typeof candidate.personLabel === "string" && candidate.personLabel.trim().length > 0
      ? candidate.personLabel.trim()
      : "الشخص";

  if (!isRing(candidate.zone)) {
    throw new Error("`zone` لازم تكون red أو yellow أو green.");
  }

  if (!isContactLevel(candidate.contact)) {
    throw new Error("`contact` لازم تكون high أو medium أو low أو none.");
  }

  return {
    personLabel,
    zone: candidate.zone,
    contact: candidate.contact,
    isSOS: candidate.isSOS === true,
    symptoms: sanitizeStringList(candidate.symptoms),
    situations: sanitizeStringList(candidate.situations),
  };
}

function normalizeDetectedPatterns(patterns: DetectedPattern[]): DetectedPattern[] {
  return patterns.map((pattern) => ({
    ...pattern,
    confidence:
      typeof pattern.confidence === "number"
        ? pattern.confidence
        : Math.min(0.98, 0.45 + Math.min(pattern.frequency, 5) * 0.1),
  }));
}

export function runMasaratInference(input: MasaratInferenceRequest): MasaratInferenceResponse {
  const symptomType = symptomIdsToSymptomType(input.symptoms ?? []);
  const rawAnalysis = analyzeSituations(input.situations ?? []);
  const patterns = normalizeDetectedPatterns(rawAnalysis.patterns);
  const insights =
    rawAnalysis.insights.length > 0
      ? rawAnalysis.insights
      : [`تم رصد نمط عرض أساسي: ${symptomType}`];

  const pathId = resolvePathId({
    zone: input.zone,
    contact: input.contact,
    isSOS: input.isSOS,
    symptomType,
  });

  const plan = generateDynamicPlan(input.personLabel, input.zone, patterns, insights, []);
  const aiPrompt = buildAIPlanPrompt(
    input.personLabel,
    input.zone,
    patterns,
    input.situations ?? [],
    insights,
    []
  );

  return {
    personLabel: input.personLabel,
    pathId,
    pathName: PATH_NAMES[pathId],
    pathDescription: PATH_DESCRIPTIONS[pathId],
    symptomType,
    patternAnalysis: {
      ...rawAnalysis,
      patterns,
      primaryPattern: patterns[0] ?? null,
    },
    plan,
    aiPrompt,
  };
}
