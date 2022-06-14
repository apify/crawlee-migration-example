import { createCheerioRouter, Dataset } from '@crawlee/cheerio';
import { GlobalContext, Label } from './types.js';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ enqueueLinks, crawler }) => {
    const state = await crawler.getState<GlobalContext>();
    state.openedPages++;
    await enqueueLinks({
        globs: [
            { glob: 'https://apify.github.io/apify-ts/api/**', userData: { label: 'API' } },
            { glob: 'https://apify.github.io/apify-ts/docs/**' },
        ],
        transformRequestFunction(data) {
            if (data.url.includes('/apify-ts/docs/examples')) {
                data.userData ??= {};
                data.userData.label = 'EXAMPLE';
                return data;
            }

            if (data.url.includes('/apify-ts/docs/guides')) {
                data.userData ??= {};
                data.userData.label = 'GUIDE';
                return data;
            }

            return data;
        },
    });
});

function createRoute(label: Label, glob: string) {
    router.addHandler(label, async ({ enqueueLinks, request, $, log, crawler }) => {
        const title = $('title').text();
        const state = await crawler.getState<GlobalContext>();
        state.openedPages++;
        state.pagesByType[label]++;
        log.info(`${title}`, state);

        const sidebar = $('.table-of-contents li a').get().map((el) => ({
            href: $(el).attr('href'),
            text: $(el).text().trim(),
        }));

        await Dataset.pushData({
            title,
            url: request.loadedUrl,
            label,
            sidebar,
        });

        await enqueueLinks({
            globs: [glob],
            label,
        });
    });
}

createRoute('API', 'https://apify.github.io/apify-ts/api/**')
createRoute('EXAMPLE', 'https://apify.github.io/apify-ts/docs/examples/**')
createRoute('GUIDE', 'https://apify.github.io/apify-ts/docs/guides/**')
