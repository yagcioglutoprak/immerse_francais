// ImmerseFrançais - Options Script
// Script pour la page de configuration de l'extension

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Page d\'options chargée');
    
    // Éléments DOM
    const apiKeyInput = document.getElementById('apiKey');
    const saveBtn = document.getElementById('saveBtn');
    const testBtn = document.getElementById('testBtn');
    const statusMessage = document.getElementById('statusMessage');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const refreshCacheBtn = document.getElementById('refreshCacheBtn');
    const clearCacheBtn = document.getElementById('clearCacheBtn');
    const cacheSize = document.getElementById('cacheSize');
    const lastUpdate = document.getElementById('lastUpdate');
    
    // Charger la configuration existante
    await loadConfiguration();
    await loadCacheStats();
    
    // Événements
    saveBtn.addEventListener('click', saveConfiguration);
    testBtn.addEventListener('click', testApiConnection);
    refreshCacheBtn.addEventListener('click', loadCacheStats);
    clearCacheBtn.addEventListener('click', clearCache);
    
    // Permettre la sauvegarde avec Entrée
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveConfiguration();
        }
    });
});

// Charger la configuration existante
async function loadConfiguration() {
    try {
        const result = await chrome.storage.sync.get(['geminiApiKey']);
        const apiKey = result.geminiApiKey || '';
        
        if (apiKey) {
            // Masquer partiellement la clé pour la sécurité
            document.getElementById('apiKey').value = apiKey;
            updateStatus(true, 'Clé API configurée');
        } else {
            updateStatus(false, 'Clé API non configurée');
        }
        
        console.log('Configuration chargée');
    } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        showMessage('Erreur lors du chargement de la configuration', 'error');
    }
}

// Sauvegarder la configuration
async function saveConfiguration() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const saveBtn = document.getElementById('saveBtn');
    
    if (!apiKey) {
        showMessage('Veuillez entrer une clé API', 'error');
        return;
    }
    
    try {
        // Désactiver le bouton pendant la sauvegarde
        saveBtn.disabled = true;
        saveBtn.textContent = 'Sauvegarde...';
        
        // Sauvegarder dans le stockage Chrome
        await chrome.storage.sync.set({ geminiApiKey: apiKey });
        
        // Notifier le background script de la mise à jour
        await chrome.runtime.sendMessage({
            action: 'updateApiKey',
            apiKey: apiKey
        });
        
        updateStatus(true, 'Clé API configurée');
        showMessage('Configuration sauvegardée avec succès !', 'success');
        
        console.log('Configuration sauvegardée');
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showMessage('Erreur lors de la sauvegarde: ' + error.message, 'error');
        updateStatus(false, 'Erreur de sauvegarde');
    } finally {
        // Réactiver le bouton
        saveBtn.disabled = false;
        saveBtn.textContent = 'Sauvegarder';
    }
}

// Tester la connexion à l'API
async function testApiConnection() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const testBtn = document.getElementById('testBtn');
    
    if (!apiKey) {
        showMessage('Veuillez entrer une clé API avant de tester', 'error');
        return;
    }
    
    try {
        // Désactiver le bouton pendant le test
        testBtn.disabled = true;
        testBtn.textContent = 'Test en cours...';
        
        // Tester avec un mot simple
        const testWord = 'bonjour';
        
        // Faire appel au background script pour tester l'API
        const response = await chrome.runtime.sendMessage({
            action: 'translateWord',
            word: testWord
        });
        
        if (response.success) {
            showMessage('✅ Connexion API réussie ! Traduction de test obtenue.', 'success');
            updateStatus(true, 'API fonctionnelle');
        } else {
            showMessage('❌ Erreur de connexion: ' + response.error, 'error');
            updateStatus(false, 'Erreur API');
        }
        
    } catch (error) {
        console.error('Erreur lors du test de l\'API:', error);
        showMessage('❌ Erreur lors du test: ' + error.message, 'error');
        updateStatus(false, 'Erreur de test');
    } finally {
        // Réactiver le bouton
        testBtn.disabled = false;
        testBtn.textContent = 'Tester la connexion';
    }
}

// Mettre à jour l'indicateur de statut
function updateStatus(isOk, message) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (isOk) {
        statusIndicator.className = 'status-indicator status-ok';
        statusText.textContent = message;
    } else {
        statusIndicator.className = 'status-indicator status-error';
        statusText.textContent = message;
    }
}

// Afficher un message de statut
function showMessage(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.classList.remove('hidden');
    
    // Masquer le message après 5 secondes
    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 5000);
}

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur JavaScript:', event.error);
    showMessage('Une erreur inattendue s\'est produite', 'error');
});

// Charger les statistiques du cache
async function loadCacheStats() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'getCacheStats'
        });
        
        if (response.success) {
            const stats = response.data;
            cacheSize.textContent = stats.size + ' mots';
            lastUpdate.textContent = new Date().toLocaleString('fr-FR');
        } else {
            cacheSize.textContent = 'Erreur';
            lastUpdate.textContent = 'Erreur de chargement';
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des stats du cache:', error);
        cacheSize.textContent = 'Erreur';
        lastUpdate.textContent = 'Erreur de connexion';
    }
}

// Vider le cache
async function clearCache() {
    const clearBtn = clearCacheBtn;
    
    if (!confirm('Êtes-vous sûr de vouloir vider le cache des traductions ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        // Désactiver le bouton pendant l'opération
        clearBtn.disabled = true;
        clearBtn.textContent = 'Vidage en cours...';
        
        const response = await chrome.runtime.sendMessage({
            action: 'clearCache'
        });
        
        if (response.success) {
            showMessage('✅ Cache vidé avec succès !', 'success');
            await loadCacheStats(); // Actualiser les stats
        } else {
            showMessage('❌ Erreur lors du vidage du cache: ' + response.error, 'error');
        }
        
    } catch (error) {
        console.error('Erreur lors du vidage du cache:', error);
        showMessage('❌ Erreur lors du vidage du cache: ' + error.message, 'error');
    } finally {
        // Réactiver le bouton
        clearBtn.disabled = false;
        clearBtn.textContent = 'Vider le cache';
    }
}

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur JavaScript:', event.error);
    showMessage('Une erreur inattendue s\'est produite', 'error');
});

// Gestion des promesses rejetées
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesse rejetée:', event.reason);
    showMessage('Erreur de connexion ou de traitement', 'error');
}); 