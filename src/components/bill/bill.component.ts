import { Component } from "@dolphjs/dolph/decorators";
import { BillController } from "./bill.controller";

@Component({ controllers: [BillController], services: [] })
export class BillComponent {}
