'use strict';

/* blocked.html and warnPage.html used to be told which site was stopped, and by
   which rule, through a one-off chrome.tabs.sendMessage right after the redirect.
   That message arrives once, so refreshing the page or navigating back to it left
   it blank. Both facts now travel in the page's own URL instead, which survives
   reloads and back/forward navigation. */

let SITE_PARAM = 'site';
let REASON_PARAM = 'reason';

/* Build the address of a restriction page (service worker side). */
function restrictionPageURL(basePage, siteURL, reason) {
    let target = new URL(basePage);
    target.searchParams.set(SITE_PARAM, siteURL);
    if (reason !== undefined && reason !== null) {
        target.searchParams.set(REASON_PARAM, JSON.stringify(reason));
    }
    return target.href;
}

/* Read those parameters back (page side). Either may be missing, for instance
   when the page is opened directly, so both are optional. */
function readRestrictionContext(search) {
    let params = new URLSearchParams(search);
    var reason = null;
    let rawReason = params.get(REASON_PARAM);
    if (rawReason !== null) {
        try {
            reason = JSON.parse(rawReason);
        } catch (e) {
            console.log('could not parse the reason parameter:', rawReason, e);
        }
    }
    return {
        siteURL: params.get(SITE_PARAM) || '',
        reason: reason
    };
}

/* Fill in the shared #site and #explanation elements. */
function showRestrictionContext(context) {
    document.getElementById('site').innerText =
        context.siteURL || 'This page was opened without a site address.';
    document.getElementById('explanation').innerText =
        context.reason === null
            ? 'The rule that triggered this page is not available.'
            : JSON.stringify(context.reason, null, 2);
}

/* A restriction page should never be left with nothing to show, so what a tab
   was stopped for is also remembered against the tab id. The URL parameters
   stay the primary source: they survive a refresh, a back navigation, and the
   service worker being shut down. This is only the safety net for a page that
   is somehow reached without them. */

let TAB_CONTEXT_KEY = 'tabContext';

/* chrome.storage.session is unavailable on older Chrome; the pages still work
   from their parameters there, so treat it as optional. */
function sessionStore() {
    return (chrome.storage && chrome.storage.session) ? chrome.storage.session : null;
}

function rememberRestrictionContext(tabId, siteURL, reason) {
    let store = sessionStore();
    if (store === null) {
        return Promise.resolve();
    }
    return store.get([TAB_CONTEXT_KEY]).then(function (stored) {
        let contexts = stored[TAB_CONTEXT_KEY] || {};
        contexts[tabId] = {siteURL: siteURL, reason: reason};
        let obj = {};
        obj[TAB_CONTEXT_KEY] = contexts;
        return store.set(obj);
    });
}

function forgetRestrictionContext(tabId) {
    let store = sessionStore();
    if (store === null) {
        return Promise.resolve();
    }
    return store.get([TAB_CONTEXT_KEY]).then(function (stored) {
        let contexts = stored[TAB_CONTEXT_KEY] || {};
        if (!contexts.hasOwnProperty(tabId)) {
            return undefined;
        }
        delete contexts[tabId];
        let obj = {};
        obj[TAB_CONTEXT_KEY] = contexts;
        return store.set(obj);
    });
}

/* What the page should display: the parameters, filled in from what was
   remembered for this tab wherever they are missing. */
function loadRestrictionContext(search) {
    let context = readRestrictionContext(search);
    let store = sessionStore();
    if ((context.siteURL !== '' && context.reason !== null) || store === null) {
        return Promise.resolve(context);
    }

    return chrome.tabs.getCurrent().then(function (tab) {
        if (tab === undefined) {
            return context;
        }
        return store.get([TAB_CONTEXT_KEY]).then(function (stored) {
            let remembered = (stored[TAB_CONTEXT_KEY] || {})[tab.id];
            if (remembered === undefined) {
                return context;
            }
            console.log('parameters were missing, recovered context:', remembered);
            return {
                siteURL: context.siteURL || remembered.siteURL || '',
                reason: context.reason === null
                    ? (remembered.reason === undefined ? null : remembered.reason)
                    : context.reason
            };
        });
    }).catch(function (e) {
        console.log('could not recover the remembered context:', e);
        return context;
    });
}
