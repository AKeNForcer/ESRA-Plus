import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { responseJson } from './share/util/response.util';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): object {
    return responseJson(this.appService.getHello());
  }
}
