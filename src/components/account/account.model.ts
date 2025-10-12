import { Schema, Document, model, SchemaTypes } from "mongoose";

export enum LoginMode {
  Farcaster = "FARCASTER",
  Gmail = "GMAIL",
}

export interface MetaData {
  privateKey: string;
  publicKey: string;
}

export interface IAccount extends Document {
  _id: string;
  email?: string;
  farcasterId?: string;
  farcasterHandle?: string;
  walletAddress: string;
  username?: string;
  loginMode: LoginMode;
  image?: string;
  metaData: MetaData;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
    },
    loginMode: {
      type: String,
      enum: Object.values(LoginMode),
      required: true,
    },
    image: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    farcasterId: {
      type: String,
      unique: true,
      sparse: true,
    },
    farcasterHandle: {
      type: String,
    },
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },
    metaData: {
      type: SchemaTypes.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const AccountModel = model<IAccount>("accounts", AccountSchema);
