import React from 'react';
import InvoiceTemplate from './InvoiceTemplate';
import type { Invoice } from '../../../electron/database';

export default function InvoicePDF({ invoice }: { invoice: Invoice }) {
  return <InvoiceTemplate invoice={invoice} />;
}