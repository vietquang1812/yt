"use client";
import Link from "next/link";
export function HeaderComponent({ project, }: {
    project: any
}) {
    return (
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
                <div className="d-flex align-items-center gap-2">
                    <Link className="link-light opacity-75" href="/projects">
                        ← Projects
                    </Link>
                    <span className="opacity-50">/</span>
                    <span className="fw-semibold">{project.topic}</span>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2">
                <Link className="btn btn-sm btn-outline-info ms-2" href={`/projects/${project.id}/chatgpt`}>
                    ChatGPT Prompts
                </Link>
            </div>
        </div>
    );

}