'use strict';

importScripts('pageContext.js', 'rules.js');

let blockPage = chrome.runtime.getURL('blocked.html');
let warnPage = chrome.runtime.getURL('warnPage.html');

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    /* onUpdated fires for anything about a tab: several times per page load, and
       again for title, favicon, mute, pin and discard changes. Only the events
       that carry a navigation are worth looking at. */
    if (changeInfo.url === undefined && changeInfo.status !== 'loading') {
        return;
    }

    /* A tab reports its address in stages. changeInfo.url is a URL that has just
       committed, tab.pendingUrl is the one the tab is on its way to, and tab.url
       is the one it is showing, which is still the PREVIOUS page while a
       navigation is in flight. Any of them can be missing or an empty string,
       and an empty or stale address is what leaves the restriction page with
       nothing to show. */
    let siteURL = changeInfo.url || tab.pendingUrl || tab.url || '';
    if (siteURL === '') {
        return;
    }

    restrictionForURL(siteURL).then(function (result) {
        if (result.value !== BLOCK && result.value !== WARN) {
            return;
        }
        let page = (result.value === BLOCK) ? blockPage : warnPage;

        /* The site and the rule ride along in the page's URL, so the page can
           rebuild itself, and re-check itself, on a refresh or a back
           navigation. They are also remembered against the tab, so the page has
           something to fall back on if it is ever reached without them. */
        rememberRestrictionContext(tabId, siteURL, result.reason).then(function () {
            console.log(siteURL, result.reason);
            chrome.tabs.update(tabId,
                {url: restrictionPageURL(page, siteURL, result.reason)});
        });
    });
});

chrome.tabs.onRemoved.addListener(function (tabId) {
    forgetRestrictionContext(tabId);
});

chrome.runtime.onMessage.addListener(
    function(request,sender,sendResponse) {
        console.log(request,sender,sendResponse);
        let exp = request.restriction;
        let duration= parseInt(request.disableFor);
        let redirect= request.redirect;
        let obj={};
        obj[exp]=epochMins()+duration;
        chrome.storage.local.set(obj).then(() => {
            console.log("redirecting to",redirect,"in tab",sender.tab.id);
            chrome.tabs.update(sender.tab.id, {url: redirect});
        });
    }
);
