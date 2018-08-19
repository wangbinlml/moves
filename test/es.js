var elasticsearch = require('elasticsearch');
(async function() {
    var client = new elasticsearch.Client({
        host: '192.168.3.120:9200',
        log: 'trace'
    });
    let body = {
        size: 20,
        from: 0,
        query: {
            match_all: {}
        }
    };
    const results = await client.search({
        index: 'moves',
        body: body
    });

    console.log(`found ${results.hits.total} items in ${results.took}ms`);
    console.log(`returned article titles:`);
    results.hits.hits.forEach(
        (hit, index) => console.log(
            `\t${body.from + ++index} - ${hit._source.name}`
        )
    )

})();
