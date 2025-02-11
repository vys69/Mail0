import { NextRequest } from "next/server";
import { createDriver } from "../driver";
import { account } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export const GET = async (
  { headers }: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    console.log(`📨 API: Received request for email ${id}`);

    const session = await auth.api.getSession({ headers });
    if (!session) {
      console.log(`❌ API: Unauthorized request for email ${id} - no session`);
      return new Response("Unauthorized", {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log(`✓ API: Session validated for user ${session.user.id}`);

    const [foundAccount] = await db
      .select()
      .from(account)
      .where(eq(account.userId, session.user.id));
    if (!foundAccount?.accessToken || !foundAccount.refreshToken) {
      console.log(`❌ API: Unauthorized request for email ${id} - no account tokens`);
      return new Response("Unauthorized", {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log(`✓ API: Found account tokens for user ${session.user.id}`);

    const gmail = createDriver("google", {
      auth: {
        access_token: foundAccount.accessToken,
        refresh_token: foundAccount.refreshToken,
      },
    });

    console.log(`🔄 API: Fetching email ${id} from Gmail...`);
    const res = await gmail.get(id);
    console.log(`✅ API: Successfully fetched email ${id}`, {
      hasBody: !!res.body,
      hasProcessedHtml: !!res.processedHtml,
      contentLength: res.processedHtml?.length,
    });

    return new Response(JSON.stringify(res), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch email",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};
