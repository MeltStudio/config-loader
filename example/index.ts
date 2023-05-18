/* eslint-disable no-restricted-imports */
import path from "path";

import Settings, { option } from "../src";

const run = (): void => {
  const settings = new Settings(
    {
      database: {
        host: option.string({ required: true, cli: true }),
        port: option.number({ required: true }),
      },
      test: {
        arrayoption: option.array({
          required: true,
          item: option.string(),
        }),
        objarray: option.array({
          required: true,
          item: option.object({
            item: {
              cosa: option.string(),
              test: option.number(),
            },
          }),
        }),
      },
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
