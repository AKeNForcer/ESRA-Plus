import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Explanation, ExplanationSchema, FactList, FactListSchema, Overview, OverviewSchema } from './explain.model';
import { ExplainService } from './explain.service';
import { ExplainController } from './explain.controller';
import { PaperModule } from 'src/paper/paper.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: Explanation.name, schema: ExplanationSchema },
      { name: Overview.name, schema: OverviewSchema },
      { name: FactList.name, schema: FactListSchema }
    ]),
    PaperModule
  ],
  providers: [ExplainService],
  controllers: [ExplainController]
})
export class ExplainModule {}
