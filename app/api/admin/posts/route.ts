// app/api/admin/posts/route.ts
import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const title = formData.get("title") as string;
    const paragraph = formData.get("paragraph") as string;
    const image = formData.get("image") as File | null;

    if (!userId || !title || !paragraph) {
      return NextResponse.json(
        { error: "User ID, title, and paragraph are required" },
        { status: 400 }
      );
    }

    let imagePath = null;

    // Handle image upload if provided
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(image.name);
      const fileName = `post_${timestamp}_${Math.random()
        .toString(36)
        .substring(2, 15)}${fileExtension}`;

      // Create uploads directory path
      const uploadDir = path.join(process.cwd(), "public", "uploads", "posts");
      const filePath = path.join(uploadDir, fileName);

      // Ensure upload directory exists
      const fs = require("fs");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save file
      await writeFile(filePath, buffer);
      imagePath = `/uploads/posts/${fileName}`;
    }

    // Insert the post into database
    const [result] = await db.execute(
      "INSERT INTO Post (user_id, title, paragraph, image, time, likes) VALUES (?, ?, ?, ?, NOW(), 0)",
      [parseInt(userId), title, paragraph, imagePath]
    );

    // Get the created post
    const insertId = (result as any).insertId;
    const [createdPost] = await db.execute("SELECT * FROM Post WHERE id = ?", [
      insertId,
    ]);

    return NextResponse.json({
      message: "Post created successfully",
      post: (createdPost as any[])[0],
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
    const image = formData.get("image") as File | null;

    if (!id || !title || !paragraph) {
      return NextResponse.json(
        { error: "ID, title, and paragraph are required" },
        { status: 400 }
      );
    }

    const postId = parseInt(id);
    let imagePath = null;

    // Handle image upload if provided
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(image.name);
      const fileName = `post_${timestamp}_${Math.random()
        .toString(36)
        .substring(2, 15)}${fileExtension}`;

      // Create uploads directory path
      const uploadDir = path.join(process.cwd(), "public", "uploads", "posts");
      const filePath = path.join(uploadDir, fileName);

      // Ensure upload directory exists
      const fs = require("fs");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Save file
      await writeFile(filePath, buffer);
      imagePath = `/uploads/posts/${fileName}`;

      // Optional: Delete old image file
      // You might want to implement this to clean up old files
      try {
        const [oldPost] = await db.execute(
          "SELECT image FROM Post WHERE id = ?",
          [postId]
        );
        const oldImagePath = (oldPost as any[])[0]?.image;
        if (oldImagePath && oldImagePath.startsWith("/uploads/")) {
          const oldFilePath = path.join(process.cwd(), "public", oldImagePath);
          const fs = require("fs");
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      } catch (cleanupError) {
        console.warn("Failed to cleanup old image:", cleanupError);
      }
    }

    let result;
    // Update the post - only update image if new one provided
    if (imagePath) {
      [result] = await db.execute(
        "UPDATE Post SET title = ?, paragraph = ?, image = ? WHERE id = ?",
        [title, paragraph, imagePath, postId]
      );
    } else {
      [result] = await db.execute(
        "UPDATE Post SET title = ?, paragraph = ? WHERE id = ?",
        [title, paragraph, postId]
      );
    }

    // Check if any rows were affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "Post not found or no changes made" },
        { status: 404 }
      );
    }

    // Get the updated post
    const [updatedPost] = await db.execute("SELECT * FROM Post WHERE id = ?", [
      postId,
    ]);

    return NextResponse.json({
      message: "Post updated successfully",
      post: (updatedPost as any[])[0],
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

    // Get the post to find the image path before deleting
    const [post] = await db.execute("SELECT image FROM Post WHERE id = ?", [
      parseInt(postId),
    ]);

    const imagePath = (post as any[])[0]?.image;

    // First, delete associated comments
    await db.execute("DELETE FROM Comment WHERE post_id = ?", [
      parseInt(postId),
    ]);

    // Then delete the post
    const [result] = await db.execute("DELETE FROM Post WHERE id = ?", [
      parseInt(postId),
    ]);

    // Check if any rows were affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete the image file if it exists
    if (imagePath && imagePath.startsWith("/uploads/")) {
      try {
        const filePath = path.join(process.cwd(), "public", imagePath);
        const fs = require("fs");
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.warn("Failed to cleanup image file:", cleanupError);
      }
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

    const [rows] = await db.execute(
      "SELECT id, title, paragraph, time, likes, image FROM Post WHERE user_id = ? ORDER BY time DESC",
      [userId]
    );

    return NextResponse.json({ posts: rows });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
