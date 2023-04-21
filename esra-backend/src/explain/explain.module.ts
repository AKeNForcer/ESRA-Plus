import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema, Explanation, ExplanationSchema, FactList, FactListSchema, Overview, OverviewSchema, Question, QuestionSchema } from './explain.model';
import { ExplainService } from './explain.service';
import { ExplainController } from './explain.controller';
import { PaperModule } from 'src/paper/paper.module';
import { SearchModule } from 'src/search/search.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MongooseModule.forFeature([
      { name: Explanation.name, schema: ExplanationSchema },
      { name: Overview.name, schema: OverviewSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: FactList.name, schema: FactListSchema },
      { name: Chat.name, schema: ChatSchema },
    ]),
    PaperModule,
    SearchModule
  ],
  providers: [ExplainService],
  controllers: [ExplainController]
})
export class ExplainModule {}
