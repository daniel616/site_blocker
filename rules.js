'use strict';

/* Rule evaluation, shared by the service worker and by the restriction pages.
   The pages re-run it on load so that a page shown earlier does not keep
   standing in the way once its rule has opened up again. */

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
            var blockStatus = BLOCK;
            if (currRule.hasOwnProperty("warnOnly") && currRule.warnOnly) {
                blockStatus = WARN;
            }
            console.log("URL ",url," is restricted because of rule ", currRule);

            return {
                value: blockStatus,
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

function timeToInt(t){
    let x=t.split(":")[0];
    let y = t.split(":")[1];
    return parseInt(x)*100+parseInt(y);
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
            let rngLo = timeToInt(allowCond.timeRanges[i][0]), rngHi = timeToInt(allowCond.timeRanges[i][1]);
            console.log("val lo hi", val, rngLo, rngHi);
            if (val >= rngLo && val < rngHi) {
                return true;
            }
        }
    }

    return false;
}

function epochMins(){
    let t = new Date().getTime();
    return t/(60*1000);
}

/* What should happen for this site right now? Resolves to the same
   {value, reason} shape blockResult returns, except that a warning the user
   has already answered counts as allowed until its exemption runs out. */
function restrictionForURL(siteURL) {
    var url;
    try {
        url = new URL(siteURL);
    } catch (e) {
        return Promise.resolve({value: ALLOW});
    }
    if (!(url.protocol.includes("http"))) {
        return Promise.resolve({value: ALLOW});
    }

    return chrome.storage.sync.get(['rules']).then(function (response) {
        var rules = response['rules'];
        if (rules === undefined) {
            console.log("form retrieval fail:", chrome.runtime.lastError);
            rules = [];
        } else {
            console.log("successful form retrieval:", rules);
        }

        let result = blockResult(url.hostname, rules);
        console.log("Domain:", url.hostname, "Result:", result);
        if (result.value !== WARN) {
            return result;
        }

        let exp = result.reason.exp;
        return chrome.storage.local.get([exp]).then(function (stored) {
            let curlim = stored[exp];
            if (curlim !== undefined && epochMins() <= curlim) {
                return {value: ALLOW};
            }
            return result;
        });
    });
}
