import Apify from 'apify';

const { enqueueLinks } = Apify.utils;

export async function handleStart({ $, request, crawler }, state){
    state.openedPages++;
    await enqueueLinks({
        $,
        requestQueue: crawler.requestQueue,
        baseUrl: request.loadedUrl,
        pseudoUrls: [
            { purl: 'https://apify.github.io/apify-ts/api/[.*]', userData: { label: 'API' } },
            { purl: 'https://apify.github.io/apify-ts/docs/[.*]' },
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
}

export async function handleDetail({ $, crawler, request }, purl, state) {
    const title = $('title').text();
    const { label } = request.userData;
    state.openedPages++;
    state.pagesByType[request.userData.label]++;
    crawler.log.info(`${title}`, state);

    const sidebar = $('.table-of-contents li a').get().map((el) => ({
        href: $(el).attr('href'),
        text: $(el).text().trim(),
    }));

    await Apify.pushData({
        title,
        url: request.loadedUrl,
        label,
        sidebar,
    });

    await enqueueLinks({
        $,
        baseUrl: request.loadedUrl,
        requestQueue: crawler.requestQueue,
        pseudoUrls: [{
            purl,
            userData: { label: request.userData.label },
        }],
    });
}
