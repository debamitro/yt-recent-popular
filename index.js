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
app.get ('/about', (req, res) => res.render ('about'))

const search_published_after = '2020-12-31T16:00:00Z';
app.get ('/search', (req, res) => {
    youtube.search.list ({
        part: 'snippet',
        q: req.query.q,
        publishedAfter: search_published_after,
        type: 'video',
        order: 'viewCount',
        maxResults: 10
    },
                         (err, results) => {
                             if (err)
                             {
                                 console.error (err)
                                 res.send ('Error')
                             }
                             else
                             {
                                 serve_results (results.data, req, res)
                             }
                         })
})

function html_tag_string (tagname, params, text) {
    let full_string = '<' + tagname;
    for ([k,v] of Object.entries(params)) {
        full_string += ' ' + k + '=\"' + v + '\"'
    }
    full_string += '>' + text + '</' + tagname + '>'
    return full_string
}

const html_string = {
    a : (params, text) => { return html_tag_string ('a', params, text) },
    div : (params, text) => { return html_tag_string ('div', params, text) },
    img : (params, text) => { return html_tag_string ('img', params, text) }
}

function generate_youtube_video_link (video_id, text)
{
    return html_string.a({
        href: 'https://www.youtube.com/watch?v=' + video_id,
        target: '_blank'
    }, text)
}

function generate_youtube_channel_link (channel_id, text)
{
    return html_string.a({
        href: 'https://www.youtube.com/channel/' + channel_id,
        target: '_blank'
    }, text)
}

function serve_results (data, req, res)
{
    var ids_as_list = [];
    data.items.forEach ( (item) => {
        ids_as_list.push (item.id.videoId);
    })
    youtube.videos.list ({
        part: 'statistics',
        id: ids_as_list.toString()
    }, (err, results) => {
        if (err)
        {
            console.error(err)
            res.send ('Error')
        }
        else
        {
            var data_as_list = ''
            data.items.forEach ( (item, i) => {
                const one_video_pic = html_string.div ({
                    'class': 'one_video_pic'
                }, generate_youtube_video_link (item.id.videoId, html_string.img ({
                    'src': item.snippet.thumbnails.default.url
                }, '')))
                const one_video_title = html_string.div ({
                       'class': 'one_video_title'
                }, generate_youtube_video_link (item.id.videoId, item.snippet.title))
                const one_video_channel = html_string.div({
                                          'class': 'one_video_channel'
                }, generate_youtube_channel_link (item.snippet.channelId, item.snippet.channelTitle))
                const one_video_publishedat = html_string.div ({
                        'class' : 'one_video_publishdate'
                }, 'Publish date: ' + item.snippet.publishedAt)
                const one_video_stats = html_string.div ({
                        'class' : 'one_video_stats'
                }, results.data.items[i].statistics.viewCount + ' views ' + results.data.items[i].statistics.likeCount + ' likes ' + results.data.items[i].statistics.commentCount + ' comments ')

                data_as_list += html_string.div ({
                    'class': 'one_video'
                }, one_video_pic
                   + html_string.div ({
                       'class': 'one_video_details'
                   }, one_video_title + one_video_channel
                    + one_video_publishedat
                    + one_video_stats))
            })

            res.render ('results', {
                query: req.query.q,
                timeafter: search_published_after,
                data : html_string.div ({
                    'class': 'video_list'
                }, data_as_list)
            })
        }
    })
}

app.listen (app_port, () => console.log (`Listening on port ${app_port}`))
