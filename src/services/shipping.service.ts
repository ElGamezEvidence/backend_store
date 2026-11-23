import type { ShippingType } from "@prisma/client";
import { toNumber } from "../lib/money";
import { shippingRepository } from "../repositories/shipping.repository";

export class ShippingService {
  listZones() {
    return shippingRepository.listZones(true);
  }

  listMethods() {
    return shippingRepository.listMethods(true);
  }

  async calculateFee(region: string, city: string, shippingType: ShippingType) {
    const zone = await shippingRepository.findZone(region, city);
    if (!zone) {
      throw new Error("SHIPPING_ZONE_NOT_FOUND");
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
