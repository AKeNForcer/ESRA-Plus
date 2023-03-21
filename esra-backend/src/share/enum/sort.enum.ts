export enum SortType {
    RELEVANCE = "RELEVANCE",
    NEWEST = "NEWEST",
    OLDEST = "OLDEST"
}

export const SortExpression = {
    RELEVANCE: { rank: 1 },
    NEWEST: { update_date: -1 },
    OLDEST: { update_date: 1 }
}