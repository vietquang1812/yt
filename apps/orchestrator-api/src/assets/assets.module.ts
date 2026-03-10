import { forwardRef, Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { PipelineModule } from '../pipeline/pipeline.module';
import { AssetsService } from './assets.service';

@Module({ controllers: [AssetsController] })

@Module({
    imports: [forwardRef(() => PipelineModule)],
    controllers: [AssetsController],
    providers: [AssetsService],
    exports: [AssetsService],
})
export class AssetsModule { }
