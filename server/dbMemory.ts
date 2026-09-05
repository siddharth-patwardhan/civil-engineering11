import { Prisma } from "@prisma/client";

// Helper to wrap numeric values in Decimal-like or Number
function toDec(val: any) {
  if (val == null) return null;
  return new Prisma.Decimal(val);
}

function matchesFilter(row: Record<string, any>, where?: Record<string, any>): boolean {
  if (!where) return true;
  for (const [key, filter] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(filter)) {
      const matchOr = filter.some((subWhere) => matchesFilter(row, subWhere));
      if (!matchOr) return false;
      continue;
    }
    if (key === "AND" && Array.isArray(filter)) {
      const matchAnd = filter.every((subWhere) => matchesFilter(row, subWhere));
      if (!matchAnd) return false;
      continue;
    }
    if (key === "NOT") {
      if (matchesFilter(row, filter)) return false;
      continue;
    }

    const val = row[key];
    if (filter && typeof filter === "object" && !(filter instanceof Date) && !(filter instanceof Prisma.Decimal)) {
      if ("in" in filter && Array.isArray(filter.in)) {
        if (!filter.in.includes(val)) return false;
      } else if ("equals" in filter) {
        if (val !== filter.equals) return false;
      } else if ("not" in filter) {
        if (val === filter.not) return false;
      } else if ("contains" in filter) {
        if (typeof val !== "string" || !val.toLowerCase().includes(String(filter.contains).toLowerCase())) return false;
      } else if ("some" in filter) {
        // relation check handled separately
      }
    } else {
      if (val !== filter) return false;
    }
  }
  return true;
}

const SEED_USER_ID = "11111111-1111-4111-8111-111111111111";
const DEV_USER_ID = "22222222-2222-4222-8222-222222222222";
const SEED_ORG_ID = "33333333-3333-4333-8333-333333333333";
const SEED_PROJECT_ID = "44444444-4444-4444-8444-444444444444";

class InMemoryTable<T extends { id: string }> {
  public rows: Map<string, T> = new Map();

  constructor(initialRows: T[] = []) {
    for (const r of initialRows) {
      this.rows.set(r.id, { ...r });
    }
  }

  async findMany(args?: { where?: Record<string, any>; orderBy?: any; include?: any; take?: number }): Promise<any[]> {
    let result = Array.from(this.rows.values()).filter((r) => matchesFilter(r, args?.where));

    if (args?.orderBy) {
      const orderConfig = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
      result.sort((a: any, b: any) => {
        for (const item of orderConfig) {
          const field = Object.keys(item)[0];
          const dir = item[field] === "desc" ? -1 : 1;
          if (a[field] < b[field]) return -1 * dir;
          if (a[field] > b[field]) return 1 * dir;
        }
        return 0;
      });
    }

    if (args?.take && args.take > 0) {
      result = result.slice(0, args.take);
    }

    return result.map((r) => this.attachIncludes(r, args?.include));
  }

  async findFirst(args?: { where?: Record<string, any>; orderBy?: any; include?: any }): Promise<any | null> {
    const list = await this.findMany(args);
    return list[0] ?? null;
  }

  async findUnique(args: { where: Record<string, any>; include?: any }): Promise<any | null> {
    if (args.where.id) {
      const r = this.rows.get(args.where.id);
      if (!r) return null;
      if (!matchesFilter(r, args.where)) return null;
      return this.attachIncludes(r, args?.include);
    }
    return this.findFirst(args);
  }

  async create(args: { data: any; include?: any }): Promise<any> {
    const id = args.data.id ?? `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const { rates, items, members, lines, subSections, ...raw } = args.data;

    const row: any = {
      id,
      createdAt: now,
      updatedAt: now,
      ...raw,
    };

    this.rows.set(id, row);

    if (rates?.create) {
      const createList = Array.isArray(rates.create) ? rates.create : [rates.create];
      for (const item of createList) {
        await memoryDb.materialRate.create({
          data: { materialId: id, ...item },
        });
      }
    }
    if (items?.create) {
      const createList = Array.isArray(items.create) ? items.create : [items.create];
      for (const item of createList) {
        await memoryDb.rateBookItem.create({
          data: { rateBookId: id, ...item },
        });
      }
    }
    if (members?.create) {
      const createList = Array.isArray(members.create) ? members.create : [members.create];
      for (const item of createList) {
        await memoryDb.organizationMember.create({
          data: { orgId: id, ...item },
        });
      }
    }
    if (lines?.create) {
      const createList = Array.isArray(lines.create) ? lines.create : [lines.create];
      for (const item of createList) {
        await memoryDb.boqLine.create({
          data: { boqVersionId: id, ...item },
        });
      }
    }

    return this.attachIncludes(row, args.include);
  }

  async update(args: { where: Record<string, any>; data: any; include?: any }): Promise<any> {
    const existing = await this.findUnique({ where: args.where });
    if (!existing) throw new Error("Record not found to update");
    const updated = {
      ...existing,
      ...args.data,
      updatedAt: new Date(),
    };
    this.rows.set(existing.id, updated);
    return this.attachIncludes(updated, args.include);
  }

  async upsert(args: { where: Record<string, any>; create: any; update: any; include?: any }): Promise<any> {
    const existing = await this.findUnique({ where: args.where });
    if (existing) {
      return this.update({ where: { id: existing.id }, data: args.update, include: args.include });
    }
    return this.create({ data: args.create, include: args.include });
  }

  async delete(args: { where: Record<string, any> }): Promise<any> {
    const existing = await this.findUnique({ where: args.where });
    if (existing) {
      this.rows.delete(existing.id);
    }
    return existing ?? {};
  }

  async deleteMany(args?: { where?: Record<string, any> }): Promise<{ count: number }> {
    const list = await this.findMany({ where: args?.where });
    let count = 0;
    for (const item of list) {
      if (this.rows.delete(item.id)) count++;
    }
    return { count };
  }

  async count(args?: { where?: Record<string, any> }): Promise<number> {
    const list = await this.findMany({ where: args?.where });
    return list.length;
  }

  private attachIncludes(row: T, include?: Record<string, any>): any {
    if (!row || !include) return row;
    const res: any = { ...row };

    if (include.rates) {
      const rates = Array.from(memoryDb.materialRate.rows.values())
        .filter((mr) => mr.materialId === row.id)
        .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
      res.rates = include.rates.take ? rates.slice(0, include.rates.take) : rates;
    }
    if (include.items) {
      res.items = Array.from(memoryDb.rateBookItem.rows.values()).filter((item) => item.rateBookId === row.id);
    }
    if (include.lines) {
      res.lines = Array.from(memoryDb.boqLine.rows.values()).filter((line) => line.boqVersionId === row.id);
    }
    if (include.subSections) {
      res.subSections = Array.from(memoryDb.boqSubSection.rows.values()).filter((sub) => sub.sectionId === row.id);
    }
    if (include.members) {
      res.members = Array.from(memoryDb.organizationMember.rows.values()).filter((m) => m.orgId === row.id);
    }
    if (include.projects) {
      res.projects = Array.from(memoryDb.project.rows.values()).filter((p) => p.orgId === row.id);
    }

    return res;
  }
}

export const memoryDb = {
  user: new InMemoryTable<any>([
    { id: SEED_USER_ID, email: "seed@local.test", name: "Seed User", createdAt: new Date(), updatedAt: new Date() },
    { id: DEV_USER_ID, email: "dev@local.test", name: "Local Developer", createdAt: new Date(), updatedAt: new Date() },
  ]),
  organization: new InMemoryTable<any>([
    {
      id: SEED_ORG_ID,
      name: "Seed Organization",
      registrationId: "REG-2025-001",
      contactEmail: "contact@seedorg.test",
      phone: "+91 9876543210",
      address: "123 Construction Ave",
      city: "Mumbai",
      state: "Maharashtra",
      country: "IN",
      currency: "INR",
      taxRate: toDec(18),
      unitSystem: "metric",
      precision: 2,
      isStandardsDefault: "IS 456:2000",
      setupComplete: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  organizationMember: new InMemoryTable<any>([
    { id: "om-1", userId: SEED_USER_ID, orgId: SEED_ORG_ID, role: "SUPER_ADMIN" },
    { id: "om-2", userId: DEV_USER_ID, orgId: SEED_ORG_ID, role: "SUPER_ADMIN" },
  ]),
  project: new InMemoryTable<any>([
    {
      id: SEED_PROJECT_ID,
      orgId: SEED_ORG_ID,
      name: "Seed Civil Project",
      clientName: "Seed Client Ltd",
      location: "Demo Site, Bandra",
      tenderNumber: "TND-2025-88",
      structureType: "RCC Frame Building",
      budgetEstimate: toDec(15000000),
      isStandardsVersion: "IS 456:2000",
      status: "ACTIVE",
      type: "COMMERCIAL",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  projectMember: new InMemoryTable<any>([
    { id: "pm-1", projectId: SEED_PROJECT_ID, userId: SEED_USER_ID, role: "OWNER" },
    { id: "pm-2", projectId: SEED_PROJECT_ID, userId: DEV_USER_ID, role: "OWNER" },
  ]),
  materialMaster: new InMemoryTable<any>([
    { id: "mat-1", orgId: SEED_ORG_ID, code: "CEM-53", name: "OPC 53 Grade Cement", category: "Concrete & Masonry", unit: "bag", spec: "IS 269:2015, 50 kg bag", createdAt: new Date(), updatedAt: new Date() },
    { id: "mat-2", orgId: SEED_ORG_ID, code: "AGG-20", name: "Coarse Aggregate 20mm", category: "Aggregates", unit: "m³", spec: "IS 383:2016 Graded", createdAt: new Date(), updatedAt: new Date() },
    { id: "mat-3", orgId: SEED_ORG_ID, code: "STEEL-T16", name: "HYSD Steel T16 Fe500D", category: "Metals & Steel", unit: "kg", spec: "IS 1786:2008 TMT", createdAt: new Date(), updatedAt: new Date() },
    { id: "mat-4", orgId: SEED_ORG_ID, code: "SAND", name: "River Sand (Fine)", category: "Aggregates", unit: "m³", spec: "IS 383:2016 Zone II", createdAt: new Date(), updatedAt: new Date() },
    { id: "mat-5", orgId: SEED_ORG_ID, code: "BRICK-1", name: "First Class Red Bricks", category: "Concrete & Masonry", unit: "piece", spec: "IS 1077:1992", createdAt: new Date(), updatedAt: new Date() },
    { id: "mat-6", orgId: SEED_ORG_ID, code: "CONC-M25", name: "Ready Mix Concrete M25", category: "Concrete & Masonry", unit: "m³", spec: "IS 456:2000 / IS 4926", createdAt: new Date(), updatedAt: new Date() },
  ]),
  materialRate: new InMemoryTable<any>([
    { id: "mr-1", materialId: "mat-1", supplierName: "UltraTech Cement", rate: toDec(420), effectiveFrom: new Date("2026-01-01"), createdAt: new Date() },
    { id: "mr-2", materialId: "mat-2", supplierName: "Local Quarry", rate: toDec(1200), effectiveFrom: new Date("2026-01-01"), createdAt: new Date() },
    { id: "mr-3", materialId: "mat-3", supplierName: "Tata Tiscon", rate: toDec(72), effectiveFrom: new Date("2026-01-01"), createdAt: new Date() },
    { id: "mr-4", materialId: "mat-4", supplierName: "Sand Quarry", rate: toDec(1800), effectiveFrom: new Date("2026-01-01"), createdAt: new Date() },
    { id: "mr-5", materialId: "mat-5", supplierName: "Brick Kiln", rate: toDec(9), effectiveFrom: new Date("2026-01-01"), createdAt: new Date() },
    { id: "mr-6", materialId: "mat-6", supplierName: "RMC Plant", rate: toDec(4500), effectiveFrom: new Date("2026-01-01"), createdAt: new Date() },
  ]),
  labourCategory: new InMemoryTable<any>([
    { id: "lb-1", orgId: SEED_ORG_ID, name: "Mason (skilled)", dailyRate: toDec(900), unit: "day", skillLevel: "skilled", productivityUnit: "m³/day", productivityRate: toDec(2.5), createdAt: new Date(), updatedAt: new Date() },
    { id: "lb-2", orgId: SEED_ORG_ID, name: "Helper (unskilled)", dailyRate: toDec(550), unit: "day", skillLevel: "unskilled", productivityUnit: "m³/day", productivityRate: toDec(4.0), createdAt: new Date(), updatedAt: new Date() },
    { id: "lb-3", orgId: SEED_ORG_ID, name: "Bar bender", dailyRate: toDec(850), unit: "day", skillLevel: "skilled", productivityUnit: "kg/day", productivityRate: toDec(400), createdAt: new Date(), updatedAt: new Date() },
    { id: "lb-4", orgId: SEED_ORG_ID, name: "Concreter", dailyRate: toDec(750), unit: "day", skillLevel: "semi_skilled", productivityUnit: "m³/day", productivityRate: toDec(3.0), createdAt: new Date(), updatedAt: new Date() },
  ]),
  equipmentMaster: new InMemoryTable<any>([
    { id: "eq-1", orgId: SEED_ORG_ID, name: "Concrete Vibrator", category: "concreting", rentalRate: toDec(800), unit: "day", capacity: "1.5 kW", createdAt: new Date(), updatedAt: new Date() },
    { id: "eq-2", orgId: SEED_ORG_ID, name: "Transit Mixer 6 cum", category: "concreting", rentalRate: toDec(4500), unit: "day", capacity: "6 m³", createdAt: new Date(), updatedAt: new Date() },
    { id: "eq-3", orgId: SEED_ORG_ID, name: "Batching Plant", category: "concreting", rentalRate: toDec(12000), unit: "day", capacity: "30 m³/hr", createdAt: new Date(), updatedAt: new Date() },
    { id: "eq-4", orgId: SEED_ORG_ID, name: "Excavator JCB", category: "earthwork", rentalRate: toDec(8500), unit: "day", capacity: "0.8 cum bucket", createdAt: new Date(), updatedAt: new Date() },
    { id: "eq-5", orgId: SEED_ORG_ID, name: "Tower Crane", category: "lifting", rentalRate: toDec(25000), unit: "day", capacity: "50 m reach", createdAt: new Date(), updatedAt: new Date() },
  ]),
  rateBook: new InMemoryTable<any>([
    { id: "rb-1", orgId: SEED_ORG_ID, name: "Delhi Schedule of Rates (DSR) 2023", effectiveFrom: new Date("2023-01-01"), effectiveTo: null },
  ]),
  rateBookItem: new InMemoryTable<any>([
    { id: "rbi-1", rateBookId: "rb-1", code: "DSR-2.8", description: "Earth work in excavation in foundation trenches", unit: "m³", rate: toDec(245.5) },
    { id: "rbi-2", rateBookId: "rb-1", code: "DSR-4.1", description: "Providing and laying cement concrete 1:2:4 in foundation", unit: "m³", rate: toDec(5120.0) },
    { id: "rbi-3", rateBookId: "rb-1", code: "DSR-5.1", description: "Reinforced cement concrete work in beams, suspended floors", unit: "m³", rate: toDec(7850.0) },
    { id: "rbi-4", rateBookId: "rb-1", code: "DSR-5.22", description: "Thermo-Mechanically Treated bars Fe-500D for RCC work", unit: "kg", rate: toDec(78.5) },
  ]),
  rateAnalysis: new InMemoryTable<any>([
    {
      id: "ra-1",
      projectId: SEED_PROJECT_ID,
      boqLineId: "bql-2",
      name: "RCC M25 Beam Rate Analysis",
      materialCost: toDec(4800),
      labourCost: toDec(1200),
      equipmentCost: toDec(400),
      overheadPct: toDec(5),
      profitPct: toDec(8),
      totalRate: toDec(7257.6),
      createdAt: new Date(),
    },
  ]),
  measurementLine: new InMemoryTable<any>([
    { id: "ml-1", projectId: SEED_PROJECT_ID, templateKey: "earthwork", rowIndex: 0, desc: "Earthwork excavation for main columns", no: "10", l: "2.5", w: "2.5", h: "1.8", unit: "m³", quantityResolved: toDec(112.5) },
    { id: "ml-2", projectId: SEED_PROJECT_ID, templateKey: "rcc", rowIndex: 1, desc: "PCC 1:2:4 leveling mat beneath footings", no: "10", l: "2.5", w: "2.5", h: "0.1", unit: "m³", quantityResolved: toDec(6.25) },
    { id: "ml-3", projectId: SEED_PROJECT_ID, templateKey: "rcc", rowIndex: 2, desc: "RCC M25 Footings", no: "10", l: "2.2", w: "2.2", h: "0.6", unit: "m³", quantityResolved: toDec(29.04) },
  ]),
  boqVersion: new InMemoryTable<any>([
    { id: "bv-1", projectId: SEED_PROJECT_ID, version: 1, label: "v1 Initial Estimate", snapshotHash: "hash-12345", createdAt: new Date(), createdById: SEED_USER_ID },
  ]),
  boqLine: new InMemoryTable<any>([
    { id: "bql-1", boqVersionId: "bv-1", itemNo: "1.01", description: "Earthwork excavation in foundation trenches", unit: "m³", quantity: toDec(112.5), rate: toDec(245.5), amount: toDec(27618.75), category: "Earthwork" },
    { id: "bql-2", boqVersionId: "bv-1", itemNo: "2.01", description: "Providing & laying PCC 1:2:4 in foundation", unit: "m³", quantity: toDec(6.25), rate: toDec(5120.0), amount: toDec(32000.0), category: "Concrete" },
    { id: "bql-3", boqVersionId: "bv-1", itemNo: "2.02", description: "RCC M25 in footings and columns", unit: "m³", quantity: toDec(29.04), rate: toDec(7257.6), amount: toDec(210760.70), category: "Concrete" },
    { id: "bql-4", boqVersionId: "bv-1", itemNo: "3.01", description: "HYSD Steel Fe500D reinforcement bars", unit: "kg", quantity: toDec(2500.0), rate: toDec(78.5), amount: toDec(196250.0), category: "Steel" },
  ]),
  isStandard: new InMemoryTable<any>([
    { id: "seed-is456-cover-slab", code: "IS456", section: "26.4", category: "clear_cover", title: "Nominal cover — slab", value: { slab: 20 }, unit: "mm", jurisdiction: "IN", rulePackVersion: 1, sourceCitation: "IS 456:2000 nominal cover" },
    { id: "seed-is456-cover-beam", code: "IS456", section: "26.4", category: "clear_cover", title: "Nominal cover — beam", value: { beam: 25 }, unit: "mm", jurisdiction: "IN", rulePackVersion: 1, sourceCitation: "IS 456:2000 nominal cover" },
    { id: "seed-is456-cover-column", code: "IS456", section: "26.4", category: "clear_cover", title: "Nominal cover — column", value: { column: 40 }, unit: "mm", jurisdiction: "IN", rulePackVersion: 1, sourceCitation: "IS 456:2000 nominal cover" },
    { id: "seed-is456-cover-footing", code: "IS456", section: "26.4", category: "clear_cover", title: "Nominal cover — footing", value: { footing: 50 }, unit: "mm", jurisdiction: "IN", rulePackVersion: 1, sourceCitation: "IS 456:2000 nominal cover" },
    { id: "seed-is456-grade-mild", code: "IS456", section: "8.2", category: "concrete_grade", title: "Minimum grade mild exposure", value: { minGrade: "M20" }, jurisdiction: "IN", rulePackVersion: 1, sourceCitation: "IS 456:2000 Durability" },
    { id: "seed-is456-grade-severe", code: "IS456", section: "8.2", category: "concrete_grade", title: "Minimum grade severe exposure", value: { minGrade: "M30" }, jurisdiction: "IN", rulePackVersion: 1, sourceCitation: "IS 456:2000 Durability" },
  ]),
  auditEvent: new InMemoryTable<any>([]),
  drawing: new InMemoryTable<any>([]),
  notification: new InMemoryTable<any>([
    { id: "notif-1", userId: SEED_USER_ID, title: "Welcome to Civil Estimation Pro", body: "Material cost manager and government rule import ready.", read: false, createdAt: new Date() },
    { id: "notif-2", userId: DEV_USER_ID, title: "Welcome to Civil Estimation Pro", body: "Material cost manager and government rule import ready.", read: false, createdAt: new Date() },
  ]),
  approval: new InMemoryTable<any>([]),
  boqSection: new InMemoryTable<any>([]),
  boqSubSection: new InMemoryTable<any>([]),
  measurementTemplate: new InMemoryTable<any>([]),

  async $transaction(fn: (tx: any) => Promise<any>): Promise<any> {
    return fn(memoryDb);
  },
};
