chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ai-diagram-parent',
    title: 'AIテキスト図解メーカー',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ai-diagram-flowchart',
    parentId: 'ai-diagram-parent',
    title: 'フローチャート',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ai-diagram-mindmap',
    parentId: 'ai-diagram-parent',
    title: 'マインドマップ',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'ai-diagram-sequence',
    parentId: 'ai-diagram-parent',
    title: 'シーケンス図',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith('ai-diagram-')) {
    const diagramType = getDiagramType(info.menuItemId);
    
    const [tab_] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab_.id },
      function: getSelectedText
    });
    
    const selectedText = results[0].result;
    
    if (!selectedText) {
      console.error('テキストが選択されていません');
      return;
    }

    try {
      const mermaidCode = await generateDiagram(selectedText, diagramType);
      
      await chrome.scripting.executeScript({
        target: { tabId: tab_.id },
        func: renderMermaidDiagram,
        args: [mermaidCode]
      });
    } catch (error) {
      console.error('図解生成エラー:', error);
      await chrome.scripting.executeScript({
        target: { tabId: tab_.id },
        func: showErrorMessage,
        args: [error.message]
      });
    }
  }
});

function getSelectedText() {
  return window.getSelection().toString();
}

function getDiagramType(menuItemId) {
  const typeMap = {
    'ai-diagram-flowchart': 'フローチャート',
    'ai-diagram-mindmap': 'マインドマップ',
    'ai-diagram-sequence': 'シーケンス図'
  };
  return typeMap[menuItemId] || 'フローチャート';
}

async function generateDiagram(text, diagramType) {
  const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
  
  if (!geminiApiKey) {
    throw new Error('Gemini APIキーが設定されていません。オプションページで設定してください。');
  }

  const prompt = `以下のテキストを、Mermaid.jsの ${diagramType} 形式で要約・構造化してください。ノードは日本語で、簡潔に表現してください。\n\nテキスト：${text}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API エラー: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Gemini APIからの応答が不正です');
  }

  return data.candidates[0].content.parts[0].text;
}