import assets.database
import random
import pygame
import ctypes


characters = assets.database.read()
feedbackHistory = []

def chooseRandom():
    name = random.choice(list(characters.keys()))
    
    return name, characters[name]
    

def check_guess(guess_name, answer_name):
    if guess_name not in characters:
        return f"'{guess_name}' finns inte i databasen!"

    guess = characters[guess_name]
    answer = characters[answer_name]

    feedback = {}

    for key in answer:
        if key == "image":  # hoppa över bilder
            continue

        if guess[key] == answer[key]: 
            # Grönt + visar vad spelaren gissade
            feedback[key] = f"\033[92mCorrect ({guess[key]})\033[0m"
        
        elif key == "firstAppearance" and guess[key] != answer[key]:
            if int(guess[key][-1]) < int(answer[key][-1]):
                feedback[key] = f"\033[91m\u2191 Wrong \u2191 ({guess[key]})\033[0m"
            else:
                feedback[key] = f"\033[91m\u2193 Wrong \u2193 ({guess[key]})\033[0m"
        
        elif key == "level" and guess[key] != answer[key]:
            if guess[key]=="Varies" or guess[key]=="N/A":
                feedback[key] = f"\033[91mWrong ({guess[key]})\033[0m"
            elif guess[key] != answer[key] and isinstance(answer[key], str):
                feedback[key] = f"\033[91mWrong ({guess[key]})\033[0m"
            elif guess[key] < answer[key]:
                feedback[key] = f"\033[91m\u2191 Wrong \u2191 ({guess[key]})\033[0m"
            else:
                feedback[key] = f"\033[91m\u2193 Wrong \u2193 ({guess[key]})\033[0m"
        
        elif key == "weight" and guess[key] != answer[key]:
            if int(''.join(filter(str.isdigit, guess[key]))) < int(''.join(filter(str.isdigit, answer[key]))):
                feedback[key] = f"\033[91m\u2191 Wrong \u2191 ({guess[key]})\033[0m"
            else:
                feedback[key] = f"\033[91m\u2193 Wrong \u2193 ({guess[key]})\033[0m"

        else:
            # Rött + visar vad spelaren gissade
            feedback[key] = f"\033[91mWrong ({guess[key]})\033[0m"
    feedbackHistory.append((guess_name, feedback))
    return feedback

def play():
    answer_name, answer_data = chooseRandom()

    print("Välkommen till BG3dle!")
    print("Gissa vilken karaktär det är (skriv namnet exakt som i databasen).")
    print("Skriv 'asd' för att avsluta.\n")

    attempts = 0

    while True:
        guess_name = input("Din gissning: ").strip()
        attempts += 1

        if guess_name.lower() == "asd":
            print(f"Du gav upp! Svaret var: {answer_name}")
            break

        feedback = check_guess(guess_name, answer_name)
        if isinstance(feedback, str):
            print(feedback)
            continue

        # Visa feedback
        print("\n--- Feedback ---")
        for k, v in feedback.items():
            print(f"{k}: {v}")
        print("----------------\n")

        # Om gissningen är korrekt, visa även attributen och avsluta
        if guess_name == answer_name:
            print(f"Korrekt! Du gissade {guess_name} på {attempts} försök.")
            print("Attribut för din gissning:")
            for key, value in characters[guess_name].items():
                if key != "image":
                    print(f"{key}: {value}")
            break
    print("\n--- Feedbackhistory ---")
    for f in feedbackHistory:
        print("Guess: " + f[0])
        for k, v in f[1].items():
            print(f"{k}: {v}")
        print("----------------")


def runPygame():
    # Initialize Pygame
    pygame.init()

    # Set up the game window
    img = pygame.image.load("assets/pics/Logo_BG3.png")
    pygame.display.set_icon(img)
    pygame.display.set_caption("BG3dle")
    screen = pygame.display.set_mode((400, 300))

    # Game loop
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
    # Quit Pygame
    pygame.quit()

def main():
    runPygame()
    #if __name__ == "__main__":
    #    play()

main()