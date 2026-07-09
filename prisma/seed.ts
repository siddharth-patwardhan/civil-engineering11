import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const standards = [
    {
      id: "seed-is456-cover-slab",
      code: "IS456",
      section: "26.4",
      category: "clear_cover",
      title: "Nominal cover — slab",
      value: { slab: 20 },
      unit: "mm",
      sourceCitation: "IS 456:2000 nominal cover (illustrative seed)",
    },
    {
      id: "seed-is456-cover-beam",
      code: "IS456",
      section: "26.4",
      category: "clear_cover",
      title: "Nominal cover — beam",
      value: { beam: 25 },
      unit: "mm",
      sourceCitation: "IS 456:2000 nominal cover (illustrative seed)",
    },
    {
      id: "seed-is456-cover-column",
      code: "IS456",
      section: "26.4",
      category: "clear_cover",
      title: "Nominal cover — column",
      value: { column: 40 },
      unit: "mm",
      sourceCitation: "IS 456:2000 nominal cover (illustrative seed)",
    },
    {
      id: "seed-is456-cover-footing",
      code: "IS456",
      section: "26.4",
      category: "clear_cover",
      title: "Nominal cover — footing",
      value: { footing: 50 },
      unit: "mm",
      sourceCitation: "IS 456:2000 nominal cover (illustrative seed)",
    },
    {
      id: "seed-is456-grade-mild",
      code: "IS456",
      section: "8.2",
      category: "concrete_grade",
      title: "Minimum grade mild exposure",
      value: { minGrade: "M20" },
      sourceCitation: "Illustrative seed — verify on project",
    },
    {
      id: "seed-is456-grade-severe",
      code: "IS456",
      section: "8.2",
      category: "concrete_grade",
      title: "Minimum grade severe exposure",
      value: { minGrade: "M30" },
      sourceCitation: "Illustrative seed — verify on project",
    },
  ];

  for (const s of standards) {
    await prisma.isStandard.upsert({
      where: { id: s.id },
      create: s,
      update: {
        title: s.title,
        value: s.value,
        category: s.category,
        sourceCitation: s.sourceCitation,
      },
    });
  }

  const user = await prisma.user.upsert({
    where: { email: "seed@local.test" },
    create: { email: "seed@local.test", name: "Seed User" },
    update: { name: "Seed User" },
  });

  const org = await prisma.organization.upsert({
    where: { id: "seed-org-1" },
    create: {
      id: "seed-org-1",
      name: "Seed Organization",
      members: { create: { userId: user.id, role: "SUPER_ADMIN" } },
    },
    update: { name: "Seed Organization" },
  });

  await prisma.organizationMember.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    create: { userId: user.id, orgId: org.id, role: "SUPER_ADMIN" },
    update: {},
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    create: {
      id: "seed-project-1",
      orgId: org.id,
      name: "Seed Civil Project",
      clientName: "Seed Client",
      location: "Demo Site",
      isStandardsVersion: "IS 456:2000",
    },
    update: {},
  });

  await prisma.projectMember.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: user.id },
    },
    create: { projectId: project.id, userId: user.id, role: "OWNER" },
    update: {},
  });

  const existingBook = await prisma.rateBook.findFirst({
    where: { orgId: org.id, name: "Default Schedule 2025" },
  });
  if (!existingBook) {
    await prisma.rateBook.create({
      data: {
        orgId: org.id,
        name: "Default Schedule 2025",
        effectiveFrom: new Date("2025-01-01"),
        items: {
          create: [
            { code: "EXC", description: "Bulk excavation", unit: "m³", rate: 15 },
            { code: "CONC", description: "RCC M25", unit: "m³", rate: 250 },
          ],
        },
      },
    });
  }

  const equipmentSeed = [
    { name: "Concrete Vibrator", category: "concreting", rentalRate: 800, unit: "day", capacity: "1.5 kW" },
    { name: "Transit Mixer 6 cum", category: "concreting", rentalRate: 4500, unit: "day", capacity: "6 m³" },
    { name: "Batching Plant", category: "concreting", rentalRate: 12000, unit: "day", capacity: "30 m³/hr" },
    { name: "Excavator JCB", category: "earthwork", rentalRate: 8500, unit: "day", capacity: "0.8 cum bucket" },
    { name: "Tower Crane", category: "lifting", rentalRate: 25000, unit: "day", capacity: "50 m reach" },
    { name: "Plate Compactor", category: "earthwork", rentalRate: 600, unit: "day", capacity: "100 kg" },
    { name: "Concrete Pump", category: "concreting", rentalRate: 150, unit: "m³", capacity: "90 m³/hr" },
    { name: "Bar Bending Machine", category: "steel", rentalRate: 1200, unit: "day", capacity: "32 mm max" },
  ];

  for (const eq of equipmentSeed) {
    const exists = await prisma.equipmentMaster.findFirst({
      where: { orgId: org.id, name: eq.name },
    });
    if (!exists) {
      await prisma.equipmentMaster.create({
        data: { orgId: org.id, ...eq, rentalRate: eq.rentalRate },
      });
    }
  }

  const materialSeed = [
    { code: "CEM-53", name: "OPC 53 Grade Cement", category: "cement", unit: "bag", rate: 420 },
    { code: "AGG-20", name: "Coarse Aggregate 20mm", category: "aggregate", unit: "m³", rate: 1200 },
    { code: "STEEL-T16", name: "HYSD Steel T16", category: "steel", unit: "kg", rate: 72 },
    { code: "SAND", name: "River Sand (fine)", category: "sand", unit: "m³", rate: 1800 },
  ];
  for (const mat of materialSeed) {
    const exists = await prisma.materialMaster.findFirst({ where: { orgId: org.id, code: mat.code } });
    if (!exists) {
      await prisma.materialMaster.create({
        data: {
          orgId: org.id,
          code: mat.code,
          name: mat.name,
          category: mat.category,
          unit: mat.unit,
          rates: { create: { rate: mat.rate, effectiveFrom: new Date() } },
        },
      });
    }
  }

  const labourSeed = [
    { name: "Mason (skilled)", dailyRate: 900, skillLevel: "skilled", productivityUnit: "m³/day", productivityRate: 2.5 },
    { name: "Helper (unskilled)", dailyRate: 550, skillLevel: "unskilled", productivityUnit: "m³/day", productivityRate: 4 },
    { name: "Bar bender", dailyRate: 850, skillLevel: "skilled", productivityUnit: "kg/day", productivityRate: 400 },
    { name: "Concreter", dailyRate: 750, skillLevel: "semi_skilled", productivityUnit: "m³/day", productivityRate: 3 },
  ];
  for (const lb of labourSeed) {
    const exists = await prisma.labourCategory.findFirst({ where: { orgId: org.id, name: lb.name } });
    if (!exists) {
      await prisma.labourCategory.create({ data: { orgId: org.id, ...lb, dailyRate: lb.dailyRate, productivityRate: lb.productivityRate } });
    }
  }

  await prisma.notification.deleteMany({
    where: { userId: user.id, title: "Welcome (seed)" },
  });
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Welcome (seed)",
      body: "Database seeded. POST /api/auth/dev-session to obtain a token.",
      read: false,
    },
  });

  console.log("Seed OK", { user: user.email, project: project.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
