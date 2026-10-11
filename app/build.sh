#!/bin/sh
# Genera index.html (instalable en el móvil) a partir de valmon.html
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<meta name="theme-color" content="#0b0a0c">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
  printf '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
  printf '<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="icon-1024.png">\n'
  printf '<style>:root{padding-top:env(safe-area-inset-top,0px)}body{margin:0}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
  cat valmon.html
  printf '\n</body>\n</html>\n'
} > index.html
