import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { PaperService } from 'src/paper/paper.service';
import { SearchService } from 'src/search/search.service';
import { responseJson } from 'src/share/util/response.util';
import { ChatDTO, ExplainDTO, FactlistDTO, OverviewDTO } from './explain.dto';
import { ExplainService } from './explain.service';

@Controller('explain')
export class ExplainController {
    constructor(
        private readonly explainService: ExplainService,
        private readonly searchService: SearchService,
        private readonly paperService: PaperService) {}

    @Get()
    async explain(@Query() queries: ExplainDTO): Promise<object> {
        let { paperId, query, wait, gen } = queries;
        wait = wait ? parseFloat(wait.toString()) : 0;
        if (Number.isNaN(wait)) {
            throw new HttpException(responseJson(`wait must be integer`, null, null, false), HttpStatus.BAD_REQUEST);
        }
        if (wait >= 360 || wait < 0) {
            throw new HttpException(responseJson(`wait (${wait}) must be in range [0, 360]`), HttpStatus.BAD_REQUEST);
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
        for (; !result && wait > 0; wait-=0.1) {
            result = await this.explainService.getExplanation(query, paperId);
            if (result) break;
            await new Promise(r => setTimeout(r,100));
        }
        if (!result) {
            throw new HttpException(responseJson("processing", null, null, false), HttpStatus.CONFLICT);
        }
        return responseJson("success", result);
    }

    @Get("/overview")
    async overview(@Query() queries: OverviewDTO): Promise<object> {
        let { query, wait, gen } = queries;
        wait = wait ? parseFloat(wait.toString()) : 0;
        if (Number.isNaN(wait)) {
            throw new HttpException(responseJson(`wait must be integer`, null, null, false), HttpStatus.BAD_REQUEST);
        }
        if (wait >= 360 || wait < 0) {
            throw new HttpException(responseJson(`wait (${wait}) must be in range [0, 360]`), HttpStatus.BAD_REQUEST);
        }
        gen = gen === '1';
        if (gen) {
            this.explainService.generateOverview(query);
        }
        let result: [{question: string, overview: string}] | null = null;
        for (; !result && wait > 0; wait-=0.1) {
            result = await this.explainService.getOverview(query);
            if (result) break;
            await new Promise(r => setTimeout(r,100));
        }
        if (!result) {
            throw new HttpException(responseJson("processing", null, null, false), HttpStatus.CONFLICT);
        }
        return responseJson("success", result);
    }

    @Get("/question")
    async question(@Query() queries: OverviewDTO): Promise<object> {
        let { query, wait, gen } = queries;
        wait = wait ? parseFloat(wait.toString()) : 0;
        if (Number.isNaN(wait)) {
            throw new HttpException(responseJson(`wait must be integer`, null, null, false), HttpStatus.BAD_REQUEST);
        }
        if (wait >= 360 || wait < 0) {
            throw new HttpException(responseJson(`wait (${wait}) must be in range [0, 360]`), HttpStatus.BAD_REQUEST);
        }
        gen = gen === '1';
        if (gen) {
            this.explainService.generateQuestion(query);
        }
        let result: [string] | null = null;
        for (; !result && wait > 0; wait-=0.1) {
            result = await this.explainService.getQuestion(query);
            if (result) break;
            await new Promise(r => setTimeout(r,100));
        }
        if (!result) {
            throw new HttpException(responseJson("processing", null, null, false), HttpStatus.CONFLICT);
        }
        return responseJson("success", result);
    }

    @Get("/factlist")
    async getFList(@Query() queries: OverviewDTO): Promise<object> {
        let { query, wait, gen } = queries;
        wait = wait ? parseFloat(wait.toString()) : 0;
        if (Number.isNaN(wait)) {
            throw new HttpException(responseJson(`wait must be integer`, null, null, false), HttpStatus.BAD_REQUEST);
        }
        if (wait >= 360 || wait < 0) {
            throw new HttpException(responseJson(`wait (${wait}) must be in range [0, 360]`), HttpStatus.BAD_REQUEST);
        }
        gen = gen === '1';
        if (gen) {
            this.explainService.generateFList(query);
        }
        let result: string| null = null;
        for (; !result && wait > 0; wait-=0.1) {
            result = await this.explainService.getFList(query);
            if (result) break;
            await new Promise(r => setTimeout(r,100));
        }
        if (!result) {
            throw new HttpException(responseJson("processing", null, null, false), HttpStatus.CONFLICT);
        }
        return responseJson("success", result);
    }

    @Get("/chat")
    async chat(@Query() queries: ChatDTO): Promise<object> {
        let { paperId, query, wait, gen } = queries;
        wait = wait ? parseFloat(wait.toString()) : 0;
        if (Number.isNaN(wait)) {
            throw new HttpException(responseJson(`wait must be integer`, null, null, false), HttpStatus.BAD_REQUEST);
        }
        if (wait >= 360 || wait < 0) {
            throw new HttpException(responseJson(`wait (${wait}) must be in range [0, 360]`), HttpStatus.BAD_REQUEST);
        }
        gen = gen === '1';
        if (!(await this.paperService.paperExists(paperId))) {
            throw new HttpException(
                responseJson("paper not found", null, null, false), 
                HttpStatus.NOT_FOUND);
        }
        if (gen) {
            this.explainService.generateChat(query, paperId);
        }
        let result = null;
        for (; !result && wait > 0; wait-=0.1) {
            result = await this.explainService.getChat(query, paperId);
            if (result) break;
            await new Promise(r => setTimeout(r,100));
        }
        if (!result) {
            throw new HttpException(responseJson("processing", null, null, false), HttpStatus.CONFLICT);
        }
        const { answer, text_input } = result;
        return responseJson("success", answer, {textInput: text_input});
    }
}
