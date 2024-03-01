import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Azoth",
    description: "Azoth UI library documentation",
    lastUpdated: true,
    head: [
        ['link', { rel: 'icon', href: '/azoth-logo.png' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOriginIsolated: true }],
        ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap' }],
    ],
    themeConfig: {
        outline: {
            level: [2, 4],
        },
        logo: '/azoth-logo.png',
        nav: [
            { text: 'Arcanum', link: '/intro' },
            { text: 'About', link: '/about' },
            { text: 'Examples', link: '/examples' }
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
            { icon: 'github', link: 'https://github.com/azoth-web/azoth' }
        ]
    }
})
