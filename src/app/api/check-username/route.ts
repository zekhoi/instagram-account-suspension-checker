import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  const { username } = await request.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://www.instagram.com/${username}/`);
    const html = response.data;
    const $ = cheerio.load(html);
    const metaTag = $("meta[property='og:title']").attr("content");
    return NextResponse.json({ username, suspended: !metaTag });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        username,
        error: error.message,
        status: error.response?.status,
        suspended: null,
      });
    }
    return NextResponse.json({
      username,
      error: "An unexpected error occurred",
      suspended: null,
    });
  }
}
