#!/usr/bin/env python3
"""
extract_fsi.py  v3 final
Extracts vocabulary and dialogue data from the FSI Amharic Basic Course OCR texts.

Sources:
  Vol 1 (Units 1-50): Basic Sentences sections -> paragraph-aligned dialogue pairs
  Vol 2 (Glossary, pages 970+): romanization -> English vocab entries

Structural insight:
  The two-column print layout is serialised in the OCR as:
    [all left-column (English) content]  ...DOUBLE BLANK...  [all right-column (Amharic) content]
  within each Basic Sentences block. Paragraphs align 1-to-1 across the two halves.
"""

import re, json

VOL1 = "/mnt/user-data/uploads/Fsi-AmharicBasicCourse-Volume1-StudentText_djvu.txt"
VOL2 = "/mnt/user-data/uploads/Fsi-AmharicBasicCourse-Volume2-StudentText_djvu.txt"

# ─── Shared helpers ──────────────────────────────────────────────────────────

def has_non_ascii(s):
    return any(ord(c) >= 128 for c in s)

_SKIP_RE = re.compile(
    r"^\s*(?:AMHARIC|AMPHARIC|AMPNRIC|BASIC COURSE|UNIT \d+|Unit \d+|\d+)\s*$",
    re.IGNORECASE,
)
_HARD_GARBAGE = re.compile(r"[*\\|{}^~]|(?:[/]{2,})|(?:[0-9]{3,})")
_VOWELS       = re.compile(r"[aeiou9]", re.IGNORECASE)

def is_garbled_fidel(s):
    """Detect garbled Ethiopic OCR content."""
    if has_non_ascii(s): return True
    if _HARD_GARBAGE.search(s): return True
    tokens = s.split()
    if not tokens: return False
    # Many single-char tokens → OCR artifact
    single = sum(1 for t in tokens if len(t) == 1 and t.isalpha())
    if len(tokens) >= 3 and single / len(tokens) > 0.40:
        return True
    # 2+ consonant-only short tokens (not doubled-consonant pairs)
    # e.g. "ft", "wnc" = garbled; "mm", "ss", "KK" are valid Amharic
    def is_bare_consonant(tok):
        return (1 <= len(tok) <= 3 and tok.isalpha()
                and not _VOWELS.search(tok)
                and not (len(tok) == 2 and tok[0].lower() == tok[1].lower()))  # keep doubled
    bare_count = sum(1 for t in tokens if is_bare_consonant(t))
    if bare_count >= 2:
        return True
    # High special-char density
    non_alnum = sum(1 for c in s if not c.isalnum() and c not in " '-/.,;:()?!")
    if len(s) > 4 and non_alnum / len(s) > 0.35:
        return True
    return False

def is_skip(line):
    s = line.strip()
    if not s: return False
    return has_non_ascii(s) or bool(_SKIP_RE.match(s)) or is_garbled_fidel(s)

def clean(s):
    return re.sub(r"\s+", " ", s).strip()

# ─── Part 1: Glossary from Volume 2 ─────────────────────────────────────────

_ROM_CHARS    = re.compile(r"^[a-zA-Z9'\s\-/\(\)\[\]\.]+$")
_VERB_FORM    = re.compile(r"\s-\s*m[a9]")
_EJECTIVE_MID = re.compile(r"[a-z][TKSCP][a-z9]")
_SCHWA        = re.compile(r"(?<=[a-zA-Z])9(?=[a-zA-Z])")

def is_romanization(s):
    s = s.strip()
    if not s or has_non_ascii(s) or not _ROM_CHARS.match(s): return False
    if is_garbled_fidel(s): return False      # <-- added: filter garbled tokens
    if _SCHWA.search(s):        return True
    if _VERB_FORM.search(s):    return True
    if _EJECTIVE_MID.search(s): return True
    return False

def is_english_def(s):
    s = s.strip()
    if not s or has_non_ascii(s) or is_skip(s) or is_romanization(s): return False
    if not (s[0].isalpha() or s[0] == "("): return False
    return True


def extract_glossary(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = [l.rstrip("\n") for l in f]

    start = next((i for i, l in enumerate(lines) if l.strip() == "970"), 0)

    entries, i = [], start
    while i < len(lines):
        s = lines[i].strip()
        if not s or is_skip(lines[i]):
            i += 1; continue

        if is_romanization(s):
            verb_form, romanization = None, s
            if " - " in s:
                parts = s.split(" - ", 1)
                romanization, verb_form = parts[0].strip(), parts[1].strip()

            j, eng_parts = i + 1, []
            while j < len(lines):
                ns = lines[j].strip()
                if not ns:
                    if eng_parts: break
                    j += 1; continue
                if is_skip(lines[j]) or has_non_ascii(ns):
                    j += 1; continue
                if is_romanization(ns): break
                if is_english_def(ns):
                    eng_parts.append(ns)
                    j += 1
                    if len(eng_parts) >= 2 and not ns.endswith(","):
                        break
                else:
                    j += 1
                    if eng_parts: break

            if eng_parts and len(romanization) >= 2:
                english = clean(" ".join(eng_parts))
                if len(english) >= 3:
                    entries.append({
                        "romanization": romanization,
                        "english": english,
                        "verb_infinitive": verb_form,
                    })
            i = j
        else:
            i += 1

    return entries


# ─── Part 2: Basic Sentences dialogue pairs from Volume 1 ───────────────────

_UNIT_RE   = re.compile(r"^Unit\s+(\d+)\s*$")
_BS_RE     = re.compile(r"^Basic Sentences\s*$", re.IGNORECASE)
_SECEND_RE = re.compile(
    r"^(Note\s+\d|Drills|Grammatical|Classroom|UNIT\s+\d)", re.IGNORECASE)


def split_columns(lines):
    """
    Find the double-blank gap nearest the midpoint of the block.
    Returns (english_lines, amharic_lines).
    """
    n = len(lines)
    blanks, i = [], 0
    while i < n - 1:
        if not lines[i].strip() and not lines[i+1].strip():
            start = i
            while i < n and not lines[i].strip():
                i += 1
            blanks.append((start, i))
        else:
            i += 1
    if not blanks: return lines, []
    mid = n // 2
    best = min(blanks, key=lambda b: abs(b[0] - mid))
    return lines[:best[0]], lines[best[1]:]


def to_paragraphs(lines):
    paras, cur = [], []
    for l in lines:
        s = l.strip()
        if not s:
            if cur: paras.append(cur); cur = []
        elif not is_skip(l):
            cur.append(s)
    if cur: paras.append(cur)
    return paras


def extract_dialogues(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = [l.rstrip("\n") for l in f]

    units_data = []
    current_unit, in_bs, collecting = None, False, []

    def flush():
        nonlocal collecting
        if not collecting or current_unit is None:
            collecting = []; return
        en_lines, am_lines = split_columns(collecting)
        en_paras = to_paragraphs(en_lines)
        am_paras = to_paragraphs(am_lines)
        pairs = []
        for ep, ap in zip(en_paras, am_paras):
            eng = clean(" ".join(ep))
            amh = clean(" ".join(ap))
            if eng and amh:
                # Classify pair type for downstream filtering:
                #   "gloss"    = single words / short phrases (< 3 words in English)
                #   "sentence" = a full dialogue exchange (3+ words, ends with punctuation)
                is_sent = (len(eng.split()) >= 3 and (eng[-1] in ".?!" or amh[-1] in ".?!"))
                pairs.append({
                    "english": eng,
                    "amharic": amh,
                    "type": "sentence" if is_sent else "gloss",
                })
        if pairs:
            units_data.append({"unit": current_unit, "pairs": pairs})
        collecting = []

    for line in lines:
        s = line.strip()
        m = _UNIT_RE.match(s)
        if m:
            unit_num = int(m.group(1))
            if unit_num != current_unit:
                flush(); current_unit = unit_num; in_bs = False
            continue
        if _BS_RE.match(s):
            flush(); in_bs = True; continue
        if in_bs and _SECEND_RE.match(s):
            in_bs = False; continue
        if in_bs:
            collecting.append(line)

    flush()
    return units_data


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("Extracting glossary from Volume 2...")
    vocab = extract_glossary(VOL2)
    print(f"  -> {len(vocab)} vocab entries")

    print("Extracting Basic Sentences from Volume 1...")
    dialogues = extract_dialogues(VOL1)
    total    = sum(len(u["pairs"]) for u in dialogues)
    n_sent   = sum(1 for u in dialogues for p in u["pairs"] if p["type"] == "sentence")
    print(f"  -> {len(dialogues)} units, {total} pairs  ({n_sent} full sentences)")

    cards, cid = [], 1

    for e in vocab:
        rom, eng = e["romanization"], e["english"]
        if not (2 <= len(rom) <= 80 and 3 <= len(eng) <= 250): continue
        back = f"{eng}  [inf: {e['verb_infinitive']}]" if e.get("verb_infinitive") else eng
        cards.append({"id": cid, "front": rom, "back": back,
                      "audio_key": None, "module_id": 3})
        cid += 1

    for unit in dialogues:
        for p in unit["pairs"]:
            eng, amh = p["english"], p["amharic"]
            if len(eng) < 2 or len(amh) < 2: continue
            cards.append({"id": cid, "front": amh, "back": eng,
                          "audio_key": None, "module_id": 5,
                          "source_unit": unit["unit"],
                          "pair_type": p["type"]})
            cid += 1

    output = {
        "_meta": {
            "source": "FSI Amharic Basic Course (1964) — public domain",
            "volumes": [
                "Vol 1 Units 1-50 Basic Sentences  ->  dialogue + gloss pairs (module_id 5)",
                "Vol 2 Glossary pages 970+          ->  romanization/English vocab (module_id 3)",
            ],
            "romanization_system": (
                "FSI 1964 notation. "
                "'9' = schwa vowel (ə). "
                "Uppercase T / K / S / C / P = ejective consonants. "
                "Doubled consonants are phonemically distinct: "
                "ala (he said) vs alla (he exists)."
            ),
            "fidel_included": False,
            "fidel_note": (
                "Ethiopic script (Fidel) columns were present in the original but the "
                "OCR output was too degraded to include reliably. All content is "
                "romanized Amharic only. Fidel can be added programmatically using "
                "a romanization-to-Fidel lookup table."
            ),
            "alignment_note": (
                "Dialogue pairs are extracted by paragraph alignment within each "
                "Basic Sentences block. Short single-word pairs (pair_type='gloss') "
                "tend to be more reliable; sentence-level pairs (pair_type='sentence') "
                "may occasionally be off by one paragraph due to OCR column merges. "
                "Recommend a spot-check pass on sentence pairs before production use."
            ),
            "counts": {
                "total_cards": len(cards),
                "vocab_module3": sum(1 for c in cards if c["module_id"] == 3),
                "dialogue_module5_all": sum(1 for c in cards if c["module_id"] == 5),
                "dialogue_module5_sentences": sum(
                    1 for c in cards
                    if c["module_id"] == 5 and c.get("pair_type") == "sentence"
                ),
                "dialogue_units_covered": len(dialogues),
            },
        },
        "vocab_raw": vocab,
        "dialogues_raw": dialogues,
        "cards": cards,
    }

    out_path = "/mnt/user-data/outputs/fsi_amharic_seed.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    c = output["_meta"]["counts"]
    print(f"\nWrote: {out_path}")
    print(f"Total cards              : {c['total_cards']}")
    print(f"  Vocab (module 3)       : {c['vocab_module3']}")
    print(f"  Dialogue (module 5)    : {c['dialogue_module5_all']}"
          f"  ({c['dialogue_module5_sentences']} full sentence pairs)")
    print(f"  Dialogue units covered : {c['dialogue_units_covered']}")

    print("\n── Glossary sample ──")
    for e in vocab[2:14]:
        inf = f"  [inf: {e['verb_infinitive']}]" if e.get("verb_infinitive") else ""
        print(f"  {e['romanization']:35s} -> {e['english']}{inf}")

    print("\n── Dialogue sample (Units 1-2) ──")
    for unit in dialogues[:2]:
        print(f"  Unit {unit['unit']}:")
        for p in unit["pairs"][:5]:
            print(f"    [{p['type']:8s}] EN: {p['english']}")
            print(f"    {'':10s} AM: {p['amharic']}")
            print()

if __name__ == "__main__":
    main()
