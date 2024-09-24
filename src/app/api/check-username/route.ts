import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

const axiosIGClient = axios.create();

export async function POST(request: NextRequest) {
  const { username } = await request.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const response = await axiosIGClient.get(
      `https://www.instagram.com/${username}/`,
      {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.7",
          "Cache-Control": "max-age=0",
          Cookie:
            "csrftoken=8itmfqOZ9pW8bR42I3y9Wk; ig_did=0C826C21-17C3-444A-ABB7-EBABD37214D7; mid=ZvL-IgAEAAGfkZ0euP6AF4ra66Mr; wd=911x794",
          Priority: "u=0, i",
          Referer: `https://www.instagram.com/${username}/`,
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        },
        timeout: 5000,
      }
    );

    const html = response.data;
    const $ = cheerio.load(html);
    const redirectUrl = $("link[rel='alternate']").attr("href");
    const isRedirected = redirectUrl?.includes("instagram.com/accounts/login");

    if (isRedirected) {
      throw new Error("Failed to fetch profile, redirected to login page");
    }

    const metaTag = $("meta[property='og:title']").attr("content");

    return NextResponse.json({
      username,
      suspended: !metaTag,
      metadata: {
        title: metaTag,
        description: $("meta[property='og:description']").attr("content"),
        image: $("meta[property='og:image']").attr("content"),
        type: $("meta[property='og:type']").attr("content"),
        url: $("meta[property='og:url']").attr("content"),
        fullHtml: html,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        username,
        error: error.message,
        status: error.response?.status,
        suspended: null,
      });
    }
    const errorMessage =
      (error as Error)?.message || "An unexpected error occurred";
    return NextResponse.json({
      username,
      error: errorMessage,
      suspended: null,
    });
  }
}
