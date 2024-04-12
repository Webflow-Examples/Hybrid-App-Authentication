# Designer Extension Starter: React

Explore the [documentation](https://docs.developers.webflow.com/v2.0.0/docs/create-a-designer-extensions) for detailed information on Designer Extension features and API.

## Local Development

```bash
npm run dev
```

This command installs dependencies, watches for changes in the `src/` folder, and serves your extension files from `./dist/`. Use the displayed URL as the "Development URL" in Webflow Designer's Apps panel to launch your extension.

## Build for Distribution

```bash
npm run build
```

This command prepares a `${bundleFile}` in the `./dist/` folder. Upload this `bundle.zip` file for distributing the App inside of your workspace or via the Marketplace.