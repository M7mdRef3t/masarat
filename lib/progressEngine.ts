export type StageId = "muwajaha" | "tajalli" | "qiyada" | string;
export type ResponseDepth = "surface" | "medium" | "deep";
export type JourneyProgressStatus = "idle" | "active" | "stage_insight" | "complete";

export interface RecommendedTool {
  id: string;
  label: string;
  description?: string;
  href?: string;
}

export interface JourneyStep {
  id: string;
  stageId: StageId;
  title?: string;
  question: string;
  description?: string;
  recommendedTool?: RecommendedTool;
  metadata?: Record<string, unknown>;
}

export interface StepResponse {
  stepId: string;
  answer: string;
  depth: ResponseDepth;
  durationMs: number;
  recordedAt: number;
  skipped?: boolean;
}

export interface JourneySessionState {
  steps: JourneyStep[];
  currentStepIndex: number;
  responses: StepResponse[];
  adaptiveDepth: ResponseDepth;
  status: JourneyProgressStatus;
  activePathId?: string;
  startedAt?: number | null;
}

export interface JourneyEvent {
  type: "step_completed" | "step_skipped" | "stage_insight_reached" | "journey_completed";
  stepId?: string;
  stageId?: StageId;
  timestamp: number;
  currentStepIndex: number;
  responseDepth?: ResponseDepth;
  adaptiveDepth?: ResponseDepth;
  isComplete?: boolean;
}

export interface JourneyProgressSummary {
  totalSteps: number;
  completedResponses: number;
  currentStepIndex: number;
  progressPercent: number;
  isComplete: boolean;
  currentStageId: StageId | null;
  nextStageId: StageId | null;
  adaptiveDepth: ResponseDepth;
  status: JourneyProgressStatus;
}

export interface JourneyActionResult {
  state: JourneySessionState;
  summary: JourneyProgressSummary;
  events: JourneyEvent[];
}

const clampStepIndex = (index: number, total: number) => total <= 0 ? 0 : Math.max(0, Math.min(index, total));

function resolveStatus(steps: JourneyStep[], previousIndex: number, nextIndex: number): JourneyProgressStatus {
  if (steps.length === 0 || nextIndex >= steps.length) return "complete";
  const previousStage = steps[previousIndex]?.stageId;
  const nextStage = steps[nextIndex]?.stageId;
  return previousStage && nextStage && previousStage !== nextStage ? "stage_insight" : "active";
}

export function calcDepth(durationMs: number): ResponseDepth {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "surface";
  if (durationMs < 3000) return "surface";
  if (durationMs < 12000) return "medium";
  return "deep";
}

export function calcAdaptiveDepth(responses: StepResponse[]): ResponseDepth {
  const answered = responses.filter((r) => !r.skipped && r.answer.trim().length > 0);
  if (answered.length === 0) return "medium";
  const score = answered.reduce((total, r) => total + (r.depth === "deep" ? 3 : r.depth === "medium" ? 2 : 1), 0);
  const average = score / answered.length;
  if (average >= 2.5) return "deep";
  if (average >= 1.5) return "medium";
  return "surface";
}

export function getCurrentStep(state: JourneySessionState): JourneyStep | null {
  return state.steps[state.currentStepIndex] ?? null;
}

export function getProgressSummary(state: JourneySessionState): JourneyProgressSummary {
  const totalSteps = state.steps.length;
  const currentStepIndex = clampStepIndex(state.currentStepIndex, totalSteps);
  const isComplete = totalSteps === 0 || currentStepIndex >= totalSteps || state.status === "complete";
  const currentStep = isComplete ? null : state.steps[currentStepIndex] ?? null;
  const nextStep = isComplete ? null : state.steps[currentStepIndex + 1] ?? null;
  return {
    totalSteps,
    completedResponses: state.responses.filter((r) => !r.skipped).length,
    currentStepIndex,
    progressPercent: totalSteps === 0 ? 0 : Math.round((Math.min(currentStepIndex, totalSteps) / totalSteps) * 100),
    isComplete,
    currentStageId: currentStep?.stageId ?? null,
    nextStageId: nextStep?.stageId ?? null,
    adaptiveDepth: state.adaptiveDepth,
    status: isComplete ? "complete" : state.status,
  };
}

export function advanceStep(state: JourneySessionState, response: Omit<StepResponse, "recordedAt"> & Partial<Pick<StepResponse, "recordedAt">>): JourneyActionResult {
  const currentStep = getCurrentStep(state);
  const stepId = response.stepId || currentStep?.id;
  if (!stepId) {
    const nextState = { ...state, status: "complete" as const };
    return { state: nextState, summary: getProgressSummary(nextState), events: [] };
  }
  const depth = response.depth ?? calcDepth(response.durationMs);
  const recorded: StepResponse = { stepId, answer: response.answer, depth, durationMs: response.durationMs, recordedAt: response.recordedAt ?? Date.now() };
  const responses = [...state.responses, recorded];
  const nextIndex = clampStepIndex(state.currentStepIndex + 1, state.steps.length);
  const adaptiveDepth = calcAdaptiveDepth(responses);
  const status = resolveStatus(state.steps, state.currentStepIndex, nextIndex);
  const nextState: JourneySessionState = { ...state, responses, currentStepIndex: nextIndex, adaptiveDepth, status };
  const events: JourneyEvent[] = [{ type: "step_completed", stepId, stageId: currentStep?.stageId, timestamp: recorded.recordedAt, currentStepIndex: nextIndex, responseDepth: depth, adaptiveDepth, isComplete: status === "complete" }];
  if (status === "stage_insight") events.push({ type: "stage_insight_reached", stepId, stageId: state.steps[nextIndex]?.stageId, timestamp: recorded.recordedAt, currentStepIndex: nextIndex, adaptiveDepth, isComplete: false });
  if (status === "complete") events.push({ type: "journey_completed", stepId, stageId: currentStep?.stageId, timestamp: recorded.recordedAt, currentStepIndex: nextIndex, adaptiveDepth, isComplete: true });
  return { state: nextState, summary: getProgressSummary(nextState), events };
}

export function skipStep(state: JourneySessionState, stepId?: string): JourneyActionResult {
  const currentStep = getCurrentStep(state);
  const resolvedStepId = stepId || currentStep?.id;
  const recordedAt = Date.now();
  if (!resolvedStepId) {
    const nextState = { ...state, status: "complete" as const };
    return { state: nextState, summary: getProgressSummary(nextState), events: [] };
  }
  const skipped: StepResponse = { stepId: resolvedStepId, answer: "", depth: "surface", durationMs: 0, recordedAt, skipped: true };
  const responses = [...state.responses, skipped];
  const nextIndex = clampStepIndex(state.currentStepIndex + 1, state.steps.length);
  const adaptiveDepth = calcAdaptiveDepth(responses);
  const status = resolveStatus(state.steps, state.currentStepIndex, nextIndex);
  const nextState: JourneySessionState = { ...state, responses, currentStepIndex: nextIndex, adaptiveDepth, status };
  const events: JourneyEvent[] = [{ type: "step_skipped", stepId: resolvedStepId, stageId: currentStep?.stageId, timestamp: recordedAt, currentStepIndex: nextIndex, responseDepth: "surface", adaptiveDepth, isComplete: status === "complete" }];
  if (status === "stage_insight") events.push({ type: "stage_insight_reached", stepId: resolvedStepId, stageId: state.steps[nextIndex]?.stageId, timestamp: recordedAt, currentStepIndex: nextIndex, adaptiveDepth, isComplete: false });
  if (status === "complete") events.push({ type: "journey_completed", stepId: resolvedStepId, stageId: currentStep?.stageId, timestamp: recordedAt, currentStepIndex: nextIndex, adaptiveDepth, isComplete: true });
  return { state: nextState, summary: getProgressSummary(nextState), events };
}

export function completeStageInsight(state: JourneySessionState): JourneySessionState {
  return state.status === "stage_insight" ? { ...state, status: "active" } : state;
}
