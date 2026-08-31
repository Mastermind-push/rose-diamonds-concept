from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageOps


OUTPUT = Path(__file__).resolve().parents[1] / "public" / "catalog"
BASE = "https://www.rosehk.com/_components/v2/13bd48a9b87cde463855d8d31848e8396dc812c6/"

ASSETS = {
    "pink-emerald-three-stone-1": "6355.71942de4.jpg",
    "pink-emerald-three-stone-2": "IMG_6509.b0bde98e.JPG",
    "pink-marquise-three-stone-1": "IMG_6535.cb30dd58.JPG",
    "pink-marquise-three-stone-2": "IMG_6521.fe9f4a61.JPG",
    "pink-heart-halo-1": "IMG_6532.50432ee9.JPG",
    "pink-heart-halo-2": "811f1d5d-2340-4923-bf34-f7da044be96b.918ba373.jpg",
    "pink-oval-solitaire-1": "6354.14daced9.jpg",
    "pink-oval-solitaire-2": "IMG_6526.f0cea959.JPG",
    "yellow-radiant-three-stone-1": "6348.31deb5a8.jpg",
    "yellow-radiant-three-stone-2": "IMG_6518.8cd34051.JPG",
    "toi-et-moi-yellow-1": "f84ac7d7-54ab-46bb-bf9c-cf7fb9380786.d820fc88.jpg",
    "toi-et-moi-yellow-2": "891a1772-fbac-47b0-b0c1-3f991d9a4dc4.2675fc5b.jpg",
    "toi-et-moi-classic-1": "6347.0c4baf5f.jpg",
    "toi-et-moi-classic-2": "389585b8-c250-4be9-b2f2-396e05cdb675.419705b1.jpg",
    "toi-et-moi-pink-1": "ca1b68ea-36aa-48e3-b47c-4ba793aae4b3.abb0d707.jpg",
    "toi-et-moi-pink-2": "b3b5515a-7ccf-414a-a22c-eeded6fab2e1.be9c05bb.jpg",
    "oval-solitaire-1": "6353.a263df03.jpg",
    "oval-solitaire-2": "IMG_6529.dbda1783.JPG",
    "emerald-halo-ring-1": "6356.a350f486.jpg",
    "emerald-halo-ring-2": "IMG_6515.58ccb7f9.JPG",
    "heart-halo-ring-1": "6357.6d574a71.jpg",
    "heart-halo-ring-2": "IMG_6508.fc509d71.JPG",
    "emerald-halo-pendant-1": "IMG_6510.6002c95c.JPG",
    "emerald-halo-pendant-2": "0b6900d2-d698-4ce3-8fec-359cae3a0f27_2.10e4fc67.jpg",
    "tennis-necklace-1": "e4499363-44c0-444d-b479-e7ba8ee6d351_3.3eda0136.jpg",
    "tennis-necklace-2": "3947e1d3-c680-4555-9a9f-a6a2f1ffbc0a.c45bb09e.jpg",
    "queen-hearts-necklace-1": "5029d8a3-2f8d-4801-8b54-386baa86dba0.fa2a70ca.jpg",
    "queen-hearts-necklace-2": "42ec1b7b-7374-4fa5-93d1-2e79bb3033cb.d3966824.jpg",
    "round-pendant-1": "IMG_6907.4c844e5c.JPG",
    "round-pendant-2": "IMG_6906.84876207.JPG",
    "cross-pendant-1": "IMG_6908.1e9cbd36.JPG",
    "cross-pendant-2": "IMG_6909.af375b59.JPG",
    "queen-hearts-pendant-1": "IMG_6910.bb71f1b7.JPG",
    "queen-hearts-pendant-2": "IMG_6911.63ea00de.JPG",
    "round-studs-1": "7cda733e-1054-45ef-b5cc-8fa1cd513713.ac6cf949.png",
    "round-studs-2": "0ae412a7-ca2b-4246-b98f-36e09aba1d8a.60144d57.jpg",
    "oval-studs-1": "19e0e0f7-e8c9-4638-8a9d-2e339935ad56.e7ba7ebd.jpg",
    "oval-studs-2": "IMG_2050.ebad29f2.JPG",
    "pear-studs-1": "61ee1635-3584-46f1-a16d-77c1243d1487.801c0dab.jpg",
    "pear-studs-2": "051e3064-7f50-45dc-80bd-1dc1b29d926a.4a30f0fb.jpg",
    "emerald-halo-studs-1": "964a009a-50c6-484f-aa23-b1502a6335f4.48d8a4a2.png",
    "emerald-halo-studs-2": "d63b7dbd-b1c6-4a5d-9e16-336545a2124a.7b4f8ac2.jpg",
    "queen-hearts-earrings-1": "IMG_6913.dcd72e66.JPG",
    "queen-hearts-earrings-2": "IMG_6912.f3e4fae7.JPG",
    "slim-tennis-bracelet-1": "6358.21d607a6.jpg",
    "slim-tennis-bracelet-2": "96b59878-07f8-4c74-96f9-4537ea5b7df9.036dbc7d.jpg",
    "signature-tennis-bracelet-1": "6358.21d607a6.jpg",
    "signature-tennis-bracelet-2": "14f2d9a8-a397-41ff-9dea-8bf6dd1008f0.7d60c897.jpg",
    "emerald-tennis-bracelet-1": "6350.2a509c32.jpg",
    "emerald-tennis-bracelet-2": "eef951a8-6020-4180-b9d5-6378f3d0a0f9.60695f89.jpg",
    "pink-bloom-1": "4.475a27d4.jpg",
    "pink-bloom-2": "result_01_preview-1.11dc2b94.jpg",
    "youth-1": "6.02cdeb3d.jpg",
    "youth-2": "result_01_preview-2.a757fb94.jpg",
    "blue-lagoon-1": "8.781b9770.jpg",
    "blue-lagoon-2": "result_01_preview-3.03542581.jpg",
    "secret-garden-1": "1.047c25d9.jpg",
    "secret-garden-2": "result_01_preview________.0f25996c.jpg",
    "cherry-kiss-1": "7.74b27305.jpg",
    "cherry-kiss-2": "result_01_preview-4.f5bab657.jpg",
    "blue-velvet-1": "3.f0d0ac2f.jpg",
    "blue-velvet-2": "result_01_preview-5.0f2df0ce.jpg",
    "golden-hour-1": "2.a6c1e347.jpg",
    "golden-hour-2": "result_01_preview-6.30cbe46c.jpg",
    "sweetheart-1": "5.6478bbb9.jpg",
    "sweetheart-2": "result_01_preview.c91cd2e2.jpg",
}


def convert(name: str, source: str) -> None:
    target = OUTPUT / f"{name}.webp"
    if target.exists():
        return
    request = Request(BASE + source, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=40) as response:
        data = response.read()
    image = ImageOps.exif_transpose(Image.open(BytesIO(data)))
    if image.mode in ("RGBA", "LA"):
        background = Image.new("RGB", image.size, "white")
        background.paste(image, mask=image.getchannel("A"))
        image = background
    else:
        image = image.convert("RGB")
    image.thumbnail((1600, 2000), Image.Resampling.LANCZOS)
    image.save(target, "WEBP", quality=88, method=6)
    print(f"{name}: {image.width}x{image.height}")


OUTPUT.mkdir(parents=True, exist_ok=True)
for asset_name, asset_source in ASSETS.items():
    convert(asset_name, asset_source)
