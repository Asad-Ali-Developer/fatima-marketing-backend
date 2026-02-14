import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from 'src/controllers';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { AuthService, UserService } from 'src/services';
import { JwtCookieAuthGuard } from 'src/guards';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    AuthService,
    DatabaseProvider,
    JwtCookieAuthGuard, // Provide the guard here
  ],
  exports: [UserService, AuthService, DatabaseProvider, JwtCookieAuthGuard],
})
export class UserModule {}
