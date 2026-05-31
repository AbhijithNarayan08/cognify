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
> Always store strings in the localized CSV catalog rather than hardcoding them in component files.

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
3. **Configure Translation Strings**:
   Before launching the app, you *must* compile the translation catalog from the master CSV:
   ```bash
   npm run strings
   ```
4. **Run the Development Server**:
   Start the Expo packager:
   ```bash
   npm run start
   ```
   * Press `w` to run on web.
   * Press `a` to open in Android Emulator.
   * Press `i` to open in iOS Simulator.

---

## 3. Localization Workflow (`strings.csv`)

We use a central localization file to manage all user-facing text.

* **Source File**: `src/constants/strings.csv`
* **Generated Catalog**: `src/constants/stringsData.js`

**Rules for Editing Strings**:
1. Open [strings.csv](file:///Users/abhijith.narayan/Downloads/cognify/src/constants/strings.csv) and add or modify keys.
2. **Handle Commas Safely**: If your text contains a comma (`,`), you **must** wrap the entire value in double quotes to prevent the CSV parser from splitting the row incorrectly.
   * *Correct*: `profile.logoutConfirm.confirm,"Yes, Log Out",profile`
   * *Incorrect*: `profile.logoutConfirm.confirm,Yes, Log Out,profile`
3. Always run the compiler script after making changes to the CSV:
   ```bash
   npm run strings
   ```
4. Never edit `stringsData.js` directly, as it will be overwritten.

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
   npm run strings
   npx expo export -p web
   ```
2. Create a pull request to `main`.
3. Fill out the **Pull Request Template** completely.
4. Ensure your PR passes all automated status checks (Linting & Web Bundling tests).
5. Address any reviewer feedback promptly. Once approved, your PR will be merged into `main`!

Thank you for contributing to Cognify! Happy coding! 🧠✨
