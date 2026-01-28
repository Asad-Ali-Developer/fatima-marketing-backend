import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  AdminModule,
  ExpenseModule,
  InventoryModule,
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
    InventoryModule,
    ExpenseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
