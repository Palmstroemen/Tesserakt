export type SystemId =
  | "westlich"
  | "hellenistisch"
  | "bazi"
  | "numerologie"
  | "kabbalah"
  | "arabisch"
  | "vedisch"
  | "ko";

export interface VisualBundleV1 {
  schemaVersion: "1.0";
  sessionId: string;
  generatedAt: string;
  systems: SystemVisualEntryV1[];
}

export interface SystemVisualEntryV1 {
  systemId: SystemId;
  displayName: string;
  scores: ScoreBlock;
  qualityFlags: QualityFlags;
  explanation: ExplanationBlock;
  visualPayload: RadixWheelPayload | FourPillarsPayload | GenericPayload;
}

export interface ScoreBlock {
  fit: number;
  randomAdvantage: number;
  deltaFitToKO: number;
  deltaRandomAdvantageToKO: number;
}

export interface QualityFlags {
  birthTimeKnown: boolean;
  modelType: "computed" | "imported" | "manual";
  ephemerisMode: "precise" | "simplified" | "na";
}

export interface ExplanationBlock {
  short: string;
  long?: string;
}

export interface GenericPayload {
  chartType: string;
  [key: string]: unknown;
}

export interface RadixWheelPayload {
  chartType: "radixWheel";
  zodiac: {
    type: "tropical" | "sidereal" | string;
    startAngleDeg: number;
    signs: ZodiacSign[];
  };
  houses: {
    system: string;
    cuspsDeg: number[];
    anglesDeg: {
      asc: number;
      mc: number;
      dc: number;
      ic: number;
    };
  };
  planets: PlanetPoint[];
  aspects: AspectLine[];
  chronokrators?: {
    profections?: {
      age: number;
      activeHouse: number;
      activeSignId: string;
      lordPlanetId: string;
    };
  };
  sect?: {
    isDayChart: boolean;
    sectLight: "sun" | "moon" | string;
    notes?: string;
  };
  lots?: LotPoint[];
  renderHints?: {
    showAspectGrid?: boolean;
    showMinorAspects?: boolean;
    [key: string]: unknown;
  };
}

export interface ZodiacSign {
  id: string;
  startDeg: number;
  endDeg: number;
  label: string;
}

export interface PlanetPoint {
  id: string;
  label: string;
  longitudeDeg: number;
  signId: string;
  house?: number;
  retrograde?: boolean;
}

export interface AspectLine {
  a: string;
  b: string;
  type: "conjunction" | "sextile" | "square" | "trine" | "opposition" | string;
  exactAngleDeg: number;
  orbDeg: number;
  applying?: boolean;
}

export interface LotPoint {
  id: string;
  label: string;
  longitudeDeg: number;
  house?: number;
}

export interface FourPillarsPayload {
  chartType: "fourPillars";
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  dayMaster: {
    stem: string;
    element: string;
    strength?: "weak" | "medium" | "strong" | string;
  };
  fiveElements: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  interactions?: ElementInteraction[];
  luckPillars?: LuckPillar[];
  renderHints?: {
    showCycleDiagram?: boolean;
    showElementBars?: boolean;
    [key: string]: unknown;
  };
}

export interface Pillar {
  stem: string;
  branch: string;
  stemElement?: string;
  branchElement?: string;
  estimated?: boolean;
}

export interface ElementInteraction {
  type: "support" | "control" | "drain" | "resonance" | string;
  from: string;
  to: string;
  weight?: number;
}

export interface LuckPillar {
  startAge: number;
  endAge: number;
  stem: string;
  branch: string;
}
