import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { QueueService } from "./queue.service";
@Module({
  imports: [
    BullModule.forRoot({ connection: { host: process.env.REDIS_HOST || "localhost", port: Number(process.env.REDIS_PORT || 6379) } }),
    BullModule.registerQueue({ name:"pipeline" }, { name:"llm" }, { name:"assets" }, { name:"media" }),
  ],
  providers:[QueueService],
  exports:[QueueService],
})
export class QueueModule {}
