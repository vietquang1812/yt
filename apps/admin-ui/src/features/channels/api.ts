import { apiFetch } from "@/lib/api/client";
import { ChannelDto } from "./type";
import { fetchJSON } from "@/lib/api/fetchJSON";

export async function getChannels() {
    // return await fetchJSON("/api/channels");
    const res = await apiFetch<ChannelDto[] | { items?: ChannelDto[] }>("/api/channels");
    return Array.isArray(res) ? res : (res.items ?? []);
}

export function createChannel(body: ChannelDto) {
    return apiFetch<ChannelDto | { id: string } | any>("/api/channels", {
        method: "POST",
        body: JSON.stringify(body),
    });
}

// export async function uploadImage(file: any) {
//     // return apiFetch("/api/channels/upload", {
//     //     method: "POST",
//     //     body: body,
//     // });

//     const result = await apiUpload<{ url: string }>("/api/channels/upload", file);
//     console.log("Ảnh đã upload thành công:", result.url);
// }

export function getChannelById(seriesId: string) {
    return apiFetch<ChannelDto>(`/api/channels/${seriesId}`);
}

export function updateChannel(seriesId: string, body: ChannelDto) {
    return apiFetch<ChannelDto>(`/api/channels/${seriesId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
}

export async function apiUpload<T>(
    file: File | Blob,
): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    return fetchJSON<T>('/api/channels/upload', {
        method: "POST",
        body: formData,
        headers: {
        },
    });
}
