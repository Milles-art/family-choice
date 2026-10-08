# Local XAMPP database setup

The existing store was transferred from SQLite to XAMPP MariaDB on 8 October 2026. Laravel uses `family_choice` on `127.0.0.1:3306`, with the database-scoped `family_choice_app` account. Its generated password is stored only in the ignored backend `.env`.

All 25 source data tables were copied and checked using row counts and hashes of every source column. The 39 products retain their original prices, stock and identifiers. There were no customer accounts or orders in the source. The current seven migrations are applied, including payment tracking. No seeder was run against the store.

## Start locally

Start MySQL in XAMPP, then run Laravel from `backend` using `php artisan serve`. The current PHP CLI has `pdo_mysql` enabled. Apache is optional when using Laravel's development server. XAMPP reports MariaDB 10.4.32; this is local development, not a deployed production installation.

The runtime account can select, insert, update and delete store data. It cannot create or alter tables. Future migrations require a separate migration account with schema privileges, supplied temporarily through process environment variables. Do not replace the runtime credentials with root credentials or run `migrate:fresh` against this database. Do not seed an existing catalogue.

## Recovery

Update: the user subsequently requested permanent removal of the old catalogue. Catalogue removal exports were deleted, and old product rows were securely cleared from both SQLite copies. Those copies no longer recover the original catalogue. Back up the current MySQL store for future recovery.

The original SQLite file is retained. A consistent SQLite backup, original `.env`, and transfer verification record are also saved under:

`backend/storage/app/private/mysql-transition/20261008-022118-6bc600/`

This private directory is ignored by Git and must remain outside the public web root. It contains sensitive configuration and data; restrict access and include it in protected backups.

Before reverting, stop writes and back up MySQL. Restoring the saved `.env.sqlite.backup` to `backend/.env` and running `php artisan config:clear` restores the original connection. If MySQL has received new orders or other changes, reconcile those first: reverting to the old SQLite copy would omit them. Never delete either database during recovery.

## Verification and hosting

Backend MySQL tests use the separate `family_choice_verify_20261008` database and an ignored local PHPUnit configuration. RefreshDatabase must never target `family_choice`. The normal PHPUnit configuration continues to use SQLite in memory.

Verification passed: 33 tests and 205 assertions on MariaDB, and the same suite on SQLite. The live product API returned all 39 products; settings and direct `/shop` navigation returned HTTP 200. All 27 target tables use InnoDB and utf8mb4_unicode_ci. A two-connection check against an isolated fixture confirmed competing InnoDB row locks block correctly. This is not a full concurrent checkout load test or a production readiness certification.

Hosting still requires a supported production database/server, HTTPS, production environment settings, protected credentials, scheduled backups with restore checks, queue workers, scheduler, real mail transport, payment-provider verification and confirmed commercial data. See `SELCOM-SETUP.md` and the existing hosting notes. No deployment was performed during this transfer.
