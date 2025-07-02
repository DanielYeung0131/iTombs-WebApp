// app/api/admin/posts/route.ts
import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const title = formData.get("title") as string;
    const paragraph = formData.get("paragraph") as string;
    const category = formData.get("category") as string;
    const image = formData.get("image") as File | null;

    if (!userId || !title || !paragraph) {
      return NextResponse.json(
        { error: "User ID, title, and paragraph are required" },
        { status: 400 }
      );
    }

    let imageBuffer = null;
    let imageMimeType = null;

    // Handle image upload if provided
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      imageBuffer = Buffer.from(bytes);
      imageMimeType = image.type;

      // Optional: Validate image type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(imageMimeType)) {
        return NextResponse.json(
          {
            error:
              "Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed",
          },
          { status: 400 }
        );
      }

      // Optional: Check file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageBuffer.length > maxSize) {
        return NextResponse.json(
          { error: "Image size too large. Maximum 5MB allowed" },
          { status: 400 }
        );
      }
    }

    // Insert the post into database
    const [result] = await db.execute(
      "INSERT INTO Post (user_id, title, paragraph, image_blob, image_mime_type, time, likes, category) VALUES (?, ?, ?, ?, ?, NOW(), 0, ?)",
      [
        parseInt(userId),
        title,
        paragraph,
        imageBuffer,
        imageMimeType,
        category || null,
      ]
    );

    // Get the created post (without the blob data for response)
    const insertId = (result as any).insertId;
    const [createdPost] = await db.execute(
      "SELECT id, user_id, title, paragraph, image_mime_type, time, likes, category FROM Post WHERE id = ?",
      [insertId]
    );

    const post = (createdPost as any[])[0];
    // Add a flag to indicate if image exists
    post.has_image = !!post.image_mime_type;

    return NextResponse.json({
      message: "Post created successfully",
      post: post,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const paragraph = formData.get("paragraph") as string;
    const category = formData.get("category") as string;
    const image = formData.get("image") as File | null;

    if (!id || !title || !paragraph) {
      return NextResponse.json(
        { error: "ID, title, and paragraph are required" },
        { status: 400 }
      );
    }

    const postId = parseInt(id);
    let imageBuffer = null;
    let imageMimeType = null;

    // Handle image upload if provided
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      imageBuffer = Buffer.from(bytes);
      imageMimeType = image.type;

      // Optional: Validate image type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(imageMimeType)) {
        return NextResponse.json(
          {
            error:
              "Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed",
          },
          { status: 400 }
        );
      }

      // Optional: Check file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageBuffer.length > maxSize) {
        return NextResponse.json(
          { error: "Image size too large. Maximum 5MB allowed" },
          { status: 400 }
        );
      }
    }

    let result;
    // Update the post - only update image if new one provided
    if (imageBuffer) {
      [result] = await db.execute(
        "UPDATE Post SET title = ?, paragraph = ?, image_blob = ?, image_mime_type = ?, category = ? WHERE id = ?",
        [title, paragraph, imageBuffer, imageMimeType, category, postId]
      );
    } else {
      [result] = await db.execute(
        "UPDATE Post SET title = ?, paragraph = ?, category = ? WHERE id = ?",
        [title, paragraph, category || null, postId]
      );
    }

    // Check if any rows were affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "Post not found or no changes made" },
        { status: 404 }
      );
    }

    // Get the updated post (without the blob data for response)
    const [updatedPost] = await db.execute(
      "SELECT id, user_id, title, paragraph, image_mime_type, time, likes, category FROM Post WHERE id = ?",
      [postId]
    );

    const post = (updatedPost as any[])[0];
    // Add a flag to indicate if image exists
    post.has_image = !!post.image_mime_type;

    return NextResponse.json({
      message: "Post updated successfully",
      post: post,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId } = body;

    // First, delete associated comments
    await db.execute("DELETE FROM Comment WHERE post_id = ?", [
      parseInt(postId),
    ]);

    // Then delete the post (image will be automatically deleted with the row)
    const [result] = await db.execute("DELETE FROM Post WHERE id = ?", [
      parseInt(postId),
    ]);

    // Check if any rows were affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Post and associated comments deleted successfully",
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // Simulate user_id lookup from auth cookie/session (replace with real session logic)
    const userId = new URL(req.url).searchParams.get("user");
    const category = new URL(req.url).searchParams.get("category");

    let query =
      "SELECT id, title, paragraph, time, likes, image_mime_type, category FROM Post WHERE user_id = ?";
    let params = [userId];

    // Add category filter if provided
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY time DESC";

    const [rows] = await db.execute(query, params);

    // Add has_image flag to each post
    const posts = (rows as any[]).map((post) => ({
      ...post,
      has_image: !!post.image_mime_type,
    }));

    return NextResponse.json({ posts: posts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
