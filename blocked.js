'use strict';

/* The blocked site and the rule that stopped it come from this page's own URL
   parameters, with what was remembered for this tab as a fallback, so a refresh
   or a back navigation still shows them. */
var context = {siteURL: '', reason: null};

loadRestrictionContext(window.location.search).then(function (loaded) {
    context = loaded;
    showRestrictionContext(context);
    recheckRestriction();
});

/* The rule may have opened up since this page was shown: a time range may have
   started, or the day may have rolled over. Re-check on every load, and hand
   the tab back to the site once it is allowed again. The site replaces this
   page in the history, so going back still leads where it did before. */
function recheckRestriction() {
    if (context.siteURL === '') {
        return;
    }
    restrictionForURL(context.siteURL).then(function (result) {
        if (result.value === ALLOW) {
            console.log("no longer restricted, returning to", context.siteURL);
            window.location.replace(context.siteURL);
        }
    });
}

/* A back or forward navigation may restore this page from the cache without
   running the script again. */
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        recheckRestriction();
    }
});
