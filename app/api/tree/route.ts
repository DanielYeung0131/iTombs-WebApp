import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db"; // uses mysql2/promise

// POST /api/tree — Add a new relative to the Tree table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, relativeName, relationship, profileUrl } = body;

    if (!userId || !relativeName || !relationship) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await db.execute(
      `INSERT INTO Tree (user_id, relative_name, relationship, profile_url)
       VALUES (?, ?, ?, ?)`,
      [userId, relativeName, relationship, profileUrl || null]
    );

    return NextResponse.json(
      { message: "Relative added to tree" },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST Tree Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// GET /api/tree?userId=123 — Get all relatives for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const [rows] = await db.execute("SELECT * FROM Tree WHERE user_id = ?", [
      userId,
    ]);

    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error("GET Tree Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/tree?treeId=5 — Delete a specific relative by tree_id
export async function DELETE(request: NextRequest) {
  try {
    const treeId = request.nextUrl.searchParams.get("treeId");

    if (!treeId) {
      return NextResponse.json(
        { message: "Missing treeId parameter" },
        { status: 400 }
      );
    }

    await db.execute("DELETE FROM Tree WHERE tree_id = ?", [treeId]);

    return NextResponse.json({ message: "Relative deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE Tree Error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
