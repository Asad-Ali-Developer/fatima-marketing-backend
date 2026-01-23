import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from 'src/controllers';
import { AuthMiddleware } from 'src/middlewares';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { AdminService, SalesOfficerService, UserService } from 'src/services';

@Module({
  imports: [
    JwtModule.register({
      secret: 'fatima-marketing-rehan',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AdminService, DatabaseProvider, UserService, SalesOfficerService],
  controllers: [AdminController],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(AdminController);
  }
}
