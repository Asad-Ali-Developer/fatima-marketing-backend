import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SOLeadController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { SOLeadService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  providers: [SOLeadService, DatabaseProvider, UserService, JwtCookieAuthGuard],
  controllers: [SOLeadController],
  exports: [JwtCookieAuthGuard],
})
export class SOLeadModule {}
