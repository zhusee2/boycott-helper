boycottList = [
  new RegExp("https?\\:\\/\\/www.google.com.tw")
]

function beforeNavHandler(event) {
  for (var i = 0; i < boycottList.length; i++) {
    if (event.url.match(boycottList[i]) && !confirm("您已經設定要抵制本網站。確定要繼續嗎？")) {
      event.preventDefault();
    }
  }
};

safari.application.addEventListener('beforeNavigate', beforeNavHandler);