#!/usr/bin/env python3
"""Push PWA files to GitHub via REST API (bypasses VPN issues)."""
import base64
import json
import os
import subprocess
import urllib.request
import urllib.error

REPO = "RyanChen7051/pmapp-mobile"
BRANCH = "main"
PWA_DIR = "/Users/chenbangjie/WorkBuddy/PMApp/pwa"

# Files to push (path in repo -> local path)
FILES = {
    "index.html": f"{PWA_DIR}/index.html",
    "bundle.js": f"{PWA_DIR}/bundle.js",
    "sw.js": f"{PWA_DIR}/sw.js",
    "build.sh": f"{PWA_DIR}/build.sh",
    ".gitignore": f"{PWA_DIR}/.gitignore",
    "package.json": f"{PWA_DIR}/package.json",
    "deploy.sh": f"{PWA_DIR}/deploy.sh",
    "src/app.js": f"{PWA_DIR}/src/app.js",
    "src/auth.js": f"{PWA_DIR}/src/auth.js",
    "src/config.js": f"{PWA_DIR}/src/config.js",
    "src/data.js": f"{PWA_DIR}/src/data.js",
    "src/detail.js": f"{PWA_DIR}/src/detail.js",
    "src/edit.js": f"{PWA_DIR}/src/edit.js",
    "src/home.js": f"{PWA_DIR}/src/home.js",
    "src/navigation.js": f"{PWA_DIR}/src/navigation.js",
    "src/pages.js": f"{PWA_DIR}/src/pages.js",
    "src/reports.js": f"{PWA_DIR}/src/reports.js",
    "src/i18n.js": f"{PWA_DIR}/src/i18n.js",
    "src/translate.js": f"{PWA_DIR}/src/translate.js",
    "src/supabase-client.js": f"{PWA_DIR}/src/supabase-client.js",
    "manifest.json": f"{PWA_DIR}/manifest.json",
    "icon-512.png": f"{PWA_DIR}/icon-512.png",
    "icon-192.png": f"{PWA_DIR}/icon-192.png",
    "apple-touch-icon.png": f"{PWA_DIR}/apple-touch-icon.png",
    "favicon-32.png": f"{PWA_DIR}/favicon-32.png",
}

def get_github_token():
    """Get GitHub token from osxkeychain."""
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

def github_api(method, path, token, data=None):
    """Make a GitHub API request."""
    url = f"https://api.github.com/repos/{REPO}/contents/{path}"
    if data:
        body = json.dumps(data).encode()
        req = urllib.request.Request(url, data=body, method=method)
    else:
        req = urllib.request.Request(url, method=method)
    req.add_header("Authorization", f"token {token}")
    req.add_header("Accept", "application/vnd.github.v3+json")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return json.loads(resp.read()) if resp.status != 204 else {}
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        print(f"  API error {e.code}: {e.read().decode()[:200]}")
        return None

def push_file(token, repo_path, local_path, commit_msg):
    """Push a single file to GitHub."""
    with open(local_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()

    # Get current file SHA (if exists)
    existing = github_api("GET", repo_path, token)
    sha = existing.get("sha") if existing else None

    data = {
        "message": commit_msg,
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
    print("Getting GitHub token from osxkeychain...")
    token = get_github_token()
    if not token:
        print("ERROR: Could not get GitHub token")
        return 1

    print(f"Pushing {len(FILES)} files to {REPO}...")
    success = 0
    for repo_path, local_path in FILES.items():
        if not os.path.exists(local_path):
            print(f"  SKIP (not found): {repo_path}")
            continue
        commit_msg = f"PWA icon update (PMApp + 制造企业出海守护神) - {repo_path}"
        if push_file(token, repo_path, local_path, commit_msg):
            success += 1

    print(f"\nDone: {success}/{len(FILES)} files pushed")
    print(f"URL: https://ryanchen7051.github.io/pmapp-mobile/")
    return 0 if success == len(FILES) else 1

if __name__ == "__main__":
    exit(main())
