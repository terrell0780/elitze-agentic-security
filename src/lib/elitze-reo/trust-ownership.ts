export type TrustOwnershipStatus = "PASS" | "REVIEW" | "BLOCK" | "NOT_ASSESSED";

export type TrustOwnershipInput = {
  contentId: string;
  ownerName: string | null;
  ownerContact: string | null;
  authorName: string | null;
  authorVerified: boolean;
  rightsStatus: "OWNED" | "LICENSED" | "AUTHORIZED" | "UNKNOWN" | "THIRD_PARTY";
  sourceAttributionComplete: boolean;
  factualClaimsEvidence: boolean;
  advertisingClaimsReviewed: boolean;
  googleAffiliationClaim: boolean;
  thirdPartyMarksPresent: boolean;
  privacyNoticePresent: boolean;
  termsPresent: boolean;
};

export type TrustOwnershipResult = {
  policyVersion: "2026";
  status: TrustOwnershipStatus;
  controls: Array<{id:string; status:TrustOwnershipStatus; reason:string}>;
  blockers: string[];
};

export function evaluateTrustOwnership(input: TrustOwnershipInput): TrustOwnershipResult {
  const controls: TrustOwnershipResult["controls"] = [];
  const check=(id:string, ok:boolean, reason:string) => controls.push({id,status:ok?"PASS":"BLOCK",reason});

  check("ownership.identity", !!input.ownerName && !!input.ownerContact, "A responsible owner and contact must be identifiable.");
  check("authorship.verification", !!input.authorName && input.authorVerified, "Authorship must be attributable and verified.");
  check("copyright.rights", ["OWNED","LICENSED","AUTHORIZED"].includes(input.rightsStatus), "Published material must have an identified ownership or authorization basis.");
  check("provenance.attribution", input.sourceAttributionComplete, "Third-party sources require provenance and attribution.");
  check("claims.evidence", input.factualClaimsEvidence, "Material factual claims require supporting evidence.");
  check("advertising.claims", input.advertisingClaimsReviewed, "Advertising claims require a documented policy review.");
  check("google.affiliation", !input.googleAffiliationClaim, "Google affiliation cannot be implied without an actual authorized relationship.");
  check("third-party.marks", !input.thirdPartyMarksPresent, "Third-party marks require authorization or an appropriate reference-only use.");
  check("privacy.notice", input.privacyNoticePresent, "Data collection requires an applicable privacy notice.");
  check("terms.notice", input.termsPresent, "Public commercial functionality requires applicable terms.");

  const blockers=controls.filter(c=>c.status==="BLOCK").map(c=>c.id);
  return {policyVersion:"2026",status:blockers.length?"BLOCK":"PASS",controls,blockers};
}
