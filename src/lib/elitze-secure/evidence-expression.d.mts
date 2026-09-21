export type EvidenceExpressionRecord = {
  decisionRef: string;
  requestId: string;
  subject: string;
  decision: string;
  evidenceState: string;
  stage: string;
  nextAction: string;
  observedAt: string | null;
};

export function parseEvidenceExpression(input: string): unknown;
export function evaluateEvidenceExpression(input: string, record: EvidenceExpressionRecord): boolean;
export function evaluateEvidenceExpressionAst(ast: unknown, record: EvidenceExpressionRecord): boolean;
