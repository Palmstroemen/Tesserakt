#!/usr/bin/env python3
"""
diagnose_rules.py
=================
Liest alle JSON-Regelwerke aus den Unterordnern und zeigt ihre Struktur.
Hilft festzustellen welche Toplevel-Schlüssel vorhanden sind und ob die
rule_engine.py sie korrekt ansprechen kann.

Ausführen: python diagnose_rules.py
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SUBFOLDERS = [
    "Westlich",
    "Bazi",
    "Numerologie",
    "Kabbalah",
    "Arabisch",
    "Hellenistisch",
    "Vedisch",
]

# Schlüssel die die rule_engine.py erwartet, pro System
EXPECTED_KEYS = {
    "Westlich":      ["natal_signs", "signs", "transit_rules", "aspect_weights",
                      "planets", "houses", "III_II_constitution", "III_III_health_sickness"],
    "Bazi":          ["day_master_profiles", "earthly_branches", "five_element_interactions",
                      "clash_and_combination"],
    "Numerologie":   ["grundzahlen"],
    "Kabbalah":      ["sephiroth"],
    "Arabisch":      ["signs", "zeichen", "profile", "natal_signs"],
    "Hellenistisch": ["signs", "zeichen", "profile", "natal_signs"],
    "Vedisch":     ["signs", "zeichen", "profile", "natal_signs"],
}


def inspect_value(val, depth=0, max_depth=2) -> str:
    """Zeigt die Struktur eines Wertes bis zu einer bestimmten Tiefe."""
    indent = "  " * depth
    if depth >= max_depth:
        if isinstance(val, dict):
            return f"{{...{len(val)} Schlüssel}}"
        elif isinstance(val, list):
            return f"[...{len(val)} Einträge]"
        else:
            return repr(val)[:60]
    
    if isinstance(val, dict):
        if not val:
            return "{}"
        lines = []
        for i, (k, v) in enumerate(val.items()):
            if i >= 8:  # max 8 Unterkeys zeigen
                lines.append(f"{indent}  ... (+{len(val)-8} weitere)")
                break
            lines.append(f"{indent}  '{k}': {inspect_value(v, depth+1, max_depth)}")
        return "{\n" + "\n".join(lines) + f"\n{indent}}}"
    elif isinstance(val, list):
        if not val:
            return "[]"
        sample = inspect_value(val[0], depth+1, max_depth)
        return f"[{len(val)} Einträge, erstes: {sample}]"
    elif isinstance(val, str):
        return f'"{val[:50]}"' if len(val) > 50 else f'"{val}"'
    else:
        return repr(val)


def check_engine_compatibility(folder: str, all_keys: set) -> list:
    """Prüft ob die erwarteten Schlüssel vorhanden sind."""
    expected = EXPECTED_KEYS.get(folder, [])
    found    = [k for k in expected if k in all_keys]
    missing  = [k for k in expected if k not in all_keys]
    return found, missing


def diagnose():
    print("=" * 70)
    print("REGELWERK-DIAGNOSE")
    print("=" * 70)
    
    all_results = {}

    for folder in SUBFOLDERS:
        folder_path = os.path.join(BASE_DIR, folder)
        print(f"\n{'━' * 70}")
        print(f"📂 ORDNER: {folder}/")
        print(f"{'━' * 70}")
        
        if not os.path.exists(folder_path):
            print(f"  ✗ Ordner nicht gefunden: {folder_path}")
            continue
        
        json_files = sorted(f for f in os.listdir(folder_path) if f.endswith(".json"))
        
        if not json_files:
            print(f"  ✗ Keine JSON-Dateien gefunden.")
            continue
        
        folder_all_keys = set()
        folder_results  = {}
        
        for filename in json_files:
            filepath = os.path.join(folder_path, filename)
            print(f"\n  📄 {filename}")
            
            try:
                with open(filepath, encoding="utf-8") as f:
                    data = json.load(f)
                
                toplevel_keys = list(data.keys())
                folder_all_keys.update(toplevel_keys)
                folder_results[filename] = toplevel_keys
                
                print(f"     Toplevel-Schlüssel ({len(toplevel_keys)}):")
                for key in toplevel_keys:
                    val = data[key]
                    type_info = ""
                    if isinstance(val, dict):
                        type_info = f"dict mit {len(val)} Einträgen"
                        # Zeige erste Unterkeys
                        subkeys = list(val.keys())[:5]
                        if subkeys:
                            type_info += f" → [{', '.join(subkeys)}"
                            if len(val) > 5:
                                type_info += f", +{len(val)-5} weitere"
                            type_info += "]"
                    elif isinstance(val, list):
                        type_info = f"list mit {len(val)} Einträgen"
                    elif isinstance(val, str):
                        type_info = f'string: "{val[:40]}"'
                    else:
                        type_info = repr(val)[:60]
                    
                    print(f"       • '{key}': {type_info}")
                
            except json.JSONDecodeError as e:
                print(f"     ✗ JSON-FEHLER: {e}")
            except Exception as e:
                print(f"     ✗ FEHLER: {e}")
        
        # Kompatibilitätsprüfung
        found, missing = check_engine_compatibility(folder, folder_all_keys)
        print(f"\n  🔍 Kompatibilität mit rule_engine.py:")
        if found:
            print(f"     ✓ Gefunden:  {', '.join(found)}")
        if missing:
            print(f"     ✗ Fehlend:   {', '.join(missing)}")
        if not found and not missing:
            print(f"     ℹ Keine spezifischen Erwartungen definiert.")
        
        all_results[folder] = folder_results
    
    # Zusammenfassung
    print(f"\n{'═' * 70}")
    print("ZUSAMMENFASSUNG")
    print(f"{'═' * 70}")
    print("\nFür jeden Ordner: welche Toplevel-Schlüssel sind in ALLEN Dateien zusammen vorhanden?\n")
    
    for folder in SUBFOLDERS:
        folder_path = os.path.join(BASE_DIR, folder)
        if not os.path.exists(folder_path):
            continue
        
        json_files = sorted(f for f in os.listdir(folder_path) if f.endswith(".json"))
        if not json_files:
            continue
        
        all_keys_in_folder = set()
        for filename in json_files:
            filepath = os.path.join(folder_path, filename)
            try:
                with open(filepath, encoding="utf-8") as f:
                    data = json.load(f)
                all_keys_in_folder.update(data.keys())
            except:
                pass
        
        found, missing = check_engine_compatibility(folder, all_keys_in_folder)
        status = "✓" if not missing else "⚠"
        print(f"  {status} {folder:<16} Schlüssel: {', '.join(sorted(all_keys_in_folder))}")
        if missing:
            print(f"    → engine erwartet noch: {', '.join(missing)}")
    
    print(f"\n{'═' * 70}")
    print("Tipp: Schlüsselnamen die 'fehlend' sind → in rule_engine.py anpassen")
    print(f"{'═' * 70}\n")


if __name__ == "__main__":
    diagnose()
