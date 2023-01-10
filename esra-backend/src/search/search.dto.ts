import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';


export class SearchDTO {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value ?? 0))
  @Min(0)
  skip: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value ?? 5))
  @Min(1)
  limit: number;

  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value == 1))
  no_cache: boolean;
}
