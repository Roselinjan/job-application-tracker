import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("GITHUB_TOKEN")
url="https://api.github.com/user"
headers= {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json"
}

response = requests.get(url, headers=headers)
print("Status Code:", response.status_code)
print("Response JSON:", response.json())
