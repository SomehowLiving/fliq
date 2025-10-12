import { DolphServiceHandler } from "@dolphjs/dolph/classes";
import {
  BadRequestException,
  Dolph,
  NotFoundException,
} from "@dolphjs/dolph/common";
import { InjectMongo } from "@dolphjs/dolph/decorators";
import { Model } from "mongoose";
import { AccountModel, IAccount } from "../account/account.model";
import { ChipiService } from "@/shared/services/chipi.service";
import {
  BillParticipantModel,
  IBillParticipant,
  ISplitBill,
  SplitBillModel,
} from "./bill.model";
import { CreateBillDto } from "./bill.dto";
import { StarknetService } from "@/shared/services/starkent.service";

@InjectMongo("splitBillModel", SplitBillModel)
@InjectMongo("billParticipantModel", BillParticipantModel)
@InjectMongo("accountModel", AccountModel)
export class BillService extends DolphServiceHandler<Dolph> {
  splitBillModel!: Model<ISplitBill>;
  billParticipantModel!: Model<IBillParticipant>;
  accountModel!: Model<IAccount>;
  private readonly starknetService: StarknetService;
  private readonly chipiService: ChipiService;

  constructor() {
    super("billservice");
    this.starknetService = new StarknetService();
    this.chipiService = new ChipiService();
  }

  async createBill(dto: CreateBillDto, creatorId: string) {
    const totalOwed = dto.participants.reduce(
      (sum, p) => sum + p.amountOwed,
      0
    );
    if (totalOwed !== dto.totalAmount) {
      throw new BadRequestException(
        "Sum of participant amounts does not match the total bill amount."
      );
    }

    const participantUsernames = dto.participants.map((p) => p.username);
    const participantAccounts = await this.accountModel.find({
      username: { $in: participantUsernames },
    });

    if (participantAccounts.length !== participantUsernames.length) {
      throw new NotFoundException(
        "One or more participant usernames could not be found."
      );
    }

    const participantAddresses = participantAccounts.map(
      (p) => p.walletAddress
    );
    const participantAmounts = dto.participants.map((p) =>
      BigInt(p.amountOwed * 10 ** 6)
    );

    const totalAmountSmallestUnit = BigInt(dto.totalAmount * 10 ** 6);

    const createBillPayload = this.starknetService.prepareCreateBillTx(
      totalAmountSmallestUnit,
      dto.description,
      participantAddresses,
      participantAmounts
    );

    const creatorAccount = await this.accountModel.findById(creatorId);
    const txResponse = await this.chipiService.execute(
      creatorAccount.metaData.privateKey,
      creatorAccount.metaData.privateKey,
      createBillPayload
    );

    const newBill = await this.splitBillModel.create({
      creator: creatorId,
      totalAmount: dto.totalAmount,
      description: dto.description,
    });

    const participantDocs = await Promise.all(
      dto.participants.map(async (p) => {
        const account = participantAccounts.find(
          (acc) => acc.username === p.username
        );
        return this.billParticipantModel.create({
          bill: newBill._id,
          user: account._id,
          amountOwed: p.amountOwed,
        });
      })
    );

    newBill.participants = participantDocs.map((doc) => doc._id) as any;
    await newBill.save();

    return {
      message: "Split bill creation submitted.",
      transactionHash: txResponse,
      bill: newBill,
    };
  }

  async payShare(billId: string, userId: string) {
    const bill = await this.splitBillModel.findById(billId);
    if (!bill) throw new NotFoundException("Bill not found.");
    if (!bill.billId_onchain)
      throw new BadRequestException(
        "Bill is still processing on-chain and cannot be paid yet."
      );

    const participant = await this.billParticipantModel.findOne({
      bill: billId,
      user: userId,
    });
    if (!participant)
      throw new BadRequestException("You are not a participant in this bill.");
    if (participant.hasPaid)
      throw new BadRequestException("You have already paid your share.");

    const paySharePayload = this.starknetService.preparePayShareTx(
      bill.billId_onchain
    );

    const userAccount = await this.accountModel.findById(userId);
    const txResponse = await this.chipiService.execute(
      userAccount.metaData.privateKey,
      userAccount.metaData.publicKey,
      paySharePayload
    );

    participant.hasPaid = true;
    await participant.save();

    return {
      message: "Payment submitted successfully.",
      transactionHash: txResponse,
    };
  }

  async getBillDetails(billId: string) {
    const bill = await this.splitBillModel
      .findById(billId)
      .populate("creator", "username image")
      .populate({
        path: "participants",
        populate: {
          path: "user",
          select: "username image",
        },
      });

    if (!bill) throw new NotFoundException("Bill not found.");
    return { data: bill };
  }

  async getMyBills(userId: string) {
    const participations = await this.billParticipantModel
      .find({ user: userId })
      .select("bill");
    const billIds = participations.map((p) => p.bill);

    const bills = await this.splitBillModel
      .find({ _id: { $in: billIds } })
      .populate("creator", "username image")
      .populate({
        path: "participants",
        populate: {
          path: "user",
          select: "username image",
        },
      })
      .sort({ createdAt: -1 });

    return { data: bills };
  }
}
