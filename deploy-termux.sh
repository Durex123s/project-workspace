#!/data/data/com.termux/files/usr/bin/bash
set -e

# ============================================================
# PROJECT WORKSPACE — Script de déploiement Termux
# Clone (ou met à jour) le dépôt, installe les dépendances,
# build la PWA, synchronise Capacitor et compile l'APK debug.
# ============================================================

REPO_URL="https://github.com/Durex123s/project-workspace.git"   # <-- adapte à ton vrai dépôt
PROJECT_DIR="$HOME/project-workspace"

echo "== 1/7 Paquets système =="
pkg update -y && pkg upgrade -y
pkg install -y git nodejs-lts openjdk-17

echo "== 2/7 Clonage / mise à jour du dépôt =="
if [ -d "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR" && git pull
else
  git clone "$REPO_URL" "$PROJECT_DIR"
  cd "$PROJECT_DIR"
fi

echo "== 3/7 Variables d'environnement =="
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠️  Édite .env avec : nano .env"
  echo "    Renseigne VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY puis relance ce script."
  exit 0
fi

echo "== 4/7 Installation des dépendances npm =="
npm install

echo "== 5/7 Build de la PWA (Vite) =="
npm run build

echo "== 6/7 Capacitor : ajout/sync de la plateforme Android =="
if [ ! -d android ]; then
  npx cap add android
fi
npx cap sync android

echo "== 7/7 Compilation de l'APK debug =="
cd android
chmod +x gradlew
./gradlew assembleDebug

APK_PATH="$PROJECT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "✅ APK généré :"
echo "$APK_PATH"
echo ""
echo "Pour l'installer directement sur ce téléphone :"
echo "termux-open \"$APK_PATH\""
