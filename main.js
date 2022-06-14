import Apify from 'apify';
import { handleDetail, handleStart } from './routes.js';

const { log } = Apify.utils;

Apify.main(async () => {
    const { startUrls = ['https://apify.github.io/apify-ts'], debug } = await Apify.getInput() ?? {};

    if (debug) {
        log.setLevel(log.LEVELS.DEBUG);
    }

    const proxyConfiguration = await Apify.createProxyConfiguration();
    const requestList = await Apify.openRequestList(null, startUrls);
    const requestQueue = await Apify.openRequestQueue();

    const state = await Apify.getValue('STATE') || {
        openedPages: 0,
        pagesByType: {
            API: 0,
            EXAMPLE: 0,
            GUIDE: 0,
        },
    };
    Apify.events.on('persistState', async () => {
        await Apify.setValue('STATE', state);
    });

    const crawler = new Apify.CheerioCrawler({
        proxyConfiguration,
        requestList,
        requestQueue,
        // Be nice to the websites.
        // Remove to unleash full power.
        maxConcurrency: 50,
        handlePageTimeoutSecs: 10,
        handlePageFunction: async (ctx) => {
            switch (ctx.request.userData.label) {
                case 'API': return handleDetail(ctx, 'https://apify.github.io/apify-ts/api/[.*]', state);
                case 'EXAMPLE': return handleDetail(ctx, 'https://apify.github.io/apify-ts/docs/examples/[.*]', state);
                case 'GUIDE': return handleDetail(ctx, 'https://apify.github.io/apify-ts/docs/guides/[.*]', state);
                default: return handleStart(ctx, state);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});

