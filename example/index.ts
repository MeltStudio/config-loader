import path from "path";

import c from "@/src";

const run = (): void => {
  const settings = c.schema({
    version: c.string({ required: true, cli: true }),
    website: {
      title: c.string({ required: true }),
      url: c.string({
        required: false,
        defaultValue: "www.mywebsite.dev",
      }),
      description: c.string({ required: true }),
      isProduction: c.bool({ required: true }),
    },
    database: {
      host: c.string({ required: true }),
      port: c.number({ required: true }),
      credentials: {
        username: c.string(),
        password: c.string({
          env: "DB_PASSWORD",
          cli: true,
        }),
      },
    },
    socialMedia: c.array({
      required: true,
      item: c.string({ required: true }),
    }),
    features: c.array({
      required: true,
      item: {
        name: c.string(),
        enabled: c.bool(),
      },
    }),
  });
  const config = settings.load({
    env: false,
    args: true,
    files: path.join(__dirname, "./config.yaml"),
  });
  console.log(JSON.stringify(config, null, 2));
};

run();
