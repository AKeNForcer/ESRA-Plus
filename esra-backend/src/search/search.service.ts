import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { SearchResult, SearchResultDocument } from './search.model';

@Injectable()
export class SearchService {
    searchEngineUrl: string;
    searchUrl: string;
    searchEngineResultLimit: number;
    searchResultExpireDuration: number;
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        @InjectModel(SearchResult.name) private searchResultModel: Model<SearchResultDocument>) {
        
        this.searchEngineUrl = this.configService.get<string>('SEARCH_ENGINE_URL');
        this.searchEngineResultLimit = parseInt(this.configService.get<string>('SEARCH_ENGINE_RESULT_LIMIT'));
        this.searchUrl = new URL("search", this.searchEngineUrl).toString();
        this.searchResultExpireDuration = parseInt(this.configService.get<string>('QUERY_EXPIRE_DURATION'));

    }

    async search(query: string, no_cache: boolean, limit: number, skip: number): Promise<object> {
        const resCount = await this.searchResultModel.count({ query, expire_date: { $gt: new Date() } });
        if(no_cache || resCount < this.searchEngineResultLimit) {
            const [searchResult, _] = await Promise.all([
                this.searchUsingSearchEngine(query),
                this.searchResultModel.deleteMany({ query })
            ]);
            const expire_date = new Date((new Date()).getTime() + this.searchResultExpireDuration);
            await this.searchResultModel.insertMany(searchResult.map((x) => ({expire_date, query, ...x}) ))
        }
        return this.searchResultModel.find({ query }, { 
            _id: 0,
            id: 1,
            rank: 1,
            title: 1,
            categories: 1,
        }).sort({ rank: 1 }).skip(skip).limit(limit)
    }

    async searchUsingSearchEngine(query: string) {
        const { data } = await firstValueFrom(
            this.httpService.get(this.searchUrl, {
                params: {
                    query,
                    limit: this.searchEngineResultLimit
                }
            })
        );
        return data;
    }
}
