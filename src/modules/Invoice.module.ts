import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InvoiceController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { InvoiceService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    InvoiceService,
    DatabaseProvider,
    UserService,
    JwtCookieAuthGuard,
  ],
  controllers: [InvoiceController],
  exports: [JwtCookieAuthGuard],
})
export class InvoiceModule {}
