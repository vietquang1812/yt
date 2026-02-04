"use client";

import { useEffect, useState } from "react";
import { getProjects } from "../api";
import type { ProjectDto } from "../types";

export function useProjects() {
  const [data, setData] = useState<ProjectDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    getProjects()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));

    return () => { alive = false; };
  }, []);

  return { data, loading, error };
}
