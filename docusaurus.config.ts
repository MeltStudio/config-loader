import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "@meltstudio/config-loader",
  tagline:
    "A type-safe configuration loader for Node.js — YAML, JSON, .env, environment variables, and CLI arguments.",
  url: "https://meltstudio.github.io",
  baseUrl: "/config-loader/",

  organizationName: "MeltStudio",
  projectName: "config-loader",

  onBrokenLinks: "throw",

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  plugins: ["docusaurus-plugin-llms"],

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarItemsGenerator: async () => [],
        },
        blog: false,
        pages: false,
        theme: {
          customCss: undefined,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: "@meltstudio/config-loader",
      items: [
        {
          href: "https://github.com/MeltStudio/config-loader",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Copyright ${new Date().getFullYear()} MeltStudio. MIT License.`,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
