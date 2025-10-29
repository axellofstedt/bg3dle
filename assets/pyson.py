import json

with open("dataTest.json", "r", encoding="utf-8") as f:
    characters = json.load(f)

for char in characters:
    # Gör om mellanslag i namnet till _
    name_for_file = char["name"].replace(" ", "_")
    # Skapa filnamnet
    char["image"] = f"Portrait_{name_for_file}.png"

# 3️⃣ Spara tillbaka till JSON-filen
with open(("dataTest.json"), "w", encoding="utf-8") as f:
    json.dump(characters, f, ensure_ascii=False, indent=2)

print("✅ Alla karaktärer har nu fått 'image'-attribut!")