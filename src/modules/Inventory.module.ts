import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InventoryController } from 'src/controllers';
import { AuthMiddleware } from 'src/middlewares';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { InventoryService, UserService } from 'src/services';

@Module({
  imports: [
    JwtModule.register({
      secret: 'fatima-marketing-rehan',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [InventoryService, DatabaseProvider, UserService],
  controllers: [InventoryController],
})
export class InventoryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(InventoryController);
  }
}
