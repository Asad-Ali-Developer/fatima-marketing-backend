import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ExpenseController } from 'src/controllers';
import { AuthMiddleware } from 'src/middlewares';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { ExpenseService, UserService } from 'src/services';

@Module({
  imports: [
    JwtModule.register({
      secret: 'fatima-marketing-rehan',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [ExpenseService, DatabaseProvider, UserService],
  controllers: [ExpenseController],
})
export class ExpenseModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(ExpenseController);
  }
}
