const got = require('got')
const cheerio = require('cheerio')


async function getContent () {
    
        const links = [
            'http://www.spcnet.tv/forums/showthread.php/17771-Smiling-Proud-Wanderer-Unabridged',
            'http://www.spcnet.tv/forums/showthread.php/17771-Smiling-Proud-Wanderer-Unabridged/page2',
        ]

        links.forEach(async function (link){
            try {
                const { body } = await got(link)
                const $ = cheerio.load(body)
                const posts = $('#posts > li')
                
                posts.each(function (idx, elem) {
                    const $elem = $(elem)
                    const username = $elem.find('.username').text()
                    
                    if (username !== 'hhaung') return

                    const regex = /chapter \d(\d?)/gi
                    const chapterContents = $elem.find('.postrow').text()
                    const contentTitle = chapterContents.match(regex)

                    console.log(contentTitle)
                })
            } catch (error) {
                console.log(error)
            }
        })
}

getContent()