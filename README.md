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
#### Fonctionnalités Implémentées :
- **Bouton flottant d'activation** : Visible en bas à droite de chaque page
  - États visuels : bleu (actif) / gris (inactif)
  - Sauvegarde de l'état par domaine
  - Animation au survol
- **Page d'options complète** : Configuration de la clé API Gemini
  - Interface moderne et intuitive
  - Test de connexion à l'API
  - Sauvegarde sécurisée des paramètres
- **Popup de l'extension** : Interface de contrôle et statistiques
  - Affichage du statut d'activation
  - Compteur de mots sauvegardés
  - Statut de la configuration API
  - Activation/désactivation par onglet

## 🚀 Installation et Test

### 1. Installation en Mode Développeur

1. Ouvrez Chrome et accédez à `chrome://extensions/`
2. Activez le "Mode développeur" (en haut à droite)
3. Cliquez sur "Charger l'extension non empaquetée"
4. Sélectionnez le dossier du projet `extension_de_apprendre_le_francais`

### 2. Configuration

1. **Configurer la clé API Gemini** :
   - Cliquez sur l'icône de l'extension dans la barre d'outils
   - Cliquez sur "⚙️ Configuration"
   - Suivez les instructions pour obtenir votre clé API Gemini
   - Entrez la clé et cliquez sur "Sauvegarder"
   - Testez la connexion avec le bouton "Tester la connexion"

### 3. Utilisation

1. **Activer l'extension** :
   - Visitez n'importe quel site web (ex: lemonde.fr)
   - Cherchez le bouton flottant 🇫🇷 en bas à droite
   - Cliquez dessus pour l'activer (il devient bleu)

2. **Contrôler depuis le popup** :
   - Cliquez sur l'icône de l'extension dans la barre d'outils
   - Voyez les statistiques et le statut
   - Activez/désactivez l'extension pour la page actuelle

## 🔧 Structure du Projet

```
extension_de_apprendre_le_francais/
├── manifest.json          # Configuration de l'extension
├── content.js             # Script d'injection (bouton flottant)
├── background.js          # Service worker (API, stockage)
├── popup.html/js          # Interface popup
├── options.html/js        # Page de configuration
├── style.css              # Styles de l'interface
└── icons/                 # Icônes de l'extension
```



## 📝 Notes Techniques

- **Stockage** : `chrome.storage.sync` pour les données globales, `chrome.storage.local` pour l'état des onglets
- **Communication** : Messages entre content script, popup et background
- **Permissions** : `storage`, `activeTab`, `scripting`, `host_permissions`
- **Compatibilité** : Manifest V3, Chrome moderne



---

**Développé avec ❤️ pour l'apprentissage du français** 