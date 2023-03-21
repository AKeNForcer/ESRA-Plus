import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class PaperService {
    paperServiceUrl: string | URL;
    paperUrl: string;
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService) {

            this.paperServiceUrl = this.configService.get<string>('PAPER_SERVICE_URL');
            
        }


    async getPaper(paperId: string) {
        const { data } = await firstValueFrom(
            this.httpService.get((new URL(`paper?paperId=${paperId}`, this.paperServiceUrl)).toString()).pipe(
                catchError((error) => {
                    throw error;
                }),
              ),
        );
        data.update_date = new Date(data.update_date)
        return data;
    }

    async paperExists(paperId: string): Promise<boolean> {
        try {
            const res = await this.getPaper(paperId);
            return !(!res);
        } catch(error) {
            if (error.response.status === HttpStatus.NOT_FOUND) {
                return false;
            }
        }
    }
}
