# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- **AI plays** now runs models trained on Spot's own decisions instead of the untrained base Laya. The default is [spot-snake-laya-multilingual-v0.1](https://huggingface.co/Lucasgitguy-co/spot-snake-laya-multilingual-v0.1) (about 680 MB); a new **Model** button switches to [spot-snake-d1-2B-v0.1](https://huggingface.co/Lucasgitguy-co/spot-snake-d1-2B-v0.1) (about 1.6 GB). Their browser graphs agree with the teacher on 100.00% and 98.95% of the 1,708 held-out test moves (measured with ONNX Runtime on CPU). The choice is remembered.
- `tests/logic.test.mjs` checks both input builders against token ids from each model's own Python code (`tests/fixtures/`).

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
