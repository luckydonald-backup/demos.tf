# demos.tf

Frontend code for [demos.tf](http://demos.tf), see [the api code](https://github.com/demostf/api) for the backend.

## Api base url

At the moment the base url for the api is hardcoded, you can change the base url in `src/Providers/BaseProvider.js`.

## Docker image

A prebuild docker image exist in the [docker hub](https://hub.docker.com/r/demostf/demos.tf/), note that this build always uses `api.demos.tf` as it's api base url.

## Building

Node.js and npm are required to build the project.

### Using make

For systems with make, a Makefile is provided to ease building, simply running

```
make
```

will build the entire project.

### Without make

If you don't have make available you can build the project without it.

```
npm install
node node_modules/.bin/webpack --verbose --colors --display-error-details --config webpack.prod.config.js
```

## Deploying

Since this project only holds static frontend code the webserver only needs to server static files.
Besides serving the static content in `build/` the server will also need to be configured to server `build/index.html` for any request to a non existing url.

A sample config for nginx can be found in `nginx.conf`

## Development

For development you can use the webpack development server which will server the site while automatically recompiling
any changes made to the source and hot-reloading the changes.

You can run the development server with

```
make watch
```

or 

```
node webpack.dev.server.js
```