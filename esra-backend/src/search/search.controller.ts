import { Controller, Get, Query } from '@nestjs/common';
import { responseJson } from 'src/share/util/response.util';
import { SearchDTO } from './search.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    async search(@Query() queries: SearchDTO): Promise<object> {
        let { query, skip, limit, no_cache } = queries;
        skip = skip | 0;
        limit = limit | 1;
        const result = await this.searchService.search(query, no_cache, limit, skip)
        return responseJson("search success", result);
    }
}
