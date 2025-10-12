import { DolphControllerHandler } from "@dolphjs/dolph/classes";
import {
  Dolph,
  DRequest,
  DResponse,
  SuccessResponse,
} from "@dolphjs/dolph/common";
import {
  DBody,
  DReq,
  DRes,
  Post,
  Route,
  Shield,
} from "@dolphjs/dolph/decorators";
import { authShield } from "@/shared/shields/auth.shield";
import { TransactionService } from "./transaction.service";
import { SendUsdcDto } from "./transaction.dto";

@Route("transaction")
@Shield(authShield)
export class TransactionController extends DolphControllerHandler<Dolph> {
  private readonly transactionService: TransactionService;

  constructor() {
    super();
    this.transactionService = new TransactionService();
  }

  @Post("send")
  async sendUsdc(
    @DBody(SendUsdcDto) body: SendUsdcDto,
    @DReq() req: DRequest,
    @DRes() res: DResponse
  ) {
    const result = await this.transactionService.sendUsdc(
      body,
      req.payload.sub as string
    );
    SuccessResponse({ res, body: result });
  }
}
