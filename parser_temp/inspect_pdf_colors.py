import pdfplumber

def inspect_page_colors():
    with pdfplumber.open("/home/el-matadol/Downloads/Eric .pdf") as pdf:
        # Page 105 in 1-based indexing is page 104 in 0-based indexing
        page = pdf.pages[104]
        print(f"--- INSPECTING PAGE {page.page_number} ---")
        
        # Group characters by line or print individual words with their color properties
        words = page.extract_words(extra_attrs=["non_stroking_color", "stroking_color", "fontname"])
        
        print(f"Total words extracted on page: {len(words)}")
        print("First 50 words with color:")
        for w in words[:80]:
            print(f"Word: '{w['text']}' -> Color: {w.get('non_stroking_color')} | Font: {w.get('fontname')}")

if __name__ == "__main__":
    inspect_page_colors()
