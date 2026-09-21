const fields = new Set([
  'decisionRef',
  'requestId',
  'subject',
  'decision',
  'evidenceState',
  'stage',
  'nextAction',
  'observedAt',
]);

function tokenize(input) {
  if (input.length > 500) throw new Error('expression_too_long');
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) { i += 1; continue; }

    const two = input.slice(i, i + 2);
    if (['&&', '||', '==', '!=', '>=', '<='].includes(two)) {
      tokens.push({ kind: 'operator', value: two });
      i += 2;
      continue;
    }
    if (['>', '<', '!'].includes(ch)) {
      tokens.push({ kind: 'operator', value: ch });
      i += 1;
      continue;
    }
    if (ch === '(') { tokens.push({ kind: 'lparen' }); i += 1; continue; }
    if (ch === ')') { tokens.push({ kind: 'rparen' }); i += 1; continue; }

    if (ch === '"') {
      let value = '';
      i += 1;
      let closed = false;
      while (i < input.length) {
        const current = input[i++];
        if (current === '"') { closed = true; break; }
        if (current === '\\') {
          if (i >= input.length) throw new Error('invalid_string');
          const escaped = input[i++];
          const map = { '"': '"', '\\': '\\', n: '\n', r: '\r', t: '\t' };
          value += map[escaped] ?? escaped;
        } else {
          value += current;
        }
      }
      if (!closed) throw new Error('unterminated_string');
      tokens.push({ kind: 'string', value });
      continue;
    }

    if (/[0-9-]/.test(ch)) {
      const match = input.slice(i).match(/^-?\d+(?:\.\d+)?/);
      if (!match) throw new Error('invalid_number');
      tokens.push({ kind: 'number', value: Number(match[0]) });
      i += match[0].length;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      const match = input.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (!match) throw new Error('invalid_identifier');
      const value = match[0];
      if (value === 'true' || value === 'false') tokens.push({ kind: 'boolean', value: value === 'true' });
      else if (value === 'null') tokens.push({ kind: 'null', value: null });
      else tokens.push({ kind: 'identifier', value });
      i += value.length;
      continue;
    }

    throw new Error('invalid_token');
  }

  return tokens;
}

function parse(input) {
  const tokens = tokenize(input);
  let index = 0;
  const peek = () => tokens[index];
  const consume = () => tokens[index++];

  function primary() {
    const token = peek();
    if (!token) throw new Error('expression_incomplete');

    if (token.kind === 'lparen') {
      consume();
      const value = orExpression();
      if (consume()?.kind !== 'rparen') throw new Error('missing_closing_parenthesis');
      return value;
    }

    if (token.kind === 'operator' && token.value === '!') {
      consume();
      return { kind: 'not', expression: primary() };
    }

    if (token.kind === 'boolean') {
      consume();
      return { kind: 'boolean', value: token.value };
    }

    if (token.kind !== 'identifier') throw new Error('field_required');
    consume();

    const field = token.value;
    if (!fields.has(field)) throw new Error('unknown_field:' + token.value);

    const opToken = consume();
    if (!opToken || (opToken.kind !== 'operator' && opToken.kind !== 'identifier')) {
      throw new Error('comparison_operator_required');
    }

    const operator = opToken.value;
    if (!['==', '!=', '>', '>=', '<', '<=', 'contains', 'startsWith', 'endsWith'].includes(operator)) {
      throw new Error('unsupported_operator:' + operator);
    }

    const value = consume();
    if (!value || !['string', 'number', 'boolean', 'null'].includes(value.kind)) {
      throw new Error('comparison_value_required');
    }

    return { kind: 'comparison', field, operator, value: value.value };
  }

  function andExpression() {
    let left = primary();
    while (peek()?.kind === 'operator' && peek()?.value === '&&') {
      consume();
      left = { kind: 'and', left, right: primary() };
    }
    return left;
  }

  function orExpression() {
    let left = andExpression();
    while (peek()?.kind === 'operator' && peek()?.value === '||') {
      consume();
      left = { kind: 'or', left, right: andExpression() };
    }
    return left;
  }

  const ast = orExpression();
  if (index !== tokens.length) throw new Error('unexpected_tokens');
  return ast;
}

function compare(left, operator, right) {
  if (operator === 'contains' || operator === 'startsWith' || operator === 'endsWith') {
    if (typeof left !== 'string' || typeof right !== 'string') return false;
    if (operator === 'contains') return left.includes(right);
    if (operator === 'startsWith') return left.startsWith(right);
    return left.endsWith(right);
  }

  if (operator === '==' || operator === '!=') {
    const equal = left === right;
    return operator === '==' ? equal : !equal;
  }

  if ((typeof left !== 'string' && typeof left !== 'number') || (typeof right !== 'string' && typeof right !== 'number')) {
    return false;
  }

  if (typeof left === 'string' && typeof right === 'string') {
    const comparison = left.localeCompare(right);
    if (operator === '>') return comparison > 0;
    if (operator === '>=') return comparison >= 0;
    if (operator === '<') return comparison < 0;
    return comparison <= 0;
  }

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (operator === '>') return leftNumber > rightNumber;
  if (operator === '>=') return leftNumber >= rightNumber;
  if (operator === '<') return leftNumber < rightNumber;
  return leftNumber <= rightNumber;
}

export function parseEvidenceExpression(input) {
  return parse(input);
}

export function evaluateEvidenceExpression(input, record) {
  return evaluateEvidenceExpressionAst(parse(input), record);
}

export function evaluateEvidenceExpressionAst(ast, record) {
  switch (ast.kind) {
    case 'boolean': return ast.value;
    case 'not': return !evaluateEvidenceExpressionAst(ast.expression, record);
    case 'and': return evaluateEvidenceExpressionAst(ast.left, record) && evaluateEvidenceExpressionAst(ast.right, record);
    case 'or': return evaluateEvidenceExpressionAst(ast.left, record) || evaluateEvidenceExpressionAst(ast.right, record);
    case 'comparison': return compare(record[ast.field], ast.operator, ast.value);
    default: throw new Error('invalid_expression_ast');
  }
}
