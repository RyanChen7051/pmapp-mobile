#!/usr/bin/env python3
"""Push core PWA files to GitHub via REST API with retry (bypasses VPN issues)."""
import base64
import json
import os
import subprocess
import time
import urllib.request
import urllib.error

REPO = "RyanChen7051/pmapp-mobile"
BRANCH = "main"
PWA_DIR = "/Users/chenbangjie/WorkBuddy/PMApp/pwa"

FILES = {
    "index.html": f"{PWA_DIR}/index.html",
    "bundle.js": f"{PWA_DIR}/bundle.js",
    "sw.js": f"{PWA_DIR}/sw.js",
}

COMMIT_MSG = "Update PWA user list (leader20-26 + admin display name)"


def get_github_token():
    try:
        result = subprocess.run(
            ["git", "credential-osxkeychain", "get"],
            input=b"protocol=https\nhost=github.com\n\n",
            capture_output=True,
            timeout=10
        )
        lines = result.stdout.decode().strip().split("\n")
        for line in lines:
            if line.startswith("password="):
                return line.split("=", 1)[1]
    except Exception as e:
        print(f"Keychain error: {e}")
    return None


def github_api(method, path, token, data=None, max_retries=3):
    url = f"https://api.github.com/repos/{REPO}/contents/{path}"
    if data:
        body = json.dumps(data).encode()
        req = urllib.request.Request(url, data=body, method=method)
    else:
        req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("Content-Type", "application/json")
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    for attempt in range(max_retries):
        try:
            with opener.open(req, timeout=120) as resp:
                return json.loads(resp.read()) if resp.status != 204 else {}
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            print(f"  API error {e.code}: {e.read().decode()[:200]}")
            return None
        except Exception as e:
            print(f"  Network error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                return None
    return None


def push_file(token, repo_path, local_path):
    with open(local_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()

    existing = github_api("GET", repo_path, token)
    sha = existing.get("sha") if existing else None

    data = {
        "message": COMMIT_MSG,
        "content": content,
        "branch": BRANCH,
    }
    if sha:
        data["sha"] = sha

    result = github_api("PUT", repo_path, token, data)
    if result and "content" in result:
        print(f"  OK: {repo_path}")
        return True
    else:
        print(f"  FAIL: {repo_path}")
        return False


def main():
    token = get_github_token()
    if not token:
        print("ERROR: Could not get GitHub token")
        return 1

    print(f"Pushing core files to {REPO}...")
    success = 0
    for repo_path, local_path in FILES.items():
        if not os.path.exists(local_path):
            print(f"  SKIP (not found): {repo_path}")
            continue
        if push_file(token, repo_path, local_path):
            success += 1
        time.sleep(0.5)

    print(f"\nDone: {success}/{len(FILES)} files pushed")
    print(f"URL: https://ryanchen7051.github.io/pmapp-mobile/")
    return 0 if success == len(FILES) else 1


if __name__ == "__main__":
    exit(main())
