// app/api/admin/users/background/route.ts
import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = new URL(request.url).searchParams.get("userId");

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const [rows] = await db.execute(
      "SELECT background_blob, background_mime_type FROM User WHERE id = ?",
      [userId]
    );

    const user = (rows as any[])[0];

    if (!user || !user.background_blob) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Return the image with proper headers to prevent aggressive caching
    return new NextResponse(user.background_blob, {
      status: 200,
      headers: {
        "Content-Type": user.background_mime_type || "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate", // Prevent caching during development
        Pragma: "no-cache",
        Expires: "0",
        "Content-Length": user.background_blob.length.toString(),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, background_blob, background_mime_type } = body;

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    if (!background_blob || !background_mime_type) {
      return NextResponse.json(
        { error: "Missing background image or MIME type" },
        { status: 400 }
      );
    }

    // Convert Base64 string to buffer
    const buffer = Buffer.from(background_blob, "base64");

    await db.execute(
      "UPDATE User SET background_blob = ?, background_mime_type = ?, has_background = ? WHERE id = ?",
      [null, null, false, userId]
    );

    // Update the user's background image AND set has_background to true
    await db.execute(
      "UPDATE User SET background_blob = ?, background_mime_type = ?, has_background = ? WHERE id = ?",
      [buffer, background_mime_type, true, userId]
    );

    return NextResponse.json({
      success: true,
      message: "Background image updated successfully",
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update background image" },
      { status: 500 }
    );
  }
}
