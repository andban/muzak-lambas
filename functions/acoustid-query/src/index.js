import axios from 'axios'
import querystring from 'querystring'
import 'babel-polyfill'

const ACOUSTID_URL = 'http://api.acoustid.org/v2/lookup'
const ACOUSTID_API_TOKEN = process.env.ACOUSTID_API_TOKEN

export default async function (event, context) {
    const { fingerprint, duration } = event

    try {
        const data = querystring.stringify({
            fingerprint,
            duration,
            meta: 'recordings tracks compress',
            format: 'json',
            client: ACOUSTID_API_TOKEN
        })

        const response = await axios.post(ACOUSTID_URL, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': data.length
            }
        })

        const match = response.data.results
            .filter(result => result.recordings)
            .sort((a, b) => b.score - a.score)
            .shift()

        if (!match) {
            context.succeed({ result: null })
        }

        match.recordings = match.recordings
            .sort((a, b) => (a.duration - duration) - (b.duration - duration))
            .shift()

        context.succeed({ result: match })
    } catch (err) {
        context.fail(err)
    }
}
