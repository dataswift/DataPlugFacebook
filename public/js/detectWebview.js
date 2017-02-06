/*
 * Copyright (C) 2016 HAT Data Exchange Ltd - All Rights Reserved
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Written by Augustinas Markevicius <augustinas.markevicius@hatdex.org> 2016
 */

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
