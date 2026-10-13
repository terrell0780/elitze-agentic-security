-- Align the legacy auth_tokens table with the current auth service and schema.
-- Preserve existing token semantics by deriving kind from the constrained purpose value.
ALTER TABLE auth_tokens
  ADD COLUMN IF NOT EXISTS kind varchar(40);

UPDATE auth_tokens
SET kind = purpose
WHERE kind IS NULL;

ALTER TABLE auth_tokens
  ALTER COLUMN kind SET NOT NULL;

CREATE INDEX IF NOT EXISTS auth_tokens_user_kind_idx
  ON auth_tokens(user_id, kind);
