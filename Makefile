all: build/js/main.js

.PHONY: clean
clean:
	rm -rf dist
	rm -rf node_modules

node_modules: package.json
	npm install

sources=$(wildcard js/*) $(wildcard js/*/*) $(wildcard css/*/*)  $(wildcard css/*)

.PHONY: prod
prod: node_modules $(sources)
	node node_modules/.bin/webpack --verbose --colors --display-error-details --config webpack.prod.config.js

build/js/main.js: prod

.PHONY: build
build: prod

.PHONY: watch
watch: node_modules
	node webpack.dev.server.js

.PHONY: analyse
analyse: node_modules
	node node_modules/.bin/webpack --config webpack.prod.config.js  --profile --json | node_modules/.bin/webpack-bundle-size-analyzer
