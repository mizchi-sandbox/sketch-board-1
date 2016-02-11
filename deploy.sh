cp develop/* production/
git add production
git commit -m "Update production"
git subtree push --prefix production origin gh-pages
