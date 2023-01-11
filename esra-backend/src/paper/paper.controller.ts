import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { responseJson } from 'src/share/util/response.util';
import { PaperService } from './paper.service';


@Controller('paper')
export class PaperController {
    constructor(private readonly paperService: PaperService) {}

    @Get('/:id')
    async getPaper(@Param('id') id: string): Promise<object> {
        try {
            return responseJson("get paper success", await this.paperService.getPaper(id));
        } catch(error) {
            if (error.response.status === HttpStatus.NOT_FOUND) {
                throw new HttpException(responseJson("paper not found", undefined, undefined, false), HttpStatus.NOT_FOUND)
            }
        }
    }

}
