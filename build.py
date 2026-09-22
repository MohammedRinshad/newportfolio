#!/usr/bin/env python3
"""
Builds a static, self-contained site into ./docs for GitHub Pages.

Resolves <!--#include file="..." --> directives in .html files and copies
the plain static assets, so the site works without the SSI server.

Usage:
    python build.py
"""

import os
import re
import shutil

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, 'docs')

INCLUDE_RE = re.compile(r'<!--#include\s+file="([^"]+)"\s*-->')

# Top-level items to copy as-is (whole files or dirs) into docs/
STATIC = ['style.css', 'script.js', 'images', 'resume.pdf']


def resolve_includes(rel_path, content, seen=None):
    seen = seen or set()
    root = os.path.dirname(rel_path)

    def repl(match):
        inc_rel = match.group(1)
        inc_abs = os.path.normpath(os.path.join(BASE, root, inc_rel))
        inc_rel_from_base = os.path.relpath(inc_abs, BASE)
        real = os.path.realpath(inc_abs)
        if not real.startswith(os.path.realpath(BASE)):
            return f'<!-- Build error: path traversal blocked for "{inc_rel}" -->'
        if real in seen:
            return f'<!-- Build error: circular include "{inc_rel}" -->'
        if not os.path.isfile(real):
            return f'<!-- Build error: file not found: "{inc_rel}" -->'
        with open(real, encoding='utf-8') as f:
            sub = f.read()
        return resolve_includes(inc_rel_from_base, sub, seen | {real})

    return INCLUDE_RE.sub(repl, content)


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    index = os.path.join(BASE, 'index.html')
    with open(index, encoding='utf-8') as f:
        content = f.read()
    content = resolve_includes('index.html', content)
    with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Built {os.path.relpath(os.path.join(OUT, "index.html"), BASE)}')

    for item in STATIC:
        src = os.path.join(BASE, item)
        dst = os.path.join(OUT, item)
        if not os.path.exists(src):
            print(f'  skipping missing: {item}')
            continue
        if os.path.isdir(src):
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
        print(f'  copied {item}')


if __name__ == '__main__':
    main()