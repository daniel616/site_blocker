console.log(chrome.runtime.onMessage);

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        console.log("message:",request);
        var reason = JSON.stringify(request.reason);
        document.getElementById("explanation").innerText=reason;
    }
);