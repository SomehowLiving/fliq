import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

class ParticipantDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsNumber()
  @Min(0.01)
  amountOwed: number;
}

export class CreateBillDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantDto)
  participants: ParticipantDto[];
}
