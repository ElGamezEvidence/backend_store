import type { Order, OrderItem } from "@prisma/client";

type OrderWithItems = Order & { items: OrderItem[] };

export class TajirManualService {
  buildCopyText(order: OrderWithItems): string {
    const lines: string[] = [
      `Numéro de commande interne : ${order.orderNumber}`,
      `Nom du client : ${order.customerName}`,
      `Téléphone : ${order.customerPhone}`,
      `Téléphone secondaire : ${order.customerPhone2 ?? "-"}`,
      `Ville : ${order.city}`,
      `Région : ${order.region}`,
      `Adresse : ${order.addressLine}`,
      `Mode de livraison : ${order.shippingType === "HOME" ? "Domicile" : "Point relais / Bureau"}`,
      `Notes : ${order.notes ?? "-"}`,
      "",
      "Produits :",
    ];

    for (const item of order.items) {
      lines.push(
        `- Produit : ${item.productName}`,
        `  SKU : ${item.sku}`,
        `  Variante : ${item.variantName ?? "-"}`,
        `  Quantité : ${item.quantity}`,
        `  Prix unitaire : ${item.unitPrice} ${order.currency}`,
        `  Total ligne : ${item.lineTotal} ${order.currency}`,
      );
    }

    lines.push(
      "",
      `Sous-total : ${order.subtotal} ${order.currency}`,
      `Livraison : ${order.shippingFee} ${order.currency}`,
      `Total : ${order.total} ${order.currency}`,
    );

    return lines.join("\n");
  }

  canMarkAsSent(order: Order): { ok: boolean; reason?: string } {
    if (order.sentToTajirAt || order.status === "SENT_TO_TAJIR") {
      return { ok: false, reason: "ALREADY_SENT" };
    }
    if (order.status === "CANCELLED" || order.status === "FAILED") {
      return { ok: false, reason: "INVALID_STATUS" };
    }
    return { ok: true };
  }
}

export const tajirManualService = new TajirManualService();
