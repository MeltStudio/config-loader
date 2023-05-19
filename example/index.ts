import path from "path";

import Settings, { option } from "@/src";

const run = (): void => {
  const settings = new Settings(
    {
      website: {
        title: option.string({ required: true }),
        url: option.string({
          required: false,
          defaultValue: "www.mywebsite.dev",
        }),
        description: option.string({ required: true }),
        isProduction: option.bool({ required: true }),
      },
      database: {
        host: option.string({ required: true }),
        port: option.number({ required: true }),
        credentials: {
          username: option.string(),
          password: option.string(),
        },
      },
      socialMedia: option.array({
        required: true,
        item: option.string({ required: true }),
      }),
      features: option.array({
        required: true,
        item: option.object({
          item: {
            cosa: option.string(),
            test: option.bool(),
          },
        }),
      }),
    },
    {
      env: false,
      args: true,
      files: path.join(__dirname, "./config.yaml"),
    }
  );
  const config = settings.get();
  console.log(JSON.stringify(config, null, 2));
};

run();
