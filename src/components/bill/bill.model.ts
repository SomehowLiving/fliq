import { Schema, Document, model, Types } from "mongoose";

export interface IBillParticipant extends Document {
  bill: Types.ObjectId;
  user: Types.ObjectId;
  amountOwed: number;
  hasPaid: boolean;
}

export interface ISplitBill extends Document {
  billId_onchain?: number; // The ID returned from the smart contract
  creator: Types.ObjectId;
  participants: Types.ObjectId[];
  totalAmount: number;
  description: string;
  isSettled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BillParticipantSchema = new Schema({
  bill: { type: Types.ObjectId, ref: "split_bills", required: true },
  user: { type: Types.ObjectId, ref: "accounts", required: true },
  amountOwed: { type: Number, required: true },
  hasPaid: { type: Boolean, default: false },
});

const SplitBillSchema = new Schema(
  {
    billId_onchain: { type: Number, unique: true, sparse: true },
    creator: { type: Types.ObjectId, ref: "accounts", required: true },
    participants: [{ type: Types.ObjectId, ref: "bill_participants" }],
    totalAmount: { type: Number, required: true },
    description: { type: String, required: true },
    isSettled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SplitBillModel = model<ISplitBill>("split_bills", SplitBillSchema);
export const BillParticipantModel = model<IBillParticipant>(
  "bill_participants",
  BillParticipantSchema
);
