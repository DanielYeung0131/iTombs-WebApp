// app/api/admin/users/route.ts
import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const birthday = formData.get("birthday") as string;
    const dateOfDeath = formData.get("dateOfDeath") as string;
    const gender = formData.get("gender") as string;
    const address = formData.get("address") as string;
    const intro = formData.get("intro") as string;
    const icon = formData.get("icon") as File | null;
    const removeIcon = formData.get("removeIcon") as string;

    if (!userId || !name) {
      return NextResponse.json(
        { error: "User ID and name are required" },
        { status: 400 }
      );
    }
    console.log("icon:", icon);
    const userIdNum = parseInt(userId);
    let iconBuffer = null;
    let iconMimeType = null;

    // Simple icon handling
    if (removeIcon === "true") {
      // Remove icon - set to null
      iconBuffer = null;
      iconMimeType = null;
    } else if (icon && icon.size > 0) {
      // Upload new icon
      const bytes = await icon.arrayBuffer();
      iconBuffer = Buffer.from(bytes);
      iconMimeType = icon.type;

      // Validate image type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(iconMimeType)) {
        return NextResponse.json(
          {
            error:
              "Invalid image type. Only JPEG, PNG, GIF, and WebP are allowed",
          },
          { status: 400 }
        );
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (iconBuffer.length > maxSize) {
        return NextResponse.json(
          { error: "Icon size too large. Maximum 5MB allowed" },
          { status: 400 }
        );
      }
    }

    // Convert empty strings to null for optional date fields
    const birthdayValue = birthday && birthday.trim() !== "" ? birthday : null;
    const dateOfDeathValue =
      dateOfDeath && dateOfDeath.trim() !== "" ? dateOfDeath : null;

    // Single update query - always update icon fields to maintain consistency
    const [result] = await db.execute(
      "UPDATE User SET icon_blob = ?, icon_mime_type = ?, name = ?, birthday = ?, dateOfDeath = ?, gender = ?, address = ?, intro = ? WHERE id = ?",
      [
        iconBuffer,
        iconMimeType,
        name,
        birthdayValue,
        dateOfDeathValue,
        gender,
        address,
        intro,
        userIdNum,
      ]
    );

    // Check if any rows were affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "User not found or no changes made" },
        { status: 404 }
      );
    }

    // Get the updated user (without the blob data for response)
    const [updatedUser] = await db.execute(
      "SELECT id, icon_mime_type, name, birthday, dateOfDeath, gender, address, intro FROM User WHERE id = ?",
      [userIdNum]
    );

    const user = (updatedUser as any[])[0];
    // Add a flag to indicate if icon exists
    user.has_icon = !!user.icon_mime_type;

    return NextResponse.json({
      message: "User updated successfully",
      user: user,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user") || url.searchParams.get("id");

    if (userId) {
      // Get specific user by ID
      const [rows] = await db.execute(
        "SELECT id, icon_mime_type, name, birthday, dateOfDeath, gender, address, intro FROM User WHERE id = ?",
        [parseInt(userId)]
      );

      const users = rows as any[];
      if (users.length === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const user = users[0];
      user.has_icon = !!user.icon_mime_type;

      return NextResponse.json({ user: user });
    } else {
      // Get all users
      const [rows] = await db.execute(
        "SELECT id, icon_mime_type, name, birthday, dateOfDeath, gender, address, intro FROM User ORDER BY name ASC"
      );

      // Add has_icon flag to each user
      const users = (rows as any[]).map((user) => ({
        ...user,
        has_icon: !!user.icon_mime_type,
      }));

      return NextResponse.json({ users: users });
    }
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
