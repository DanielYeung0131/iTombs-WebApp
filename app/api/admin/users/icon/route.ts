// app/api/admin/users/icon/route.ts
import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get the image data from database
    const [rows] = await db.execute(
      "SELECT icon_blob, icon_mime_type FROM User WHERE id = ?",
      [userId]
    );

    const user = (rows as any[])[0];

    if (!user || !user.icon_blob) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Return the image with proper headers
    return new NextResponse(user.icon_blob, {
      status: 200,
      headers: {
        "Content-Type": user.icon_mime_type,
        // "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        "Content-Length": user.icon_blob.length.toString(),
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Remove the icon from the database
    const [result] = await db.execute(
      "UPDATE User SET icon_blob = NULL, icon_mime_type = NULL WHERE id = ?",
      [userId]
    );

    // Check if any row was affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Icon deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete icon" },
      { status: 500 }
    );
  }
}
