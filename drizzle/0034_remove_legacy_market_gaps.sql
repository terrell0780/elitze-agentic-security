-- Remove the unused legacy market-gap table from the security workspace.
-- The application has no active reader or writer for this table.
DROP TABLE IF EXISTS market_gaps;
