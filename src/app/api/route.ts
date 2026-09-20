import { NextResponse } from "next/server";

/** فحص جاهزية النظام (Health Check) */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    name: "نظام إدارة الأهداف المؤسسية OKR",
    timestamp: new Date().toISOString(),
  });
}
