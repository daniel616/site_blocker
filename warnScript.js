'use strict';

let confirmString = "I have taken time to think about what I am doing, and won't regret this later on.";

/* A fresh suffix each time the page loads, so the phrase cannot be memorised. */
let stringToMatch = confirmString + window.crypto.randomUUID();

document.getElementById("messageText").innerText = stringToMatch;

let confirmTxt = document.getElementById("confirmTxt");
confirmTxt.setAttribute("pattern", stringToMatch);
confirmTxt.onpaste = function () { return false; };

let allowForm = document.getElementById("allowForm");
let submitButton = allowForm.querySelector('input[type="submit"]');

/* The flagged site and the matching rule come from this page's URL parameters,
   with what was remembered for this tab as a fallback, so they survive a
   refresh or a back navigation. */
var context = {siteURL: '', reason: null};

loadRestrictionContext(window.location.search).then(function (loaded) {
    context = loaded;
    showRestrictionContext(context);
    recheckRestriction();

    if (context.siteURL === '' || context.reason === null
        || !context.reason.hasOwnProperty('exp')) {
        /* Without both the site and the rule there is nothing to lift the
           restriction on, so the override is not offered. */
        document.getElementById("messageLabel").innerText = "Override unavailable";
        document.getElementById("messageText").innerText =
            "This page is missing the details of the site it was opened for, so the "
            + "restriction cannot be lifted from here. Visit the site again to get a "
            + "working prompt.";
        confirmTxt.disabled = true;
        confirmTxt.required = false;
        document.getElementById("duration").disabled = true;
        submitButton.disabled = true;
        return;
    }

    allowForm.onsubmit = function () {
        let duration = document.getElementById("duration").value;
        console.log("redirect:", context.siteURL);
        chrome.runtime.sendMessage({
            disableFor: duration,
            restriction: context.reason.exp,
            redirect: context.siteURL
        });
        console.log("sent message");
        return false;
    };
});

/* The rule may have opened up since this page was shown, or the site may have
   been granted a temporary exemption in another tab. Re-check on every load and
   step out of the way once the site is allowed again. */
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
