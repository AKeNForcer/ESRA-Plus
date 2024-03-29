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

  @Prop({ type: [{question: String, overview: String}], required: true })
  overview: [{question: string, overview: string}];
}
export type OverviewDocument = Overview & Document;
export const OverviewSchema = SchemaFactory.createForClass(Overview);


@Schema()
export class FList {
  @Prop({ default: new Date() })
  created_date: Date;

  @Prop({ type: Date })
  expire_date: Date;

  @Prop({ type: String, required: true, index: true })
  query: string;

  @Prop({ type: String, required: true })
  fact_list: string;
}
export type FListDocument = FList & Document;
export const FListSchema = SchemaFactory.createForClass(FList);

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

@Schema()
export class Chat {
  @Prop({ default: new Date() })
  created_date: Date;

  @Prop({ type: Date })
  expire_date: Date;

  @Prop({ type: String, required: true })
  query: string;

  @Prop({ type: String, required: true })
  paperId: string;

  @Prop({ type: String, required: true })
  answer: string;

  @Prop({ type: Array, required: true })
  text_input: string;
}
export type ChatDocument = Chat & Document;
export const ChatSchema = SchemaFactory.createForClass(Chat);