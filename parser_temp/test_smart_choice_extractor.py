import re

# Regex to detect choice indicators anywhere:
# Matches a letter a-d preceded by start of line, space, or open parenthesis,
# and followed by a dot, closing parenthesis, or space + dot/parenthesis.
choice_pat = re.compile(r"(?:^|(?<=\s)|(?<=\())([a-d])\s*[\.\)]", re.IGNORECASE)

def parse_line_choices(line_text):
    matches = list(choice_pat.finditer(line_text))
    if not matches:
        return None
        
    choices = []
    for i, m in enumerate(matches):
        letter = m.group(1).lower()
        start_idx = m.start()
        end_idx = m.end()
        
        # Determine the text for this choice
        if i < len(matches) - 1:
            # Text is between the end of this indicator and the start of the next one
            text = line_text[end_idx:matches[i+1].start()].strip()
        else:
            # If this is the last or only indicator
            if len(matches) == 1 and start_idx > len(line_text) / 2:
                # If there is only one indicator and it is in the second half of the line
                # (like "Kugihigamira... (a)"), the text is before the indicator!
                text = line_text[:start_idx].strip()
            else:
                # Normal case: text is after the indicator
                text = line_text[end_idx:].strip()
                
        # Check if correct (has parentheses around the letter in the raw text)
        # We look at the matched substring plus its surrounding characters
        raw_match = line_text[max(0, start_idx - 1) : min(len(line_text), end_idx + 1)]
        is_correct = False
        if "(" in raw_match and ")" in raw_match:
            is_correct = True
            
        choices.append({
            "letter": letter,
            "text": text,
            "is_correct": is_correct
        })
    return choices

# Let's test on some problematic lines
lines_to_test = [
    "Kugihigamira ako kanya ndetse byaba (a)",
    "b.Gufungura umuryango w’imodoka ureba",
    "a) b)",
    "(c) d)",
    "a. Umuyobozi wese abujijwe kuwurenga",
    "d) Nta nkengero y’umuhanda yegutse iri i buryo"
]

print("=== TESTING SMART CHOICE EXTRACTOR ===")
for line in lines_to_test:
    print(f"Line: '{line}'")
    choices = parse_line_choices(line)
    if choices:
        for c in choices:
            print(f"  -> Letter: {c['letter']} | Correct: {c['is_correct']} | Text: '{c['text']}'")
    else:
        print("  -> No choices found")
