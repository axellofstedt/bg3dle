import json
import os
import sys

def resource_path(relative_path):
    """ Returnerar absolut sökväg till resurser, fungerar för exe och script """
    try:
        # PyInstaller skapar en temporär folder och sätter _MEIPASS
        base_path = sys._MEIPASS
    except AttributeError:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

data_file = resource_path("assets/data.json")
def read():
    with open(data_file, "r", encoding="utf-8") as f:
        characters_list = json.load(f)
        
        characterDict = {c["name"]: {k: v for k, v in c.items() if k != "name"} for c in characters_list}

        return characterDict
