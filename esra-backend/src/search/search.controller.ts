import { Controller, Get, Query } from '@nestjs/common';
import { SortExpression, SortType } from 'src/share/enum/sort.enum';
import { responseJson } from 'src/share/util/response.util';
import { CompleteDTO, SearchDTO } from './search.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    async search(@Query() queries: SearchDTO): Promise<object> {
        let { query, skip, limit, no_cache, sort } = queries;
        skip = skip ?? 0;
        limit = limit ?? 20;
        sort = sort ?? SortType.RELEVANCE
        const result = await this.searchService.search(query, no_cache, limit, skip, SortExpression[sort])
        return responseJson(`search success "${query}"`, result);
    }

    @Get("/complete")
    async complete(@Query() queries: CompleteDTO): Promise<object> {
        const { query } = queries;
        const result = await this.searchService.complete(query);
        return responseJson(`get complete success"`, result);
    }
}
