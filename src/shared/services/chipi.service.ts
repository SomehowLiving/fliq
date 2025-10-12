import { uniqueSevenDigitsCode } from "@dolphjs/dolph/utilities";
import { ChipiSDK } from "@chipi-stack/backend";

interface TransactionCall {
  contractAddress: string;
  entrypoint: string;
  calldata: any[];
}

export class ChipiService {
  private sdk: ChipiSDK;

  constructor() {
    this.sdk = new ChipiSDK({
      apiPublicKey: "pk_prod_3a962244d9d95f3e7ba0c8d68fa73cf3",
      apiSecretKey:
        "sk_prod_76fa879ecce64c56cc2e2e2018b32a9d84d60d5e3b0bb0bd0e0a4a952f9eec50",
    });
  }

  async createWallet(email: string) {
    return this.sdk.createWallet({
      params: { externalUserId: email, encryptKey: "VerySecretive" },
    });
  }

  async execute(
    privateKey: string,
    publicKey: string,
    transaction: TransactionCall | TransactionCall[]
  ) {
    const calls = Array.isArray(transaction) ? transaction : [transaction];

    const encryptKey = "VerySecretive";

    return this.sdk.executeTransaction({
      params: {
        calls,
        encryptKey,
        wallet: { encryptedPrivateKey: privateKey, publicKey },
      },
    });
  }
}
