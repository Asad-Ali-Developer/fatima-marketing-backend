import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  AdminModule,
  InvoiceModule,
  LeadModule,
  SalesOfficerModule,
  SuperAdminModule,
  UserModule,
} from './modules';

@Module({
  imports: [
    UserModule,
    SuperAdminModule,
    SalesOfficerModule,
    InvoiceModule,
    AdminModule,
    LeadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
