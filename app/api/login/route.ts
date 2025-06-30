import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import db from "@/lib/db"; // Assumes you're using mysql2/promise and exporting db from here

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json(
        { message: "Missing credentials" },
        { status: 400 }
      );
    }

    interface AuthRow {
      account: string;
      pw: string;
      user_id: number;
      // add other fields if needed
    }

    const [rows] = await db.execute("SELECT * FROM Auth WHERE account = ?", [
      userId,
    ]);

    const auth = Array.isArray(rows)
      ? (rows[0] as AuthRow | undefined)
      : undefined;

    console.log("Auth row:", auth);
    if (!auth) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    const match =
      password === auth.pw ? true : await bcrypt.compare(password, auth.pw);
    console.log("Password match:", password, auth.pw, match);

    if (!match) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      );
    }

    // TODO: Set session/cookie or JWT here if needed
    return NextResponse.json(
      { message: "Login successful", user_id: auth.user_id },
      { status: 200 }
    );
  } catch (err) {
    console.error("Login Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
