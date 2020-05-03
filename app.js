const got = require('got')
const cheerio = require('cheerio')

// Links
const links_SPC = [
    'http://www.spcnet.tv/forums/showthread.php/17771-Smiling-Proud-Wanderer-Unabridged',
    'http://www.spcnet.tv/forums/showthread.php/17771-Smiling-Proud-Wanderer-Unabridged/page2',
]

let links_Lanny = []
for (let i = 1, k = 22; i < k; i++) {
    const number = i.toString().padStart(2, 0)
    links_Lanny.push(`https://www.lannyland.com/wanderer/chapter${number}.shtml`)
}

// Main Process
(async () => {
    try {
        const data = []
        const translators = [
            'hhaung',
            'han solo',
            'pokit'
        ]

        // SPC Pages
        const pages_SPC = await getPages(links_SPC)
        pages_SPC.forEach(page => {
            const $ = cheerio.load(page)
            const $posts = $('#posts > li')
            $posts.each((idx, elem) => {
                const $elem = $(elem)
                const username = $elem.find('.username').text().toLowerCase().trim()
                if (!translators.includes(username)) return
                if ($elem.find('postcounter').text() === "#1") return

                const regex = /chapter \d(\d?)/gi

                const content = $(elem).find('.postrow').text()

                const title = $(elem).find('h2').text().replace(/(\r\n|\n|\r)/gm, "").trim()
                const altTitle = 
                    content 
                    && content.match(regex)
                    && content.match(regex)[0]

                data.push({
                    title: title,
                    altTitle: altTitle,
                    translator: username, 
                    content: content
                })
            })
        })

        // Lannyland Pages
        const pages_Lanny = await getPages(links_Lanny)
        pages_Lanny.forEach(page => {
            let $ = cheerio.load(page)

            $.prototype.wrapAll = function (wrapper) {
                if (this.length < 1) {
                    return this;
                }

                if (this.length < 2 && this.wrap) { // wrap not defined in npm version,
                    return this.wrap(wrapper);      // and git version fails testing.
                }

                var elems = this;
                var section = $(wrapper);
                var marker = $('<div>');
                marker = marker.insertBefore(elems.first()); // in jQuery marker would remain current
                elems.each(function (k, v) {                  // in Cheerio, we update with the output.
                    section.append($(v));
                });
                section.insertBefore(marker);
                marker.remove();
                return section;                 // This is what jQuery would return, IIRC.
            }

            const title = $('h1').text().replace(/ \((final|draft)\)/gi, '')

            $('p.MsoNormal').wrapAll($('<div class="content"></div>'))
            const content = $('.content').html()

            data.push({
                title: title,
                altTitle: null,
                translator: 'Lanny',
                content: content
            })
        })
        
        // Return data
        console.log(data)
    } catch (error) {
        console.log(error)
    }
})()


// Helper Functions

async function getPages(links) {
    return Promise.all(links.map(async link => {
        const { body } = await got(link)
        return body
    }))
}