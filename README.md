# 🇫🇷 ImmerseFrançais - Chrome Extension for French Learning

An innovative Chrome extension for learning French vocabulary immersively while browsing the web. Automatically detects, highlights, and translates French words with AI-powered assistance.

## ✨ Features

### 🎯 Smart Word Detection & Highlighting
- **Automatic French word detection** on any webpage
- **Visual highlighting** with different colors for saved/unsaved words
- **Real-time DOM observation** for dynamic content updates
- **Intelligent filtering** to exclude common words and focus on learning vocabulary

### 🤖 AI-Powered Translation (Google Gemini API)
- **Complete word analysis** including:
  - English translation
  - Example sentences in French
  - Word type (noun, verb, adjective, etc.)
  - Language register (formal, informal, etc.)
  - Etymology and frequency information
  - Contextual tags
- **Smart caching** to avoid redundant API calls
- **Error handling** with fallback options

### 💾 Personal Vocabulary Management
- **Save words** with personal notes and translations
- **Priority system** with 5-star rating
- **Quick tooltip preview** for saved words on hover
- **Export/Import** functionality for backup and sharing
- **Cross-tab synchronization** of saved vocabulary

### 🎵 Interactive Learning Features
- **Audio pronunciation** using Web Speech API
- **Detailed modal interface** for in-depth word study
- **Smart positioning** to avoid screen edges
- **Keyboard shortcuts** (Ctrl+Enter to save, Escape to close)

### ⚡ Performance & UX
- **Floating activation button** with visual feedback
- **Optimized processing** for large pages with batch operations
- **Anti-flicker protection** during DOM updates
- **Responsive design** that adapts to screen size
- **Global state management** across all browser tabs

## 🚀 Installation

### Method 1: Developer Mode (Recommended for testing)
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension_de_apprendre_le_francais` folder

### Method 2: Install from Chrome Web Store
*Coming soon...*

## ⚙️ Configuration

### 1. Get Your Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the generated key

### 2. Configure the Extension
1. Click the extension icon in your browser toolbar
2. Click "⚙️ Configuration" 
3. Paste your API key in the configuration field
4. Click "Save and Test Connection"
5. Wait for the green confirmation message

## 📱 How to Use

### Basic Usage
1. **Activate the extension**: Click the floating 🇫🇷 button on any webpage
2. **Browse French content**: Visit any French website (news, blogs, etc.)
3. **Interact with words**: 
   - **Click** any highlighted word to open the translation modal
   - **Hover** over saved words to see your notes
4. **Save vocabulary**: Add personal notes and set priority levels

### Advanced Features
- **Global activation**: Use the popup to enable/disable across all tabs
- **Export your data**: Use the options page to backup your vocabulary
- **Keyboard shortcuts**: 
  - `Ctrl+Enter` in note field to save quickly
  - `Escape` to close modals
- **Audio pronunciation**: Click the 🔊 button in word modals

## 🔧 Technical Details

### Architecture
```
├── manifest.json          # Extension configuration (Manifest V3)
├── content.js             # Main content script (DOM manipulation, UI)
├── background.js          # Service worker (API calls, storage)
├── popup.html/js          # Extension popup interface
├── options.html/js        # Configuration page
├── style.css              # Comprehensive styling
└── icons/                 # Extension icons (16x16 to 128x128)
```

### Key Technologies
- **Manifest V3** for modern Chrome extension architecture
- **Google Gemini API** for AI-powered translations and analysis
- **Chrome Storage API** for persistent data with sync across devices
- **Web Speech API** for pronunciation features
- **Mutation Observer** for dynamic content detection
- **CSS Grid/Flexbox** for responsive modal design

### Permissions Required
- `storage` - Save vocabulary and settings
- `activeTab` - Access current tab content
- `scripting` - Inject content scripts
- `host_permissions` - Access web pages for word detection

## 🧪 Testing

### Recommended Test Sites
- **News**: lemonde.fr, lefigaro.fr
- **Blogs**: French WordPress sites
- **Social**: French forums, comment sections
- **Educational**: French learning websites

### Test Scenarios
1. **Word Detection**: Verify French words are highlighted correctly
2. **API Integration**: Check translations and linguistic data
3. **Save/Load**: Test vocabulary persistence across sessions
4. **Performance**: Test on text-heavy pages
5. **Cross-tab Sync**: Verify state synchronization between tabs

## 🆘 Support

### Common Issues
1. **Words not highlighting**: Check if extension is activated (blue flag button)
2. **No translations**: Verify Gemini API key is configured correctly
3. **Performance issues**: Try refreshing the page or disabling on heavy sites

### Debug Mode
Open Chrome DevTools Console and run:
```javascript
// Test word analysis
window.immerseTestAnalysis();

// Check storage stats
window.immerseFrancaisUtils.testGlobalStorage();

// View saved words count
console.log('Saved words:', window.immerseFrancaisUtils.getSavedWordsCount());
```



---

**Built with ❤️ for French language learners**

*Transform your web browsing into an immersive French learning experience!* 