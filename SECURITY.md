# Security policy

## Reporting a vulnerability

Please report security problems privately, not in a public issue.

Use GitHub's private reporting form: <https://github.com/Gitguy268/spot-snake/security/advisories/new>

Include what you found, how to reproduce it, and the browser and version you used. You should get a reply within a week. Please give the fix time to ship before you publish details.

## Scope

It is a static page. It has no server and no accounts, and it keeps its data in the browser's own storage. The game is one HTML file. It saves the high score in `localStorage`, and the only network request it makes is for two web fonts from Google Fonts. The most useful reports are about anything else that makes the page send data off the device.

## Supported versions

Only the latest version on the `main` branch is supported.
