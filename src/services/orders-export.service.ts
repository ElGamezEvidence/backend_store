import ExcelJS from "exceljs";
import type { Order, OrderItem, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { toNumber } from "../lib/money";

type OrderWithItems = Order & { items: OrderItem[] };

const HEADERS = [
  "full_name",
  "phone",
  "address",
  "note",
  "delivery_note",
  "price",
  "sku",
  "qte",
  "date_order",
] as const;

function formatDateOrder(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${mm}/${dd}/${yyyy}  ${hh}:${min}:${ss}`;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function buildAddress(order: Order) {
  return [order.addressLine, order.city, order.region, order.postalCode]
    .filter(Boolean)
    .join(", ");
}

function deliveryNote(order: Order) {
  const mode = order.shippingType === "HOME" ? "Domicile" : "Point relais";
  return `${mode} - ${order.city}`;
}

function toRows(orders: OrderWithItems[]) {
  const rows: Array<Record<(typeof HEADERS)[number], string | number>> = [];

  for (const order of orders) {
    for (const item of order.items) {
      rows.push({
        full_name: order.customerName,
        phone: normalizePhone(order.customerPhone),
        address: buildAddress(order),
        note: order.notes ?? "",
        delivery_note: deliveryNote(order),
        price: toNumber(item.unitPrice),
        sku: item.sku,
        qte: item.quantity,
        date_order: formatDateOrder(order.createdAt),
      });
    }
  }

  return rows;
}

export class OrdersExportService {
  async exportExcel(filters: {
    status?: OrderStatus;
    query?: string;
    pendingTajir?: boolean;
  } = {}) {
    const where: Prisma.OrderWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.pendingTajir) {
      where.status = { in: ["NEW", "CONFIRMED"] };
      where.sentToTajirAt = null;
    }
    if (filters.query) {
      where.OR = [
        { orderNumber: { contains: filters.query, mode: "insensitive" } },
        { customerName: { contains: filters.query, mode: "insensitive" } },
        { customerPhone: { contains: filters.query } },
        { tajirReference: { contains: filters.query, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Soukly";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("orders");
    sheet.addRow([...HEADERS]);

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    for (const row of toRows(orders)) {
      sheet.addRow(HEADERS.map((key) => row[key]));
    }

    sheet.columns = [
      { key: "full_name", width: 22 },
      { key: "phone", width: 14 },
      { key: "address", width: 40 },
      { key: "note", width: 24 },
      { key: "delivery_note", width: 24 },
      { key: "price", width: 10 },
      { key: "sku", width: 18 },
      { key: "qte", width: 8 },
      { key: "date_order", width: 22 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export const ordersExportService = new OrdersExportService();
