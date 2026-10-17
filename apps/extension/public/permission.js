const btn = document.getElementById('requestBtn');
const statusMsg = document.getElementById('statusMsg');
const hint = document.getElementById('hint');

async function requestMic() {
  btn.disabled = true;
  btn.innerText = 'Prompting permission...';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());

    statusMsg.className = 'status success';
    statusMsg.innerText = '✓ Microphone access granted! Returning to your meeting...';
    btn.style.display = 'none';
    hint.style.display = 'none';

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'MIC_PERMISSION_GRANTED' });
    }

    setTimeout(() => {
      window.close();
    }, 1200);
  } catch (err) {
    console.error('Permission error:', err);
    statusMsg.className = 'status error';
    statusMsg.innerHTML = 'Microphone permission was denied.<br/>Please click the camera/mic icon in the Chrome address bar to Allow access, then refresh.';
    btn.disabled = false;
    btn.innerText = 'Try Again';
  }
}

btn.addEventListener('click', requestMic);

// Auto-trigger on page load
window.addEventListener('DOMContentLoaded', () => {
  requestMic();
});
