import { db } from "./db";

type PackageRow = {
  id: string;
  title: string;
  description: string;
  price: string;
  highlight: number;
  sortOrder: number;
};

export async function getPackages() {
  const rows = (db
    .prepare(
      `
        SELECT id, title, description, price, highlight, sort_order as sortOrder
        FROM packages
        ORDER BY sort_order ASC, created_at ASC
      `
    )
    .all() as PackageRow[]);

  return rows.map((row) => ({
    ...row,
    highlight: Boolean(row.highlight),
  }));
}
