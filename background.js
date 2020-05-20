'use strict';

let blockPage = chrome.extension.getURL('blocked.html');
let warnPage = chrome.extension.getURL('warnPage.html');

let ALLOW = 'A';
let BLOCK = 'B';
let WARN = 'W';

function blockResult(url,barred) {
    for (var i = 0; i < barred.length; i++) {
        let currRule = barred[i];
        let regexp = currRule.exp;
        var pos = url.search(new RegExp(regexp, 'ig'));
        if (5 < pos) {
            if (currRule.hasOwnProperty("allowIf")
                && checkAllow(currRule.allowIf)) {
                continue;
            }
            var value = BLOCK;
            if (currRule.hasOwnProperty("warnOnly") && currRule.warnOnly) {
                value = WARN;
            }
            return {
                value: value,
                reason: currRule,
            };


        }
    }

    return {
        value: ALLOW
    };
}

function getTimeArray(){
    var d = new Date();
    var n = d.toLocaleTimeString("default", {"hour12": false});
    return n.split(":");
}

function checkAllow(allowCond) {
    let time = new Date();
    if (allowCond.hasOwnProperty("monthDays")) {
        if (!(allowCond.monthDays.includes(time.getDate()))) {
            return false;
        }
    }
    if (allowCond.hasOwnProperty("weekDays")) {
        let passed = allowCond.weekDays.includes(time.getDay());
        if (!passed) return false;
    }
    if (allowCond.hasOwnProperty("timeRanges")) {
        let n = getTimeArray().slice(0,2).join("");
        let val = parseInt(n);
        var inRange = false;
        for (var i = 0; i < allowCond.timeRanges.length; i++) {
            let rngLo = allowCond.timeRanges[i][0], rngHi = allowCond.timeRanges[i][1];
            if (val >= rngLo && val < rngHi) {
                inRange = true;
                break;
            }
        }
        if (!inRange) {
            return false;
        }
    }

    if (allowCond.hasOwnProperty("bimonthly") && allowCond.bimonthly) {
        if (!(time.getDate().valueOf() === 1 && time.getMonth().valueOf() % 2 === 0)) {
            return false;
        }
    }

    //TODO:finish debugging me
    return true;
}

var m_history={};

var disableTil={};

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (!(tab.hasOwnProperty('url'))) {
        return;
    }

    chrome.storage.sync.get(['rules'],function(response) {
        console.log('rules:',response);
        var rules;
        if(chrome.runtime.lastError===undefined){
            rules= response['rules'];
            console.log("successful form retrieval:", rules);
        }else{

            console.log("form retrieval fail:",chrome.runtime.lastError);
            rules= [];
        }
        console.log("response:",response);


        let result = blockResult(tab.url,rules);
        if(result.value===ALLOW){
            return;
        }
        result.destUrl=tab.url;


        if (result.value === BLOCK) {
            //console.log("redirect to "+blockPage);
            chrome.tabs.update(tabId, {url: blockPage});
        } else if (result.value === WARN) {
            let exp = result.reason.exp;
            let curlim=localStorage.getItem(exp);
            if(curlim!==null&&epochMins()<=curlim){
                return;
            }
            chrome.tabs.update(tabId, {url: warnPage}, function (t) {
                var listener = function (tabId, changeInfo, tab2) {
                    if (tabId === t.id && tab2.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        chrome.tabs.sendMessage(tabId, result);
                    }
                };
                chrome.tabs.onUpdated.addListener(listener);


            });

        }


    });
});

function epochMins(){
    let t = new Date().getTime();
    return t/(60*1000);
}

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse) {
        let exp = request.restriction;
        let duration= parseInt(request.disableFor);
        let redirect= request.redirect;
        let t = new Date().getTime();
        let curmin=t/(60*1000);
        localStorage.setItem(exp,curmin+duration);
        //disableTil[exp]=curmin+duration;
        chrome.tabs.update(sender.tab.id, {url: redirect});
        //sender.tab

    }
);