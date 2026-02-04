"use client";

import { useEffect, useState } from "react";
import { getProject } from "../api";
import type { ProjectDto } from "../types";

export function useProject(projectId: string) {
  const [data, setData] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    getProject(projectId)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, [projectId]);

  return { data, loading, error };
}
