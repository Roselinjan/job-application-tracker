import os
import requests
from dotenv import load_dotenv

load_dotenv()
token = os.getenv("GITHUB_TOKEN")

owner="Roselinjan"
repo="job-application-tracker"
pull_number=1

url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}"
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json"
}

response=requests.get(url, headers=headers)

if response.status_code == 200:
    pr_data = response.json()
    print("Pull Request Data:", pr_data)
    print("PR NUMBER:", pr_data.get("number"))
    print("PR TITLE:", pr_data.get("title"))
    print("PR DESCRIPTION:", pr_data.get("body"))

else:
    print("Error fetching pull request data:", response.json())