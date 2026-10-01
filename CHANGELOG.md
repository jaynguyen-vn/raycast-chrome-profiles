# Chrome Profiles Changelog

## [Fix profile launch on macOS 27 / Chrome 154] - {PR_MERGE_DATE}

- Hand `--profile-directory` to a running Chrome through its binary instead of `open -na`, which stopped forwarding the flag; cold-start Chrome through `open -a`

## [Initial Version] - {PR_MERGE_DATE}

- List all Chrome profiles with custom names and Google account emails
- Display Google avatar for each profile
- Open Chrome with selected profile in one keystroke
- Auto-close Raycast after profile selection
