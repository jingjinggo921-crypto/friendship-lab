from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker='<link rel="stylesheet" href="./responsive-desktop.css">'
if marker in s:
    print("Desktop stylesheet already connected")
    raise SystemExit(0)
if "</head>" not in s:
    raise SystemExit("Missing head element: refused to modify site")
s=s.replace("</head>", marker+"</head>", 1)
p.write_text(s,encoding="utf-8")
print("Connected responsive desktop stylesheet to index.html")
