# Truffle strips permissions, so we need to reset them.
chmod +x scripts/build-crates.sh
chmod +x scripts/start-parity.sh
chmod +x core/client/build.sh

# Create and initialize the git repo (the .gitignore already exists).
git init
git add * .babelrc .gitignore
