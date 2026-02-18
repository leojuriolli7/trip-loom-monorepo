# Database Seeding

This folder contains data sources and generation scripts to seed the database.

## Data Files (`data/`)

- `airports.json` - Airport data from [airport-data-js](https://github.com/aashishvanand/airport-data-js)
- `destinations.json` - 695 enriched destinations with Wikipedia data, images, and highlights
- `hotels.json` - 1,201 hotels with TripAdvisor data (ratings, amenities, styles)

## Seeding the Database

```bash
# From packages/api
pnpm db:seed            # Insert all data (skip existing)
pnpm db:seed --clean    # Clear and re-insert all data
pnpm db:seed --validate-only  # Validate data without inserting
```

## Regenerating Data

The `generators/` folder contains scripts to regenerate seed data from external sources.

### Destinations Pipeline

1. **Build master cities list** - Parses Wikipedia lists to get top travel destinations
   ```bash
   pnpm seed:build-cities
   ```

2. **Enrich destinations** - Fetches Wikipedia data, images, coordinates, and generates highlights
   ```bash
   PEXELS_API_KEY=xxx pnpm seed:enrich-destinations
   ```

### Hotels Pipeline

1. **Search hotels** - Search TripAdvisor for hotels in each destination (FREE)
   ```bash
   TRIPADVISOR_API_KEY=xxx pnpm seed:search-hotels
   ```

2. **Enrich hotels** - Fetch detailed info for top hotels (uses 5000/month free tier)
   ```bash
   TRIPADVISOR_API_KEY=xxx pnpm seed:enrich-hotels
   ```

3. **Transform hotels** - Convert raw TripAdvisor data to our schema
   ```bash
   pnpm seed:transform-hotels
   ```

### Pipeline Options

All scripts support:
- `--limit N` - Process only first N items
- `--offset N` - Skip first N items
- `--dry-run` - Preview without writing files

Progress is saved automatically and scripts are resumable.

## API Keys

- **PEXELS_API_KEY** - For destination images ([Pexels API](https://www.pexels.com/api/))
- **TRIPADVISOR_API_KEY** - For hotel data ([TripAdvisor API](https://tripadvisor-content-api.readme.io/))
