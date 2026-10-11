import { createHash } from "node:crypto";
import ts from "typescript";

export type AstDiffLanguage = "typescript" | "tsx" | "javascript" | "jsx";
export type AstNodeDelta = { kind: string; before: number; after: number; added: number; removed: number };
export type AstLeafDelta = { kind: string; valueHash: string; before: number; after: number; added: number; removed: number };

export type AstDiffResult = {
  parser: "typescript-compiler-api";
  syntaxState: "VALID" | "PARSE_ERRORS";
  beforeSyntaxErrors: number;
  afterSyntaxErrors: number;
  beforeNodeCount: number;
  afterNodeCount: number;
  addedNodeCount: number;
  removedNodeCount: number;
  nodeDeltas: AstNodeDelta[];
  changedLeafTokenCount: number;
  leafTokenDeltas: AstLeafDelta[];
  truth_state: "INFERRED" | "UNMEASURABLE";
  note: string;
};

function scriptKind(language: AstDiffLanguage): ts.ScriptKind {
  if (language === "tsx") return ts.ScriptKind.TSX;
  if (language === "jsx") return ts.ScriptKind.JSX;
  if (language === "javascript") return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function parse(code: string, language: AstDiffLanguage) {
  const fileName = language === "tsx" ? "input.tsx" : language === "jsx" ? "input.jsx" : language === "javascript" ? "input.js" : "input.ts";
  const source = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, scriptKind(language));
  const counts = new Map<string, number>();
  const leafTokens = new Map<string, { kind: string; valueHash: string; count: number }>();
  let nodeCount = 0;
  const visit = (node: ts.Node) => {
    nodeCount += 1;
    const kind = ts.SyntaxKind[node.kind] ?? "Unknown";
    counts.set(kind, (counts.get(kind) ?? 0) + 1);
    if (node.kind !== ts.SyntaxKind.SourceFile && node.getChildCount(source) === 0) {
      const text = node.getText(source).trim();
      if (text) {
        const valueHash = createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);
        const key = kind + ":" + valueHash;
        const existing = leafTokens.get(key);
        leafTokens.set(key, { kind, valueHash, count: (existing?.count ?? 0) + 1 });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  const parseDiagnostics = (source as ts.SourceFile & { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? [];
  return { counts, leafTokens, nodeCount, syntaxErrors: parseDiagnostics.length };
}

export function compareAstStructure(before: string, after: string, language: AstDiffLanguage): AstDiffResult {
  const oldTree = parse(before, language);
  const newTree = parse(after, language);
  const kinds = new Set([...oldTree.counts.keys(), ...newTree.counts.keys()]);
  const nodeDeltas: AstNodeDelta[] = [...kinds].map((kind) => {
    const oldCount = oldTree.counts.get(kind) ?? 0;
    const newCount = newTree.counts.get(kind) ?? 0;
    return { kind, before: oldCount, after: newCount, added: Math.max(0, newCount - oldCount), removed: Math.max(0, oldCount - newCount) };
  }).filter((item) => item.added > 0 || item.removed > 0)
    .sort((a, b) => (b.added + b.removed) - (a.added + a.removed) || a.kind.localeCompare(b.kind))
    .slice(0, 30);

  const leafKeys = new Set([...oldTree.leafTokens.keys(), ...newTree.leafTokens.keys()]);
  const leafTokenDeltas: AstLeafDelta[] = [...leafKeys].map((key) => {
    const oldToken = oldTree.leafTokens.get(key);
    const newToken = newTree.leafTokens.get(key);
    const beforeCount = oldToken?.count ?? 0;
    const afterCount = newToken?.count ?? 0;
    return {
      kind: newToken?.kind ?? oldToken?.kind ?? "Unknown",
      valueHash: newToken?.valueHash ?? oldToken?.valueHash ?? "",
      before: beforeCount,
      after: afterCount,
      added: Math.max(0, afterCount - beforeCount),
      removed: Math.max(0, beforeCount - afterCount),
    };
  }).filter((item) => item.added > 0 || item.removed > 0)
    .sort((a, b) => (b.added + b.removed) - (a.added + a.removed) || a.kind.localeCompare(b.kind))
    .slice(0, 50);

  const beforeSyntaxErrors = oldTree.syntaxErrors;
  const afterSyntaxErrors = newTree.syntaxErrors;
  const syntaxValid = beforeSyntaxErrors === 0 && afterSyntaxErrors === 0;
  const addedNodeCount = Math.max(0, newTree.nodeCount - oldTree.nodeCount);
  const removedNodeCount = Math.max(0, oldTree.nodeCount - newTree.nodeCount);

  return {
    parser: "typescript-compiler-api",
    syntaxState: syntaxValid ? "VALID" : "PARSE_ERRORS",
    beforeSyntaxErrors,
    afterSyntaxErrors,
    beforeNodeCount: oldTree.nodeCount,
    afterNodeCount: newTree.nodeCount,
    addedNodeCount,
    removedNodeCount,
    nodeDeltas,
    changedLeafTokenCount: leafTokenDeltas.reduce((total, item) => total + item.added + item.removed, 0),
    leafTokenDeltas,
    truth_state: syntaxValid ? "INFERRED" : "UNMEASURABLE",
    note: syntaxValid
      ? "AST node-count and hashed leaf-token delta only. This is not a semantic-equivalence proof, security verdict, patch validation or regression test. Token values are hashed and not returned."
      : "At least one source revision has parser errors. Structural comparison is incomplete and must not be treated as validated.",
  };
}
