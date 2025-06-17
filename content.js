// ImmerseFrançais - Content Script
// Script d'injection dans les pages web pour l'analyse et le surlignage des mots

console.log('ImmerseFrançais: Content script chargé');

// Variables globales
let isExtensionActive = false;
let savedWords = {};
let floatingButton = null;
let modal = null;
let tooltip = null;
let domObserver = null;
let isModalOpen = false; // Nouvelle variable pour tracker l'état de la modal
let currentModalWord = null; // Mot actuellement affiché dans la modal
let currentTranslationRequest = null; // Requête de traduction en cours
let backgroundTheme = 'auto'; // Thème détecté automatiquement: 'light', 'dark', 'auto'

// Initialisation du script
async function initializeExtension() {
    console.log('ImmerseFrançais: Initialisation...');
    
    // Charger les mots sauvegardés
    await loadSavedWords();
    
    // Créer le bouton flottant
    createFloatingButton();
    
    // Charger l'état d'activation pour cet onglet
    await loadActivationState();
    
    // Configurer l'observateur pour les changements dynamiques du DOM
    setupDOMObserver();
    
    console.log('ImmerseFrançais: Initialisation terminée');
}

// Configurer l'observateur de mutations du DOM pour détecter les changements dynamiques
function setupDOMObserver() {
    // Vérifier si l'observateur DOM doit être désactivé pour ce site
    const hostname = window.location.hostname.toLowerCase();
    const problematicSites = [
        'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com',
        'linkedin.com', 'twitch.tv', 'gmail.com', 'discord.com'
    ];
    
    if (problematicSites.some(site => hostname.includes(site))) {
        console.log('Site détecté comme problématique - Observateur DOM désactivé');
        return;
    }
    
    // Options de configuration pour l'observateur (plus restreintes)
    const config = {
        childList: true,
        subtree: true,
        characterData: false // Désactiver pour éviter les clignotements
    };
    
    // Variables pour éviter les analyses trop fréquentes
    let observerTimeout = null;
    let isProcessing = false;
    let lastProcessTime = 0;
    const MIN_PROCESS_INTERVAL = 3000; // Minimum 3 secondes entre les analyses
    
    // Créer l'observateur
    const observer = new MutationObserver((mutations) => {
        // Vérifier si l'extension est active ET si la modal n'est pas ouverte
        if (!isExtensionActive || isProcessing || isModalOpen) {
            return;
        }
        
        // Vérifier si suffisamment de temps s'est écoulé depuis la dernière analyse
        const currentTime = Date.now();
        if (currentTime - lastProcessTime < MIN_PROCESS_INTERVAL) {
            return;
        }
        
        // Vérifier s'il y a des changements significatifs
        let hasSignificantChanges = false;
        let newTextContent = false;
        
        for (const mutation of mutations) {
            // Ignorer complètement les changements dans nos propres éléments
            if (mutation.target.classList && 
                (mutation.target.classList.contains('immerse-element') || 
                 mutation.target.classList.contains('immerse-word-highlight') ||
                 mutation.target.classList.contains('immerse-modal-box'))) {
                continue;
            }
            
            // Ignorer les changements dans les parents de nos éléments
            if (mutation.target.querySelector && 
                mutation.target.querySelector('.immerse-element, .immerse-word-highlight, .immerse-modal-box')) {
                continue;
            }
            
            // Ignorer les changements liés à la modal
            if (mutation.target === document.body && mutation.addedNodes.length === 1) {
                const addedNode = mutation.addedNodes[0];
                if (addedNode.classList && addedNode.classList.contains('immerse-modal-box')) {
                    continue;
                }
            }
            
            // Vérifier s'il y a de nouveaux nœuds avec du contenu textuel significatif
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    // Ignorer nos propres éléments
                    if (node.classList && 
                        (node.classList.contains('immerse-element') || 
                         node.classList.contains('immerse-word-highlight'))) {
                        continue;
                    }
                    
                    // Vérifier s'il y a du nouveau contenu textuel significatif
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 10) {
                        newTextContent = true;
                        hasSignificantChanges = true;
                        break;
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        const textContent = node.textContent.trim();
                        // Seulement si c'est un contenu substantiel (plus de 20 caractères)
                        if (textContent.length > 20 && 
                            !node.querySelector('.immerse-word-highlight')) {
                            newTextContent = true;
                            hasSignificantChanges = true;
                            break;
                        }
                    }
                }
            }
            
            if (hasSignificantChanges) break;
        }
        
        // Si des changements significatifs sont détectés, reprocesser avec un délai plus long
        if (hasSignificantChanges && newTextContent) {
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                if (!isProcessing && isExtensionActive) {
                    console.log('Changements DOM significatifs détectés - Re-analyse des mots...');
                    isProcessing = true;
                    lastProcessTime = Date.now();
                    
                    try {
                        analyzeAndHighlightWords();
                    } finally {
                        // Libérer le verrou après un délai
                        setTimeout(() => {
                            isProcessing = false;
                        }, 1000);
                    }
                }
            }, 2000); // Délai de 2 secondes pour éviter les analyses trop fréquentes
        }
    });
    
    // Sauvegarder la référence de l'observateur
    domObserver = observer;
    
    // Commencer l'observation
    observer.observe(document.body, config);
    
    console.log('Observateur DOM configuré avec protection anti-clignotement');
}

// Charger les mots sauvegardés depuis le stockage
async function loadSavedWords() {
    try {
        const result = await chrome.storage.sync.get(['savedWords']);
        savedWords = result.savedWords || {};
        console.log('Mots sauvegardés chargés:', Object.keys(savedWords).length);
    } catch (error) {
        console.error('Erreur lors du chargement des mots sauvegardés:', error);
    }
}

// Créer le bouton flottant d'activation/désactivation
function createFloatingButton() {
    console.log('Création du bouton flottant...');
    
    // Vérifier si le bouton existe déjà
    if (floatingButton) {
        floatingButton.remove();
    }
    
    // Créer l'élément bouton
    floatingButton = document.createElement('button');
    floatingButton.className = 'immerse-floating-button immerse-element inactive';
    floatingButton.innerHTML = '🇫🇷';
    floatingButton.title = 'ImmerseFrançais - Cliquez pour activer/désactiver';
    
    // Ajouter l'événement de clic
    floatingButton.addEventListener('click', toggleExtensionState);
    
    // Ajouter le bouton au DOM
    document.body.appendChild(floatingButton);
    
    console.log('Bouton flottant créé et ajouté');
}

// Charger l'état d'activation global
async function loadActivationState() {
    console.log('Chargement de l\'état d\'activation global...');
    
    try {
        // Charger l'état global depuis le stockage local
        const result = await chrome.storage.local.get(['globalExtensionState']);
        const globalState = result.globalExtensionState;
        
        if (globalState && globalState.isActive) {
            isExtensionActive = true;
            updateButtonState(true);
            // Si l'extension était active, surligner automatiquement les mots
            analyzeAndHighlightWords();
        } else {
            isExtensionActive = false;
            updateButtonState(false);
        }
        
        console.log('État d\'activation global chargé:', isExtensionActive);
    } catch (error) {
        console.error('Erreur lors du chargement de l\'état d\'activation:', error);
        isExtensionActive = false;
        updateButtonState(false);
    }
}

// Sauvegarder l'état d'activation global
async function saveActivationState() {
    try {
        const globalState = {
            isActive: isExtensionActive,
            timestamp: Date.now()
        };
        
        await chrome.storage.local.set({ globalExtensionState: globalState });
        console.log('État d\'activation global sauvegardé:', isExtensionActive);
        
        // Notifier tous les autres onglets du changement d'état
        chrome.runtime.sendMessage({
            action: 'globalStateChanged',
            isActive: isExtensionActive
        }).catch(() => {
            // Ignorer les erreurs si le background script n'est pas disponible
        });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'état d\'activation:', error);
    }
}

// Basculer l'état d'activation de l'extension
async function toggleExtensionState() {
    console.log('Basculement de l\'état d\'activation...');
    
    isExtensionActive = !isExtensionActive;
    
    // Mettre à jour l'apparence du bouton
    updateButtonState(isExtensionActive);
    
    // Sauvegarder le nouvel état
    await saveActivationState();
    
    if (isExtensionActive) {
        console.log('Extension activée - Analyse des mots...');
        analyzeAndHighlightWords();
    } else {
        console.log('Extension désactivée - Nettoyage du surlignage...');
        cleanupHighlighting();
    }
}

// Mettre à jour l'apparence du bouton selon l'état
function updateButtonState(isActive) {
    if (!floatingButton) return;
    
    if (isActive) {
        floatingButton.className = 'immerse-floating-button immerse-element active';
        floatingButton.title = 'ImmerseFrançais - Actif (cliquez pour désactiver)';
        floatingButton.style.transform = 'scale(1.05)';
    } else {
        floatingButton.className = 'immerse-floating-button immerse-element inactive';
        floatingButton.title = 'ImmerseFrançais - Inactif (cliquez pour activer)';
        floatingButton.style.transform = 'scale(1)';
    }
}

// Nettoyer le surlignage des mots
function cleanupHighlighting() {
    console.log('Nettoyage du surlignage...');
    
    // Désactiver temporairement l'observateur DOM pendant le nettoyage
    const wasObserving = domObserver !== null;
    if (wasObserving && domObserver) {
        domObserver.disconnect();
    }
    
    try {
        // Supprimer tous les éléments de surlignage
        const highlightedElements = document.querySelectorAll('.immerse-word-highlight');
        console.log(`Nettoyage de ${highlightedElements.length} éléments surlignés`);
        
        // Traiter par batch pour éviter les ralentissements
        const batchSize = 100;
        for (let i = 0; i < highlightedElements.length; i += batchSize) {
            const batch = Array.from(highlightedElements).slice(i, i + batchSize);
            
            batch.forEach(element => {
                // Remplacer l'élément surligné par son contenu textuel
                const parent = element.parentNode;
                if (parent && parent.contains(element)) {
                    const textNode = document.createTextNode(element.textContent);
                    parent.replaceChild(textNode, element);
                    
                    // Normaliser le nœud parent pour fusionner les nœuds texte adjacents
                    parent.normalize();
                }
            });
            
            // Permettre au navigateur de respirer entre les batches
            if (i + batchSize < highlightedElements.length) {
                setTimeout(() => {}, 0);
            }
        }
        
        // Fermer la modal si elle est ouverte
        if (modal) {
            closeModal();
        }
        
        // Masquer le tooltip si il est affiché
        hideTooltip();
        
        console.log('Nettoyage terminé');
    } finally {
        // Réactiver l'observateur DOM après un délai
        if (wasObserving && domObserver) {
            setTimeout(() => {
                if (isExtensionActive && domObserver) {
                    domObserver.observe(document.body, {
                        childList: true,
                        subtree: true,
                        characterData: false
                    });
                }
            }, 100);
        }
    }
}

// Analyser et surligner les mots de la page
function analyzeAndHighlightWords() {
    console.log('Analyse et surlignage des mots...');
    
    // Éviter les analyses multiples simultanées
    if (document.body.classList.contains('immerse-processing')) {
        console.log('Analyse déjà en cours, abandon...');
        return;
    }
    
    // Ne pas analyser si la modal est ouverte pour éviter de fermer la modal
    if (isModalOpen) {
        console.log('Modal ouverte, analyse reportée...');
        return;
    }
    
    // Marquer comme en cours de traitement
    document.body.classList.add('immerse-processing');
    
    try {
        // Nettoyer les anciens surlignages avant de commencer
        cleanupHighlighting();
        
        // Détecter et appliquer le thème adapté pour une meilleure lisibilité
        applyThemeToHighlights();
        
        // Obtenir tous les nœuds de texte de la page
        const textNodes = getTextNodes(document.body);
        console.log(`Analyse de ${textNodes.length} nœuds de texte...`);
        
        // Optimisation pour les grandes pages : traitement par batch
        if (textNodes.length > 100) {
            processTextNodesBatch(textNodes);
        } else {
            // Analyser et surligner chaque nœud de texte
            textNodes.forEach(node => {
                processTextNode(node);
            });
            console.log('Analyse et surlignage terminés');
        }
    } finally {
        // Libérer le verrou après un délai
        setTimeout(() => {
            document.body.classList.remove('immerse-processing');
        }, 500);
    }
}

// Traiter les nœuds de texte par batch pour optimiser les performances
function processTextNodesBatch(textNodes) {
    const batchSize = 30; // Réduire la taille des batches pour moins de clignotement
    let currentIndex = 0;
    
    function processBatch() {
        const endIndex = Math.min(currentIndex + batchSize, textNodes.length);
        
        // Traitement plus doux pour éviter les clignotements
        for (let i = currentIndex; i < endIndex; i++) {
            if (textNodes[i] && textNodes[i].parentNode) {
                processTextNode(textNodes[i]);
            }
        }
        
        currentIndex = endIndex;
        
        if (currentIndex < textNodes.length) {
            // Augmenter le délai pour réduire les clignotements
            setTimeout(() => {
                requestAnimationFrame(processBatch);
            }, 10);
        } else {
            console.log('Analyse et surlignage terminés (traitement par batch)');
        }
    }
    
    // Commencer le traitement
    processBatch();
}

// Obtenir tous les nœuds de texte dans un élément (en excluant les balises indésirables)
function getTextNodes(element) {
    const textNodes = [];
    const excludedTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'BUTTON', 'CODE', 'PRE']);
    
    // Exclure les éléments de l'extension elle-même
    if (element.classList && element.classList.contains('immerse-element')) {
        return textNodes;
    }
    
    function traverse(node) {
        // Si c'est un nœud de texte et qu'il contient du texte
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            textNodes.push(node);
            return;
        }
        
        // Si c'est un élément, vérifier s'il n'est pas exclu
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName;
            
            // Ignorer les balises exclues
            if (excludedTags.has(tagName)) {
                return;
            }
            
            // Ignorer les éléments cachés
            const style = window.getComputedStyle(node);
            if (style.display === 'none' || style.visibility === 'hidden') {
                return;
            }
            
            // Ignorer les éléments de l'extension
            if (node.classList && node.classList.contains('immerse-element')) {
                return;
            }
            
            // Parcourir récursivement les enfants
            for (let i = 0; i < node.childNodes.length; i++) {
                traverse(node.childNodes[i]);
            }
        }
    }
    
    traverse(element);
    return textNodes;
}

// Traiter un nœud de texte pour identifier et surligner les mots français
function processTextNode(textNode) {
    const text = textNode.textContent;
    
    // Regex améliorée pour détecter les mots français (avec accents et caractères spéciaux)
    const frenchWordRegex = /[a-zA-ZàâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]+(?:[-'][a-zA-ZàâäéèêëïîôöùûüÿçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]+)*/g;
    
    const matches = [];
    let match;
    
    // Trouver tous les mots français dans le texte
    while ((match = frenchWordRegex.exec(text)) !== null) {
        const word = match[0];
        
        // Filtrer les mots selon plusieurs critères
        if (isValidFrenchWord(word)) {
            matches.push({
                word: word.toLowerCase(),
                originalWord: word,
                start: match.index,
                end: match.index + word.length
            });
        }
    }
    
    // Si aucun mot trouvé, ne rien faire
    if (matches.length === 0) {
        return;
    }
    
    // Créer un nouveau contenu HTML avec les mots surlignés
    let newHTML = '';
    let lastIndex = 0;
    
    matches.forEach(matchInfo => {
        const { word, originalWord, start, end } = matchInfo;
        
        // Ajouter le texte avant le mot
        newHTML += escapeHtml(text.substring(lastIndex, start));
        
        // Déterminer la classe CSS selon si le mot est sauvegardé ou non
        const isSaved = savedWords.hasOwnProperty(word);
        const cssClass = isSaved ? 'saved' : 'not-saved';
        
        // Créer l'élément span pour le surlignage
        const highlightedWord = `<span class="immerse-word-highlight ${cssClass}" data-word="${escapeHtml(word)}" data-original="${escapeHtml(originalWord)}">${escapeHtml(originalWord)}</span>`;
        
        newHTML += highlightedWord;
        lastIndex = end;
    });
    
    // Ajouter le texte restant après le dernier mot
    newHTML += escapeHtml(text.substring(lastIndex));
    
    // Remplacer le nœud de texte par un élément temporaire
    const tempElement = document.createElement('span');
    tempElement.innerHTML = newHTML;
    
    // Remplacer le nœud de texte original
    const parent = textNode.parentNode;
    
    // Insérer tous les nouveaux nœuds
    while (tempElement.firstChild) {
        parent.insertBefore(tempElement.firstChild, textNode);
    }
    
    // Supprimer l'ancien nœud de texte
    parent.removeChild(textNode);
    
    // Ajouter les événements de clic et de survol aux nouveaux éléments surlignés
    const highlightedElements = parent.querySelectorAll('.immerse-word-highlight');
    highlightedElements.forEach(element => {
        element.addEventListener('click', handleWordClick);
        
        // Ajouter le survol seulement pour les mots sauvegardés
        if (element.classList.contains('saved')) {
            element.addEventListener('mouseenter', handleWordHover);
            element.addEventListener('mouseleave', hideTooltip);
        }
    });
}

// Échapper les caractères HTML pour éviter les injections
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mettre à jour le surlignage d'un mot spécifique après sauvegarde
function updateWordHighlighting(word) {
    console.log('Mise à jour du surlignage pour le mot:', word);
    
    // Trouver tous les éléments surlignés pour ce mot
    const elements = document.querySelectorAll(`.immerse-word-highlight[data-word="${word.toLowerCase()}"]`);
    
    elements.forEach(element => {
        // Changer la classe de 'not-saved' à 'saved'
        element.classList.remove('not-saved');
        element.classList.add('saved');
        
        // Ajouter les événements de survol pour les mots sauvegardés
        element.addEventListener('mouseenter', handleWordHover);
        element.addEventListener('mouseleave', hideTooltip);
    });
    
    console.log(`Mis à jour ${elements.length} occurrences du mot "${word}"`);
}

// Supprimer le surlignage d'un mot spécifique (pour la synchronisation des suppressions)
function removeWordHighlighting(word) {
    console.log('Suppression du surlignage pour le mot:', word);
    
    const wordKey = word.toLowerCase().trim();
    
    // Trouver tous les éléments surlignés pour ce mot
    const elements = document.querySelectorAll(`.immerse-word-highlight[data-word="${CSS.escape(wordKey)}"]`);
    
    elements.forEach(element => {
        // Restaurer le texte original sans surlignage
        const originalText = element.textContent;
        const textNode = document.createTextNode(originalText);
        
        // Remplacer l'élément surligné par un nœud de texte simple
        if (element.parentNode) {
            element.parentNode.replaceChild(textNode, element);
        }
        
        // Supprimer les événements d'écoute
        element.removeEventListener('mouseenter', handleWordHover);
        element.removeEventListener('mouseleave', hideTooltip);
        element.removeEventListener('click', handleWordClick);
    });
    
    console.log(`Supprimé le surlignage de ${elements.length} occurrences du mot "${word}"`);
}

// Valider si un mot est un mot français valide à surligner
function isValidFrenchWord(word) {
    // Filtrer les mots trop courts (moins de 3 caractères)
    if (word.length < 3) {
        return false;
    }
    
    // Filtrer les mots trop longs (probablement des erreurs ou des URLs)
    if (word.length > 25) {
        return false;
    }
    
    // Exclure les mots qui sont probablement des nombres ou des codes
    if (/^\d+$/.test(word) || /^[A-Z0-9_-]+$/.test(word)) {
        return false;
    }
    
    // Exclure les mots qui ressemblent à des URLs ou des emails
    if (word.includes('@') || word.includes('.com') || word.includes('.fr') || 
        word.includes('www') || word.includes('http')) {
        return false;
    }
    
    // Exclure certains mots très communs qui ne sont pas utiles pour l'apprentissage
    const excludedWords = new Set([
        'est', 'sont', 'était', 'étaient', 'être', 'avoir', 'avez', 'ont', 
        'aux', 'sur', 'par', 'pour', 'avec', 'sans', 'sous', 'vers', 'chez',
        'une', 'des', 'les', 'ces', 'ses', 'mes', 'tes', 'nos', 'vos', 'leurs',
        'que', 'qui', 'dont', 'où', 'quand', 'comment', 'pourquoi',
        'très', 'plus', 'moins', 'aussi', 'trop', 'bien', 'mal', 'mieux',
        'et', 'ou', 'ni', 'mais', 'donc', 'car', 'puis', 'ainsi'
    ]);
    
    if (excludedWords.has(word.toLowerCase())) {
        return false;
    }
    
    // Le mot passe tous les filtres
    return true;
}

// Fonction utilitaire pour masquer le tooltip
// Créer et afficher le tooltip
function showTooltip(word, element) {
    // Ne pas afficher si la modal est ouverte
    if (isModalOpen) {
        return;
    }
    
    const wordKey = word.toLowerCase();
    const savedWord = savedWords[wordKey];
    
    if (!savedWord) {
        console.log('Mot non trouvé dans les mots sauvegardés:', word);
        return;
    }
    
    // Créer l'élément tooltip
    tooltip = document.createElement('div');
    tooltip.className = 'immerse-tooltip immerse-element';
    
    // Contenu du tooltip - afficher uniquement la note personnelle de l'utilisateur
    let tooltipContent = '';
    if (savedWord.userNote && savedWord.userNote.trim() !== '') {
        tooltipContent = escapeHtml(savedWord.userNote.trim());
    } else if (savedWord.translation && savedWord.translation.trim() !== '') {
        // Si pas de note personnelle, afficher la traduction Gemini
        tooltipContent = escapeHtml(savedWord.translation.trim());
    } else {
        tooltipContent = 'Aucune note disponible';
    }
    
    tooltip.textContent = tooltipContent;
    
    // Ajouter le tooltip au document
    document.body.appendChild(tooltip);
    
    // Positionner le tooltip intelligemment
    positionTooltip(tooltip, element);
    
    // Rendre le tooltip visible avec animation
    setTimeout(() => {
        if (tooltip) {
            tooltip.classList.add('visible');
        }
    }, 10);
    
    console.log('Tooltip affiché pour:', word);
}

// Positionner le tooltip intelligemment pour éviter qu'il sorte de l'écran
function positionTooltip(tooltipElement, targetElement) {
    // Obtenir les dimensions et position de l'élément cible
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    // Obtenir les dimensions de la fenêtre
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scrollY = window.pageYOffset;
    const scrollX = window.pageXOffset;
    
    // Position initiale - au-dessus du mot, centré
    let left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
    let top = targetRect.top + scrollY - tooltipRect.height - 8; // 8px d'espacement
    
    // Vérifier si le tooltip dépasse à gauche
    if (left < scrollX + 10) {
        left = scrollX + 10;
    }
    
    // Vérifier si le tooltip dépasse à droite
    if (left + tooltipRect.width > windowWidth + scrollX - 10) {
        left = windowWidth + scrollX - tooltipRect.width - 10;
    }
    
    // Vérifier si le tooltip dépasse en haut
    if (top < scrollY + 10) {
        // Placer en dessous du mot
        top = targetRect.bottom + scrollY + 8;
        
        // Modifier la flèche pour pointer vers le haut
        tooltipElement.style.setProperty('--arrow-direction', 'up');
        tooltipElement.setAttribute('data-arrow', 'up');
    } else {
        // Flèche par défaut (vers le bas)
        tooltipElement.style.setProperty('--arrow-direction', 'down');
        tooltipElement.setAttribute('data-arrow', 'down');
    }
    
    // Vérifier si le tooltip dépasse en bas (cas rare)
    if (top + tooltipRect.height > windowHeight + scrollY - 10) {
        top = windowHeight + scrollY - tooltipRect.height - 10;
    }
    
    // Appliquer la position
    tooltipElement.style.position = 'absolute';
    tooltipElement.style.left = left + 'px';
    tooltipElement.style.top = top + 'px';
    tooltipElement.style.zIndex = '10002';
}

function hideTooltip() {
    // Annuler les délais
    clearTimeout(tooltipTimeout);
    clearTimeout(hideTooltipTimeout);
    
    if (tooltip) {
        // Animation de disparition
        tooltip.classList.remove('visible');
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
            if (tooltip && tooltip.parentNode) {
                tooltip.remove();
            }
            tooltip = null;
        }, 200); // Correspond à la durée de transition CSS
    }
}

// Gérer le clic sur un mot
function handleWordClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.target;
    const word = element.getAttribute('data-word');
    
    if (word) {
        console.log('Clic sur le mot:', word);
        showModal(word, element);
    }
}

// Créer et afficher la modal
async function showModal(word, element) {
    console.log('Affichage de la modal pour:', word);
    
    // Annuler la requête de traduction en cours si elle existe
    if (currentTranslationRequest) {
        console.log('Annulation de la requête de traduction en cours pour:', currentModalWord);
        currentTranslationRequest = null;
    }
    
    // Fermer la modal existante si elle existe
    closeModal();
    
    // Cacher le tooltip s'il est affiché
    hideTooltip();
    
    // Marquer que la modal est ouverte et définir le mot actuel
    isModalOpen = true;
    currentModalWord = word;
    
    // Créer la boîte modale (sans overlay)
    const modalElement = document.createElement('div');
    modalElement.className = 'immerse-modal-box immerse-element';
    
    // Créer la structure HTML de la modal - Design compact avec étoiles
    modalElement.innerHTML = `
        <button class="immerse-modal-close" title="Fermer">&times;</button>
        
        <div class="immerse-modal-header">
            <button class="immerse-modal-audio" id="immerse-audio-button" title="Écouter la prononciation">🔊</button>
            <div class="immerse-modal-word">${escapeHtml(word)}</div>
            <div class="immerse-priority-stars" id="immerse-priority-stars">
                <span class="immerse-star" data-rating="1">⭐</span>
                <span class="immerse-star" data-rating="2">⭐</span>
                <span class="immerse-star" data-rating="3">⭐</span>
                <span class="immerse-star" data-rating="4">⭐</span>
                <span class="immerse-star" data-rating="5">⭐</span>
            </div>
        </div>
        
        <div class="immerse-modal-body">
            <div class="immerse-modal-left">
                <div class="immerse-modal-translation">
                    <div class="immerse-label-small">🌍 Traduction</div>
                    <div class="immerse-content-compact" id="immerse-translation">
                        <div class="immerse-loading-small">
                            <div class="immerse-spinner-small"></div>
                            Recherche...
                        </div>
                    </div>
                </div>
                
                <div class="immerse-modal-example">
                    <div class="immerse-label-small">💬 Exemple</div>
                    <div class="immerse-content-compact" id="immerse-example">
                        <div class="immerse-loading-small">
                            <div class="immerse-spinner-small"></div>
                            Génération...
                        </div>
                    </div>
                </div>
                
                <div class="immerse-modal-notes">
                    <div class="immerse-label-small">📝 Mes notes</div>
                    <textarea 
                        class="immerse-modal-input-compact" 
                        id="immerse-user-note" 
                        placeholder="Votre traduction ou notes..."
                        rows="3"
                    ></textarea>
                </div>
            </div>
            
            <div class="immerse-modal-right">
                <div class="immerse-linguistic-compact">
                    <div class="immerse-info-item-compact">
                        <span class="immerse-info-icon">📋</span>
                        <div>
                            <div class="immerse-info-label-compact">Type</div>
                            <div class="immerse-info-value-compact" id="immerse-word-type">Chargement...</div>
                        </div>
                    </div>
                    
                    <div class="immerse-info-item-compact">
                        <span class="immerse-info-icon">🎭</span>
                        <div>
                            <div class="immerse-info-label-compact">Registre</div>
                            <div class="immerse-info-value-compact" id="immerse-language-register">Chargement...</div>
                        </div>
                    </div>
                    
                    <div class="immerse-info-item-compact">
                        <span class="immerse-info-icon">📊</span>
                        <div>
                            <div class="immerse-info-label-compact">Fréquence</div>
                            <div class="immerse-info-value-compact" id="immerse-frequency">Chargement...</div>
                        </div>
                    </div>
                    
                    <div class="immerse-info-item-compact">
                        <span class="immerse-info-icon">🏛️</span>
                        <div>
                            <div class="immerse-info-label-compact">Origine</div>
                            <div class="immerse-info-value-compact" id="immerse-etymology">Chargement...</div>
                        </div>
                    </div>
                    
                    <div class="immerse-tags-compact">
                        <span class="immerse-info-icon">🏷️</span>
                        <div class="immerse-tags-container" id="immerse-tags-container">
                            <div class="immerse-loading-small">Chargement...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="immerse-modal-footer">
            <button class="immerse-modal-button-compact" id="immerse-save-button">
                💾 Sauvegarder
            </button>
        </div>
    `;
    
    // Ajouter la modal au document
    document.body.appendChild(modalElement);
    
    // Positionner la modal près du mot cliqué
    positionModalNearElement(modalElement, element);
    
    // Sauvegarder la référence
    modal = modalElement;
    
    // Configurer les événements
    setupModalEvents(word, modalElement);
    
    // Pré-remplir le champ si le mot est déjà sauvegardé
    await prefillAllWordData(word);
    
    // Configurer les clics pour étendre le contenu
    setupContentExpansion(modalElement);
    
    // Charger la traduction via l'API Gemini
    await loadTranslation(word);
    
    // Focus sur le champ de notes
    const noteField = modalElement.querySelector('#immerse-user-note');
    if (noteField) {
        noteField.focus();
    }
}

// Positionner la modal près de l'élément cliqué
function positionModalNearElement(modalElement, targetElement) {
    // Obtenir les dimensions et position de l'élément cible
    const targetRect = targetElement.getBoundingClientRect();
    const modalRect = modalElement.getBoundingClientRect();
    
    // Obtenir les dimensions de la fenêtre
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const scrollY = window.pageYOffset;
    const scrollX = window.pageXOffset;
    
    // Calculer la position idéale (à droite et légèrement en bas du mot)
    let left = targetRect.right + scrollX + 10;
    let top = targetRect.top + scrollY - 10;
    
    // Vérifier si la modal dépasse de l'écran à droite (nouvelle largeur: 580px)
    if (left + 580 > windowWidth + scrollX) {
        // Placer à gauche du mot
        left = targetRect.left + scrollX - 590;
    }
    
    // Vérifier si la modal dépasse encore à gauche
    if (left < scrollX + 10) {
        // Centrer horizontalement sur l'écran
        left = scrollX + (windowWidth - 580) / 2;
    }
    
    // Vérifier si la modal dépasse en bas (nouvelle hauteur: 480px)
    if (top + 480 > windowHeight + scrollY) {
        // Placer au-dessus du mot
        top = targetRect.top + scrollY - 490;
    }
    
    // Vérifier si la modal dépasse en haut
    if (top < scrollY + 10) {
        // Placer près du haut de l'écran
        top = scrollY + 10;
    }
    
    // Appliquer la position
    modalElement.style.position = 'absolute';
    modalElement.style.left = left + 'px';
    modalElement.style.top = top + 'px';
    modalElement.style.zIndex = '10001';
}

// Configurer les événements de la modal
function setupModalEvents(word, modalElement) {
    // Bouton de fermeture
    const closeButton = modalElement.querySelector('.immerse-modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    // Fermer avec la touche Échap
    const escapeHandler = (event) => {
        if (event.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Fermer en cliquant en dehors de la modal
    setTimeout(() => {
        document.addEventListener('click', function outsideClickHandler(event) {
            if (modal && !modal.contains(event.target) && !event.target.classList.contains('immerse-word-highlight')) {
                closeModal();
                document.removeEventListener('click', outsideClickHandler);
            }
        });
    }, 100);
    
    // Bouton audio
    const audioButton = modalElement.querySelector('#immerse-audio-button');
    if (audioButton) {
        audioButton.addEventListener('click', () => playWordAudio(word));
    }
    
    // Système d'étoiles de priorité
    const stars = modalElement.querySelectorAll('.immerse-star');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => setWordPriority(index + 1, modalElement));
        star.addEventListener('mouseenter', () => highlightStars(index + 1, modalElement));
    });
    
    const starsContainer = modalElement.querySelector('#immerse-priority-stars');
    if (starsContainer) {
        starsContainer.addEventListener('mouseleave', () => {
            const currentPriority = getCurrentPriority(modalElement);
            highlightStars(currentPriority, modalElement);
        });
    }
    
    // Bouton de sauvegarde
    const saveButton = modalElement.querySelector('#immerse-save-button');
    if (saveButton) {
        saveButton.addEventListener('click', () => saveWordFromModal(word, modalElement));
    }
    
    // Sauvegarde avec Ctrl+Enter dans le champ de notes
    const noteField = modalElement.querySelector('#immerse-user-note');
    if (noteField) {
        noteField.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault();
                saveWordFromModal(word, modalElement);
            }
        });
    }
}

// Pré-remplir toutes les données si le mot est déjà sauvegardé (version étendue)
async function prefillAllWordData(word) {
    const wordKey = word.toLowerCase();
    const wordData = savedWords[wordKey];
    
    if (!wordData) return;
    
    // Notes utilisateur
    const noteField = modal.querySelector('#immerse-user-note');
    if (noteField && wordData.userNote) {
        noteField.value = wordData.userNote;
    }
    
    // Priorité
    if (wordData.priority) {
        setWordPriority(wordData.priority, modal);
    }
    
    // Informations linguistiques (si déjà sauvegardées)
    if (wordData.wordType) {
        const wordTypeElement = modal.querySelector('#immerse-word-type');
        if (wordTypeElement) {
            wordTypeElement.textContent = wordData.wordType;
        }
    }
    
    if (wordData.languageRegister) {
        const registerElement = modal.querySelector('#immerse-language-register');
        if (registerElement) {
            registerElement.textContent = wordData.languageRegister;
        }
    }
    
    if (wordData.frequency) {
        const frequencyElement = modal.querySelector('#immerse-frequency');
        if (frequencyElement) {
            frequencyElement.textContent = wordData.frequency;
        }
    }
    
    if (wordData.etymology) {
        const etymologyElement = modal.querySelector('#immerse-etymology');
        if (etymologyElement) {
            etymologyElement.textContent = wordData.etymology;
        }
    }
    
    // Tags
    if (wordData.tags && Array.isArray(wordData.tags)) {
        const tagsContainer = modal.querySelector('#immerse-tags-container');
        if (tagsContainer) {
            tagsContainer.innerHTML = '';
            wordData.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'immerse-tag';
                tagElement.textContent = tag;
                tagsContainer.appendChild(tagElement);
            });
        }
    }
    
    // Changer le texte du bouton
    const saveButton = modal.querySelector('#immerse-save-button');
    if (saveButton) {
        saveButton.textContent = 'Mettre à jour';
    }
    
    console.log('Données du mot pré-remplies:', word);
}

// Charger la traduction via l'API Gemini
async function loadTranslation(word) {
    try {
        console.log('Demande de traduction pour:', word);
        
        // Créer un identifiant unique pour cette requête
        const requestId = Date.now() + '-' + Math.random();
        currentTranslationRequest = requestId;
        
        // Envoyer la demande au background script
        const response = await chrome.runtime.sendMessage({
            action: 'translateWord',
            word: word
        });
        
        // Vérifier si cette requête est toujours la requête active
        if (currentTranslationRequest !== requestId) {
            console.log('Requête annulée - une nouvelle requête est en cours pour:', currentModalWord);
            return;
        }
        
        // Vérifier si le mot correspond toujours au mot affiché dans la modal
        if (currentModalWord !== word) {
            console.log('Mot changé pendant la requête - abandon de la mise à jour');
            return;
        }
        
        // Vérifier si la modal existe encore
        if (!modal) {
            console.log('Modal fermée pendant la requête - abandon de la mise à jour');
            return;
        }
        
        if (response.success) {
            const data = response.data;
            console.log('Données complètes reçues de l\'API pour:', word, data);
            
            // Double vérification avant mise à jour
            if (currentModalWord !== word || !modal) {
                console.log('Conditions changées - abandon de la mise à jour finale');
                return;
            }
            
            // Afficher la traduction
            const translationElement = modal.querySelector('#immerse-translation');
            if (translationElement) {
                const translation = data.translation_en || data.translation || 'Traduction non disponible';
                translationElement.innerHTML = escapeHtml(translation);
            }
            
            // Afficher l'exemple
            const exampleElement = modal.querySelector('#immerse-example');
            if (exampleElement) {
                const example = data.example_fr || data.example || 'Exemple non disponible';
                exampleElement.innerHTML = `"${escapeHtml(example)}"`;
            }
            
            // Afficher les informations linguistiques
            updateLinguisticInfo(data);
            
        } else {
            // Vérifier une dernière fois avant d'afficher l'erreur
            if (currentModalWord === word && modal) {
                showErrorInModal(response.error || 'Erreur inconnue lors de la traduction');
            }
        }
    } catch (error) {
        console.error('Erreur lors de la traduction:', error);
        // Vérifier une dernière fois avant d'afficher l'erreur
        if (currentModalWord === word && modal) {
            showErrorInModal('Erreur de communication avec le service de traduction');
        }
    } finally {
        // Nettoyer la requête si c'était la requête active
        if (currentTranslationRequest === requestId) {
            currentTranslationRequest = null;
        }
    }
}

// Afficher une erreur dans la modal
function showErrorInModal(errorMessage) {
    const translationElement = modal.querySelector('#immerse-translation');
    if (translationElement) {
        translationElement.innerHTML = `<div class="immerse-error">❌ ${escapeHtml(errorMessage)}</div>`;
    }
    
    const exampleElement = modal.querySelector('#immerse-example');
    if (exampleElement) {
        exampleElement.innerHTML = `<div class="immerse-error">❌ Impossible de générer un exemple</div>`;
    }
}

// Sauvegarder le mot depuis la modal
async function saveWordFromModal(word, modalElement) {
    const noteField = modalElement.querySelector('#immerse-user-note');
    const saveButton = modalElement.querySelector('#immerse-save-button');
    
    if (!noteField || !saveButton) {
        console.error('Éléments de la modal non trouvés');
        return;
    }
    
    const userNote = noteField.value.trim();
    
    if (!userNote) {
        // Mettre en évidence le champ vide avec animation
        noteField.style.borderColor = '#f44336';
        noteField.style.animation = 'immerse-error-shake 0.5s ease';
        noteField.placeholder = 'Veuillez entrer une note ou traduction';
        noteField.focus();
        
        // Réinitialiser l'animation et la couleur après un délai
        setTimeout(() => {
            noteField.style.animation = '';
            noteField.style.borderColor = '';
        }, 500);
        return;
    }
    
    // Désactiver le bouton et afficher un indicateur de chargement
    saveButton.disabled = true;
    saveButton.innerHTML = '<div class="immerse-spinner"></div> Sauvegarde...';
    saveButton.className = 'immerse-modal-button';
    
    // Timeout de sécurité pour éviter le spinner infini
    const timeoutId = setTimeout(() => {
        console.warn('Timeout lors de la sauvegarde - restauration du bouton');
        resetSaveButton(saveButton, word);
    }, 10000); // 10 secondes de timeout
    
    try {
        // Récupérer les données de traduction existantes si disponibles
        const translationElement = modal.querySelector('#immerse-translation');
        const exampleElement = modal.querySelector('#immerse-example');
        
        const translation = translationElement ? translationElement.textContent.trim() : '';
        const example = exampleElement ? exampleElement.textContent.trim().replace(/^"|"$/g, '') : '';
        
        // Récupérer les informations linguistiques
        const wordType = modal.querySelector('#immerse-word-type')?.textContent || '';
        const languageRegister = modal.querySelector('#immerse-language-register')?.textContent || '';
        const frequency = modal.querySelector('#immerse-frequency')?.textContent || '';
        const etymology = modal.querySelector('#immerse-etymology')?.textContent || '';
        
        // Récupérer les tags
        const tagsElements = modal.querySelectorAll('.immerse-tag');
        const tags = Array.from(tagsElements).map(tag => tag.textContent.trim());
        
        // Récupérer la priorité
        const priority = getCurrentPriority(modalElement);

        const wordData = {
            word: word,
            userNote: userNote,
            translation: translation,
            example: example,
            wordType: wordType,
            languageRegister: languageRegister,
            frequency: frequency,
            etymology: etymology,
            tags: tags,
            priority: priority
        };
        
        console.log('Envoi de la requête de sauvegarde pour:', word);
        
        // Envoyer au background script pour sauvegarde avec gestion d'erreur améliorée
        let response;
        try {
            response = await chrome.runtime.sendMessage({
                action: 'saveWord',
                wordData: wordData
            });
        } catch (messageError) {
            console.error('Erreur lors de l\'envoi du message:', messageError);
            throw new Error('Impossible de communiquer avec le service de sauvegarde');
        }
        
        // Annuler le timeout de sécurité
        clearTimeout(timeoutId);
        
        console.log('Réponse reçue:', response);
        
        // Vérifier que la réponse existe et a le bon format
        if (!response) {
            throw new Error('Aucune réponse du service de sauvegarde');
        }
        
        if (response.success) {
            // Mettre à jour le cache local avec les données retournées par le background
            const dataToSave = response.data || wordData;
            savedWords[word.toLowerCase()] = dataToSave;
            
            // Mettre à jour le surlignage sur la page
            updateWordHighlighting(word);
            
            // Afficher un feedback de succès avec animation
            saveButton.innerHTML = '✅ Sauvegardé !';
            saveButton.className = 'immerse-modal-button success';
            
            // Fermer la modal après un court délai
            setTimeout(() => {
                closeModal();
            }, 1200);
            
            console.log('Mot sauvegardé avec succès:', word, '- Données:', dataToSave);
        } else {
            throw new Error(response.error || 'Erreur lors de la sauvegarde');
        }
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        
        // Annuler le timeout de sécurité
        clearTimeout(timeoutId);
        
        // Afficher l'erreur avec animation
        saveButton.innerHTML = '❌ Erreur de sauvegarde';
        saveButton.className = 'immerse-modal-button error';
        
        // Réactiver le bouton après un délai
        setTimeout(() => {
            resetSaveButton(saveButton, word);
        }, 3000);
    }
}

// Fonction utilitaire pour réinitialiser le bouton de sauvegarde
function resetSaveButton(saveButton, word) {
    if (saveButton) {
        saveButton.disabled = false;
        saveButton.innerHTML = savedWords[word.toLowerCase()] ? '💾 Mettre à jour' : '💾 Sauvegarder';
        saveButton.className = 'immerse-modal-button-compact';
    }
}

// Fermer la modal
function closeModal() {
    if (modal) {
        modal.remove();
        modal = null;
        // Marquer que la modal est fermée et nettoyer les variables
        isModalOpen = false;
        currentModalWord = null;
        currentTranslationRequest = null;
        console.log('Modal fermée - Observateur DOM réactivé');
    }
}

// Gérer le survol des mots sauvegardés
// Variables pour le tooltip
let tooltipTimeout = null;
let hideTooltipTimeout = null;
let currentTooltipElement = null;

function handleWordHover(event) {
    const element = event.target;
    const word = element.getAttribute('data-word');
    
    // Vérifier si ce mot est sauvegardé (ne pas afficher de tooltip pour les mots non sauvegardés)
    if (!word || !element.classList.contains('saved')) {
        return;
    }
    
    // Annuler les délais précédents
    clearTimeout(tooltipTimeout);
    clearTimeout(hideTooltipTimeout);
    
    // Cacher le tooltip existant
    hideTooltip();
    
    // Afficher le nouveau tooltip après un court délai
    tooltipTimeout = setTimeout(() => {
        showTooltip(word, element);
        currentTooltipElement = element;
    }, 300); // Délai de 300ms pour éviter les apparitions intempestives
    
    // Ajouter un gestionnaire pour cacher le tooltip quand la souris quitte l'élément
    const mouseLeaveHandler = () => {
        clearTimeout(tooltipTimeout);
        
        // Délai avant de cacher le tooltip pour permettre à l'utilisateur de le lire
        hideTooltipTimeout = setTimeout(() => {
            hideTooltip();
            currentTooltipElement = null;
        }, 500); // Délai de 500ms avant de masquer
        
        element.removeEventListener('mouseleave', mouseLeaveHandler);
    };
    
    element.addEventListener('mouseleave', mouseLeaveHandler);
}

// Nettoyer les ressources lors du déchargement de la page
window.addEventListener('beforeunload', () => {
    if (floatingButton) {
        floatingButton.remove();
    }
    cleanupHighlighting();
});

// Gérer les changements de focus de l'onglet
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isExtensionActive) {
        // Réactiver le surlignage si nécessaire
        setTimeout(() => {
            analyzeAndHighlightWords();
        }, 100);
    }
});

// Écouter les messages du popup et du background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message reçu:', message);
    
    switch (message.action) {
        case 'updateState':
            // Mettre à jour l'état d'activation depuis le popup
            isExtensionActive = message.isActive;
            updateButtonState(isExtensionActive);
            
            if (isExtensionActive) {
                analyzeAndHighlightWords();
            } else {
                cleanupHighlighting();
            }
            
            sendResponse({ success: true, isActive: isExtensionActive });
            break;
            
        case 'getState':
            // Renvoyer l'état actuel
            sendResponse({ isActive: isExtensionActive });
            break;
            
        case 'globalStateChanged':
            // Synchroniser l'état global depuis un autre onglet
            console.log('Synchronisation de l\'état global depuis un autre onglet:', message.isActive);
            isExtensionActive = message.isActive;
            updateButtonState(isExtensionActive);
            
            if (isExtensionActive) {
                analyzeAndHighlightWords();
            } else {
                cleanupHighlighting();
            }
            
            sendResponse({ success: true });
            break;
            
        default:
            sendResponse({ success: false, error: 'Action non reconnue' });
    }
    
    return true; // Indique que la réponse sera asynchrone
});

// Fonctions utilitaires pour la gestion du stockage global

// Obtenir les statistiques de stockage depuis le background
async function getStorageStats() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'getStorageStats'
        });
        
        if (response.success) {
            console.log('📊 Statistiques de stockage:', response.data);
            return response.data;
        } else {
            console.error('Erreur lors de la récupération des statistiques:', response.error);
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        return null;
    }
}

// Exporter les mots sauvegardés
async function exportSavedWords() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'exportWords'
        });
        
        if (response.success) {
            // Créer un blob pour le téléchargement
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Créer un lien de téléchargement
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `immerse-francais-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            console.log('✅ Export réussi:', response.data.totalWords, 'mots exportés');
            return true;
        } else {
            console.error('❌ Erreur lors de l\'export:', response.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'export:', error);
        return false;
    }
}

// Supprimer un mot sauvegardé
async function deleteSavedWord(word) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'deleteWord',
            word: word
        });
        
        if (response.success) {
            console.log('✅ Mot supprimé avec succès:', word);
            // Le cache local sera mis à jour automatiquement via la synchronisation
            return true;
        } else {
            console.error('❌ Erreur lors de la suppression:', response.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        return false;
    }
}

// Fonction de test pour valider le système de stockage global
async function testGlobalStorage() {
    console.log('🧪 Test du système de stockage global...');
    
    // Test 1: Obtenir les statistiques
    const stats = await getStorageStats();
    if (stats) {
        console.log('✅ Test 1 réussi - Statistiques:', stats);
    } else {
        console.log('❌ Test 1 échoué - Impossible d\'obtenir les statistiques');
    }
    
    // Test 2: Vérifier la synchronisation
    console.log('📝 Mots actuellement en cache:', Object.keys(savedWords).length);
    
    // Test 3: Afficher les mots récents
    if (stats && stats.recentWords) {
        console.log('📅 Mots récents:', stats.recentWords.slice(0, 3));
    }
    
    console.log('🏁 Test du stockage global terminé');
}

// Exposer les fonctions utilitaires globalement pour les tests
window.immerseFrancaisUtils = {
    getStorageStats,
    exportSavedWords,
    deleteSavedWord,
    testGlobalStorage,
    getSavedWordsCount: () => Object.keys(savedWords).length,
    isWordSaved: (word) => savedWords.hasOwnProperty(word.toLowerCase()),
    getSavedWords: () => savedWords
};

// Démarrer l'extension quand le DOM est prêt
// Écouter les messages du background script pour la synchronisation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message de synchronisation reçu:', request.action);
    
    switch (request.action) {
        case 'updateSavedWords':
            console.log('Mise à jour globale des mots sauvegardés reçue');
            loadSavedWords().then(() => {
                if (isExtensionActive) {
                    analyzeAndHighlightWords();
                }
                console.log('Mots rechargés et page re-analysée');
            });
            sendResponse({success: true});
            break;
            
        case 'wordSaved':
            console.log('Nouveau mot sauvegardé sur un autre onglet:', request.word);
            // Mettre à jour le cache local
            savedWords[request.word.toLowerCase()] = request.data;
            // Mettre à jour le surlignage en temps réel
            updateWordHighlighting(request.data.originalWord || request.word);
            sendResponse({success: true});
            break;
            
        case 'wordDeleted':
            console.log('Mot supprimé sur un autre onglet:', request.word);
            // Supprimer du cache local
            delete savedWords[request.word.toLowerCase()];
            // Nettoyer le surlignage
            removeWordHighlighting(request.word);
            sendResponse({success: true});
            break;
            
        default:
            sendResponse({success: true});
    }
    
    return true; // Indique une réponse asynchrone
});

// Fonction de test pour vérifier le bon fonctionnement de l'analyse
function testWordAnalysis() {
    console.log('Test de l\'analyse des mots...');
    
    // Créer un élément de test
    const testElement = document.createElement('div');
    testElement.innerHTML = 'Bonjour, comment allez-vous ? Je vais très bien merci !';
    testElement.style.position = 'fixed';
    testElement.style.top = '10px';
    testElement.style.left = '10px';
    testElement.style.background = 'white';
    testElement.style.padding = '10px';
    testElement.style.border = '1px solid #ccc';
    testElement.style.zIndex = '9999';
    
    document.body.appendChild(testElement);
    
    // Analyser l'élément de test
    const textNodes = getTextNodes(testElement);
    console.log('Nœuds de texte trouvés dans l\'élément de test:', textNodes.length);
    
    textNodes.forEach(node => {
        processTextNode(node);
    });
    
    // Supprimer l'élément de test après 5 secondes
    setTimeout(() => {
        testElement.remove();
    }, 5000);
    
    console.log('Test terminé - l\'élément de test sera supprimé dans 5 secondes');
}

// Exposer la fonction de test dans la console pour le debug
window.immerseTestAnalysis = testWordAnalysis;

// Jouer la prononciation audio d'un mot
function playWordAudio(word) {
    try {
        console.log('Lecture audio pour:', word);
        
        // Utiliser l'API Web Speech pour la synthèse vocale
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'fr-FR';
            utterance.rate = 0.8; // Parler plus lentement
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
            
            // Essayer de trouver une voix française
            const voices = speechSynthesis.getVoices();
            const frenchVoice = voices.find(voice => voice.lang.startsWith('fr'));
            if (frenchVoice) {
                utterance.voice = frenchVoice;
            }
            
            speechSynthesis.speak(utterance);
            
            // Ajouter un feedback visuel
            const audioButton = modal.querySelector('#immerse-audio-button');
            if (audioButton) {
                audioButton.innerHTML = '🔊';
                audioButton.style.animation = 'immerse-pulse 1s ease';
                setTimeout(() => {
                    audioButton.style.animation = '';
                }, 1000);
            }
        } else {
            console.warn('Synthèse vocale non supportée par ce navigateur');
        }
    } catch (error) {
        console.error('Erreur lors de la lecture audio:', error);
    }
}

// Définir la priorité d'un mot (1-5 étoiles)
function setWordPriority(priority, modalElement) {
    const stars = modalElement.querySelectorAll('.immerse-star');
    highlightStars(priority, modalElement);
    
    // Stocker la priorité dans un attribut data
    modalElement.setAttribute('data-priority', priority);
    
    console.log('Priorité définie:', priority);
}

// Surligner les étoiles jusqu'à un certain niveau
function highlightStars(level, modalElement) {
    const stars = modalElement.querySelectorAll('.immerse-star');
    stars.forEach((star, index) => {
        if (index < level) {
            star.style.opacity = '1';
            star.style.filter = 'brightness(1.2)';
        } else {
            star.style.opacity = '0.3';
            star.style.filter = 'brightness(0.8)';
        }
    });
}

// Obtenir la priorité actuelle
function getCurrentPriority(modalElement) {
    const priority = modalElement.getAttribute('data-priority');
    return priority ? parseInt(priority) : 0;
}

// Mettre à jour les informations linguistiques dans la modal
function updateLinguisticInfo(data) {
    try {
        console.log('Données reçues pour mise à jour linguistique:', data);
        
        // Vérifier que la modal existe encore
        if (!modal) {
            console.log('Modal fermée - abandon de la mise à jour linguistique');
            return;
        }
        
        // Type de mot
        const wordTypeElement = modal.querySelector('#immerse-word-type');
        if (wordTypeElement) {
            const wordType = data.word_type || data.wordType || 'Non défini';
            wordTypeElement.textContent = wordType;
        }
        
        // Registre de langue
        const registerElement = modal.querySelector('#immerse-language-register');
        if (registerElement) {
            const register = data.language_register || data.languageRegister || 'Non défini';
            registerElement.textContent = register;
        }
        
        // Fréquence
        const frequencyElement = modal.querySelector('#immerse-frequency');
        if (frequencyElement) {
            const frequency = data.frequency || 'Non défini';
            frequencyElement.textContent = frequency;
        }
        
        // Étymologie
        const etymologyElement = modal.querySelector('#immerse-etymology');
        if (etymologyElement) {
            const etymology = data.etymology || 'Non défini';
            etymologyElement.textContent = etymology;
        }
        
        // Tags
        const tagsContainer = modal.querySelector('#immerse-tags-container');
        if (tagsContainer) {
            const tags = data.tags || [];
            tagsContainer.innerHTML = '';
            
            if (Array.isArray(tags) && tags.length > 0) {
                tags.slice(0, 3).forEach(tag => { // Maximum 3 tags
                    const tagElement = document.createElement('span');
                    tagElement.className = 'immerse-tag';
                    tagElement.textContent = tag.trim();
                    tagsContainer.appendChild(tagElement);
                });
            } else {
                const noTagsElement = document.createElement('span');
                noTagsElement.className = 'immerse-no-tags';
                noTagsElement.textContent = 'Aucun tag';
                noTagsElement.style.fontSize = '10px';
                noTagsElement.style.color = '#999';
                noTagsElement.style.fontStyle = 'italic';
                tagsContainer.appendChild(noTagsElement);
            }
        }
        
        console.log('Informations linguistiques mises à jour avec succès');
    } catch (error) {
        console.error('Erreur lors de la mise à jour des informations linguistiques:', error);
        
        // En cas d'erreur, afficher des valeurs par défaut
        const fields = [
            { id: '#immerse-word-type', default: 'Erreur' },
            { id: '#immerse-language-register', default: 'Erreur' },
            { id: '#immerse-frequency', default: 'Erreur' },
            { id: '#immerse-etymology', default: 'Erreur' }
        ];
        
        fields.forEach(field => {
            const element = modal.querySelector(field.id);
            if (element) {
                element.textContent = field.default;
            }
        });
    }
}

// Configurer l'expansion du contenu au clic
function setupContentExpansion(modalElement) {
    const contentElements = modalElement.querySelectorAll('.immerse-content-compact');
    
    contentElements.forEach(element => {
        element.addEventListener('click', function() {
            // Basculer entre état normal et étendu
            if (this.classList.contains('expanded')) {
                this.classList.remove('expanded');
                this.title = 'Cliquer pour voir plus';
            } else {
                this.classList.add('expanded');
                this.title = 'Cliquer pour réduire';
            }
        });
        
        // Ajouter un tooltip initial
        element.title = 'Cliquer pour voir plus';
        
        // Vérifier si le contenu dépasse et ajouter un indicateur visuel
        setTimeout(() => {
            if (element.scrollHeight > element.clientHeight) {
                element.style.borderBottomColor = '#2196F3';
                element.style.borderBottomWidth = '2px';
            }
        }, 100);
    });
}

// Détecter le thème de fond du site pour adapter les couleurs
function detectBackgroundTheme() {
    try {
        // Obtenir la couleur de fond de l'élément body
        const bodyStyles = window.getComputedStyle(document.body);
        const backgroundColor = bodyStyles.backgroundColor;
        
        // Si pas de couleur de fond définie, vérifier l'élément HTML
        if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            const htmlStyles = window.getComputedStyle(document.documentElement);
            const htmlBackgroundColor = htmlStyles.backgroundColor;
            
            if (htmlBackgroundColor && htmlBackgroundColor !== 'rgba(0, 0, 0, 0)' && htmlBackgroundColor !== 'transparent') {
                return analyzeBackgroundColor(htmlBackgroundColor);
            }
        } else {
            return analyzeBackgroundColor(backgroundColor);
        }
        
        // Analyser quelques éléments textuels pour détecter le thème
        const textElements = document.querySelectorAll('p, div, span, h1, h2, h3, article, main');
        let darkBackgroundCount = 0;
        let lightBackgroundCount = 0;
        
        for (let i = 0; i < Math.min(10, textElements.length); i++) {
            const element = textElements[i];
            const styles = window.getComputedStyle(element);
            const bgColor = styles.backgroundColor;
            
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                const theme = analyzeBackgroundColor(bgColor);
                if (theme === 'dark') darkBackgroundCount++;
                else if (theme === 'light') lightBackgroundCount++;
            }
        }
        
        // Retourner le thème le plus fréquent ou 'auto' par défaut
        if (darkBackgroundCount > lightBackgroundCount) {
            return 'dark';
        } else if (lightBackgroundCount > darkBackgroundCount) {
            return 'light';
        }
        
        return 'auto';
        
    } catch (error) {
        console.warn('Erreur lors de la détection du thème:', error);
        return 'auto';
    }
}

// Analyser une couleur de fond et déterminer si elle est claire ou sombre
function analyzeBackgroundColor(colorString) {
    try {
        // Convertir la couleur en RGB
        let r, g, b;
        
        if (colorString.startsWith('rgb(')) {
            const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbMatch) {
                [, r, g, b] = rgbMatch.map(Number);
            }
        } else if (colorString.startsWith('rgba(')) {
            const rgbaMatch = colorString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
            if (rgbaMatch) {
                [, r, g, b] = rgbaMatch.map(Number);
            }
        } else if (colorString.startsWith('#')) {
            const hex = colorString.slice(1);
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else {
            return 'auto'; // Couleur non reconnue
        }
        
        // Calculer la luminance relative (formule W3C)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Thème sombre si la luminance est faible (inférieures à 0.5)
        return luminance < 0.5 ? 'dark' : 'light';
        
    } catch (error) {
        console.warn('Erreur lors de l\'analyse de la couleur:', colorString, error);
        return 'auto';
    }
}

// Appliquer les classes de thème aux éléments surlignés
function applyThemeToHighlights() {
    const theme = detectBackgroundTheme();
    backgroundTheme = theme;
    
    // Supprimer les anciennes classes de thème du body
    document.body.classList.remove('immerse-dark-bg', 'immerse-light-bg');
    
    // Appliquer la nouvelle classe selon le thème détecté
    if (theme === 'dark') {
        document.body.classList.add('immerse-dark-bg');
        console.log('🌙 Thème sombre détecté - Application des styles adaptés');
    } else if (theme === 'light') {
        document.body.classList.add('immerse-light-bg');
        console.log('☀️ Thème clair détecté - Application des styles adaptés');
    } else {
        console.log('🔄 Thème automatique - Utilisation des styles par défaut');
    }
}

// Initialisation de l'extension au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
}

// Test de la détection automatique de thème
function testThemeDetection() {
    console.log('🔬 Test de la détection automatique de thème:');
    
    // Tester différentes couleurs communes
    const testColors = [
        { color: '#FFFFFF', expected: 'light', description: 'Blanc pur' },
        { color: '#000000', expected: 'dark', description: 'Noir pur' },
        { color: '#F5F5F5', expected: 'light', description: 'Gris très clair' },
        { color: '#2D2D2D', expected: 'dark', description: 'Gris très sombre' },
        { color: 'rgb(255, 255, 255)', expected: 'light', description: 'Blanc RGB' },
        { color: 'rgb(30, 30, 30)', expected: 'dark', description: 'Sombre RGB' },
        { color: 'rgba(255, 255, 255, 0.9)', expected: 'light', description: 'Blanc transparent' },
        { color: 'rgba(50, 50, 50, 0.9)', expected: 'dark', description: 'Sombre transparent' }
    ];
    
    testColors.forEach(({ color, expected, description }) => {
        const detected = analyzeBackgroundColor(color);
        const status = detected === expected ? '✅' : '❌';
        console.log(`${status} ${description} (${color}) -> Détecté: ${detected}, Attendu: ${expected}`);
    });
    
    // Tester la détection sur la page actuelle
    const currentTheme = detectBackgroundTheme();
    console.log(`🎨 Thème détecté sur cette page: ${currentTheme}`);
    
    // Informations sur les couleurs de fond actuelles
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
    console.log(`📄 Couleur de fond du body: ${bodyBg}`);
    console.log(`📄 Couleur de fond du html: ${htmlBg}`);
} 