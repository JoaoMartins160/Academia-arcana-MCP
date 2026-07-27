import fitz
import sys
import os

pdf_path = r"C:\Users\João Pedro\AppData\Local\FoundryVTT\Data\Images\pdf\Tormenta 20\T20-Atlas-de-Arton.pdf"
doc = fitz.open(pdf_path)

output_lines = []
for i in range(len(doc)):
    page = doc[i]
    text = page.get_text()
    if "moreania" in text.lower():
        output_lines.append(f"--- Page {i+1} ---")
        output_lines.append(text)

os.makedirs(r"d:\Foundry\dumps\json", exist_ok=True)
with open(r"d:\Foundry\dumps\json\moreania.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output_lines))
