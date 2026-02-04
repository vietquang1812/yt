"use client";

export function LiveStatusCard() {
  return (
    <div className="card bg-dark text-white border-0 mt-3" style={{ borderRadius: 16 }}>
      <div className="card-body">
        <div className="fw-semibold mb-2">Live status</div>
        <div className="text-secondary small">
          This page auto-checks QA results every few seconds after you click{" "}
          <span className="text-white">Run pipeline</span> or{" "}
          <span className="text-white">Refine &amp; Re-QA</span>. When QA becomes{" "}
          <span className="text-white">approved</span>, it will auto-reload.
        </div>
      </div>
    </div>
  );
}
