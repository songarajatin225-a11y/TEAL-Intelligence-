#!/usr/bin/env python3
"""
Convert the three TEAL handbooks (.docx) into version-controlled Markdown.

Usage:
    pip install python-docx
    python3 scripts/knowledge/docx_to_markdown.py <laser.docx> <automation.docx> <semiconductor.docx>

What it preserves
  * heading hierarchy (part / chapter / section)  -> Markdown headings
  * tables                                         -> GitHub-flavoured Markdown tables
  * Word equations (OMML)                          -> linear text, e.g. (a)/(b), x_i, √(x), ∑_(i)(…)
  * list paragraphs                                -> "- " bullets

What it does NOT preserve
  * embedded figures / images (listed as "[Figure not transcribed]" markers where a
    caption paragraph starts with "Figure")

Output: knowledge/handbooks/<book>/<nn>-<slug>.md, one file per part, each with YAML
front matter carrying provenance (source document, part, data_type, verification).
The text is NOT rewritten or summarised — it is the handbook's own wording.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import docx
from docx.table import Table
from docx.text.paragraph import Paragraph

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "knowledge" / "handbooks"

BOOKS = {
    "laser": {
        "title": "The Complete Laser Handbook",
        "split_level": 1,
        "role": "HOW CAN THE PROCESS WORK?",
    },
    "automation": {
        "title": "Automation Equipment Building Handbook",
        "split_level": 2,
        "role": "HOW DO WE TURN THE PROCESS INTO A REPEATABLE MACHINE?",
    },
    "semiconductor": {
        "title": "The Complete Semiconductor Industry Handbook",
        "split_level": 1,
        "role": "WHERE IS THE OPPORTUNITY?",
    },
}


# ----------------------------------------------------------------- OMML → text
def omml(el) -> str:
    """Linearise an OMML element. Covers the constructs used in the handbooks."""
    tag = el.tag.replace(M, "m:").replace(W, "w:")
    kids = list(el)

    def part(name: str) -> str:
        for k in kids:
            if k.tag == M + name:
                return "".join(omml(c) for c in k)
        return ""

    if tag == "m:t" or tag == "w:t":
        return el.text or ""
    if tag == "m:f":
        num, den = part("num"), part("den")
        return f"({num})/({den})"
    if tag == "m:sSub":
        return f"{part('e')}_{wrap(part('sub'))}"
    if tag == "m:sSup":
        return f"{part('e')}^{wrap(part('sup'))}"
    if tag == "m:sSubSup":
        return f"{part('e')}_{wrap(part('sub'))}^{wrap(part('sup'))}"
    if tag == "m:rad":
        deg = part("deg")
        return f"{'∛' if deg == '3' else '√'}({part('e')})" if deg in ("", "3") else f"root{deg}({part('e')})"
    if tag == "m:nary":
        chr_ = "∫"
        for k in kids:
            if k.tag == M + "naryPr":
                for c in k:
                    if c.tag == M + "chr":
                        chr_ = c.get(M + "val") or chr_
        sub, sup = part("sub"), part("sup")
        s = chr_
        if sub:
            s += f"_{wrap(sub)}"
        if sup:
            s += f"^{wrap(sup)}"
        return f"{s} {part('e')}"
    if tag == "m:d":
        beg, end = "(", ")"
        for k in kids:
            if k.tag == M + "dPr":
                for c in k:
                    if c.tag == M + "begChr":
                        beg = c.get(M + "val") or ""
                    if c.tag == M + "endChr":
                        end = c.get(M + "val") or ""
        es = [("".join(omml(c) for c in k)) for k in kids if k.tag == M + "e"]
        return f"{beg}{', '.join(es)}{end}"
    if tag == "m:func":
        return f"{part('fName')}({part('e')})"
    if tag == "m:bar" or tag == "m:acc":
        return f"{part('e')}̄" if tag == "m:bar" else part("e")
    if tag == "m:limLow":
        return f"{part('e')}_{wrap(part('lim'))}"
    if tag == "m:limUpp":
        return f"{part('e')}^{wrap(part('lim'))}"
    if tag.endswith("Pr"):
        return ""
    return "".join(omml(k) for k in kids)


def wrap(s: str) -> str:
    return s if len(s) <= 1 else f"({s})"


def para_text(p: Paragraph) -> str:
    """Paragraph text including inline equations, in document order."""
    out = []
    for node in p._p.iter():
        if node.tag == W + "t":
            # skip text that lives inside an equation (handled by omml)
            anc = node.getparent()
            inside_math = False
            while anc is not None and anc is not p._p:
                if anc.tag.startswith(M):
                    inside_math = True
                    break
                anc = anc.getparent()
            if not inside_math:
                out.append(node.text or "")
        elif node.tag in (M + "oMath",):
            parent = node.getparent()
            if parent is not None and parent.tag == M + "oMathPara":
                continue  # handled by oMathPara
            out.append(" " + omml(node).strip() + " ")
        elif node.tag == M + "oMathPara":
            out.append(" " + "  ".join(omml(c).strip() for c in node if c.tag == M + "oMath") + " ")
        elif node.tag == W + "tab":
            out.append("\t")
        elif node.tag == W + "br":
            out.append(" ")
    return re.sub(r"[  ]+", " ", "".join(out)).strip()


def iter_blocks(doc):
    for child in doc.element.body.iterchildren():
        name = child.tag.split("}")[1]
        if name == "p":
            yield Paragraph(child, doc)
        elif name == "tbl":
            yield Table(child, doc)


def table_md(t: Table) -> list[str]:
    rows = []
    for r in t.rows:
        cells, prev = [], None
        for c in r.cells:
            if c._tc is prev:
                continue
            prev = c._tc
            txt = " ".join(para_text(p) for p in c.paragraphs).strip()
            cells.append(txt.replace("|", "\\|"))
        rows.append(cells)
    if not rows:
        return []
    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]
    out = ["", "| " + " | ".join(rows[0]) + " |", "|" + "---|" * width]
    out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
    out.append("")
    return out


def slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[’'`]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:70] or "section"


def convert(book: str, path: Path) -> dict:
    cfg = BOOKS[book]
    d = docx.Document(str(path))
    parts: list[dict] = []
    current = {"title": "Front matter", "lines": []}
    in_toc = False
    stats = {"tables": 0, "equations": 0, "headings": 0}

    for b in iter_blocks(d):
        if isinstance(b, Table):
            stats["tables"] += 1
            current["lines"] += table_md(b)
            continue
        style = (b.style.name if b.style is not None else "") or ""
        text = para_text(b)
        if not text:
            continue
        stats["equations"] += len(b._p.findall(".//" + M + "oMath"))
        m = re.match(r"Heading (\d)", style)
        level = int(m.group(1)) if m else (1 if style == "Title" else 0)
        # skip the Word-generated table of contents (lines ending in a page number)
        if style.startswith("toc") or style.startswith("TOC"):
            continue
        if level == 0 and re.search(r"\t\d+$", text):
            in_toc = True
            continue
        if level:
            stats["headings"] += 1
            in_toc = False
            if level <= cfg["split_level"] and current["lines"]:
                parts.append(current)
                current = {"title": text, "lines": []}
            elif level <= cfg["split_level"]:
                current["title"] = text
            current["lines"].append("")
            current["lines"].append("#" * min(level, 6) + " " + text)
            current["lines"].append("")
        elif in_toc:
            continue
        elif "List" in style:
            current["lines"].append("- " + text)
        else:
            if text.startswith("Figure "):
                current["lines"].append(f"*{text}* — [Figure not transcribed; see source document]")
            else:
                current["lines"].append(text)
            current["lines"].append("")
    if current["lines"]:
        parts.append(current)

    out_dir = OUT / book
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.glob("*.md"):
        old.unlink()
    index = []
    for i, p in enumerate(parts):
        fname = f"{i:02d}-{slugify(p['title'])}.md"
        body = "\n".join(p["lines"]).strip() + "\n"
        body = re.sub(r"\n{3,}", "\n\n", body)
        fm = [
            "---",
            f"handbook: {book}",
            f"handbook_title: \"{cfg['title']}\"",
            f"part_index: {i}",
            f"part_title: {json.dumps(p['title'], ensure_ascii=False)}",
            f"source_document: \"{path.name.split('-', 1)[-1] if re.match(r'^[0-9a-f]{8}-', path.name) else path.name}\"",
            "data_type: TEAL_INTERNAL",
            "verification_status: SOURCE_DOCUMENTED",
            "transcription: automated docx→markdown; figures not transcribed; equations linearised",
            "---",
            "",
        ]
        (out_dir / fname).write_text("\n".join(fm) + body, encoding="utf-8")
        index.append({"file": fname, "title": p["title"], "chars": len(body)})
    meta = {"handbook": book, "title": cfg["title"], "role": cfg["role"], "parts": index, "stats": stats}
    (out_dir / "_index.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return meta


def main(argv: list[str]) -> int:
    if len(argv) != 4:
        print(__doc__)
        return 2
    for book, p in zip(("laser", "automation", "semiconductor"), argv[1:]):
        meta = convert(book, Path(p))
        print(f"{book}: {len(meta['parts'])} parts, stats={meta['stats']}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
