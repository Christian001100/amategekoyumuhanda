import os
import pypdfium2 as pdfium

def render_page_3():
    pdf_path = "src/data/Eric .pdf"
    os.makedirs("public/assets/signs", exist_ok=True)
    
    doc = pdfium.PdfDocument(pdf_path)
    # Page 3 is index 2
    page = doc[2]
    bitmap = page.render(scale=3)
    pil_img = bitmap.to_pil()
    pil_img.save("public/assets/signs/page_3.png")
    print("Successfully rendered Page 3 to public/assets/signs/page_3.png")

if __name__ == "__main__":
    render_page_3()
