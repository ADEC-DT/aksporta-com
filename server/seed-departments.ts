import fs from "fs";
import path from "path";
import { db } from "./db";
import { departments } from "@shared/schema";

interface DepartmentRow {
  internalId: number;
  externalId: string;
  hierarchicalName: string;
  name: string;
  inactive: boolean;
  budgetOwnerId: string | null;
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

function parseXlsXml(filePath: string): DepartmentRow[] {
  const content = fs.readFileSync(filePath, "utf-8");

  const rowRegex = /<Row>([\s\S]*?)<\/Row>/g;

  const rows: string[][] = [];
  let rowMatch;
  while ((rowMatch = rowRegex.exec(content)) !== null) {
    const rowContent = rowMatch[1];
    const cells: string[] = [];
    let cellMatch;
    const localCellRegex = /<Cell[^>]*><Data[^>]*>([\s\S]*?)<\/Data><\/Cell>/g;
    while ((cellMatch = localCellRegex.exec(rowContent)) !== null) {
      cells.push(decodeXmlEntities(cellMatch[1]));
    }
    rows.push(cells);
  }

  const headerRow = rows[0];
  if (!headerRow || headerRow[0] !== "Internal ID") {
    throw new Error("Unexpected header row: " + JSON.stringify(headerRow));
  }

  const dataRows = rows.slice(1);
  const departments: DepartmentRow[] = [];

  for (const cells of dataRows) {
    if (cells.length < 5) continue;

    const internalId = parseInt(cells[0], 10);
    const externalId = cells[1];
    const hierarchicalName = cells[2];
    const name = cells[3];
    const inactive = cells[4] === "Yes";
    const budgetOwnerId = cells.length > 5 && cells[5] ? cells[5] : null;

    departments.push({
      internalId,
      externalId,
      hierarchicalName,
      name,
      inactive,
      budgetOwnerId,
    });
  }

  return departments;
}

function computeParentIds(rows: DepartmentRow[]): Map<number, number | null> {
  const hierarchyToId = new Map<string, number>();
  for (const row of rows) {
    hierarchyToId.set(row.hierarchicalName, row.internalId);
  }

  const parentMap = new Map<number, number | null>();
  for (const row of rows) {
    const parts = row.hierarchicalName.split(" : ");
    if (parts.length <= 1) {
      parentMap.set(row.internalId, null);
    } else {
      const parentHierarchy = parts.slice(0, -1).join(" : ");
      const parentId = hierarchyToId.get(parentHierarchy) ?? null;
      parentMap.set(row.internalId, parentId);
    }
  }

  return parentMap;
}

export async function seedDepartments() {
  const filePath = path.resolve(
    process.cwd(),
    "attached_assets/DepartmentSearchnewResults641_1774853249333.xls"
  );

  if (!fs.existsSync(filePath)) {
    throw new Error("XLS file not found at: " + filePath);
  }

  const rows = parseXlsXml(filePath);
  console.log(`Parsed ${rows.length} department rows from XLS`);

  const parentMap = computeParentIds(rows);

  await db.delete(departments);

  const insertValues = rows.map((row) => ({
    internalId: row.internalId,
    externalId: row.externalId,
    name: row.name,
    inactive: row.inactive,
    budgetOwnerId: row.budgetOwnerId,
    parentId: parentMap.get(row.internalId) ?? null,
  }));

  const topLevel = insertValues.filter((v) => v.parentId === null);
  const midLevel = insertValues.filter(
    (v) => v.parentId !== null && topLevel.some((t) => t.internalId === v.parentId)
  );
  const leafLevel = insertValues.filter(
    (v) => v.parentId !== null && !topLevel.some((t) => t.internalId === v.parentId)
  );

  if (topLevel.length > 0) {
    await db.insert(departments).values(topLevel);
  }
  if (midLevel.length > 0) {
    await db.insert(departments).values(midLevel);
  }
  if (leafLevel.length > 0) {
    await db.insert(departments).values(leafLevel);
  }

  console.log(`Seeded ${insertValues.length} departments (${topLevel.length} top-level, ${midLevel.length} mid-level, ${leafLevel.length} leaf-level)`);
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedDepartments()
    .then(() => {
      console.log("Department seeding complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Department seeding failed:", err);
      process.exit(1);
    });
}
