export async function getImage(path: string) {
    const response = await fetch(path)

    if (response instanceof Response) {
        // Bên trong block này, TypeScript tự hiểu 'response' là kiểu Response
        // const imageBlob = await response.blob();
        const buffer = await response.arrayBuffer();

        const pngBlob = new Blob([new Uint8Array(buffer)], { type: 'image/png' });
        console.log("Thành công:", pngBlob);
        return pngBlob
        // 2. Cực kỳ quan trọng: Thu hồi URL khi component unmount để tránh rò rỉ bộ nhớ
    } else {
        console.error("Dữ liệu trả về không phải là Response");
    }
    return null
}