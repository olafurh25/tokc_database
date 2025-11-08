# vectorize_icons.py
import os, base64, requests, re
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

API_ID     = os.getenv("VECTOR_ID")
API_SECRET = os.getenv("VECTOR_SECRET")
if not API_ID or not API_SECRET:
    raise SystemExit("Missing VECTOR_ID or VECTOR_SECRET in .env")

# === Your folders ===
PNG_DIR = Path(r"C:\Users\Oli Poli\OneDrive\Desktop\HR\Forritun\card_database\images\iconography\png")
SVG_DIR = Path(r"C:\Users\Oli Poli\OneDrive\Desktop\HR\Forritun\card_database\images\iconography\svg")
SVG_DIR.mkdir(parents=True, exist_ok=True)

# === Toggle: treat output as mono (text-colored) or keep full color ===
MONO_MODE = True  # True → limit colors & rewrite fills to currentColor, False → keep original colors
TEST_MODE = True  # Free "mode=test" calls (0 credits)


API_URL = "https://vectorizer.ai/api/v1/vectorize"
AUTH = base64.b64encode(f"{API_ID}:{API_SECRET}".encode()).decode()
HEADERS = {"Authorization": f"Basic {AUTH}"}

def clean_svg_to_currentcolor(svg_text: str) -> str:
    """
    Make the SVG themeable: set fills/strokes to currentColor
    (preserves 'none', keeps viewBox, removes width/height so CSS can size).
    """
    # remove width/height attributes (so CSS/1em sizing works)
    svg_text = re.sub(r'\s(width|height)="[^"]*"', '', svg_text)

    # convert all fills except 'none' to currentColor
    svg_text = re.sub(r'fill="(?!none)[^"]*"', 'fill="currentColor"', svg_text)

    # convert all strokes except 'none' to currentColor (optional)
    svg_text = re.sub(r'stroke="(?!none)[^"]*"', 'stroke="currentColor"', svg_text)

    # ensure there is a viewBox; if none, nothing we can do here
    return svg_text

def vectorize_one(png_path: Path, out_path: Path):
    """Send one PNG to Vectorizer.AI and save an SVG."""
    is_color = "rgb" in png_path.stem.lower()  # decide based on filename
    mode = "vectorize" if not TEST_MODE else "test"
  # use free test mode until you're ready (vectorize / preview)

    data = {
        "format": "svg",
        "mode": mode,
    }

    # Color or mono parameters
    if not is_color:
        # monochrome → fewer colors, smoother edges
        data.update({
            "color_limit": "2",
            "smoothness": "0.5",
            "detail": "0.8",
        })

    with png_path.open("rb") as f:
        resp = requests.post(
            API_URL,
            headers=HEADERS,
            files={"image": f},
            data=data,
            timeout=120
        )

    if not resp.ok:
        print(f"❌ {png_path.name}: {resp.status_code} {resp.text[:200]}")
        return

    svg = resp.text

    # Convert mono outputs to text-colored SVGs
    if not is_color:
        svg = clean_svg_to_currentcolor(svg)

    out_path.write_text(svg, encoding="utf-8")
    print(f"✅ {png_path.name} → {out_path.name} ({'color' if is_color else 'mono'})")
    with png_path.open("rb") as f:
        data = {
            "format": "svg",
            "mode": "test"
        }
        if MONO_MODE:
            # Fewer colors & smoother shapes for icon silhouettes
            data.update({
                "color_limit": "2",   # try 2 or 1; 2 keeps a tiny bit more edge definition
                "smoothness": "0.5",  # 0..1 (higher = smoother)
                "detail": "0.8",      # 0..1 (higher = more detail)
            })

        resp = requests.post(API_URL, headers=HEADERS, files={"image": f}, data=data, timeout=120)

    if not resp.ok:
        print(f"❌ {png_path.name}: {resp.status_code} {resp.text[:200]}")
        return

    svg = resp.text
    if MONO_MODE:
        svg = clean_svg_to_currentcolor(svg)

    out_path.write_text(svg, encoding="utf-8")
    print(f"✅ {png_path.name} → {out_path.name}")

def main():
    pngs = sorted(PNG_DIR.glob("*.png"))
    if not pngs:
        print(f"No PNG files found in: {PNG_DIR}")
        return
    for p in pngs:
        out = SVG_DIR / (p.stem + ".svg")
        vectorize_one(p, out)

if __name__ == "__main__":
    main()
