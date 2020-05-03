const got = require('got')
const cheerio = require('cheerio')


const links = [
    'http://www.spcnet.tv/forums/showthread.php/17771-Smiling-Proud-Wanderer-Unabridged',
    'http://www.spcnet.tv/forums/showthread.php/17771-Smiling-Proud-Wanderer-Unabridged/page2',
]

async function getPages() {
    return Promise.all(links.map(async link => {
        const { body } = await got(link)
        return body
    }))
}

(async ()=> {
    const arr = []
    const translators = [
        'hhaung',
        'han solo',
        'pokit'
    ]

    const pages = await getPages()
    pages.forEach(page => {
        const $ = cheerio.load(page)
        const $posts = $('#posts > li')
        $posts.each((idx, elem) => {
            const $elem = $(elem)
            const username = $elem.find('.username').text().toLowerCase().trim()
            if (!translators.includes(username)) return
            if ($elem.find('postcounter').text() === "#1") return

            const regex = /chapter \d(\d?)/gi

            const chapterContents = $(elem).find('.postrow').text()
            
            const title = $(elem).find('h2').text().replace(/(\r\n|\n|\r)/gm, "").trim()
            const altTitle = 
                chapterContents 
                && chapterContents.match(regex)
                && chapterContents.match(regex)[0]

            arr.push({
                title: title,
                altTitle: altTitle,
                content: chapterContents
            })
        })
    })

    console.log(arr)
})()