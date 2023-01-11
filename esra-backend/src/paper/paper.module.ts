import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaperController } from './paper.controller';
import { PaperService } from './paper.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [PaperController],
  providers: [PaperService]
})
export class PaperModule {}
