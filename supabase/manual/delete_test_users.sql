-- Removes the two fake users left by tests/spec_checks.sql (cascades to their rows). Run once in the SQL editor.
delete from auth.users where email like 'check-%@example.test';
