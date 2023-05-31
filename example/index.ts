import path from "path";

import Settings, { option } from "@/src";

const run = (): void => {
  const settings = new Settings(
    {
      // version: option.string({ required: true, cli: true }),
      // website: {
      //   title: option.string({ required: true }),
      //   url: option.string({
      //     required: false,
      //     defaultValue: "www.mywebsite.dev",
      //   }),
      //   description: option.string({ required: true }),
      //   isProduction: option.bool({ required: true }),
      // },
      // database: {
      //   host: option.string({ required: true }),
      //   port: option.number({ required: true }),
      //   credentials: {
      //     username: option.string(),
      //     password: option.string({
      //       env: "DB_PASSWORD",
      //       cli: true,
      //     }),
      //   },
      // },
      // socialMedia: option.array({
      //   required: true,
      //   item: option.string({ required: true }),
      // }),
      features: option.array({
        required: true,
        item: {
          name: option.string(),
          enabled: option.bool(),
        },
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
