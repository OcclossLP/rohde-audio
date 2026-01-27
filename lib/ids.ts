import { db } from "./db";

const pad = (value: number, length: number) => String(value).padStart(length, "0");

const getYearPrefix = () => {
  const year = new Date().getFullYear();
  return String(year).slice(-2);
};

export const isValidCustomerNumber = (value: string) =>
  /^\d{5}$/.test(value) && Number(value) >= 10100;

export const isValidOrderNumber = (value: string) =>
  /^\d{2}0\d{3}$/.test(value);

const getNextSequence = (table: string, column: string, prefix: string, totalLength: number) => {
  const row = db
    .prepare(
      `
        SELECT MAX(CAST(${column} AS INTEGER)) as maxValue
        FROM ${table}
        WHERE ${column} LIKE ? AND length(${column}) = ?
      `
    )
    .get(`${prefix}%`, totalLength) as { maxValue: number | null } | undefined;
  const currentMax = row?.maxValue ?? 0;
  const nextValue = currentMax ? currentMax + 1 : Number(`${prefix}${pad(1, totalLength - prefix.length)}`);
  return String(nextValue);
};

export const generateCustomerNumber = () => {
  const row = db
    .prepare(
      `
        SELECT MAX(CAST(value AS INTEGER)) as maxValue
        FROM (
          SELECT customer_number as value
          FROM users
          WHERE length(customer_number) = 5
          UNION ALL
          SELECT customer_number as value
          FROM reserved_customer_numbers
          WHERE length(customer_number) = 5
        )
      `
    )
    .get() as { maxValue: number | null } | undefined;
  const currentMax = row?.maxValue ?? 0;
  const nextValue = currentMax >= 10100 ? currentMax + 1 : 10100;
  return String(nextValue);
};

export const generateOrderNumber = () => {
  const prefix = `${getYearPrefix()}0`;
  const row = db
    .prepare(
      `
        SELECT MAX(CAST(value AS INTEGER)) as maxValue
        FROM (
          SELECT order_number as value
          FROM inquiries
          WHERE order_number LIKE ? AND length(order_number) = ?
          UNION ALL
          SELECT order_number as value
          FROM reserved_order_numbers
          WHERE order_number LIKE ? AND length(order_number) = ?
        )
      `
    )
    .get(`${prefix}%`, 6, `${prefix}%`, 6) as { maxValue: number | null } | undefined;
  const currentMax = row?.maxValue ?? 0;
  const nextValue = currentMax
    ? currentMax + 1
    : Number(`${prefix}${pad(1, 6 - prefix.length)}`);
  return String(nextValue);
};

export const reserveCustomerNumber = (value: string | null | undefined) => {
  if (!value) return;
  db.prepare(
    "INSERT OR IGNORE INTO reserved_customer_numbers (customer_number, reserved_at) VALUES (?, ?)"
  ).run(value, new Date().toISOString());
};

export const reserveOrderNumber = (value: string | null | undefined) => {
  if (!value) return;
  db.prepare(
    "INSERT OR IGNORE INTO reserved_order_numbers (order_number, reserved_at) VALUES (?, ?)"
  ).run(value, new Date().toISOString());
};
