import { ApiStatus } from "@/components/api-status";
import { StatusRow } from "@/components/status-row";
import { getHomepageHealth } from "@/lib/health";
import { NEXT_VERSION } from "@/lib/runtime";
import Image from "next/image";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const checkedAt = new Date().toISOString();
  const health = await getHomepageHealth();

  return (
    <main className="shell">
      <section className="diagnostic" aria-labelledby="page-title">
        <header className="heading">
          <Image
            className="mark"
            src="/proof-mark.svg"
            width="48"
            height="48"
            alt=""
            priority
            unoptimized
          />
          <div>
            <p className="context">Namecheap shared-hosting proof of concept</p>
            <h1 id="page-title">Hello World — African Storybook</h1>
            <p className="summary">
              A minimal runtime check before any SaaS development begins.
            </p>
          </div>
        </header>

        <dl className="status-list" aria-label="Hosting validation status">
          <StatusRow label="Application" value="African Storybook POC" />
          <StatusRow label="Next.js" value={NEXT_VERSION} />
          <StatusRow label="Node.js" value={process.version} />
          <StatusRow label="Server timestamp" value={checkedAt} />
          <ApiStatus />
          <StatusRow
            label="MySQL connectivity"
            status={health.database.status}
            value={health.database.label}
            detail={health.database.detail}
          />
          <StatusRow
            label="Local filesystem"
            status={health.storage.status}
            value={health.storage.label}
            detail={health.storage.detail}
          />
        </dl>

        <footer className="footer-note">
          Detailed database and storage endpoints require an administrator token.
        </footer>
      </section>
    </main>
  );
}
