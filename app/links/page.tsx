import { headers } from "next/headers";
import { db } from "../../lib/db";
import { fmtDate } from "../../lib/format";
import LinkRowActions from "../../components/LinkRowActions";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const { data: links } = await db
    .from("share_links")
    .select("*")
    .order("created_at", { ascending: false });

  const h = headers();
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("host");
  const origin = `${proto}://${host}`;

  const rows = links || [];
  const now = new Date();

  return (
    <>
      <header>
        <div className="head-top">
          <div>
            <img src="/bastion-logo.png" alt="Bastion" className="brand-logo" />
            <div className="eyebrow">Bastion Commercial Strategy</div>
            <h1>Client links</h1>
          </div>
          <a className="btn" href="/">← Back to viewer</a>
        </div>
        <p className="lede">Every link that's been created, newest first. Revoke a link to cut off access immediately.</p>
        <p className="share-note">Passwords are hashed and can't be retrieved — use Reset password to issue a new one if a client loses theirs.</p>
      </header>

      <main>
        {rows.length === 0 ? (
          <div className="empty-panel">No client links yet — create one from the main page.</div>
        ) : (
          <div className="links-tbl-wrap">
            <table className="links-tbl">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Link</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Views</th>
                  <th>Last viewed</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((link) => {
                  const expired = new Date(link.expires_at) < now;
                  const status = link.revoked ? "Revoked" : expired ? "Expired" : "Live";
                  const muted = status !== "Live";
                  const url = `${origin}/c/${link.slug}`;
                  return (
                    <tr key={link.id} className={muted ? "muted" : ""}>
                      <td>{link.client_name}</td>
                      <td className="mono">{url}</td>
                      <td className="mono">{fmtDate(link.created_at)}</td>
                      <td className="mono">{fmtDate(link.expires_at)}</td>
                      <td className="mono">{link.view_count}</td>
                      <td className="mono">{fmtDate(link.last_viewed_at)}</td>
                      <td><span className={`status-badge status-${status.toLowerCase()}`}>{status}</span></td>
                      <td><LinkRowActions slug={link.slug} url={url} revoked={link.revoked} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
