
'use server'
import {
    Controller,
    Get,
    Post,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    Body
} from '@nestjs/common';
import { Inject, forwardRef } from "@nestjs/common";
import { ChannelsService } from './channels.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { multerOptions } from '../config/multer-options';
import { CreateChannelDto } from './type';

@Controller("channels")
export class ChannelsController {
    constructor(
        @Inject(forwardRef(() => ChannelsService))
        private readonly channels: ChannelsService,

    ) { }

    @Get()
    list() {
        return this.channels.list();
    }

    @Post()
    create(
        @Body() dto: CreateChannelDto
    ) {
        return this.channels.create(dto);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', multerOptions))
    uploadImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({
                        maxSize: 1024 * 1024 * 5,
                        message: 'File quá lớn (Tối đa 5MB)'
                    }),

                ],
            }),
        ) file: Express.Multer.File,
    ) {
        // Log để kiểm tra file đã vào đến đây chưa
        console.log('File nhận được:', file.filename);

        return {
            status: true,
            message: 'Upload thành công!',
            url: `${multerOptions.path}/${file.filename}`,
            size: file.size,
            mimetype: file.mimetype
        };
    }

}