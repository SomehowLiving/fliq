import { DolphFactory } from "@dolphjs/dolph";
import { AccountComponent } from "./components/account/account.component";
import { TransactionComponent } from "./components/transaction/transaction.component";
import { BillComponent } from "./components/bill/bill.component";

const dolph = new DolphFactory([
  AccountComponent,
  TransactionComponent,
  BillComponent,
]);
dolph.start();
