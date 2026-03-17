import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-fluid">
      <div className="row" style={{ minHeight: "100vh" }}>
        <aside className="col-12 col-md-3 col-lg-2 border-end p-0">
          <div className="p-3 mt-4">
            <div className="fw-bold">
              <Link href={'/'} >
                Home
              </Link>

            </div>
          </div>
          <div className="list-group list-group-flush">
            <div className="list-group list-group-flush">
              <Link className="list-group-item list-group-item-action" href="/projects">
                Projects
              </Link>

              <Link className="list-group-item list-group-item-action" href="/series">
                Series
              </Link>
              <Link className="list-group-item list-group-item-action" href="/prompts">
                Prompts
              </Link>
              <span></span>
            </div>

          </div>
        </aside>

        <main className="col p-3 col-md-9 col-lg-10">
          {children}
        </main>
      </div>
    </div>
  );
}
