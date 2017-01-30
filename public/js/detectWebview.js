// If iOS webview detected, redirect the user back to the native app

var standalone = window.navigator.standalone,
    userAgent = window.navigator.userAgent.toLowerCase(),
    safari = /safari/.test(userAgent),
    ios = /iphone|ipod|ipad/.test(userAgent);

if (ios) {
  if (!standalone && safari) {
    showRumpelLite(); // Safari browser, do nothing
  } else if (standalone && !safari) {
    // Standalone
  } else if (!standalone && !safari) {
    // UIWebView
  }
} else {
  // Not iOS, do nothing
}

function showRumpelLite() {
  var link = document.getElementById("rumpel-lite-link");

  // link.href = "rumpellocationtrackerapp://dataplugsapphost/";
  // link.text = "Back to Rumpel Lite";
  link.className = "btn btn-teal";
}
