import pypdfium2 as pdfium

def check_pdfium_images():
    pdf_path = "src/data/Eric .pdf"
    doc = pdfium.PdfDocument(pdf_path)
    
    pages_with_images = 0
    total_images = 0
    
    # Check first 20 pages
    for page_idx in range(min(20, len(doc))):
        page = doc[page_idx]
        image_objects = []
        try:
            # Look for image objects in page's object list
            for obj in page.get_objects():
                # ObjectType for IMAGE in pypdfium2 is typically 3
                if obj.type == 3: # ObjectType.IMAGE
                    image_objects.append(obj)
        except Exception as e:
            pass
            
        if image_objects:
            pages_with_images += 1
            total_images += len(image_objects)
            print(f"Page {page_idx+1} has {len(image_objects)} image objects")
            
    print(f"Total checked pages with images: {pages_with_images}, total image objects: {total_images}")

if __name__ == "__main__":
    check_pdfium_images()
