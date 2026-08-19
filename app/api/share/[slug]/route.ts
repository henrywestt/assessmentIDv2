import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "../../../../lib/db";
import { verifyToken } from "../../../../lib/auth";
import { buildModel } from "../../../../lib/parse";
import { resolveInsights } from "../../../../lib/insights";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const staff = cookies().get("staff")?.value;
  if (!staff || !(await verifyToken(staff))) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data: link } = await db
    .from("share_links")
    .select("client_name, snapshot")
    .eq("slug", params.slug)
    .single();

  if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  // Resolve the same way the client view does: a link still on auto-generated
  // defaults (no customized insights array ever saved) must carry forward
  // those computed defaults, not an empty list — otherwise "carry forward"
  // silently wipes insights the client is currently seeing.
  const model = buildModel(link.snapshot.raw);
  const insights = resolveInsights(link.snapshot?.insights, model);

  return NextResponse.json({
    clientName: link.client_name,
    insights,
    propsCount: model.props.length,
  });
}
