import { settingsRepository } from "../repositories/settings.repository";

export class SettingsService {
  get() {
    return settingsRepository.get();
  }

  update(data: Parameters<typeof settingsRepository.update>[0]) {
    return settingsRepository.update(data);
  }
}

export const settingsService = new SettingsService();
