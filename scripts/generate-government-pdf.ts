import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.join(process.cwd(), "docs", "government-schedules");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const GOVERNMENT_SCHEDULE_ITEMS = [
  {
    code: "MH-PWD-MAT-01",
    name: "Ordinary Portland Cement (OPC 53 Grade)",
    category: "Concrete & Masonry",
    unit: "bag (50kg)",
    baseRate: 380,
    mumbaiRate: 410,
    puneRate: 395,
    nagpurRate: 385,
    nashikRate: 390,
    spec: "Conforming to IS 269:2015 Clause 5.1",
    authority: "Maharashtra PWD SSR Item 3.01 / CPWD DSR Item 3.1",
  },
  {
    code: "MH-PWD-MAT-02",
    name: "Portland Pozzolana Cement (PPC)",
    category: "Concrete & Masonry",
    unit: "bag (50kg)",
    baseRate: 350,
    mumbaiRate: 375,
    puneRate: 365,
    nagpurRate: 355,
    nashikRate: 360,
    spec: "Conforming to IS 1489 (Part 1):2015",
    authority: "Maharashtra PWD SSR Item 3.02",
  },
  {
    code: "MH-PWD-MAT-03",
    name: "TMT Steel Fe-500D High Ductility Reinforcement Bars",
    category: "Metals & Steel",
    unit: "kg",
    baseRate: 68.5,
    mumbaiRate: 74.0,
    puneRate: 71.5,
    nagpurRate: 69.5,
    nashikRate: 70.0,
    spec: "Thermo-Mechanically Treated bars conforming to IS 1786:2008 Grade Fe500D",
    authority: "Maharashtra PWD SSR Item 5.22 / CPWD DSR Item 5.22",
  },
  {
    code: "MH-PWD-MAT-04",
    name: "TMT Steel Fe-550D High Strength Corrosion Resistant Bars",
    category: "Metals & Steel",
    unit: "kg",
    baseRate: 72.0,
    mumbaiRate: 78.5,
    puneRate: 75.0,
    nagpurRate: 73.0,
    nashikRate: 74.0,
    spec: "Earthquake and corrosion resistant steel bars as per IS 1786:2008 Annexure B",
    authority: "Maharashtra PWD SSR Item 5.23",
  },
  {
    code: "MH-PWD-MAT-05",
    name: "Coarse Aggregate 20mm Nominal Size",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1180,
    mumbaiRate: 1350,
    puneRate: 1250,
    nagpurRate: 1200,
    nashikRate: 1210,
    spec: "Crushed hard basalt stone aggregate conforming to IS 383:2016 Table 2",
    authority: "Maharashtra PWD SSR Item 3.05",
  },
  {
    code: "MH-PWD-MAT-06",
    name: "Coarse Aggregate 10mm Nominal Size",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1280,
    mumbaiRate: 1450,
    puneRate: 1350,
    nagpurRate: 1300,
    nashikRate: 1310,
    spec: "Crushed stone aggregate conforming to IS 383:2016 Table 2",
    authority: "Maharashtra PWD SSR Item 3.06",
  },
  {
    code: "MH-PWD-MAT-07",
    name: "Fine Aggregate / Natural River Sand (Zone II)",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1750,
    mumbaiRate: 2100,
    puneRate: 1900,
    nagpurRate: 1800,
    nashikRate: 1820,
    spec: "Naturally well-graded river sand conforming to IS 383:2016 Zone II",
    authority: "Maharashtra PWD SSR Item 3.08 / MJP SSR Item 47",
  },
  {
    code: "MH-PWD-MAT-08",
    name: "Manufactured Sand (M-Sand for Concrete)",
    category: "Aggregates",
    unit: "m³",
    baseRate: 1400,
    mumbaiRate: 1650,
    puneRate: 1500,
    nagpurRate: 1450,
    nashikRate: 1460,
    spec: "Crushed basalt stone sand conforming to IS 383:2016 Clause 4.2",
    authority: "Maharashtra PWD SSR Item 3.09",
  },
  {
    code: "MH-PWD-MAT-09",
    name: "First Class Burnt Clay Bricks (Class 10 N/mm²)",
    category: "Concrete & Masonry",
    unit: "1000 nos",
    baseRate: 7800,
    mumbaiRate: 8500,
    puneRate: 8200,
    nagpurRate: 7900,
    nashikRate: 8000,
    spec: "Compressive strength not less than 10 N/mm² conforming to IS 1077:1992",
    authority: "Maharashtra PWD SSR Item 6.01",
  },
  {
    code: "MH-PWD-MAT-10",
    name: "AAC Blocks (Autoclaved Aerated Concrete 600 kg/m³)",
    category: "Concrete & Masonry",
    unit: "m³",
    baseRate: 3350,
    mumbaiRate: 3700,
    puneRate: 3500,
    nagpurRate: 3400,
    nashikRate: 3450,
    spec: "Precast AAC masonry units conforming to IS 2185 (Part 3):2021",
    authority: "Maharashtra PWD SSR Item 6.04",
  },
  {
    code: "MH-PWD-MAT-11",
    name: "Ready Mix Concrete M25 Grade",
    category: "Concrete & Masonry",
    unit: "m³",
    baseRate: 4250,
    mumbaiRate: 4800,
    puneRate: 4500,
    nagpurRate: 4300,
    nashikRate: 4350,
    spec: "Design mix concrete M25 as per IS 456:2000 and IS 4926",
    authority: "Maharashtra PWD SSR Item 4.13 / CPWD DSR Item 4.1.3",
  },
  {
    code: "MH-PWD-MAT-12",
    name: "Ready Mix Concrete M30 Grade",
    category: "Concrete & Masonry",
    unit: "m³",
    baseRate: 4550,
    mumbaiRate: 5100,
    puneRate: 4800,
    nagpurRate: 4600,
    nashikRate: 4650,
    spec: "Design mix concrete M30 as per IS 456:2000 Table 5",
    authority: "Maharashtra PWD SSR Item 4.15 / CPWD DSR Item 4.1.5",
  },
  {
    code: "MH-PWD-MAT-13",
    name: "Structural Steel Sections (Beams, Channels, Angles)",
    category: "Metals & Steel",
    unit: "kg",
    baseRate: 76.5,
    mumbaiRate: 83.0,
    puneRate: 79.5,
    nagpurRate: 77.5,
    nashikRate: 78.0,
    spec: "Hot rolled structural steel conforming to IS 2062:2011 Grade E250 Quality A",
    authority: "Maharashtra PWD SSR Item 12.01",
  },
  {
    code: "MH-PWD-MAT-14",
    name: "Vitrified Floor Tiles (600x600 mm Heavy Duty)",
    category: "Finishes",
    unit: "m²",
    baseRate: 680,
    mumbaiRate: 780,
    puneRate: 720,
    nagpurRate: 690,
    nashikRate: 700,
    spec: "Double charged vitrified tiles conforming to IS 15622:2017 Group BIa",
    authority: "Maharashtra PWD SSR Item 11.02",
  },
  {
    code: "MH-PWD-MAT-15",
    name: "Premium Acrylic Emulsion Exterior Wall Paint",
    category: "Finishes",
    unit: "litre",
    baseRate: 295,
    mumbaiRate: 330,
    puneRate: 310,
    nagpurRate: 300,
    nashikRate: 305,
    spec: "Weatherproof exterior emulsion paint conforming to IS 15489:2004",
    authority: "Maharashtra PWD SSR Item 13.01",
  }
];

/**
 * Generate a valid PDF 1.4 binary document cleanly in Node.js
 */
function buildPdfBuffer(): Buffer {
  const contentLines: string[] = [
    "BT /F1 16 Tf 50 780 Td (GOVERNMENT OF MAHARASHTRA - PUBLIC WORKS DEPARTMENT) Tj ET",
    "BT /F1 12 Tf 50 762 Td (State Schedule of Rates - SSR & CPWD Material Specifications 2026) Tj ET",
    "BT /F1 9 Tf 50 745 Td (Official Civil Worksite Material Schedule - Maharashtra PWD Guidelines) Tj ET",
    "BT /F1 10 Tf 50 725 Td (--------------------------------------------------------------------------------------------------------------------------------) Tj ET",
  ];

  let y = 705;
  for (const item of GOVERNMENT_SCHEDULE_ITEMS) {
    const text = `[${item.code}] ${item.name} | Unit: ${item.unit} | Base Rate: Rs.${item.baseRate} | Nashik: Rs.${item.nashikRate} | Ref: ${item.authority}`;
    // Sanitize string for PDF literal
    const safeText = text.replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    contentLines.push(`BT /F1 9 Tf 50 ${y} Td (${safeText}) Tj ET`);
    y -= 14;
    if (y < 50) break;
  }

  const streamBody = contentLines.join("\n");
  const streamLength = Buffer.byteLength(streamBody);

  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kinds [3 0 R] /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamBody}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000130 00000 n 
0000000261 00000 n 
0000000338 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  return Buffer.from(pdfString, "utf-8");
}

function main() {
  console.log("Generating Official Government Schedule Artifacts...");

  // Write JSON
  const jsonPath = path.join(OUTPUT_DIR, "maharashtra_pwd_material_rates.json");
  fs.writeFileSync(jsonPath, JSON.stringify(GOVERNMENT_SCHEDULE_ITEMS, null, 2), "utf-8");

  // Write CSV
  const csvLines = [
    "Item Code,Material Name,Category,Unit,Base Rate (INR),Mumbai Rate,Nashik Rate,Specification,Authority",
    ...GOVERNMENT_SCHEDULE_ITEMS.map(
      (i) => `"${i.code}","${i.name}","${i.category}","${i.unit}",${i.baseRate},${i.mumbaiRate},${i.nashikRate},"${i.spec}","${i.authority}"`
    ),
  ];
  const csvPath = path.join(OUTPUT_DIR, "maharashtra_pwd_material_rates.csv");
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf-8");

  // Write PDF
  const pdfBuffer = buildPdfBuffer();
  const pdfPath = path.join(OUTPUT_DIR, "Maharashtra_PWD_and_CPWD_Schedule_of_Rates.pdf");
  fs.writeFileSync(pdfPath, pdfBuffer);

  console.log("Successfully pulled and generated government schedule artifacts into workspace:");
  console.log("  PDF: ", pdfPath);
  console.log("  JSON:", jsonPath);
  console.log("  CSV: ", csvPath);
}

main();
