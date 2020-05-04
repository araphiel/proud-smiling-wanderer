const fs = require('fs-extra')
const got = require('got')
const cheerio = require('cheerio')
const TurndownService = require('turndown')
const { wordsToNumbers } = require('words-to-numbers');

// Markdown Service

let cache = []
const convert = new TurndownService()
convert.addRule('img', {
    filter: 'img',
    replacement: content => ''
})
convert.addRule('blockquote', {
    filter: 'blockquote',
    replacement: content => {
        content = content.replace(/^\n+|\n+$/g, '')
        return '\n\n' + content + '\n\n'    
    }
})
convert.addRule('footnote', {
    filter: function (node) {
        if (node.nodeName === 'A' && node.href.includes("#_ftn")) {
            return node.getAttribute('href')
        }
    },
    replacement: function (content, node) {
        let footnote = content.slice(2, content.length - 2)
        const cacheIncludes = cache.includes(footnote)

        if (cacheIncludes) {
            const index = cache.indexOf(footnote)
            if (index > -1) cache.splice(index, 1)
            return `[^${footnote}]:`
        }

        cache.push(footnote)

        return `[^${footnote}]`        
    }
})


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

                const content = $(elem).find('.postrow')
                const contentText = content.text()
                const contentHTML = content.html()         

                const contentMarkdown = convert.turndown(contentHTML)

                const title = $(elem).find('h2').text().replace(/(\r\n|\n|\r)/gm, "").trim()
                const altTitle = 
                    contentText 
                    && contentText.match(regex)
                    && contentText.match(regex)[0]

                data.push({
                    title: title,
                    altTitle: altTitle,
                    content: contentMarkdown
                })
            })
        })

        // Lannyland Pages
        const pages_Lanny = await getPages(links_Lanny)
        pages_Lanny.forEach((page, idx) => {
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
            $('.content a').addClass(`page-${idx}`)
            let content = $('.content').html()                  
            const contentMarkdown = convert.turndown(content)

            data.push({
                title: title,
                altTitle: null,
                content: contentMarkdown
            })
        })
        
        // Create markdown file
        data.forEach(item => {
            const selectedTitle = item.title ? item.title : item.altTitle
            
            let chapter, chapterReplace, chapterNumber

            const chapterMatch = selectedTitle.match(/chapter \b(\w*)/gi)
            if (chapterMatch) {
                chapter = chapterMatch[0] // get first results from chapter match
                chapterReplace = chapter.replace(/chapter /gi, '') // strips "chapter "
                chapterNumber = wordsToNumbers(chapterReplace).toString() // converts sixteen to 16 + gets string
            }
            
            const filename = chapter 
                ? `chapter-${chapterNumber}`
                : 'index'

            let content = item.content.replace('�', '')
                content = item.content.replace('“', '"')
                content = item.content.replace('”', '"') 

            fs.outputFileSync(`${__dirname}/dist/markdown/${filename}.md`,
                `\n\n# ${selectedTitle}\n\n${content}`)
        })
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