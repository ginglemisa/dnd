"""產生美觀易讀版 PDF 用的宋體子集（Big5 字集）。

用法（需要 Python 3 與 fontTools：pip install fonttools）：
    python tools/pdf-font/subset-serif.py <SourceHanSerifTC-Bold.otf 路徑>

來源字型是 Adobe 思源宋體繁中 Bold 的 OTF，說明見同資料夾 README.md。
輸出到 fonts/twD20SerifTC-Bold.otf，重複執行結果相同。
"""

import glob
import os
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUT = os.path.join(ROOT, "fonts", "twD20SerifTC-Bold.otf")

# 思源宋體的 OFL 保留了「Source」這個名稱，修改後的字型不得沿用，所以改名。
FAMILY = "twD20 Serif TC"
POSTSCRIPT = "twD20SerifTC-Bold"
SOURCE_POSTSCRIPT = "SourceHanSerifTC-Bold"
DESCRIPTION = (
    "Big5 subset of Source Han Serif TC Bold, made for twD20 PDF export. "
    "Renamed because 'Source' is a Reserved Font Name."
)

# PDF 產生器（fontkit）橫排時預設會套用的功能。
LAYOUT_FEATURES = [
    "rvrn", "ltra", "ltrm", "frac", "numr", "dnom", "ccmp", "locl", "rlig",
    "mark", "mkmk", "calt", "clig", "liga", "rclt", "curs", "kern",
]

EXTRA_RANGES = [
    (0x0020, 0x007E),  # ASCII
    (0x00A0, 0x00FF),  # Latin-1
    (0x2000, 0x206F),  # 一般標點
    (0x3000, 0x30FF),  # 中日韓符號、假名
    (0xFF00, 0xFFEF),  # 全形與半形
]


def big5_codepoints():
    result = set()
    for lead in range(0x81, 0xFF):
        for trail in list(range(0x40, 0x7F)) + list(range(0xA1, 0xFF)):
            try:
                text = bytes([lead, trail]).decode("cp950")
            except UnicodeDecodeError:
                continue
            result.update(ord(ch) for ch in text)
    return result


def content_codepoints():
    """網站內容與 PDF 相關程式用到的字，收進子集（例如 Big5 沒有的「獁」「−」）。"""
    files = glob.glob(os.path.join(ROOT, "content", "srd", "**", "*.yaml"), recursive=True)
    files += [
        path for path in glob.glob(os.path.join(ROOT, "*.js"))
        if not path.endswith((".min.js", ".generated.js")) and not os.path.basename(path).startswith("validate-")
    ]
    result = set()
    for path in sorted(files):
        with open(path, encoding="utf-8") as handle:
            result.update(ord(ch) for ch in handle.read() if ord(ch) >= 0x80)
    return result


def keep_default_language_only(font):
    """fontkit 不指定語言，只會用各書寫系統的預設語言（DFLT）。

    日、韓、簡體、香港等語言的 locl 會換成各地異體字形，約佔原字型三分之一；
    先拿掉這些語言，子集就不會帶進用不到的字形。預設語言自己的 locl（例如拉丁字母
    環境下的數字字形）照留，排出來的結果和原字型相同。
    """
    for tag in ("GSUB", "GPOS"):
        if tag not in font:
            continue
        for record in font[tag].table.ScriptList.ScriptRecord:
            record.Script.LangSysRecord = []
            record.Script.LangSysCount = 0
        font[tag].prune_features()


def rename(font):
    name = font["name"]
    for record in list(name.names):
        if record.nameID in (1, 16):
            name.setName(FAMILY, record.nameID, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 3:
            text = record.toUnicode().replace(SOURCE_POSTSCRIPT, POSTSCRIPT)
            name.setName(text, 3, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 4:
            name.setName(FAMILY + " Bold", 4, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 6:
            name.setName(POSTSCRIPT, 6, record.platformID, record.platEncID, record.langID)
        elif record.nameID in (17,):
            name.setName("Bold", 17, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 0 or record.nameID in (13, 14):
            continue  # 著作權與 OFL 授權說明保留原文
        elif record.nameID in (2, 5):
            continue
        else:
            name.removeNames(nameID=record.nameID, platformID=record.platformID,
                             platEncID=record.platEncID, langID=record.langID)
    name.setName(DESCRIPTION, 10, 3, 1, 0x409)

    cff = font["CFF "].cff
    cff.fontNames = [POSTSCRIPT]
    top = cff.topDictIndex[0]
    for key in ("FullName", "FamilyName"):
        if hasattr(top, key):
            setattr(top, key, FAMILY + " Bold" if key == "FullName" else FAMILY)
    if hasattr(top, "CIDFontName"):
        top.CIDFontName = POSTSCRIPT
    for fd in getattr(top, "FDArray", []) or []:
        if hasattr(fd, "FontName"):
            fd.FontName = fd.FontName.replace(SOURCE_POSTSCRIPT, POSTSCRIPT)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    source = TTFont(sys.argv[1])
    if source["name"].getDebugName(6) != SOURCE_POSTSCRIPT:
        sys.exit(f"來源字型應是 {SOURCE_POSTSCRIPT}，實際是 {source['name'].getDebugName(6)}")

    codepoints = big5_codepoints() | content_codepoints()
    for start, end in EXTRA_RANGES:
        codepoints.update(range(start, end + 1))
    available = set(source.getBestCmap())
    codepoints &= available
    keep_default_language_only(source)

    options = subset.Options()
    options.layout_features = LAYOUT_FEATURES
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=sorted(codepoints))
    subsetter.subset(source)

    rename(source)
    source.save(OUTPUT)
    size = os.path.getsize(OUTPUT)
    print(f"{os.path.relpath(OUTPUT, ROOT)}：{len(source.getBestCmap())} 個字元、"
          f"{source['maxp'].numGlyphs} 個字形，{size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
