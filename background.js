'use strict';

let blockPage = chrome.extension.getURL('blocked.html');
let warnPage = chrome.extension.getURL('warnPage.html');

let ALLOW = 'A';
let BLOCK = 'B';
let WARN  = 'W';

function blockResult(url,barred) {
    for (var i = 0; i < barred.length; i++) {
        let currRule = barred[i];
        if (url.includes(currRule.exp)) {
            if (currRule.hasOwnProperty("allowIf")
                && checkAllow(currRule.allowIf)) {
                continue;
            }
            var value = BLOCK;
            if (currRule.hasOwnProperty("warnOnly") && currRule.warnOnly) {
                value = WARN;
            }
            console.log("URL ",url," restricted because of rule ", currRule);

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

//TODO: make true if any of the subconditions are correct
function checkAllow(allowCond) {
    let time = new Date();
    if (allowCond.hasOwnProperty("monthDays")) {
        if (allowCond.monthDays.includes(time.getDate())) {
            return true;
        }
    }
    if (allowCond.hasOwnProperty("weekDays")) {
        let passed = allowCond.weekDays.includes(time.getDay());
        if (passed) return true;
    }
    if (allowCond.hasOwnProperty("timeRanges")) {
        let n = getTimeArray().slice(0,2).join("");
        let val = parseInt(n);
        for (var i = 0; i < allowCond.timeRanges.length; i++) {
            let rngLo = allowCond.timeRanges[i][0], rngHi = allowCond.timeRanges[i][1];
            if (val >= rngLo && val < rngHi) {
                return true;
            }
        }
    }

    return false;
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (!(tab.hasOwnProperty('url'))) {
        return;
    }

    chrome.storage.sync.get(['rules'],function(response) {
        console.log('rules:',response);
        var rules=response['rules'];
        if(rules===undefined){
            console.log("form retrieval fail:",chrome.runtime.lastError);
            rules= [];
        }else{
            console.log("successful form retrieval:", rules);
        }
        console.log("response:",response);

        let url = new URL(tab.url);
        if(!(url.protocol.includes("http"))) return;
        let domain = url.hostname;

        let result = blockResult(domain,rules);
        console.log("Domain:",domain,"Result:",result);

        if(result.value===ALLOW){
            return;
        }
        result.origURL=domain;

        if (result.value === BLOCK) {
            chrome.tabs.update(tabId, {url: blockPage}, function (t) {
                var listener = function (tabId, changeInfo, tab2) {
                    if (tabId === t.id && tab2.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        chrome.tabs.sendMessage(tabId, result);
                    }
                };
                chrome.tabs.onUpdated.addListener(listener)
            });
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