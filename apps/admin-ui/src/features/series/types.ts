export type SeriesDto = {
  id: string;
  name: string;
  bible?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSeriesDto = {
  name: string;
  bible: Record<string, any>;
};
