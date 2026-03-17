import { forwardRef, Module } from '@nestjs/common';
import { PipelineModule } from '../pipeline/pipeline.module';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';

@Module({ controllers: [PromptsController] })

@Module({
    imports: [forwardRef(() => PipelineModule)],
    controllers: [PromptsController],
    providers: [PromptsService],
    exports: [PromptsService],
})
export class PromptsModule { }
