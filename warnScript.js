//alert('content srippt');
console.log("domm:",document);
console.log(chrome.runtime.onMessage);

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        console.log("message:",request);
        var reason = JSON.stringify(request.reason);

        document.getElementById("explanation").innerText=reason;
        document.getElementById("continue").onclick = function () {
            location.href = request.destUrl;
        };

    }
);