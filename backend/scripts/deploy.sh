# ============================================
# AgriCore — Deployment & Rollback Scripts
# ============================================

# -------------------------------------------
# Tag a stable release before deploying
# -------------------------------------------
# Usage: ./scripts/deploy.sh tag v1.2.0

tag_release() {
  VERSION=$1
  if [ -z "$VERSION" ]; then
    echo "Usage: tag_release <version>"
    exit 1
  fi

  git tag -a "$VERSION" -m "Release $VERSION"
  git push origin "$VERSION"
  echo "Tagged and pushed release: $VERSION"
}

# -------------------------------------------
# Deploy current branch
# -------------------------------------------
deploy() {
  echo "Running pre-deploy checks..."

  # 1. Ensure no uncommitted changes
  if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: Uncommitted changes detected. Commit or stash first."
    exit 1
  fi

  # 2. Run tests
  echo "Running tests..."
  npm test
  if [ $? -ne 0 ]; then
    echo "ERROR: Tests failed. Aborting deployment."
    exit 1
  fi

  # 3. Build
  echo "Building..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "ERROR: Build failed. Aborting deployment."
    exit 1
  fi

  echo "Pre-deploy checks passed. Ready to push."
  echo "Run: git push origin main"
}

# -------------------------------------------
# Rollback to a previous release
# -------------------------------------------
# Usage: ./scripts/deploy.sh rollback v1.1.0

rollback() {
  VERSION=$1
  if [ -z "$VERSION" ]; then
    echo "Usage: rollback <version>"
    echo "Available tags:"
    git tag --sort=-creatordate | head -10
    exit 1
  fi

  echo "Rolling back to $VERSION..."
  git checkout "$VERSION"
  npm install
  npm run build

  echo "Rolled back to $VERSION"
  echo "To make this permanent: git checkout -b hotfix/$VERSION"
}

# -------------------------------------------
# List recent releases
# -------------------------------------------
list_releases() {
  echo "Recent releases:"
  git tag --sort=-creatordate | head -20
}

# Dispatch
case "$1" in
  tag) tag_release "$2" ;;
  deploy) deploy ;;
  rollback) rollback "$2" ;;
  releases) list_releases ;;
  *)
    echo "AgriCore Deploy Script"
    echo "Usage:"
    echo "  deploy.sh tag <version>    - Tag a release"
    echo "  deploy.sh deploy           - Run pre-deploy checks"
    echo "  deploy.sh rollback <ver>   - Rollback to version"
    echo "  deploy.sh releases         - List recent releases"
    ;;
esac
