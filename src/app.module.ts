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
} from './modules';

import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { RateLimitService } from './services';

@Module({
  imports: [  
    UserModule, // Only this - it has everything
    LeadModule,
    AdminModule,
    SOLeadModule,
    ExpenseModule,
    InvoiceModule,
    DashboardModule,
    InventoryModule,
    SuperAdminModule,
    SalesOfficerModule,
  ],
  providers: [AppService, RateLimitService],
  controllers: [AppController],
})
export class AppModule {}