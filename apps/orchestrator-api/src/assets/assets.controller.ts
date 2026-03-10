

import { Controller, Get, Req, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { Inject, forwardRef } from "@nestjs/common";
import { AssetsService } from './assets.service';
import { createReadStream, existsSync } from 'fs';
import { Request } from 'express';
import * as mimeTypes from 'mime-types';
@Controller("assets")
export class AssetsController {
    constructor(
        @Inject(forwardRef(() => AssetsService))
        private readonly assets: AssetsService,

    ) { }
    @Get('*')
    findAllAssets( @Req() request: Request, @Res() res: Response) {
        const fullPath = this.assets.getPath(request.path);

        if (!existsSync(fullPath)) {
            throw new NotFoundException('File không tồn tại');
        }

        const mimeType = mimeTypes.contentType(fullPath) || 'application/octet-stream';

        res.setHeader('Content-Type', mimeType);
        const file = createReadStream(fullPath);
        file.pipe(res);
    }
}