import { NextResponse } from "next/server";
import { parseWhatsAppPayload, sendWhatsAppMessage } from "@/lib/api/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = parseWhatsAppPayload(body);
    const result = await sendWhatsAppMessage(payload);

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
    const message = error instanceof Error ? error.message : "Unknown WhatsApp error.";
    const status = message.includes("credentials") ? 500 : 400;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status,
      }
    );
  }
}
