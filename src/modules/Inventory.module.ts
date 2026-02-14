import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InventoryController } from 'src/controllers';
import { JwtCookieAuthGuard } from 'src/guards';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { InventoryService, UserService } from 'src/services';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    InventoryService,
    DatabaseProvider,
    UserService,
    JwtCookieAuthGuard,
  ],
  controllers: [InventoryController],
  exports: [JwtCookieAuthGuard],
})
export class InventoryModule {}
