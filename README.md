# Steam Collection Size Viewer - Vue.js + TypeScript

A modern browser extension built with Vue.js + TypeScript + Vite that allows you to view Steam workshop collection sizes and like all items in a collection.

## ✨ Features

- **Calculate Collection Size**: Get the total size of Steam workshop collections
- **Like All Items**: Quickly like all items in a collection
- **Responsive Design**: Works on desktop and mobile browsers
- **Steam Theme**: Dark theme matching Steam's design language
- **Smooth Animations**: Beautiful transitions and loading states
- **Cross-Browser**: Works on Chrome, Firefox, and other Chromium-based browsers

## 🚀 Migration from Pure JS to Vue.js

This extension has been completely rewritten from pure JavaScript to Vue.js + TypeScript while maintaining all the original functionality:

### What's New
- ✅ **Vue 3 + TypeScript**: Modern reactive framework with type safety
- ✅ **Vite Build System**: Fast development and optimized production builds
- ✅ **Tailwind CSS**: Utility-first styling with Steam color scheme
- ✅ **Responsive Design**: Adaptive popup that works on all screen sizes
- ✅ **Smooth Animations**: Fade-in, slide-in, and loading animations
- ✅ **Better Error Handling**: Comprehensive error management
- ✅ **Modular Architecture**: Clean separation of concerns
- ✅ **TypeScript Types**: Full type safety across the codebase

### Maintained Features
- ✅ Size calculation for workshop collections
- ✅ "Like All" functionality for workshop items
- ✅ Unit toggle (MB/GB)
- ✅ Clear liked addons
- ✅ Steam session management
- ✅ Local storage management
- ✅ Chrome and Firefox compatibility

## 🛠️ Development

### Prerequisites
- Node.js 18+
- yarn or npm

### Installation
```bash
yarn install
```

### Development
```bash
# Build for both browsers
yarn build

# Build for Chrome only
yarn build:chrome

# Build for Firefox only
yarn build:firefox

# Watch mode for Chrome
yarn dev:chrome

# Watch mode for Firefox
yarn dev:firefox
```

### Project Structure
```
src/
├── ui/
│   └── popup/           # Vue.js popup interface
│       ├── App.vue      # Main popup component
│       ├── index.html   # Popup HTML
│       ├── index.ts     # Popup entry point
│       └── styles.css   # Popup styles
├── content-script/      # Content script for Steam pages
│   ├── index.ts         # Content script entry
│   ├── styles.css       # Injected styles
│   └── SteamCollectionAnalyzer.ts # Main analyzer class
├── background/          # Background script
│   └── index.ts         # Background script
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    ├── storage.ts      # Storage management
    ├── steamAPI.ts     # Steam API wrapper
    └── formatter.ts    # Data formatting
```

## 📦 Build Output

The build process creates two separate extension packages:

- `dist/chrome/` - Chrome extension (Manifest V3)
- `dist/firefox/` - Firefox extension (Manifest V3)
- `dist/chrome-1.1.3.zip` - Ready to upload to Chrome Web Store
- `dist/firefox-1.1.3.zip` - Ready to upload to Firefox Add-ons

## 🌟 Technical Highlights

### Vue.js Architecture
- **Composition API**: Modern Vue 3 patterns
- **Reactive State**: Automatic UI updates
- **TypeScript**: Full type safety
- **Single File Components**: Organized Vue components

### Modern Build System
- **Vite**: Lightning-fast development server
- **@crxjs/vite-plugin**: Web extension support
- **Tree Shaking**: Optimized bundle sizes
- **CSS Processing**: Tailwind CSS with PostCSS

### Cross-Browser Compatibility
- **Manifest V3**: Latest extension format
- **webextension-polyfill**: Consistent API across browsers
- **Responsive Design**: Works on all screen sizes

## 🎨 Design System

The extension uses a Steam-inspired color scheme:

- **Background**: `#171d25` (Steam Dark)
- **Primary**: `#7ea64b` (Steam Green)
- **Secondary**: `#b8f26d` (Steam Light Green)
- **Accent**: `#7593bd` (Steam Blue)
- **Text**: `#8ba6b6` (Steam Light Blue)

## 🔧 Configuration

### Tailwind CSS
Custom Steam color palette and animations defined in `tailwind.config.js`

### TypeScript
Strict type checking with custom types for Steam API responses

### Vite Plugins
- `@vitejs/plugin-vue`: Vue 3 support
- `@crxjs/vite-plugin`: Web extension bundling
- `vite-plugin-zip-pack`: Automatic zip creation

## 📱 Usage

1. **Install the extension** in your browser
2. **Navigate to a Steam workshop collection**
3. **Click "Calculate Size"** to see the total collection size
4. **Toggle MB/GB** in the popup to change units
5. **Use "Like All"** to like all items in the collection
6. **Clear liked addons** to reset the liked items cache

## 🤝 Contributing

Feel free to submit issues and feature requests!

## 📄 License

This project is licensed under the MIT License.