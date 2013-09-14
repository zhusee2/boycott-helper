/*
blackList = [
  "*.google.com.tw",
  "www.appledaily.com.tw/realtimenews/article/politics/*"
]
*/

blacklistJSON = safari.extension.settings.getItem("blacklist");

blacklist = JSON.parse(blacklistJSON);

// Black List Rules:
// 1. "*.bad.domain.com"
// 2. "bad-website.xxx/horrible/*"
// 3. "example.com"
// 4. "test.*.bad.domain.xxx/test/*/another/*"

function interpretBlackListRule(rule) {
  regExpRule = rule.replace(/^https?\:\/\//, ""); // Remove protocol
  regExpRule = regExpRule.replace(/\./g, "\\.");  // Escape dot (.)
  regExpRule = regExpRule.replace(/\//g, "\\/");  // Escape forward slash (/)

  // Replace "*" in domain part
  regExpRule = regExpRule.replace(/^\*/, "[^\\.\\/]+");
  regExpRule = regExpRule.replace(/\.\*\./g, "\\.[^\\.\\/]+\\.");
  regExpRule = regExpRule.replace(/(^[^\/]+\.)\*/, "$1[^\\.\\/]+");

  regExpRule = regExpRule.replace(/\/\*/g, "/[^\/]*") // Replace "*" in path part

  regExpRule = "https?\\:\\/\\/" + regExpRule;    // Prepend protocol

  return regExpRule;
}

function beforeNavHandler(event) {
  if (blacklist == null) return;

  console.log("Before heading to:", event.url);

  for (var i = 0; i < blacklist.length; i++) {
    var regExpRule = interpretBlackListRule(blacklist[i]);

    if ( event.url.match(regExpRule) ) {
      console.log("Blacklist Match:", blacklist[i]);

      if (!confirm("您已經設定要抵制本網站。確定要繼續嗎？")) { // User choose "Cancel"
        event.preventDefault();
      }
    }
  }
};

safari.application.addEventListener('beforeNavigate', beforeNavHandler);
