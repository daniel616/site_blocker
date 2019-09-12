'use strict';

let redirect=chrome.extension.getURL('blocked.html');

let barred=[
    {
        exp:"reddit",
		allowIf:{
			timeRanges:[[2030,2200]]
		}
    },
	{
		exp:"fandom"
	},
    {
        exp:"facebook.com",
		allowIf:{
			timeRanges:[[2030,2200]]
		}
    },
    {
        exp:"readms",
        allowIf:{
            monthDays:[2]
        }
    },
    {
        exp:"youtube",
        allowIf:{
            timeRanges:[[2030,2200]]
        }
    },
	{
		exp:"netflix",
		allowIf:{
			timeRanges:[[2030,2200]]
		}
	}];


function isBlocked(url) {
    for (var i=0; i<barred.length; i++){
        let currRule=barred[i];
        let regexp=currRule.exp;
        var pos = url.search(new RegExp(regexp, 'ig'));
        if (5<pos){
            if (currRule.hasOwnProperty("allowIf")
                && checkAllow(currRule.allowIf)){
                continue;
            }
            console.log(regexp+"is blocked");
            return true;
        }
    }

    return false;

}

function checkAllow(allowCond){
    let time=new Date();
    if(allowCond.hasOwnProperty("monthDays")){
        if (!(allowCond.monthDays.includes(time.getDate()))){
            return false;
        }
    }
    if(allowCond.hasOwnProperty("weekDays")) {
        let passed=allowCond.weekDays.includes(time.getDay());
        if(!passed) return false;
    }
    if(allowCond.hasOwnProperty("timeRanges")){
        var d = new Date();
        var n = d.toLocaleTimeString("default",{"hour12":false});
        n=n.split(":").slice(0,2).join("");
        let val=parseInt(n);
        var inRange=false;
        for(var i=0; i<allowCond.timeRanges.length; i++){
            let rngLo=allowCond.timeRanges[i][0], rngHi=allowCond.timeRanges[i][1];
            if (val>=rngLo && val<rngHi){
                inRange=true;
                break;
            }
        }
        if(!inRange){
            return false;
        }
    }

    if(allowCond.hasOwnProperty("bimonthly")&&allowCond.bimonthly){
        if (!(time.getDate().valueOf()===1&&time.getMonth().valueOf()%2===0)){
            return false;
        }
    }

    //TODO:finish debugging me
    return true;
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (isBlocked(tab.url)) {
        console.log("redirect to "+redirect);
        chrome.tabs.update(tabId,{url:redirect});
    }
});

