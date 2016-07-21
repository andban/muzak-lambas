var Spotify = require('spotify-web-api-node')

console.log('start spotify-query')

var spotify = new Spotify({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
})

exports.handle = function (event, ctx, cb) {
  console.log('processing event:', JSON.stringify(event))

  if (!event.track || !event.artist) {
    return cb(new Error('artist and/or track attribute is missing'))
  }

  spotify.clientCredentialsGrant()
    .then(function (data) {
      spotify.setAccessToken(data.body.access_token)
    }, function (err) { cb(new Error(err)) })
    .then(function () {
      return spotify.searchTracks('track:' + event.track + ' ' + 'artist:' + event.artist)
    }).then(function (data) {
      var track = data.body.tracks.items
        .sort(function (a, b) {
            console.log(a, b)
            var adiff = a.name.length - event.track.length;
            var bdiff = b.name.length - event.track.length;
            if (adiff === 0 && bdiff !== 0) {
                return -1;
            } else if (adiff !== 0 && bdiff === 0) {
                return 1
            }

            return b.popularity - a.popularity
        })
        .shift();
      if (!track) {
        throw new Error('no track found')
      }

      return track
    }, function (err) { cb(err) })
    .then(function (track) {
      spotify.getAudioFeaturesForTrack(track.id)
        .then(function (data) {
            cb(null, { track: track, analysis: data.body })
        }, function (err) { cb(err) })
    }, function (err) { cb(err) })
}
