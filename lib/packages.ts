import { unstable_cache } from "next/cache";
import { db } from "./db";

type PackageRow = {
  id: string;
  title: string;
  description: string;
  price: string;
  salePrice: string | null;
  highlight: number;
  sortOrder: number;
};

const loadPackages = unstable_cache(
  async () => {
    const rows = (db
      .prepare(
        `
          SELECT id, title, description, price, sale_price as salePrice, highlight, sort_order as sortOrder
          FROM packages
          ORDER BY sort_order ASC, created_at ASC
        `
      )
      .all() as PackageRow[]);

    return rows.map((row) => ({
      ...row,
      highlight: Boolean(row.highlight),
    }));
  },
  ["public-packages"],
  {
    revalidate: 300,
    tags: ["packages"],
  }
);

export async function getPackages() {
  return loadPackages();
}
