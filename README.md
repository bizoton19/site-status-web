# poller-vue-ui

> single vue poller ui

## Contact form

`/contact` posts to the Azure Functions route named by `VITE_CONTACT_FUNCTION` (default `contact`). The browser shows a Cloudflare Turnstile widget (`VITE_TURNSTILE_SITE_KEY`). The function in `azure-functions/contact` checks the token with Siteverify before storing the message. Setup, including how to create Turnstile keys for outpost13.app, is in `azure-functions/contact/README.md`. Do not commit the Turnstile secret.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run all tests
npm test
```

## Logical Architecture
![architecture](/azure_poller_architecture.png "architecture")
