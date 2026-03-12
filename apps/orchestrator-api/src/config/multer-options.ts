import { diskStorage } from 'multer';
import { extname } from 'path';


export const multerOptions = {
    path: '/assets/uploads',
    storage: diskStorage({
        destination: '../../storage/assets/uploads',
        filename: (req, file, callback) => {

            const name = file.originalname.split('.')[0];
            const extension = extname(file.originalname);
            callback(null, `${name}-${Date.now()}${extension}`);
        },
    }),
};