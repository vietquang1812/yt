import { Body, Controller, Get, Param, Patch, Post, Inject } from "@nestjs/common";
import { SeriesService } from "./series.service";
import { forwardRef} from "@nestjs/common";

@Controller("series")
export class SeriesController {
  constructor(
    
    @Inject(forwardRef(() => SeriesService))
    private readonly series: SeriesService) {}

  @Get()
  list() {
    return this.series.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.series.get(id);
  }

  @Post()
  create(@Body() dto: { name: string; bible: any }) {
    return this.series.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: { name?: string; bible?: any; disabled?: boolean }) {
    return this.series.update(id, dto);
  }
}
