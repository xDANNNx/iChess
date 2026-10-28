# iChess Desktop

Independent Windows-first chess workstation, developed separately from the hosted iChess website.

## Phase 1: desktop foundation
- Electron shell with context isolation, sandboxing, and Node integration disabled in the renderer.
- Local Vite-rendered interface and legal chessboard powered by `chess.js`.
- Local move history, undo, reset/new game, board flip, PGN copy, check/checkmate/draw state, and promotion choice.
- Windows installer (NSIS) and portable executable build targets.
- Automated rules smoke tests using Node's built-in test runner.

## Requirements
- Node.js 20 or newer and npm.
- Run `npm install`, `npm test`, and `npm run app:dev` from this folder.
- Build Windows installer and portable release with `npm run dist:win`.

The repository connector cannot execute the Windows packaging pipeline by itself. A successful GitHub commit does not mean an installer has been built or tested. Use a Windows CI runner to produce and verify release artifacts.

## Planned phases
1. Foundation and local board.
2. Bundle a licensed Stockfish engine and implement UCI analysis, multi-PV, evaluation graph, engine settings, and compliance notices/source offers.
3. Opening explorer, puzzle datasets, endgame trainer, and optional licensed local databases.
4. PGN library, search/indexing, annotations, tournament tools, and statistics.
5. Optional online accounts, matchmaking/challenges, realtime games, server/API design, abuse prevention, and privacy controls.
6. Release hardening, Windows CI, signing strategy, update channel, accessibility, and performance checks.

## Free software and data compliance
All included components and datasets must be reviewed individually before redistribution. Stockfish is GPL-3.0 and requires corresponding source-code/license obligations when distributed. Lichess database exports have their own published terms; the full game database is very large, so it should be packaged only after measuring installer size and validating the selected data license. Online service use must follow provider API limits and terms. See `THIRD_PARTY_NOTICES.md` before releasing binaries.

## Current status
This is a foundation scaffold, not a finished Ultimate chess suite. Online multiplayer, engine analysis, packaged datasets, installer generation, and Windows runtime validation are future work.
