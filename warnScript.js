/*let replacementChars = "!@#$%^&*()+=1234567890"


function randomizeString(st) {
    let sArray=Array.from(st);
    for (var i=0; i<10; i++){
        let idx=Math.floor(Math.random()*st.length);
        let replaceIndex= Math.floor(Math.random()*replacementChars.length);
        sArray[idx]=replacementChars[replaceIndex];
    }
    return sArray.join('');
}
*/

let confirmString="I have taken time to think about what I am doing, and won't regret this later on.";

let stringToMatch=confirmString+window.crypto.randomUUID();//randomizeString(confirmString);

var msgTxt = document.getElementById("messageText");
msgTxt.innerText=stringToMatch;

let confirmTxt=document.getElementById("confirmTxt");

confirmTxt.setAttribute("pattern", stringToMatch);
confirmTxt.onpaste= function() { return false};
//confirmTxt.setAttribute("onpaste", "return true;")



chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse){
        console.log("message:",request);
        var reason = JSON.stringify(request.reason);
        document.getElementById("site").innerText=request.origURL;

        document.getElementById("explanation").innerText=reason;
        document.getElementById("allowForm").onsubmit = function () {

            let duration=document.getElementById("duration").value;
            console.log("redirect:", request.origURL);
            chrome.runtime.sendMessage({
                disableFor:duration,
                restriction:request.reason.exp,
                redirect:request.origURL});
            console.log("sent message");
            return false;
        };

    }
);

console.log(chrome.runtime.onMessage);