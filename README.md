<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

![CI](https://github.com/shapiy/payments/actions/workflows/ci.yaml/badge.svg)

## Description

Sample payment gateway app built with NestJS 💸

## Project setup

```bash
$ yarn install
```

## Compile and run the project

```bash
# prepare configuration
cp .env.example .env

# run dependencies
docker compose up

# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
