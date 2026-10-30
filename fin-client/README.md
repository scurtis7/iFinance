# Finance Client

Finance Client is the web UI for iFinance. It shows the portfolio across accounts, and lets you edit cash, shares, prices, categories, ticker colors and the HSA balance, add and remove investments, refresh prices, and drag accounts and investments into a new order.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.0.

## Stack

* [Angular](https://v18.angular.dev/overview) (18+), using standalone components and signals
* Angular CDK for drag and drop
* SCSS
* [Karma](https://karma-runner.github.io) and [Jasmine](https://jasmine.github.io) for unit tests

## Setup

Run `npm install` to install the dependencies.

The client needs [Finance Server](../fin-server/README.md) to load and save anything. It expects the server at `http://localhost:8080`, which is set by the `API_URL` token in `src/app/services/finance-api.service.ts`.

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `npx ng generate component components/<name> --skip-tests` to generate a new component in `src/app/components/`. Components here don't have their own specs, and the unit tests are in `src/app/services/portfolio.service.spec.ts`.

## Build

Run `npm run build` to make a production build. The build artifacts will be stored in the `dist/fin-client` directory.

## Running unit tests

Run `npm test` to execute the unit tests in Chrome. It keeps watching for changes until stopped.

To run the tests once in headless Chrome and exit:

`npx ng test --watch=false --browsers=ChromeHeadless`

To run a single spec file:

`npx ng test --include='**/foo.spec.ts'`

## Project layout

| Path                                    | Description                                                              |
|:----------------------------------------|:-------------------------------------------------------------------------|
| src/app/components/                     | One folder per component, with separate `.html`, `.scss` and `.ts` files |
| src/app/services/portfolio.service.ts   | Holds the app state as signals and saves edits to the server             |
| src/app/services/finance-api.service.ts | One method per server endpoint                                           |
| src/app/models/api.model.ts             | The server's JSON                                                        |
| src/app/models/portfolio.model.ts       | The shape the UI uses                                                    |
| src/assets/styles/variables.scss        | The color palette, to use instead of hard-coded colors                   |

## Further help

To get more help on the Angular CLI use `npx ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
