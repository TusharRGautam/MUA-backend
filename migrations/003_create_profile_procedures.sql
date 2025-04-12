-- Function to create a policy that allows inserting profiles
CREATE OR REPLACE FUNCTION create_profile_insert_policy()
RETURNS text AS $$
BEGIN
    -- Check if the policy already exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Allow all insertions'
    ) THEN
        RETURN 'Policy already exists';
    ELSE
        -- Create the policy
        EXECUTE 'CREATE POLICY "Allow all insertions" ON profiles FOR INSERT WITH CHECK (true)';
        RETURN 'Policy created successfully';
    END IF;
END;
$$ LANGUAGE plpgsql; 