#!/usr/bin/env python3
"""Build a single-file HTML by inlining local same-folder JS files from index.html."""

from __future__ import annotations

import json
import re
from pathlib import Path

INPUT_HTML = Path("index.html")
OUTPUT_HTML = Path("index-single.html")

SCRIPT_TAG_RE = re.compile(
    r"<script\b(?P<attrs>[^>]*)\bsrc\s*=\s*(?P<q>[\"'])(?P<src>[^\"']+)(?P=q)(?P<tail>[^>]*)>\s*</script>",
    re.IGNORECASE,
)


def is_external(src: str) -> bool:
    lower = src.lower()
    return lower.startswith("http://") or lower.startswith("https://") or lower.startswith("//")


def is_same_folder_js(src: str) -> bool:
    if not src.lower().endswith(".js"):
        return False
    if "/" in src or "\\" in src:
        return False
    if src.startswith("."):
        return False
    return True


def has_defer(attrs: str) -> bool:
    return re.search(r"\bdefer\b", attrs, re.IGNORECASE) is not None


def clean_attrs(attrs: str, tail: str, *, remove_defer: bool) -> str:
    combined = f"{attrs} {tail}".strip()
    combined = re.sub(
        r"\bsrc\s*=\s*([\"']).*?\1",
        "",
        combined,
        flags=re.IGNORECASE,
    )
    if remove_defer:
        combined = re.sub(r"\bdefer\b", "", combined, flags=re.IGNORECASE)
    combined = re.sub(r"\s+", " ", combined).strip()
    return f" {combined}" if combined else ""


def inline_scripts(html_text: str, base_dir: Path) -> str:
    defer_chunks: list[str] = []

    def replacer(match: re.Match[str]) -> str:
        src = match.group("src")
        attrs = match.group("attrs") or ""
        tail = match.group("tail") or ""

        if is_external(src) or not is_same_folder_js(src):
            return match.group(0)

        js_path = base_dir / src
        if not js_path.exists():
            return match.group(0)

        js_content = js_path.read_text(encoding="utf-8")

        if has_defer(attrs) or has_defer(tail):
            defer_chunks.append(js_content)
            return ""

        passthrough_attrs = clean_attrs(attrs, tail, remove_defer=False)
        return f"<script{passthrough_attrs}>\n{js_content}\n</script>"

    html_out = SCRIPT_TAG_RE.sub(replacer, html_text)

    if defer_chunks:
        queue_values = ",\n".join(json.dumps(chunk) for chunk in defer_chunks)
        defer_runner = (
            "<script>\n"
            "(function(){\n"
            "  var q = [\n"
            f"{queue_values}\n"
            "  ];\n"
            "  for (var i = 0; i < q.length; i++) {\n"
            "    (0, eval)(q[i]);\n"
            "  }\n"
            "})();\n"
            "</script>"
        )

        if "</body>" in html_out.lower():
            body_close_re = re.compile(r"</body>", re.IGNORECASE)
            html_out = body_close_re.sub(lambda _m: defer_runner + "\n</body>", html_out, count=1)
        else:
            html_out += "\n" + defer_runner + "\n"

    return html_out


def main() -> None:
    source = INPUT_HTML.read_text(encoding="utf-8")
    built = inline_scripts(source, INPUT_HTML.parent)
    OUTPUT_HTML.write_text(built, encoding="utf-8")
    print(f"Wrote {OUTPUT_HTML}")


if __name__ == "__main__":
    main()
