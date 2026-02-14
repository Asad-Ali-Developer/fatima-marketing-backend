import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ExpenseController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { ExpenseService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    ExpenseService,
    DatabaseProvider,
    UserService,
    JwtCookieAuthGuard,
  ],
  controllers: [ExpenseController],
  exports: [JwtCookieAuthGuard],
})
export class ExpenseModule {}
