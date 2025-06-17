### PROMPT V2 (Mise à Jour)

**Titre du Projet :** ImmerseFrançais - Extension d'Apprentissage du Français

**Rôle de l'IA :** Agis en tant qu'ingénieur logiciel expert, spécialisé dans le développement d'extensions Chrome. Ton objectif est de créer les spécifications fonctionnelles et techniques détaillées, ainsi que la structure du code, pour une extension Chrome d'apprentissage immersif du français.

**Concept Principal :**
L'extension permet aux utilisateurs d'apprendre le vocabulaire français en naviguant sur n'importe quel site web. L'utilisateur active un "mode apprentissage" qui rend les mots de la page cliquables. En cliquant sur un mot, il obtient via l'API Gemini sa traduction et une phrase d'exemple. L'utilisateur peut ensuite sauvegarder sa propre définition. Les mots sauvegardés sont stockés de manière **globale** et seront automatiquement mis en évidence sur **tous les sites web** que l'utilisateur visitera par la suite.

---

**Fonctionnalités Clés (Cahier des Charges) :**

**1. Activation et Désactivation de l'Extension :**
*   **Bouton Flottant :** Un bouton d'activation/désactivation (toggle switch) doit être visible en permanence dans le coin inférieur droit de la page web.
*   **État Visuel :** Le bouton indique clairement si l'extension est active (ex: icône bleue) ou inactive (ex: icône grise).
*   **Action :** Le clic sur ce bouton active/désactive le "mode apprentissage" sur la page actuelle.

**2. Mode Apprentissage (Quand l'extension est active) :**
*   **Analyse de la Page :** L'extension doit analyser le texte de la page pour identifier les mots.
*   **Surlignage Interactif :**
    *   Les mots **non sauvegardés** sont surlignés avec un filtre discret (ex: fond bleu très clair).
    *   Les mots **déjà sauvegardés** par l'utilisateur sont surlignés avec une couleur distincte (ex: fond vert clair).
*   **Performance :** L'analyse et la modification du DOM doivent être optimisées pour ne pas ralentir la navigation.

**3. Interaction avec un Mot (Clic) :**
*   **Fenêtre Modale (Popup) :** Lorsqu'un utilisateur clique sur un mot surligné (bleu ou vert), une petite fenêtre modale apparaît.
*   **Contenu de la Fenêtre Modale :**
    *   **Le mot cliqué :** Affiché en grand.
    *   **Traduction (via Gemini) :** La traduction du mot en anglais, obtenue via l'API Gemini.
    *   **Phrase d'Exemple (via Gemini) :** Une phrase en français utilisant ce mot, générée par l'API Gemini.
    *   **Champ de Saisie Utilisateur :** Une zone de texte intitulée "Ma traduction ou mes notes" où l'utilisateur peut écrire sa propre définition. Si le mot a déjà été sauvegardé, ce champ doit afficher la note existante.
    *   **Bouton "Sauvegarder" / "Mettre à jour" :** Un bouton pour enregistrer le mot et la note de l'utilisateur.

**4. Sauvegarde et Portée Globale des Mots :**
*   **Stockage Global :** Les mots et les notes de l'utilisateur doivent être stockés dans `chrome.storage.sync` pour être disponibles sur tous les navigateurs Chrome où l'utilisateur est connecté, ou dans `chrome.storage.local` pour un stockage unique au navigateur. Le stockage est **global** et non limité à un site web.
*   **Changement de Couleur :** Quand un mot est sauvegardé, sa couleur de surlignage sur la page passe de bleu à vert.
*   **Synchronisation Automatique :** Lorsqu'une nouvelle page est chargée (sur n'importe quel site), l'extension doit immédiatement scanner le contenu et surligner en vert tous les mots qui existent déjà dans la liste globale des mots sauvegardés par l'utilisateur.

**5. Consultation Rapide des Mots Sauvegardés (Survol) :**
*   **Info-bulle (Tooltip) :** Quand l'utilisateur place son curseur (hover) sur un mot déjà sauvegardé (un mot vert), une petite boîte d'information (tooltip) apparaît instantanément.
*   **Contenu de l'Info-bulle :** Cette boîte affiche **uniquement** la traduction ou la note que l'utilisateur a personnellement sauvegardée.

---

**Scénario d'Utilisation (User Flow) :**

1.  L'utilisateur installe l'extension et configure sa clé API Gemini si nécessaire.
2.  Il visite `lemonde.fr` et active l'extension. Tous les mots deviennent bleus.
3.  Il clique sur le mot **"ordinateur"**.
4.  Une popup s'ouvre avec la traduction et l'exemple fournis par Gemini.
5.  Dans le champ de saisie, il écrit : *"The machine on my desk"*. Il clique sur "Sauvegarder".
6.  Tous les mots "ordinateur" sur la page `lemonde.fr` deviennent verts.
7.  Il visite ensuite un autre site, `lefigaro.fr`.
8.  L'extension s'exécute automatiquement. Le mot **"ordinateur"** sur cette nouvelle page est **déjà affiché en vert**, car il a été sauvegardé globalement.
9.  En passant sa souris sur le mot vert "ordinateur", une bulle apparaît avec son texte : *"The machine on my desk"*.

---

**Spécifications Techniques Requises :**

*   **Langages :** HTML, CSS, JavaScript.
*   **APIs Chrome :** `chrome.storage.sync` (préféré pour la synchronisation) ou `chrome.storage.local`, `content_scripts`, `background.js` (pour gérer les appels API), `runtime`.
*   **Intégration de l'API Gemini :**
    *   **Rôle :** L'API Gemini sera utilisée pour la traduction et la génération de phrases d'exemple.
    *   **Appel API :** La communication avec l'API Gemini doit se faire depuis le script d'arrière-plan (`background.js`) pour protéger la clé API.
    *   **Format de la Requête (Prompt pour Gemini) :** Pour obtenir une réponse structurée, la requête à Gemini doit être formulée ainsi :
        ```
        Étant donné le mot français suivant, fournis une réponse au format JSON contenant deux clés :
        1. "translation_en": la traduction anglaise la plus courante du mot.
        2. "example_fr": une phrase d'exemple simple et claire en français qui utilise ce mot.

        Mot : "{word_to_translate}"

        Réponse attendue au format JSON uniquement.
        ```
*   **Structure du Projet :**
    *   `manifest.json`
    *   `content.js` (pour manipuler le DOM de la page)
    *   `background.js` (pour gérer le stockage et les appels à l'API Gemini)
    *   `style.css` (pour le style du bouton, des surlignages et de la popup)
    *   `options.html` (une page d'options où l'utilisateur pourra entrer sa clé API Gemini).