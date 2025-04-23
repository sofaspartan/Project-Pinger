-- Create a simple ping function that returns the current timestamp
CREATE OR REPLACE FUNCTION ping()
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will ensure real database activity
  RETURN now();
END;
$$; 