import os
import json
import shutil
import pdfplumber

def map_images():
    pdf_path = "src/data/Eric .pdf"
    questions_json_path = "src/data/questions.json"
    extracted_dir = "parser_temp/extracted_images"
    public_dir = "public/assets/signs"
    os.makedirs(public_dir, exist_ok=True)
    
    with open(questions_json_path, "r", encoding="utf-8") as f:
        questions = json.load(f)
        
    pdf = pdfplumber.open(pdf_path)
    
    # 1. Gather all questions by page
    questions_by_page = {}
    for q in questions:
        p = q.get("page")
        if p is not None:
            questions_by_page.setdefault(p, []).append(q)
            
    print(f"Total pages with questions in JSON: {len(questions_by_page)}")
    
    # 2. Iterate through each page in PDF
    total_mapped = 0
    mismatches = []
    
    for page_idx, page in enumerate(pdf.pages):
        page_num = page.page_number
        images = page.images
        
        if not images:
            continue
            
        # Sort images by top coordinate
        sorted_images = sorted(images, key=lambda img: img["top"])
        
        # Get questions on this page
        # In parse_pdf_with_highlights_v2.py, questions were sorted by their top coordinate naturally
        qs_on_page = questions_by_page.get(page_num, [])
        # Let's filter questions on this page that are supposed to have images
        # Wait, not all questions have images! Only those that are marked as hasImage, OR maybe all questions on this page in the PDF?
        # Let's check how many questions are parsed on this page in total!
        # In the PDF, does every question inside a box have an image?
        # Yes! Let's check:
        print(f"Page {page_num}: PDF images={len(sorted_images)}, JSON questions={len(qs_on_page)}")
        
        if len(sorted_images) == len(qs_on_page):
            # Perfect match! Map them 1-to-1
            for idx, q in enumerate(qs_on_page):
                original_num = q["originalNum"]
                src_filename = f"page_{page_num}_img_{images.index(sorted_images[idx])}.png"
                src_path = os.path.join(extracted_dir, src_filename)
                dest_filename = f"q_{original_num}.png"
                dest_path = os.path.join(public_dir, dest_filename)
                
                if os.path.exists(src_path):
                    shutil.copy(src_path, dest_path)
                    q["hasImage"] = True
                    q["imagePath"] = f"/assets/signs/{dest_filename}"
                    total_mapped += 1
        else:
            mismatches.append({
                "page": page_num,
                "images_count": len(sorted_images),
                "questions_count": len(qs_on_page),
                "questions": [q["originalNum"] for q in qs_on_page]
            })
            
    print(f"\nSuccessfully mapped {total_mapped} images to their questions!")
    print(f"Total pages with mismatches: {len(mismatches)}")
    for m in mismatches:
        print(f"  Mismismatch on Page {m['page']}: PDF has {m['images_count']} images, but JSON has {m['questions_count']} questions: {m['questions']}")
        
    # Save updated questions.json
    with open(questions_json_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    print("\nSaved updated questions.json with new image paths!")

if __name__ == "__main__":
    map_images()
