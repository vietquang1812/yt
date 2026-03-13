export async function getImage(path: string) {
    const response = await fetch(path)

    if (response instanceof Response) {
        const buffer = await response.arrayBuffer();

        const pngBlob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
        return pngBlob
    } else {
        console.error("Dữ liệu trả về không phải là Response");
    }
    return null
}