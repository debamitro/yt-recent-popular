const express = require ('express')
const app = express ()

app.use (express.static('public'))
app.set ('view engine', 'pug')

const {google} = require ('googleapis')

const API_KEY = process.env.GOOGLE_API_KEY;             // take it from the file GOOGLE_API_KEY

const youtube = google.youtube ({
    version: 'v3',
    auth: API_KEY
})

let app_port = process.env.PORT
if (app_port == null || app_port == "") {
    app_port = 3000
}

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
                                 var data_as_list = '<div class=\"video_list\">';
                                 results.data.items.forEach ( (item) => {
                                     data_as_list += '<div class=\"one_video\"><div class=\"one_video_pic\"><a href=\"https://www.youtube.com/watch?v=' + item.id.videoId
                                         + '\" target=\"_blank\"><img src=\"' + item.snippet.thumbnails.default.url
                                         + '\"></img></a></div><div class=\"one_video_details\"><div class=\"one_video_title\">' + item.snippet.title + '</div>'
                                         + '<div class=\"one_video_channel\">' + item.snippet.channelTitle + '</div>'
                                         + '<div class=\"one_video_publishdate\">Publish date: ' + item.snippet.publishedAt + '</div></div></div>\n';
                                 })
                                 data_as_list += '</div>';
                                 res.render ('results', {
                                     query: req.query.q,
                                     timeafter: search_published_after,
                                     data : data_as_list })
                             }
                         })
})

app.listen (app_port, () => console.log (`Listening on port ${app_port}`))
