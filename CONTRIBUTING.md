# Contributing to Cognify

Welcome to **Cognify**! We are thrilled that you want to contribute to this cutting-edge cognitive training application. As a developer or designer on this project, your work helps shape a premium, high-fidelity experience that empowers users to improve their mental agility.

To maintain our rigorous design and architectural standards, please review these contribution guidelines before writing any code.

---

## 1. Architectural Principles & Casing Guardrails

Cognify is designed to look and feel extremely premium, featuring warm aesthetics, smooth micro-animations, and unified typography. One of our most important design policies is the **Title Case Constraint**:

> [!IMPORTANT]
> **DO NOT USE FORCED LOWERCASE STYLES!**
> Do not use `textTransform: 'lowercase'` or `textTransform: 'sentencecase'` anywhere in your stylesheets or inline styles. 
> 
> * **Section headers**: Must be Title Case directly in their localized strings (e.g. `"Quick Check-In"`, `"Your Domains"`, `"Insight"`, `"Weekly Brief"`).
> * **Button labels**: Must be Title Case (e.g. `"Start Session"`, `"Read Now"`, `"Skip"`, `"Collapse"`, `"Play Again"`, `"Done"`).
> * **Navigation tab labels**: Must be Title Case (e.g. `"Home"`, `"Train"`, `"Insights"`, `"Profile"`).
> 
> Always store strings in the localization JSON bundle (`src/constants/translations/en.json`) rather than hardcoding them in component files.

---

## 2. Setting Up Your Development Environment

Ensure you have **Node.js (v18 or v20)** and **npm** installed.

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/AbhijithNarayan08/cognify.git
   cd cognify
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run the Development Server**:
   Start the Expo packager:
   ```bash
   npm run start
   ```
   * Press `w` to run on web.
   * Press `a` to open in Android Emulator.
   * Press `i` to open in iOS Simulator.

---

## 3. Localization Workflow (`en.json`)

We use a central JSON file to manage all user-facing text.

* **Translation File**: `src/constants/translations/en.json`

**Rules for Editing Strings**:
1. Open [en.json](file:///Users/abhijith.narayan/Downloads/cognify/src/constants/translations/en.json) and add or modify translation keys using flat key names.
2. Ensure you use proper JSON escaping (e.g. quote double-quotes like `\"`).
3. Make sure all interpolation variables are enclosed in double curly braces, e.g. `{{count}}`.
4. No compilation step is required; the translation engine automatically loads changes on startup/reload.

---

## 4. Branching & Commit Guidelines

We use a structured branch naming convention and follow [Conventional Commits](https://www.conventionalcommits.org/):

* **Branch Naming**:
  * Feature additions: `feat/feature-name`
  * Bug fixes: `fix/bug-description`
  * Documentation or refactoring: `docs/short-desc` or `refactor/short-desc`
* **Commit Messages**:
  * `feat(attention): implement custom results delta timeline`
  * `fix(onboarding): remove textTransform lowercase from Welcome Screen debug skip`
  * `chore: rebuild strings catalogs`

---

## 5. Submitting a Pull Request (PR)

1. Make sure your local copy builds perfectly:
   ```bash
   npx expo export -p web
   ```
2. Create a pull request to `main`.
3. Fill out the **Pull Request Template** completely.
4. Ensure your PR passes all automated status checks (Linting & Web Bundling tests).
5. Address any reviewer feedback promptly. Once approved, your PR will be merged into `main`!

Thank you for contributing to Cognify! Happy coding! 🧠✨
