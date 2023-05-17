# config-loader
Config loader from one or more layered configuration sources

## Installation

```javascript
yarn add @meltstudio/config-loader
```

## Usage

```javascript
    const settings = new Settings({
        hardware: {
            type: option({
            env: EXAMPLE_DEVICE_TYPE',
            cli: true,
            help: 'kind of device to run',
                required: true,
            }),
        },
    }, {
        env: true,
        args: true,
        files: 'config.yaml',
        dir: '/etc/example/conf.d'
    })
```
