import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SuperAdminController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { SuperAdminService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  controllers: [SuperAdminController],
  providers: [
    SuperAdminService,
    DatabaseProvider,
    UserService,
    JwtCookieAuthGuard,
  ],
  exports: [SuperAdminService, JwtCookieAuthGuard],
})
export class SuperAdminModule {}
