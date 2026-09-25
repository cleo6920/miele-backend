import fitz, os, re, json
from pathlib import Path

SRC=Path("downloads/il-mondo-delle-api-oggi-01.pdf")
OUT=Path("downloads")
IMG=Path("images")
OUT.mkdir(exist_ok=True); IMG.mkdir(exist_ok=True)
LANGS={"en":"English","de":"German","fr":"French","es":"Spanish"}
PREVIEW_PAGES=[1,2,3,7,26]
PREVIEW_NAMES=["copertina","premessa","api-da-vicino","territorio","galena"]

FONT_MAP={
 "DejaVuSans-Bold":{"\x01":"·","\x02":"è","\x03":"’","\x04":"“","\x05":"”","\x06":"à"},
 "DejaVuSans":{"\x01":"·","\x02":"à","\x03":"ù","\x04":"’","\x05":"ò","\x06":"è","\x07":"ì","\x08":"“","\x0b":"È","\x0c":"é"},
 "DejaVuSerif-Bold":{"\x01":"…","\x02":"ù","\x03":"’","\x04":"é"},
 "DejaVuSerif":{"\x01":"è"},
}
FONT_FILES={
 "sans":"/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
 "sans-bold":"/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
 "serif":"/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
 "serif-bold":"/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
}
BRANDS=[
 "LA FABBRICA DELLE API","La Fabbrica delle Api",
 "LA GALENA DELLE API","La Galena delle Api",
 "OASI DEL BUSATELLO","Oasi del Busatello",
 "Alveoterapia Integrata","ALTHEA 12830","Linea Veleni",
 "Castel d’Ario","Castel D’Ario"
]
SKIP_PATTERNS=[
 r"CC BY",r"CC0",r"Wikimedia Commons",r"Public domain",
 r"www\.",r"@gmail\.com",r"WhatsApp\s*\d"
]

def repair(text,font):
    m=FONT_MAP.get(font,{})
    return "".join(m.get(ch,ch) for ch in text)

def color_rgb(n):
    return (((n>>16)&255)/255.0,((n>>8)&255)/255.0,(n&255)/255.0)

def font_key(name):
    serif="Serif" in name
    bold="Bold" in name
    if serif and bold:return "serif-bold"
    if serif:return "serif"
    if bold:return "sans-bold"
    return "sans"

def should_skip(text):
    return any(re.search(p,text,re.I) for p in SKIP_PATTERNS)

def protect(text):
    saved={}
    out=text
    for i,b in enumerate(BRANDS):
        token=f"__FDA{i}__"
        if b in out:
            out=out.replace(b,token); saved[token]=b
    return out,saved

def restore(text,saved):
    out=text
    for token,val in saved.items(): out=out.replace(token,val)
    return out

def load_static_translations(lang,expected_count):
    path=Path("scripts/api_oggi_translations")/f"{lang}.tsv"
    if not path.exists():
        raise RuntimeError(f"missing static translation file: {path}")
    rows={}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip(): continue
        idx,text=line.split("\t",1)
        rows[int(idx)]=text.replace("\\n","\n")
    if sorted(rows.keys()) != list(range(expected_count)):
        raise RuntimeError(f"{lang}: expected {expected_count} translation rows, found {len(rows)}")
    return [rows[i] for i in range(expected_count)]


def validate_pdf_language(pdf_path,lang):
    import pymupdf
    from langdetect import detect, DetectorFactory
    DetectorFactory.seed=0
    doc=pymupdf.open(pdf_path)
    text=" ".join((p.get_text("text") or "") for p in doc)
    doc.close()
    text=re.sub(r"\\s+"," ",text).strip()
    if len(text)<500:
        raise RuntimeError(f"{pdf_path}: insufficient text for language validation")
    detected=detect(text[:12000])
    if detected!=lang:
        raise RuntimeError(f"{pdf_path}: detected {detected}, expected {lang}")
    print("validated",pdf_path,detected)

def extract_blocks(doc):
    pages=[]
    for p in doc:
        blocks=[]
        for b in p.get_text("dict").get("blocks",[]):
            if b.get("type")!=0: continue
            lines=b.get("lines",[])
            spans=[s for ln in lines for s in ln.get("spans",[]) if s.get("text","")]
            if not spans: continue
            raw="\n".join("".join(s.get("text","") for s in ln.get("spans",[])).rstrip() for ln in lines).strip()
            if not raw: continue
            s=spans[0]
            font=s.get("font","DejaVuSans")
            text=repair(raw,font)
            blocks.append({
                "bbox":list(b["bbox"]),"text":text,"font":font,
                "size":float(s.get("size",10)),"color":int(s.get("color",0)),
                "skip":should_skip(text)
            })
        pages.append(blocks)
    return pages

def fit_text(page,rect,text,font_file,font_alias,orig_size,color):
    # Let translated text wrap naturally; preserve deliberate title line breaks only when short.
    if orig_size < 15: txt=re.sub(r"\s*\n\s*"," ",text).strip()
    else: txt=text.strip()
    page.insert_font(fontname=font_alias,fontfile=font_file)
    start=orig_size
    floor=max(4.5,orig_size*0.54)
    fs=start
    while fs>=floor:
        rc=page.insert_textbox(rect,txt,fontsize=fs,fontname=font_alias,color=color,align=fitz.TEXT_ALIGN_LEFT)
        if rc>=-0.2:
            return fs
        # Undo failed insertion by reloading page is not possible; failed insert_textbox writes nothing.
        fs-=0.35 if orig_size<12 else 0.55
    # Last resort: slightly taller box, still within page.
    r=fitz.Rect(rect.x0,rect.y0,rect.x1,min(page.rect.height-10,rect.y1+max(10,orig_size*1.6)))
    page.insert_textbox(r,txt,fontsize=floor,fontname=font_alias,color=color,align=fitz.TEXT_ALIGN_LEFT)
    return floor

def build(lang,pages_info,translations):
    doc=fitz.open(SRC)
    idx=0
    for pi,page in enumerate(doc):
        blocks=pages_info[pi]
        translated=[]
        for b in blocks:
            if b["skip"]:
                translated.append(b["text"])
            else:
                translated.append(translations[idx]); idx+=1
        # remove only translatable text, preserving all photos/graphics
        for b in blocks:
            if b["skip"]: continue
            r=fitz.Rect(*b["bbox"])
            r.x0-=0.6;r.y0-=0.5;r.x1+=0.6;r.y1+=0.5
            page.add_redact_annot(r,fill=None)
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE,graphics=fitz.PDF_REDACT_LINE_ART_NONE,text=fitz.PDF_REDACT_TEXT_REMOVE)
        for b,tr in zip(blocks,translated):
            if b["skip"]: continue
            r=fitz.Rect(*b["bbox"])
            # Tiny breathing room for translated strings.
            r.x1=min(page.rect.width-10,r.x1+2.0)
            r.y1=min(page.rect.height-10,r.y1+2.0)
            fk=font_key(b["font"])
            fit_text(page,r,tr,FONT_FILES[fk],"FDA_"+fk.replace("-","_"),b["size"],color_rgb(b["color"]))
    out=OUT/f"il-mondo-delle-api-oggi-01-{lang}.pdf"
    doc.save(out,garbage=4,deflate=True,clean=True)
    doc.close()
    return out

def render_preview(pdf_path,lang):
    doc=fitz.open(pdf_path)
    for pageno,name in zip(PREVIEW_PAGES,PREVIEW_NAMES):
        page=doc[pageno-1]
        pix=page.get_pixmap(matrix=fitz.Matrix(2.2,2.2),alpha=False)
        png=IMG/f"api-oggi-01-preview-{lang}-{name}.png"
        pix.save(str(png))
        # use Pillow only if available to convert webp
        from PIL import Image
        im=Image.open(png).convert("RGB")
        target=IMG/f"api-oggi-01-preview-{lang}-{name}.webp"
        im.save(target,"WEBP",quality=84,method=6)
        png.unlink()
    doc.close()

def main():
    src=fitz.open(SRC)
    pages_info=extract_blocks(src)
    src.close()
    # canonical Italian filename
    it=OUT/"il-mondo-delle-api-oggi-01-it.pdf"
    it.write_bytes(SRC.read_bytes())
    render_preview(it,"it")
    translatable=[b["text"] for page in pages_info for b in page if not b["skip"]]
    # translate only unique strings, then remap in source order
    unique=list(dict.fromkeys(translatable))
    for lang in LANGS:
        translated_unique=load_static_translations(lang,len(unique))
        lookup=dict(zip(unique,translated_unique))
        ordered=[lookup[t] for t in translatable]
        out=build(lang,pages_info,ordered)
        validate_pdf_language(out,lang)
        render_preview(out,lang)
        print("built",out,out.stat().st_size)
    print("done")

if __name__=="__main__":
    main()
