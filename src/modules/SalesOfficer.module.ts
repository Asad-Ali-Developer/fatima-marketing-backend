import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SalesOfficerController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { SalesOfficerService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  controllers: [SalesOfficerController],
  providers: [
    SalesOfficerService,
    DatabaseProvider,
    UserService,
    JwtCookieAuthGuard,
  ],
  exports: [SalesOfficerService, JwtCookieAuthGuard],
})
export class SalesOfficerModule {}
