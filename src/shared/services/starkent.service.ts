import {
  Contract,
  Provider,
  cairo,
  shortString,
  GetTransactionReceiptResponse,
} from "starknet";
import { CONTRACT_ADDRESSES, ABIS } from "@/configs/starknet.config";
import { SplitBill, TxMetadata } from "../interfaces/starknet.interface";

export class StarknetService {
  private readonly provider: Provider;
  private readonly usernameRegistry: Contract;
  private readonly splitBillManager: Contract;
  private readonly transactionMetadata: Contract;

  constructor() {
    this.provider = new Provider({
      nodeUrl: "https://sepolia-rpc.kakarot.org",
    });

    this.usernameRegistry = new Contract(
      ABIS.usernameRegistry,
      CONTRACT_ADDRESSES.usernameRegistry,
      this.provider
    );
    this.splitBillManager = new Contract(
      ABIS.splitBillManager,
      CONTRACT_ADDRESSES.splitBillManager,
      this.provider
    );
    this.transactionMetadata = new Contract(
      ABIS.transactionMetadata,
      CONTRACT_ADDRESSES.transactionMetadata,
      this.provider
    );
  }

  async isUsernameAvailable(username: string) {
    const encodedUsername = shortString.encodeShortString(username);
    return this.usernameRegistry.call("is_username_available", [
      encodedUsername,
    ]);
  }

  async getAddress(username: string): Promise<string> {
    const encodedUsername = shortString.encodeShortString(username);
    const address = await this.usernameRegistry.call("get_address", [
      encodedUsername,
    ]);
    return `0x${address.toString(16)}`;
  }

  prepareRegisterUsernameTx(username: string) {
    const calldata = [shortString.encodeShortString(username)];
    return {
      contractAddress: CONTRACT_ADDRESSES.usernameRegistry,
      entrypoint: "register_username",
      calldata,
    };
  }

  async getBill(billId: number): Promise<SplitBill> {
    const bill = await this.splitBillManager.call("get_bill", [
      cairo.uint256(billId),
    ]);
    return bill as SplitBill;
  }

  prepareCreateBillTx(
    totalAmount: bigint,
    description: string,
    participants: string[],
    amounts: bigint[]
  ) {
    const calldata = [
      cairo.uint256(totalAmount),
      shortString.encodeShortString(description),
      participants,
      amounts.map((a) => cairo.uint256(a)),
    ];

    return {
      contractAddress: CONTRACT_ADDRESSES.splitBillManager,
      entrypoint: "create_bill",
      calldata,
    };
  }

  preparePayShareTx(billId: number) {
    return {
      contractAddress: CONTRACT_ADDRESSES.splitBillManager,
      entrypoint: "pay_share",
      calldata: [cairo.uint256(billId)],
    };
  }

  async getMetadata(txHash: string): Promise<TxMetadata> {
    const metadata = await this.transactionMetadata.call("get_metadata", [
      txHash,
    ]);
    return metadata as TxMetadata;
  }

  prepareAddMetadataTx(
    txHash: string,
    receiver: string,
    message: string,
    isPublic: boolean
  ) {
    const calldata = [
      txHash,
      receiver,
      shortString.encodeShortString(message),
      isPublic,
      Date.now(), // timestamp
    ];

    return {
      contractAddress: CONTRACT_ADDRESSES.transactionMetadata,
      entrypoint: "add_metadata",
      calldata,
    };
  }

  async waitForTransaction(
    txHash: string
  ): Promise<GetTransactionReceiptResponse> {
    return this.provider.waitForTransaction(txHash);
  }
}
