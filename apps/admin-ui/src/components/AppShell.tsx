import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-fluid">
      <div className="row" style={{ minHeight: "100vh" }}>
        <aside className="col-12 col-md-3 col-lg-2 border-end p-0">
          <div className="p-3">
            <div className="fw-bold">Admin UI</div>
            <div className="text-secondary small">bull-board</div>
          </div>
          <div className="list-group list-group-flush">
            <Link className="list-group-item list-group-item-action" href="/projects">
              Projects
            </Link>
          </div>
        </aside>

        <main className="col p-3">
          {children}
        </main>
      </div>
    </div>
  );
}
