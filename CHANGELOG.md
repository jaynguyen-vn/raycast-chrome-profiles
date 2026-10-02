# Chrome Profiles Changelog

## [Close Raycast while Chrome switches profiles] - {PR_MERGE_DATE}

- Close Raycast as soon as the profile switch is handed to Chrome instead of waiting for Chrome's hand-off helper, which can stall for seconds
- Ignore repeated Enter presses while a profile is opening so a single selection no longer opens several windows

## [Fix profile launch on macOS 27 / Chrome 154] - {PR_MERGE_DATE}

- Hand `--profile-directory` to a running Chrome through its binary instead of `open -na`, which stopped forwarding the flag; cold-start Chrome through `open -a`
- Explain and link to Full Disk Access when macOS blocks reading Chrome's data folder (macOS 27+) instead of claiming Chrome is not installed

## [Initial Version] - {PR_MERGE_DATE}

- List all Chrome profiles with custom names and Google account emails
- Display Google avatar for each profile
- Open Chrome with selected profile in one keystroke
- Auto-close Raycast after profile selection
