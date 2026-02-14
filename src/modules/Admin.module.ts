import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { AdminService, SalesOfficerService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    AdminService,
    DatabaseProvider,
    UserService,
    SalesOfficerService,
    JwtCookieAuthGuard,
  ],
  controllers: [AdminController],
  exports: [JwtCookieAuthGuard],
})
export class AdminModule {}
