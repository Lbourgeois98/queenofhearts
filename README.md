# Queen of Hearts Gameroom preview

Static preview for the Queen of Hearts Gameroom experience with a player-first flow. Players can self-serve game accounts and instant transfers; an admin view is available for staff-only oversight via direct URL.

## Quick preview
1. From this folder, start a simple web server (skip this if you view it on GitHub Pages):
   ```bash
   python -m http.server 8000
   ```
2. Open the pages in your browser:
   - Landing page: http://localhost:8000/
   - Player portal: http://localhost:8000/player.html
   - Admin portal (direct URL for staff): http://localhost:8000/admin.html
3. Use the **Reset demo** button on either portal to reload ready-to-test sample players, wallets, game usernames, and transfers if
   you clear storage or want a fresh start.

## Make it public (GitHub Pages)
You can publish the site straight from GitHub—no local server needed.

1. Push this repository to GitHub.
2. Push or merge to `main` (or `work`); the included workflow (`.github/workflows/deploy.yml`) will automatically build, configure, and deploy the site to GitHub Pages. No manual Pages toggles are needed.
3. After the action finishes, click the "View deployment" link in the Actions run or visit the URL shown in **Settings → Pages** to use the public site.
4. (Optional) In **Settings → Pages**, add a custom domain if you want a branded URL; GitHub will handle HTTPS automatically.

## Notes
- Data is stored in your browser's local storage only; refreshes will keep state on the same browser.
- Payment, game account creation, and credit transfers are mocked for preview purposes—no real payments or game APIs are called.
- For multi-device previews, host the server and visit using your LAN IP (e.g., http://192.168.x.x:8000).
