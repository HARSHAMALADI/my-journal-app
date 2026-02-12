import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid iCal URL" }, { status: 400 });
    }

    // Convert webcal:// to https://
    const fetchUrl = url.replace(/^webcal:\/\//, "https://");

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Journal-App/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch iCal data" },
        { status: response.status }
      );
    }

    const icsData = await response.text();
    return NextResponse.json({ icsData });
  } catch (error) {
    console.error("iCal proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
