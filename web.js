var express = require('express'),
    _ = require('underscore'),
    feedParser = require('feedparser'),
    request = require('request'),
    rss = require('rss');

var port = process.env.PORT || 5000;

var app = express.createServer(express.logger());
app.listen(port, function() {
    console.log("Listening on " + port);
});

function genGUID () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}



app.get('/', function(req, res) {
    var feed = new rss({
        title: 'Anatoly\'s Activities',
        description: 'AnatolyG Garmin Connect Activities',
        feed_url: 'http://rss.geyfman.net/rss.xml',
        site_url: 'http://blog.geyfman.net',
        author: 'Anatoly Geyfman'
    });

    var feedUrl = 'http://connect.garmin.com/feed/rss/activities';
    var r = request(feedUrl, {
            qs: {
                feedname: 'Garmin Connect - ageyfman',
                owner: 'ageyfman'
            }
        }).pipe(new feedParser())
        .on('error', function(error) {
            console.log(error);
        })
        .on('meta', function (meta) {
            console.log('===== %s =====', meta.title);
        })
        .on('article', function (article) {
            try {
                var linkUrl = article.link.split("/");
                var changedUrl = "http://connect.garmin.com/activity/embed/" + linkUrl[linkUrl.length - 1];
                var description = "<iframe width='465' height='548' frameborder='0' src='" + changedUrl + "' id='embed_frame'></iframe>";
            }
            catch (err) {
                console.log(err);
                // throw away, and just use the normal description
            }
            feed.item({
                title: article.title || '',
                description: description || article.description,
                date: article.date || (new Date()),
                pubDate: article.pubDate || (new Date()),
                url: article.link || '',
                guid: genGUID(),
                categories: article.categories ? _.uniq(article.categories) : '',
                'georss:point': article['georss:point'] || ''
            });
            console.log('Got article: %s', article.title || article.description);
        })
        .on('complete', function () {
            res.send(feed.xml(), {
                "content-type": "application/xml"
            });
        });
});


