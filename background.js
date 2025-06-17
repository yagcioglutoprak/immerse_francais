// ImmerseFrançais - Background Script (Service Worker)
// Gestion de l'API Gemini, du stockage et de la communication avec les content scripts

console.log('ImmerseFrançais: Background script chargé');

// Configuration de l'API Gemini
let geminiApiKey = '';

// Cache pour les traductions (éviter les appels répétés)
const translationCache = new Map();
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 heures

// Configuration API
const API_CONFIG = {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    timeout: 30000, // 30 secondes
    maxRetries: 3,
    retryDelay: 1000 // 1 seconde
};

// Initialisation du service worker
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Extension installée/mise à jour:', details.reason);
    
    // Charger la clé API depuis le stockage
    await loadApiKey();
    
    // Initialiser les données par défaut si nécessaire
    await initializeDefaultData();
});

// Gérer le réveil du service worker
chrome.runtime.onStartup.addListener(async () => {
    console.log('Service worker réveillé - Rechargement de la clé API');
    await loadApiKey();
});

// S'assurer que la clé API est chargée au démarrage
(async () => {
    await loadApiKey();
    console.log('Clé API chargée au démarrage du service worker');
})();

// Charger la clé API Gemini
async function loadApiKey() {
    try {
        console.log('Tentative de chargement de la clé API...');
        const result = await chrome.storage.sync.get(['geminiApiKey']);
        const newApiKey = result.geminiApiKey || '';
        
        if (newApiKey !== geminiApiKey) {
            console.log('Clé API mise à jour:', newApiKey ? 'Nouvelle clé chargée' : 'Clé supprimée');
        }
        
        geminiApiKey = newApiKey;
        console.log('Clé API chargée:', geminiApiKey ? `Présente (${geminiApiKey.length} caractères)` : 'Manquante');
        
        // Vérifier que la clé a bien un format attendu
        if (geminiApiKey && !geminiApiKey.startsWith('AIza')) {
            console.warn('⚠️ La clé API ne semble pas avoir le format attendu pour Gemini');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la clé API:', error);
        geminiApiKey = '';
    }
}

// Vérification périodique de la clé API (toutes les 5 minutes)
setInterval(async () => {
    const oldKey = geminiApiKey;
    await loadApiKey();
    if (oldKey !== geminiApiKey) {
        console.log('🔄 Clé API changée lors de la vérification périodique');
    }
}, 5 * 60 * 1000);

// Initialiser les données par défaut
async function initializeDefaultData() {
    try {
        const result = await chrome.storage.sync.get(['savedWords', 'extensionSettings']);
        
        if (!result.savedWords) {
            await chrome.storage.sync.set({ savedWords: {} });
        }
        
        if (!result.extensionSettings) {
            await chrome.storage.sync.set({
                extensionSettings: {
                    activeColor: '#E3F2FD', // Bleu clair pour mots non sauvegardés
                    savedColor: '#E8F5E8',  // Vert clair pour mots sauvegardés
                    tooltipDelay: 500
                }
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des données:', error);
    }
}

// Écouter les messages des content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message reçu:', request.action);
    
    switch (request.action) {
        case 'translateWord':
            handleTranslateWord(request.word, sendResponse);
            return true; // Indique qu'on va répondre de manière asynchrone
            
        case 'saveWord':
            handleSaveWord(request.wordData, sendResponse);
            return true;
            
        case 'deleteWord':
            handleDeleteWord(request.word, sendResponse);
            return true;
            
        case 'getSavedWords':
            handleGetSavedWords(sendResponse);
            return true;
            
        case 'getStorageStats':
            handleGetStorageStats(sendResponse);
            return true;
            
        case 'exportWords':
            handleExportWords(sendResponse);
            return true;
            
        case 'importWords':
            handleImportWords(request.importData, sendResponse);
            return true;
            
        case 'updateApiKey':
            handleUpdateApiKey(request.apiKey, sendResponse);
            return true;
            
        case 'getCacheStats':
            handleGetCacheStats(sendResponse);
            return true;
            
        case 'clearCache':
            handleClearCache(sendResponse);
            return true;
            
        case 'globalStateChanged':
            handleGlobalStateChanged(request.isActive, sender, sendResponse);
            return true;
            
        default:
            console.warn('Action non reconnue:', request.action);
            sendResponse({ success: false, error: 'Action non reconnue' });
    }
});

// Appeler l'API Gemini pour la traduction (version améliorée)
async function callGeminiApi(word) {
    // Vérifier le cache d'abord
    const cacheKey = word.toLowerCase().trim();
    const cachedResult = translationCache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_EXPIRY_TIME) {
        console.log('Traduction trouvée dans le cache pour:', word);
        return cachedResult.data;
    }

    const prompt = `Tu es un assistant linguistique expert en français. Analyse le mot français suivant et retourne OBLIGATOIREMENT un objet JSON avec EXACTEMENT ces 7 champs, sans exception :

{
  "translation_en": "traduction anglaise la plus courante",
  "example_fr": "phrase d'exemple complète en français avec ce mot",
  "word_type": "type grammatical précis (ex: nom masculin, verbe transitif, adjectif qualificatif, etc.)",
  "language_register": "registre de langue (familier, courant, soutenu, littéraire)",
  "frequency": "fréquence d'usage (très courant, courant, peu courant, rare)",
  "etymology": "origine étymologique courte (ex: du latin 'respectus')",
  "tags": ["tag1", "tag2", "tag3"]
}

Les tags doivent être 3 mots-clés maximum décrivant le domaine/contexte (ex: ["informatique", "travail"] ou ["cuisine", "famille"] ou ["émotion", "psychologie"]).

Mot à analyser : "${word}"

IMPORTANT: Retourne UNIQUEMENT le JSON, rien d'autre. Tous les champs sont OBLIGATOIRES.`;

    let lastError;
    
    for (let attempt = 1; attempt <= API_CONFIG.maxRetries; attempt++) {
        try {
            console.log(`Tentative ${attempt}/${API_CONFIG.maxRetries} pour traduire: ${word}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
            
            const response = await fetch(`${API_CONFIG.baseUrl}?key=${geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 1024,
                    }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur API ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Réponse API invalide: structure inattendue');
            }
            
            const generatedText = data.candidates[0].content.parts[0].text;
            
            // Nettoyer la réponse pour extraire uniquement le JSON
            const cleanedText = generatedText.replace(/```json|```/g, '').trim();
            
            let translationData;
            try {
                translationData = JSON.parse(cleanedText);
            } catch (parseError) {
                // Tentative de récupération si le JSON n'est pas parfait
                const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    translationData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Impossible de parser la réponse JSON');
                }
            }
            
            // Valider la structure de la réponse
            if (!translationData.translation_en || !translationData.example_fr) {
                throw new Error('Réponse incomplète: traduction ou exemple manquant');
            }
            
            // Construire le résultat avec tous les champs disponibles
            const result = {
                translation_en: translationData.translation_en,
                example_fr: translationData.example_fr,
                word_type: translationData.word_type || 'Non spécifié',
                language_register: translationData.language_register || 'Courant',
                frequency: translationData.frequency || 'Non spécifié',
                etymology: translationData.etymology || 'Origine inconnue',
                tags: translationData.tags || ['général'],
                // Pour la compatibilité avec l'ancien code
                translation: translationData.translation_en,
                example: translationData.example_fr,
                word: word
            };
            
            console.log('Données complètes retournées:', result);
            
            // Mettre en cache le résultat
            translationCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            
            console.log('Traduction réussie pour:', word);
            return result;
            
        } catch (error) {
            lastError = error;
            console.warn(`Tentative ${attempt} échouée:`, error.message);
            
            if (attempt < API_CONFIG.maxRetries) {
                // Délai avant nouvelle tentative
                await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt));
            }
        }
    }
    
    // Si toutes les tentatives ont échoué
    console.error('Échec de toutes les tentatives de traduction:', lastError);
    throw new Error(`Impossible de traduire le mot après ${API_CONFIG.maxRetries} tentatives: ${lastError.message}`);
}

// Gérer la traduction d'un mot via l'API Gemini (version améliorée)
async function handleTranslateWord(word, sendResponse) {
    try {
        // Toujours recharger la clé API au cas où le service worker aurait été suspendu
        await loadApiKey();
        
        if (!geminiApiKey) {
            sendResponse({ 
                success: false, 
                error: 'Clé API Gemini manquante. Configurez-la dans les options de l\'extension.',
                errorType: 'MISSING_API_KEY'
            });
            return;
        }
        
        // Valider le mot
        const cleanWord = word.trim().toLowerCase();
        if (!cleanWord || cleanWord.length < 2) {
            sendResponse({
                success: false,
                error: 'Mot invalide ou trop court',
                errorType: 'INVALID_WORD'
            });
            return;
        }
        
        console.log('Traduction demandée pour:', word, 'avec clé API:', geminiApiKey ? 'Présente' : 'Absente');
        
        // Appel à l'API Gemini avec cache et retry
        const translation = await callGeminiApi(cleanWord);
        
        sendResponse({ 
            success: true, 
            data: translation,
            fromCache: translationCache.has(cleanWord)
        });
        
    } catch (error) {
        console.error('Erreur lors de la traduction:', error);
        
        let errorType = 'TRANSLATION_ERROR';
        if (error.name === 'AbortError') {
            errorType = 'TIMEOUT';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorType = 'INVALID_API_KEY';
        } else if (error.message.includes('429')) {
            errorType = 'RATE_LIMIT';
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
            errorType = 'SERVER_ERROR';
        }
        
        sendResponse({ 
            success: false, 
            error: getErrorMessage(errorType, error.message),
            errorType: errorType
        });
    }
}

// Obtenir un message d'erreur convivial
function getErrorMessage(errorType, originalError) {
    switch (errorType) {
        case 'MISSING_API_KEY':
            return 'Clé API Gemini manquante. Veuillez la configurer dans les options.';
        case 'INVALID_API_KEY':
            return 'Clé API Gemini invalide. Vérifiez votre clé dans les options.';
        case 'RATE_LIMIT':
            return 'Limite de requêtes atteinte. Veuillez réessayer dans quelques minutes.';
        case 'TIMEOUT':
            return 'Délai d\'attente dépassé. Vérifiez votre connexion internet.';
        case 'SERVER_ERROR':
            return 'Erreur du serveur Gemini. Veuillez réessayer plus tard.';
        case 'INVALID_WORD':
            return 'Le mot fourni n\'est pas valide.';
        default:
            return `Erreur de traduction: ${originalError}`;
    }
}

// Nettoyer le cache périodiquement
function cleanupCache() {
    const now = Date.now();
    for (const [key, value] of translationCache.entries()) {
        if (now - value.timestamp > CACHE_EXPIRY_TIME) {
            translationCache.delete(key);
        }
    }
    console.log('Cache nettoyé, taille actuelle:', translationCache.size);
}

// Nettoyer le cache toutes les heures
setInterval(cleanupCache, 60 * 60 * 1000);

// Obtenir les statistiques du cache
async function getCacheStats() {
    const stats = {
        size: translationCache.size,
        entries: Array.from(translationCache.keys()),
        totalCacheHits: 0 // Cette métrique pourrait être ajoutée avec un compteur
    };
    return stats;
}

// Vider le cache manuellement
async function clearCache() {
    translationCache.clear();
    console.log('Cache vidé manuellement');
}

// Gérer la sauvegarde d'un mot (Version améliorée avec synchronisation)
async function handleSaveWord(wordData, sendResponse) {
    try {
        console.log('Début de la sauvegarde pour:', wordData.word);
        
        const result = await chrome.storage.sync.get(['savedWords']);
        const savedWords = result.savedWords || {};
        
        // Préparer les données avec la structure complète
        const wordKey = wordData.word.toLowerCase().trim();
        const wordInfo = {
            userNote: wordData.userNote || '',
            translation: wordData.translation || '',
            example: wordData.example || '',
            // Nouvelles propriétés linguistiques
            wordType: wordData.wordType || '',
            languageRegister: wordData.languageRegister || '',
            frequency: wordData.frequency || '',
            etymology: wordData.etymology || '',
            // Nouvelles propriétés de personnalisation
            priority: wordData.priority || 0, // 0-5 étoiles
            tags: wordData.tags || [], // Array de tags générés par Gemini (max 3)
            // Métadonnées
            dateAdded: savedWords[wordKey]?.dateAdded || new Date().toISOString(),
            dateModified: new Date().toISOString(),
            reviewCount: (savedWords[wordKey]?.reviewCount || 0) + 1,
            originalWord: wordData.word // Garder la casse originale
        };
        
        savedWords[wordKey] = wordInfo;
        
        // Sauvegarder dans le stockage synchronisé
        await chrome.storage.sync.set({ savedWords });
        
        console.log('Mot sauvegardé avec succès dans le stockage:', wordData.word);
        
        // Envoyer la réponse immédiatement
        sendResponse({ 
            success: true, 
            data: wordInfo,
            message: 'Mot sauvegardé avec succès'
        });
        
        // Notifier tous les onglets en arrière-plan (sans bloquer la réponse)
        notifyAllTabsWordSaved(wordKey, wordInfo).catch(error => {
            console.warn('Erreur lors de la notification aux onglets:', error);
        });
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        
        // Gestion d'erreur spécifique pour les limites de stockage
        if (error.message && error.message.includes('QUOTA_BYTES_PER_ITEM')) {
            sendResponse({ 
                success: false, 
                error: 'Limite de stockage atteinte. Veuillez supprimer quelques mots sauvegardés.',
                errorType: 'STORAGE_QUOTA_EXCEEDED'
            });
        } else {
            sendResponse({ 
                success: false, 
                error: error.message || 'Erreur inconnue lors de la sauvegarde',
                errorType: 'SAVE_ERROR'
            });
        }
    }
}

// Gérer la récupération des mots sauvegardés (Version améliorée)
async function handleGetSavedWords(sendResponse) {
    try {
        const result = await chrome.storage.sync.get(['savedWords']);
        const savedWords = result.savedWords || {};
        
        // Ajouter des statistiques utiles
        const stats = {
            totalWords: Object.keys(savedWords).length,
            totalStorage: JSON.stringify(savedWords).length,
            lastModified: Math.max(...Object.values(savedWords).map(w => new Date(w.dateModified || w.dateAdded).getTime()))
        };
        
        sendResponse({ 
            success: true, 
            data: savedWords,
            stats: stats
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des mots:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Gérer la mise à jour de la clé API
async function handleUpdateApiKey(apiKey, sendResponse) {
    try {
        geminiApiKey = apiKey;
        await chrome.storage.sync.set({ geminiApiKey: apiKey });
        console.log('Clé API mise à jour');
        sendResponse({ success: true });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la clé API:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Gérer la récupération des statistiques du cache
async function handleGetCacheStats(sendResponse) {
    try {
        const stats = await getCacheStats();
        sendResponse({ success: true, data: stats });
    } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Gérer le vidage du cache
async function handleClearCache(sendResponse) {
    try {
        await clearCache();
        sendResponse({ success: true, message: 'Cache vidé avec succès' });
    } catch (error) {
        console.error('Erreur lors du vidage du cache:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Notifier tous les onglets qu'un mot a été sauvegardé
async function notifyAllTabsWordSaved(wordKey, wordInfo) {
    try {
        console.log('Notification de sauvegarde à tous les onglets pour:', wordKey);
        
        const tabs = await chrome.tabs.query({});
        const promises = tabs.map(async (tab) => {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'wordSaved',
                    word: wordKey,
                    data: wordInfo
                });
            } catch (error) {
                // Ignorer silencieusement les erreurs pour les onglets système
            }
        });
        
        await Promise.allSettled(promises);
        console.log(`Mot ${wordKey} synchronisé sur ${tabs.length} onglets`);
        
    } catch (error) {
        console.error('Erreur lors de la notification de sauvegarde:', error);
    }
}

// Supprimer un mot sauvegardé
async function handleDeleteWord(word, sendResponse) {
    try {
        const result = await chrome.storage.sync.get(['savedWords']);
        const savedWords = result.savedWords || {};
        
        const wordKey = word.toLowerCase().trim();
        
        if (!savedWords[wordKey]) {
            sendResponse({ 
                success: false, 
                error: 'Mot non trouvé dans les mots sauvegardés',
                errorType: 'WORD_NOT_FOUND'
            });
            return;
        }
        
        // Supprimer le mot
        delete savedWords[wordKey];
        
        // Sauvegarder les modifications
        await chrome.storage.sync.set({ savedWords });
        
        console.log('Mot supprimé avec succès:', word);
        
        // Notifier tous les onglets de la suppression
        await notifyAllTabsWordDeleted(wordKey);
        
        sendResponse({ 
            success: true, 
            message: 'Mot supprimé et synchronisé sur tous les onglets'
        });
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        sendResponse({ 
            success: false, 
            error: error.message,
            errorType: 'DELETE_ERROR'
        });
    }
}

// Notifier tous les onglets qu'un mot a été supprimé
async function notifyAllTabsWordDeleted(wordKey) {
    try {
        console.log('Notification de suppression à tous les onglets pour:', wordKey);
        
        const tabs = await chrome.tabs.query({});
        const promises = tabs.map(async (tab) => {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'wordDeleted',
                    word: wordKey
                });
            } catch (error) {
                // Ignorer silencieusement les erreurs
            }
        });
        
        await Promise.allSettled(promises);
        console.log(`Suppression de ${wordKey} synchronisée sur ${tabs.length} onglets`);
        
    } catch (error) {
        console.error('Erreur lors de la notification de suppression:', error);
    }
}

// Obtenir les statistiques de stockage
async function handleGetStorageStats(sendResponse) {
    try {
        const result = await chrome.storage.sync.get(['savedWords']);
        const savedWords = result.savedWords || {};
        
        const totalWords = Object.keys(savedWords).length;
        const storageSize = new Blob([JSON.stringify(savedWords)]).size;
        const maxSize = chrome.storage.sync.QUOTA_BYTES || 102400; // 100KB par défaut
        
        // Calculer les mots les plus fréquents
        const wordsByFrequency = Object.entries(savedWords)
            .sort((a, b) => (b[1].frequency || 0) - (a[1].frequency || 0))
            .slice(0, 10);
        
        // Calculer les mots récents
        const recentWords = Object.entries(savedWords)
            .sort((a, b) => new Date(b[1].dateModified || b[1].dateAdded) - new Date(a[1].dateModified || a[1].dateAdded))
            .slice(0, 10);
        
        const stats = {
            totalWords,
            storageSize,
            maxSize,
            storagePercentage: Math.round((storageSize / maxSize) * 100),
            topWords: wordsByFrequency.map(([word, data]) => ({
                word,
                frequency: data.frequency || 0,
                userNote: data.userNote
            })),
            recentWords: recentWords.map(([word, data]) => ({
                word,
                dateModified: data.dateModified || data.dateAdded,
                userNote: data.userNote
            }))
        };
        
        sendResponse({ success: true, data: stats });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        sendResponse({ 
            success: false, 
            error: error.message,
            errorType: 'STATS_ERROR'
        });
    }
}

// Exporter les mots sauvegardés
async function handleExportWords(sendResponse) {
    try {
        const result = await chrome.storage.sync.get(['savedWords']);
        const savedWords = result.savedWords || {};
        
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalWords: Object.keys(savedWords).length,
            words: savedWords
        };
        
        sendResponse({ 
            success: true, 
            data: exportData,
            message: 'Données exportées avec succès'
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'exportation:', error);
        sendResponse({ 
            success: false, 
            error: error.message,
            errorType: 'EXPORT_ERROR'
        });
    }
}

// Importer des mots sauvegardés
async function handleImportWords(importData, sendResponse) {
    try {
        if (!importData || !importData.words) {
            sendResponse({ 
                success: false, 
                error: 'Données d\'importation invalides',
                errorType: 'INVALID_IMPORT_DATA'
            });
            return;
        }
        
        const result = await chrome.storage.sync.get(['savedWords']);
        const currentWords = result.savedWords || {};
        
        let newWordsCount = 0;
        let updatedWordsCount = 0;
        
        // Fusionner les données
        for (const [wordKey, wordData] of Object.entries(importData.words)) {
            if (currentWords[wordKey]) {
                // Garder la date la plus récente
                const currentDate = new Date(currentWords[wordKey].dateModified || currentWords[wordKey].dateAdded);
                const importDate = new Date(wordData.dateModified || wordData.dateAdded);
                
                if (importDate > currentDate) {
                    currentWords[wordKey] = {
                        ...wordData,
                        dateModified: new Date().toISOString()
                    };
                    updatedWordsCount++;
                }
            } else {
                currentWords[wordKey] = {
                    ...wordData,
                    dateModified: new Date().toISOString()
                };
                newWordsCount++;
            }
        }
        
        // Sauvegarder les données fusionnées
        await chrome.storage.sync.set({ savedWords: currentWords });
        
        // Notifier tous les onglets de la mise à jour
        await notifyAllTabsWordsUpdated();
        
        sendResponse({ 
            success: true, 
            data: {
                newWords: newWordsCount,
                updatedWords: updatedWordsCount,
                totalWords: Object.keys(currentWords).length
            },
            message: `Importation réussie: ${newWordsCount} nouveaux mots, ${updatedWordsCount} mots mis à jour`
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'importation:', error);
        sendResponse({ 
            success: false, 
            error: error.message,
            errorType: 'IMPORT_ERROR'
        });
    }
}

// Notifier tous les onglets que les mots ont été mis à jour
async function notifyAllTabsWordsUpdated() {
    try {
        const tabs = await chrome.tabs.query({});
        const promises = tabs.map(async (tab) => {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'updateSavedWords'
                });
            } catch (error) {
                // Ignorer silencieusement les erreurs
            }
        });
        
        await Promise.allSettled(promises);
        console.log('Mise à jour des mots synchronisée sur tous les onglets');
        
    } catch (error) {
        console.error('Erreur lors de la notification de mise à jour:', error);
    }
}

// Gérer les changements d'état global
async function handleGlobalStateChanged(isActive, sender, sendResponse) {
    try {
        console.log('Propagation du changement d\'état global à tous les onglets:', isActive);
        
        // Obtenir tous les onglets
        const tabs = await chrome.tabs.query({});
        
        // Envoyer le message à tous les onglets sauf celui qui a envoyé le message initial
        const promises = tabs.map(async (tab) => {
            // Ne pas renvoyer le message à l'onglet qui l'a envoyé
            if (tab.id === sender.tab?.id) {
                return;
            }
            
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'globalStateChanged',
                    isActive: isActive
                });
            } catch (error) {
                // Ignorer les erreurs pour les onglets qui n'ont pas le content script
                console.log(`Onglet ${tab.id} n'a pas reçu le message (normal pour les onglets système)`);
            }
        });
        
        // Attendre que tous les messages soient envoyés
        await Promise.allSettled(promises);
        
        console.log(`État global synchronisé sur ${tabs.length} onglets`);
        sendResponse({ success: true, tabsNotified: tabs.length });
        
    } catch (error) {
        console.error('Erreur lors de la propagation de l\'état global:', error);
        sendResponse({ success: false, error: error.message });
    }
}
