import { DolphServiceHandler } from "@dolphjs/dolph/classes";
import {
  BadRequestException,
  Dolph,
  NotFoundException,
} from "@dolphjs/dolph/common";
import { InjectMongo } from "@dolphjs/dolph/decorators";
import { Model } from "mongoose";
import { AccountModel, IAccount, LoginMode } from "./account.model";
import { GoogleLoginDto, FarcasterLoginDto } from "./account.dto";
import { Response } from "express";
import { TokensService } from "./token.service";
import { ChipiService } from "@/shared/services/chipi.service";
import { StarknetService } from "@/shared/services/starkent.service";

@InjectMongo("accountModel", AccountModel)
export class AccountService extends DolphServiceHandler<Dolph> {
  accountModel!: Model<IAccount>;
  private readonly chipiService: ChipiService;
  private readonly starknetService: StarknetService;
  private readonly tokenService: TokensService;

  constructor() {
    super("accountservice");
    this.chipiService = new ChipiService();
    this.tokenService = new TokensService();
    this.starknetService = new StarknetService();
  }

  public async loginWithGoogle(dto: GoogleLoginDto) {
    let account = await this.accountModel.findOne({ email: dto.email });

    if (!account) {
      const wallet = await this.chipiService.createWallet(dto.email);

      const metaData = {
        privateKey: wallet.wallet.encryptedPrivateKey,
        publicKey: wallet.wallet.normalizedPublicKey,
      };

      account = await this.accountModel.create({
        email: dto.email,
        image: dto.image,
        loginMode: LoginMode.Gmail,
        walletAddress: wallet.walletPublicKey,
        metaData,
      });
    }

    const { accessToken } = await this.tokenService.generateToken(account._id);

    return {
      message: "Login successful",
      accessToken,
      data: account,
    };
  }

  public async loginWithFarcaster(dto: FarcasterLoginDto) {
    let account = await this.accountModel.findOne({
      farcasterId: dto.farcasterId,
    });

    if (!account) {
      const wallet = await this.chipiService.createWallet(dto.farcasterId);

      const metaData = {
        privateKey: wallet.wallet.encryptedPrivateKey,
        publicKey: wallet.wallet.normalizedPublicKey,
      };

      account = await this.accountModel.create({
        farcasterId: dto.farcasterId,
        farcasterHandle: dto.farcasterHandle,
        image: dto.image,
        loginMode: LoginMode.Farcaster,
        walletAddress: wallet.walletPublicKey,
        metaData,
      });
    }

    const { accessToken } = await this.tokenService.generateToken(account._id);

    return {
      message: "Login successful",
      accessToken,
      data: account,
    };
  }

  async searchUsers(query: string) {
    if (!query || query.length < 2) {
      throw new BadRequestException(
        "Search query must be at least 2 characters long."
      );
    }
    const users = await this.accountModel
      .find({
        username: { $regex: query, $options: "i" },
      })
      .select("username image walletAddress");

    return { message: "Users retrieved successfully", data: users };
  }

  async getUserByUsername(username: string) {
    const user = await this.accountModel
      .findOne({ username })
      .select("username image walletAddress createdAt");

    if (!user) {
      throw new NotFoundException("User not found.");
    }
    return { message: "User found successfully", data: user };
  }

  async createUsername(dto: { username: string }, userId: string) {
    const isUsernameTaken = await this.accountModel.findOne({
      username: dto.username,
    });
    if (isUsernameTaken) {
      throw new BadRequestException("Username has been taken");
    }

    const account = await this.accountModel.findById(userId);

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    const registerTxPayload = this.starknetService.prepareRegisterUsernameTx(
      dto.username
    );

    console.log("Register_TX_Payload: ", registerTxPayload);

    const txResponse = await this.chipiService.execute(
      account.metaData.privateKey,
      account.metaData.publicKey,
      registerTxPayload
    );

    console.log("TX_RESPONSE: ", txResponse);

    await this.starknetService.waitForTransaction(txResponse);

    await account.updateOne({ username: dto.username });

    return { message: "Username has been set successfully", account };
  }
}
