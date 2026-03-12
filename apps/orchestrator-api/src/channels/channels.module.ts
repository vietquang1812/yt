import { forwardRef, Module } from '@nestjs/common';
import { ChannelsController } from './channels.controller';
import { PipelineModule } from '../pipeline/pipeline.module';
import { ChannelsService } from './channels.service';

@Module({ controllers: [ChannelsController] })

@Module({
    imports: [forwardRef(() => PipelineModule)],
    controllers: [ChannelsController],
    providers: [ChannelsService],
    exports: [ChannelsService],
})
export class ChannelsModule { }
