console.log(chrome.runtime.onMessage);

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        console.log("message:",request);
        var reason = JSON.stringify(request.reason);
        let origURL=request.origURL;
        document.getElementById("site").innerText=origURL;

        document.getElementById("explanation").innerText=reason;
        document.getElementById("continue").onclick = function () {
            let duration=document.getElementById("duration").value;
            chrome.runtime.sendMessage({
                disableFor:duration,
                restriction:request.reason.exp,
                redirect:request.destUrl});
            //location.href = request.destUrl;
        };

    }
);