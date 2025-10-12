import { Component } from "@dolphjs/dolph/decorators";
import { TransactionController } from "./transaction.controller";
import { TransactionService } from "./transaction.service";

@Component({
  controllers: [TransactionController],
  services: [TransactionService],
})
export class TransactionComponent {}
