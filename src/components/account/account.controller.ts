import { DolphControllerHandler } from "@dolphjs/dolph/classes";
import {
  Dolph,
  SuccessResponse,
  DRequest,
  DResponse,
} from "@dolphjs/dolph/common";
import {
  DBody,
  DParam,
  DQuery,
  DReq,
  DRes,
  Get,
  Post,
  Route,
  Shield,
  UnShield,
} from "@dolphjs/dolph/decorators";
import { AccountService } from "./account.service";
import {
  FarcasterLoginDto,
  GoogleLoginDto,
  SetUsernameDto,
} from "./account.dto";
import { authShield } from "@/shared/shields/auth.shield";

@Shield(authShield)
@Route("account")
export class AccountController extends DolphControllerHandler<Dolph> {
  private readonly accountService: AccountService;

  constructor() {
    super();
    this.accountService = new AccountService();
  }

  @UnShield(authShield)
  @Post("login/google")
  async googleLogin(
    @DBody(GoogleLoginDto) body: GoogleLoginDto,
    @DRes() res: DResponse
  ) {
    const result = await this.accountService.loginWithGoogle(body);
    SuccessResponse({ res, body: result });
  }

  @UnShield(authShield)
  @Post("login/farcaster")
  async farcasterLogin(
    @DBody(FarcasterLoginDto) body: FarcasterLoginDto,
    @DRes() res: DResponse
  ) {
    const result = await this.accountService.loginWithFarcaster(body);
    SuccessResponse({ res, body: result });
  }

  @Post("set-username")
  async setUsername(
    @DBody(SetUsernameDto) body: SetUsernameDto,
    @DRes() res: DResponse,
    @DReq() req: DRequest
  ) {
    const result = await this.accountService.createUsername(
      body,
      req.payload.sub as string
    );
    SuccessResponse({ res, body: result });
  }

  @Get("search")
  async searchUsers(@DReq() req: DRequest, @DRes() res: DResponse) {
    const result = await this.accountService.searchUsers(
      req.query.query as string
    );
    SuccessResponse({ res, body: result });
  }

  @Get(":username")
  async getUserByUsername(@DReq() req: DRequest, @DRes() res: DResponse) {
    const result = await this.accountService.getUserByUsername(
      req.params.username as string
    );
    SuccessResponse({ res, body: result });
  }
}
