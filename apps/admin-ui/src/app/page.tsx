import Link from "next/link";

export default function Home() {
  return (
    <div className="p-4">
      <h1 className="h4">Admin UI</h1>
      <p className="text-secondary">Go to projects</p>
      <Link className="btn btn-primary" href="/projects">Open Projects</Link>
    </div>
  );
}
