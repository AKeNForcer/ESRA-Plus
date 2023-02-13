import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Explanation {
  @Prop({ default: new Date() })
  created_date: Date;

  @Prop({ type: Date })
  expire_date: Date;

  @Prop({ type: String, required: true, index: true })
  query: string;

  @Prop({ type: String, required: true })
  paperId: string;

  @Prop({ type: [Object], required: true })
  explanation: [{ order: number, sentence: string, value: number }];
}
export type ExplanationDocument = Explanation & Document;
export const ExplanationSchema = SchemaFactory.createForClass(Explanation);

@Schema()
export class Overview {
  @Prop({ default: new Date() })
  created_date: Date;

  @Prop({ type: Date })
  expire_date: Date;

  @Prop({ type: String, required: true, index: true })
  query: string;

  @Prop({ type: String, required: true })
  overview: string;
}
export type OverviewDocument = Overview & Document;
export const OverviewSchema = SchemaFactory.createForClass(Overview);


@Schema()
export class FactList {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  paper_id: string;

  @Prop({ type: String, required: true })
  entity: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: [[String, String, String]], required: true })
  re: [[string, string, string]];
}
export type FactListDocument = FactList & Document;
export const FactListSchema = SchemaFactory.createForClass(FactList);

@Schema()
export class Question {
  @Prop({ default: new Date() })
  created_date: Date;

  @Prop({ type: Date })
  expire_date: Date;

  @Prop({ type: String, required: true, index: true })
  query: string;

  @Prop({ type: [String], required: true })
  questions: [string];
}
export type QuestionDocument = Question & Document;
export const QuestionSchema = SchemaFactory.createForClass(Question);