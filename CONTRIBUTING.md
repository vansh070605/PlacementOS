# Contributing to PlacementOS

First off, thank you for considering contributing to PlacementOS! It's people like you that make PlacementOS a great tool for students worldwide. We welcome contributions of all kinds: bug fixes, new features, documentation improvements, and design tweaks.

## 🌟 Welcome Message
We aim to make contributing to this project as easy and transparent as possible. Whether you're a seasoned open-source contributor or a first-timer, we're glad you're here. This document outlines the process for contributing to PlacementOS.

## 🔄 Development Workflow

### 1. Forking Instructions
1. Navigate to the [PlacementOS repository](https://github.com/vansh070605/PlacementOS).
2. Click the **Fork** button in the top-right corner to create a copy of the repository in your own GitHub account.
3. Clone your forked repository to your local machine:
   ```bash
   git clone https://github.com/<your-username>/PlacementOS.git
   cd PlacementOS
   ```
4. Add the original repository as an upstream remote:
   ```bash
   git remote add upstream https://github.com/vansh070605/PlacementOS.git
   ```

### 2. Branch Naming Rules
Always create a new branch for your work. Never commit directly to the `main` branch.
Use the following prefixes for your branch names:
- `feature/` - for new features (e.g., `feature/ai-resume-parser`)
- `fix/` - for bug fixes (e.g., `fix/login-crash`)
- `docs/` - for documentation updates (e.g., `docs/api-readme`)
- `chore/` - for maintenance tasks, dependencies, etc. (e.g., `chore/update-react`)

```bash
git checkout -b feature/your-feature-name
```

## 💻 Coding Standards

To ensure consistency across the codebase, please adhere to the following:
- **JavaScript/Node.js:** We use ESLint and Prettier. Please ensure your code passes linting checks before committing.
- **React:** Use functional components and Hooks. Avoid class components.
- **CSS:** Use modular CSS or standard naming conventions (BEM) if writing vanilla CSS.
- **Comments:** Comment your code clearly, especially for complex logic or API integrations.

## 📝 Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
Format: `<type>(<scope>): <subject>`

**Examples:**
- `feat(auth): add JWT expiration handling`
- `fix(dashboard): resolve chart rendering glitch`
- `docs(readme): update installation instructions`
- `style(ui): fix button alignment on mobile`

## 🚀 Pull Request Guidelines

1. **Keep it focused:** A Pull Request should aim to resolve one issue or add one feature. Don't bundle unrelated changes.
2. **Update upstream:** Before submitting a PR, ensure your branch is up to date with the upstream `main` branch.
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
3. **Fill the Template:** Use the provided Pull Request template and fill out all required sections.
4. **Include Screenshots:** If your PR introduces UI changes, include before/after screenshots.

## 👀 Review Process

- Once you open a PR, automated CI checks (linting, tests) will run. Ensure all checks pass.
- A maintainer will review your code. They may request changes or ask clarifying questions.
- Please respond to feedback promptly and update your branch. Pushing to your branch will automatically update the PR.
- Once approved, a maintainer will merge your PR.

## 📚 Documentation Standards

- If you add a new API endpoint, update the Swagger docs/API Overview in `README.md`.
- If you change setup requirements, update the Installation section.
- Ensure your markdown is properly formatted.

## 🧪 Testing Requirements

- Write unit tests for critical utility functions and components using Jest/React Testing Library.
- Ensure your changes do not break existing tests.
- Run `npm test` locally before committing.

## 🐛 Issue Reporting Process

Found a bug? 
1. Check if the bug has already been reported in the Issues tab.
2. If not, open a new issue using the **Bug Report** template.
3. Provide as much context as possible, including steps to reproduce, expected behavior, and environment details.

## 💡 Feature Request Process

Have an idea to improve PlacementOS?
1. Open a new issue using the **Feature Request** template.
2. Clearly describe the problem your feature solves and propose a solution.
3. We will discuss the proposal with you to determine if it fits the project roadmap.

Thank you for contributing! Let's build something amazing together. 🚀
