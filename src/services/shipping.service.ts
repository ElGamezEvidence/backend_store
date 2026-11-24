import type { ShippingType } from "@prisma/client";
import { toNumber } from "../lib/money";
import { shippingRepository } from "../repositories/shipping.repository";

const DEFAULT_HOME_FEE = 0;
const DEFAULT_PICKUP_FEE = 0;

export class ShippingService {
  listZones() {
    return shippingRepository.listZones(true);
  }

  listMethods() {
    return shippingRepository.listMethods(true);
  }

  async calculateFee(region: string, city: string, shippingType: ShippingType) {
    const zone =
      (await shippingRepository.findZone(region, city)) ??
      (await shippingRepository.findZoneByCity(city));

    if (!zone) {
      if (shippingType === "PICKUP_POINT") {
        return {
          fee: DEFAULT_PICKUP_FEE,
          zone: null,
          estimatedDaysMin: 2,
          estimatedDaysMax: 5,
        };
      }
      return {
        fee: DEFAULT_HOME_FEE,
        zone: null,
        estimatedDaysMin: 2,
        estimatedDaysMax: 5,
      };
    }

    if (shippingType === "PICKUP_POINT") {
      if (!zone.pickupAvailable || zone.pickupPointFee == null) {
        throw new Error("PICKUP_NOT_AVAILABLE");
      }
      return {
        fee: toNumber(zone.pickupPointFee),
        zone,
        estimatedDaysMin: zone.estimatedDaysMin,
        estimatedDaysMax: zone.estimatedDaysMax,
      };
    }

    return {
      fee: toNumber(zone.homeDeliveryFee),
      zone,
      estimatedDaysMin: zone.estimatedDaysMin,
      estimatedDaysMax: zone.estimatedDaysMax,
    };
  }
}

export const shippingService = new ShippingService();
