import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class SearchResult {
  @Prop({ default: new Date() })
  created_date: string;

  @Prop({ default: new Date() })
  updated_date: string;

  @Prop({ type: Date })
  expire_date: Date;

  @Prop({ type: String, required: true, unique: true })
  id: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  categories: string;

  @Prop({ type: Number, required: true })
  rank: number;

  @Prop({ type: Number, required: true })
  score: number;

  @Prop({ type: Object })
  detail: object;

  @Prop({ type: String, required: true })
  abstract: string;
}
export type SearchResultDocument = SearchResult & Document;
export const SearchResultSchema = SchemaFactory.createForClass(SearchResult);