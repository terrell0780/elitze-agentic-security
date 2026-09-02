import { NextRequest } from "next/server";
import { continuouslyAuthorize } from "@/lib/elitze-secure/continuous-identity";

export async function POST(request: NextRequest) {
  return Response.json(continuouslyAuthorize(await request.json()));
}
