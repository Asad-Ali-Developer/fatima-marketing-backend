import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from 'src/controllers';
import { DatabaseProvider } from 'src/provider/DatabaseProvider';
import { UserService } from 'src/services';
// import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: '1h' },
    }),
    // ConfigModule.forRoot()
  ],
  controllers: [UserController],
  providers: [UserService, DatabaseProvider],
  exports: [UserService],
})
export class UserModule {}
