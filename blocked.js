console.log(chrome.runtime.onMessage);

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        console.log("message:",request);
        var reason = JSON.stringify(request.reason);

        let origURL=request.origURL;
        document.getElementById("site").innerText=origURL;
        document.getElementById("explanation").innerText=reason;
    }
);