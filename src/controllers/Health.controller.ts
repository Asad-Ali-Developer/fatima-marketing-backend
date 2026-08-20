import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { HealthService } from '../services';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private system: HealthService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // This single check now returns comprehensive Memory, Disk, and CPU data
      () => this.system.checkSystem('system_metrics'),
    ]);
  }
}
