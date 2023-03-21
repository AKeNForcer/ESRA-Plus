import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { SortType } from 'src/share/enum/sort.enum';


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
  @Transform(({ value }) => ((value == 'true' || value == 1) ?? false))
  no_cache: boolean;

  @IsOptional()
  @IsEnum(SortType)
  sort: SortType
}

export class CompleteDTO {
  @IsString()
  @IsNotEmpty()
  query: string;
}