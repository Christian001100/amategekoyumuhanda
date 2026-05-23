import pdfplumber

def inspect_page_70_images():
    pdf_path = "src/data/Eric .pdf"
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[69] # Page 70
        print(f"Page 70 images count: {len(page.images)}")
        for idx, img in enumerate(page.images):
            print(f"Image {idx}: x0={img['x0']}, y0={img['top']}, x1={img['x1']}, y1={img['bottom']}, width={img['width']}, height={img['height']}")

if __name__ == "__main__":
    inspect_page_70_images()
