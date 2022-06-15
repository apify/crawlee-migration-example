export interface InputSchema {
    startUrls: string[];
    debug?: boolean;
}

export type Label = 'API' | 'EXAMPLE' | 'GUIDE' | 'SKIPPED';

export interface GlobalContext {
    openedPages: number;
    pagesByType: {
        [k in Label]: number;
    };
}
