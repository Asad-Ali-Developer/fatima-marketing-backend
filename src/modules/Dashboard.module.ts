import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DashboardController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { DashboardService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    DashboardService,
    DatabaseProvider,
    UserService,
    JwtCookieAuthGuard,
  ],
  controllers: [DashboardController],
  exports: [JwtCookieAuthGuard],
})
export class DashboardModule {}
