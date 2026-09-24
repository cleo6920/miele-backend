from pathlib import Path
import re
import fitz
from PIL import Image
from langdetect import detect, DetectorFactory

DetectorFactory.seed = 0

ROOT = Path(".")
DOWNLOADS = ROOT / "downloads"
IMAGES = ROOT / "images"
LANGS = ["it","en","de","fr","es"]
PREVIEW_PAGES = [1,2,3,7,26]
PREVIEW_NAMES = ["copertina","premessa","api-da-vicino","territorio","galena"]

def normalized_text(doc):
    parts=[]
    for p in doc:
        t=p.get_text("text") or ""
        t=re.sub(r"\s+"," ",t).strip()
        if t:
            parts.append(t)
    return " ".join(parts)

def check_language(lang, pdf):
    doc=fitz.open(pdf)
    text=normalized_text(doc)
    if len(text) < 500:
        raise RuntimeError(f"{pdf}: testo insufficiente per validare la lingua")
    sample=text[:12000]
    detected=detect(sample)
    aliases={"it":"it","en":"en","de":"de","fr":"fr","es":"es"}
    expected=aliases[lang]
    if detected != expected:
        raise RuntimeError(f"{pdf}: lingua rilevata {detected}, attesa {expected}")
    print(f"[language] {lang}: OK ({detected})")
    return doc

def render(doc, lang):
    for pageno,name in zip(PREVIEW_PAGES,PREVIEW_NAMES):
        page=doc[pageno-1]
        pix=page.get_pixmap(matrix=fitz.Matrix(2.2,2.2), alpha=False)
        png=IMAGES / f"api-oggi-01-preview-{lang}-{name}.png"
        webp=IMAGES / f"api-oggi-01-preview-{lang}-{name}.webp"
        pix.save(str(png))
        im=Image.open(png).convert("RGB")
        im.save(webp,"WEBP",quality=86,method=6)
        png.unlink()
        print("[preview]",webp)

def main():
    IMAGES.mkdir(exist_ok=True)
    signatures={}
    for lang in LANGS:
        pdf=DOWNLOADS / f"il-mondo-delle-api-oggi-01-{lang}.pdf"
        if not pdf.exists() or pdf.stat().st_size < 100000:
            raise RuntimeError(f"PDF mancante o troppo piccolo: {pdf}")
        doc=check_language(lang,pdf)
        if doc.page_count != 30:
            raise RuntimeError(f"{pdf}: {doc.page_count} pagine, attese 30")
        render(doc,lang)
        doc.close()

    # Prevent the exact regression that previously made FR/ES previews identical.
    for name in PREVIEW_NAMES:
        fr=(IMAGES/f"api-oggi-01-preview-fr-{name}.webp").read_bytes()
        es=(IMAGES/f"api-oggi-01-preview-es-{name}.webp").read_bytes()
        if fr == es:
            raise RuntimeError(f"Preview FR ed ES identiche per {name}")
    print("[repair] PASS: 25 preview coerenti con i 5 PDF esistenti.")

if __name__=="__main__":
    main()
