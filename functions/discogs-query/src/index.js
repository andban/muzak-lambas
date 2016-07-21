import { Client } from 'disconnect'
import 'babel-polyfill'

const client = new Client({
    userToken: process.env.DISCOGS_API_TOKEN
})

function promisify(func, ...args) {
    return new Promise((resolve, reject) => (
        func(...args, (err, result) => err ? reject(err) : resolve(result))
    ))
}

export default async function (event, context) {
    const { artist, track, release_title } = event
    const database = client.database();

    console.log(`querying Discogs database for track '${track}' by '${artist}' on album '${release_title}'...`)
    try {
        const releases = await promisify(database.search, '', {
            type: 'master,release',
            artist,
            track,
            release_title
        });

        const match = releases.results
            .filter((release) => release.title.indexOf(event.artist) > -1)
            .sort((a, b) => {
                if (a.type === 'master' && b.type !== 'master') {
                    return -1;
                } else if (a.type !== 'master' && b.type === 'master') {
                    return 1;
                } else {
                    return 0;
                }
            })
            .shift()

        if (!match) {
            console.log('nothing found :(')
            return context.succeed({ result: null })
        }

        let id = match.id;
        if (match.type === 'master') {
            const master = await promisify(database.getMaster, match.id)
            id = master.main_release
        }

        const result = await promisify(database.getRelease, id)
        context.succeed({ result })
    } catch (err) {
        context.fail(err)
    }
}

