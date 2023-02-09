import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { SearchService } from 'src/search/search.service';
import { Explanation, ExplanationDocument, FactList, FactListDocument, Overview, OverviewDocument } from './explain.model';

@Injectable()
export class ExplainService {
    explainUrl: string;
    overviewUrl: string;
    factListUrl: string;
    constructor (
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly searchService: SearchService,
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
        const rank = (await this.searchService.getSearchRank(query, paperId)) ?? 20;
        await firstValueFrom(
            this.httpService.post(this.explainUrl, [{query, paperId, rank}])
        );
    }

    async getOverview(query: string): Promise<string | null> {
        const overview = await this.overviewModel.findOne({query}, {_id: 0, overview: 1});
        return overview ? overview.overview : null;
    }

    async generateOverview(query: string): Promise<void> {
        if (await this.overviewModel.exists({query})) {
            return
        }
        await firstValueFrom(
            this.httpService.post(this.overviewUrl, [{query, rank: 10}])
        );
    }

    @Cron("*/10 * * * * *")
    async clean() {
        await Promise.all([
            this.explanationModel.deleteMany({ expire_date: { $lte: new Date() } }),
            this.overviewModel.deleteMany({ expire_date: { $lte: new Date() } })
        ]);
    }
}
