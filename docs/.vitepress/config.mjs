import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Azoth",
    description: "Azoth documentation",
    lastUpdated: true,
    head: [
        ['link', {
            rel: 'icon',
            href: '/azoth-logo-black.svg',
            type: "image/svg+xml",
            media: '(prefers-color-scheme: light)',

        }],
        ['link', {
            rel: 'icon',
            href: '/azoth-logo-white.svg',
            type: "image/svg+xml",
            media: '(prefers-color-scheme: dark)',
        }],

        ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
        ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOriginIsolated: true }],
        ['link', {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap'
        }],
    ],
    themeConfig: {
        outline: {
            level: [2, 4],
        },
        logo: {
            light: '/azoth-logo-black.svg',
            dark: '/azoth-logo-white.svg',
            alt: 'Azoth Logo',
        },
        nav: [
            { text: 'Arcanum', link: '/intro' },
            { text: 'About', link: '/about' },
            { text: 'Examples', link: '/examples' }
        ],
        sidebar: [
            {
                text: 'JSX',
                items: [
                    { text: 'About', link: '/jsx/about' },
                    { text: 'Compose', link: '/jsx/compose' },
                    // { text: 'Component', link: '/jsx/compose' },
                    { text: 'Async', link: '/jsx/async' },
                ]
            },
            // {
            //     text: 'Channels',
            //     items: [
            //         { text: 'Intro to Channels', link: '/channels/about' },
            //         { text: 'Async Data Providers', link: '/channels/async' },
            //         { text: 'Transform Functions', link: '/channels/transform' },
            //         { text: 'Channel and Provider Options', link: '/channels/options' },
            //         { text: 'Branch & Layer', link: '/channels/branch-and-layer' },
            //         { text: 'Track State', link: '/channels/state' },
            //     ]
            // }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/azoth-web/azoth' }
        ]
    }
})
