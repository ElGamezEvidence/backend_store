import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@soukly.ma").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeAdmin123!";
  const name = process.env.SEED_ADMIN_NAME ?? "Soukly Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, role: Role.SUPER_ADMIN, isActive: true },
    create: {
      email,
      name,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.storeSettings.deleteMany();
  await prisma.storeSettings.create({
    data: {
      storeName: "Soukly",
      description: "Soukly — boutique marocaine COD. Produits utiles livrés partout au Maroc.",
      phone: "+212610364897",
      whatsapp: "+212610364897",
      email: "issamgamez17@gmail.com",
      currency: "MAD",
      defaultLocale: "fr",
      tajirCodUrl: "https://tajir.ma",
      heroImageUrl: "/hero-soukly.jpg",
      heroTitle: "Votre souk en ligne, livré partout au Maroc",
      heroSubtitle: "Commandez simplement, payez à la livraison. Confirmation téléphonique avant l'envoi.",
      promoBannerText: "Livraison COD disponible dans toutes les grandes villes",
      seoTitle: "Soukly | Achat COD Maroc",
      seoDescription: "Boutique e-commerce COD au Maroc. Paiement à la livraison, suivi manuel Tajir COD.",
    },
  });

  await prisma.shippingMethod.deleteMany();
  await prisma.shippingMethod.createMany({
    data: [
      {
        name: "Livraison à domicile",
        nameAr: "التوصيل إلى المنزل",
        nameEn: "Home delivery",
        type: "HOME",
        isActive: true,
        sortOrder: 1,
      },
      {
        name: "Point relais / Bureau",
        nameAr: "نقطة استلام / مكتب",
        nameEn: "Pickup point",
        type: "PICKUP_POINT",
        isActive: true,
        sortOrder: 2,
      },
    ],
  });

  await prisma.shippingZone.deleteMany();
  await prisma.shippingZone.createMany({
    data: [
      {
        region: "Casablanca-Settat",
        city: "Casablanca",
        homeDeliveryFee: 20,
        pickupPointFee: 15,
        pickupAvailable: true,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
      {
        region: "Rabat-Salé-Kénitra",
        city: "Rabat",
        homeDeliveryFee: 25,
        pickupPointFee: 20,
        pickupAvailable: true,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
      {
        region: "Marrakech-Safi",
        city: "Marrakech",
        homeDeliveryFee: 30,
        pickupPointFee: 25,
        pickupAvailable: true,
        estimatedDaysMin: 2,
        estimatedDaysMax: 4,
      },
      {
        region: "Fès-Meknès",
        city: "Fès",
        homeDeliveryFee: 30,
        pickupPointFee: 25,
        pickupAvailable: false,
        estimatedDaysMin: 2,
        estimatedDaysMax: 5,
      },
      {
        region: "Tanger-Tétouan-Al Hoceïma",
        city: "Tanger",
        homeDeliveryFee: 35,
        pickupPointFee: 30,
        pickupAvailable: true,
        estimatedDaysMin: 2,
        estimatedDaysMax: 5,
      },
    ],
  });

  const beauty = await prisma.category.upsert({
    where: { slug: "beaute-soins" },
    update: {},
    create: {
      name: "Beauté & Soins",
      nameAr: "الجمال والعناية",
      nameEn: "Beauty & Care",
      slug: "beaute-soins",
      description: "Produits de beauté et soins personnels",
      sortOrder: 1,
    },
  });

  const home = await prisma.category.upsert({
    where: { slug: "maison-cuisine" },
    update: {},
    create: {
      name: "Maison & Cuisine",
      nameAr: "المنزل والمطبخ",
      nameEn: "Home & Kitchen",
      slug: "maison-cuisine",
      description: "Gadgets utiles pour la maison",
      sortOrder: 2,
    },
  });

  const auto = await prisma.category.upsert({
    where: { slug: "auto-gadgets" },
    update: {},
    create: {
      name: "Auto & Gadgets",
      nameAr: "السيارات والإلكترونيات",
      nameEn: "Auto & Gadgets",
      slug: "auto-gadgets",
      description: "Accessoires auto et gadgets pratiques",
      sortOrder: 3,
    },
  });

  await prisma.product.deleteMany({ where: { sku: { startsWith: "SEED-" } } });

  const collagen = await prisma.product.create({
    data: {
      name: "Collagen Hair",
      nameAr: "كولاجين الشعر",
      nameEn: "Collagen Hair",
      slug: "collagen-hair",
      shortDescription: "Soin capillaire enrichi au collagène — seed data.",
      description:
        "Produit de démonstration (données fictives de seed). Formule soin pour renforcer l'apparence des cheveux.",
      features: "Texture légère\nParfum agréable\nUsage quotidien",
      price: 149,
      compareAtPrice: 199,
      costPrice: 70,
      sku: "SEED-TH-001",
      status: "ACTIVE",
      isFeatured: true,
      isPopular: true,
      isOnSale: true,
      seoTitle: "Collagen Hair | Soukly",
      seoDescription: "Soin collagène pour cheveux — commande COD Maroc",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800",
            alt: "Collagen Hair",
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          { name: "Rose", sku: "SEED-TH-001-PINK", sortOrder: 0, isAvailable: true },
          { name: "Violet", sku: "SEED-TH-001-PURPLE", sortOrder: 1, isAvailable: true },
        ],
      },
      categories: { create: [{ categoryId: beauty.id }] },
    },
  });

  await prisma.product.create({
    data: {
      name: "TurboClean Portable",
      nameAr: "مكنسة محمولة TurboClean",
      nameEn: "TurboClean Portable",
      slug: "turboclean-portable",
      shortDescription: "Mini aspirateur portable 3-en-1 — seed inspiré du style landing COD.",
      description:
        "Données fictives de développement. Aspirateur portable pour voiture, bureau et espaces étroits. Paiement à la livraison.",
      features: "Aspiration et soufflage\nLéger et portable\nAccessoires inclus",
      price: 159,
      compareAtPrice: 199,
      costPrice: 80,
      sku: "SEED-TC-001",
      status: "ACTIVE",
      isFeatured: true,
      isPopular: true,
      isOnSale: true,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800",
            alt: "TurboClean",
            isPrimary: true,
          },
        ],
      },
      categories: {
        create: [{ categoryId: auto.id }, { categoryId: home.id }],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Diffuseur Aroma Mini",
      nameAr: "جهاز عطور مصغر",
      nameEn: "Mini Aroma Diffuser",
      slug: "diffuseur-aroma-mini",
      shortDescription: "Diffuseur d'ambiance compact — seed data.",
      description: "Produit fictif pour tests. Idéal bureau et chambre.",
      price: 99,
      compareAtPrice: 129,
      sku: "SEED-AR-010",
      status: "ACTIVE",
      isPopular: true,
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800",
            alt: "Diffuseur",
            isPrimary: true,
          },
        ],
      },
      categories: { create: [{ categoryId: home.id }] },
    },
  });

  await prisma.review.create({
    data: {
      productId: collagen.id,
      authorName: "Sara (seed)",
      rating: 5,
      title: "Très satisfaite",
      comment: "Avis fictif de seed pour démonstration UI.",
      status: "APPROVED",
      isFeatured: true,
    },
  });

  console.log("Seed completed.");
  console.log(`Admin: ${email} / ${password}`);
  console.log("All seed products use SKU prefix SEED-");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
