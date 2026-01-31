import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SeriesService } from "./series.service";

@Controller("series")
export class SeriesController {
  constructor(private readonly series: SeriesService) {}

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
}
