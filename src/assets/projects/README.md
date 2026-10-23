# Project screenshots

Drop images into a folder named after the project's `id` in `src/data/portfolio.ts`, and
they show up in that project's "Server Info" window automatically (sorted by file name):

```
src/assets/projects/
  gitops-platform/   01-catalog.png, 02-fleet.png …
  stratospend/
  synthetic-data/
  inventory-app/
  aws-terraform/
  foodallergyai/
  smartmelon/
  clinchain/
  de-portfolio/
```

Formats: png, jpg, jpeg, webp, gif, avif. Keep each under ~300 KB (1600 px wide is plenty);
webp gives the smallest files. Prefix names with 01-, 02- … to control the order.
