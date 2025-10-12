import {
  generateJWTwithHMAC,
  verifyJWTwithHMAC,
} from "@dolphjs/dolph/utilities";
import { Response } from "express";
import { IAccount } from "@/components/account/account.model";

export class TokensService {
  public async generateToken(userId: string) {
    const accessToken = generateJWTwithHMAC({
      payload: { sub: userId, exp: 100000000000 } as any,
      secret: "VerySecretive",
    });

    const refreshToken = generateJWTwithHMAC({
      payload: { sub: userId, exp: 100000000000 } as any,
      secret: "VerySecretive",
    });

    return { accessToken, refreshToken };
  }

  public sendCookie(token: string, res: Response, data: any) {
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return data;
  }
}
