import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.storeSettings.findFirst();
  const data = {
    storeName: "Soukly",
    description: "Soukly — boutique marocaine COD. Produits utiles livrés partout au Maroc.",
    email: "contact@soukly.ma",
    heroTitle: "Votre souk en ligne, livré partout au Maroc",
    heroSubtitle:
      "Commandez simplement, payez à la livraison. Confirmation téléphonique avant l'envoi.",
    promoBannerText: "Livraison COD disponible dans toutes les grandes villes",
    seoTitle: "Soukly | Achat COD Maroc",
    seoDescription:
      "Boutique e-commerce COD au Maroc. Paiement à la livraison, suivi manuel Tajir COD.",
  };

  if (existing) {
    await prisma.storeSettings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.storeSettings.create({ data });
  }

  // Keep existing admin working + ensure soukly admin alias if needed
  const admin = await prisma.user.findFirst({
    where: { email: { in: ["admin@ghazala.store", "admin@soukly.ma"] } },
  });
  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { name: "Soukly Admin" },
    });
  }

  console.log("Brand updated to Soukly");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
