import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LeadController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { LeadService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  providers: [LeadService, DatabaseProvider, UserService, JwtCookieAuthGuard],
  controllers: [LeadController],
  exports: [JwtCookieAuthGuard],
})
export class LeadModule {}
