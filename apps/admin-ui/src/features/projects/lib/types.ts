export type StatusAlert =
  | { variant: "info" | "success" | "warning" | "danger"; html: string }
  | null;

export type SegmentLike = {
  id?: string | number;
  segment_id?: string | number;
  index?: number;
  title?: string;
  name?: string;

  narration?: string;
  voiceover?: string;
  text?: string;
  script?: string;
  content?: string;

  start?: number | string;
  end?: number | string;

  image_prompt?: string;
  video_prompt?: string;
  negative_prompt?: string;

  style?: string;
  background?: string;
  emotion?: string;
  visual_notes?: string;

  [k: string]: any;
};

export function getSegmentId(seg: SegmentLike, i: number) {
  const raw = seg?.id ?? seg?.segment_id ?? seg?.index ?? i + 1;
  return String(raw);
}

export function pickNarration(seg: SegmentLike) {
  return seg?.narration ?? seg?.voiceover ?? seg?.text ?? seg?.script ?? seg?.content ?? "";
}

export function pickTitle(seg: SegmentLike, i: number) {
  return seg?.title || seg?.name || `Scene ${i + 1}`;
}
