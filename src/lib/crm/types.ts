export type LeadIntent = "buy" | "invest" | "rent" | "sell";
export type Timeline =
  | "immediate"
  | "within_1_month"
  | "within_3_months"
  | "within_6_months"
  | "just_exploring";
export type PaymentMethod = "cash" | "mortgage" | "undecided";
export type Temperature = "hot" | "warm" | "cold";

export interface LeadRequirements {
  /**
   * Fields the lead has actively declined to narrow ("any", "you suggest"),
   * or that we asked about and moved past. Never asked again.
   */
  skipped?: string[];
  /** Free text the lead gave for when they are available. */
  preferredTime?: string;
  intent?: LeadIntent;
  budgetMin?: number;
  budgetMax?: number;
  community?: string;
  propertyType?: string;
  bedrooms?: number;
  marketType?: "off_plan" | "ready";
  purpose?: "end_use" | "investment";
  timeline?: Timeline;
  payment?: PaymentMethod;
  nationality?: string;
  expectedRoi?: string;
}

export interface ChatTurn {
  role: "assistant" | "lead";
  text: string;
  at: string;
}

export interface ScoreBreakdown {
  label: string;
  points: number;
}

export interface RecommendedProperty {
  slug: string;
  title: string;
  community: string;
  price: string;
  priceQualifier: string;
  bedrooms: number;
  type: string;
  matchPercentage: number;
  reason: string;
  expectedYield?: string;
  paymentPlan?: string;
  handover?: string;
  image?: string;
}

export interface Lead {
  /**
   * The question currently on the table, so a bare "2" can be resolved
   * against the options we offered and a stalled question can be dropped
   * rather than repeated.
   */
  pending?: { key: string; options: string[]; asks: number };
  id: string;
  visitorId: string;
  name?: string;
  phone?: string;
  requirements: LeadRequirements;
  score: number;
  temperature: Temperature;
  breakdown: ScoreBreakdown[];
  conversation: ChatTurn[];
  recommended: RecommendedProperty[];
  stage: string;
  nextAction: string;
  summary: string;
  viewingRequested: boolean;
  callRequested?: boolean;
  createdAt: string;
  updatedAt: string;
}
