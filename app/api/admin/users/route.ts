// app/api/admin/users/route.ts
import { NextResponse, NextRequest } from "next/server";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const birthday = formData.get("birthday") as string;
    const dateOfDeath = formData.get("dateOfDeath") as string;
    const gender = formData.get("gender") as string;
    const address = formData.get("address") as string;
    const intro = formData.get("intro") as string;
    const icon = formData.get("icon") as File | null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let iconBuffer = null;
    let iconMimeType = null;

    // Handle icon upload if provided
    if (icon && icon.size > 0) {
      const bytes = await icon.arrayBuffer();
      iconBuffer = Buffer.from(bytes);
      iconMimeType = icon.type;

      // Optional: Validate image type
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

      // Optional: Check file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
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

    // Insert the user into database
    const [result] = await db.execute(
      "INSERT INTO User (icon_blob, icon_mime_type, name, birthday, dateOfDeath, gender, address, intro) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        iconBuffer,
        iconMimeType,
        name,
        birthdayValue,
        dateOfDeathValue,
        gender,
        address,
        intro,
      ]
    );

    // Get the created user (without the blob data for response)
    const insertId = (result as any).insertId;
    const [createdUser] = await db.execute(
      "SELECT id, icon_mime_type, name, birthday, dateOfDeath, gender, address, intro FROM User WHERE id = ?",
      [insertId]
    );

    const user = (createdUser as any[])[0];
    // Add a flag to indicate if icon exists
    user.has_icon = !!user.icon_mime_type;

    return NextResponse.json({
      message: "User created successfully",
      user: user,
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string; // Changed from "id" to "userId" to match frontend
    const name = formData.get("name") as string;
    const birthday = formData.get("birthday") as string;
    const dateOfDeath = formData.get("dateOfDeath") as string;
    const gender = formData.get("gender") as string;
    const address = formData.get("address") as string;
    const intro = formData.get("intro") as string;
    const icon = formData.get("icon") as File | null;
    const removeIcon = formData.get("removeIcon") as string; // Added support for icon removal

    if (!userId || !name) {
      return NextResponse.json(
        { error: "User ID and name are required" },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);
    let iconBuffer = null;
    let iconMimeType = null;
    let shouldUpdateIcon = false;

    // Handle icon removal
    if (removeIcon === "true") {
      iconBuffer = null;
      iconMimeType = null;
      shouldUpdateIcon = true;
    }
    // Handle icon upload if provided
    else if (icon && icon.size > 0) {
      const bytes = await icon.arrayBuffer();
      iconBuffer = Buffer.from(bytes);
      iconMimeType = icon.type;
      shouldUpdateIcon = true;

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

      // Check file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
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

    let result;
    // Update the user - update icon if needed
    if (shouldUpdateIcon) {
      [result] = await db.execute(
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
    } else {
      [result] = await db.execute(
        "UPDATE User SET name = ?, birthday = ?, dateOfDeath = ?, gender = ?, address = ?, intro = ? WHERE id = ?",
        [
          name,
          birthdayValue,
          dateOfDeathValue,
          gender,
          address,
          intro,
          userIdNum,
        ]
      );
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    // First, delete associated posts and their comments
    const [posts] = await db.execute("SELECT id FROM Post WHERE user_id = ?", [
      parseInt(userId),
    ]);

    const postIds = (posts as any[]).map((post) => post.id);

    if (postIds.length > 0) {
      // Delete comments for all posts by this user
      await db.execute(
        `DELETE FROM Comment WHERE post_id IN (${postIds
          .map(() => "?")
          .join(",")})`,
        postIds
      );

      // Delete all posts by this user
      await db.execute("DELETE FROM Post WHERE user_id = ?", [
        parseInt(userId),
      ]);
    }

    // Then delete the user (icon will be automatically deleted with the row)
    const [result] = await db.execute("DELETE FROM User WHERE id = ?", [
      parseInt(userId),
    ]);

    // Check if any rows were affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User and associated data deleted successfully",
    });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user") || url.searchParams.get("id"); // Support both 'user' and 'id' params

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
