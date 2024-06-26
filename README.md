# @meltstudio/config-loader

> ⚠️ **WARNING**: This project is in beta, so some features may change in the future. Use at your own discretion

## Project Description

The Config Loader package is a powerful and user-friendly tool that simplifies the process of retrieving and collecting variables from one or multiple files for your project. It provides an efficient way to extract specific information from files and access those variables in your code. The result is a JSON object, making it easy to work with in various applications.

## Features

- Retrieve and collect variables from one or multiple files in your project.
- YAML file support (support for other file types coming soon.)
- Data can also be retrieved from CLI or environment variables .
- Compatible with TypeScript/JavaScript environments, making it suitable for Node.js projects.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [License](#license)
- [Acknowledgements](#acknowledgements)

## Installation

To install the project, you can use the following steps:

1. Ensure that you have [Node.js](https://nodejs.org/) installed on your machine.
2. Open a terminal or command prompt.
3. Run the following command to install the project and its dependencies via npm:

```bash
$ npm install @meltstudio/config-loader
```

```bash
$ yarn add @meltstudio/config-loader
```

## Usage

Here's an example of how to use the `@meltstudio/config-loader` package in a TypeScript project:

```typescript
import path from "path";

import c from "@meltstudio/config-loader";

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
        password: c.string(),
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
```

With a config.yaml file with the following contents:

```yaml
version: 1.0.0
website:
  title: My Website
  description: A simple and elegant website
  port: 3000
  isProduction: false

database:
  host: localhost
  port: 5432
  credentials:
    username: admin
    password: secret

socialMedia: [https://twitter.com/example, https://instagram.com/example]

features:
  - name: Store
    enabled: true
  - name: Admin
    enabled: false

apiKeys:
  googleMaps: ${GOOGLE_MAPS_API_KEY}
  sendGrid: ${SENDGRID_API_KEY}
```

The expected output would be:

```json
{
  "version": "1.0.0",
  "website": {
    "title": "My Website",
    "url": "www.mywebsite.dev",
    "description": "A simple and elegant website",
    "isProduction": false
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "credentials": {
      "username": "admin",
      "password": "secret"
    }
  },
  "socialMedia": [
    "https://twitter.com/example",
    "https://instagram.com/example"
  ],
  "features": [
    {
      "name": "Store",
      "enabled": true
    },
    {
      "name": "Admin",
      "enabled": false
    }
  ]
}
```

You can try executing our example in your project by following these steps with the command:

```bash
yarn example:run
```

### Usage with CLI

When using our package with cli, it is important to have the cli attribute set to true.
This will allow values to be sent when running the package from the command line.

```typescript
import path from "path";

import c from "@meltstudio/config-loader";

const run = (): void => {
  const settings = c.schema({
    version: c.string({
      required: true,
      cli: true, 👈
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
```

To use it you need to send the property name on the command line with the new value

```bash
yarn example:run --version 2.0.0
```

Having the following config.yaml file:

```yaml
version: 1.0.0
```

The expected output would be:

```json
{
  "version": "2.0.0"
}
```

You can see that the CLI variable overrode the yaml file variable

### Usage with Environment Variables

The Config Loader package allows you to use environment variables in your system configuration. You can specify variable names in your configuration and get them. To use this feature you need to set **env: true**

```typescript
import path from "path";

import c from "@meltstudio/config-loader";

const run = (): void => {
  const settings = c.schema({
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
  });
  const config = settings.load({
    env: true, 👈
    args: true,
    files: path.join(__dirname, "./config.yaml"),
  });
  console.log(JSON.stringify(config, null, 2));
};

run();
```

With the following config.yaml file:

```yaml
database:
  host: localhost
  port: 5432
  credentials:
    username: admin
    password: IGNORED_PASSWORD
```

```bash
yarn example:run
```

If you have the environment variable `DB_PASSWORD=ENV_USED_PASSWORD`, the expected output would be:

```json
{
  "database": {
    "host": "localhost",
    "port": 5432,
    "credentials": {
      "username": "admin",
      "password": "ENV_USED_PASSWORD"
    }
  }
}
```

You can notice that the environment variable overrode the value in the config.yaml file

## License

This package is licensed under the Apache License 2.0. For more information, please see the [LICENSE](./LICENSE) file.
