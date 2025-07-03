// app/api/near-me/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";
import fetch from "node-fetch";

// Define a type for the user data we'll be working with
interface User {
  id: number;
  name: string;
  address: string;
  has_icon: boolean;
  icon_mime_type: string | null;
  lat?: number;
  lng?: number;
}

const Maps_API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY;

async function getGeocode(address: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${Maps_API_KEY}`;

  console.log("=== GEOCODING DEBUG ===");
  console.log(
    "Environment variable exists:",
    !!process.env.NEXT_PUBLIC_MAPS_API_KEY
  );
  console.log("API Key length:", Maps_API_KEY?.length || 0);
  console.log("API Key starts with:", Maps_API_KEY?.substring(0, 10) + "...");
  console.log(
    "Full URL (key hidden):",
    url.replace(Maps_API_KEY || "", "API_KEY_HIDDEN")
  );

  try {
    const response = await fetch(url);
    const data = (await response.json()) as any;

    console.log(`Geocoding response for "${address}":`, {
      status: data.status,
      error_message: data.error_message,
      results_count: data.results?.length || 0,
      full_response: data, // Log the full response for debugging
    });

    if (data.status === "OK") {
      const location = data.results[0].geometry.location;
      console.log("Successfully geocoded:", {
        lat: location.lat,
        lng: location.lng,
      });
      return { lat: location.lat, lng: location.lng };
    } else {
      console.warn(`Geocoding failed for address "${address}": ${data.status}`);
      if (data.error_message) {
        console.warn("Error message:", data.error_message);
      }
      return null;
    }
  } catch (error) {
    console.error(`Error fetching geocode for address "${address}":`, error);
    return null;
  }
}

export async function GET() {
  console.log("=== NEAR-ME API START ===");
  console.log("All environment variables:", Object.keys(process.env));
  console.log(
    "NEXT_PUBLIC_MAPS_API_KEY exists:",
    !!process.env.NEXT_PUBLIC_MAPS_API_KEY
  );

  try {
    // 1. Fetch all users from the database
    const [users] = await db.execute(
      "SELECT id, name, address, icon_mime_type FROM User WHERE address IS NOT NULL AND address != ''"
    );

    const userList = (users as any[]).map((user) => ({
      ...user,
      has_icon: !!user.icon_mime_type,
    }));

    console.log("Users fetched from database:", userList.length);
    userList.forEach((user) => console.log("User address:", user.address));

    // 2. Geocode each user's address
    const usersWithGeo = await Promise.all(
      userList.map(async (user) => {
        console.log(`\n--- Processing user: ${user.name} ---`);
        const geo = await getGeocode(user.address);
        if (geo) {
          console.log("Geocoding successful for:", user.name);
          return { ...user, lat: geo.lat, lng: geo.lng };
        }
        console.log("Geocoding failed for:", user.name);
        return null;
      })
    );

    // Filter out users for whom geocoding failed
    const validUsers = usersWithGeo.filter((user) => user !== null) as User[];

    // 3. Fetch all posts
    const [posts] = await db.execute(
      "SELECT id, user_id, title, paragraph, time, likes, image_mime_type, category FROM Post ORDER BY time DESC"
    );

    const postList = (posts as any[]).map((post) => ({
      ...post,
      has_image: !!post.image_mime_type,
    }));

    console.log(
      "Final results - Valid users:",
      validUsers.length,
      "Posts:",
      postList.length
    );
    return NextResponse.json({ users: validUsers, posts: postList });
  } catch (error) {
    console.error("Failed to fetch near me data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
