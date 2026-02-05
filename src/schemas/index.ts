import { UserSchema } from './User.schemas';
import { InvoiceSchema } from './Invoice.schema';
import { InvoiceDocument, Invoice } from './Invoice.schema';
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
  UserSchema,
  User,
  InvoiceSchema,
  leadSchema,
  Inventory,
  InventorySchema,
  Expense,
  ExpenseSchema,
  SOLead,
  SOLeadSchema,
};
export type {
  UserDocument,
  InvoiceDocument,
  Invoice,
  Lead,
  LeadDocument,
  InventoryDocument,
  ExpenseDocument,
  SOLeadDocument,
};
