import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { SortType } from 'src/share/enum/sort.enum';


export class ExplainDTO {
  @IsString()
  @IsNotEmpty()
  @Length(1)
  query: string;

  @IsString()
  @IsNotEmpty()
  paperId: string;

  @IsOptional()
  wait: number | typeof NaN;

  @IsOptional()
  @IsString()
  @IsIn(['0', '1'])
  gen: string | boolean;
}


export class OverviewDTO {
  @IsString()
  @IsNotEmpty()
  @Length(1)
  query: string;

  @IsOptional()
  wait: number | typeof NaN;

  @IsOptional()
  @IsString()
  @IsIn(['0', '1'])
  gen: string | boolean;
}

export class FactlistDTO {
  @IsString()
  @IsNotEmpty()
  @Length(1)
  query: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  limit: string;
}