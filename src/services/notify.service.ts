type NewOrderNotify = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  addressLine: string;
  total: number;
  currency?: string;
  items: { name: string; quantity: number }[];
};

function formatOrderMessage(order: NewOrderNotify) {
  const lines = order.items
    .map((i) => `• ${i.name} × ${i.quantity}`)
    .join("\n");
  return [
    `🛒 Nouvelle commande ${order.orderNumber}`,
    "",
    `👤 ${order.customerName}`,
    `📞 ${order.customerPhone}`,
    `📍 ${order.city}`,
    `🏠 ${order.addressLine}`,
    "",
    lines,
    "",
    `💰 Total: ${order.total.toFixed(2)} ${order.currency ?? "MAD"}`,
  ].join("\n");
}

async function sendTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Telegram notify failed:", res.status, body);
    return false;
  }
  return true;
}

/** CallMeBot WhatsApp — https://www.callmebot.com/blog/free-api-whatsapp-messages/ */
async function sendWhatsAppCallMeBot(text: string) {
  const phone = process.env.NOTIFY_WHATSAPP_PHONE?.replace(/\D/g, "");
  const apiKey = process.env.NOTIFY_WHATSAPP_APIKEY?.trim();
  if (!phone || !apiKey) return false;

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", text);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error("WhatsApp notify failed:", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

async function sendWebhook(order: NewOrderNotify, text: string) {
  const webhook = process.env.NOTIFY_WEBHOOK_URL?.trim();
  if (!webhook) return false;

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "order.created", text, order }),
  });
  if (!res.ok) {
    console.error("Webhook notify failed:", res.status);
    return false;
  }
  return true;
}

export class NotifyService {
  /** Fire-and-forget: never throws to the checkout flow. */
  notifyNewOrder(order: NewOrderNotify) {
    const text = formatOrderMessage(order);
    void Promise.allSettled([
      sendTelegram(text),
      sendWhatsAppCallMeBot(text),
      sendWebhook(order, text),
    ]).then((results) => {
      const ok = results.some((r) => r.status === "fulfilled" && r.value === true);
      if (!ok) {
        console.warn(
          "Order notify: aucun canal configuré ou tous en échec. Définis TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (recommandé).",
        );
      }
    });
  }
}

export const notifyService = new NotifyService();
