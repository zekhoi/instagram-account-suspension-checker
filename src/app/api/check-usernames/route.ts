import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

async function checkUsername(
  username: string
): Promise<{ username: string; suspended: boolean }> {
  try {
    const response = await axios.get(`https://www.instagram.com/${username}/`);
    const html = response.data;
    const $ = cheerio.load(html);
    const metaTag = $("meta[property='og:title']").attr("content");
    return { username, suspended: !metaTag };
  } catch (error) {
    console.error(`Error checking username ${username}:`, error);
    return { username, suspended: true }; // Assume suspended if there's an error
  }
}

export async function POST(request: NextRequest) {
  const { usernames } = await request.json();

  if (!usernames || !Array.isArray(usernames)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const results = await Promise.all(usernames.map(checkUsername));
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error checking usernames:", error);
    return NextResponse.json(
      { error: "An error occurred while checking usernames" },
      { status: 500 }
    );
  }
}
