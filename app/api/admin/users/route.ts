// app/api/admin/posts/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { request } from "http";

export async function GET(req: Request) {
  try {
    // Simulate user_id lookup from auth cookie/session (replace with real session logic)
    const userId = new URL(req.url).searchParams.get("user");

    const user = await db.execute("SELECT * FROM User WHERE id = ?", [userId]);

    return NextResponse.json({ user: user });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
