from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os
def make_pdf(path: str, title: str, lines: list[str]):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    c = canvas.Canvas(path, pagesize=A4)
    c.setFont("Helvetica-Bold", 16); c.drawString(40, 800, title)
    c.setFont("Helvetica", 11); y = 770
    for ln in lines:
        for chunk in [ln[i:i+100] for i in range(0, len(ln), 100)] or [""]:
            c.drawString(40, y, chunk[:110]); y -= 16
            if y < 60: c.showPage(); y = 800
    c.save(); return path
