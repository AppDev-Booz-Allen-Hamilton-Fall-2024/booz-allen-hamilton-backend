from pdfminer.high_level import extract_text
def categories(doc):
  text = extract_text(doc)
  text = text.lower()
  s = []
  if "medicaid" in text:
      s.append("Medicaid")
  elif "medicaid expansion" in text:
      s.append("medicaid expansion")
  if "separate chip" in text:
      s.append("Separate CHIP")
  elif "chip expansion" in text:
      s.append("CHIP Expansion")
  if "chip" in text:
      s.append("CHIP")
  if "non-magi" in text:
    s.append("Non-MAGI")
  elif "magi" in text:
    s.append("MAGI")
  return s
