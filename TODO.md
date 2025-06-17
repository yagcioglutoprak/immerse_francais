# TODO - ImmerseFrançais Extension Chrome

## 📋 Phase 1: Configuration de Base et Architecture

### Structure du Projet
- [ ] Créer la structure de dossiers du projet
- [ ] Initialiser le fichier `manifest.json` avec les permissions nécessaires
  - [ ] Permissions: `storage`, `activeTab`, `scripting`, `host_permissions`
  - [ ] Définir les content scripts et background scripts
- [ ] Créer les fichiers de base:
  - [ ] `content.js` - Script d'injection dans les pages web
  - [ ] `background.js` - Service worker pour l'API et stockage
  - [ ] `style.css` - Styles pour l'interface
  - [ ] `options.html` - Page de configuration
  - [ ] `options.js` - Script pour la page d'options
  - [ ] `popup.html` - Interface du popup de l'extension
  - [ ] `popup.js` - Script du popup

## 📋 Phase 2: Interface Utilisateur de Base

### Bouton Flottant d'Activation
- [ ] Créer le bouton toggle flottant dans le coin inférieur droit
- [ ] Implémenter les états visuels (actif/inactif)
  - [ ] Icône bleue pour l'état actif
  - [ ] Icône grise pour l'état inactif
- [ ] Gérer la position fixe du bouton (CSS)
- [ ] Ajouter l'événement de clic pour activer/désactiver l'extension
- [ ] Sauvegarder l'état d'activation par onglet

### Page d'Options
- [ ] Créer l'interface `options.html`
  - [ ] Champ de saisie pour la clé API Gemini
  - [ ] Bouton de sauvegarde
  - [ ] Instructions d'utilisation
- [ ] Implémenter `options.js`
  - [ ] Sauvegarde de la clé API dans `chrome.storage.sync`
  - [ ] Chargement de la clé API existante
  - [ ] Validation de base de la clé API

## X Phase 3: Analyse et Surlignage du Texte

### Détection des Mots
- [ ] Implémenter l'analyse du DOM pour identifier les mots
  - [ ] Exclure les balises script, style, etc.
  - [ ] Utiliser une regex pour détecter les mots français
  - [ ] Gérer les mots avec accents et caractères spéciaux
- [ ] Optimiser la performance pour les grandes pages
- [ ] Créer une fonction de nettoyage du surlignage

### Système de Surlignage
- [ ] Implémenter le surlignage des mots non sauvegardés (bleu clair)
- [ ] Implémenter le surlignage des mots sauvegardés (vert clair)
- [ ] Créer des classes CSS pour les différents états
- [ ] Gérer la mise à jour dynamique des couleurs
- [ ] Éviter les conflits avec les styles existants de la page

## ✅ Phase 4: Intégration API Gemini

### Configuration API
- [x] Implémenter la gestion sécurisée de la clé API dans `background.js`
- [x] Créer la fonction d'appel à l'API Gemini
- [x] Formater le prompt selon les spécifications:
  ```
  Étant donné le mot français suivant, fournis une réponse au format JSON contenant deux clés :
  1. "translation_en": la traduction anglaise la plus courante du mot.
  2. "example_fr": une phrase d'exemple simple et claire en français qui utilise ce mot.
  Mot : "{word_to_translate}"
  Réponse attendue au format JSON uniquement.
  ```

### Gestion des Réponses
- [x] Parser la réponse JSON de l'API Gemini
- [x] Implémenter la gestion d'erreur pour les appels API
- [x] Ajouter un système de cache pour éviter les appels répétés
- [x] Gérer les cas de mots non trouvés ou erreurs de traduction

## ✅ Phase 5: Fenêtre Modale d'Interaction

### Interface de la Modal
- [x] Créer la structure HTML de la fenêtre modale
- [x] Styliser la modal (CSS) - design moderne et responsive
- [x] Implémenter l'ouverture/fermeture de la modal au clic sur un mot
- [x] Positionner la modal près du mot cliqué (centré sur l'écran)

### Contenu de la Modal
- [x] Afficher le mot cliqué en grand
- [x] Afficher la traduction obtenue via Gemini
- [x] Afficher la phrase d'exemple générée par Gemini
- [x] Créer le champ "Ma traduction ou mes notes"
- [x] Implémenter le bouton "Sauvegarder" / "Mettre à jour"

### Fonctionnalités de la Modal
- [x] Pré-remplir le champ avec la note existante si le mot est déjà sauvegardé
- [x] Gérer la fermeture par clic à l'extérieur ou touche Échap
- [x] Ajouter un indicateur de chargement pendant l'appel API
- [x] Gérer les états d'erreur dans l'interface

## ✅ Phase 6: Système de Stockage Global

### Stockage des Mots
- [x] Implémenter la sauvegarde dans `chrome.storage.sync`
- [x] Créer la structure de données pour les mots sauvegardés
  ```javascript
  {
    "mot": {
      "userNote": "note personnelle",
      "translation": "traduction Gemini", 
      "example": "phrase d'exemple",
      "dateAdded": "timestamp",
      "dateModified": "timestamp",
      "frequency": 1,
      "originalWord": "Mot avec casse originale"
    }
  }
  ```
- [x] Implémenter les fonctions CRUD pour les mots sauvegardés
- [x] Gérer la synchronisation entre différents appareils
- [x] Ajouter la gestion des erreurs de quota de stockage
- [x] Implémenter les fonctions d'export/import des données

### Portée Globale
- [x] Implémenter la détection automatique des mots sauvegardés sur toutes les pages
- [x] Mettre à jour les couleurs de surlignage après sauvegarde
- [x] Optimiser le chargement des mots sauvegardés au chargement de page
- [x] Gérer la synchronisation en temps réel entre onglets
- [x] Implémenter la suppression de mots avec synchronisation
- [x] Ajouter les statistiques de stockage (taille, fréquence, mots récents)

## ✅ Phase 7: Système de Tooltip (Info-bulle)

### Interface Tooltip
- [x] Créer la structure HTML du tooltip
- [x] Styliser le tooltip (CSS) - design discret et élégant
- [x] Implémenter l'affichage au survol des mots verts
- [x] Gérer le positionnement intelligent du tooltip

### Contenu et Comportement
- [x] Afficher uniquement la note personnelle de l'utilisateur
- [x] Implémenter le délai d'apparition/disparition
- [x] Gérer le cas où le tooltip sortirait de l'écran
- [x] Optimiser la performance pour éviter les ralentissements

## 📋 Phase 8: Tests et Optimisations

### Tests Fonctionnels
- [ ] Tester sur différents sites web (Le Monde, Le Figaro, etc.)
- [ ] Vérifier la performance sur les grandes pages
- [ ] Tester la synchronisation entre onglets/appareils
- [ ] Valider l'intégration API Gemini avec différents mots

### Optimisations
- [ ] Optimiser la détection de mots pour les performances
- [ ] Minimiser les appels API redondants
- [ ] Améliorer le temps de chargement de l'extension
- [ ] Réduire l'impact sur les performances de navigation

### Gestion d'Erreurs
- [ ] Implémenter la gestion d'erreur pour la clé API manquante/invalide
- [ ] Gérer les échecs de connexion à l'API Gemini
- [ ] Ajouter des messages d'erreur informatifs pour l'utilisateur
- [ ] Implémenter un mode dégradé sans API

## 📋 Phase 9: Finalisation et Déploiement

### Documentation
- [ ] Créer un README avec instructions d'installation
- [ ] Documenter la configuration de la clé API Gemini
- [ ] Ajouter des captures d'écran de démonstration
- [ ] Créer un guide d'utilisation

### Package pour Chrome Web Store
- [ ] Créer les icônes de l'extension (16x16, 48x48, 128x128)
- [ ] Finaliser le manifest.json pour la production
- [ ] Tester l'installation depuis un fichier .crx
- [ ] Préparer les assets pour le Chrome Web Store

### Tests Finaux
- [ ] Test complet du workflow utilisateur
- [ ] Validation sur différents navigateurs Chrome
- [ ] Test de la synchronisation entre appareils
- [ ] Vérification de la sécurité et des permissions

---

## 🎯 Critères de Réussite

- ✅ L'extension fonctionne sur tous les sites web
- ✅ Les mots sauvegardés sont synchronisés globalement
- ✅ L'interface est intuitive et non-intrusive
- ✅ Les performances de navigation ne sont pas affectées
- ✅ L'intégration API Gemini fonctionne correctement
- ✅ Le stockage persist entre les sessions

## 🔧 Technologies Utilisées

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Chrome APIs**: storage, scripting, runtime, activeTab
- **API Externe**: Google Gemini API
- **Stockage**: chrome.storage.sync / chrome.storage.local 