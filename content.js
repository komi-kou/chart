let mermaidLoaded = false;

async function loadMermaid() {
  if (mermaidLoaded) return;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.onload = () => {
      mermaid.initialize({ 
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose'
      });
      mermaidLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function createDiagramModal(content) {
  const modal = document.createElement('div');
  modal.id = 'ai-diagram-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 90%;
    max-height: 90%;
    overflow: auto;
    position: relative;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  `;

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  `;

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = '#f0f0f0';
  });
  
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = 'transparent';
  });

  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = content;
  contentDiv.style.cssText = `
    margin-top: 20px;
    text-align: center;
  `;

  modalContent.appendChild(closeButton);
  modalContent.appendChild(contentDiv);
  modal.appendChild(modalContent);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.remove();
    }
  });

  return modal;
}

async function renderMermaidDiagram(mermaidCode) {
  try {
    await loadMermaid();
    
    const cleanCode = mermaidCode.replace(/```mermaid|```/g, '').trim();
    
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);
    
    const { svg } = await mermaid.render('ai-diagram-temp', cleanCode, tempDiv);
    
    document.body.removeChild(tempDiv);
    
    const modal = createDiagramModal(`
      <h3 style="margin: 0 0 20px 0; color: #333;">生成された図解</h3>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 4px; margin-bottom: 20px;">
        ${svg}
      </div>
      <details style="text-align: left; margin-top: 20px; padding: 10px; background: #f1f3f4; border-radius: 4px;">
        <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">Mermaidコード</summary>
        <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; font-size: 12px; line-height: 1.4; border: 1px solid #ddd;">${cleanCode}</pre>
      </details>
    `);
    
    document.body.appendChild(modal);
    
  } catch (error) {
    console.error('Mermaid レンダリングエラー:', error);
    showErrorMessage('図解の描画に失敗しました: ' + error.message);
  }
}

function showErrorMessage(message) {
  const modal = createDiagramModal(`
    <h3 style="margin: 0 0 20px 0; color: #d32f2f;">エラー</h3>
    <p style="color: #666; line-height: 1.6;">${message}</p>
  `);
  document.body.appendChild(modal);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('ai-diagram-modal');
    if (modal) {
      modal.remove();
    }
  }
});