// ImmerseFrançais - Popup Script
// Script pour l'interface popup de l'extension

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup chargé');
    
    // Éléments DOM
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    const savedWordsCount = document.getElementById('savedWordsCount');
    const apiStatus = document.getElementById('apiStatus');
    const openOptionsBtn = document.getElementById('openOptionsBtn');
    const toggleExtensionBtn = document.getElementById('toggleExtensionBtn');
    
    // Charger et afficher les données
    await loadExtensionData();
    
    // Événements
    openOptionsBtn.addEventListener('click', openOptionsPage);
    toggleExtensionBtn.addEventListener('click', toggleCurrentTab);
});

// Charger les données de l'extension
async function loadExtensionData() {
    try {
        // Charger les mots sauvegardés
        const storageResult = await chrome.storage.sync.get(['savedWords', 'geminiApiKey']);
        const savedWords = storageResult.savedWords || {};
        const apiKey = storageResult.geminiApiKey || '';
        
        // Mettre à jour le nombre de mots sauvegardés
        const wordsCount = Object.keys(savedWords).length;
        document.getElementById('savedWordsCount').textContent = wordsCount;
        
        // Mettre à jour le statut de l'API
        const apiStatusElement = document.getElementById('apiStatus');
        if (apiKey) {
            apiStatusElement.textContent = 'Configurée';
            apiStatusElement.style.color = '#4CAF50';
        } else {
            apiStatusElement.textContent = 'Non configurée';
            apiStatusElement.style.color = '#F44336';
        }
        
        // Vérifier l'état de l'onglet actuel
        await checkCurrentTabState();
        
        console.log(`Données chargées: ${wordsCount} mots, API: ${apiKey ? 'configurée' : 'non configurée'}`);
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        updateStatus('Erreur de chargement', false);
    }
}

// Vérifier l'état de l'onglet actuel
async function checkCurrentTabState() {
    try {
        // Obtenir l'onglet actuel
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;
        
        // Créer la clé pour cet onglet
        const hostname = new URL(tab.url).hostname;
        const tabKey = `tabState_${hostname}`;
        
        // Charger l'état de l'onglet
        const result = await chrome.storage.local.get([tabKey]);
        const tabState = result[tabKey];
        
        const isActive = tabState && tabState.isActive;
        
        // Mettre à jour l'interface
        updateStatus(isActive ? 'Active sur cette page' : 'Inactive sur cette page', isActive);
        
        const toggleBtn = document.getElementById('toggleExtensionBtn');
        toggleBtn.textContent = isActive ? '⏸️ Désactiver' : '▶️ Activer';
        
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'état de l\'onglet:', error);
        updateStatus('État inconnu', false);
    }
}

// Mettre à jour le statut affiché
function updateStatus(message, isActive) {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    statusText.textContent = message;
    
    if (isActive) {
        statusIndicator.classList.remove('error');
    } else {
        statusIndicator.classList.add('error');
    }
}

// Ouvrir la page d'options
async function openOptionsPage() {
    try {
        await chrome.runtime.openOptionsPage();
        window.close(); // Fermer le popup
    } catch (error) {
        console.error('Erreur lors de l\'ouverture des options:', error);
        // Fallback: ouvrir dans un nouvel onglet
        chrome.tabs.create({ url: 'options.html' });
        window.close();
    }
}

// Basculer l'état de l'extension sur l'onglet actuel
async function toggleCurrentTab() {
    try {
        const toggleBtn = document.getElementById('toggleExtensionBtn');
        toggleBtn.disabled = true;
        toggleBtn.textContent = '⏳ En cours...';
        
        // Obtenir l'onglet actuel
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            throw new Error('Onglet actuel introuvable');
        }
        
        // Vérifier si c'est une page web normale
        if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) {
            updateStatus('Page non supportée', false);
            toggleBtn.disabled = false;
            toggleBtn.textContent = '❌ Non supporté';
            return;
        }
        
        // Créer la clé pour cet onglet
        const hostname = new URL(tab.url).hostname;
        const tabKey = `tabState_${hostname}`;
        
        // Charger l'état actuel
        const result = await chrome.storage.local.get([tabKey]);
        const currentState = result[tabKey];
        const wasActive = currentState && currentState.isActive;
        
        // Basculer l'état
        const newState = {
            isActive: !wasActive,
            timestamp: Date.now()
        };
        
        await chrome.storage.local.set({ [tabKey]: newState });
        
        // Envoyer un message au content script pour qu'il se mette à jour
        try {
            await chrome.tabs.sendMessage(tab.id, {
                action: 'updateState',
                isActive: newState.isActive
            });
        } catch (error) {
            // Le content script n'est peut-être pas encore chargé
            console.warn('Content script non disponible, rechargement de la page...');
            chrome.tabs.reload(tab.id);
        }
        
        // Mettre à jour l'interface
        updateStatus(
            newState.isActive ? 'Active sur cette page' : 'Inactive sur cette page',
            newState.isActive
        );
        
        toggleBtn.textContent = newState.isActive ? '⏸️ Désactiver' : '▶️ Activer';
        
        console.log(`État basculé pour ${hostname}: ${newState.isActive}`);
        
    } catch (error) {
        console.error('Erreur lors du basculement:', error);
        updateStatus('Erreur de basculement', false);
        
        const toggleBtn = document.getElementById('toggleExtensionBtn');
        toggleBtn.textContent = '❌ Erreur';
    } finally {
        const toggleBtn = document.getElementById('toggleExtensionBtn');
        toggleBtn.disabled = false;
    }
}

// Rafraîchir les données périodiquement
setInterval(async () => {
    await loadExtensionData();
}, 2000);

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur dans le popup:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesse rejetée dans le popup:', event.reason);
}); 