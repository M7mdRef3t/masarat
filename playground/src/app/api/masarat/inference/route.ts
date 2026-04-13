import { NextResponse } from "next/server";
import { parseInferencePayload, runMasaratInference } from "@/lib/api/masaratContracts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseInferencePayload(body);
    const result = runMasaratInference(payload);

    return NextResponse.json(
      {
        ok: true,
        data: result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown inference error.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status: 400,
      }
    );
  }
}
