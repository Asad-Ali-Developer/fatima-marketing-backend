import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesOfficerModule, SuperAdminModule, UserModule } from './modules';

@Module({
  imports: [UserModule, SuperAdminModule, SalesOfficerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
