import {
  UserModule,
  LeadModule,
  AdminModule,
  SOLeadModule,
  InvoiceModule,
  ExpenseModule,
  InventoryModule,
  DashboardModule,
  SuperAdminModule,
  SalesOfficerModule,
  AdminInvoiceModule,
  HealthModule,
} from './modules';

import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { RateLimitService } from './services';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    UserModule, // Only this - it has everything
    LeadModule,
    AdminModule,
    SOLeadModule,
    HealthModule,
    ExpenseModule,
    InvoiceModule,
    DashboardModule,
    InventoryModule,
    SuperAdminModule,
    SalesOfficerModule,
    AdminInvoiceModule,
  ],
  providers: [AppService, RateLimitService],
  controllers: [AppController],
})
export class AppModule {}
