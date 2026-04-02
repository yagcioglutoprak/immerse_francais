import { db } from '../lib/db';
import { analyzeWord } from '../lib/gemini';
import { detectFrenchPage, isLikelyFrench } from '../lib/french';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  async main() {
    let profile = await db.profile.toCollection().first();

    // Auto-create profile if none exists (allows highlighting before onboarding)
    if (!profile) {
      await db.profile.add({
        onboardingComplete: false,
        highlightMode: 'all',
        dailyGoal: 10,
        totalXp: 0,
        currentStreak: 0,
        lastActiveDate: null,
        apiKey: '',
      });
      profile = await db.profile.toCollection().first();
    }

    if (profile?.highlightMode === 'off') return;

    // Only activate on French-language pages
    const frenchConfidence = detectFrenchPage();
    if (frenchConfidence < 0.3) return;

    const savedWords = new Set(
      (await db.words.toArray()).map((w) => w.word.toLowerCase())
    );

    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const isDarkPage = isDarkBackground(bgColor);

    // Walk text nodes and wrap French words
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'INPUT'].includes(tag)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (parent.closest('.immerse-word-highlight, .immerse-modal-root')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.textContent && /[a-z\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ef\u00ee\u00f4\u00f9\u00fb\u00fc\u00ff\u00e7]{2,}/i.test(node.textContent)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        },
      }
    );

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    for (let i = 0; i < textNodes.length; i += 50) {
      const batch = textNodes.slice(i, i + 50);
      for (const textNode of batch) {
        highlightWords(textNode, savedWords, isDarkPage, profile.highlightMode);
      }
      if (i + 50 < textNodes.length) {
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    // Handle word clicks
    let modalRoot: HTMLDivElement | null = null;

    document.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('immerse-word-highlight')) return;

      e.preventDefault();
      e.stopPropagation();

      const word = target.textContent?.trim();
      if (!word) return;

      const parent = target.parentElement;
      const context = parent?.textContent?.substring(0, 200) ?? '';

      if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.className = 'immerse-modal-root';
        modalRoot.style.cssText = 'position:absolute;z-index:10001;pointer-events:none;';
        document.body.appendChild(modalRoot);
      }

      const rect = target.getBoundingClientRect();
      modalRoot.style.top = `${rect.bottom + window.scrollY + 8}px`;
      modalRoot.style.left = `${Math.max(16, Math.min(rect.left + window.scrollX, window.innerWidth - 496))}px`;
      modalRoot.style.pointerEvents = 'auto';

      const shadow = modalRoot.shadowRoot ?? modalRoot.attachShadow({ mode: 'open' });

      // Clear previous content safely
      while (shadow.firstChild) shadow.removeChild(shadow.firstChild);

      const style = document.createElement('style');
      style.textContent = getModalStyles(isDarkPage);
      shadow.appendChild(style);

      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Instrument+Serif&display=swap';
      shadow.appendChild(fontLink);

      const container = document.createElement('div');
      container.className = 'immerse-modal';
      shadow.appendChild(container);

      // Build loading state with DOM methods
      buildLoadingState(container, word);

      // Close on outside click
      const closeHandler = (ev: MouseEvent) => {
        if (!shadow.contains(ev.target as Node)) {
          modalRoot!.style.pointerEvents = 'none';
          while (shadow.lastChild) shadow.removeChild(shadow.lastChild);
          document.removeEventListener('click', closeHandler);
        }
      };
      setTimeout(() => document.addEventListener('click', closeHandler), 100);

      try {
        const existing = await db.words.where('word').equalsIgnoreCase(word).first();
        if (existing) {
          buildModal(container, existing, true);
          return;
        }

        const analysis = await analyzeWord(word, context);
        const wordData = {
          word,
          ...analysis,
          tags: [],
          note: '',
          sourceUrl: window.location.href,
          sourceTitle: document.title,
          priority: 0,
          createdAt: new Date(),
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReview: new Date(),
          lastReview: null,
        };
        buildModal(container, wordData, false);
      } catch (err) {
        while (container.firstChild) container.removeChild(container.firstChild);
        const header = buildHeader(container, word);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'modal-error';
        errorDiv.textContent = err instanceof Error && err.message.includes('API key')
          ? 'Please configure your Gemini API key in Settings.'
          : 'Failed to analyze word. Try again.';
        container.appendChild(errorDiv);
      }
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'CHECK_DUE_WORDS') {
        db.words.where('nextReview').belowOrEqual(new Date()).count().then((count) => {
          sendResponse({ dueCount: count });
        });
        return true;
      }
    });
  },
});

function buildLoadingState(container: HTMLElement, word: string) {
  while (container.firstChild) container.removeChild(container.firstChild);
  buildHeader(container, word);
  const loading = document.createElement('div');
  loading.className = 'modal-loading';
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  loading.appendChild(spinner);
  const text = document.createElement('span');
  text.textContent = 'Analyzing...';
  loading.appendChild(text);
  container.appendChild(loading);
}

function buildHeader(container: HTMLElement, word: string): HTMLElement {
  const header = document.createElement('div');
  header.className = 'modal-header';
  const wordEl = document.createElement('span');
  wordEl.className = 'modal-word';
  wordEl.textContent = word;
  header.appendChild(wordEl);
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '\u00d7';
  closeBtn.addEventListener('click', () => {
    const root = container.closest('.immerse-modal-root') as HTMLElement;
    if (root) root.style.pointerEvents = 'none';
    const shadow = root?.shadowRoot;
    if (shadow) while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
  });
  header.appendChild(closeBtn);
  container.appendChild(header);
  return header;
}

function buildModal(container: HTMLElement, word: any, isSaved: boolean) {
  while (container.firstChild) container.removeChild(container.firstChild);

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';
  const wordEl = document.createElement('span');
  wordEl.className = 'modal-word';
  wordEl.textContent = word.word;
  header.appendChild(wordEl);

  const audioBtn = document.createElement('button');
  audioBtn.className = 'modal-audio';
  audioBtn.setAttribute('aria-label', 'Listen');
  audioBtn.textContent = '\u266a';
  audioBtn.addEventListener('click', () => {
    chrome.tts?.speak(word.word, { lang: 'fr-FR', rate: 0.9 });
  });
  header.appendChild(audioBtn);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = '\u00d7';
  closeBtn.addEventListener('click', () => {
    const root = container.closest('.immerse-modal-root') as HTMLElement;
    if (root) root.style.pointerEvents = 'none';
    const shadow = root?.shadowRoot;
    if (shadow) while (shadow.firstChild) shadow.removeChild(shadow.firstChild);
  });
  header.appendChild(closeBtn);
  container.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'modal-body';

  // Left column
  const left = document.createElement('div');
  left.className = 'modal-left';

  // Definition
  const defSection = document.createElement('div');
  defSection.className = 'modal-section';
  const defLabel = document.createElement('div');
  defLabel.className = 'modal-label';
  defLabel.textContent = 'Definition';
  defSection.appendChild(defLabel);
  const defContent = document.createElement('div');
  defContent.className = 'modal-content';
  const posStrong = document.createElement('strong');
  posStrong.textContent = word.partOfSpeech + '. ';
  defContent.appendChild(posStrong);
  defContent.appendChild(document.createTextNode(word.definition));
  defSection.appendChild(defContent);
  left.appendChild(defSection);

  // Example
  if (word.example) {
    const exSection = document.createElement('div');
    exSection.className = 'modal-section';
    const exLabel = document.createElement('div');
    exLabel.className = 'modal-label';
    exLabel.textContent = 'Example';
    exSection.appendChild(exLabel);
    const exContent = document.createElement('div');
    exContent.className = 'modal-example';
    exContent.appendChild(document.createTextNode('"' + word.example + '"'));
    if (word.exampleTranslation) {
      const trans = document.createElement('div');
      trans.className = 'modal-translation';
      trans.textContent = word.exampleTranslation;
      exContent.appendChild(trans);
    }
    exSection.appendChild(exContent);
    left.appendChild(exSection);
  }

  // Tags
  const tags = document.createElement('div');
  tags.className = 'modal-tags';
  const tagPos = document.createElement('span');
  tagPos.className = 'tag-pos';
  tagPos.textContent = word.partOfSpeech;
  tags.appendChild(tagPos);
  const tagLevel = document.createElement('span');
  tagLevel.className = 'tag-level';
  tagLevel.textContent = word.cefrLevel;
  tags.appendChild(tagLevel);
  if (!isSaved) {
    const tagXp = document.createElement('span');
    tagXp.className = 'tag-xp';
    tagXp.textContent = '+5 XP';
    tags.appendChild(tagXp);
  }
  left.appendChild(tags);
  body.appendChild(left);

  // Right column
  const right = document.createElement('div');
  right.className = 'modal-right';

  if (word.etymology) {
    right.appendChild(buildInfoRow('*', 'Etymology', word.etymology, true));
  }
  if (word.conjugation) {
    right.appendChild(buildInfoRow('\u2261', 'Conjugation', word.conjugation, true));
  }
  if (word.related?.length) {
    right.appendChild(buildInfoRow('\u00bb', 'Related', word.related.join(', '), false));
  }
  body.appendChild(right);
  container.appendChild(body);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'modal-save';
  saveBtn.textContent = isSaved ? '\u2713 Already Saved' : '\u2713 Save to Vocabulary';
  if (isSaved) {
    saveBtn.disabled = true;
    saveBtn.classList.add('saved');
  } else {
    saveBtn.addEventListener('click', async () => {
      try {
        await db.words.add({
          ...word,
          createdAt: new Date(),
          nextReview: new Date(),
          lastReview: null,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
        });
        const profile = await db.profile.toCollection().first();
        if (profile?.id) {
          await db.profile.update(profile.id, { totalXp: (profile.totalXp ?? 0) + 5 });
        }
        saveBtn.textContent = '\u2713 Saved!';
        saveBtn.classList.add('saved');
        saveBtn.disabled = true;
      } catch {
        saveBtn.textContent = 'Error saving';
      }
    });
  }
  footer.appendChild(saveBtn);
  container.appendChild(footer);
}

function buildInfoRow(icon: string, label: string, value: string, isMono: boolean): HTMLElement {
  const row = document.createElement('div');
  row.className = 'info-row';
  const iconEl = document.createElement('div');
  iconEl.className = 'info-icon';
  iconEl.textContent = icon;
  row.appendChild(iconEl);
  const content = document.createElement('div');
  content.className = 'info-content';
  const labelEl = document.createElement('div');
  labelEl.className = 'info-label';
  labelEl.textContent = label;
  content.appendChild(labelEl);
  const valueEl = document.createElement('div');
  valueEl.className = isMono ? 'info-value mono' : 'info-value';
  valueEl.textContent = value;
  content.appendChild(valueEl);
  row.appendChild(content);
  return row;
}

function highlightWords(textNode: Text, savedWords: Set<string>, isDarkPage: boolean, mode: string) {
  const text = textNode.textContent;
  if (!text) return;
  const frenchWordRegex = /[a-z\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ef\u00ee\u00f4\u00f9\u00fb\u00fc\u00ff\u00e7]+/gi;
  const matches = [...text.matchAll(frenchWordRegex)];
  if (matches.length === 0) return;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  for (const match of matches) {
    const word = match[0];
    const index = match.index!;
    if (word.length < 3) continue;
    if (!isLikelyFrench(word)) continue;
    if (index > lastIndex) fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
    const isSaved = savedWords.has(word.toLowerCase());
    if (mode === 'saved' && !isSaved) {
      fragment.appendChild(document.createTextNode(word));
    } else {
      const span = document.createElement('span');
      span.className = `immerse-word-highlight ${isSaved ? 'saved' : 'not-saved'}`;
      span.textContent = word;
      if (isDarkPage) {
        span.style.cssText = isSaved
          ? 'background:rgba(74,222,128,0.1);border-bottom:1px solid rgba(74,222,128,0.25);cursor:pointer;transition:all 0.15s;padding:1px 2px;border-radius:2px;'
          : 'background:rgba(92,184,232,0.08);border-bottom:1px solid rgba(92,184,232,0.2);cursor:pointer;transition:all 0.15s;padding:1px 2px;border-radius:2px;';
      } else {
        span.style.cssText = isSaved
          ? 'background:rgba(34,197,94,0.08);border-bottom:1px solid rgba(34,197,94,0.2);cursor:pointer;transition:all 0.15s;padding:1px 2px;border-radius:2px;'
          : 'background:rgba(27,73,101,0.06);border-bottom:1px solid rgba(27,73,101,0.15);cursor:pointer;transition:all 0.15s;padding:1px 2px;border-radius:2px;';
      }
      fragment.appendChild(span);
    }
    lastIndex = index + word.length;
  }
  if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  textNode.parentNode?.replaceChild(fragment, textNode);
}

function isDarkBackground(bgColor: string): boolean {
  const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return false;
  return (0.299 * +match[1] + 0.587 * +match[2] + 0.114 * +match[3]) / 255 < 0.5;
}

function getModalStyles(isDark: boolean): string {
  const bg = isDark ? '#1C1917' : '#FFFFFF';
  const bgAlt = isDark ? '#292524' : '#F3F2EE';
  const border = isDark ? '#3D3835' : '#E5E3DD';
  const text = isDark ? '#F5F0EA' : '#1A1A1A';
  const textMuted = isDark ? '#A8A29E' : '#6B6860';
  const textLight = isDark ? '#78716C' : '#9B978E';
  const primary = isDark ? '#5CB8E8' : '#1B4965';
  const accent = isDark ? '#F0906E' : '#E8734A';
  return `
    .immerse-modal { font-family:'DM Sans',system-ui,sans-serif; background:${bg}; border:1px solid ${border}; border-radius:12px; box-shadow:0 8px 32px ${isDark?'rgba(0,0,0,0.4)':'rgba(26,26,26,0.12)'}; padding:12px; width:480px; max-width:calc(100vw - 32px); color:${text}; animation:me 250ms ease-out; }
    @keyframes me { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
    .modal-header { display:flex; align-items:center; gap:8px; padding-bottom:10px; border-bottom:1px solid ${border}; margin-bottom:10px; }
    .modal-word { font-family:'Instrument Serif',Georgia,serif; font-size:24px; color:${primary}; flex:1; }
    .modal-audio,.modal-close { width:28px; height:28px; border-radius:50%; border:1px solid ${border}; background:${bg}; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; color:${textMuted}; transition:all 0.15s; }
    .modal-audio:hover,.modal-close:hover { border-color:${primary}; background:${bgAlt}; }
    .modal-close { border:none; font-size:18px; }
    .modal-body { display:grid; grid-template-columns:1.3fr 1fr; gap:10px; }
    .modal-left { display:flex; flex-direction:column; gap:8px; }
    .modal-section { }
    .modal-label { font-size:10px; font-weight:600; color:${textLight}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px; }
    .modal-content { background:${bgAlt}; border:1px solid ${border}; border-radius:8px; padding:8px 10px; font-size:13px; line-height:1.5; }
    .modal-example { background:${bgAlt}; border:1px solid ${border}; border-radius:8px; padding:8px 10px; font-size:12px; line-height:1.5; color:${textMuted}; font-style:italic; }
    .modal-translation { font-style:normal; color:${textLight}; margin-top:4px; font-size:11px; }
    .modal-tags { display:flex; gap:6px; flex-wrap:wrap; }
    .tag-pos { display:inline-flex; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; background:${isDark?'rgba(92,184,232,0.1)':'rgba(27,73,101,0.08)'}; color:${primary}; }
    .tag-level { display:inline-flex; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; background:${isDark?'rgba(240,144,110,0.15)':'rgba(232,115,74,0.15)'}; color:${accent}; }
    .tag-xp { display:inline-flex; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:700; background:#FFF4D6; color:#B45309; }
    .modal-right { background:${bgAlt}; border:1px solid ${border}; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:8px; }
    .info-row { display:flex; align-items:flex-start; gap:6px; }
    .info-icon { font-size:12px; width:16px; text-align:center; color:${textLight}; flex-shrink:0; margin-top:1px; }
    .info-content { flex:1; }
    .info-label { font-size:9px; font-weight:600; color:${textLight}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:1px; }
    .info-value { font-size:11px; color:${text}; font-weight:500; }
    .info-value.mono { font-family:'JetBrains Mono','Courier New',monospace; font-size:10px; color:${primary}; }
    .modal-footer { margin-top:10px; padding-top:10px; border-top:1px solid ${border}; }
    .modal-save { width:100%; background:${accent}; color:white; border:none; padding:9px; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; box-shadow:0 2px 8px ${isDark?'rgba(240,144,110,0.2)':'rgba(232,115,74,0.2)'}; }
    .modal-save:hover { opacity:0.9; transform:translateY(-1px); }
    .modal-save.saved { background:${isDark?'#4ADE80':'#22C55E'}; cursor:default; }
    .modal-save:disabled { opacity:0.7; cursor:default; transform:none; }
    .modal-loading { display:flex; align-items:center; justify-content:center; gap:8px; padding:40px; color:${textMuted}; font-size:13px; }
    .spinner { width:16px; height:16px; border:2px solid ${border}; border-top-color:${primary}; border-radius:50%; animation:spin 1s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    .modal-error { padding:16px; color:${isDark?'#F87171':'#EF4444'}; background:${isDark?'rgba(248,113,113,0.1)':'#FEF2F2'}; border-radius:8px; font-size:13px; text-align:center; }
  `;
}
