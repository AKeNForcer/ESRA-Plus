import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { PaperService } from 'src/paper/paper.service';
import { responseJson } from 'src/share/util/response.util';
import { ExplainDTO } from './explain.dto';
import { ExplainService } from './explain.service';

@Controller('explain')
export class ExplainController {
    constructor(
        private readonly explainService: ExplainService,
        private readonly paperService: PaperService) {}

    @Get()
    async explain(@Query() queries: ExplainDTO): Promise<object> {
        let { paperId, query, wait, gen } = queries;
        wait = wait ? parseFloat(wait.toString()) : 0;
        if (Number.isNaN(wait)) {
            throw new HttpException(responseJson(`wait must be integer`, null, null, false), HttpStatus.BAD_REQUEST);
        }
        if (wait >= 60 || wait < 0) {
            throw new HttpException(responseJson(`wait (${wait}) must be in range [0, 60]`), HttpStatus.BAD_REQUEST);
        }
        gen = gen === '1';
        if (!(await this.paperService.paperExists(paperId))) {
            throw new HttpException(
                responseJson("paper not found", null, null, false), 
                HttpStatus.NOT_FOUND);
        }
        if (gen) {
            this.explainService.generateExplanation(query, paperId);
        }
        let result: [{order: number, sentence: string, value: number}] | null = null;
        for (; !result && wait > 0; wait-=0.5) {
            result = await this.explainService.getExplanation(query, paperId);
            if (result) break;
            await new Promise(r => setTimeout(r,500));
        }
        if (!result) {
            throw new HttpException(responseJson("processing", null, null, false), HttpStatus.CONFLICT);
        }
        return responseJson("success", result);
    }
}
