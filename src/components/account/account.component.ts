import { Component } from "@dolphjs/dolph/decorators";
import { AccountController } from "./account.controller";
import { AccountService } from "./account.service";

@Component({ controllers: [AccountController], services: [AccountService] })
export class AccountComponent {}
