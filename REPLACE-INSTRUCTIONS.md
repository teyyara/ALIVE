# Replace the old ALIVE implementation

The connected GitHub integration blocked destructive branch/tree operations during this rebuild, so this package is the clean replacement project.

## Windows / PowerShell

1. Close the current Vite dev server.
2. Rename your existing local ALIVE folder to `ALIVE-old` as a backup.
3. Extract this package as the new `ALIVE` folder.
4. Open PowerShell in the new folder.
5. Run:

```powershell
npm install
npm run dev
```

6. Once the new build looks correct locally, connect the folder to the existing GitHub repository if needed and push the clean replacement:

```powershell
git init
git branch -M main
git remote add origin https://github.com/teyyara/ALIVE.git
git add -A
git commit -m "Rebuild ALIVE from first principles"
git push -u origin main --force-with-lease
```

Use the force-with-lease push only after confirming this is the repository you intend to replace.

## What is intentionally absent

The old WebGL portrait shader, old state/visitor controllers, decorative room layers, API routes, and prototype UI are not part of this package.

The new foundation is local-first and character-first.
