import crypto from "node:crypto";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name.toLowerCase()}_unconfigured`);
  return value;
}

function awsCredentials() {
  return {
    accessKeyId: required("AWS_ACCESS_KEY_ID"),
    secretAccessKey: required("AWS_SECRET_ACCESS_KEY"),
    sessionToken: process.env.AWS_SESSION_TOKEN?.trim(),
    region: process.env.AWS_REGION?.trim() || "us-east-1",
  };
}

function hmac(key: Buffer | string, value: string) { return crypto.createHmac("sha256", key).update(value).digest(); }
function hex(value: Buffer | string) { return crypto.createHash("sha256").update(value).digest("hex"); }
function signingKey(secret: string, date: string, region: string, service: string) {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function amzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

async function signedAws(service: string, host: string, body: string, contentType: string) {
  const creds = awsCredentials();
  const now = new Date();
  const timestamp = amzDate(now);
  const date = timestamp.slice(0, 8);
  const payloadHash = hex(body);
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-date:${timestamp}\n` + (creds.sessionToken ? `x-amz-security-token:${creds.sessionToken}\n` : "");
  const signedHeaders = `content-type;host;x-amz-date${creds.sessionToken ? ";x-amz-security-token" : ""}`;
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${date}/${creds.region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${scope}\n${hex(canonicalRequest)}`;
  const signature = crypto.createHmac("sha256", signingKey(creds.secretAccessKey, date, creds.region, service)).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(`https://${host}/`, {
    method: "POST",
    headers: {
      "content-type": contentType,
      host,
      "x-amz-date": timestamp,
      ...(creds.sessionToken ? { "x-amz-security-token": creds.sessionToken } : {}),
      authorization,
    },
    body,
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`aws_${service}_http_${response.status}`);
  return text;
}

function form(params: Record<string, string>) {
  return Object.entries(params).map(([key,value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}

export async function observeAws() {
  const creds = awsCredentials();
  const stsXml = await signedAws("sts", `sts.${creds.region}.amazonaws.com`, form({ Action: "GetCallerIdentity", Version: "2011-06-15" }), "application/x-www-form-urlencoded; charset=utf-8");
  const iamXml = await signedAws("iam", "iam.amazonaws.com", form({ Action: "ListRoles", Version: "2010-05-08", MaxItems: "100" }), "application/x-www-form-urlencoded; charset=utf-8");
  const policyXml = await signedAws("iam", "iam.amazonaws.com", form({ Action: "ListPolicies", Version: "2010-05-08", Scope: "Local", MaxItems: "100" }), "application/x-www-form-urlencoded; charset=utf-8");
  const cloudTrailBody = JSON.stringify({ LookupAttributes: [], MaxResults: 50 });
  const cloudTrailJson = await signedAws("cloudtrail", `cloudtrail.${creds.region}.amazonaws.com`, cloudTrailBody, "application/x-amz-json-1.1");
  return { region: creds.region, callerIdentityXml: stsXml, rolesXml: iamXml, policiesXml: policyXml, cloudTrailJson };
}
