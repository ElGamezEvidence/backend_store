import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.shippingZone.updateMany({
    data: {
      homeDeliveryFee: 0,
      pickupPointFee: 0,
    },
  });
  console.log(`Zones mises à jour: ${result.count} (frais = 0 MAD)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
