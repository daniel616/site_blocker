

let confirmString="I have taken time to think about what I am doing, and won't regret this later on";

function randomizeString(st) {
    let sArray=Array.from(st);
    for (var i=0; i<3; i++){
        let idx=Math.floor(Math.random()*st.length);
        let digit= Math.floor(Math.random()*10);
        sArray[idx]=digit;
    }
    return sArray.join('');
}


let stringToMatch=randomizeString(confirmString);

var msgTxt = document.getElementById("messageText");
msgTxt.innerText=stringToMatch;

let confirmTxt=document.getElementById("confirmTxt");

confirmTxt.setAttribute("pattern", stringToMatch);
confirmTxt.setAttribute("onpaste", "return true;")


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
            location.href = request.destUrl;
        };

    }
);

console.log(chrome.runtime.onMessage);