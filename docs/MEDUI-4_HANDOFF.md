# MEDUI-4: in-app demo videos

Implemented locally on 28 October 2026 against the live Linear issue description and acceptance criteria. The linked SharePoint `DEMO_VIDEOS_SPEC.md` and reference implementation were not available locally and have not been reviewed. No Linear records were changed and nothing was committed or pushed.

## User flow

- Demos is part of the app shell, outside the page container keyed by `activePage`. Normal navigation and Go there keep the existing YouTube iframe playing.
- Exam routes, the mobile-unsupported screen, and the signed-out screen remove the dock and stop playback. Returning to another page offers the library again with saved progress, not automatic playback.
- Demos is on by default. The profile menu toggles it on/off. The library power button disables it and explains how to enable it again.
- The launcher shows a video icon and Demos label without a count badge.
- After 1.2 seconds, a page can prompt one unstarted video, once per viewer/media version. A prompt lasts 12 seconds and does not open over the library, a playing video, a hidden tab, or an existing modal at display time. Returning to the page may suggest another never-prompted video.
- The nonmodal library has five accordion sections: For this page (open by default), Recently watched, All videos, Question Bank and Skill Assessment. Only one section opens at a time; clicking it again collapses it. Headers include icons and counts, with Arrow keys/Home/End for focus and Enter/Space to toggle.
- Recently watched shows the five latest actually played videos, newest first, with resumable unfinished playback. Legacy progress without a timestamp enters this list when played again. Empty history has an explicit message.
- Playing collapses the library. All demos stops the current player and returns to the library. Close stops and saves playback, returning the launcher to the default corner.
- Player controls include S/M/L widths, fullscreen with a failure message, Go there, and replay/next-unwatched suggestions. Partial or skipped coverage does not claim full completion.
- Desktop handles support pointer drag, nearest-corner snap, arrow-key corner selection, resize by dragging or arrow keys, and Home/default-corner reset. Double-clicking the move handle resets the corner. On phones the panel is bottom-aligned/full width and handles are hidden.

## Video catalogue

Source playlists supplied by the user:

- Skill Assessment: https://www.youtube.com/playlist?list=PLShLy6-6Rnz8 (YouTube playlist title: Faculty Management)
- Question Bank: https://www.youtube.com/playlist?list=PLG88LHul4I1g (YouTube playlist title: Assessment Suite)

All fourteen video IDs and durations were checked against the playlist metadata. Catalogue order is intentional and differs from playlist order. The combined evaluation/approval video is labelled 05–06.

`src/config/demoVideos.js` owns summaries, order, page mappings and follow-along destinations. Sidebar labels are resolved from `appPages.js`. Follow-along links target usable entry pages rather than opening an editor without its required record.

`public/demo-videos.json` owns deployed media IDs, durations and optional transcript URLs. Serve an updated JSON file independently of the JS bundle to update media without rebuilding. `fetchDemoVideos` loads it asynchronously with no-cache and an abort signal. Do not rely on editing a developer's local copy to change an already deployed site.

```json
{
  "version": 1,
  "videos": {
    "skills-introduction": {
      "videoId": "O1MhhLe2MNc",
      "duration": 161
    }
  }
}
```

Media entries may also contain `transcriptUrl` (same-origin absolute path or HTTPS URL). Missing/invalid IDs render an unavailable row; they never load arbitrary iframe URLs. Changing a video ID starts fresh progress for that recording. Durations used for actual watch coverage come from the player; catalogue durations are library labels.

## Progress and identity

`demoVideoProgress.js` unions continuously played intervals. Replays do not double-count; seek jumps, paused intervals, hidden-tab time, and delayed samples do not earn coverage. Sampling is every 500ms; the player clock must advance consistently with elapsed time and playback rate. This is conservative browser telemetry, not tamper-proof certification.

- Watched requires at least 90% unique coverage and remains watched.
- Save every three seconds and on pause, end, close, switch, tab hiding and pagehide.
- Resume excludes the first/last five seconds.
- Storage key: `medsy-demo-videos-v1:<encoded viewer ID>`.
- Per-media key: `<catalogue ID>:<YouTube video ID>`.
- Stored shape: `{enabled, prompted, videos, storageError}`; each progress record is `{position, duration, ranges, started, watched, lastPlayedAt?} (optional Unix milliseconds)`.
- Storage failure falls back to memory and displays a message. Cross-tab preference changes are observed through storage events. There is no server sync or guaranteed simultaneous multi-tab transaction.
- The current app's default profile is a demo identity. Logbook account switches use the selected account ID and remount the dock, preventing playback/progress leakage between those sample identities. Production must supply the authenticated tenant/user identity consistently across all pages.

## Playback, accessibility and failure handling

The player uses `youtube-nocookie.com`, an explicit origin, referrer policy, and captions requested by default. The native iframe is created before the IFrame API loads; API failure leaves it playable but does not award unverified progress. Player/network failures provide Retry and a YouTube link. The link does not bypass institutional YouTube restrictions.

All fourteen videos reported automatic Hindi (`hi`, `asr`) caption tracks on 28 October. No reviewed caption files or transcripts were supplied. Caption accuracy, medical terminology and language suitability need content-owner review; upload corrected tracks in YouTube Studio or provide transcripts. The UI cannot create accurate captions from metadata.

Controls are labelled, keyboard focus is visible and restored on close, handles support keyboard operation, and the panel honours reduced motion. The library remains nonmodal rather than trapping focus away from the follow-along page. A dedicated boundary contains demo rendering failures.

## Backend and content handoff

- Replace browser storage with authenticated progress/preferences endpoints if completion is used for reports or must follow users across devices. Define conflict/version handling and an authoritative completion policy before using this as certification.
- A managed institution-hosted fallback requires hosted media, caption assets, authorisation, and a separate playback adapter. This implementation uses the approved explanatory-message/external-link fallback.
- Confirm the detailed SharePoint reference spec before final design sign-off.
- Content owners must decide the next recordings for assessments/blueprints, question approvals, Logbook and Student Management. This change adds the two supplied series only.
- Re-check durations and captions whenever recordings change.

## Verification

- Eleven focused Node tests: playback-only recency, interval union, seek exclusion, 90% completion, paused/throttled/rate-change handling, resume boundaries, fourteen-video runtime catalogue, unsafe configuration rejection, exam exclusion, viewer/media isolation and storage failure.
- ESLint passed for new demo modules and Navbar. Existing App/Sidebar lint findings are outside this feature.
- Production build passed with existing bundle-size and mixed-import warnings.
- Isolated Chrome with real YouTube playback: player time continued through page navigation and Go there while the iframe identity remained unchanged; seeking near the end remained unwatched.
- Browser acceptance passed: mobile library/player, S/M/L, keyboard resize and movement, pointer drag/snap, reset, viewport containment at 390/768/1024/1440px, light/dark rendering, preference persistence across reload, profile re-enable, exam/mobile-unsupported exclusion, automatic prompt expiry and native-iframe fallback when the IFrame API request was blocked.
- No production backend or live multi-user acceptance was performed.
- Final real-player checks also passed fullscreen entry/exit, end-of-video Up next, and Replay. Existing App/Sidebar lint remains five errors and one warning; no new demo-module lint failures.
