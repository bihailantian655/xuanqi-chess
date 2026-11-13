"""Prepare the single-file game for the native WebView shell.

The hosted PWA uses a manifest and a Service Worker; neither is needed inside a
Capacitor WebView, so strip those injections and copy the game into www/ for
`npx cap sync android`.
"""
import io
import os
import re
import shutil

os.makedirs("www/icons", exist_ok=True)
src = io.open("index.html", encoding="utf-8").read()
src = re.sub(r'<meta name="(?:theme-color|apple-mobile-web-app-[^"]+)"[^>]*>\s*', "", src)
src = re.sub(r'<link rel="(?:manifest|apple-touch-icon)"[^>]*>\s*', "", src)
src = re.sub(r"<script>\s*if \('serviceWorker' in navigator[\s\S]*?</script>\s*", "", src)
io.open("www/index.html", "w", encoding="utf-8").write(src)
for name in ("icon-192.png", "icon-512.png"):
    shutil.copyfile(os.path.join("icons", name), os.path.join("www/icons", name))
print("prepared www/index.html:", len(src), "chars; serviceWorker left:", "serviceWorker" in src)
