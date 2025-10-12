import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from "class-validator";

export class GoogleLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsOptional()
  image?: string;
}

export class FarcasterLoginDto {
  @IsString()
  @IsNotEmpty()
  farcasterId: string;

  @IsString()
  @IsNotEmpty()
  farcasterHandle: string;

  @IsUrl()
  @IsOptional()
  image?: string;
}

export class SetUsernameDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 20, {
    message: "username must be between 5 - 20 characters long ",
  })
  username: string;
}
