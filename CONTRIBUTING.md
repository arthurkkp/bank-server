# Contributing Guidelines

Thank you for your interest in contributing to the Bank Server project! This document provides guidelines and instructions for contributing to the codebase.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation Guidelines](#documentation-guidelines)
- [Issue Reporting](#issue-reporting)
- [Security Vulnerabilities](#security-vulnerabilities)
- [Community Guidelines](#community-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background, experience level, or identity.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing private information without permission
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- [Node.js](https://nodejs.org/) v12.18 or higher
- [yarn](https://classic.yarnpkg.com/) v1.22 or higher
- [PostgreSQL](https://www.postgresql.org/) v10.12 or higher
- [Git](https://git-scm.com/) for version control

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/bank-server.git
   cd bank-server
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/bank-server.git
   ```

4. **Install dependencies**:
   ```bash
   yarn install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

6. **Set up the database**:
   ```bash
   createdb bank
   yarn migration:run
   ```

7. **Verify your setup**:
   ```bash
   yarn start:dev
   # Server should start on http://localhost:4000
   ```

## Development Workflow

### Branch Naming Convention

Use descriptive branch names following this pattern:

```
feature/add-user-authentication
bugfix/fix-transaction-validation
hotfix/security-patch
docs/update-api-documentation
refactor/improve-error-handling
```

### Workflow Steps

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our [coding standards](#coding-standards)

3. **Write or update tests** for your changes

4. **Run the test suite**:
   ```bash
   yarn test
   yarn test:e2e
   ```

5. **Run linting and formatting**:
   ```bash
   yarn lint
   yarn format
   ```

6. **Commit your changes** with a descriptive message:
   ```bash
   git add .
   git commit -m "feat: add user authentication middleware"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request** on GitHub

### Keeping Your Fork Updated

Regularly sync your fork with the upstream repository:

```bash
git checkout master
git fetch upstream
git merge upstream/master
git push origin master
```

## Pull Request Process

### Before Submitting

- [ ] Ensure all tests pass (`yarn test` and `yarn test:e2e`)
- [ ] Run linting without errors (`yarn lint`)
- [ ] Format code consistently (`yarn format`)
- [ ] Update documentation if needed
- [ ] Add or update tests for new functionality
- [ ] Verify your changes don't break existing functionality

### Pull Request Template

When creating a pull request, include:

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows the project's coding standards
- [ ] Self-review of code completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by at least one maintainer
3. **Testing** in a staging environment (if applicable)
4. **Approval** from project maintainers
5. **Merge** into the main branch

### Review Criteria

Reviewers will check for:

- Code quality and adherence to standards
- Test coverage and quality
- Documentation completeness
- Security considerations
- Performance implications
- Backward compatibility

## Coding Standards

### General Principles

Follow the guidelines outlined in [CODING_STANDARDS.md](./CODING_STANDARDS.md):

- Use TypeScript with strict type checking
- Follow SOLID principles
- Write clean, readable code
- Use meaningful variable and function names
- Keep functions small and focused

### Code Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use single quotes for strings
- Include trailing commas in multi-line structures
- Use 2 spaces for indentation

### Architecture Guidelines

- Follow NestJS best practices
- Use dependency injection properly
- Implement proper error handling
- Use DTOs for data validation
- Follow RESTful API conventions

## Testing Requirements

### Test Coverage

- Maintain minimum 80% test coverage
- Write unit tests for all business logic
- Include integration tests for API endpoints
- Add end-to-end tests for critical user flows

### Testing Guidelines

```typescript
// Example unit test structure
describe('UserService', () => {
  let service: UserService;
  let repository: Repository<UserEntity>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Test implementation
    });

    it('should throw error when email already exists', async () => {
      // Test implementation
    });
  });
});
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov

# Run end-to-end tests
yarn test:e2e
```

## Documentation Guidelines

### Code Documentation

- Use JSDoc comments for public methods
- Document complex business logic
- Include examples in documentation
- Keep documentation up to date with code changes

### API Documentation

- Use Swagger decorators for all endpoints
- Include request/response examples
- Document error responses
- Provide clear descriptions for parameters

### README Updates

When adding new features:

- Update installation instructions if needed
- Add new environment variables to documentation
- Update API endpoint documentation
- Include usage examples

## Issue Reporting

### Bug Reports

When reporting bugs, include:

```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Node.js version:
- yarn version:
- PostgreSQL version:
- Operating System:

## Additional Context
Any other relevant information
```

### Feature Requests

When requesting features, include:

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches you've considered

## Additional Context
Any other relevant information
```

### Issue Labels

Use appropriate labels:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `priority:high`: High priority issue
- `priority:low`: Low priority issue

## Security Vulnerabilities

### Reporting Security Issues

**Do not report security vulnerabilities through public GitHub issues.**

Instead:

1. Email security concerns to: [security@example.com]
2. Include detailed information about the vulnerability
3. Provide steps to reproduce if possible
4. Allow time for the issue to be addressed before public disclosure

### Security Best Practices

When contributing:

- Never commit secrets or credentials
- Use environment variables for sensitive configuration
- Validate all user inputs
- Follow OWASP security guidelines
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization

## Community Guidelines

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Requests**: Code review and collaboration

### Getting Help

If you need help:

1. Check existing documentation
2. Search through GitHub issues
3. Ask questions in GitHub Discussions
4. Reach out to maintainers

### Recognition

Contributors will be recognized:

- In the project's README
- In release notes for significant contributions
- Through GitHub's contributor statistics

## Development Best Practices

### Database Changes

When making database changes:

1. **Create migrations** for schema changes
2. **Test migrations** on sample data
3. **Provide rollback scripts** when possible
4. **Document breaking changes** clearly

### API Changes

When modifying APIs:

1. **Maintain backward compatibility** when possible
2. **Version APIs** for breaking changes
3. **Update Swagger documentation**
4. **Notify users** of deprecations

### Performance Considerations

- **Profile code** for performance bottlenecks
- **Optimize database queries**
- **Use appropriate caching strategies**
- **Monitor memory usage**

### Error Handling

- **Use appropriate HTTP status codes**
- **Provide meaningful error messages**
- **Log errors appropriately**
- **Handle edge cases gracefully**

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

Before releasing:

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Migration scripts tested
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Backward compatibility verified

## Questions?

If you have questions about contributing:

1. Check this document first
2. Look through existing issues and discussions
3. Create a new discussion for general questions
4. Contact maintainers directly for urgent matters

Thank you for contributing to the Bank Server project! Your contributions help make this project better for everyone.
