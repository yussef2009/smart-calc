from PIL import Image

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # Assuming white background, we make pixels that are very close to white transparent
    # Alternatively, floodfill from corners
    for item in datas:
        # Check if the pixel is near white (e.g. R, G, B > 240)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0)) # transparent
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

input_path = r"C:\Users\yusse\.gemini\antigravity\brain\6a472d69-0aac-4a62-ab00-1f1be56126ce\media__1777322076882.jpg"
output_path = r"c:\Users\yusse\OneDrive\Documents\GitHub\smart-calc\smart calc 2\public\logo.png"

remove_white_bg(input_path, output_path)
