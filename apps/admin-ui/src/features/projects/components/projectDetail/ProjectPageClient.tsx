"use client";
import { useEffect, useState } from "react";
import { HeaderComponent } from "./HeaderComponent";
import { fetchJSON } from "@/lib/api/fetchJSON";
import { NextIdeaComponent } from "./NextIdeaComponent";
import { BodyComponent } from "./BodyComponent";

export function ProjectPageClient({ projectId }: { projectId: string }) {

    const [project, setProject] = useState({});

    async function loadPromptPack() {
        const p = await fetchJSON<any>(
            `/api/projects/${projectId}`
        );
        setProject(p);

    }

    useEffect(() => {
        loadPromptPack();
    }, [projectId]);

    return (
        <div className="container-fluid py-4">
            <HeaderComponent project={project} />
            <div className="mt-5">
                <BodyComponent project={project} />
            </div>
            <div className="mt-2">
                <NextIdeaComponent project={project} />
            </div>
        </div>
    )
}