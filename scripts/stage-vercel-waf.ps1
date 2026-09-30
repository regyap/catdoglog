$ErrorActionPreference = "Stop"

vercel firewall rules add "Log auth bursts" --condition '{"type":"path","op":"pre","value":"/api/auth"}' --action rate_limit --rate-limit-window 60 --rate-limit-requests 30 --rate-limit-keys ip --rate-limit-action log --yes
vercel firewall rules add "Log API bursts" --condition '{"type":"path","op":"pre","value":"/api"}' --action rate_limit --rate-limit-window 60 --rate-limit-requests 300 --rate-limit-keys ip --rate-limit-action log --yes
vercel firewall rules add "Log common exploit probes" --condition '{"type":"path","op":"inc","value":["/.env","/.git/config","/wp-admin","/phpmyadmin"]}' --action log --yes

vercel firewall diff
Write-Host "Rules are staged only. Review traffic and the diff before running: vercel firewall publish --yes"
