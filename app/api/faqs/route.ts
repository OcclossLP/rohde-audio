import { NextResponse } from "next/server";
import { getPublicFaqs } from "@/lib/faqs";

export async function GET() {
  const faqs = await getPublicFaqs();
  return NextResponse.json(faqs);
}
