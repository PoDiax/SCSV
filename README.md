# Steam Collection Size Viewer (SCSV)

![SCSV Logo](https://github.com/PoDiax/SCSV/blob/main/icon.png?raw=true)

Steam Collection Size Viewer is a browser extension that enhances your Steam Workshop experience by allowing you to easily view the total size of any collection with just a click of a button. It supports both **Chrome** and **Firefox**.

## Features

* **Instant Collection Size**: Quickly check the total size of any Steam Workshop collection.
* **Like All**: Quickly like all items in the collection with the click of a button.
* **Unit Toggle**: Switch between MB and GB for size display.
* **Advanced Collection Manager**: A custom, intuitive UI injected directly into Steam for adding items to your collections.
* **Collection Highlighting**: Items you already have in a collection are highlighted in green while browsing the workshop, with a badge showing exactly which collections they belong to.
* **Quick Add**: A convenient "+ Add" button is injected onto every workshop item card while browsing, allowing you to instantly pop open the collection manager without leaving the page.
* **Background Syncing**: Automatically caches your collections in the background so SCSV is always up to date.
* **Clear Liked Items**: Reset your liked addons cache.
* **User-Friendly Interface**: Streamlined design with a Steam-inspired theme.
* **Cross-Browser Support**: Works on both Chrome and Firefox browsers.

## Installation

### Chrome

You can install SCSV directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/cdcfacnigofkflfapbbbpjjipgipnoma).

### Firefox

You can install SCSV directly from the [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/steam-collection-size-viewer/) page.

## Build Instructions

These step-by-step instructions are provided to build an exact copy of the add-on code from source.

### Requirements

* **Operating System**: Windows, macOS, or Linux
* **Build Environment**: Node.js and npm (or yarn)
* **Node.js version**: v18.0.0 or higher
* **npm version**: v8.0.0 or higher (included with Node.js)

### Installation Instructions for Prerequisites

1. Download and install Node.js (which includes npm) from the official website: [https://nodejs.org/](https://nodejs.org/)
2. Verify the installation by opening a terminal or command prompt and running:
   ```bash
   node -v
   npm -v
   ```

### Build Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/PoDiax/SCSV.git
   cd SCSV
   ```
2. Open a terminal or command prompt and navigate to the root directory of the source code.
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Execute the build process:
   ```bash
   npm run build
   ```

5. Load the compiled extension in your browser:
   * **Chrome**: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the `dist/chrome` folder.
   * **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select the `manifest.json` file inside the `dist/firefox` folder.

## Usage

1. Navigate to a Steam Workshop collection page.
2. Click on the extension icon or the "Calculate Size" button.
3. Retrieve the total size of the entire collection or like all items.

## Screenshots

![SCSV in Action](https://lh3.googleusercontent.com/AX5WOtPFYaTJix-_9jWjS1w-NJeV7p6QAwGCURf3q11h56M-CDJquntEaRSQUaa9FffQHbECOVvYBDq6tkcWtD9Z=s1280-w1280-h800)

## Contributing

If you'd like to contribute to SCSV, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and submit a pull request.

## Issues

If you encounter any issues or have suggestions, please [create an issue](https://github.com/PoDiax/SCSV/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/PoDiax/SCSV/blob/main/LICENSE) file for details.