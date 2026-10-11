import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const braces = require("braces");

const nest = (n) => "{".repeat(n) + "}".repeat(n);
const isDepthError = (error) =>
  error instanceof RangeError &&
  /maximum nesting depth/i.test(error.message);

assert.throws(() => braces.compile(nest(3500)), isDepthError);
assert.throws(() => braces.expand(nest(3500)), isDepthError);

assert.deepEqual(
  braces.expand("a{1..3}b{c,d}"),
  ["a1bc", "a1bd", "a2bc", "a2bd", "a3bc", "a3bd"],
);
assert.deepEqual(braces("{a,b{1..2}}"), ["(a|b(1|2))"]);
assert.doesNotThrow(() => braces.compile(nest(32)));
assert.throws(() => braces.compile(nest(200), { maxDepth: 100 }), isDepthError);

console.log("ELITZE braces security self-test: PASS — nested-pattern stack exhaustion is bounded");
