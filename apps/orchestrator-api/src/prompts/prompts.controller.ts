
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
    Body,
    Put,
    Param
} from '@nestjs/common';
import { Inject, forwardRef } from "@nestjs/common";
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { multerOptions } from '../config/multer-options';
import { PromptsService } from './prompts.service';
import { CreatePromptDto } from './type';

@Controller("prompts")
export class PromptsController {
    constructor(
        @Inject(forwardRef(() => PromptsService))
        private readonly prompts: PromptsService,
    ) { }

    @Get()
    list() {
        return this.prompts.list();
    }

    @Post()
    create(
        @Body() dto: CreatePromptDto
    ) {
        return this.prompts.create(dto);
    }

    @Put(':promptId')
    update(
        @Body() dto: CreatePromptDto,
        @Param('promptId') promptId: string
    ) {
        return this.prompts.update(promptId, dto);
    }
}