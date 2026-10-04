import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");
const lib=read("src/lib/elitze-reo/trust-ownership.ts");
const route=read("src/app/api/reo/trust-ownership/route.ts");
for(const id of ["ownership.identity","authorship.verification","copyright.rights","provenance.attribution","claims.evidence","advertising.claims","google.affiliation","third-party.marks","privacy.notice","terms.notice"]) assert.match(lib,new RegExp(id.replace(".","\\.")));
assert.match(route,/evaluateTrustOwnership/);
console.log("trust-ownership:self-test PASS");
