<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

![CI](https://github.com/shapiy/payments/actions/workflows/ci.yaml/badge.svg)

## Description

Sample payment gateway app built with NestJS 💸

## Review notes

In order to follow the payouts logic, it is better to check [the e2e test suite](test/app.e2e-spec.ts).

- **System Configuration** is modelled as key-value storage at database level. It allows to easily add keys in the future.
- **% Fees** are accepted as fractions of 1, i.e. 5% is represented as 0.05. 
- **All fees are computed** and stored in the database **immediately** when the payment is accepted. It means that configuration
  changes do not affect historical payments.
- **Payouts API** is deliberately missing the validation on the payout limits (once a day) to facilitate testing.
- Payments can be prioritized for payouts using a strategy (see [payment-prioritization-strategy.interface.ts](src/payout/strategies/payment-prioritization-strategy.interface.ts)).
- By default `COMPLETED` payments are prioritized over `PROCESSED`.

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

You can access interactive Swagger API at http://localhost:3000/docs

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
