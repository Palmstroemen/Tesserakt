#!/usr/bin/env python3
"""
One-off: Convert dimension vector values from 1-5 scale to 0-1 in all backend rule JSONs.
Formula: (x - 1) / 4  =>  1->0, 2->0.25, 3->0.5, 4->0.75, 5->1
Only converts numeric values in [1, 5] that appear under dimension keys.
"""
import json
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "backend")
DIMENSIONS = ["liebe", "beruf", "finanzen", "gesundheit", "soziales",
              "kreativitaet", "veraenderung", "spiritualitaet"]

def scale_15_to_01(v):
    if isinstance(v, (int, float)) and 1 <= v <= 5:
        return round((float(v) - 1) / 4, 2)
    return v

def convert_dict(obj):
    """Recursively convert any dict that has dimension keys with 1-5 values."""
    if isinstance(obj, dict):
        # Check if this dict looks like a dimension vector (has at least one DIM key with numeric value)
        has_dim_vals = any(
            k in DIMENSIONS and isinstance(obj.get(k), (int, float)) and 1 <= obj[k] <= 5
            for k in obj
        )
        if has_dim_vals:
            out = {}
            for k, v in obj.items():
                if k in DIMENSIONS and isinstance(v, (int, float)) and 1 <= v <= 5:
                    out[k] = scale_15_to_01(v)
                else:
                    out[k] = convert_dict(v)
            return out
        return {k: convert_dict(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_dict(x) for x in obj]
    return obj

def main():
    folders = ["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Vedisch"]
    paracelsus = os.path.join(BASE, "Paracelsus")
    if os.path.isdir(paracelsus):
        for name in os.listdir(paracelsus):
            if name.endswith(".json"):
                path = os.path.join(paracelsus, name)
                with open(path, encoding="utf-8") as f:
                    data = json.load(f)
                new_data = convert_dict(data)
                if new_data != data:
                    with open(path, "w", encoding="utf-8") as f:
                        json.dump(new_data, f, ensure_ascii=False, indent=2)
                    print(f"Converted: {path}")

    for folder in folders:
        dirpath = os.path.join(BASE, folder)
        if not os.path.isdir(dirpath):
            continue
        for name in sorted(os.listdir(dirpath)):
            if not name.endswith(".json"):
                continue
            path = os.path.join(dirpath, name)
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            new_data = convert_dict(data)
            if new_data != data:
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(new_data, f, ensure_ascii=False, indent=2)
                print(f"Converted: {path}")
    print("Done.")

if __name__ == "__main__":
    main()
