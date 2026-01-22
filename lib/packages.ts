import { db } from "./db";

export async function getPackages() {
  const rows = db
    .prepare(
      `
        SELECT id, title, description, price, highlight, sort_order as sortOrder
        FROM packages
        ORDER BY sort_order ASC, created_at ASC
      `
    )
    .all();

  return rows.map((row) => ({
    ...row,
    highlight: Boolean(row.highlight),
  }));
}
