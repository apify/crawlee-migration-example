import { Actor } from 'apify';
import { CheerioCrawler, KeyValueStore, log } from '@crawlee/cheerio';
import { router } from './routes.js';
import { GlobalContext, InputSchema } from './types';

await Actor.init();

const { startUrls = ['https://apify.github.io/apify-ts'], debug } = await KeyValueStore.getInput<InputSchema>() ?? {};

if (debug) {
    log.setLevel(log.LEVELS.DEBUG);
}

const proxyConfiguration = await Actor.createProxyConfiguration();

const crawler = new CheerioCrawler({
    proxyConfiguration,
    // Be nice to the websites.
    // Remove to unleash full power.
    maxConcurrency: 50,
    requestHandler: router,
    requestHandlerTimeoutSecs: 10,
});

await crawler.getState<GlobalContext>({
    openedPages: 0,
    pagesByType: {
        API: 0,
        EXAMPLE: 0,
        GUIDE: 0,
    },
});

await crawler.addRequests(startUrls);

log.info('Starting the crawl.');
await crawler.run();
log.info('Crawl finished.');

await Actor.exit();
