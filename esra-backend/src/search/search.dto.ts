import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';


export class LoginWithEmailDTO {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  skip: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit: number;
}
