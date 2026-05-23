import os
import pypdfium2 as pdfium

def render_pages():
    pdf_path = "src/data/Eric .pdf"
    os.makedirs("public/assets/signs", exist_ok=True)
    doc = pdfium.PdfDocument(pdf_path)
    
    # Page 70 (index 69)
    page70 = doc[69]
    bitmap70 = page70.render(scale=3)
    bitmap70.to_pil().save("public/assets/signs/page_70.png")
    print("Rendered Page 70 to public/assets/signs/page_70.png")
    
    # Page 71 (index 70)
    page71 = doc[70]
    bitmap71 = page71.render(scale=3)
    bitmap71.to_pil().save("public/assets/signs/page_71.png")
    print("Rendered Page 71 to public/assets/signs/page_71.png")

if __name__ == "__main__":
    render_pages()
