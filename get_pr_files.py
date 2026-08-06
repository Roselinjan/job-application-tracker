import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("GITHUB_TOKEN")

owner = "Roselinjan"
repo = "job-application-tracker"
pull_number = 1

url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/files"

headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json"
}

response = requests.get(url, headers=headers)

print("Status Code:", response.status_code)

if response.status_code == 200:
    files = response.json()

    print(f"\nTotal Files Changed: {len(files)}\n")

    for file in files:
        print("=" * 60)
        print("Filename :", file["filename"])
        print("Status   :", file["status"])
        print("Changes  :", file["changes"])
        print("\nPatch:\n")

        print(file.get("patch", "No patch available"))

        print("\n")
else:
    print(response.json())