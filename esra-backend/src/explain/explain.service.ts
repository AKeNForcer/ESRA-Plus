import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { Explaination, ExplainationDocument, FactList, FactListDocument, Overview, OverviewDocument } from './explain.model';

@Injectable()
export class ExplainService {
    explainUrl: string;
    overviewUrl: string;
    factListUrl: string;
    constructor (
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        @InjectModel(Explaination.name) private explainationModel: Model<ExplainationDocument>,
        @InjectModel(Overview.name) private overviewModel: Model<OverviewDocument>,
        @InjectModel(FactList.name) private factListModel: Model<FactListDocument>) {
            this.explainUrl = new URL("explain", this.configService.get<string>('EXPLAIN_URL')).toString();
            this.overviewUrl = new URL("overview", this.explainUrl).toString();
            this.factListUrl = new URL("factlist", this.explainUrl).toString();
        }

    async getExplaination(query: string, paperId: string): Promise<[{ order: number, sentence: string, value: number }] | null> {
        const explaination = await this.explainationModel.findOne({query, paperId}, {_id: 0, explaination: 1});
        return explaination ? explaination.explaination : null;
    }

    async generateExplaination(query: string, paperId: string): Promise<void> {
        if (await this.explainationModel.exists({query, paperId})) {
            return
        }
        await firstValueFrom(
            this.httpService.post(this.explainUrl, [{query, paperId}])
        );
    }

    @Cron("*/10 * * * * *")
    async clean() {
        await this.explainationModel.deleteMany({ expire_date: { $lte: new Date() } });
    }
}
