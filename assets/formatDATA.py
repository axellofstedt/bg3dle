import json

# Read the original JSON file
with open('assets/data.json', 'r') as f:
    characters_array = json.load(f)

# Convert array to map format
characters_map = {}
for character in characters_array:
    name = character.pop('name')  # Remove 'name' and use it as key
    characters_map[name] = character

# Write the new map format to a new JSON file
with open('assets/data_as_map.json', 'w') as f:
    json.dump(characters_map, f, indent=2)

print(f"Converted {len(characters_array)} characters to map format")
print("Output saved to: assets/data_map.json")