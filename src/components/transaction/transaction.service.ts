import { DolphServiceHandler } from "@dolphjs/dolph/classes";
import { Dolph, NotFoundException } from "@dolphjs/dolph/common";
import { InjectMongo } from "@dolphjs/dolph/decorators";
import { Model } from "mongoose";
import {
  TransactionModel,
  ITransaction,
  TransactionStatus,
  TransactionType,
} from "./transaction.model";
import { AccountModel, IAccount } from "../account/account.model";
import { ChipiService } from "@/shared/services/chipi.service";
import { SendUsdcDto } from "./transaction.dto";
import { StarknetService } from "@/shared/services/starkent.service";

@InjectMongo("transactionModel", TransactionModel)
@InjectMongo("accountModel", AccountModel)
export class TransactionService extends DolphServiceHandler<Dolph> {
  transactionModel!: Model<ITransaction>;
  accountModel!: Model<IAccount>;
  private readonly starknetService: StarknetService;
  private readonly chipiService: ChipiService;

  constructor() {
    super("transactionservice");
    this.starknetService = new StarknetService();
    this.chipiService = new ChipiService();
  }

  async sendUsdc(dto: SendUsdcDto, senderId: string) {
    const sender = await this.accountModel.findById(senderId);
    if (!sender) {
      throw new NotFoundException("Sender account not found.");
    }

    const recipient = await this.accountModel.findOne({
      username: dto.recipientUsername,
    });
    if (!recipient) {
      throw new NotFoundException("Recipient username not found.");
    }

    const amountInSmallestUnit = BigInt(dto.amount * 10 ** 6);
    const transferPayload = {
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      entrypoint: "transfer",
      calldata: [recipient.walletAddress, amountInSmallestUnit],
    };

    const transferTxResponse = await this.chipiService.execute(
      sender.metaData.privateKey,
      sender.metaData.publicKey,
      transferPayload
    );

    const transferTxHash = transferTxResponse;

    const newTransaction = await this.transactionModel.create({
      sender: sender._id,
      recipient: recipient._id,
      type: TransactionType.Send,
      amount: dto.amount,
      description: dto.message || "",
      hash: transferTxHash,
      status: TransactionStatus.Pending,
    });

    const metadataPayload = this.starknetService.prepareAddMetadataTx(
      transferTxHash,
      recipient.walletAddress,
      dto.message || "",
      dto.isPublic
    );
    await this.chipiService.execute(
      sender.metaData.privateKey,
      sender.metaData.publicKey,
      metadataPayload
    );

    return {
      message: "Transaction submitted successfully.",
      data: newTransaction,
    };
  }
}
