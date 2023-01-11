import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
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
            this.httpService.get((new URL(`paper/${paperId}`, this.paperServiceUrl)).toString()).pipe(
                catchError((error) => {
                    throw error;
                }),
              ),
        );
        return data;
    }
}
