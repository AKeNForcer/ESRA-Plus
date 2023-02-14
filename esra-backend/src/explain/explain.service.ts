import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { SearchService } from 'src/search/search.service';
import { Explanation, ExplanationDocument, FactList, FactListDocument, Overview, OverviewDocument, Question, QuestionDocument } from './explain.model';

@Injectable()
export class ExplainService {
    explainUrl: string;
    overviewUrl: string;
    factListUrl: string;
    questionUrl: string;
    constructor (
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly searchService: SearchService,
        @InjectModel(Explanation.name) private explanationModel: Model<ExplanationDocument>,
        @InjectModel(Overview.name) private overviewModel: Model<OverviewDocument>,
        @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
        @InjectModel(FactList.name) private factListModel: Model<FactListDocument>) {
            this.explainUrl = new URL("explain", this.configService.get<string>('EXPLAIN_URL')).toString();
            this.overviewUrl = new URL("overview", this.explainUrl).toString();
            this.questionUrl = new URL("question", this.explainUrl).toString();
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

    async getOverview(query: string): Promise<[{question: string, overview: string}] | null> {
        const overview = await this.overviewModel.findOne({query}, {_id: 0, overview: 1});
        return overview ? overview.overview : null;
    }

    async generateOverview(query: string): Promise<void> {
        if (await this.overviewModel.exists({query})) {
            return
        }
        await firstValueFrom(
            this.httpService.post(this.overviewUrl, [{query, rank: 0}])
        );
    }

    async getQuestion(query: string): Promise<[string] | null> {
        const question = await this.questionModel.findOne({query}, {_id: 0, questions: 1});
        return question ? question.questions : null;
    }

    async generateQuestion(query: string): Promise<void> {
        if (await this.questionModel.exists({query})) {
            return
        }
        await firstValueFrom(
            this.httpService.post(this.questionUrl, [{query, rank: 0}])
        );
    }

    async getFactlist(paper_id_list, limit=3): Promise<{ entity: string; type: string; re: [string, string, string][] | string[]; }[]> {
        const pre_factlists = await this.fetchFactlist(paper_id_list, limit);
        return pre_factlists.map((ner) => {
            ner.re = ner.re.map((re) => {
                if (re[2] === 'FEATURE-OF') {
                    return `is a feature of ${re[1]}`
                } else if (re[2] === 'PART-OF') {
                    return `is a part of ${re[1]}`
                } else if (re[2] === 'EVALUATE-FOR') {
                    return `evaluate for ${re[1]}`
                } else if (re[2] === 'CONJUNCTION') {
                    return `is a conjunction of ${re[1]}`
                } else if (re[2] === 'USED-FOR') {
                    return `is used for ${re[1]}`
                } else if (re[2] === 'HYPONYM-OF') {
                    return `is a hyponym of ${re[1]}`
                } else {
                    return `compare to ${re[1]}`
                }
            });
            return ner;
        });
    }

    async fetchFactlist(paper_id_list, limit=3): Promise<{ entity: string; type: string; re: [string, string, string][] | string[]; }[]> {
        return await this.factListModel.aggregate([
            {'$match': {'paper_id': {'$in': paper_id_list}}},
            {'$project': {_id: 1, entity: 1, type: 1, re: 1}},
            { '$group': {
                '_id': ['$entity', '$type'],
                'entity': { '$first': '$entity' },
                'type': { '$first': '$type' },
                'cnt': { '$sum': 1 },
                're': { '$push': '$re' }
            } },
            { '$sort': {
                'cnt': -1
            } },
            { '$group': {
                '_id': '$entity',
                'type': { '$first': '$type' },
                're': { '$push': '$re' }
            } },
            { '$unwind': '$re' },
            { '$unwind': '$re' },
            { '$unwind': '$re' },
            { '$group': {
                '_id': '$_id',
                'type': { '$first': '$type' },
                're': { '$addToSet': '$re' }
            } },
            { '$project': {
                '_id': 0,
                'entity': '$_id',
                'type': 1,
                're': 1,
                'len': { '$size': '$re' }
            } },
            { '$sort': { 'len': -1 } },
            { '$project': {
                'entity': 1,
                'type': 1,
                're': 1,
            } },
            { '$limit': limit }
        ])
    }

    @Cron("*/10 * * * * *")
    async clean() {
        await Promise.all([
            this.explanationModel.deleteMany({ expire_date: { $lte: new Date() } }),
            this.overviewModel.deleteMany({ expire_date: { $lte: new Date() } }),
            this.questionModel.deleteMany({ expire_date: { $lte: new Date() } })
        ]);
    }
}
