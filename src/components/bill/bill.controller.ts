import { DolphControllerHandler } from "@dolphjs/dolph/classes";
import {
  Dolph,
  DRequest,
  DResponse,
  SuccessResponse,
} from "@dolphjs/dolph/common";
import {
  DBody,
  DParam,
  DReq,
  DRes,
  Get,
  Post,
  Route,
  Shield,
} from "@dolphjs/dolph/decorators";
import { authShield } from "@/shared/shields/auth.shield";
import { BillService } from "./bill.service";
import { CreateBillDto } from "./bill.dto";

@Route("bills")
@Shield(authShield)
export class BillController extends DolphControllerHandler<Dolph> {
  private readonly billService: BillService;

  constructor() {
    super();
    this.billService = new BillService();
  }

  @Post("create")
  async createBill(
    @DBody(CreateBillDto) body: CreateBillDto,
    @DReq() req: DRequest,
    @DRes() res: DResponse
  ) {
    const result = await this.billService.createBill(
      body,
      req.payload.sub as string
    );
    SuccessResponse({ res, body: result });
  }

  @Post(":id/pay")
  async payShare(
    @DParam("id") billId: string,
    @DReq() req: DRequest,
    @DRes() res: DResponse
  ) {
    const result = await this.billService.payShare(
      billId,
      req.payload.sub as string
    );
    SuccessResponse({ res, body: result });
  }

  @Get(":id")
  async getBillDetails(@DParam("id") billId: string, @DRes() res: DResponse) {
    const result = await this.billService.getBillDetails(billId);
    SuccessResponse({ res, body: result });
  }

  @Get("/my-bills")
  async getMyBills(@DReq() req: DRequest, @DRes() res: DResponse) {
    const result = await this.billService.getMyBills(req.payload.sub as string);
    SuccessResponse({ res, body: result });
  }
}
