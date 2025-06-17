# 🇫🇷 ImmerseFrançais - Extension Chrome d'Apprentissage du Français

Une extension Chrome innovante pour apprendre le vocabulaire français de manière immersive en naviguant sur le web.

## 📋 Statut du Développement

### ✅ Phase 2 Terminée : Interface Utilisateur de Base

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

### 3. Utilisation (Phase 2)

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

## 🎯 Phases de Développement

### ✅ Phase 1: Configuration de Base et Architecture
- Structure du projet
- Manifest.json avec permissions
- Fichiers de base créés

### ✅ Phase 2: Interface Utilisateur de Base
- **Bouton flottant d'activation/désactivation**
- **Page d'options pour la clé API Gemini**
- **Popup avec statistiques et contrôles**
- Gestion de l'état par onglet/domaine

### 🔄 Phase 3: Analyse et Surlignage du Texte (À venir)
- Détection et surlignage des mots français
- Distinction mots sauvegardés/non sauvegardés

### 🔄 Phase 4: Intégration API Gemini (À venir)
- Appels API pour traduction et exemples
- Gestion du cache et des erreurs

### 🔄 Phase 5: Fenêtre Modale d'Interaction (À venir)
- Modal de traduction au clic sur un mot
- Sauvegarde des notes personnelles

## 🧪 Test de la Phase 2

Pour vérifier que la Phase 2 fonctionne correctement :

1. **Test du bouton flottant** :
   - Le bouton 🇫🇷 apparaît en bas à droite
   - Il change de couleur (gris → bleu) quand activé
   - L'état est sauvegardé par domaine

2. **Test de la page d'options** :
   - Accessible via le popup ou `chrome://extensions/`
   - Permet de sauvegarder une clé API
   - Test de connexion fonctionnel

3. **Test du popup** :
   - Affiche les statistiques correctes
   - Permet d'activer/désactiver par onglet
   - Synchronisation avec le bouton flottant

## 📝 Notes Techniques

- **Stockage** : `chrome.storage.sync` pour les données globales, `chrome.storage.local` pour l'état des onglets
- **Communication** : Messages entre content script, popup et background
- **Permissions** : `storage`, `activeTab`, `scripting`, `host_permissions`
- **Compatibilité** : Manifest V3, Chrome moderne

## 🔜 Prochaines Étapes

La Phase 3 implémentera :
- Analyse automatique du texte des pages web
- Surlignage interactif des mots français
- Performance optimisée pour les grandes pages

---

**Développé avec ❤️ pour l'apprentissage du français** 