import { Schema, Document, model, Types } from "mongoose";

export enum TransactionType {
  Send = "SEND",
  Receive = "RECEIVE",
  Request = "REQUEST",
  Split = "SPLIT",
  Payment = "PAYMENT",
}

export enum TransactionStatus {
  Pending = "PENDING",
  Completed = "COMPLETED",
  Failed = "FAILED",
}

export interface ITransaction extends Document {
  sender: Types.ObjectId;
  recipient: Types.ObjectId;

  type: TransactionType;
  amount: number;
  currency: string;
  description: string;

  hash: string;
  status: TransactionStatus;

  isSplit: boolean;
  splitBillId?: Types.ObjectId;
  billTotalAmount?: number;
}

const TransactionSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "accounts",
      required: true,
    },

    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USDC",
    },
    description: {
      type: String,
      required: false,
    },

    hash: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.Pending,
    },

    isSplit: {
      type: Boolean,
      default: false,
    },

    splitBillId: {
      type: Schema.Types.ObjectId,
      ref: "transactions",
      required: false,
    },

    billTotalAmount: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const TransactionModel = model<ITransaction>(
  "transactions",
  TransactionSchema
);
