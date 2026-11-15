"""Builds tests/fixtures/{laya,d1}.json for the golden tests in tests/logic.test.mjs.

Input: the reference rows written by the models' own Python pipelines (conversion/laya_eval.py
in Lucasgitguy-co/spot-snake-laya-multilingual-v0.1, conversion/d1_eval.py in
Lucasgitguy-co/spot-snake-d1-2B-v0.1) and each model's tokenizer.json. For every text the
game's JS builders encode, it stores the Python tokenizer's ids, so the test can run the JS
builders on a lookup table and compare with the reference ids, with no tokenizer in Node.

  python make_fixtures.py LAYA_ROWS LAYA_TOKENIZER D1_ROWS D1_TOKENIZER OUT_DIR
SPDX-License-Identifier: MIT"""
import json, sys
from pathlib import Path
from tokenizers import Tokenizer

laya_rows, laya_tok, d1_rows, d1_tok, out = sys.argv[1:6]
out = Path(out)
CODES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def table(tok, texts):
    return {t: tok.encode(t, add_special_tokens=False).ids for t in texts}


# Laya: the builder encodes ' ' + option, 'choice question: ' + ask and the state.
d = json.loads(Path(laya_rows).read_text())
tok = Tokenizer.from_file(laya_tok)
rows = []
for r in d["rows"]:
    texts = [" " + o for o in r["options"]] + ["choice question: " + r["ask"], r["state"]]
    rows.append({k: r[k] for k in ("state", "ask", "moves", "options", "ids", "markers")} | {"pieces": table(tok, texts)})
(out / "laya.json").write_text(json.dumps({"special": d["special"], "max_len": d["max_len"],
                                           "head_max_len": d["head_max_len"], "rows": rows}) + "\n")

# d1: the builder encodes the whole turn, the part after "QUESTION:\n", and the option codes.
d = json.loads(Path(d1_rows).read_text())
tok = Tokenizer.from_file(d1_tok)
rows = []
for r in d["rows"]:
    prefix = "<|startoftext|><|im_start|>user\n" + r["state"] + "\n\n\nQUESTION:\n"
    suffix = (r["ask"] + "\n\nOptions:\n" + "".join(f"{CODES[i]} {o}\n" for i, o in enumerate(r["options"]))
              + "\nReply with the option code only.<|im_end|>\n<|im_start|>assistant\n<think></think>")
    codes = [c for i in range(len(r["options"])) for c in (CODES[i], " " + CODES[i])]
    rows.append({k: r[k] for k in ("state", "ask", "moves", "options", "ids", "question_ids", "slot_positions", "readout")}
                | {"pieces": table(tok, [prefix + suffix, suffix] + codes)})
(out / "d1.json").write_text(json.dumps({"rows": rows}) + "\n")
print("laya", len(json.loads((out / "laya.json").read_text())["rows"]), "d1", len(rows))
