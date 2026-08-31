// extract_ik.js
// Runs in the MAIN world to extract the session token and send it back to the ISOLATED world
(function() {
  const ik = (window.GLOBALS && window.GLOBALS[9]) || window._GM_ik || null;
  window.postMessage({ type: 'SHIELDMAIL_IK', ik: ik }, '*');
})();
