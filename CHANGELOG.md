# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- The first public version of the game.
- Gamepad support: the d-pad or left stick steers, A or Start pauses and resumes.
- Crumbs fly off a biscuit when Spot licks it up. They are left out when the system asks for reduced motion.
- A gamepad with a motor rumbles on a crash and on a golden biscuit.
- **AI plays**: one press and Spot steers himself, using the Laya decision model on WebGPU. It is offered only moves that don't crash him and, when there are any, that bring him closer to the biscuit. The model (about 851 MB) is fetched from Hugging Face on first use and cached.
- `tests/logic.test.mjs`, a headless check that the AI is never offered a fatal move.
- `LICENSE` (MIT), `NOTICE`, `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue and pull request templates.

### Changed

- The font stylesheet no longer holds up the first paint. The page shows at once in the fallback fonts and switches when the web fonts arrive.
