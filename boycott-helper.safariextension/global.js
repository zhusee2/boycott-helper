var BoycottHelper = {};

function reloadBlacklist() {
  blacklistJSON = safari.extension.settings.getItem("blacklist");

  if (blacklistJSON == null) {
    BoycottHelper.blacklist = [];
  } else {
    BoycottHelper.blacklist = JSON.parse(blacklistJSON);
  }

  console.log("Blacklist reloaded.");
}

function addRuleToBlacklist(newRule) {
  console.log("Add new Blacklist:", newRule);
  BoycottHelper.blacklist.push(newRule);
  safari.extension.settings.setItem("blacklist", JSON.stringify(BoycottHelper.blacklist));
}

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
  var blacklist = BoycottHelper.blacklist;
  if (blacklist == null) return;

  console.log("Before heading to:", event.url);

  for (var i = 0; i < blacklist.length; i++) {
    var blacklistRule = blacklist[i],
        regExpRule = interpretBlackListRule(blacklistRule);

    if ( event.url.match(regExpRule) ) {
      console.log("Blacklist Match:", blacklistRule);
      event.preventDefault();

      var encodedRule = encodeURI(blacklistRule),
          warningPageUrl = safari.extension.baseURI + "warning.html",
          currentActiveTab = safari.application.activeBrowserWindow.activeTab;

      currentActiveTab.url = warningPageUrl;

      setTimeout(function() {
        var blacklistWarning = {
          rule: blacklistRule,
          url: event.url
        }
        console.log(blacklistWarning);
        currentActiveTab.page.dispatchMessage("blacklistWarning", blacklistWarning);
      }, 100);
    }
  }
};

function commandHandler(commandEvent) {
  switch (commandEvent.command) {
    case "addToBlacklist":
      var currentUrl = safari.application.activeBrowserWindow.activeTab.url,
          currentDomain = currentUrl.match(/\:\/\/([^\/]+)/)[1],
          newBlacklistRule = prompt("您確定要抵制此網站？", currentDomain);

      if (newBlacklistRule != null) {
        addRuleToBlacklist(newBlacklistRule);
      }
      break;

    case "editBlacklist":
      var newTab = safari.application.activeBrowserWindow.openTab();
      newTab.url = safari.extension.baseURI + "settings.html";
      break;

    default:
      break;
  }
}

function messageHandler(messageEvent) {
  switch (messageEvent.name) {
    case "getBlacklist":
      var blacklistString = safari.extension.settings.getItem("blacklist");

      if (blacklistString != null) {
        blacklistString = blacklistString.replace(/^\[/, "[\n");
        blacklistString = blacklistString.replace(/\,/g, ",\n");
        blacklistString = blacklistString.replace(/\]$/, "\n]");
      }

      messageEvent.target.page.dispatchMessage("blacklist", blacklistString);
      break;

    case "updateBlacklist":
      safari.extension.settings.setItem("blacklist", messageEvent.message);
      break;

    case "allowOnce":
      console.log(messageEvent.message);
      break;
  }
}

reloadBlacklist();
safari.application.addEventListener("beforeNavigate", beforeNavHandler);
safari.application.addEventListener("command", commandHandler);
safari.application.addEventListener("message", messageHandler);
safari.extension.settings.addEventListener("change", reloadBlacklist);

