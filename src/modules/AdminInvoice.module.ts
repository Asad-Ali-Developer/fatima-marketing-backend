import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminInvoiceController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { AdminInvoiceService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    AdminInvoiceService,
    DatabaseProvider,
    UserService,
    JwtCookieAuthGuard,
  ],
  controllers: [AdminInvoiceController],
  exports: [JwtCookieAuthGuard],
})
export class AdminInvoiceModule {}
