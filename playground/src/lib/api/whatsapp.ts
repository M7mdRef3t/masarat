export interface WhatsAppSendRequest {
  to: string;
  message: string;
}

export interface WhatsAppSendResponse {
  provider: "mock" | "meta";
  delivered: boolean;
  messageId: string;
  to: string;
}

function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function createMessageId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function parseWhatsAppPayload(payload: unknown): WhatsAppSendRequest {
  if (!payload || typeof payload !== "object") {
    throw new Error("Body لازم يكون JSON object.");
  }

  const candidate = payload as Record<string, unknown>;
  const to = typeof candidate.to === "string" ? normalizePhoneNumber(candidate.to) : "";
  const message = typeof candidate.message === "string" ? candidate.message.trim() : "";

  if (to.length < 10) {
    throw new Error("رقم الواتساب لازم يكون صالح.");
  }

  if (message.length === 0) {
    throw new Error("الرسالة فاضية.");
  }

  if (message.length > 4096) {
    throw new Error("الرسالة أطول من الحد المسموح.");
  }

  return { to, message };
}

async function sendViaMetaCloudApi(input: WhatsAppSendRequest): Promise<WhatsAppSendResponse> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("Meta WhatsApp credentials are missing.");
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: "text",
      text: {
        preview_url: false,
        body: input.message,
      },
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to send WhatsApp message.");
  }

  return {
    provider: "meta",
    delivered: true,
    messageId: data.messages?.[0]?.id || createMessageId("wa"),
    to: input.to,
  };
}

async function sendViaMockProvider(input: WhatsAppSendRequest): Promise<WhatsAppSendResponse> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {
    provider: "mock",
    delivered: true,
    messageId: createMessageId("mock"),
    to: input.to,
  };
}

export async function sendWhatsAppMessage(input: WhatsAppSendRequest): Promise<WhatsAppSendResponse> {
  const provider = process.env.WHATSAPP_PROVIDER?.toLowerCase() === "meta" ? "meta" : "mock";

  if (provider === "meta") {
    return sendViaMetaCloudApi(input);
  }

  return sendViaMockProvider(input);
}
