import { UserSchema } from './User.schemas';
import { InvoiceSchema } from './Invoice.schema';
import { InvoiceDocument, Invoice } from './Invoice.schema';
import {
  AdminInvoice,
  AdminInvoiceDocument,
  AdminInvoiceSchema,
} from './AdminInvoice.schema';
import { UserDocument, User } from './User.schemas';
import { Lead, LeadDocument, leadSchema } from './Lead.schema';
import {
  Inventory,
  InventoryDocument,
  InventorySchema,
} from './Inventory.schema';
import { SOLeadDocument, SOLead, SOLeadSchema } from './SOLead.schema';
import { Expense, ExpenseDocument, ExpenseSchema } from './Expense';

export {
  User,
  SOLead,
  Expense,
  Inventory,
  UserSchema,
  leadSchema,
  SOLeadSchema,
  AdminInvoice,
  InvoiceSchema,
  ExpenseSchema,
  InventorySchema,
  AdminInvoiceSchema,
};
export type {
  Lead,
  Invoice,
  LeadDocument,
  UserDocument,
  SOLeadDocument,
  ExpenseDocument,
  InvoiceDocument,
  InventoryDocument,
  AdminInvoiceDocument,
};
