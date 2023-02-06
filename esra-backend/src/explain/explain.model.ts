import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Explaination {
  @Prop({ default: new Date() })
  created_date: Date;

  @Prop({ type: Date })
  expire_date: Date;

  @Prop({ type: String, required: true })
  query: string;

  @Prop({ type: String, required: true })
  paperId: string;

  @Prop({ type: [Object], required: true })
  explaination: [{ order: number, sentence: string, value: number }];
}
export type ExplainationDocument = Explaination & Document;
export const ExplainationSchema = SchemaFactory.createForClass(Explaination);

@Schema()
export class Overview {
  @Prop({ default: new Date() })
  created_date: Date;

  @Prop({ type: Date })
  expire_date: Date;

  @Prop({ type: String, required: true })
  query: string;

  @Prop({ type: String, required: true })
  overview: string;
}
export type OverviewDocument = Overview & Document;
export const OverviewSchema = SchemaFactory.createForClass(Overview);


@Schema()
export class FactList {
  @Prop({ default: new Date() })
  created_date: Date;

  @Prop({ type: Date })
  expire_date: Date;

  @Prop({ type: String, required: true })
  query: string;

  @Prop({ type: Object, required: true })
  factList: { [key: string]: Array<string> };
}
export type FactListDocument = FactList & Document;
export const FactListSchema = SchemaFactory.createForClass(FactList);