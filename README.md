## Overview

[Marketplace Kit](https://github.com/mdyd-dev/marketplace-kit) is command line tool, which was developed to allow you to easily deploy your configuration files and assets to the Platform OS. It expects you to follow a certain file structure in order to correctly communicate with the Platform OS API. You do not have to use it, however it is highly recommended that you do. It is a CLI tool, hence you are expected to have basic knowledge in working with Terminal.

If you have any feature requests, feedback or problems please head over to the [issues page](https://github.com/mdyd-dev/marketplace-kit/issues) and let us know.

All commands should be run in the project root directory - i.e. one level above `marketplace_builder` directory.

### Requirements

marketplace-kit requires nodejs >= v8 to work properly. [Read more on how to install node on your platform](https://nodejs.org/en/download/).

## Installation and update

If your node is installed for all users you might need to use `sudo` to install npm packages globally:

    sudo npm i -g @platform-os/marketplace-kit

If you are using nvm or node installed on your account, you can omit that:

    npm i -g @platform-os/marketplace-kit

## Usage

### Adding environments and authenticating

To add your environment to a config file you need to run `env add` command and authenticate with your credentials.

```
marketplace-kit env add <environment> --email <your email> --url <your marketplace url>
```

Example: marketplace-kit env add staging --email myemail@example.com --url https://example.com

Configuration for environments lays down in `.marketplace-kit` file.

### Syncing changes

```
marketplace-kit sync <environment>
```

Example: `marketplace-kit sync staging`

Enables sync mode - immediately pushes changes made to filesystem to the proper environment. It feels like working on localhost. For obvious reason, it is dangerous to use on production, on a live marketplace - it is recommended to use it only for staging.

### Deploying changes

```
marketplace-kit deploy <environment>
```

Example: `marketplace-kit deploy staging`

Deploys all the changes. It is recommended to first deploy to `staging`, test, and only then trigger to production. Effectively, deploy creates a zip file containning all your files and sends it to API. It is then processed in the background. Each zip file is stored by us, in order to allow you to rollback in case something goes wrong.

### Deploying with force flag (`-f` or `--force`)

If you want to deploy the whole `marketplace_builder` directory to environment overriding everything there was, use `-f` flag.
Note: It will also remove files from the server that are not present in your currently deployed source directory.

```
marketplace-kit deploy <environment> -f
```

Example: `marketplace-kit deploy staging -f`

In the next section we will describe the file structure.

### Listing all environments

If you forgot know what your environments are named or the url that is corresponding to any name, use:

```
marketplace-kit env list
```

### Initializing required directory structure

If you need to create new project from scratch you can init directory structure using:

```
marketplace-kit init
```

It will download directory structure from official repository and extract it in your current directory.

We will try to keep it up to date and also keep it as useful as possible.
If you have any feedback for directory structure go to [github](https://github.com/mdyd-dev/directory-structure) and create an issue.
