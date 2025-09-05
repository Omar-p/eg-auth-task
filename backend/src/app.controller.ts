import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './iam/authentication/decorators/public.decorator';

@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  health(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
