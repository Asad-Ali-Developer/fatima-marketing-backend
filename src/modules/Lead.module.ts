import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LeadController } from 'src/controllers';
import { AuthMiddleware } from 'src/middlewares';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { LeadService, UserService } from 'src/services';

@Module({
  imports: [
    JwtModule.register({
      secret: 'fatima-marketing-rehan',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [LeadService, DatabaseProvider, UserService],
  controllers: [LeadController],
})
export class LeadModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(LeadController);
  }
}
