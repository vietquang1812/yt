export type SeriesMemoryDto = {
  id: string;
  seriesId: string;
  memory: Record<string, any>;
  updatedAt?: string;
};

export type SeriesDto = {
  id: string;
  name: string;
  bible?: Record<string, any>;
  disabled?: boolean; // NEW
  memory?: SeriesMemoryDto | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSeriesDto = {
  name: string;
  bible: Record<string, any>;
};

export type UpdateSeriesDto = {
  name?: string;
  bible?: Record<string, any>;
  disabled?: boolean;
};
