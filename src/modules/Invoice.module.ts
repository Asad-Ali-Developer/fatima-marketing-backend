import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InvoiceController } from 'src/controllers';
import { AuthMiddleware } from 'src/middlewares';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { InvoiceService, UserService } from 'src/services';

@Module({
  imports: [
    JwtModule.register({
      secret: 'fatima-marketing-rehan',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [InvoiceService, DatabaseProvider, UserService],
  controllers: [InvoiceController],
})
export class InvoiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(InvoiceController);
  }
}
