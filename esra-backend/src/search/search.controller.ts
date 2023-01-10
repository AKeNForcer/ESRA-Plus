import { Controller, Get, Query } from '@nestjs/common';
import { responseJson } from 'src/share/util/response.util';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    async search(@Query() queries): Promise<object> {
        let { query, skip, limit } = queries;
        skip = skip | 0;
        limit = limit | 1;
        const result = await this.searchService.search()
        return responseJson("search success", result);
    }
}
