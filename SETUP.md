# Deployment Setup

All the code is done. These are the one-time system steps that need sudo.

---

## 1. Install the systemd service

```bash
sudo cp /home/eric/mile-training/server/mile-training.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mile-training
sudo systemctl start mile-training
sudo systemctl status mile-training
```

The app will now auto-start on boot. To check logs: `journalctl -u mile-training -f`

---

## 2. Claim your existing schedule data

After signing up, run this once to assign the pre-existing schedule to your account:

```bash
psql -U eric -d training_app -c "
  UPDATE training_schedules
  SET user_id = (SELECT id FROM users WHERE email = 'your@email.com')
  WHERE user_id IS NULL;
"
```

---

## 3. Firewall hardening

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw enable
sudo ufw status
```

This blocks all inbound traffic except SSH. The app is accessible only via Cloudflare Tunnel (outbound connection), so no port 3001 rule is needed.

---

## 4. Cloudflare Tunnel (makes the app publicly accessible)

### Install cloudflared
```bash
# Ubuntu/Debian
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared
```

### Authenticate and create the tunnel
```bash
cloudflared tunnel login          # opens browser, log in to Cloudflare
cloudflared tunnel create mile-training
cloudflared tunnel route dns mile-training training.ealdrich.com
```

### Create the tunnel config
```bash
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: mile-training
credentials-file: /home/eric/.cloudflared/<tunnel-uuid>.json

ingress:
  - hostname: training.ealdrich.com
    service: http://127.0.0.1:3001
  - service: http_status:404
EOF
```
Replace `<tunnel-uuid>` with the UUID printed by `cloudflared tunnel create`.

### Install as a system service (runs on boot)
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

---

## 5. (Optional) nginx for multiple sites

If you want to serve your personal site and other apps from this machine alongside the training app, install nginx and use the provided config:

```bash
sudo apt install nginx
sudo cp /home/eric/mile-training/nginx/training.ealdrich.com.conf /etc/nginx/sites-available/training.ealdrich.com
sudo ln -s /etc/nginx/sites-available/training.ealdrich.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Then point your Cloudflare Tunnel at `http://127.0.0.1:80` instead of `3001`, and add server blocks for each site.

---

## Updating the app

```bash
cd /home/eric/mile-training
# ... make code changes ...
npm run build                    # rebuild React
sudo systemctl restart mile-training
```

---

## Architecture summary

```
User browser (HTTPS)
  ↓
Cloudflare edge (DDoS protection, HTTPS termination)
  ↓ encrypted tunnel
cloudflared (on this machine)
  ↓
Express on 127.0.0.1:3001
  ├── / and /*    → serves React build from ../build/
  └── /api/*      → JWT-authenticated API routes
       ↓
PostgreSQL (training_app, unix socket)
```
