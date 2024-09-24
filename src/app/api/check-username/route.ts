import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { HttpsProxyAgent } from "https-proxy-agent";

const axiosIGClient = axios.create();

async function updateProxy() {
  const response = await axiosIGClient.get(
    "https://gimmeproxy.com/api/getProxy",
    {
      timeout: 5000,
    }
  );
  const proxy = response.data?.ipPort;
  if (!proxy) {
    throw new Error("Failed to fetch proxy");
  }
  return new HttpsProxyAgent(`http://${proxy}`, {
    timeout: 5000,
  });
}

export async function POST(request: NextRequest) {
  const { username } = await request.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const agent = await updateProxy();
    const response = await axiosIGClient.get(
      `https://www.instagram.com/${username}/`,
      { httpsAgent: agent, timeout: 5000 }
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
