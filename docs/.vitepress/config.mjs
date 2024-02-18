import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Azoth",
    description: "Azoth UI library documentation",
    lastUpdated: true,
    head: [['link', { rel: 'icon', href: '/azothjsx-ico.png' }]],
    themeConfig: {
        outline: {
            level: [2, 4],
            label: 'Async FTW'
        },
        logo: '/azothjsx-ico.png',
        nav: [
            { text: 'Home', link: '/' },
            { text: 'JSX', link: '/jsx-dom' },
            { text: 'Examples', link: '/markdown-examples' }
        ],

        // sidebar: [
        //     {
        //         text: 'Examples',
        //         items: [
        //             { text: 'Markdown Examples', link: '/markdown-examples' },
        //             { text: 'Runtime API Examples', link: '/api-examples' }
        //         ]
        //     }
        // ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/azothjsx/azoth' }
        ]
    }
})
