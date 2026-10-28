# Third-party notices and distribution checklist

No Stockfish binary or third-party dataset is bundled in Phase 1.

Before distributing a release:
- `chess.js`: include its actual package license and version in release notices.
- Stockfish (planned): GPL-3.0. Include the GPL text and the exact corresponding source or a valid offer/pointer satisfying the license for the shipped engine binary; publish applicable source for modifications.
- Lichess puzzle/evaluation/game datasets (planned): verify the specific dataset page, license, attribution, and redistribution conditions. The open database page identifies some exports as CC0, but that does not automatically make every Lichess asset CC0.
- Any additional engine, tablebase, font, icon, or opening book: document its exact version, origin, license, notices, and redistribution permissions.
- Online APIs: obey authentication, rate limits, fair-play rules, terms of service, and privacy requirements.

Do not advertise a component as included until the exact version and license have been verified and it is present in the release build.
