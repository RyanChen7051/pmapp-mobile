#!/usr/bin/env python3
"""Push PWA files to GitHub via REST API (bypasses VPN issues).
Robust version: retries per request, chunked response read, never aborts
the whole run on a single file failure.
"""
import base64
import hashlib
import http.client
import json
import os
import subprocess
import time
import urllib.request
import urllib.error

REPO = "RyanChen7051/pmapp-mobile"
BRANCH = "main"
PWA_DIR = "/Users/chenbangjie/WorkBuddy/PMApp/pwa"
LOG_PATH = os.path.join(PWA_DIR, ".push_log.json")

FILES = {
    "index.html": f"{PWA_DIR}/index.html",
    "bundle.js": f"{PWA_DIR}/bundle.js",
    "sw.js": f"{PWA_DIR}/sw.js",
    "build.sh": f"{PWA_DIR}/build.sh",
    ".gitignore": f"{PWA_DIR}/.gitignore",
    "package.json": f"{PWA_DIR}/package.json",
    "deploy.sh": f"{PWA_DIR}/deploy.sh",
    "src/app.js": f"{PWA_DIR}/src/app.js",
    "src/charts.js": f"{PWA_DIR}/src/charts.js",
    "src/fieldlog.js": f"{PWA_DIR}/src/fieldlog.js",
    "src/cockpit.js": f"{PWA_DIR}/src/cockpit.js",
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
    "src/sync.js": f"{PWA_DIR}/src/sync.js",
    "src/ai.js": f"{PWA_DIR}/src/ai.js",
    "manifest.json": f"{PWA_DIR}/manifest.json",
    "icon-512.png": f"{PWA_DIR}/icon-512.png",
    "icon-192.png": f"{PWA_DIR}/icon-192.png",
    "apple-touch-icon.png": f"{PWA_DIR}/apple-touch-icon.png",
    "favicon-32.png": f"{PWA_DIR}/favicon-32.png",
}


def log_id(local_path):
    """Stable id of local file content (size + mtime)."""
    st = os.stat(local_path)
    return f"{st.st_size}:{int(st.st_mtime)}"


def load_log():
    if os.path.exists(LOG_PATH):
        try:
            with open(LOG_PATH) as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_log(log):
    with open(LOG_PATH, "w") as f:
        json.dump(log, f)


def get_github_token():
    """Get GitHub token from osxkeychain."""
    try:
        result = subprocess.run(
            ["git", "credential-osxkeychain", "get"],
            input=b"protocol=https\nhost=github.com\n\n",
            capture_output=True,
            timeout=10,
        )
        lines = result.stdout.decode().strip().split("\n")
        for line in lines:
            if line.startswith("password="):
                return line.split("=", 1)[1]
    except Exception as e:
        print(f"Keychain error: {e}")
    return None


def github_api(method, path, token, data=None, retries=6):
    """Make a GitHub API request with retry + robust chunked read."""
    url = f"https://api.github.com/repos/{REPO}/contents/{path}"
    last_err = None
    for attempt in range(retries):
        try:
            if data:
                body = json.dumps(data).encode()
                req = urllib.request.Request(url, data=body, method=method)
            else:
                req = urllib.request.Request(url, method=method)
            req.add_header("Authorization", f"token {token}")
            req.add_header("Accept", "application/vnd.github.v3+json")
            req.add_header("Content-Type", "application/json")
            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
            with opener.open(req, timeout=120) as resp:
                expected = resp.headers.get("Content-Length")
                raw = b""
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    raw += chunk
                if resp.status == 204:
                    return {}
                # Detect silent truncation: incomplete body
                if expected and len(raw) != int(expected):
                    raise http.client.IncompleteRead(len(raw), int(expected) - len(raw))
                if not raw:
                    raise ValueError("empty response body")
                return json.loads(raw)
        except (urllib.error.HTTPError, urllib.error.URLError,
                http.client.IncompleteRead, http.client.HTTPException,
                ConnectionError, TimeoutError, OSError, ValueError) as e:
            last_err = e
            wait = 2 * (attempt + 1)
            print(f"    retry {attempt+1}/{retries} ({type(e).__name__}) wait {wait}s")
            time.sleep(wait)
    try:
        err_msg = str(last_err) if last_err is not None else "unknown error"
    except Exception:
        err_msg = "unrepresentable error"
    print(f"    FINAL ERROR on {method} {path}: {err_msg}")
    return None


def push_file(token, repo_path, local_path, commit_msg, log):
    fid = log_id(local_path)
    # Skip if already pushed with identical local content
    if repo_path in log and log[repo_path] == fid:
        print(f"  SKIP (unchanged): {repo_path}")
        return True

    with open(local_path, "rb") as f:
        content = base64.b64encode(f.read()).decode()

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
        log[repo_path] = fid
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

    log = load_log()
    print(f"Pushing {len(FILES)} files to {REPO}...")
    success = 0
    failed = []
    for repo_path, local_path in FILES.items():
        if not os.path.exists(local_path):
            print(f"  SKIP (not found): {repo_path}")
            continue
        commit_msg = f"Update PWA - {repo_path}"
        if push_file(token, repo_path, local_path, commit_msg, log):
            success += 1
        else:
            failed.append(repo_path)
    save_log(log)

    print(f"\nDone: {success}/{len(FILES)} files pushed")
    if failed:
        print(f"FAILED ({len(failed)}): {failed}")
    else:
        print("All files pushed successfully.")
    print(f"URL: https://ryanchen7051.github.io/pmapp-mobile/")
    return 0 if not failed else 1


if __name__ == "__main__":
    exit(main())
