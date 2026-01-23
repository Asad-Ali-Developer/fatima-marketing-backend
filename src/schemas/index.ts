import { UserSchema } from './User.schemas';
import { InvoiceSchema } from './Invoice.schema';
import { InvoiceDocument, Invoice } from './Invoice.schema';
import { UserDocument, User } from './User.schemas';
import { Lead, LeadDocument, leadSchema } from './Lead.schema';

export { UserSchema, User, InvoiceSchema, leadSchema};
export type { UserDocument, InvoiceDocument, Invoice, Lead, LeadDocument };
