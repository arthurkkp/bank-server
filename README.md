# Bank Server

<div align="center">
<br>
    <a href="https://bank.pietrzakadrian.com"> 
        <img src="https://images.pietrzakadrian.com/logo.png" alt="Bank Application"/>
    </a>

[**Live Preview**](https://bank.pietrzakadrian.com) | [**Swagger Documentation**](https://api.pietrzakadrian.com/documentation) | [**Contact the developer**](mailto:contact@pietrzakadrian.com)

 <hr>
<h4>
Full Stack Web Application similar to financial software that is used in professional banking institutions.
</h4>

</div>

## Features

- The current account balance is calculated based on the SQL operation (**Double-entry bookkeeping**)
- Internalization of the application for three languages: **English**, **German** and **Polish**
- Support for **multiple currencies** with the current rate supplied from an external server via **API**
- Application programmed according to the correct design patterns and principle, i.e. **SOLID**, **DRY** and **KISS**
- Software supports **PWA**, it is adapted to all modern browsers and mobile devices (RWD)
- Implementation of **Google Analytics** along with the Cookie Consent according to the **GDPR**

<hr>

<div align="center">
    <img src="https://images.pietrzakadrian.com/app_dashboard.png"  />
</div>

<hr>

## Technology Stack

**Backend technologies:** [TypeScript](https://github.com/microsoft/TypeScript), [Node.js](https://github.com/nodejs/node), [Nest.js](https://github.com/nestjs/nest), REST API, PostgreSQL and Swagger Documentation

## Quick Start

### System Requirements

- [**Node.js** v12.18+](https://nodejs.org/en/)
- [**yarn** v1.22+](https://classic.yarnpkg.com/en/)
- [**PostgreSQL** v10.12+](https://www.postgresql.org/)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd bank-server

# 2. Install dependencies
yarn install

# 3. Set up environment variables
cp .env.example .env
# Edit .env file with your database credentials and other settings

# 4. Set up PostgreSQL database
# Create a database named 'bank' (or as specified in your .env)
createdb bank

# 5. Run database migrations
yarn migration:run

# 6. Start the development server
yarn start:dev
```

The server will start on `http://localhost:4000` (or the port specified in your `.env` file).

### API Documentation

Once the server is running, you can access the Swagger API documentation at:
`http://localhost:4000/documentation`

## Project Structure

```
src/
├── common/           # Shared DTOs, entities, and utilities
├── decorators/       # Custom decorators
├── exceptions/       # Custom exception classes
├── filters/          # Exception filters
├── guards/           # Authentication and authorization guards
├── interceptors/     # Request/response interceptors
├── interfaces/       # TypeScript interfaces
├── middlewares/      # Express middlewares
├── migrations/       # Database migration files
├── modules/          # Feature modules
│   ├── app/         # Main application module
│   ├── auth/        # Authentication and JWT management
│   ├── bill/        # Account management (banking accounts)
│   ├── currency/    # Multi-currency support and exchange rates
│   ├── language/    # Internationalization
│   ├── message/     # User messaging system
│   ├── notification/# System notifications
│   ├── transaction/ # Money transfer operations
│   └── user/        # User management
├── providers/        # Custom providers
├── utils/           # Utility functions and configurations
└── main.ts          # Application entry point
```

## Development

For detailed development instructions, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Coding Standards

For coding guidelines and standards, see [CODING_STANDARDS.md](./CODING_STANDARDS.md).

## License

This project is licensed under the MIT license. Copyright (c) 2020 Adrian Pietrzak.
