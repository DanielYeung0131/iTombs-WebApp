// app/api/admin/posts/images/route.ts
import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const postId = new URL(request.url).searchParams.get("postId");

    if (!postId || isNaN(Number(postId))) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Get the image data from database
    const [rows] = await db.execute(
      "SELECT image_blob, image_mime_type FROM Post WHERE id = ?",
      [postId]
    );

    const post = (rows as any[])[0];

    if (!post || !post.image_blob) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Return the image with proper headers
    return new NextResponse(post.image_blob, {
      status: 200,
      headers: {
        "Content-Type": post.image_mime_type,
        "Cache-Control": "public, max-age=31536000, immutable", // Cache for 1 year
        "Content-Length": post.image_blob.length.toString(),
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
