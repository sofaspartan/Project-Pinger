-- Create a simple ping function that returns a success message
CREATE OR REPLACE FUNCTION public.ping()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_object(
        'status', 'success',
        'message', 'Database is responsive',
        'timestamp', now()
    );
END;
$$; 