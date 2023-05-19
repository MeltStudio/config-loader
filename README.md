# Config Loader
## Project Description

The Config Loader package is a powerful and user friendly tool thats allows you to retrieve and collect variables from one or multiple files for your project. This package simplifies the process of extracting specific information from files and provides an efficient way to access those variables in your code.

## Features
- Retrieve and collect variables from one or multiple files in your project.
- Supports a wide range of file formats, including JSON, YAML, XML, and more.
- Allows you to specify filters to select only the desired variables.
- Compatible with TypeScript environments, making it suitable for Node.js or browser-based projects.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
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
import Settings, { option } from '@meltstudio/config-loader';

// Load the configuration file
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
      files: path.join(__dirname, "./YAML_FILE.yaml"),
    }
  );
    const config = settings.get();
    console.log(JSON.stringify(config, null, 2));
```
## Contributing
Explain how others can contribute to the project. Include guidelines for submitting issues, pull requests, or feature requests.

1. Fork the repository
2. Create a new branch
3. Implement your changes
4. Open a pull request

## License
This package is licensed under the Apache License 2.0. For more information, please see the [LICENSE](./LICENSE) file.

## Acknowledgements

🙌 We would like to express our gratitude to the following individuals and resources that have contributed to this project:

- [Manuael Zapata](https://github.com/author1) 🚀: Co-creator and lead developer of the project.
- [Pablo Piedrahita](https://github.com/author2) 👏: Co-creator and lead developer of the project.


Thank you all for your valuable contributions and support! 🎉
