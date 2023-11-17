# Kingborough Council Scraper

* Server - Unknown
* Cookie tracking - No
* Pagnation - No
* Javascript - No
* Clearly defined data within a row - Yes

# Local Development
## Prerequisites
- Node 16 - BEWARE the old version, this is what's supported on morph.io. See `nvm` if you need to be able to switch between versions. 
    - OPTIONAL: The `./devcontainer` directory contains config for running a Node 16 Dev Container. See https://code.visualstudio.com/docs/devcontainers/containers
- Visual Studio Code - Highly recommended as your editor for build in type checking. 

## Getting Started
In a terminal, run the following commands:
```
npm install
npm run dev
```
This will run the scraper whenever you save a change to a file. 

Edit the `.ts` files in the `src` directory to make changes. These are TypeScript files that are "compiled" to JavaScript files in the `build` directory.

## Commiting
Ensure you have run `npm run dev` or `npm run tsc` before commiting and include the contents of `./build`.

morph.io runs the built javascript, not typescript files.