import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { Explanation, ExplanationDocument, FactList, FactListDocument, Overview, OverviewDocument } from './explain.model';

@Injectable()
export class ExplainService {
    explainUrl: string;
    overviewUrl: string;
    factListUrl: string;
    constructor (
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        @InjectModel(Explanation.name) private explanationModel: Model<ExplanationDocument>,
        @InjectModel(Overview.name) private overviewModel: Model<OverviewDocument>,
        @InjectModel(FactList.name) private factListModel: Model<FactListDocument>) {
            this.explainUrl = new URL("explain", this.configService.get<string>('EXPLAIN_URL')).toString();
            this.overviewUrl = new URL("overview", this.explainUrl).toString();
            this.factListUrl = new URL("factlist", this.explainUrl).toString();
        }

    async getExplanation(query: string, paperId: string): Promise<[{ order: number, sentence: string, value: number }] | null> {
        const explanation = await this.explanationModel.findOne({query, paperId}, {_id: 0, explanation: 1});
        return explanation ? explanation.explanation : null;
    }

    async generateExplanation(query: string, paperId: string): Promise<void> {
        if (await this.explanationModel.exists({query, paperId})) {
            return
        }
        await firstValueFrom(
            this.httpService.post(this.explainUrl, [{query, paperId}])
        );
    }

    @Cron("*/10 * * * * *")
    async clean() {
        await this.explanationModel.deleteMany({ expire_date: { $lte: new Date() } });
    }
}
