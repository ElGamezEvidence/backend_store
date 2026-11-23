import { prisma } from "../lib/prisma";

export class SettingsRepository {
  async get() {
    const existing = await prisma.storeSettings.findFirst();
    if (existing) return existing;
    return prisma.storeSettings.create({ data: {} });
  }

  async update(data: Parameters<typeof prisma.storeSettings.update>[0]["data"]) {
    const current = await this.get();
    return prisma.storeSettings.update({ where: { id: current.id }, data });
  }
}

export const settingsRepository = new SettingsRepository();
