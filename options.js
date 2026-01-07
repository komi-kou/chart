document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  
  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
});

async function loadSettings() {
  try {
    const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
    
    if (geminiApiKey) {
      document.getElementById('apiKey').value = geminiApiKey;
    }
  } catch (error) {
    console.error('設定の読み込みエラー:', error);
    showError('設定の読み込みに失敗しました。');
  }
}

async function saveSettings(event) {
  event.preventDefault();
  
  const apiKey = document.getElementById('apiKey').value.trim();
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');
  
  hideMessages();
  
  if (!apiKey) {
    showError('APIキーを入力してください。');
    return;
  }
  
  if (!apiKey.startsWith('AIza')) {
    showError('有効なGemini APIキーを入力してください。');
    return;
  }
  
  try {
    await testApiKey(apiKey);
    
    await chrome.storage.sync.set({ geminiApiKey: apiKey });
    
    showSuccess('設定が正常に保存されました！');
  } catch (error) {
    console.error('設定保存エラー:', error);
    showError(`設定の保存に失敗しました: ${error.message}`);
  }
}

async function testApiKey(apiKey) {
  const testPrompt = 'こんにちは';
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: testPrompt
        }]
      }]
    })
  });
  
  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('APIキーが無効です。正しいキーを入力してください。');
    } else if (response.status === 403) {
      throw new Error('APIキーの権限が不足しています。');
    } else {
      throw new Error(`APIテスト失敗 (${response.status})`);
    }
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('APIの応答が予期しない形式です。');
  }
}

function showSuccess(message) {
  const successElement = document.getElementById('successMessage');
  successElement.textContent = message;
  successElement.style.display = 'block';
  
  setTimeout(() => {
    successElement.style.display = 'none';
  }, 5000);
}

function showError(message) {
  const errorElement = document.getElementById('errorMessage');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  setTimeout(() => {
    errorElement.style.display = 'none';
  }, 8000);
}

function hideMessages() {
  document.getElementById('successMessage').style.display = 'none';
  document.getElementById('errorMessage').style.display = 'none';
}