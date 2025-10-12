import { AccountService } from "@/components/account/account.service";
import {
  DNextFunc,
  DRequest,
  DResponse,
  ForbiddenException,
  UnauthorizedException,
} from "@dolphjs/dolph/common";
import { verifyJWTwithHMAC } from "@dolphjs/dolph/utilities";

const accountService = new AccountService();

export const authShield = async (
  req: DRequest,
  res: DResponse,
  next: DNextFunc
) => {
  try {
    const authToken = req.headers.authorization;

    if (!authToken) {
      return next(
        new UnauthorizedException("No authentication token provided")
      );
    }

    const token = authToken.split(" ")[1];

    const payload = verifyJWTwithHMAC({
      token,
      secret: "VerySecretive",
    });

    if (!payload) {
      return next(new UnauthorizedException("Invalid or expired token"));
    }

    req.payload = {
      sub: payload.sub,
      exp: payload.exp,
      iat: payload.iat,
    };

    next();
  } catch (e) {
    next(new UnauthorizedException(e.message));
  }
};
