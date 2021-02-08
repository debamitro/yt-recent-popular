const express = require ('express')
const app = express ()

app.use (express.static('public'))
app.set ('view engine', 'pug')

const {google} = require ('googleapis')

const API_KEY = '';             // take it from the file GOOGLE_API_KEY

const youtube = google.youtube ({
    version: 'v3',
    auth: API_KEY
})

app.get ('/', (req, res) => res.render ('index'))

const search_published_after = '2020-12-31T16:00:00Z';
app.get ('/search', (req, res) => {
    youtube.search.list ({
        part: 'snippet',
        q: req.query.q,
        publishedAfter: search_published_after,
        type: 'video',
        order: 'viewCount'
    },
                         (err, results) => {
                             if (err)
                             {
                                 console.error (err)
                                 res.send ('Error')
                             }
                             else
                             {
                                 var data_as_list = '<ul>';
                                 results.data.items.forEach ( (item) => {
                                     data_as_list += '<li><a href=\"https://www.youtube.com/watch?v=' + item.id.videoId
                                         + '\"><img src=\"' + item.snippet.thumbnails.default.url
                                         + '\"></img>' + item.snippet.title + '</a><br />'
                                         + 'Channel: ' + item.snippet.channelTitle + '<br />'
                                         + 'Publish date: ' + item.snippet.publishedAt + '</li>\n';
                                 })
                                 data_as_list += '</ul>';
                                 res.render ('results', {
                                     query: req.query.q,
                                     timeafter: search_published_after,
                                     data : data_as_list })
                             }
                         })
})

app.listen (3000, () => console.log ("Listening on port 3000"))
