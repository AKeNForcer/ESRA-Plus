import { Controller, Get, Query } from '@nestjs/common';
import { responseJson } from 'src/share/util/response.util';

@Controller('search')
export class SearchController {
    @Get()
    async search(@Query() queries): Promise<object> {
        let { query, skip, limit } = queries;
        skip = skip | 0;
        limit = limit | 1;
        return responseJson("search success", { query, skip, limit });
    }
}
