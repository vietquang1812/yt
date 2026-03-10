import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ArtifactStorage } from "@yt-ai/common";

const storage = new ArtifactStorage(
    "local",
    "../../storage"
);
@Injectable()
export class AssetsService {
     getPath(path: string) {
        return storage.getFullPath(path)
        // try {
            
        //     const fileBuffer = await storage.getAssets(path);
        //     const contentType = "image/png";

        //     return new Response(fileBuffer, {
        //         headers: { 'Content-Type': contentType },
        //     });
        // } catch (error) {
        //     return Response.json({ error: 'File không tồn tại' }, { status: 404 });
        // }
    }
}