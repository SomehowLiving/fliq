import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class SendUsdcDto {
  @IsString()
  @IsNotEmpty()
  recipientUsername: string;

  @IsNumber()
  @Min(0.00001)
  amount: number;

  @IsString()
  @IsOptional()
  message?: string;

  @IsBoolean()
  isPublic: boolean;
}
