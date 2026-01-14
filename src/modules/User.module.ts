import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from 'src/controllers';
import { AuthMiddleware } from 'src/middlewares/Auth.middleware';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { UserService } from 'src/services';

@Module({
  imports: [
    JwtModule.register({
      secret: 'fatima-marketing-rehan', // ✅ MUST match the secret in UserService
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, DatabaseProvider, AuthMiddleware], // ✅ Add as provider
  exports: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/verify-token', method: RequestMethod.GET },
        { path: 'auth/google/login', method: RequestMethod.GET },
        { path: 'auth/google/callback', method: RequestMethod.GET },
        { path: 'auth/logout', method: RequestMethod.GET },
      )
      .forRoutes(UserController); // ✅ Apply to all UserController routes
  }
}
