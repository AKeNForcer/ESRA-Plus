import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { SearchResult, SearchResultDocument } from './search.model';

@Injectable()
export class SearchService {
    searchEngineUrl: string;
    searchUrl: string;
    searchEngineResultLimit: number;
    searchResultExpireDuration: number;
    completeUrl: string;
    searchEngineCompleteLimit: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        @InjectModel(SearchResult.name) private searchResultModel: Model<SearchResultDocument>) {
        
        this.searchEngineUrl = this.configService.get<string>('SEARCH_ENGINE_URL');
        this.searchEngineResultLimit = parseInt(this.configService.get<string>('SEARCH_ENGINE_RESULT_LIMIT'));
        this.searchEngineCompleteLimit = parseInt(this.configService.get<string>('SEARCH_ENGINE_COMPLETE_LIMIT'));
        this.searchUrl = new URL("search", this.searchEngineUrl).toString();
        this.completeUrl = new URL("complete", this.searchEngineUrl).toString();
        this.searchResultExpireDuration = parseInt(this.configService.get<string>('QUERY_EXPIRE_DURATION'));

    }

    async search(query: string, no_cache: boolean, limit: number, skip: number, sortExp: { [key: string]: any } = { rank: 1 }): Promise<object> {
        const resCount = await this.searchResultModel.count({ query, expire_date: { $gt: new Date() } });
        if(no_cache || resCount < this.searchEngineResultLimit) {
            const [searchResult, _] = await Promise.all([
                this.searchUsingSearchEngine(query),
                this.searchResultModel.deleteMany({ query })
            ]);
            const expire_date = new Date((new Date()).getTime() + this.searchResultExpireDuration);
            await this.searchResultModel.insertMany(searchResult.map((x) => {
                x["update_date"] = new Date(x["update_date"])
                return {expire_date, query, ...x}
            } ))
        }
        return this.searchResultModel.find({ query }, { 
            _id: 0,
            paperId: 1,
            rank: 1,
            title: 1,
            categories: 1,
            abstract: 1,
            authors: 1,
            update_date: 1
        }).sort(sortExp).skip(skip).limit(limit)
    }

    async searchUsingSearchEngine(query: string) {
        return this.searchServiceRequest(query, this.searchUrl, this.searchEngineResultLimit);
    }

    async complete(query: string) {
        return this.searchServiceRequest(query, this.completeUrl, this.searchEngineCompleteLimit);
    }

    async searchServiceRequest(query: string, url: string, limit: number, skip: number=0) {
        const { data } = await firstValueFrom(
            this.httpService.get(url, {
                params: {
                    query,
                    skip,
                    limit
                }
            })
        );
        return data;
    }

    async getSearchRank(query: string, paperId: string): Promise<number | null> {
        const res = await this.searchResultModel.findOne({ query, paperId }, { _id: 0, rank: 1 })
        return res ? res.rank : null
    }

    @Cron("*/10 * * * * *")
    async clean() {
        await this.searchResultModel.deleteMany({ expire_date: { $lte: new Date() } });
    }
}
