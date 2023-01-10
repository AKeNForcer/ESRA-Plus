import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SearchService {
    searchEngineUrl = undefined;
    searchUrl = undefined;
    searchEngineResultLimit = undefined;
    constructor(private readonly configService: ConfigService, private readonly httpService: HttpService) {
        this.searchEngineUrl = this.configService.get<string>('SEARCH_ENGINE_URL')
        this.searchEngineResultLimit = this.configService.get<string>('SEARCH_ENGINE_RESULT_LIMIT')
        this.searchUrl = new URL("search", this.searchEngineUrl).toString()
    }

    async search(): Promise<object> {
        const { data } = await firstValueFrom(
            this.httpService.get(this.searchUrl, {
                params: {
                    query: "Transformer",
                    limit: this.searchEngineResultLimit
                }
            })
        );
        return data;
    }
}
